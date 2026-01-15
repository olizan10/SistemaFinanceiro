'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Investment {
    id: string;
    name: string;
    type: string;
    institution: string;
    initialAmount: number;
    currentValue: number;
    purchaseDate: string;
    notes?: string;
}

interface Summary {
    totalInvested: number;
    totalCurrent: number;
    totalReturn: number;
    returnPercent: string;
    count: number;
}

const investmentTypes = [
    { value: 'renda_fixa', label: 'Renda Fixa', icon: '📈' },
    { value: 'acoes', label: 'Ações', icon: '📊' },
    { value: 'fundos', label: 'Fundos', icon: '🏦' },
    { value: 'cripto', label: 'Criptomoedas', icon: '₿' },
    { value: 'imoveis', label: 'Imóveis', icon: '🏠' },
    { value: 'tesouro', label: 'Tesouro Direto', icon: '🇧🇷' },
    { value: 'outros', label: 'Outros', icon: '💰' }
];

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [byType, setByType] = useState<Record<string, { invested: number; current: number; count: number }>>({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '', type: 'renda_fixa', institution: '',
        initialAmount: '', currentValue: '', purchaseDate: '', notes: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/investments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setInvestments(data.investments || []);
            setSummary(data.summary);
            setByType(data.byType || {});
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/investments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });
            setShowModal(false);
            setForm({ name: '', type: 'renda_fixa', institution: '', initialAmount: '', currentValue: '', purchaseDate: '', notes: '' });
            fetchData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este investimento?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/investments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const formatCurrency = (val: number) =>
        `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const getTypeInfo = (type: string) =>
        investmentTypes.find(t => t.value === type) || { label: type, icon: '💰' };

    if (loading) {
        return (
            <DashboardLayout title="Investimentos" subtitle="Acompanhe seu portfólio">
                <div className="flex justify-center py-12"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Investimentos" subtitle="Acompanhe seu portfólio">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <p className="text-sm text-gray-500 mb-1">💰 Total Investido</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(summary?.totalInvested || 0)}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                    <p className="text-sm text-gray-500 mb-1">📊 Valor Atual</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary?.totalCurrent || 0)}
                    </p>
                </div>
                <div className={`glass rounded-2xl p-6 ${(summary?.totalReturn || 0) >= 0 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-red-500/20 to-rose-500/20'}`}>
                    <p className="text-sm text-gray-500 mb-1">📈 Retorno</p>
                    <p className={`text-2xl font-bold ${(summary?.totalReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(summary?.totalReturn || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.totalReturn || 0)}
                    </p>
                    <p className={`text-sm ${(summary?.totalReturn || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary?.returnPercent || 0}%
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 mb-1">🎯 Ativos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary?.count || 0}
                    </p>
                </div>
            </div>

            {/* Add Button */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                    + Novo Investimento
                </button>
            </div>

            {/* Distribution by Type */}
            {Object.keys(byType).length > 0 && (
                <div className="glass rounded-2xl p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        📊 Distribuição por Tipo
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(byType).map(([type, data]) => {
                            const info = getTypeInfo(type);
                            const percent = summary?.totalCurrent
                                ? ((data.current / summary.totalCurrent) * 100).toFixed(1)
                                : 0;
                            return (
                                <div key={type} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{info.icon}</span>
                                        <span className="font-medium">{info.label}</span>
                                    </div>
                                    <p className="text-lg font-bold">{formatCurrency(data.current)}</p>
                                    <p className="text-sm text-gray-500">{percent}% do total</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Investments List */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    💼 Meus Investimentos
                </h3>

                {investments.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="text-6xl block mb-4">📈</span>
                        <p className="text-gray-500 mb-4">Você ainda não tem investimentos cadastrados</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl"
                        >
                            Adicionar Primeiro Investimento
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {investments.map(inv => {
                            const info = getTypeInfo(inv.type);
                            const returnVal = inv.currentValue - inv.initialAmount;
                            const returnPct = inv.initialAmount > 0 ? (returnVal / inv.initialAmount) * 100 : 0;
                            return (
                                <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{info.icon}</span>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{inv.name}</p>
                                            <p className="text-sm text-gray-500">{inv.institution || info.label}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">{formatCurrency(inv.currentValue)}</p>
                                        <p className={`text-sm ${returnVal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {returnVal >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(inv.id)}
                                        className="ml-4 text-red-500 hover:text-red-700"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold mb-4">Novo Investimento</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nome do investimento"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                                required
                            />
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                            >
                                {investmentTypes.map(t => (
                                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Instituição (ex: XP, Nubank)"
                                value={form.institution}
                                onChange={e => setForm({ ...form, institution: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    placeholder="Valor inicial"
                                    value={form.initialAmount}
                                    onChange={e => setForm({ ...form, initialAmount: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Valor atual"
                                    value={form.currentValue}
                                    onChange={e => setForm({ ...form, currentValue: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <input
                                type="date"
                                value={form.purchaseDate}
                                onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
