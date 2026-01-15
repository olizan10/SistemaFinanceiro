import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import authMiddleware from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ============================================
// CATEGORIAS DE DESPESAS
// ============================================

// Listar categorias do usuário
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Buscar ou criar categorias padrão
        const existingCategories = await prisma.expenseCategory.findMany({
            where: { userId, isActive: true },
            orderBy: { name: 'asc' }
        });

        if (existingCategories.length === 0) {
            // Criar categorias padrão
            const defaultCategories = [
                { name: 'Combustível', iconEmoji: '⛽', color: '#EF4444' },
                { name: 'Alimentação', iconEmoji: '🍔', color: '#F97316' },
                { name: 'Transporte', iconEmoji: '🚌', color: '#F59E0B' },
                { name: 'Lazer', iconEmoji: '🎬', color: '#10B981' },
                { name: 'Saúde', iconEmoji: '💊', color: '#3B82F6' },
                { name: 'Educação', iconEmoji: '📚', color: '#8B5CF6' },
                { name: 'Compras', iconEmoji: '🛒', color: '#EC4899' },
                { name: 'Outros', iconEmoji: '💰', color: '#6B7280' }
            ];

            await prisma.expenseCategory.createMany({
                data: defaultCategories.map(cat => ({ userId, ...cat }))
            });

            const categories = await prisma.expenseCategory.findMany({
                where: { userId, isActive: true },
                orderBy: { name: 'asc' }
            });
            return res.json(categories);
        }

        res.json(existingCategories);
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
});

// Criar categoria
router.post('/categories', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, iconEmoji, color, monthlyBudget } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }

        const category = await prisma.expenseCategory.create({
            data: {
                userId,
                name,
                iconEmoji: iconEmoji || '💰',
                color: color || '#8B5CF6',
                monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null
            }
        });

        res.status(201).json(category);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Categoria já existe' });
        }
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
});

// ============================================
// GASTOS VARIÁVEIS
// ============================================

// Listar gastos com filtros
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { month, year, categoryId, paymentType } = req.query;

        const where: any = { userId };

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = { gte: startDate, lte: endDate };
        } else if (year) {
            const startDate = new Date(Number(year), 0, 1);
            const endDate = new Date(Number(year), 11, 31, 23, 59, 59);
            where.date = { gte: startDate, lte: endDate };
        }

        if (categoryId) where.categoryId = categoryId;
        if (paymentType) where.paymentType = paymentType;

        const expenses = await prisma.variableExpense.findMany({
            where,
            include: {
                category: true,
                cardDebt: { select: { lastFourDigits: true, cardholderName: true } }
            },
            orderBy: { date: 'desc' }
        });

        res.json(expenses);
    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Erro ao buscar gastos' });
    }
});

// Resumo com médias por categoria
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Gastos do mês atual
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        // Buscar categorias com gastos
        const categories = await prisma.expenseCategory.findMany({
            where: { userId, isActive: true },
            include: {
                variableExpenses: {
                    where: { date: { gte: startOfMonth, lte: endOfMonth } }
                }
            }
        });

        // Calcular média mensal (últimos 3 meses)
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);

        const allExpenses = await prisma.variableExpense.findMany({
            where: { userId, date: { gte: threeMonthsAgo } },
            include: { category: true }
        });

        // Agrupar por categoria e calcular médias
        const categoryAverages: Record<string, { total: number; count: number; months: Set<string> }> = {};

        allExpenses.forEach(expense => {
            const catId = expense.categoryId;
            const monthKey = `${expense.date.getFullYear()}-${expense.date.getMonth()}`;

            if (!categoryAverages[catId]) {
                categoryAverages[catId] = { total: 0, count: 0, months: new Set() };
            }
            categoryAverages[catId].total += expense.amount;
            categoryAverages[catId].count += 1;
            categoryAverages[catId].months.add(monthKey);
        });

        // Montar resposta
        const summary = categories.map(cat => {
            const monthTotal = cat.variableExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const avgData = categoryAverages[cat.id];
            const monthsCount = avgData ? avgData.months.size : 1;
            const monthlyAverage = avgData ? avgData.total / monthsCount : 0;

            return {
                id: cat.id,
                name: cat.name,
                iconEmoji: cat.iconEmoji,
                color: cat.color,
                monthlyBudget: cat.monthlyBudget,
                monthTotal,
                monthlyAverage: Math.round(monthlyAverage * 100) / 100,
                transactionCount: cat.variableExpenses.length,
                budgetUsed: cat.monthlyBudget ? (monthTotal / cat.monthlyBudget) * 100 : null
            };
        });

        // Totais gerais
        const totalThisMonth = summary.reduce((s, c) => s + c.monthTotal, 0);
        const totalAverage = summary.reduce((s, c) => s + c.monthlyAverage, 0);

        res.json({
            month: currentMonth + 1,
            year: currentYear,
            categories: summary.filter(s => s.monthTotal > 0 || s.monthlyAverage > 0),
            totals: {
                thisMonth: totalThisMonth,
                monthlyAverage: Math.round(totalAverage * 100) / 100,
                projection: totalAverage > 0 ? totalAverage * 12 : null
            }
        });
    } catch (error: any) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Erro ao calcular resumo' });
    }
});

// Criar gasto
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { categoryId, description, amount, date, paymentType, cardDebtId, notes } = req.body;

        if (!categoryId || !description || !amount) {
            return res.status(400).json({ error: 'Categoria, descrição e valor são obrigatórios' });
        }

        const expense = await prisma.variableExpense.create({
            data: {
                userId,
                categoryId,
                description,
                amount: parseFloat(amount),
                date: date ? new Date(date) : new Date(),
                paymentType: paymentType || 'dinheiro',
                cardDebtId: cardDebtId || null,
                isPaid: paymentType !== 'cartao',
                notes: notes || null
            },
            include: {
                category: true,
                cardDebt: { select: { lastFourDigits: true } }
            }
        });

        res.status(201).json(expense);
    } catch (error: any) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Erro ao criar gasto' });
    }
});

// Atualizar gasto
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { categoryId, description, amount, date, paymentType, isPaid, notes } = req.body;

        const expense = await prisma.variableExpense.updateMany({
            where: { id, userId },
            data: {
                categoryId,
                description,
                amount: amount ? parseFloat(amount) : undefined,
                date: date ? new Date(date) : undefined,
                paymentType,
                isPaid,
                notes
            }
        });

        if (expense.count === 0) {
            return res.status(404).json({ error: 'Gasto não encontrado' });
        }

        const updated = await prisma.variableExpense.findUnique({
            where: { id },
            include: { category: true }
        });

        res.json(updated);
    } catch (error: any) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Erro ao atualizar gasto' });
    }
});

// Deletar gasto
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const deleted = await prisma.variableExpense.deleteMany({
            where: { id, userId }
        });

        if (deleted.count === 0) {
            return res.status(404).json({ error: 'Gasto não encontrado' });
        }

        res.json({ message: 'Gasto excluído com sucesso' });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Erro ao excluir gasto' });
    }
});

export default router;
