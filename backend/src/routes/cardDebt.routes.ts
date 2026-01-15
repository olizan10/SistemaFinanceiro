import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// ============================================
// DÍVIDAS DE CARTÃO
// ============================================

// Listar todos os cartões com resumo de dívidas
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const cardDebts = await prisma.cardDebt.findMany({
            where: { userId },
            include: {
                purchases: {
                    where: { status: 'active' },
                    include: {
                        familyMember: { select: { id: true, name: true, lastName: true } }
                    },
                    orderBy: { purchaseDate: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Calcular totais para cada cartão
        const cardsWithTotals = cardDebts.map(card => {
            const activePurchases = card.purchases.filter(p => p.status === 'active');
            const totalDebt = activePurchases.reduce((sum, p) => {
                const remainingInstallments = p.installments - p.paidInstallments;
                return sum + (remainingInstallments * p.installmentAmount);
            }, 0);
            const totalPurchases = activePurchases.length;
            const totalInstallmentsRemaining = activePurchases.reduce((sum, p) =>
                sum + (p.installments - p.paidInstallments), 0);

            return {
                ...card,
                totalDebt,
                totalPurchases,
                totalInstallmentsRemaining
            };
        });

        res.json(cardsWithTotals);
    } catch (error: any) {
        console.error('Error listing card debts:', error);
        res.status(500).json({ error: 'Erro ao listar dívidas de cartão' });
    }
});

// Obter detalhes de um cartão com todas as parcelas
router.get('/:id/details', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const cardDebt = await prisma.cardDebt.findFirst({
            where: { id, userId },
            include: {
                purchases: {
                    include: {
                        familyMember: { select: { id: true, name: true, lastName: true } },
                        payments: { orderBy: { paymentDate: 'desc' } }
                    },
                    orderBy: { purchaseDate: 'desc' }
                }
            }
        });

        if (!cardDebt) {
            return res.status(404).json({ error: 'Cartão não encontrado' });
        }

        // Gerar lista de parcelas futuras
        const installmentsList: any[] = [];
        cardDebt.purchases.forEach(purchase => {
            for (let i = purchase.paidInstallments + 1; i <= purchase.installments; i++) {
                const dueDate = new Date(purchase.purchaseDate);
                dueDate.setMonth(dueDate.getMonth() + i);
                dueDate.setDate(cardDebt.dueDay);

                installmentsList.push({
                    purchaseId: purchase.id,
                    description: purchase.description,
                    installmentNumber: i,
                    totalInstallments: purchase.installments,
                    amount: purchase.installmentAmount,
                    dueDate,
                    familyMember: purchase.familyMember
                });
            }
        });

        // Ordenar por data de vencimento
        installmentsList.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        res.json({
            card: cardDebt,
            installments: installmentsList
        });
    } catch (error: any) {
        console.error('Error getting card details:', error);
        res.status(500).json({ error: 'Erro ao obter detalhes do cartão' });
    }
});

// Resumo geral de dívidas de cartão
router.get('/summary/all', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const cardDebts = await prisma.cardDebt.findMany({
            where: { userId },
            include: {
                purchases: { where: { status: 'active' } }
            }
        });

        let totalDebt = 0;
        let totalCards = cardDebts.length;
        let totalPurchases = 0;
        let totalFees = 0;

        cardDebts.forEach(card => {
            card.purchases.forEach(p => {
                const remaining = p.installments - p.paidInstallments;
                totalDebt += remaining * p.installmentAmount;
                totalPurchases++;
                totalFees += (p.totalAmount * p.cardFeePercent / 100);
            });
        });

        res.json({
            totalDebt,
            totalCards,
            totalPurchases,
            totalFees
        });
    } catch (error: any) {
        console.error('Error getting summary:', error);
        res.status(500).json({ error: 'Erro ao obter resumo' });
    }
});

// ============================================
// CADASTRAR COMPRA (cria cartão se não existe)
// ============================================

router.post('/purchase', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const {
            cardholderName,
            lastFourDigits,
            dueDay,
            description,
            purchaseDate,
            totalAmount,
            installments = 1,
            cardFeePercent = 0,
            familyMemberId
        } = req.body;

        if (!cardholderName || !lastFourDigits || !description || !totalAmount) {
            return res.status(400).json({
                error: 'Campos obrigatórios: cardholderName, lastFourDigits, description, totalAmount'
            });
        }

        // Buscar ou criar o cartão
        let cardDebt = await prisma.cardDebt.findFirst({
            where: { userId, lastFourDigits: lastFourDigits.toString() }
        });

        if (!cardDebt) {
            cardDebt = await prisma.cardDebt.create({
                data: {
                    userId,
                    cardholderName,
                    lastFourDigits: lastFourDigits.toString(),
                    dueDay: parseInt(dueDay) || 10
                }
            });
        }

        // Criar a compra
        const installmentAmount = parseFloat(totalAmount) / parseInt(installments);

        const purchase = await prisma.cardPurchase.create({
            data: {
                cardDebtId: cardDebt.id,
                familyMemberId: familyMemberId || null,
                description,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                totalAmount: parseFloat(totalAmount),
                installments: parseInt(installments),
                installmentAmount,
                cardFeePercent: parseFloat(cardFeePercent) || 0
            },
            include: {
                familyMember: { select: { id: true, name: true, lastName: true } }
            }
        });

        // Atualizar total do cartão
        const allPurchases = await prisma.cardPurchase.findMany({
            where: { cardDebtId: cardDebt.id, status: 'active' }
        });

        const newTotal = allPurchases.reduce((sum, p) => {
            const remaining = p.installments - p.paidInstallments;
            return sum + (remaining * p.installmentAmount);
        }, 0);

        await prisma.cardDebt.update({
            where: { id: cardDebt.id },
            data: { totalDebt: newTotal }
        });

        res.status(201).json({
            card: cardDebt,
            purchase,
            message: 'Compra cadastrada com sucesso!'
        });
    } catch (error: any) {
        console.error('Error creating purchase:', error);
        res.status(500).json({ error: 'Erro ao cadastrar compra' });
    }
});

// ============================================
// REGISTRAR PAGAMENTO DE PARCELA
// ============================================

router.post('/purchase/:purchaseId/pay', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { purchaseId } = req.params;
        const { amount, feePaid = 0, installmentsToPay = 1 } = req.body;

        // Verificar se a compra existe
        const purchase = await prisma.cardPurchase.findFirst({
            where: { id: purchaseId },
            include: { cardDebt: true }
        });

        if (!purchase || purchase.cardDebt.userId !== userId) {
            return res.status(404).json({ error: 'Compra não encontrada' });
        }

        // Registrar pagamento
        const payment = await prisma.cardPayment.create({
            data: {
                cardPurchaseId: purchaseId,
                amount: parseFloat(amount) || purchase.installmentAmount * installmentsToPay,
                feePaid: parseFloat(feePaid) || 0,
                paymentDate: new Date()
            }
        });

        // Atualizar parcelas pagas
        const newPaidInstallments = Math.min(
            purchase.paidInstallments + parseInt(installmentsToPay),
            purchase.installments
        );

        const updatedPurchase = await prisma.cardPurchase.update({
            where: { id: purchaseId },
            data: {
                paidInstallments: newPaidInstallments,
                status: newPaidInstallments >= purchase.installments ? 'paid' : 'active'
            }
        });

        // Atualizar total do cartão
        const allPurchases = await prisma.cardPurchase.findMany({
            where: { cardDebtId: purchase.cardDebtId, status: 'active' }
        });

        const newTotal = allPurchases.reduce((sum, p) => {
            const remaining = p.installments - p.paidInstallments;
            return sum + (remaining * p.installmentAmount);
        }, 0);

        await prisma.cardDebt.update({
            where: { id: purchase.cardDebtId },
            data: { totalDebt: newTotal }
        });

        res.json({
            payment,
            purchase: updatedPurchase,
            message: `Pagamento registrado! ${newPaidInstallments}/${purchase.installments} parcelas pagas.`
        });
    } catch (error: any) {
        console.error('Error registering payment:', error);
        res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }
});

// Excluir compra
router.delete('/purchase/:purchaseId', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { purchaseId } = req.params;

        const purchase = await prisma.cardPurchase.findFirst({
            where: { id: purchaseId },
            include: { cardDebt: true }
        });

        if (!purchase || purchase.cardDebt.userId !== userId) {
            return res.status(404).json({ error: 'Compra não encontrada' });
        }

        await prisma.cardPurchase.delete({ where: { id: purchaseId } });

        // Atualizar total do cartão
        const allPurchases = await prisma.cardPurchase.findMany({
            where: { cardDebtId: purchase.cardDebtId, status: 'active' }
        });

        const newTotal = allPurchases.reduce((sum, p) => {
            const remaining = p.installments - p.paidInstallments;
            return sum + (remaining * p.installmentAmount);
        }, 0);

        await prisma.cardDebt.update({
            where: { id: purchase.cardDebtId },
            data: { totalDebt: newTotal }
        });

        res.json({ message: 'Compra excluída' });
    } catch (error: any) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({ error: 'Erro ao excluir compra' });
    }
});

// Excluir cartão
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const cardDebt = await prisma.cardDebt.findFirst({ where: { id, userId } });
        if (!cardDebt) {
            return res.status(404).json({ error: 'Cartão não encontrado' });
        }

        await prisma.cardDebt.delete({ where: { id } });
        res.json({ message: 'Cartão e todas as compras excluídos' });
    } catch (error: any) {
        console.error('Error deleting card:', error);
        res.status(500).json({ error: 'Erro ao excluir cartão' });
    }
});

export { router as cardDebtRouter };
