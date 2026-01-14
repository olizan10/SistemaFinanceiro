'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface Budget {
    id: string;
    category: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
}

const categoryInfo: Record<string, { label: string; icon: string; color: string }> = {
    food: { label: 'Alimentação', icon: '🍔', color: 'from-orange-500 to-red-500' },
    transport: { label: 'Transporte', icon: '🚗', color: 'from-blue-500 to-cyan-500' },
    housing: { label: 'Moradia', icon: '🏠', color: 'from-green-500 to-emerald-500' },
    health: { label: 'Saúde', icon: '💊', color: 'from-pink-500 to-rose-500' },
    education: { label: 'Educação', icon: '📚', color: 'from-purple-500 to-violet-500' },
    entertainment: { label: 'Lazer', icon: '🎮', color: 'from-yellow-500 to-orange-500' },
    shopping: { label: 'Compras', icon: '🛍️', color: 'from-pink-500 to-purple-500' },
    utilities: { label: 'Contas', icon: '💡', color: 'from-gray-500 to-slate-500' },
    subscription: { label: 'Assinaturas', icon: '📺', color: 'from-red-500 to-pink-500' },
    other: { label: 'Outros', icon: '📦', color: 'from-gray-400 to-gray-600' },
};

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ category: 'food', amount: '' });

    useEffect(() => { fetchBudgets(); }, []);

    const fetchBudgets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/budgets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBudgets(await response.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/budgets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                fetchBudgets();
                setIsModalOpen(false);
                setFormData({ category: 'food', amount: '' });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este orçamento?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/budgets/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchBudgets();
    };

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const availableCategories = Object.keys(categoryInfo).filter(
        cat => !budgets.find(b => b.category === cat)
    );

    if (loading) {
        return (
            <DashboardLayout title="Orçamentos" subtitle="Controle seus gastos mensais">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Orçamentos" subtitle="Controle seus gastos mensais">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Orçamento Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Gasto</p>
                    <p className="text-2xl font-bold text-red-600">
                        R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Disponível</p>
                    <p className="text-2xl font-bold text-green-600">
                        R$ {(totalBudget - totalSpent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={availableCategories.length === 0}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        + Novo Orçamento
                    </button>
                </div>
            </div>

            {/* Budgets Grid */}
            {budgets.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum orçamento definido</h3>
                    <p className="text-gray-500 mb-6">Defina limites para suas categorias de gastos.</p>
                    <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Criar Orçamento
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map((budget) => {
                        const info = categoryInfo[budget.category] || { label: budget.category, icon: '📦', color: 'from-gray-500 to-gray-600' };
                        const isOverBudget = budget.percentage > 100;
                        const isWarning = budget.percentage > 80 && budget.percentage <= 100;

                        return (
                            <div key={budget.id} className="glass rounded-2xl p-6 hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl`}>
                                            {info.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{info.label}</h3>
                                            <p className="text-sm text-gray-500">
                                                R$ {budget.spent.toLocaleString('pt-BR')} de R$ {budget.amount.toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(budget.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <div className="mb-2">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all rounded-full ${isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className={`font-medium ${isOverBudget ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-green-500'}`}>
                                        {budget.percentage.toFixed(0)}% usado
                                    </span>
                                    <span className="text-gray-500">
                                        {budget.remaining >= 0 ? `R$ ${budget.remaining.toLocaleString('pt-BR')} restante` : `R$ ${Math.abs(budget.remaining).toLocaleString('pt-BR')} acima`}
                                    </span>
                                </div>

                                {isOverBudget && (
                                    <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                                        <span className="text-red-600 text-sm font-medium">⚠️ Orçamento excedido!</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Orçamento">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                            {availableCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {categoryInfo[cat].icon} {categoryInfo[cat].label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite Mensal</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold"
                            placeholder="0,00"
                            required
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">Criar</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
