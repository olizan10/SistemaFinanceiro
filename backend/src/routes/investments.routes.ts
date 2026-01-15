import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import authMiddleware from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Listar investimentos
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const investments = await prisma.investment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        // Calcular totais
        const totalInvested = investments.reduce((s, i) => s + i.initialAmount, 0);
        const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
        const totalReturn = totalCurrent - totalInvested;
        const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        // Agrupar por tipo
        const byType: Record<string, { invested: number; current: number; count: number }> = {};
        investments.forEach(inv => {
            if (!byType[inv.type]) {
                byType[inv.type] = { invested: 0, current: 0, count: 0 };
            }
            byType[inv.type].invested += inv.initialAmount;
            byType[inv.type].current += inv.currentValue;
            byType[inv.type].count++;
        });

        res.json({
            investments,
            summary: {
                totalInvested,
                totalCurrent,
                totalReturn,
                returnPercent: returnPercent.toFixed(2),
                count: investments.length
            },
            byType
        });
    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Criar investimento
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, type, institution, initialAmount, currentValue, purchaseDate, notes } = req.body;

        if (!name || !type || !initialAmount) {
            return res.status(400).json({ error: 'Nome, tipo e valor inicial são obrigatórios' });
        }

        const investment = await prisma.investment.create({
            data: {
                userId,
                name,
                type,
                institution: institution || '',
                initialAmount: parseFloat(initialAmount),
                currentValue: parseFloat(currentValue || initialAmount),
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                notes
            }
        });

        res.status(201).json(investment);
    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Atualizar valor de investimento
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { currentValue, notes } = req.body;

        const investment = await prisma.investment.updateMany({
            where: { id, userId },
            data: {
                currentValue: parseFloat(currentValue),
                notes,
                updatedAt: new Date()
            }
        });

        if (investment.count === 0) {
            return res.status(404).json({ error: 'Investimento não encontrado' });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Deletar investimento
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const result = await prisma.investment.deleteMany({
            where: { id, userId }
        });

        if (result.count === 0) {
            return res.status(404).json({ error: 'Investimento não encontrado' });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Histórico de rendimentos (para gráfico)
router.get('/performance', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const investments = await prisma.investment.findMany({
            where: { userId }
        });

        // Simular histórico mensal (para demo)
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

            // Simular crescimento gradual
            const totalInvested = investments.reduce((s, inv) => s + inv.initialAmount, 0);
            const multiplier = 1 + ((5 - i) * 0.02); // 2% ao mês simulado

            months.push({
                month: monthLabel,
                value: Math.round(totalInvested * multiplier)
            });
        }

        res.json(months);
    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
