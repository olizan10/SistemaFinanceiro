'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface FixedExpense {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    category: string;
    isActive: boolean;
    lastPaidDate: string | null;
    daysUntilDue: number;
    isOverdue: boolean;
}

const categoryIcons: Record<string, string> = {
    utility: '💡',
    subscription: '📱',
    insurance: '🛡️',
    rent: '🏠',
    other: '📋'
};

const categoryLabels: Record<string, string> = {
    utility: 'Utilidades',
    subscription: 'Assinaturas',
    insurance: 'Seguros',
    rent: 'Aluguel',
    other: 'Outros'
};

export default function FixedExpensesPage() {
    const [expenses, setExpenses] = useState<FixedExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        dueDay: '',
        category: 'utility'
    });

    useEffect(() => { fetchExpenses(); }, []);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fixed-expenses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setExpenses(await response.json());
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fixed-expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                fetchExpenses();
                setIsModalOpen(false);
                setFormData({ name: '', amount: '', dueDay: '', category: 'utility' });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fixed-expenses/${id}/pay`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchExpenses();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta conta fixa?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fixed-expenses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchExpenses();
    };

    const total = expenses.filter(e => e.isActive).reduce((s, e) => s + e.amount, 0);
    const upcoming = expenses.filter(e => e.daysUntilDue <= 7 && e.daysUntilDue >= 0);
    const overdue = expenses.filter(e => e.isOverdue);

    if (loading) {
        return (
            <DashboardLayout title="Contas Fixas" subtitle="Água, luz, internet e mais">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Contas Fixas" subtitle="Água, luz, internet e mais">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Mensal</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-yellow-600/20 to-orange-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Próximos 7 dias</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {upcoming.length} conta{upcoming.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Atrasadas</p>
                    <p className="text-2xl font-bold text-red-600">
                        {overdue.length}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Nova Conta
                    </button>
                </div>
            </div>

            {/* Upcoming Alert */}
            {upcoming.length > 0 && (
                <div className="glass rounded-2xl p-4 mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⏰</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Contas vencendo em breve!</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {upcoming.map(e => e.name).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses List */}
            {expenses.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma conta fixa</h3>
                    <p className="text-gray-500 mb-6">Cadastre suas contas recorrentes como água, luz, internet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenses.map((expense) => (
                        <div key={expense.id} className={`glass rounded-2xl p-6 hover:shadow-xl transition-all group ${expense.isOverdue ? 'border-2 border-red-500/50' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{categoryIcons[expense.category] || '📋'}</span>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{expense.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {categoryLabels[expense.category]} • Dia {expense.dueDay}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${expense.isOverdue ? 'bg-red-100 text-red-700' :
                                        expense.daysUntilDue <= 3 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>
                                    {expense.isOverdue ? 'Atrasada' : `${expense.daysUntilDue} dias`}
                                </span>
                            </div>

                            <button
                                onClick={() => handleMarkAsPaid(expense.id)}
                                className="w-full py-2 bg-green-500/20 text-green-600 rounded-lg font-medium hover:bg-green-500/30 transition-colors"
                            >
                                ✓ Marcar como Paga
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Conta Fixa">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome da Conta *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            placeholder="Ex: Luz, Água, Internet..."
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor Médio *</label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Dia Vencimento *</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.dueDay}
                                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="1-31"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Categoria</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                            <option value="utility">💡 Utilidades (Água, Luz, Gás)</option>
                            <option value="subscription">📱 Assinaturas (Netflix, Spotify)</option>
                            <option value="insurance">🛡️ Seguros</option>
                            <option value="rent">🏠 Aluguel</option>
                            <option value="other">📋 Outros</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold">Cadastrar</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
