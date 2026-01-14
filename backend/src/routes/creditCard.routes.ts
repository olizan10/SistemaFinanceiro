import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar cartões
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const cards = await prisma.creditCard.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar cartões' });
    }
});

// Obter fatura atual de um cartão
router.get('/:id/invoice', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const card = await prisma.creditCard.findFirst({ where: { id, userId } });
        if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });

        // Buscar transações do cartão no mês atual
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactions = await prisma.transaction.findMany({
            where: {
                creditCardId: id,
                date: { gte: startOfMonth, lte: endOfMonth }
            },
            orderBy: { date: 'desc' }
        });

        res.json({ card, transactions, total: card.currentBalance });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter fatura' });
    }
});

// Criar cartão
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, lastFourDigits, limit, closingDay, dueDay } = req.body;

        if (!name || !limit) {
            return res.status(400).json({ error: 'Nome e limite são obrigatórios' });
        }

        const card = await prisma.creditCard.create({
            data: {
                userId,
                name,
                lastFourDigits: lastFourDigits || '0000',
                limit: parseFloat(limit),
                closingDay: parseInt(closingDay) || 1,
                dueDay: parseInt(dueDay) || 10,
                currentBalance: 0
            }
        });

        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar cartão' });
    }
});

// Atualizar cartão
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const updates = req.body;

        const existing = await prisma.creditCard.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Cartão não encontrado' });

        const card = await prisma.creditCard.update({
            where: { id },
            data: {
                name: updates.name || existing.name,
                lastFourDigits: updates.lastFourDigits || existing.lastFourDigits,
                limit: updates.limit ? parseFloat(updates.limit) : existing.limit,
                closingDay: updates.closingDay ? parseInt(updates.closingDay) : existing.closingDay,
                dueDay: updates.dueDay ? parseInt(updates.dueDay) : existing.dueDay
            }
        });

        res.json(card);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar cartão' });
    }
});

// Excluir cartão
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.creditCard.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Cartão não encontrado' });

        await prisma.creditCard.delete({ where: { id } });
        res.json({ message: 'Cartão excluído' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir cartão' });
    }
});

export { router as creditCardRouter };
