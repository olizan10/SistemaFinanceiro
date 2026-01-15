import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// ============================================
// RELATÓRIO DE TAXAS E JUROS
// ============================================

// Resumo de taxas pagas
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { year } = req.query;

        const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
        const startDate = new Date(targetYear, 0, 1);
        const endDate = new Date(targetYear, 11, 31);

        // Buscar taxas de cartão
        const cardPayments = await prisma.cardPayment.findMany({
            where: {
                cardPurchase: { cardDebt: { userId } },
                paymentDate: { gte: startDate, lte: endDate }
            },
            include: {
                cardPurchase: {
                    select: {
                        description: true,
                        cardFeePercent: true,
                        totalAmount: true,
                        cardDebt: { select: { lastFourDigits: true } }
                    }
                }
            }
        });

        // Buscar juros de terceiros
        const thirdPartyPayments = await prisma.thirdPartyPayment.findMany({
            where: {
                thirdPartyLoan: { userId },
                paymentDate: { gte: startDate, lte: endDate }
            },
            include: {
                thirdPartyLoan: { select: { creditorName: true, monthlyInterest: true } }
            }
        });

        // Calcular totais
        let totalCardFees = 0;
        let totalThirdPartyInterest = 0;
        const cardFeesByMonth: { [key: number]: number } = {};
        const interestByMonth: { [key: number]: number } = {};
        const feesByCard: { [key: string]: number } = {};
        const interestByCreditor: { [key: string]: number } = {};

        // Inicializar meses
        for (let i = 0; i < 12; i++) {
            cardFeesByMonth[i] = 0;
            interestByMonth[i] = 0;
        }

        cardPayments.forEach(p => {
            totalCardFees += p.feePaid || 0;
            const month = new Date(p.paymentDate).getMonth();
            cardFeesByMonth[month] += p.feePaid || 0;

            const cardKey = `**** ${p.cardPurchase.cardDebt.lastFourDigits}`;
            feesByCard[cardKey] = (feesByCard[cardKey] || 0) + (p.feePaid || 0);
        });

        thirdPartyPayments.forEach(p => {
            // Estimar juros como a diferença entre o pagamento e o principal esperado
            const estimatedInterest = p.amount * (p.thirdPartyLoan.monthlyInterest / 100);
            totalThirdPartyInterest += estimatedInterest;
            const month = new Date(p.paymentDate).getMonth();
            interestByMonth[month] += estimatedInterest;

            interestByCreditor[p.thirdPartyLoan.creditorName] =
                (interestByCreditor[p.thirdPartyLoan.creditorName] || 0) + estimatedInterest;
        });

        // Calcular juros acumulados futuros
        const activeLoans = await prisma.thirdPartyLoan.findMany({
            where: { userId, status: 'active' }
        });

        let projectedAnnualInterest = 0;
        activeLoans.forEach(loan => {
            projectedAnnualInterest += loan.currentBalance * (loan.monthlyInterest / 100) * 12;
        });

        res.json({
            year: targetYear,
            summary: {
                totalCardFees,
                totalThirdPartyInterest,
                totalFees: totalCardFees + totalThirdPartyInterest,
                projectedAnnualInterest,
                potentialSavings: projectedAnnualInterest * 0.5 // Se pagasse mais rápido
            },
            byMonth: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                cardFees: Object.values(cardFeesByMonth),
                thirdPartyInterest: Object.values(interestByMonth)
            },
            byCard: feesByCard,
            byCreditor: interestByCreditor
        });
    } catch (error: any) {
        console.error('Error fetching fees summary:', error);
        res.status(500).json({ error: 'Erro ao buscar resumo de taxas' });
    }
});

// Detalhes de taxas por cartão
router.get('/cards', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const cardDebts = await prisma.cardDebt.findMany({
            where: { userId },
            include: {
                purchases: {
                    where: { status: 'active' }
                }
            }
        });

        const cardsWithFees = cardDebts.map(card => {
            let totalFees = 0;
            let totalDebt = 0;

            card.purchases.forEach(p => {
                const fee = p.totalAmount * (p.cardFeePercent / 100);
                totalFees += fee;
                totalDebt += (p.installments - p.paidInstallments) * p.installmentAmount;
            });

            return {
                id: card.id,
                name: `**** ${card.lastFourDigits}`,
                cardholder: card.cardholderName,
                totalDebt,
                totalFees,
                feePercentage: totalDebt > 0 ? (totalFees / totalDebt * 100).toFixed(2) : 0,
                purchasesCount: card.purchases.length
            };
        });

        res.json(cardsWithFees.sort((a, b) => b.totalFees - a.totalFees));
    } catch (error: any) {
        console.error('Error fetching card fees:', error);
        res.status(500).json({ error: 'Erro ao buscar taxas de cartão' });
    }
});

// Detalhes de juros por credor
router.get('/creditors', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const loans = await prisma.thirdPartyLoan.findMany({
            where: { userId },
            include: {
                payments: true,
                familyMember: { select: { name: true, lastName: true } }
            }
        });

        const creditorsWithInterest = loans.map(loan => {
            const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
            const principalPaid = Math.min(totalPaid, loan.principalAmount);
            const interestPaid = totalPaid - principalPaid;
            const projectedTotalInterest = loan.currentBalance * (loan.monthlyInterest / 100) * 12;

            return {
                id: loan.id,
                creditor: loan.creditorName,
                principal: loan.principalAmount,
                currentBalance: loan.currentBalance,
                interestRate: loan.monthlyInterest,
                totalPaid,
                interestPaid,
                projectedAnnualInterest: projectedTotalInterest,
                status: loan.status,
                who: loan.familyMember ? `${loan.familyMember.name} ${loan.familyMember.lastName}` : 'Principal'
            };
        });

        res.json(creditorsWithInterest.sort((a, b) => b.projectedAnnualInterest - a.projectedAnnualInterest));
    } catch (error: any) {
        console.error('Error fetching creditor interest:', error);
        res.status(500).json({ error: 'Erro ao buscar juros por credor' });
    }
});

export { router as feesRouter };
