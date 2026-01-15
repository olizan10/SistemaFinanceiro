'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Debt {
    id: string;
    type: string;
    name: string;
    balance: number;
    interestRate: number;
    icon: string;
}

interface Scenario {
    monthlyPayment: number;
    months: number;
    years: string;
    totalPaid: number;
    savings: number;
}

interface SimulationResult {
    success: boolean;
    debtInfo: {
        name: string;
        currentBalance: number;
        monthlyInterestRate: number;
    };
    simulation: {
        monthlyPayment: number;
        totalMonths: number;
        totalYears: string;
        totalPaid: number;
        totalInterest: number;
        payoffDate: string;
        monthlyBreakdown: any[];
    };
    alternativeScenarios: Scenario[];
    recommendation: string;
}

export default function DebtSimulatorPage() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingDebts, setLoadingDebts] = useState(true);

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debt-simulator/debts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setDebts(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingDebts(false);
        }
    };

    const handleSimulate = async () => {
        if (!selectedDebt || !monthlyPayment) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debt-simulator/simulate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    debtType: selectedDebt.type,
                    debtId: selectedDebt.id,
                    monthlyPayment: parseFloat(monthlyPayment)
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <DashboardLayout title="Simulador de Quitação" subtitle="Calcule quanto tempo para quitar suas dívidas">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seleção de Dívida */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        📊 Selecione uma dívida
                    </h3>

                    {loadingDebts ? (
                        <div className="flex justify-center py-8">
                            <div className="spinner w-8 h-8"></div>
                        </div>
                    ) : debts.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="text-6xl block mb-4">🎉</span>
                            <p className="text-gray-600 dark:text-gray-400">
                                Você não possui dívidas ativas!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {debts.map((debt) => (
                                <button
                                    key={debt.id}
                                    onClick={() => {
                                        setSelectedDebt(debt);
                                        setResult(null);
                                    }}
                                    className={`w-full p-4 rounded-xl text-left transition-all ${selectedDebt?.id === debt.id
                                            ? 'bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500'
                                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{debt.icon}</span>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {debt.name}
                                                </p>
                                                {debt.interestRate > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        {debt.interestRate.toFixed(2)}% a.m.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="font-bold text-red-600">
                                            {formatCurrency(debt.balance)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedDebt && (
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    💰 Quanto você pode pagar por mês?
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={monthlyPayment}
                                        onChange={(e) => setMonthlyPayment(e.target.value)}
                                        className="flex-1 px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                                        placeholder="R$ 0,00"
                                    />
                                    <button
                                        onClick={handleSimulate}
                                        disabled={loading || !monthlyPayment}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50"
                                    >
                                        {loading ? '⏳' : '🔍 Simular'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resultado da Simulação */}
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        📈 Resultado da Simulação
                    </h3>

                    {!result ? (
                        <div className="text-center py-12">
                            <span className="text-6xl block mb-4">🧮</span>
                            <p className="text-gray-500">
                                Selecione uma dívida e informe o pagamento mensal
                            </p>
                        </div>
                    ) : !result.success ? (
                        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl">
                            <p className="text-red-600">⚠️ Pagamento insuficiente</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Resumo Principal */}
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tempo para Quitar</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {result.simulation.totalMonths} meses
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ({result.simulation.totalYears} anos)
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Data Prevista</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            📅 {result.simulation.payoffDate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Detalhes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                    <p className="text-xs text-gray-500">Total a Pagar</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(result.simulation.totalPaid)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                    <p className="text-xs text-gray-500">Total de Juros</p>
                                    <p className="font-bold text-orange-600">
                                        {formatCurrency(result.simulation.totalInterest)}
                                    </p>
                                </div>
                            </div>

                            {/* Recomendação */}
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    {result.recommendation}
                                </p>
                            </div>

                            {/* Cenários Alternativos */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                    🎯 Outras Opções
                                </h4>
                                <div className="space-y-2">
                                    {result.alternativeScenarios.map((scenario, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div>
                                                <span className="font-medium">
                                                    {formatCurrency(scenario.monthlyPayment)}/mês
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{scenario.months} meses</p>
                                                {scenario.savings > 0 && (
                                                    <p className="text-xs text-green-600">
                                                        Economia: {formatCurrency(scenario.savings)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
