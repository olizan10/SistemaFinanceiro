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
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        // Buscar dados do usuário em paralelo
        const [
            accounts,
            creditCards,
            loans,
            transactions,
            goals,
            fixedExpenses,
            variableExpenses,
            thirdPartyLoans,
            cardDebts
        ] = await Promise.all([
            prisma.account.findMany({ where: { userId } }),
            prisma.creditCard.findMany({ where: { userId } }),
            prisma.loan.findMany({ where: { userId } }),
            prisma.transaction.findMany({
                where: {
                    userId,
                    date: { gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) }
                },
                orderBy: { date: 'desc' }
            }),
            prisma.goal.findMany({ where: { userId } }),
            prisma.fixedExpense.findMany({ where: { userId, isActive: true } }),
            prisma.variableExpense.findMany({
                where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }
            }),
            prisma.thirdPartyLoan.findMany({ where: { userId, status: 'active' } }),
            prisma.cardDebt.findMany({
                where: { userId },
                include: { purchases: { where: { status: 'active' } } }
            })
        ]);

        // Calcular média de gastos variáveis (últimos 3 meses)
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
        const allVariableExpenses = await prisma.variableExpense.findMany({
            where: { userId, date: { gte: threeMonthsAgo } }
        });

        const monthsWithData = new Set(allVariableExpenses.map(e =>
            `${e.date.getFullYear()}-${e.date.getMonth()}`
        ));
        const totalVariableExpenses = allVariableExpenses.reduce((s, e) => s + e.amount, 0);
        const variableExpenseAverage = monthsWithData.size > 0
            ? totalVariableExpenses / monthsWithData.size
            : 0;

        // Calcular métricas
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalCreditUsed = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
        const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);

        // Despesas fixas do mês
        const fixedExpensesTotal = fixedExpenses.reduce((s, e) => s + e.amount, 0);

        // Parcelas de cartão do mês
        const cardInstallmentsThisMonth = cardDebts.reduce((total, card) => {
            return total + card.purchases.reduce((s, p) => s + p.installmentAmount, 0);
        }, 0);

        // Parcelas de empréstimos do mês
        const loanInstallmentsThisMonth = loans.reduce((s, l) => s + (l.monthlyPayment || 0), 0);
        const thirdPartyInstallments = thirdPartyLoans.reduce((s, l) => s + (l.monthlyPayment || 0), 0);

        // Renda mensal (estimada pela última receita)
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const monthlyIncome = incomeTransactions.length > 0
            ? incomeTransactions.slice(0, 3).reduce((s, t) => s + t.amount, 0) / Math.min(incomeTransactions.length, 3)
            : 0;

        // Cálculo do saldo disponível para gastos não essenciais
        const totalObrigations = fixedExpensesTotal + cardInstallmentsThisMonth + loanInstallmentsThisMonth + thirdPartyInstallments;
        const estimatedVariableExpenses = variableExpenseAverage;
        const safeToSpend = monthlyIncome - totalObrigations - estimatedVariableExpenses;

        // Status de quanto pode gastar
        let spendingAdvice = '';
        let spendingStatus = 'safe';
        if (safeToSpend < 0) {
            spendingAdvice = '⚠️ Atenção! Suas obrigações superam sua renda. Evite gastos extras.';
            spendingStatus = 'danger';
        } else if (safeToSpend < monthlyIncome * 0.1) {
            spendingAdvice = '🟡 Margem apertada. Gaste com cautela.';
            spendingStatus = 'warning';
        } else if (safeToSpend < monthlyIncome * 0.2) {
            spendingAdvice = '🟢 Você pode fazer pequenos gastos com cuidado.';
            spendingStatus = 'moderate';
        } else {
            spendingAdvice = '💚 Boa margem! Você pode se permitir alguns extras.';
            spendingStatus = 'safe';
        }

        // Análise de saúde financeira
        const financialHealth = await AIService.analyzeFinancialHealth(userId);

        // Transações recentes
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        res.json({
            summary: {
                totalBalance,
                totalCreditUsed,
                totalCreditLimit,
                totalDebt: loans.reduce((s, l) => s + l.remainingAmount, 0) + totalCreditUsed,
                income,
                expenses,
                balance: income - expenses
            },
            // NOVO: Informações de saldo disponível
            availableToSpend: {
                monthlyIncome,
                fixedExpenses: fixedExpensesTotal,
                cardInstallments: cardInstallmentsThisMonth,
                loanInstallments: loanInstallmentsThisMonth + thirdPartyInstallments,
                variableExpenseAverage: Math.round(variableExpenseAverage * 100) / 100,
                variableExpenseThisMonth: variableExpenses.reduce((s, e) => s + e.amount, 0),
                totalObligations: totalObrigations,
                safeToSpend: Math.round(safeToSpend * 100) / 100,
                spendingStatus,
                spendingAdvice
            },
            financialHealth,
            accounts,
            creditCards,
            loans,
            recentTransactions: transactions.slice(0, 10),
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
