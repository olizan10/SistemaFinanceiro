'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface FeesSummary {
    year: number;
    summary: {
        totalCardFees: number;
        totalThirdPartyInterest: number;
        totalFees: number;
        projectedAnnualInterest: number;
        potentialSavings: number;
    };
    byMonth: {
        labels: string[];
        cardFees: number[];
        thirdPartyInterest: number[];
    };
    byCard: { [key: string]: number };
    byCreditor: { [key: string]: number };
}

interface CardFee {
    id: string;
    name: string;
    cardholder: string;
    totalDebt: number;
    totalFees: number;
    feePercentage: string | number;
    purchasesCount: number;
}

interface CreditorInterest {
    id: string;
    creditor: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    totalPaid: number;
    interestPaid: number;
    projectedAnnualInterest: number;
    status: string;
    who: string;
}

export default function FeesPage() {
    const [summary, setSummary] = useState<FeesSummary | null>(null);
    const [cards, setCards] = useState<CardFee[]>([]);
    const [creditors, setCreditors] = useState<CreditorInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'creditors'>('overview');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [summaryRes, cardsRes, creditorsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees/cards`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees/creditors`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            setSummary(await summaryRes.json());
            setCards(await cardsRes.json());
            setCreditors(await creditorsRes.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <DashboardLayout title="Taxas e Juros" subtitle="Quanto você paga em taxas e juros">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Taxas e Juros" subtitle="Quanto você paga em taxas e juros">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💸 Total em Taxas/Juros</p>
                    <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(summary?.summary.totalFees || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Este ano</p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💳 Taxas Cartão</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(summary?.summary.totalCardFees || 0)}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">🤝 Juros Terceiros</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(summary?.summary.totalThirdPartyInterest || 0)}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💡 Economia Potencial</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary?.summary.potentialSavings || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Se quitar mais rápido</p>
                </div>
            </div>

            {/* Warning Box */}
            {(summary?.summary.projectedAnnualInterest || 0) > 0 && (
                <div className="glass rounded-2xl p-6 mb-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">⚠️</div>
                        <div>
                            <p className="font-bold text-lg text-amber-700 dark:text-amber-400">
                                Projeção de Juros: {formatCurrency(summary?.summary.projectedAnnualInterest || 0)}/ano
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Se continuar pagando apenas o mínimo, você gastará esse valor em juros com terceiros.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'overview'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                >
                    📊 Visão Geral
                </button>
                <button
                    onClick={() => setActiveTab('cards')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'cards'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                >
                    💳 Por Cartão ({cards.length})
                </button>
                <button
                    onClick={() => setActiveTab('creditors')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'creditors'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                >
                    🤝 Por Credor ({creditors.length})
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && summary && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribution Pie Chart */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">🥧 Distribuição de Custos</h3>
                        <div className="flex items-center justify-center gap-8">
                            {/* SVG Pie Chart */}
                            <div className="relative w-40 h-40 flex-shrink-0">
                                {(summary.summary.totalCardFees > 0 || summary.summary.totalThirdPartyInterest > 0) ? (
                                    <>
                                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                            {(() => {
                                                const cardPercent = summary.summary.totalFees > 0
                                                    ? (summary.summary.totalCardFees / summary.summary.totalFees) * 100
                                                    : 50;
                                                const interestPercent = 100 - cardPercent;

                                                return (
                                                    <>
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            fill="transparent"
                                                            stroke="#8B5CF6"
                                                            strokeWidth="20"
                                                            strokeDasharray={`${cardPercent} ${interestPercent}`}
                                                            strokeDashoffset="0"
                                                        />
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            fill="transparent"
                                                            stroke="#F97316"
                                                            strokeWidth="20"
                                                            strokeDasharray={`${interestPercent} ${cardPercent}`}
                                                            strokeDashoffset={-cardPercent}
                                                        />
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(summary.summary.totalFees)}
                                                </p>
                                                <p className="text-xs text-gray-500">Total</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl">✨</span>
                                    </div>
                                )}
                            </div>
                            {/* Legend */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxas Cartão</p>
                                        <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.summary.totalCardFees)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Juros Terceiros</p>
                                        <p className="text-lg font-bold text-orange-600">{formatCurrency(summary.summary.totalThirdPartyInterest)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Bar Chart */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">📈 Distribuição por Mês</h3>
                        <div className="grid grid-cols-12 gap-2">
                            {summary.byMonth.labels.map((month, index) => {
                                const cardFee = summary.byMonth.cardFees[index] || 0;
                                const interest = summary.byMonth.thirdPartyInterest[index] || 0;
                                const total = cardFee + interest;
                                const maxValue = Math.max(...summary.byMonth.cardFees, ...summary.byMonth.thirdPartyInterest, 100);
                                const height = (total / maxValue) * 100;

                                return (
                                    <div key={month} className="flex flex-col items-center">
                                        <div className="h-24 w-full flex flex-col-reverse rounded-t-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                            <div
                                                className="bg-gradient-to-t from-purple-500 to-pink-500 w-full"
                                                style={{ height: `${height}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">{month}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Cards Tab */}
            {activeTab === 'cards' && (
                <div className="space-y-4">
                    {cards.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-4">💳</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma taxa de cartão</h3>
                            <p className="text-gray-500">Suas taxas de cartão aparecerão aqui.</p>
                        </div>
                    ) : (
                        cards.map((card) => (
                            <div key={card.id} className="glass rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                                            💳
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">{card.name}</p>
                                            <p className="text-sm text-gray-500">{card.cardholder} • {card.purchasesCount} compras</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Taxa Total</p>
                                        <p className="text-xl font-bold text-red-600">{formatCurrency(card.totalFees)}</p>
                                        <p className="text-xs text-gray-500">{card.feePercentage}% da dívida</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Creditors Tab */}
            {activeTab === 'creditors' && (
                <div className="space-y-4">
                    {creditors.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-4">🤝</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum empréstimo ativo</h3>
                            <p className="text-gray-500">Seus juros com terceiros aparecerão aqui.</p>
                        </div>
                    ) : (
                        creditors.map((creditor) => (
                            <div key={creditor.id} className="glass rounded-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xl">
                                            🤝
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-gray-900 dark:text-white">{creditor.creditor}</p>
                                            <p className="text-sm text-gray-500">
                                                {creditor.interestRate}%/mês • {creditor.who}
                                                {creditor.status === 'paid' && <span className="ml-2 text-green-500">✅ Quitado</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Juros Projetados/Ano</p>
                                        <p className="text-xl font-bold text-red-600">{formatCurrency(creditor.projectedAnnualInterest)}</p>
                                        <p className="text-xs text-gray-500">Saldo: {formatCurrency(creditor.currentBalance)}</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Pago: {formatCurrency(creditor.totalPaid)}</span>
                                        <span>Emprestado: {formatCurrency(creditor.principal)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                            style={{ width: `${Math.min((creditor.totalPaid / creditor.principal) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
