import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();
router.use(authMiddleware);

// ============================================
// HISTÓRICO COMPLETO CONSOLIDADO
// ============================================

// Listar todo o histórico de movimentações
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { startDate, endDate, type, familyMemberId, limit = 100 } = req.query;

        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate as string);
        if (endDate) dateFilter.lte = new Date(endDate as string);

        // Buscar todas as movimentações em paralelo
        const [transactions, cardPurchases, cardPayments, thirdPartyPayments, fixedPayments, thirdPartyLoans] = await Promise.all([
            // Transações normais
            prisma.transaction.findMany({
                where: {
                    userId,
                    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
                    ...(type ? { type: type as string } : {})
                },
                include: {
                    account: { select: { name: true } },
                    creditCard: { select: { name: true } }
                },
                orderBy: { date: 'desc' },
                take: parseInt(limit as string)
            }),

            // Compras no cartão
            prisma.cardPurchase.findMany({
                where: {
                    cardDebt: { userId },
                    ...(Object.keys(dateFilter).length ? { purchaseDate: dateFilter } : {}),
                    ...(familyMemberId ? { familyMemberId: familyMemberId as string } : {})
                },
                include: {
                    cardDebt: { select: { cardholderName: true, lastFourDigits: true } },
                    familyMember: { select: { name: true, lastName: true } }
                },
                orderBy: { purchaseDate: 'desc' },
                take: parseInt(limit as string)
            }),

            // Pagamentos de cartão
            prisma.cardPayment.findMany({
                where: {
                    cardPurchase: { cardDebt: { userId } },
                    ...(Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {})
                },
                include: {
                    cardPurchase: {
                        select: {
                            description: true,
                            cardDebt: { select: { lastFourDigits: true } }
                        }
                    }
                },
                orderBy: { paymentDate: 'desc' },
                take: parseInt(limit as string)
            }),

            // Pagamentos de empréstimos com terceiros
            prisma.thirdPartyPayment.findMany({
                where: {
                    thirdPartyLoan: { userId },
                    ...(Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {})
                },
                include: {
                    thirdPartyLoan: { select: { creditorName: true } }
                },
                orderBy: { paymentDate: 'desc' },
                take: parseInt(limit as string)
            }),

            // Pagamentos de contas fixas
            prisma.fixedExpensePayment.findMany({
                where: {
                    fixedExpense: { userId },
                    ...(Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {})
                },
                include: {
                    fixedExpense: { select: { name: true, category: true } }
                },
                orderBy: { paymentDate: 'desc' },
                take: parseInt(limit as string)
            }),

            // Empréstimos com terceiros (para histórico de criação)
            prisma.thirdPartyLoan.findMany({
                where: {
                    userId,
                    ...(Object.keys(dateFilter).length ? { startDate: dateFilter } : {})
                },
                include: {
                    familyMember: { select: { name: true, lastName: true } }
                },
                orderBy: { startDate: 'desc' },
                take: parseInt(limit as string)
            })
        ]);

        // Consolidar em uma timeline única
        const timeline: any[] = [];

        // Transações
        transactions.forEach(t => {
            timeline.push({
                id: t.id,
                type: 'transaction',
                subType: t.type,
                date: t.date,
                description: t.description,
                amount: t.amount,
                category: t.category,
                isIncome: t.type === 'income',
                details: t.account?.name || t.creditCard?.name || null
            });
        });

        // Compras no cartão
        cardPurchases.forEach(p => {
            timeline.push({
                id: p.id,
                type: 'card_purchase',
                subType: 'expense',
                date: p.purchaseDate,
                description: p.description,
                amount: p.totalAmount,
                category: 'Cartão de Crédito',
                isIncome: false,
                details: `**** ${p.cardDebt.lastFourDigits}`,
                installments: `${p.paidInstallments}/${p.installments}x`,
                familyMember: p.familyMember ? `${p.familyMember.name} ${p.familyMember.lastName}` : null
            });
        });

        // Pagamentos de cartão
        cardPayments.forEach(p => {
            timeline.push({
                id: p.id,
                type: 'card_payment',
                subType: 'payment',
                date: p.paymentDate,
                description: `Pagamento: ${p.cardPurchase.description}`,
                amount: p.amount,
                category: 'Pagamento Cartão',
                isIncome: false,
                details: `**** ${p.cardPurchase.cardDebt.lastFourDigits}`,
                feePaid: p.feePaid
            });
        });

        // Pagamentos de terceiros
        thirdPartyPayments.forEach(p => {
            timeline.push({
                id: p.id,
                type: 'third_party_payment',
                subType: 'payment',
                date: p.paymentDate,
                description: `Pagamento para ${p.thirdPartyLoan.creditorName}`,
                amount: p.amount,
                category: 'Empréstimo Terceiro',
                isIncome: false,
                details: p.notes
            });
        });

        // Pagamentos de contas fixas
        fixedPayments.forEach(p => {
            timeline.push({
                id: p.id,
                type: 'fixed_expense_payment',
                subType: 'payment',
                date: p.paymentDate,
                description: `${p.fixedExpense.name}`,
                amount: p.amount,
                category: p.fixedExpense.category,
                isIncome: false,
                details: p.notes
            });
        });

        // Empréstimos criados
        thirdPartyLoans.forEach(l => {
            timeline.push({
                id: l.id,
                type: 'loan_created',
                subType: 'loan',
                date: l.startDate,
                description: `Empréstimo de ${l.creditorName}`,
                amount: l.principalAmount,
                category: 'Empréstimo',
                isIncome: true,
                details: `Juros: ${l.monthlyInterest}%/mês`,
                familyMember: l.familyMember ? `${l.familyMember.name} ${l.familyMember.lastName}` : null
            });
        });

        // Ordenar por data (mais recente primeiro)
        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Limitar resultado
        const limitedTimeline = timeline.slice(0, parseInt(limit as string));

        res.json(limitedTimeline);
    } catch (error: any) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// Resumo do histórico
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate as string);
        if (endDate) dateFilter.lte = new Date(endDate as string);

        const [transactions, cardPayments, thirdPartyPayments, fixedPayments] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    userId,
                    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
                },
                _sum: { amount: true },
                _count: true
            }),
            prisma.cardPayment.aggregate({
                where: {
                    cardPurchase: { cardDebt: { userId } },
                    ...(Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {})
                },
                _sum: { amount: true, feePaid: true },
                _count: true
            }),
            prisma.thirdPartyPayment.aggregate({
                where: {
                    thirdPartyLoan: { userId },
                    ...(Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {})
                },
                _sum: { amount: true },
                _count: true
            }),
            prisma.fixedExpensePayment.aggregate({
                where: {
                    fixedExpense: { userId },
                    ...(Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {})
                },
                _sum: { amount: true },
                _count: true
            })
        ]);

        res.json({
            transactions: {
                total: transactions._sum.amount || 0,
                count: transactions._count
            },
            cardPayments: {
                total: cardPayments._sum.amount || 0,
                fees: cardPayments._sum.feePaid || 0,
                count: cardPayments._count
            },
            thirdPartyPayments: {
                total: thirdPartyPayments._sum.amount || 0,
                count: thirdPartyPayments._count
            },
            fixedPayments: {
                total: fixedPayments._sum.amount || 0,
                count: fixedPayments._count
            }
        });
    } catch (error: any) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Erro ao buscar resumo' });
    }
});

// Exportar para formato de dados (frontend gera o PDF)
router.get('/export', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { startDate, endDate, format = 'json' } = req.query;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true }
        });

        // Buscar todos os dados para exportação
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate as string);
        if (endDate) dateFilter.lte = new Date(endDate as string);

        const [cardDebts, thirdPartyLoans, fixedExpenses, transactions] = await Promise.all([
            prisma.cardDebt.findMany({
                where: { userId },
                include: {
                    purchases: {
                        where: { status: 'active' },
                        include: { familyMember: true }
                    }
                }
            }),
            prisma.thirdPartyLoan.findMany({
                where: { userId, status: 'active' },
                include: { familyMember: true, payments: true }
            }),
            prisma.fixedExpense.findMany({
                where: { userId, isActive: true },
                include: { payments: { take: 3, orderBy: { paymentDate: 'desc' } } }
            }),
            prisma.transaction.findMany({
                where: {
                    userId,
                    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
                },
                orderBy: { date: 'desc' },
                take: 100
            })
        ]);

        // Calcular totais
        let totalCardDebt = 0;
        cardDebts.forEach(card => {
            card.purchases.forEach(p => {
                const remaining = p.installments - p.paidInstallments;
                totalCardDebt += remaining * p.installmentAmount;
            });
        });

        const totalThirdPartyDebt = thirdPartyLoans.reduce((sum, l) => sum + l.currentBalance, 0);
        const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

        const exportData = {
            generatedAt: new Date().toISOString(),
            period: {
                start: startDate || 'Início',
                end: endDate || 'Atual'
            },
            user: {
                name: user?.name,
                email: user?.email
            },
            summary: {
                totalCardDebt,
                totalThirdPartyDebt,
                totalFixedExpenses,
                grandTotal: totalCardDebt + totalThirdPartyDebt
            },
            cardDebts: cardDebts.map(card => ({
                cardholder: card.cardholderName,
                lastDigits: card.lastFourDigits,
                dueDay: card.dueDay,
                totalDebt: card.totalDebt,
                purchases: card.purchases.map(p => ({
                    description: p.description,
                    date: p.purchaseDate,
                    total: p.totalAmount,
                    installments: `${p.paidInstallments}/${p.installments}`,
                    remaining: (p.installments - p.paidInstallments) * p.installmentAmount,
                    who: p.familyMember ? `${p.familyMember.name} ${p.familyMember.lastName}` : 'Usuário principal'
                }))
            })),
            thirdPartyLoans: thirdPartyLoans.map(l => ({
                creditor: l.creditorName,
                principal: l.principalAmount,
                currentBalance: l.currentBalance,
                interestRate: l.monthlyInterest,
                startDate: l.startDate,
                who: l.familyMember ? `${l.familyMember.name} ${l.familyMember.lastName}` : 'Usuário principal',
                totalPaid: l.payments.reduce((sum, p) => sum + p.amount, 0)
            })),
            fixedExpenses: fixedExpenses.map(e => ({
                name: e.name,
                amount: e.amount,
                dueDay: e.dueDay,
                category: e.category
            })),
            recentTransactions: transactions.slice(0, 20).map(t => ({
                date: t.date,
                type: t.type,
                description: t.description,
                amount: t.amount,
                category: t.category
            }))
        };

        res.json(exportData);
    } catch (error: any) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Erro ao exportar dados' });
    }
});

export { router as historyRouter };
