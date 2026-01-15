'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface HistoryItem {
    id: string;
    type: string;
    subType: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    isIncome: boolean;
    details?: string;
    installments?: string;
    familyMember?: string;
    feePaid?: number;
}

interface ExportData {
    generatedAt: string;
    user: { name: string; email: string };
    summary: { totalCardDebt: number; totalThirdPartyDebt: number; totalFixedExpenses: number; grandTotal: number };
    cardDebts: any[];
    thirdPartyLoans: any[];
    fixedExpenses: any[];
    recentTransactions: any[];
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        period: '30',
        type: ''
    });
    const [exporting, setExporting] = useState(false);

    useEffect(() => { fetchHistory(); }, [filter]);

    const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(filter.period));

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/history?startDate=${startDate.toISOString()}${filter.type ? `&type=${filter.type}` : ''}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setHistory(await response.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getTypeInfo = (type: string, subType: string) => {
        const types: { [key: string]: { icon: string; color: string; label: string } } = {
            'transaction_income': { icon: '💰', color: 'text-green-500', label: 'Receita' },
            'transaction_expense': { icon: '💸', color: 'text-red-500', label: 'Despesa' },
            'card_purchase': { icon: '💳', color: 'text-purple-500', label: 'Compra Cartão' },
            'card_payment': { icon: '✅', color: 'text-blue-500', label: 'Pagamento Cartão' },
            'third_party_payment': { icon: '🤝', color: 'text-orange-500', label: 'Pagamento Terceiro' },
            'fixed_expense_payment': { icon: '📋', color: 'text-cyan-500', label: 'Conta Fixa' },
            'loan_created': { icon: '📥', color: 'text-amber-500', label: 'Empréstimo' }
        };
        return types[`${type}_${subType}`] || types[type] || { icon: '📌', color: 'text-gray-500', label: type };
    };

    const exportToPDF = async () => {
        setExporting(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data: ExportData = await response.json();

            // Gerar HTML do relatório
            const html = generatePDFHTML(data);

            // Abrir em nova janela para impressão
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => printWindow.print(), 500);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setExporting(false);
        }
    };

    const generatePDFHTML = (data: ExportData) => {
        const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const formatDateBR = (d: string) => new Date(d).toLocaleDateString('pt-BR');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório Financeiro - ${data.user.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; color: #333; padding: 40px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
        .header h1 { color: #8b5cf6; font-size: 28px; margin-bottom: 8px; }
        .header p { color: #666; font-size: 14px; }
        .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 40px; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; }
        .summary-card.danger { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .summary-card h3 { font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .summary-card .value { font-size: 24px; font-weight: bold; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 18px; color: #8b5cf6; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        .amount { font-weight: 600; }
        .amount.negative { color: #ef4444; }
        .amount.positive { color: #22c55e; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px; }
        @media print { body { padding: 0; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório Financeiro</h1>
            <p>${data.user.name} • ${data.user.email}</p>
            <p>Gerado em ${formatDateBR(data.generatedAt)}</p>
        </div>

        <div class="summary">
            <div class="summary-card danger">
                <h3>Total em Dívidas</h3>
                <div class="value">${formatCurrency(data.summary.grandTotal)}</div>
            </div>
            <div class="summary-card">
                <h3>Dívidas de Cartão</h3>
                <div class="value">${formatCurrency(data.summary.totalCardDebt)}</div>
            </div>
            <div class="summary-card">
                <h3>Empréstimos Terceiros</h3>
                <div class="value">${formatCurrency(data.summary.totalThirdPartyDebt)}</div>
            </div>
            <div class="summary-card">
                <h3>Contas Fixas/Mês</h3>
                <div class="value">${formatCurrency(data.summary.totalFixedExpenses)}</div>
            </div>
        </div>

        ${data.cardDebts.length > 0 ? `
        <div class="section">
            <h2 class="section-title">💳 Dívidas de Cartão</h2>
            ${data.cardDebts.map(card => `
                <h4 style="margin: 12px 0 8px 0; color: #666;">${card.cardholder} (**** ${card.lastDigits}) - Vence dia ${card.dueDay}</h4>
                <table>
                    <thead><tr><th>Compra</th><th>Parcelas</th><th>Quem</th><th>Restante</th></tr></thead>
                    <tbody>
                        ${card.purchases.map((p: any) => `
                            <tr>
                                <td>${p.description}</td>
                                <td>${p.installments}</td>
                                <td>${p.who}</td>
                                <td class="amount negative">${formatCurrency(p.remaining)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `).join('')}
        </div>
        ` : ''}

        ${data.thirdPartyLoans.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🤝 Empréstimos com Terceiros</h2>
            <table>
                <thead><tr><th>Credor</th><th>Valor Original</th><th>Juros</th><th>Saldo Atual</th><th>Quem</th></tr></thead>
                <tbody>
                    ${data.thirdPartyLoans.map((l: any) => `
                        <tr>
                            <td>${l.creditor}</td>
                            <td>${formatCurrency(l.principal)}</td>
                            <td>${l.interestRate}%/mês</td>
                            <td class="amount negative">${formatCurrency(l.currentBalance)}</td>
                            <td>${l.who}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${data.fixedExpenses.length > 0 ? `
        <div class="section">
            <h2 class="section-title">📋 Contas Fixas Mensais</h2>
            <table>
                <thead><tr><th>Conta</th><th>Categoria</th><th>Vencimento</th><th>Valor</th></tr></thead>
                <tbody>
                    ${data.fixedExpenses.map((e: any) => `
                        <tr>
                            <td>${e.name}</td>
                            <td>${e.category}</td>
                            <td>Dia ${e.dueDay}</td>
                            <td class="amount">${formatCurrency(e.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            FinançasPRO • Sistema de Gestão de Dívidas
        </div>
    </div>
</body>
</html>`;
    };

    if (loading) {
        return (
            <DashboardLayout title="Histórico" subtitle="Timeline de todas as movimentações">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Histórico" subtitle="Timeline de todas as movimentações">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
                <div className="flex gap-4">
                    <select
                        value={filter.period}
                        onChange={(e) => setFilter({ ...filter, period: e.target.value })}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border-0"
                    >
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 3 meses</option>
                        <option value="365">Último ano</option>
                    </select>
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border-0"
                    >
                        <option value="">Todos os tipos</option>
                        <option value="income">Receitas</option>
                        <option value="expense">Despesas</option>
                    </select>
                </div>
                <button
                    onClick={exportToPDF}
                    disabled={exporting}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                >
                    {exporting ? '⏳ Gerando...' : '📄 Exportar PDF'}
                </button>
            </div>

            {/* Timeline */}
            <div className="glass rounded-2xl p-6">
                {history.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📜</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma movimentação</h3>
                        <p className="text-gray-500">Suas transações aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {history.map((item, index) => {
                            const typeInfo = getTypeInfo(item.type, item.subType);
                            const showDate = index === 0 || formatDate(history[index - 1].date) !== formatDate(item.date);

                            return (
                                <div key={item.id}>
                                    {showDate && (
                                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-6 mb-2 first:mt-0">
                                            {formatDate(item.date)}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors">
                                        <div className="text-2xl">{typeInfo.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {item.description}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                <span className={typeInfo.color}>{typeInfo.label}</span>
                                                {item.details && ` • ${item.details}`}
                                                {item.installments && ` • ${item.installments}`}
                                                {item.familyMember && ` • ${item.familyMember}`}
                                            </p>
                                        </div>
                                        <div className={`text-right font-semibold ${item.isIncome ? 'text-green-500' : 'text-red-500'}`}>
                                            {item.isIncome ? '+' : '-'} R$ {Math.abs(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
