'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Summary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    byCategory: Record<string, { income: number; expense: number }>;
}

const categoryColors: Record<string, string> = {
    food: '#FF6384',
    transport: '#36A2EB',
    housing: '#4BC0C0',
    health: '#FF9F40',
    education: '#9966FF',
    entertainment: '#FFCD56',
    shopping: '#FF6384',
    utilities: '#C9CBCF',
    subscription: '#FF6384',
    salary: '#4BC0C0',
    freelance: '#36A2EB',
    investment: '#9966FF',
    other: '#C9CBCF',
};

const categoryLabels: Record<string, string> = {
    food: 'Alimentação',
    transport: 'Transporte',
    housing: 'Moradia',
    health: 'Saúde',
    education: 'Educação',
    entertainment: 'Lazer',
    shopping: 'Compras',
    utilities: 'Contas',
    subscription: 'Assinaturas',
    salary: 'Salário',
    freelance: 'Freelance',
    investment: 'Investimentos',
    other: 'Outros',
};

export default function ReportsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    useEffect(() => { fetchData(); }, [period]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/transactions/summary?startDate=${startDate.toISOString()}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setSummary(await response.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !summary) {
        return (
            <DashboardLayout title="Relatórios" subtitle="Análise das suas finanças">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    const expenseCategories = Object.entries(summary.byCategory)
        .filter(([_, v]) => v.expense > 0)
        .sort((a, b) => b[1].expense - a[1].expense);

    const totalExpenses = expenseCategories.reduce((s, [_, v]) => s + v.expense, 0);

    return (
        <DashboardLayout title="Relatórios" subtitle="Análise das suas finanças">
            {/* Period Filter */}
            <div className="mb-6">
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                >
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 3 meses</option>
                    <option value="180">Últimos 6 meses</option>
                    <option value="365">Último ano</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💰 Receitas</p>
                    <p className="text-3xl font-bold text-green-600">
                        + R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💸 Despesas</p>
                    <p className="text-3xl font-bold text-red-600">
                        - R$ {summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">📊 Saldo</p>
                    <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Expenses by Category */}
            <div className="glass rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Despesas por Categoria</h3>

                {expenseCategories.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhuma despesa no período selecionado.</p>
                ) : (
                    <div className="space-y-4">
                        {expenseCategories.map(([category, values]) => {
                            const percentage = (values.expense / totalExpenses) * 100;
                            return (
                                <div key={category}>
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {categoryLabels[category] || category}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400">
                                            R$ {values.expense.toLocaleString('pt-BR')} ({percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: categoryColors[category] || '#6B7280'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Visual Chart */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Distribuição de Gastos</h3>

                {expenseCategories.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Sem dados para exibir.</p>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6">
                        {/* Simple pie chart representation */}
                        <div className="relative w-64 h-64">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                {(() => {
                                    let cumulativePercent = 0;
                                    return expenseCategories.map(([category, values], idx) => {
                                        const percent = (values.expense / totalExpenses) * 100;
                                        const strokeDasharray = `${percent} ${100 - percent}`;
                                        const strokeDashoffset = -cumulativePercent;
                                        cumulativePercent += percent;

                                        return (
                                            <circle
                                                key={category}
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="transparent"
                                                stroke={categoryColors[category] || '#6B7280'}
                                                strokeWidth="20"
                                                strokeDasharray={strokeDasharray}
                                                strokeDashoffset={strokeDashoffset}
                                                style={{ transition: 'all 0.3s' }}
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        R$ {totalExpenses.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-sm text-gray-500">Total</p>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-col justify-center gap-2">
                            {expenseCategories.slice(0, 8).map(([category, values]) => (
                                <div key={category} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: categoryColors[category] || '#6B7280' }}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {categoryLabels[category] || category}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
