import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import authMiddleware from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Simular quitação de dívida
router.post('/simulate', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { debtType, debtId, monthlyPayment } = req.body;

        if (!debtType || !debtId || !monthlyPayment) {
            return res.status(400).json({ error: 'Tipo de dívida, ID e pagamento mensal são obrigatórios' });
        }

        let debt: any = null;
        let currentBalance = 0;
        let monthlyInterestRate = 0;
        let debtName = '';

        // Buscar dados da dívida
        if (debtType === 'thirdPartyLoan') {
            debt = await prisma.thirdPartyLoan.findFirst({
                where: { id: debtId, userId }
            });
            if (!debt) return res.status(404).json({ error: 'Empréstimo não encontrado' });
            currentBalance = debt.currentBalance || debt.amount;
            monthlyInterestRate = debt.interestRate || 0;
            debtName = `Empréstimo - ${debt.creditor}`;
        } else if (debtType === 'loan') {
            debt = await prisma.loan.findFirst({
                where: { id: debtId, userId }
            });
            if (!debt) return res.status(404).json({ error: 'Financiamento não encontrado' });
            currentBalance = debt.remainingAmount || debt.amount;
            monthlyInterestRate = debt.interestRate / 12 || 0;
            debtName = debt.description || 'Financiamento';
        } else if (debtType === 'cardDebt') {
            debt = await prisma.cardDebt.findFirst({
                where: { id: debtId, userId },
                include: { purchases: { where: { status: 'active' } } }
            });
            if (!debt) return res.status(404).json({ error: 'Dívida de cartão não encontrada' });
            currentBalance = debt.totalDebt || 0;
            monthlyInterestRate = 0; // Cartão não tem juros se pagar em dia
            debtName = `Cartão ${debt.cardholderName} (****${debt.lastFourDigits})`;
        }

        if (monthlyPayment <= 0) {
            return res.status(400).json({ error: 'Pagamento mensal deve ser maior que zero' });
        }

        // Simular pagamentos
        const simulation: any[] = [];
        let balance = currentBalance;
        let totalPaid = 0;
        let totalInterest = 0;
        let month = 0;
        const maxMonths = 360; // 30 anos máximo

        while (balance > 0 && month < maxMonths) {
            month++;

            // Calcular juros do mês
            const interestThisMonth = balance * (monthlyInterestRate / 100);
            balance += interestThisMonth;
            totalInterest += interestThisMonth;

            // Aplicar pagamento
            const payment = Math.min(monthlyPayment, balance);
            balance -= payment;
            totalPaid += payment;

            // Se juros > pagamento, dívida nunca será paga
            if (interestThisMonth >= monthlyPayment && month === 1) {
                return res.json({
                    success: false,
                    error: 'Pagamento insuficiente para cobrir juros mensais',
                    minimumPayment: Math.ceil(interestThisMonth * 1.1)
                });
            }

            simulation.push({
                month,
                payment,
                interest: interestThisMonth,
                principal: payment - interestThisMonth,
                remainingBalance: Math.max(0, balance)
            });
        }

        // Calcular cenários alternativos
        const scenarios = [];
        const paymentOptions = [monthlyPayment * 1.1, monthlyPayment * 1.25, monthlyPayment * 1.5, monthlyPayment * 2];

        for (const payment of paymentOptions) {
            let bal = currentBalance;
            let m = 0;
            let interest = 0;

            while (bal > 0 && m < maxMonths) {
                m++;
                const intr = bal * (monthlyInterestRate / 100);
                bal += intr;
                interest += intr;
                bal -= Math.min(payment, bal);
            }

            scenarios.push({
                monthlyPayment: payment,
                months: m,
                years: (m / 12).toFixed(1),
                totalPaid: currentBalance + interest,
                savings: totalPaid - (currentBalance + interest)
            });
        }

        res.json({
            success: true,
            debtInfo: {
                name: debtName,
                currentBalance,
                monthlyInterestRate
            },
            simulation: {
                monthlyPayment,
                totalMonths: month,
                totalYears: (month / 12).toFixed(1),
                totalPaid: Math.round(totalPaid * 100) / 100,
                totalInterest: Math.round(totalInterest * 100) / 100,
                payoffDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
                monthlyBreakdown: simulation.slice(0, 24) // Primeiros 24 meses
            },
            alternativeScenarios: scenarios,
            recommendation: month > 24
                ? `💡 Considere aumentar para R$ ${(monthlyPayment * 1.5).toFixed(2)}/mês para quitar em ${Math.ceil(month / 3)} meses!`
                : `✅ Excelente! Com R$ ${monthlyPayment}/mês você quita em ${month} meses.`
        });
    } catch (error: any) {
        console.error('Simulation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar todas as dívidas para simulação
router.get('/debts', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const [thirdPartyLoans, loans, cardDebts] = await Promise.all([
            prisma.thirdPartyLoan.findMany({
                where: { userId, status: 'active' }
            }),
            prisma.loan.findMany({
                where: { userId, status: { not: 'paid' } }
            }),
            prisma.cardDebt.findMany({
                where: { userId },
                include: { purchases: { where: { status: 'active' } } }
            })
        ]);

        const debts = [
            ...thirdPartyLoans.map(l => ({
                id: l.id,
                type: 'thirdPartyLoan',
                name: `Empréstimo - ${l.creditor}`,
                balance: l.currentBalance || l.amount,
                interestRate: l.interestRate,
                icon: '🤝'
            })),
            ...loans.map(l => ({
                id: l.id,
                type: 'loan',
                name: l.description || 'Financiamento',
                balance: l.remainingAmount || l.amount,
                interestRate: l.interestRate / 12,
                icon: '🏦'
            })),
            ...cardDebts.filter(c => c.totalDebt > 0).map(c => ({
                id: c.id,
                type: 'cardDebt',
                name: `Cartão ${c.cardholderName} (****${c.lastFourDigits})`,
                balance: c.totalDebt,
                interestRate: 0,
                icon: '💳'
            }))
        ];

        res.json(debts);
    } catch (error: any) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
