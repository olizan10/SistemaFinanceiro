import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar contas fixas
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const expenses = await prisma.fixedExpense.findMany({
            where: { userId },
            orderBy: { dueDay: 'asc' }
        });

        // Adicionar informação de próximo vencimento
        const today = new Date();
        const currentDay = today.getDate();

        const expensesWithInfo = expenses.map(exp => {
            let daysUntilDue = exp.dueDay - currentDay;
            if (daysUntilDue < 0) daysUntilDue += 30; // Próximo mês

            return {
                ...exp,
                daysUntilDue,
                isOverdue: exp.lastPaidDate ?
                    new Date(exp.lastPaidDate).getMonth() < today.getMonth() :
                    true
            };
        });

        res.json(expensesWithInfo);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar contas fixas' });
    }
});

// Obter resumo de contas fixas
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const expenses = await prisma.fixedExpense.findMany({
            where: { userId, isActive: true }
        });

        const total = expenses.reduce((s, e) => s + e.amount, 0);
        const today = new Date();
        const currentDay = today.getDate();

        const upcoming = expenses.filter(e => {
            const daysUntil = e.dueDay - currentDay;
            return daysUntil >= 0 && daysUntil <= 7;
        });

        res.json({
            total,
            count: expenses.length,
            upcomingCount: upcoming.length,
            upcomingAmount: upcoming.reduce((s, e) => s + e.amount, 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular resumo' });
    }
});

// Criar conta fixa
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, amount, dueDay, category } = req.body;

        if (!name || !amount || !dueDay) {
            return res.status(400).json({ error: 'Nome, valor e dia de vencimento são obrigatórios' });
        }

        const expense = await prisma.fixedExpense.create({
            data: {
                userId,
                name,
                amount: parseFloat(amount),
                dueDay: parseInt(dueDay),
                category: category || 'utility',
                isActive: true
            }
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar conta fixa' });
    }
});

// Marcar como paga
router.post('/:id/pay', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.fixedExpense.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Conta não encontrada' });

        await prisma.fixedExpense.update({
            where: { id },
            data: { lastPaidDate: new Date() }
        });

        res.json({ message: 'Conta marcada como paga' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao marcar como paga' });
    }
});

// Atualizar conta fixa
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const updates = req.body;

        const existing = await prisma.fixedExpense.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Conta não encontrada' });

        const expense = await prisma.fixedExpense.update({
            where: { id },
            data: {
                name: updates.name || existing.name,
                amount: updates.amount ? parseFloat(updates.amount) : existing.amount,
                dueDay: updates.dueDay ? parseInt(updates.dueDay) : existing.dueDay,
                category: updates.category || existing.category,
                isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive
            }
        });

        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar conta fixa' });
    }
});

// Excluir conta fixa
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.fixedExpense.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Conta não encontrada' });

        await prisma.fixedExpense.delete({ where: { id } });
        res.json({ message: 'Conta excluída' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir conta fixa' });
    }
});

export { router as fixedExpenseRouter };
