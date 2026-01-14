import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar metas
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const goals = await prisma.goal.findMany({
            where: { userId },
            orderBy: { deadline: 'asc' }
        });

        const goalsWithProgress = goals.map(g => ({
            ...g,
            progress: (g.currentAmount / g.targetAmount) * 100,
            remaining: g.targetAmount - g.currentAmount
        }));

        res.json(goalsWithProgress);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar metas' });
    }
});

// Criar meta
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, targetAmount, deadline } = req.body;

        if (!name || !targetAmount || !deadline) {
            return res.status(400).json({ error: 'Nome, valor e prazo são obrigatórios' });
        }

        const goal = await prisma.goal.create({
            data: {
                userId,
                name,
                targetAmount: parseFloat(targetAmount),
                currentAmount: 0,
                deadline: new Date(deadline),
                status: 'active'
            }
        });

        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar meta' });
    }
});

// Contribuir para uma meta
router.post('/:id/contribute', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { amount } = req.body;

        const goal = await prisma.goal.findFirst({ where: { id, userId } });
        if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

        const newAmount = goal.currentAmount + parseFloat(amount);
        const isCompleted = newAmount >= goal.targetAmount;

        const updated = await prisma.goal.update({
            where: { id },
            data: {
                currentAmount: newAmount,
                status: isCompleted ? 'completed' : 'active'
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao contribuir' });
    }
});

// Atualizar meta
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { name, targetAmount, deadline, status } = req.body;

        const existing = await prisma.goal.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Meta não encontrada' });

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                name: name || existing.name,
                targetAmount: targetAmount ? parseFloat(targetAmount) : existing.targetAmount,
                deadline: deadline ? new Date(deadline) : existing.deadline,
                status: status || existing.status
            }
        });

        res.json(goal);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar meta' });
    }
});

// Excluir meta
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.goal.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Meta não encontrada' });

        await prisma.goal.delete({ where: { id } });
        res.json({ message: 'Meta excluída' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir meta' });
    }
});

export { router as goalRouter };
