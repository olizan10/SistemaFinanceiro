import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar transações com filtros
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { type, category, accountId, startDate, endDate, limit, responsiblePerson } = req.query;

        const where: any = { userId };

        if (type) where.type = type;
        if (category) where.category = category;
        if (accountId) where.accountId = accountId;
        if (responsiblePerson) where.responsiblePerson = responsiblePerson;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            take: limit ? parseInt(limit as string) : 50,
            include: {
                account: { select: { id: true, name: true } },
                creditCard: { select: { id: true, name: true } }
            }
        });

        res.json(transactions);
    } catch (error: any) {
        console.error('Error listing transactions:', error);
        res.status(500).json({ error: 'Erro ao listar transações' });
    }
});

// Obter resumo por categoria
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { startDate, endDate } = req.query;

        const where: any = { userId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const transactions = await prisma.transaction.findMany({ where });

        // Agrupar por categoria
        const byCategory: Record<string, { income: number; expense: number }> = {};
        transactions.forEach((t) => {
            if (!byCategory[t.category]) {
                byCategory[t.category] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                byCategory[t.category].income += t.amount;
            } else {
                byCategory[t.category].expense += t.amount;
            }
        });

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        res.json({ byCategory, totalIncome, totalExpense, balance: totalIncome - totalExpense });
    } catch (error: any) {
        console.error('Error getting summary:', error);
        res.status(500).json({ error: 'Erro ao obter resumo' });
    }
});

// Criar transação
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { type, category, amount, description, date, accountId, creditCardId, isPaid, isRecurring, recurringType, responsiblePerson } = req.body;

        if (!type || !category || !amount || !description) {
            return res.status(400).json({ error: 'Tipo, categoria, valor e descrição são obrigatórios' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                type,
                category,
                amount: parseFloat(amount),
                description,
                date: date ? new Date(date) : new Date(),
                accountId: accountId || null,
                creditCardId: creditCardId || null,
                isPaid: isPaid ?? true,
                isRecurring: isRecurring ?? false,
                recurringType: recurringType || null,
                responsiblePerson: responsiblePerson || 'eu'
            }
        });

        // Atualizar saldo da conta se tiver conta vinculada
        if (accountId) {
            const balanceChange = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
            await prisma.account.update({
                where: { id: accountId },
                data: { balance: { increment: balanceChange } }
            });
        }

        // Atualizar saldo do cartão se tiver cartão vinculado
        if (creditCardId && type === 'expense') {
            await prisma.creditCard.update({
                where: { id: creditCardId },
                data: { currentBalance: { increment: parseFloat(amount) } }
            });
        }

        res.status(201).json(transaction);
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Erro ao criar transação' });
    }
});

// Atualizar transação
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { type, category, amount, description, date, isPaid } = req.body;

        const existing = await prisma.transaction.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                type: type || existing.type,
                category: category || existing.category,
                amount: amount !== undefined ? parseFloat(amount) : existing.amount,
                description: description || existing.description,
                date: date ? new Date(date) : existing.date,
                isPaid: isPaid !== undefined ? isPaid : existing.isPaid
            }
        });

        res.json(transaction);
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
});

// Excluir transação
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.transaction.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        // Reverter saldo da conta
        if (existing.accountId) {
            const balanceChange = existing.type === 'income' ? -existing.amount : existing.amount;
            await prisma.account.update({
                where: { id: existing.accountId },
                data: { balance: { increment: balanceChange } }
            });
        }

        await prisma.transaction.delete({ where: { id } });
        res.json({ message: 'Transação excluída com sucesso' });
    } catch (error: any) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Erro ao excluir transação' });
    }
});

export { router as transactionRouter };
