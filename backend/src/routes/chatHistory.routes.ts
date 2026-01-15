import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// ============================================
// HISTÓRICO DE CHAT
// ============================================

// Listar histórico de chat
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { limit = 50, offset = 0 } = req.query;

        const messages = await prisma.chatHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        res.json(messages.reverse()); // Retornar em ordem cronológica
    } catch (error: any) {
        console.error('Error listing chat history:', error);
        res.status(500).json({ error: 'Erro ao listar histórico' });
    }
});

// Buscar em conversas anteriores
router.get('/search', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query é obrigatória' });
        }

        const messages = await prisma.chatHistory.findMany({
            where: {
                userId,
                content: { contains: query as string, mode: 'insensitive' }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json(messages);
    } catch (error: any) {
        console.error('Error searching chat:', error);
        res.status(500).json({ error: 'Erro ao buscar' });
    }
});

// Salvar mensagem no histórico
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { role, content, metadata } = req.body;

        if (!role || !content) {
            return res.status(400).json({ error: 'Role e content são obrigatórios' });
        }

        const message = await prisma.chatHistory.create({
            data: {
                userId,
                role, // 'user' ou 'assistant'
                content,
                metadata: metadata || null
            }
        });

        res.status(201).json(message);
    } catch (error: any) {
        console.error('Error saving chat message:', error);
        res.status(500).json({ error: 'Erro ao salvar mensagem' });
    }
});

// Obter últimas N mensagens para contexto da IA
router.get('/context', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { limit = 10 } = req.query;

        const messages = await prisma.chatHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            select: { role: true, content: true, createdAt: true }
        });

        res.json(messages.reverse());
    } catch (error: any) {
        console.error('Error getting context:', error);
        res.status(500).json({ error: 'Erro ao obter contexto' });
    }
});

// Limpar histórico
router.delete('/clear', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        await prisma.chatHistory.deleteMany({ where: { userId } });

        res.json({ message: 'Histórico limpo' });
    } catch (error: any) {
        console.error('Error clearing chat:', error);
        res.status(500).json({ error: 'Erro ao limpar histórico' });
    }
});

export { router as chatHistoryRouter };
