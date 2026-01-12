import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import AIService from '../services/ai.service';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/dashboard
 * Retorna dados do dashboard
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Buscar dados do usuário
        const [accounts, creditCards, loans, transactions, goals] = await Promise.all([
            prisma.account.findMany({ where: { userId } }),
            prisma.creditCard.findMany({ where: { userId } }),
            prisma.loan.findMany({ where: { userId } }),
            prisma.transaction.findMany({
                where: {
                    userId,
                    date: {
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 3))
                    }
                },
                orderBy: { date: 'desc' }
            }),
            prisma.goal.findMany({ where: { userId } })
        ]);

        // Calcular métricas
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalCreditUsed = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
        const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
        const totalDebt = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0) + totalCreditUsed;

        // Análise de saúde financeira
        const financialHealth = await AIService.analyzeFinancialHealth(userId);

        // Transações recentes por tipo
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Agrupar despesas por categoria
        const expensesByCategory = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        res.json({
            summary: {
                totalBalance,
                totalCreditUsed,
                totalCreditLimit,
                totalDebt,
                income,
                expenses,
                balance: income - expenses
            },
            financialHealth,
            accounts,
            creditCards,
            loans,
            recentTransactions: transactions.slice(0, 10),
            expensesByCategory,
            goals: goals.map(goal => ({
                ...goal,
                progress: (goal.currentAmount / goal.targetAmount) * 100
            }))
        });
    } catch (error: any) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

export { router as dashboardRouter };
