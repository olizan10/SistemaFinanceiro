import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar todas as contas do usuário
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const accounts = await prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(accounts);
    } catch (error: any) {
        console.error('Error listing accounts:', error);
        res.status(500).json({ error: 'Erro ao listar contas' });
    }
});

// Obter uma conta específica
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const account = await prisma.account.findFirst({
            where: { id, userId }
        });

        if (!account) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        res.json(account);
    } catch (error: any) {
        console.error('Error getting account:', error);
        res.status(500).json({ error: 'Erro ao buscar conta' });
    }
});

// Criar nova conta
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, type, balance, currency } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        }

        const account = await prisma.account.create({
            data: {
                userId,
                name,
                type,
                balance: parseFloat(balance) || 0,
                currency: currency || 'BRL'
            }
        });

        res.status(201).json(account);
    } catch (error: any) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

// Atualizar conta
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { name, type, balance, currency } = req.body;

        // Verificar se a conta pertence ao usuário
        const existingAccount = await prisma.account.findFirst({
            where: { id, userId }
        });

        if (!existingAccount) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        const account = await prisma.account.update({
            where: { id },
            data: {
                name: name || existingAccount.name,
                type: type || existingAccount.type,
                balance: balance !== undefined ? parseFloat(balance) : existingAccount.balance,
                currency: currency || existingAccount.currency
            }
        });

        res.json(account);
    } catch (error: any) {
        console.error('Error updating account:', error);
        res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
});

// Excluir conta
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        // Verificar se a conta pertence ao usuário
        const existingAccount = await prisma.account.findFirst({
            where: { id, userId }
        });

        if (!existingAccount) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        await prisma.account.delete({
            where: { id }
        });

        res.json({ message: 'Conta excluída com sucesso' });
    } catch (error: any) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Erro ao excluir conta' });
    }
});

export { router as accountRouter };
