import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar orçamentos
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { month } = req.query;

        const targetMonth = month ? new Date(month as string) : new Date();
        const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);

        const budgets = await prisma.budget.findMany({
            where: { userId, month: startOfMonth },
            orderBy: { category: 'asc' }
        });

        // Calcular gastos reais por categoria
        const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'expense',
                date: { gte: startOfMonth, lte: endOfMonth }
            }
        });

        const spentByCategory: Record<string, number> = {};
        transactions.forEach(t => {
            spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
        });

        const budgetsWithSpent = budgets.map(b => ({
            ...b,
            spent: spentByCategory[b.category] || 0,
            remaining: b.amount - (spentByCategory[b.category] || 0),
            percentage: ((spentByCategory[b.category] || 0) / b.amount) * 100
        }));

        res.json(budgetsWithSpent);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar orçamentos' });
    }
});

// Criar orçamento
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { category, amount, month } = req.body;

        if (!category || !amount) {
            return res.status(400).json({ error: 'Categoria e valor são obrigatórios' });
        }

        const targetMonth = month ? new Date(month) : new Date();
        const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);

        // Verificar se já existe orçamento para esta categoria/mês
        const existing = await prisma.budget.findFirst({
            where: { userId, category, month: startOfMonth }
        });

        if (existing) {
            return res.status(400).json({ error: 'Orçamento já existe para esta categoria neste mês' });
        }

        const budget = await prisma.budget.create({
            data: {
                userId,
                category,
                amount: parseFloat(amount),
                month: startOfMonth
            }
        });

        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
});

// Atualizar orçamento
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { amount } = req.body;

        const existing = await prisma.budget.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Orçamento não encontrado' });

        const budget = await prisma.budget.update({
            where: { id },
            data: { amount: parseFloat(amount) }
        });

        res.json(budget);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
});

// Excluir orçamento
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.budget.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Orçamento não encontrado' });

        await prisma.budget.delete({ where: { id } });
        res.json({ message: 'Orçamento excluído' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir orçamento' });
    }
});

export { router as budgetRouter };
