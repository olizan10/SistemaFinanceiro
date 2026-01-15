import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { accountRouter } from './routes/account.routes';
import { transactionRouter } from './routes/transaction.routes';
import { creditCardRouter } from './routes/creditCard.routes';
import { loanRouter } from './routes/loan.routes';
import { budgetRouter } from './routes/budget.routes';
import { goalRouter } from './routes/goal.routes';
import { aiRouter } from './routes/ai.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { receiptRouter } from './routes/receipt.routes';
import { thirdPartyLoanRouter } from './routes/thirdPartyLoan.routes';
import { fixedExpenseRouter } from './routes/fixedExpense.routes';
import { cardDebtRouter } from './routes/cardDebt.routes';
import { familyMemberRouter } from './routes/familyMember.routes';
import { chatHistoryRouter } from './routes/chatHistory.routes';
import { historyRouter } from './routes/history.routes';
import { alertsRouter } from './routes/alerts.routes';
import { feesRouter } from './routes/fees.routes';
import variableExpensesRouter from './routes/variable-expenses.routes';
import debtSimulatorRouter from './routes/debt-simulator.routes';
import reportsRouter from './routes/reports.routes';
import investmentsRouter from './routes/investments.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Sistema Financeiro API is running' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/credit-cards', creditCardRouter);
app.use('/api/loans', loanRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/goals', goalRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/receipts', receiptRouter);
app.use('/api/third-party-loans', thirdPartyLoanRouter);
app.use('/api/fixed-expenses', fixedExpenseRouter);
app.use('/api/card-debts', cardDebtRouter);
app.use('/api/family-members', familyMemberRouter);
app.use('/api/chat-history', chatHistoryRouter);
app.use('/api/history', historyRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/fees', feesRouter);
app.use('/api/variable-expenses', variableExpensesRouter);
app.use('/api/debt-simulator', debtSimulatorRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/investments', investmentsRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
