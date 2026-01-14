import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar empréstimos
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const loans = await prisma.loan.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' }
        });

        const loansWithDetails = loans.map(l => {
            const totalMonths = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000));
            const paidMonths = Math.ceil((new Date().getTime() - new Date(l.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000));
            return {
                ...l,
                totalMonths,
                paidMonths: Math.max(0, Math.min(paidMonths, totalMonths)),
                progress: ((l.principalAmount - l.remainingAmount) / l.principalAmount) * 100
            };
        });

        res.json(loansWithDetails);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar empréstimos' });
    }
});

// Simular empréstimo
router.post('/simulate', async (req: Request, res: Response) => {
    try {
        const { principalAmount, interestRate, months } = req.body;
        const principal = parseFloat(principalAmount);
        const rate = parseFloat(interestRate) / 100 / 12;
        const n = parseInt(months);

        // Cálculo Price
        const monthlyPayment = principal * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
        const totalPayment = monthlyPayment * n;
        const totalInterest = totalPayment - principal;

        // Tabela de amortização
        let balance = principal;
        const schedule = [];
        for (let i = 1; i <= n; i++) {
            const interest = balance * rate;
            const principal_payment = monthlyPayment - interest;
            balance -= principal_payment;
            schedule.push({
                month: i,
                payment: monthlyPayment,
                principal: principal_payment,
                interest,
                balance: Math.max(0, balance)
            });
        }

        res.json({ monthlyPayment, totalPayment, totalInterest, schedule: schedule.slice(0, 12) });
    } catch (error) {
        res.status(500).json({ error: 'Erro na simulação' });
    }
});

// Criar empréstimo
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, principalAmount, interestRate, monthlyPayment, startDate, endDate } = req.body;

        if (!name || !principalAmount) {
            return res.status(400).json({ error: 'Nome e valor são obrigatórios' });
        }

        const loan = await prisma.loan.create({
            data: {
                userId,
                name,
                principalAmount: parseFloat(principalAmount),
                interestRate: parseFloat(interestRate) || 0,
                remainingAmount: parseFloat(principalAmount),
                monthlyPayment: parseFloat(monthlyPayment) || 0,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: 'active'
            }
        });

        res.status(201).json(loan);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar empréstimo' });
    }
});

// Registrar pagamento
router.post('/:id/pay', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { amount } = req.body;

        const loan = await prisma.loan.findFirst({ where: { id, userId } });
        if (!loan) return res.status(404).json({ error: 'Empréstimo não encontrado' });

        const newRemaining = Math.max(0, loan.remainingAmount - parseFloat(amount));
        const isPaid = newRemaining === 0;

        const updated = await prisma.loan.update({
            where: { id },
            data: {
                remainingAmount: newRemaining,
                status: isPaid ? 'paid' : 'active'
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }
});

// Excluir empréstimo
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.loan.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Empréstimo não encontrado' });

        await prisma.loan.delete({ where: { id } });
        res.json({ message: 'Empréstimo excluído' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir empréstimo' });
    }
});

export { router as loanRouter };
