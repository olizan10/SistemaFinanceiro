'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    createdAt: string;
}

const accountTypes = [
    { value: 'checking', label: 'Conta Corrente', icon: '🏦' },
    { value: 'savings', label: 'Poupança', icon: '🐷' },
    { value: 'investment', label: 'Investimento', icon: '📈' },
    { value: 'wallet', label: 'Carteira', icon: '👛' },
];

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'checking',
        balance: '',
        currency: 'BRL'
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = editingAccount
                ? `${process.env.NEXT_PUBLIC_API_URL}/accounts/${editingAccount.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/accounts`;

            const response = await fetch(url, {
                method: editingAccount ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchAccounts();
                closeModal();
            }
        } catch (error) {
            console.error('Error saving account:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    const openModal = (account?: Account) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                name: account.name,
                type: account.type,
                balance: account.balance.toString(),
                currency: account.currency
            });
        } else {
            setEditingAccount(null);
            setFormData({ name: '', type: 'checking', balance: '', currency: 'BRL' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAccount(null);
    };

    const getAccountIcon = (type: string) => {
        return accountTypes.find(t => t.value === type)?.icon || '🏦';
    };

    const getAccountLabel = (type: string) => {
        return accountTypes.find(t => t.value === type)?.label || type;
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    if (loading) {
        return (
            <DashboardLayout title="Contas" subtitle="Gerenciando suas contas bancárias">
                <div className="flex items-center justify-center h-64">
                    <div className="spinner w-12 h-12"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Contas" subtitle="Gerenciando suas contas bancárias">
            {/* Header com totais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Saldo Total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Contas</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button
                        onClick={() => openModal()}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        Nova Conta
                    </button>
                </div>
            </div>

            {/* Lista de contas */}
            {accounts.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">🏦</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Nenhuma conta cadastrada
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Adicione sua primeira conta para começar a controlar suas finanças.
                    </p>
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                    >
                        + Adicionar Conta
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="glass rounded-2xl p-6 hover:shadow-xl transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{getAccountIcon(account.type)}</span>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">
                                            {account.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {getAccountLabel(account.type)}
                                        </p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                        onClick={() => openModal(account)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                        title="Excluir"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
                                <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome da Conta
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: Nubank, Itaú, Bradesco..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Conta
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {accountTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Saldo Inicial
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.balance}
                            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                        >
                            {editingAccount ? 'Salvar' : 'Criar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
