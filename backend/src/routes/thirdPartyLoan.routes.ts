import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// Listar empréstimos com terceiros
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const loans = await prisma.thirdPartyLoan.findMany({
            where: { userId },
            include: { payments: { orderBy: { paymentDate: 'desc' }, take: 5 } },
            orderBy: { createdAt: 'desc' }
        });

        // Calcular juros acumulados para cada empréstimo
        const loansWithInterest = loans.map(loan => {
            const monthsSinceStart = Math.max(0,
                (new Date().getTime() - new Date(loan.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            const accruedInterest = loan.principalAmount * (loan.monthlyInterest / 100) * monthsSinceStart;
            const totalPaid = loan.payments.reduce((s, p) => s + p.amount, 0);
            const currentBalance = loan.principalAmount + accruedInterest - totalPaid;

            return {
                ...loan,
                accruedInterest: Math.max(0, accruedInterest),
                totalPaid,
                currentBalance: Math.max(0, currentBalance),
                monthsSinceStart: Math.floor(monthsSinceStart)
            };
        });

        res.json(loansWithInterest);
    } catch (error) {
        console.error('Error listing third party loans:', error);
        res.status(500).json({ error: 'Erro ao listar empréstimos' });
    }
});

// Obter resumo de dívidas com terceiros
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const loans = await prisma.thirdPartyLoan.findMany({
            where: { userId, status: 'active' },
            include: { payments: true }
        });

        let totalPrincipal = 0;
        let totalInterest = 0;
        let totalPaid = 0;

        loans.forEach(loan => {
            const monthsSinceStart = Math.max(0,
                (new Date().getTime() - new Date(loan.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            totalPrincipal += loan.principalAmount;
            totalInterest += loan.principalAmount * (loan.monthlyInterest / 100) * monthsSinceStart;
            totalPaid += loan.payments.reduce((s, p) => s + p.amount, 0);
        });

        res.json({
            totalLoans: loans.length,
            totalPrincipal,
            totalInterest,
            totalPaid,
            totalDebt: totalPrincipal + totalInterest - totalPaid
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular resumo' });
    }
});

// Criar empréstimo com terceiro
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { creditorName, creditorPhone, principalAmount, monthlyInterest, startDate, nextPaymentDate, notes, responsiblePerson } = req.body;

        if (!creditorName || !principalAmount || !monthlyInterest) {
            return res.status(400).json({ error: 'Nome do credor, valor e taxa de juros são obrigatórios' });
        }

        const loan = await prisma.thirdPartyLoan.create({
            data: {
                userId,
                creditorName,
                creditorPhone: creditorPhone || null,
                principalAmount: parseFloat(principalAmount),
                monthlyInterest: parseFloat(monthlyInterest),
                currentBalance: parseFloat(principalAmount),
                startDate: startDate ? new Date(startDate) : new Date(),
                nextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate) : null,
                notes: notes || null,
                responsiblePerson: responsiblePerson || 'eu',
                status: 'active'
            }
        });

        res.status(201).json(loan);
    } catch (error) {
        console.error('Error creating third party loan:', error);
        res.status(500).json({ error: 'Erro ao criar empréstimo' });
    }
});

// Registrar pagamento
router.post('/:id/pay', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { amount, paymentDate, notes } = req.body;

        const loan = await prisma.thirdPartyLoan.findFirst({
            where: { id, userId },
            include: { payments: true }
        });
        if (!loan) return res.status(404).json({ error: 'Empréstimo não encontrado' });

        // Criar registro de pagamento
        await prisma.thirdPartyPayment.create({
            data: {
                thirdPartyLoanId: id,
                amount: parseFloat(amount),
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                notes: notes || null
            }
        });

        // Recalcular saldo
        const totalPaid = loan.payments.reduce((s, p) => s + p.amount, 0) + parseFloat(amount);
        const monthsSinceStart = Math.max(0,
            (new Date().getTime() - new Date(loan.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        const totalWithInterest = loan.principalAmount + (loan.principalAmount * (loan.monthlyInterest / 100) * monthsSinceStart);
        const newBalance = Math.max(0, totalWithInterest - totalPaid);
        const isPaid = newBalance <= 0;

        // Atualizar empréstimo
        await prisma.thirdPartyLoan.update({
            where: { id },
            data: {
                currentBalance: newBalance,
                status: isPaid ? 'paid' : 'active'
            }
        });

        res.json({ message: 'Pagamento registrado', newBalance, isPaid });
    } catch (error) {
        console.error('Error registering payment:', error);
        res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }
});

// Atualizar empréstimo
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const updates = req.body;

        const existing = await prisma.thirdPartyLoan.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Empréstimo não encontrado' });

        const loan = await prisma.thirdPartyLoan.update({
            where: { id },
            data: {
                creditorName: updates.creditorName || existing.creditorName,
                creditorPhone: updates.creditorPhone !== undefined ? updates.creditorPhone : existing.creditorPhone,
                monthlyInterest: updates.monthlyInterest ? parseFloat(updates.monthlyInterest) : existing.monthlyInterest,
                nextPaymentDate: updates.nextPaymentDate ? new Date(updates.nextPaymentDate) : existing.nextPaymentDate,
                notes: updates.notes !== undefined ? updates.notes : existing.notes,
                responsiblePerson: updates.responsiblePerson || existing.responsiblePerson
            }
        });

        res.json(loan);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar empréstimo' });
    }
});

// Excluir empréstimo
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const existing = await prisma.thirdPartyLoan.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ error: 'Empréstimo não encontrado' });

        await prisma.thirdPartyLoan.delete({ where: { id } });
        res.json({ message: 'Empréstimo excluído' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir empréstimo' });
    }
});

export { router as thirdPartyLoanRouter };
