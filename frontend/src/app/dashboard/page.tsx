'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AIAssistant from '@/components/AIAssistant';

interface FinancialHealth {
    status: string;
    color: string;
    score: number;
    message: string;
    suggestions: string[];
    metrics: {
        income: number;
        expenses: number;
        debts: number;
        available: number;
        debtRatio: number;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [health, setHealth] = useState<FinancialHealth | null>(null);

    useEffect(() => {
        // Verificar autenticação
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchDashboardData(token);
    }, [router]);

    const fetchDashboardData = async (token: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                    return;
                }
                throw new Error('Erro ao carregar dados');
            }

            const data = await response.json();
            setHealth(data.financialHealth);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner w-16 h-16 mx-auto mb-4"></div>
                    <p className="text-gray-400">Carregando seu dashboard...</p>
                </div>
            </div>
        );
    }

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            critical: 'from-red-900 to-red-700',
            concerning: 'from-orange-900 to-orange-700',
            attention: 'from-yellow-900 to-yellow-700',
            controlled: 'from-green-900 to-green-700',
            healthy: 'from-green-800 to-green-600',
            saving: 'from-blue-900 to-blue-700',
            excellent: 'from-blue-800 to-blue-600'
        };
        return colors[color] || 'from-gray-900 to-gray-700';
    };

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">
                            Dashboard Financeiro
                        </h1>
                        <p className="text-gray-400">
                            Bem-vindo, {user?.name}! 👋
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn glass px-6 py-3 rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                        Sair 🚪
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Saúde Financeira */}
                {health && (
                    <div className={`glass rounded-3xl p-8 bg-gradient-to-br ${getColorClass(health.color)} fade-in-up`}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">
                                    {health.status}
                                </h2>
                                <p className="text-lg opacity-90">
                                    {health.message}
                                </p>
                            </div>
                            <div className="text-6xl">
                                {health.score === 1 && '🔴'}
                                {health.score === 2 && '🟠'}
                                {health.score === 3 && '🟡'}
                                {health.score === 4 && '🟢'}
                                {health.score === 5 && '💚'}
                                {health.score === 6 && '🔵'}
                                {health.score === 7 && '💙'}
                            </div>
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass p-4 rounded-xl">
                                <p className="text-sm opacity-70 mb-1">Renda</p>
                                <p className="text-2xl font-bold">
                                    R$ {health.metrics.income.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="glass p-4 rounded-xl">
                                <p className="text-sm opacity-70 mb-1">Despesas</p>
                                <p className="text-2xl font-bold">
                                    R$ {health.metrics.expenses.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="glass p-4 rounded-xl">
                                <p className="text-sm opacity-70 mb-1">Dívidas</p>
                                <p className="text-2xl font-bold">
                                    R$ {health.metrics.debts.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="glass p-4 rounded-xl">
                                <p className="text-sm opacity-70 mb-1">Disponível</p>
                                <p className="text-2xl font-bold">
                                    R$ {health.metrics.available.toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sugestões da IA */}
                {health && health.suggestions.length > 0 && (
                    <div className="glass rounded-3xl p-8 fade-in-up">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span>💡</span>
                            Sugestões da IA
                        </h3>
                        <div className="space-y-3">
                            {health.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <span className="text-purple-400 mt-1">•</span>
                                    <p className="text-gray-300">{suggestion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Estado vazio para novo usuário */}
                {health && health.metrics.income === 0 && (
                    <div className="glass rounded-3xl p-12 text-center fade-in-up">
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-3xl font-bold mb-4 gradient-text">
                            Comece sua jornada financeira!
                        </h3>
                        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                            Use o assistente de IA 🤖 para adicionar suas primeiras transações, contas e começar a controlar suas finanças.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <div className="glass p-6 rounded-2xl max-w-xs">
                                <div className="text-4xl mb-3">💬</div>
                                <h4 className="font-bold mb-2">Fale com a IA</h4>
                                <p className="text-sm text-gray-400">
                                    "Adicionar renda de R$5000"
                                </p>
                            </div>
                            <div className="glass p-6 rounded-2xl max-w-xs">
                                <div className="text-4xl mb-3">📷</div>
                                <h4 className="font-bold mb-2">Envie Comprovantes</h4>
                                <p className="text-sm text-gray-400">
                                    Tire foto e a IA processa automaticamente
                                </p>
                            </div>
                            <div className="glass p-6 rounded-2xl max-w-xs">
                                <div className="text-4xl mb-3">📊</div>
                                <h4 className="font-bold mb-2">Veja Análises</h4>
                                <p className="text-sm text-gray-400">
                                    Receba insights sobre sua saúde financeira
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legenda de cores */}
                <div className="glass rounded-3xl p-8 fade-in-up">
                    <h3 className="text-2xl font-bold mb-6">
                        Indicadores de Saúde Financeira
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-700"></div>
                            <div>
                                <p className="font-semibold">🔴 Crítico</p>
                                <p className="text-sm text-gray-400">&gt; 70% dívidas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-orange-700"></div>
                            <div>
                                <p className="font-semibold">🟠 Preocupante</p>
                                <p className="text-sm text-gray-400">50-70%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-yellow-700"></div>
                            <div>
                                <p className="font-semibold">🟡 Atenção</p>
                                <p className="text-sm text-gray-400">30-50%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-700"></div>
                            <div>
                                <p className="font-semibold">🟢 Controlado</p>
                                <p className="text-sm text-gray-400">10-30%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-600"></div>
                            <div>
                                <p className="font-semibold">💚 Saudável</p>
                                <p className="text-sm text-gray-400">0-10%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-blue-700"></div>
                            <div>
                                <p className="font-semibold">🔵 Poupando</p>
                                <p className="text-sm text-gray-400">10-20% economia</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                            <div>
                                <p className="font-semibold">💙 Excelente</p>
                                <p className="text-sm text-gray-400">&gt; 20% economia</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assistente de IA */}
            <AIAssistant />
        </div>
    );
}
