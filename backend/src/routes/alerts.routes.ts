import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// ============================================
// ALERTAS E CONTAS A PAGAR
// ============================================

// Obter todas as contas a pagar do mês
router.get('/bills', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { month, year } = req.query;

        const currentDate = new Date();
        const targetMonth = month ? parseInt(month as string) - 1 : currentDate.getMonth();
        const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

        // Buscar todas as dívidas com vencimento
        const [cardDebts, thirdPartyLoans, fixedExpenses] = await Promise.all([
            // Dívidas de cartão (pelo dia de vencimento)
            prisma.cardDebt.findMany({
                where: { userId },
                include: {
                    purchases: {
                        where: { status: 'active' }
                    }
                }
            }),
            // Empréstimos com terceiros (próximo pagamento)
            prisma.thirdPartyLoan.findMany({
                where: { userId, status: 'active' }
            }),
            // Contas fixas (pelo dia de vencimento)
            prisma.fixedExpense.findMany({
                where: { userId, isActive: true }
            })
        ]);

        // Gerar lista de contas a pagar
        const bills: any[] = [];

        // Faturas de cartão
        cardDebts.forEach(card => {
            if (card.purchases.length > 0) {
                const totalDue = card.purchases.reduce((sum, p) => {
                    return sum + p.installmentAmount;
                }, 0);

                const dueDate = new Date(targetYear, targetMonth, card.dueDay);

                bills.push({
                    id: card.id,
                    type: 'card',
                    name: `Fatura **** ${card.lastFourDigits}`,
                    description: `${card.purchases.length} parcelas`,
                    amount: totalDue,
                    dueDate,
                    dueDay: card.dueDay,
                    isPaid: false, // TODO: verificar se já foi pago
                    priority: totalDue > 1000 ? 'high' : 'medium',
                    icon: '💳'
                });
            }
        });

        // Empréstimos com terceiros
        thirdPartyLoans.forEach(loan => {
            // Calcular valor com juros
            const monthlyPayment = loan.currentBalance * (loan.monthlyInterest / 100);
            const dueDate = loan.nextPaymentDate || new Date(targetYear, targetMonth, 15);

            bills.push({
                id: loan.id,
                type: 'third_party',
                name: loan.creditorName,
                description: `Juros: ${loan.monthlyInterest}%/mês`,
                amount: monthlyPayment,
                totalDebt: loan.currentBalance,
                dueDate,
                isPaid: false,
                priority: 'high', // Terceiros sempre alta prioridade
                icon: '🤝'
            });
        });

        // Contas fixas
        fixedExpenses.forEach(expense => {
            const dueDate = new Date(targetYear, targetMonth, expense.dueDay);
            const today = new Date();

            // Verificar se já foi paga este mês
            const isPaidThisMonth = expense.lastPaidDate
                ? expense.lastPaidDate.getMonth() === targetMonth && expense.lastPaidDate.getFullYear() === targetYear
                : false;

            bills.push({
                id: expense.id,
                type: 'fixed',
                name: expense.name,
                description: expense.category,
                amount: expense.amount,
                dueDate,
                dueDay: expense.dueDay,
                isPaid: isPaidThisMonth,
                priority: dueDate < today && !isPaidThisMonth ? 'urgent' : 'low',
                icon: expense.category === 'utility' ? '💡' : expense.category === 'subscription' ? '📺' : '📋'
            });
        });

        // Ordenar por data de vencimento
        bills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        // Separar por status
        const today = new Date();
        const overdue = bills.filter(b => !b.isPaid && new Date(b.dueDate) < today);
        const upcoming = bills.filter(b => !b.isPaid && new Date(b.dueDate) >= today);
        const paid = bills.filter(b => b.isPaid);

        const totalDue = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
        const totalOverdue = overdue.reduce((sum, b) => sum + b.amount, 0);

        res.json({
            month: targetMonth + 1,
            year: targetYear,
            summary: {
                totalBills: bills.length,
                totalDue,
                totalOverdue,
                overdueCount: overdue.length,
                upcomingCount: upcoming.length,
                paidCount: paid.length
            },
            overdue,
            upcoming,
            paid,
            all: bills
        });
    } catch (error: any) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ error: 'Erro ao buscar contas' });
    }
});

// Alertas ativos (vencimentos próximos)
router.get('/active', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const today = new Date();
        const in7Days = new Date();
        in7Days.setDate(today.getDate() + 7);

        const alerts: any[] = [];

        // Verificar faturas de cartão
        const cardDebts = await prisma.cardDebt.findMany({
            where: { userId },
            include: { purchases: { where: { status: 'active' } } }
        });

        cardDebts.forEach(card => {
            if (card.purchases.length > 0) {
                const dueDate = new Date();
                dueDate.setDate(card.dueDay);
                if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);

                const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntil <= 7) {
                    const total = card.purchases.reduce((sum, p) => sum + p.installmentAmount, 0);
                    alerts.push({
                        id: card.id,
                        type: 'card_due',
                        severity: daysUntil <= 2 ? 'critical' : daysUntil <= 5 ? 'warning' : 'info',
                        title: `Fatura **** ${card.lastFourDigits}`,
                        message: `Vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''} - R$ ${total.toFixed(2)}`,
                        amount: total,
                        dueDate,
                        daysUntil,
                        icon: '💳'
                    });
                }
            }
        });

        // Verificar contas fixas
        const fixedExpenses = await prisma.fixedExpense.findMany({
            where: { userId, isActive: true }
        });

        fixedExpenses.forEach(expense => {
            const dueDate = new Date();
            dueDate.setDate(expense.dueDay);
            if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);

            const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Verificar se já foi paga
            const isPaidThisMonth = expense.lastPaidDate
                ? expense.lastPaidDate.getMonth() === today.getMonth()
                : false;

            if (daysUntil <= 7 && !isPaidThisMonth) {
                alerts.push({
                    id: expense.id,
                    type: 'fixed_expense_due',
                    severity: daysUntil <= 2 ? 'critical' : daysUntil <= 5 ? 'warning' : 'info',
                    title: expense.name,
                    message: `Vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''} - R$ ${expense.amount.toFixed(2)}`,
                    amount: expense.amount,
                    dueDate,
                    daysUntil,
                    icon: '💡'
                });
            }
        });

        // Verificar empréstimos com terceiros (sempre alertar)
        const thirdPartyLoans = await prisma.thirdPartyLoan.findMany({
            where: { userId, status: 'active' }
        });

        thirdPartyLoans.forEach(loan => {
            const monthlyInterest = loan.currentBalance * (loan.monthlyInterest / 100);
            alerts.push({
                id: loan.id,
                type: 'third_party_interest',
                severity: 'warning',
                title: `Juros: ${loan.creditorName}`,
                message: `R$ ${monthlyInterest.toFixed(2)} de juros este mês (${loan.monthlyInterest}%)`,
                amount: monthlyInterest,
                totalDebt: loan.currentBalance,
                icon: '🤝'
            });
        });

        // Ordenar por severidade
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);

        res.json({
            count: alerts.length,
            criticalCount: alerts.filter(a => a.severity === 'critical').length,
            warningCount: alerts.filter(a => a.severity === 'warning').length,
            alerts
        });
    } catch (error: any) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Erro ao buscar alertas' });
    }
});

// Marcar conta fixa como paga
router.post('/fixed-expense/:id/pay', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { amount, notes } = req.body;

        const expense = await prisma.fixedExpense.findFirst({
            where: { id, userId }
        });

        if (!expense) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        // Registrar pagamento
        await prisma.fixedExpensePayment.create({
            data: {
                fixedExpenseId: id,
                amount: amount || expense.amount,
                paymentDate: new Date(),
                notes: notes || null
            }
        });

        // Atualizar última data de pagamento
        await prisma.fixedExpense.update({
            where: { id },
            data: { lastPaidDate: new Date() }
        });

        res.json({ message: 'Pagamento registrado!', paidAt: new Date() });
    } catch (error: any) {
        console.error('Error paying expense:', error);
        res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }
});

export { router as alertsRouter };
