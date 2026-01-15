import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import authMiddleware from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Gerar relatório mensal
router.get('/monthly/:year/:month', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { year, month } = req.params;

        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

        // Buscar todos os dados do mês
        const [transactions, variableExpenses, fixedExpenses, cardDebts] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } }
            }),
            prisma.variableExpense.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } },
                include: { category: true }
            }),
            prisma.fixedExpense.findMany({ where: { userId, isActive: true } }),
            prisma.cardDebt.findMany({
                where: { userId },
                include: { purchases: { where: { status: 'active' } } }
            })
        ]);

        // Cálculos
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const variableTotal = variableExpenses.reduce((s, e) => s + e.amount, 0);
        const fixedTotal = fixedExpenses.reduce((s, e) => s + e.amount, 0);
        const cardInstallments = cardDebts.reduce((t, c) =>
            t + c.purchases.reduce((s, p: any) => s + (p.installmentAmount || 0), 0), 0
        );

        // Agrupar por categoria
        const byCategory: Record<string, number> = {};
        variableExpenses.forEach(e => {
            const cat = e.category?.name || 'Outros';
            byCategory[cat] = (byCategory[cat] || 0) + e.amount;
        });

        // Agrupar por forma de pagamento
        const byPaymentType: Record<string, number> = {};
        variableExpenses.forEach(e => {
            byPaymentType[e.paymentType] = (byPaymentType[e.paymentType] || 0) + e.amount;
        });

        res.json({
            period: { year, month, label: `${month}/${year}` },
            summary: {
                income,
                totalExpenses: expenses + variableTotal,
                fixedExpenses: fixedTotal,
                variableExpenses: variableTotal,
                cardInstallments,
                balance: income - expenses - variableTotal,
                savingsRate: income > 0 ? ((income - expenses - variableTotal) / income * 100).toFixed(1) : 0
            },
            byCategory,
            byPaymentType,
            details: {
                transactions: transactions.length,
                variableExpenses: variableExpenses.length,
                topExpenses: variableExpenses.sort((a, b) => b.amount - a.amount).slice(0, 5)
            }
        });
    } catch (error: any) {
        console.error('Report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Relatório anual
router.get('/yearly/:year', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { year } = req.params;

        const startDate = new Date(Number(year), 0, 1);
        const endDate = new Date(Number(year), 11, 31, 23, 59, 59);

        const [transactions, variableExpenses] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } }
            }),
            prisma.variableExpense.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } },
                include: { category: true }
            })
        ]);

        // Agrupar por mês
        const byMonth: Record<string, { income: number; expenses: number; variable: number }> = {};
        for (let m = 1; m <= 12; m++) {
            const key = m.toString().padStart(2, '0');
            byMonth[key] = { income: 0, expenses: 0, variable: 0 };
        }

        transactions.forEach(t => {
            const m = (t.date.getMonth() + 1).toString().padStart(2, '0');
            if (t.type === 'income') byMonth[m].income += t.amount;
            else byMonth[m].expenses += t.amount;
        });

        variableExpenses.forEach(e => {
            const m = (e.date.getMonth() + 1).toString().padStart(2, '0');
            byMonth[m].variable += e.amount;
        });

        const totalIncome = Object.values(byMonth).reduce((s, m) => s + m.income, 0);
        const totalExpenses = Object.values(byMonth).reduce((s, m) => s + m.expenses + m.variable, 0);

        res.json({
            year,
            summary: {
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
                avgMonthlyIncome: totalIncome / 12,
                avgMonthlyExpenses: totalExpenses / 12
            },
            byMonth
        });
    } catch (error: any) {
        console.error('Report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Exportar dados (JSON/CSV)
router.get('/export/:format', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { format } = req.params;
        const { year, month } = req.query;

        let startDate: Date, endDate: Date;
        if (month && year) {
            startDate = new Date(Number(year), Number(month) - 1, 1);
            endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        } else if (year) {
            startDate = new Date(Number(year), 0, 1);
            endDate = new Date(Number(year), 11, 31, 23, 59, 59);
        } else {
            // Último ano
            endDate = new Date();
            startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        const [transactions, variableExpenses, fixedExpenses, accounts] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } }
            }),
            prisma.variableExpense.findMany({
                where: { userId, date: { gte: startDate, lte: endDate } },
                include: { category: true }
            }),
            prisma.fixedExpense.findMany({ where: { userId } }),
            prisma.account.findMany({ where: { userId } })
        ]);

        const data = {
            exportDate: new Date().toISOString(),
            period: { start: startDate.toISOString(), end: endDate.toISOString() },
            accounts,
            transactions,
            variableExpenses: variableExpenses.map(e => ({
                ...e,
                category: e.category?.name
            })),
            fixedExpenses
        };

        if (format === 'csv') {
            // Gerar CSV simples de transações
            const rows = [
                ['Tipo', 'Descrição', 'Valor', 'Data', 'Categoria', 'Pagamento'].join(',')
            ];

            transactions.forEach(t => {
                rows.push([t.type, `"${t.description}"`, t.amount, t.date.toISOString().split('T')[0], t.category, ''].join(','));
            });

            variableExpenses.forEach(e => {
                rows.push(['variavel', `"${e.description}"`, e.amount, e.date.toISOString().split('T')[0], e.category?.name || '', e.paymentType].join(','));
            });

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=financeiro_export.csv');
            return res.send(rows.join('\n'));
        }

        // JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=financeiro_export.json');
        res.json(data);
    } catch (error: any) {
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
