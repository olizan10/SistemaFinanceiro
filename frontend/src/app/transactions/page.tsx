'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
    date: string;
    isPaid: boolean;
    responsiblePerson: string;
    account?: { id: string; name: string };
    creditCard?: { id: string; name: string };
}

interface Account {
    id: string;
    name: string;
}

const categories = {
    income: [
        { value: 'salary', label: 'Salário', icon: '💼' },
        { value: 'freelance', label: 'Freelance', icon: '💻' },
        { value: 'investment', label: 'Investimentos', icon: '📈' },
        { value: 'gift', label: 'Presente', icon: '🎁' },
        { value: 'other', label: 'Outros', icon: '💵' },
    ],
    expense: [
        { value: 'food', label: 'Alimentação', icon: '🍔' },
        { value: 'transport', label: 'Transporte', icon: '🚗' },
        { value: 'housing', label: 'Moradia', icon: '🏠' },
        { value: 'health', label: 'Saúde', icon: '💊' },
        { value: 'education', label: 'Educação', icon: '📚' },
        { value: 'entertainment', label: 'Lazer', icon: '🎮' },
        { value: 'shopping', label: 'Compras', icon: '🛍️' },
        { value: 'utilities', label: 'Contas', icon: '💡' },
        { value: 'subscription', label: 'Assinaturas', icon: '📺' },
        { value: 'other', label: 'Outros', icon: '📦' },
    ],
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState({ type: '', category: '', period: '30', responsiblePerson: '' });
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });

    const [formData, setFormData] = useState({
        type: 'expense' as 'income' | 'expense',
        category: 'food',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        accountId: '',
        isPaid: true,
        responsiblePerson: 'eu'
    });

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(filter.period));

        try {
            const [transRes, accRes, summRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?startDate=${startDate.toISOString()}${filter.type ? `&type=${filter.type}` : ''}${filter.category ? `&category=${filter.category}` : ''}${filter.responsiblePerson ? `&responsiblePerson=${filter.responsiblePerson}` : ''}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/summary?startDate=${startDate.toISOString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const [transData, accData, summData] = await Promise.all([
                transRes.json(),
                accRes.json(),
                summRes.json()
            ]);

            setTransactions(transData);
            setAccounts(accData);
            setSummary(summData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchData();
                setIsModalOpen(false);
                setFormData({
                    type: 'expense',
                    category: 'food',
                    amount: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    accountId: '',
                    isPaid: true,
                    responsiblePerson: 'eu'
                });
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
        const token = localStorage.getItem('token');

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const getCategoryInfo = (type: string, category: string) => {
        const list = type === 'income' ? categories.income : categories.expense;
        return list.find(c => c.value === category) || { label: category, icon: '📦' };
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    if (loading) {
        return (
            <DashboardLayout title="Transações" subtitle="Suas receitas e despesas">
                <div className="flex items-center justify-center h-64">
                    <div className="spinner w-12 h-12"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Transações" subtitle="Suas receitas e despesas">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Receitas</p>
                    <p className="text-2xl font-bold text-green-600">
                        + R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Despesas</p>
                    <p className="text-2xl font-bold text-red-600">
                        - R$ {summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Saldo do Período</p>
                    <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-4">
                <select
                    value={filter.type}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                >
                    <option value="">Todos os tipos</option>
                    <option value="income">💰 Receitas</option>
                    <option value="expense">💸 Despesas</option>
                </select>
                <select
                    value={filter.period}
                    onChange={(e) => setFilter({ ...filter, period: e.target.value })}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                >
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 3 meses</option>
                    <option value="365">Último ano</option>
                </select>
                <select
                    value={filter.responsiblePerson}
                    onChange={(e) => setFilter({ ...filter, responsiblePerson: e.target.value })}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                >
                    <option value="">Todos</option>
                    <option value="eu">👤 Eu</option>
                    <option value="spouse">👩 Esposa</option>
                    <option value="both">👥 Casal</option>
                </select>
            </div>

            {/* Transactions List */}
            {transactions.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Nenhuma transação encontrada
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Adicione sua primeira transação para acompanhar suas finanças.
                    </p>
                </div>
            ) : (
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {transactions.map((transaction) => {
                            const catInfo = getCategoryInfo(transaction.type, transaction.category);
                            return (
                                <div
                                    key={transaction.id}
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                                            {catInfo.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {transaction.description}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {catInfo.label} • {formatDate(transaction.date)}
                                                {transaction.account && ` • ${transaction.account.name}`}
                                                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                    {transaction.responsiblePerson === 'eu' ? '👤 Eu' : transaction.responsiblePerson === 'spouse' ? '👩 Esposa' : '👥 Casal'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <button
                                            onClick={() => handleDelete(transaction.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Transação"
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'expense', category: 'food' })}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.type === 'expense'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            💸 Despesa
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'income', category: 'salary' })}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.type === 'income'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            💰 Receita
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Valor
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-2xl font-bold"
                            placeholder="0,00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descrição
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            placeholder="Ex: Almoço, Uber, Salário..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Categoria
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            >
                                {categories[formData.type].map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Data
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Conta (opcional)
                        </label>
                        <select
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                            <option value="">Sem conta vinculada</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quem Fez
                        </label>
                        <select
                            value={formData.responsiblePerson}
                            onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                            <option value="eu">👤 Eu</option>
                            <option value="spouse">👩 Esposa</option>
                            <option value="both">👥 Casal</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold hover:scale-105 transition-transform ${formData.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                                }`}
                        >
                            Adicionar
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
