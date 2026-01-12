'use client';

import { useEffect, useState } from 'react';

interface FinancialHealth {
    color: string;
    status: string;
    healthScore: number;
    debtRatio: string;
    totalIncome: number;
    totalExpenses: number;
    totalDebt: number;
    suggestions: string[];
}

export default function Dashboard() {
    const [health, setHealth] = useState<FinancialHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data para demonstração
        // Em produção, isso virá da API
        setTimeout(() => {
            setHealth({
                color: '#FF4500',
                status: 'concerning',
                healthScore: 2,
                debtRatio: '65.5',
                totalIncome: 5000,
                totalExpenses: 3200,
                totalDebt: 3275,
                suggestions: [
                    'Priorize pagar as dívidas com maior taxa de juros primeiro',
                    'Tente reduzir gastos não essenciais em 20%',
                    'Considere renegociar dívidas de cartão de crédito'
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusText = (status: string) => {
        const texts: Record<string, string> = {
            critical: 'Situação Crítica',
            concerning: 'Preocupante',
            attention: 'Atenção Necessária',
            controlled: 'Controlado',
            healthy: 'Saudável',
            saving: 'Poupando',
            excellent: 'Excelente!'
        };
        return texts[status] || status;
    };

    const getStatusEmoji = (status: string) => {
        const emojis: Record<string, string> = {
            critical: '🔴',
            concerning: '🟠',
            attention: '🟡',
            controlled: '🟢',
            healthy: '💚',
            saving: '🔵',
            excellent: '💙'
        };
        return emojis[status] || '⚪';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!health) return null;

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-12 fade-in-up">
                    <h1 className="text-5xl font-bold gradient-text mb-4">
                        💰 Sistema Financeiro
                    </h1>
                    <p className="text-xl text-gray-400">
                        Gerencie suas finanças de forma inteligente
                    </p>
                </header>

                {/* Health Status Card */}
                <div
                    className="glass rounded-3xl p-8 mb-8 fade-in-up"
                    style={{
                        borderLeft: `8px solid ${health.color}`,
                        boxShadow: `0 0 40px ${health.color}40`
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <span className="text-6xl">{getStatusEmoji(health.status)}</span>
                            <div>
                                <h2 className="text-3xl font-bold" style={{ color: health.color }}>
                                    {getStatusText(health.status)}
                                </h2>
                                <p className="text-gray-400 mt-1">
                                    {health.debtRatio}% da renda comprometida
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Score de Saúde</div>
                            <div className="text-5xl font-bold" style={{ color: health.color }}>
                                {health.healthScore}/7
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-6">
                        <div
                            className="absolute h-full transition-all duration-1000"
                            style={{
                                width: `${(health.healthScore / 7) * 100}%`,
                                background: `linear-gradient(90deg, ${health.color}, ${health.color}dd)`
                            }}
                        ></div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="text-sm text-gray-400 mb-1">💵 Renda Mensal</div>
                            <div className="text-2xl font-bold text-green-400">
                                R$ {health.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="text-sm text-gray-400 mb-1">💸 Despesas</div>
                            <div className="text-2xl font-bold text-orange-400">
                                R$ {health.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="text-sm text-gray-400 mb-1">🔴 Dívidas Totais</div>
                            <div className="text-2xl font-bold text-red-400">
                                R$ {health.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Suggestions */}
                <div className="glass rounded-3xl p-8 mb-8 fade-in-up">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span className="text-3xl">🤖</span>
                        Sugestões da IA
                    </h3>
                    <div className="space-y-4">
                        {health.suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors"
                            >
                                <span className="text-2xl">{index + 1}.</span>
                                <p className="text-lg text-gray-300">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in-up">
                    <button className="glass rounded-2xl p-6 btn hover:scale-105 transition-transform">
                        <span className="text-4xl mb-2 block">💳</span>
                        <h4 className="text-xl font-semibold">Cartões</h4>
                        <p className="text-gray-400 text-sm mt-1">Gerenciar cartões</p>
                    </button>

                    <button className="glass rounded-2xl p-6 btn hover:scale-105 transition-transform">
                        <span className="text-4xl mb-2 block">📊</span>
                        <h4 className="text-xl font-semibold">Transações</h4>
                        <p className="text-gray-400 text-sm mt-1">Ver histórico</p>
                    </button>

                    <button className="glass rounded-2xl p-6 btn hover:scale-105 transition-transform">
                        <span className="text-4xl mb-2 block">🎯</span>
                        <h4 className="text-xl font-semibold">Metas</h4>
                        <p className="text-gray-400 text-sm mt-1">Definir objetivos</p>
                    </button>

                    <button className="glass rounded-2xl p-6 btn hover:scale-105 transition-transform">
                        <span className="text-4xl mb-2 block">💬</span>
                        <h4 className="text-xl font-semibold">Chat IA</h4>
                        <p className="text-gray-400 text-sm mt-1">Conversar</p>
                    </button>
                </div>

                {/* Upload Receipt */}
                <div className="glass rounded-3xl p-8 mt-8 text-center fade-in-up">
                    <h3 className="text-2xl font-bold mb-4">📸 Envie um Comprovante</h3>
                    <p className="text-gray-400 mb-6">
                        Tire uma foto do comprovante e a IA irá processar automaticamente
                    </p>
                    <button className="btn bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-transform">
                        Fazer Upload
                    </button>
                </div>
            </div>
        </div>
    );
}
