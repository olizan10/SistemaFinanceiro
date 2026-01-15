import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// ============================================
// MEMBROS DA FAMÍLIA
// ============================================

// Listar membros
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const members = await prisma.familyMember.findMany({
            where: { userId, isActive: true },
            orderBy: { name: 'asc' }
        });

        res.json(members);
    } catch (error: any) {
        console.error('Error listing family members:', error);
        res.status(500).json({ error: 'Erro ao listar membros' });
    }
});

// Criar membro
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, lastName, email, canManage = false } = req.body;

        if (!name || !lastName) {
            return res.status(400).json({ error: 'Nome e sobrenome são obrigatórios' });
        }

        const member = await prisma.familyMember.create({
            data: {
                userId,
                name,
                lastName,
                email: email || null,
                canManage: canManage === true
            }
        });

        res.status(201).json(member);
    } catch (error: any) {
        console.error('Error creating family member:', error);
        res.status(500).json({ error: 'Erro ao criar membro' });
    }
});

// Atualizar membro
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { name, lastName, email, canManage } = req.body;

        const existing = await prisma.familyMember.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Membro não encontrado' });
        }

        const member = await prisma.familyMember.update({
            where: { id },
            data: {
                name: name || existing.name,
                lastName: lastName || existing.lastName,
                email: email !== undefined ? email : existing.email,
                canManage: canManage !== undefined ? canManage : existing.canManage
            }
        });

        res.json(member);
    } catch (error: any) {
        console.error('Error updating family member:', error);
        res.status(500).json({ error: 'Erro ao atualizar membro' });
    }
});

// Desativar membro (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.familyMember.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Membro não encontrado' });
        }

        await prisma.familyMember.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ message: 'Membro desativado' });
    } catch (error: any) {
        console.error('Error deleting family member:', error);
        res.status(500).json({ error: 'Erro ao desativar membro' });
    }
});

export { router as familyMemberRouter };
