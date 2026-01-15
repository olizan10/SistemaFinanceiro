'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface FinancialData {
    income: number;
    expenses: number;
    debts: number;
    available: number;
    creditCardDebt: number;
    loanDebt: number;
    thirdPartyDebt: number;
    upcomingBills: number;
    healthStatus: string;
    healthScore: number;
}

interface AvailableToSpend {
    monthlyIncome: number;
    fixedExpenses: number;
    cardInstallments: number;
    loanInstallments: number;
    variableExpenseAverage: number;
    variableExpenseThisMonth: number;
    totalObligations: number;
    safeToSpend: number;
    spendingStatus: string;
    spendingAdvice: string;
}

interface DebtBreakdown {
    type: string;
    label: string;
    amount: number;
    color: string;
}

interface Alert {
    id: string;
    type: string;
    title: string;
    description: string;
    amount: number;
    dueDate: string;
    daysUntilDue: number;
    priority: string;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [availableToSpend, setAvailableToSpend] = useState<AvailableToSpend | null>(null);
    const [data, setData] = useState<FinancialData>({
        income: 0,
        expenses: 0,
        debts: 0,
        available: 0,
        creditCardDebt: 0,
        loanDebt: 0,
        thirdPartyDebt: 0,
        upcomingBills: 0,
        healthStatus: 'neutral',
        healthScore: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Buscar dados do dashboard e alertas em paralelo
            const [dashboardRes, alertsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/active`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const result = await dashboardRes.json();
            const alertsData = await alertsRes.json();

            const creditCardDebt = result.creditCards?.reduce((s: number, c: any) => s + (c.currentBalance || 0), 0) || 0;
            const loanDebt = result.loans?.reduce((s: number, l: any) => s + (l.remainingAmount || 0), 0) || 0;
            const income = result.financialHealth?.totalIncome || 0;
            const expenses = result.financialHealth?.totalExpenses || 0;

            // Calcular contas próximas a vencer
            const upcomingBillsTotal = alertsData.alerts?.reduce((s: number, a: any) => s + (a.amount || 0), 0) || 0;

            // Dados do saldo disponível
            if (result.availableToSpend) {
                setAvailableToSpend(result.availableToSpend);
            }

            setData({
                income,
                expenses,
                debts: creditCardDebt + loanDebt,
                available: income - expenses,
                creditCardDebt,
                loanDebt,
                thirdPartyDebt: 0,
                upcomingBills: upcomingBillsTotal,
                healthStatus: result.financialHealth?.status || 'neutral',
                healthScore: result.financialHealth?.healthScore || 0
            });

            setAlerts(alertsData.alerts || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getHealthConfig = (status: string) => {
        const configs: Record<string, { label: string; emoji: string; gradient: string; textColor: string; message: string }> = {
            critical: { label: 'Crítico', emoji: '🔴', gradient: 'from-red-900 to-red-700', textColor: 'text-red-500', message: 'Situação crítica! Foque apenas no essencial.' },
            concerning: { label: 'Preocupante', emoji: '🟠', gradient: 'from-orange-900 to-orange-700', textColor: 'text-orange-500', message: 'Atenção! Suas dívidas estão altas.' },
            attention: { label: 'Atenção', emoji: '🟡', gradient: 'from-yellow-900 to-yellow-700', textColor: 'text-yellow-500', message: 'Cuidado com os gastos este mês.' },
            controlled: { label: 'Controlado', emoji: '🟢', gradient: 'from-green-900 to-green-700', textColor: 'text-green-500', message: 'Suas finanças estão sob controle.' },
            healthy: { label: 'Saudável', emoji: '💚', gradient: 'from-green-800 to-green-600', textColor: 'text-green-400', message: 'Parabéns! Continue assim.' },
            saving: { label: 'Poupando', emoji: '🔵', gradient: 'from-blue-900 to-blue-700', textColor: 'text-blue-500', message: 'Ótimo! Você está economizando.' },
            excellent: { label: 'Excelente', emoji: '💙', gradient: 'from-blue-800 to-blue-600', textColor: 'text-blue-400', message: 'Incrível! Finanças exemplares.' },
            neutral: { label: 'Comece Agora', emoji: '🚀', gradient: 'from-purple-600 to-pink-600', textColor: 'text-purple-400', message: 'Cadastre suas finanças para começar!' }
        };
        return configs[status] || configs.neutral;
    };

    const healthConfig = getHealthConfig(data.healthStatus);

    // Debt breakdown for pie chart
    const debtBreakdown: DebtBreakdown[] = [
        { type: 'creditCard', label: 'Cartões', amount: data.creditCardDebt, color: '#EF4444' },
        { type: 'loans', label: 'Empréstimos', amount: data.loanDebt, color: '#F97316' },
        { type: 'thirdParty', label: 'Terceiros', amount: data.thirdPartyDebt, color: '#8B5CF6' },
    ].filter(d => d.amount > 0);

    const totalDebt = debtBreakdown.reduce((s, d) => s + d.amount, 0);

    // Bar chart data
    const maxValue = Math.max(data.income, data.expenses, totalDebt) || 1;
    const barData = [
        { label: 'Receita', value: data.income, color: 'bg-green-500', percentage: (data.income / maxValue) * 100 },
        { label: 'Despesas', value: data.expenses, color: 'bg-red-500', percentage: (data.expenses / maxValue) * 100 },
        { label: 'Dívidas', value: totalDebt, color: 'bg-orange-500', percentage: (totalDebt / maxValue) * 100 },
    ];

    if (loading) {
        return (
            <DashboardLayout title="Dashboard" subtitle="Visão geral das suas finanças">
                <div className="flex items-center justify-center h-64">
                    <div className="spinner w-12 h-12"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Dashboard" subtitle="Visão geral das suas finanças">
            {/* Health Status Card */}
            <div className={`glass rounded-3xl p-8 bg-gradient-to-br ${healthConfig.gradient} mb-8`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl">{healthConfig.emoji}</span>
                            <h2 className="text-3xl font-bold text-white">{healthConfig.label}</h2>
                        </div>
                        <p className="text-lg text-white/80">{healthConfig.message}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-white/60">Saldo Disponível</p>
                        <p className={`text-3xl font-bold ${data.available >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            R$ {data.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">💰 Receita</p>
                        <p className="text-xl font-bold text-green-300">
                            R$ {data.income.toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">💸 Despesas</p>
                        <p className="text-xl font-bold text-red-300">
                            R$ {data.expenses.toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">📊 Total Dívidas</p>
                        <p className="text-xl font-bold text-orange-300">
                            R$ {totalDebt.toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                        <p className="text-sm text-white/70 mb-1">📅 Contas Próximas</p>
                        <p className="text-xl font-bold text-white">
                            R$ {data.upcomingBills.toLocaleString('pt-BR')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Safe to Spend Card */}
            {availableToSpend && (
                <div className={`glass rounded-2xl p-6 mb-8 ${availableToSpend.spendingStatus === 'danger' ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30' :
                        availableToSpend.spendingStatus === 'warning' ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30' :
                            'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                💰 Quanto posso gastar?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {availableToSpend.spendingAdvice}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-4xl font-bold ${availableToSpend.safeToSpend >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                R$ {Math.abs(availableToSpend.safeToSpend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-500">
                                {availableToSpend.safeToSpend >= 0 ? 'disponível para extras' : 'acima da renda'}
                            </p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="text-xs text-gray-500">Renda Estimada</p>
                            <p className="font-bold text-green-600">
                                R$ {availableToSpend.monthlyIncome.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Despesas Fixas</p>
                            <p className="font-bold text-red-600">
                                - R$ {availableToSpend.fixedExpenses.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Parcelas</p>
                            <p className="font-bold text-orange-600">
                                - R$ {(availableToSpend.cardInstallments + availableToSpend.loanInstallments).toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Média Variáveis</p>
                            <p className="font-bold text-purple-600">
                                - R$ {availableToSpend.variableExpenseAverage.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Pie Chart - Debt Distribution */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        📊 Distribuição de Dívidas
                    </h3>

                    {totalDebt === 0 ? (
                        <div className="text-center py-8">
                            <span className="text-4xl">🎉</span>
                            <p className="text-gray-500 mt-2">Nenhuma dívida cadastrada!</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-8">
                            {/* SVG Pie Chart */}
                            <div className="relative w-48 h-48 flex-shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    {(() => {
                                        let cumulativePercent = 0;
                                        return debtBreakdown.map((debt, idx) => {
                                            const percent = (debt.amount / totalDebt) * 100;
                                            const strokeDasharray = `${percent} ${100 - percent}`;
                                            const strokeDashoffset = -cumulativePercent;
                                            cumulativePercent += percent;

                                            return (
                                                <circle
                                                    key={debt.type}
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="transparent"
                                                    stroke={debt.color}
                                                    strokeWidth="20"
                                                    strokeDasharray={strokeDasharray}
                                                    strokeDashoffset={strokeDashoffset}
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            R$ {(totalDebt / 1000).toFixed(1)}k
                                        </p>
                                        <p className="text-xs text-gray-500">Total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex-1 space-y-3">
                                {debtBreakdown.map((debt) => (
                                    <div key={debt.type} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: debt.color }} />
                                            <span className="text-gray-700 dark:text-gray-300">{debt.label}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            R$ {debt.amount.toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bar Chart - Income vs Expenses vs Debt */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        📈 Receita vs Despesas vs Dívidas
                    </h3>

                    <div className="space-y-4">
                        {barData.map((bar) => (
                            <div key={bar.label}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-700 dark:text-gray-300">{bar.label}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        R$ {bar.value.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full ${bar.color} transition-all duration-500 flex items-center justify-end pr-2`}
                                        style={{ width: `${Math.max(bar.percentage, 5)}%` }}
                                    >
                                        {bar.percentage > 20 && (
                                            <span className="text-white text-sm font-medium">
                                                {bar.percentage.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Balance indicator */}
                    <div className="mt-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Balanço Mensal</span>
                            <span className={`text-xl font-bold ${data.available >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.available >= 0 ? '+' : ''} R$ {data.available.toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Link href="/transactions" className="glass rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all text-center">
                    <span className="text-4xl block mb-2">💸</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Nova Despesa</span>
                </Link>
                <Link href="/cards" className="glass rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all text-center">
                    <span className="text-4xl block mb-2">💳</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Cartões</span>
                </Link>
                <Link href="/loans" className="glass rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all text-center">
                    <span className="text-4xl block mb-2">🏦</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Empréstimos</span>
                </Link>
                <Link href="/reports" className="glass rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all text-center">
                    <span className="text-4xl block mb-2">📊</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Relatórios</span>
                </Link>
            </div>

            {/* Upcoming Alerts Widget */}
            {alerts.length > 0 && (
                <div className="glass rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            🔔 Contas Próximas
                        </h3>
                        <Link href="/alerts" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                            Ver todas →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {alerts.slice(0, 4).map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex items-center justify-between p-4 rounded-xl ${alert.priority === 'critical'
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : alert.priority === 'high'
                                        ? 'bg-orange-100 dark:bg-orange-900/30'
                                        : 'bg-gray-100 dark:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {alert.priority === 'critical' ? '🔴' : alert.priority === 'high' ? '🟠' : '🟢'}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {alert.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {alert.daysUntilDue === 0
                                                ? 'Vence hoje!'
                                                : alert.daysUntilDue < 0
                                                    ? `Atrasado há ${Math.abs(alert.daysUntilDue)} dias`
                                                    : `Vence em ${alert.daysUntilDue} dias`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Debt Priority Alert (if in debt) */}
            {totalDebt > 0 && data.available < 0 && (
                <div className="glass rounded-2xl p-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
                    <div className="flex items-start gap-4">
                        <span className="text-4xl">⚠️</span>
                        <div>
                            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                                Atenção: Gastos Superam Receita
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                Suas despesas e dívidas estão maiores que sua receita.
                                Recomendamos focar apenas em gastos essenciais.
                            </p>
                            <div className="flex gap-3">
                                <Link href="/loans" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                                    Ver Dívidas Prioritárias
                                </Link>
                                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium">
                                    Falar com IA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
