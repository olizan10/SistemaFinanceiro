'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface FinancialHealth {
    status: string;
    color: string;
    score: number;
    suggestions: string[];
    metrics: {
        income: number;
        expenses: number;
        debts: number;
        available: number;
        debtRatio: number;
    };
}

interface QuickStats {
    accounts: number;
    cards: number;
    transactions: number;
    goals: number;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<FinancialHealth | null>(null);
    const [stats, setStats] = useState<QuickStats>({ accounts: 0, cards: 0, transactions: 0, goals: 0 });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            setHealth({
                status: data.financialHealth?.status || 'neutral',
                color: data.financialHealth?.status || 'neutral',
                score: data.financialHealth?.healthScore || 0,
                suggestions: data.financialHealth?.suggestions || [],
                metrics: {
                    income: data.financialHealth?.totalIncome || 0,
                    expenses: data.financialHealth?.totalExpenses || 0,
                    debts: data.financialHealth?.totalDebt || 0,
                    available: (data.financialHealth?.totalIncome || 0) - (data.financialHealth?.totalExpenses || 0),
                    debtRatio: parseFloat(data.financialHealth?.debtRatio) || 0
                }
            });

            setStats({
                accounts: data.accounts?.length || 0,
                cards: data.creditCards?.length || 0,
                transactions: data.recentTransactions?.length || 0,
                goals: data.goals?.length || 0
            });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            neutral: 'Comece Agora',
            critical: 'Crítico',
            concerning: 'Preocupante',
            attention: 'Atenção',
            controlled: 'Controlado',
            healthy: 'Saudável',
            saving: 'Poupando',
            excellent: 'Excelente'
        };
        return labels[status] || 'Comece Agora';
    };

    const getStatusEmoji = (score: number) => {
        const emojis = ['', '🔴', '🟠', '🟡', '🟢', '💚', '🔵', '💙'];
        return emojis[score] || '🚀';
    };

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            neutral: 'from-indigo-500 to-purple-600',
            critical: 'from-red-900 to-red-700',
            concerning: 'from-orange-900 to-orange-700',
            attention: 'from-yellow-900 to-yellow-700',
            controlled: 'from-green-900 to-green-700',
            healthy: 'from-green-800 to-green-600',
            saving: 'from-blue-900 to-blue-700',
            excellent: 'from-blue-800 to-blue-600'
        };
        return colors[color] || 'from-indigo-500 to-purple-600';
    };

    const quickLinks = [
        { href: '/accounts', icon: '🏦', label: 'Contas', count: stats.accounts },
        { href: '/cards', icon: '💳', label: 'Cartões', count: stats.cards },
        { href: '/transactions', icon: '💸', label: 'Transações', count: stats.transactions },
        { href: '/goals', icon: '🎯', label: 'Metas', count: stats.goals },
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
            {/* Financial Health Card */}
            {health && (
                <div className={`glass rounded-3xl p-8 bg-gradient-to-br ${getColorClass(health.color)} mb-8`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {getStatusLabel(health.status)}
                            </h2>
                            <p className="text-lg text-white/80">
                                Sua saúde financeira está {health.status === 'neutral' ? 'pronta para começar' : health.status}
                            </p>
                        </div>
                        <div className="text-6xl">{getStatusEmoji(health.score)}</div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                            <p className="text-sm text-white/70 mb-1">Renda</p>
                            <p className="text-2xl font-bold text-white">
                                R$ {health.metrics.income.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                            <p className="text-sm text-white/70 mb-1">Despesas</p>
                            <p className="text-2xl font-bold text-white">
                                R$ {health.metrics.expenses.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                            <p className="text-sm text-white/70 mb-1">Dívidas</p>
                            <p className="text-2xl font-bold text-white">
                                R$ {health.metrics.debts.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                            <p className="text-sm text-white/70 mb-1">Disponível</p>
                            <p className="text-2xl font-bold text-white">
                                R$ {health.metrics.available.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {quickLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="glass rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{link.icon}</span>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{link.count}</p>
                                <p className="text-sm text-gray-500">{link.label}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* AI Suggestions */}
            {health && health.suggestions.length > 0 && (
                <div className="glass rounded-2xl p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        💡 Sugestões da IA
                    </h3>
                    <div className="space-y-3">
                        {health.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                                <span className="text-purple-500 mt-1">•</span>
                                <p className="text-gray-600 dark:text-gray-300">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    ⚡ Ações Rápidas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/transactions"
                        className="p-4 bg-green-500/10 hover:bg-green-500/20 rounded-xl text-center transition-colors"
                    >
                        <span className="text-2xl block mb-2">💰</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar Receita</span>
                    </Link>
                    <Link
                        href="/transactions"
                        className="p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-center transition-colors"
                    >
                        <span className="text-2xl block mb-2">💸</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar Despesa</span>
                    </Link>
                    <Link
                        href="/goals"
                        className="p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl text-center transition-colors"
                    >
                        <span className="text-2xl block mb-2">🎯</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nova Meta</span>
                    </Link>
                    <Link
                        href="/reports"
                        className="p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-center transition-colors"
                    >
                        <span className="text-2xl block mb-2">📊</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ver Relatórios</span>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
