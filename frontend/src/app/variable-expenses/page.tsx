'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface Category {
    id: string;
    name: string;
    iconEmoji: string;
    color: string;
    monthlyBudget: number | null;
}

interface CategorySummary extends Category {
    monthTotal: number;
    monthlyAverage: number;
    transactionCount: number;
    budgetUsed: number | null;
}

interface Expense {
    id: string;
    categoryId: string;
    description: string;
    amount: number;
    date: string;
    paymentType: string;
    isPaid: boolean;
    notes: string | null;
    category: Category;
    cardDebt?: { lastFourDigits: string; cardholderName: string };
}

interface Summary {
    month: number;
    year: number;
    categories: CategorySummary[];
    totals: {
        thisMonth: number;
        monthlyAverage: number;
        projection: number | null;
    };
}

export default function VariableExpensesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [formData, setFormData] = useState({
        categoryId: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentType: 'pix',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [catRes, summaryRes, expensesRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/variable-expenses/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/variable-expenses/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/variable-expenses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const cats = await catRes.json();
            setCategories(cats);
            setSummary(await summaryRes.json());
            setExpenses(await expensesRes.json());

            if (cats.length > 0) {
                setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
            }
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/variable-expenses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setFormData({
                    categoryId: categories[0]?.id || '',
                    description: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    paymentType: 'pix',
                    notes: ''
                });
                fetchData();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este gasto?')) return;

        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/variable-expenses/${id}`, {
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

    const paymentTypes = [
        { value: 'pix', label: '📱 PIX' },
        { value: 'dinheiro', label: '💵 Dinheiro' },
        { value: 'debito', label: '💳 Débito' },
        { value: 'cartao', label: '💳 Crédito' }
    ];

    if (loading) {
        return (
            <DashboardLayout title="Gastos Variáveis" subtitle="Combustível, alimentação, transporte...">
                <div className="flex items-center justify-center h-64">
                    <div className="spinner w-12 h-12"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Gastos Variáveis" subtitle="Combustível, alimentação, transporte...">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                    <p className="text-sm text-gray-500 mb-1">💸 Gastos do Mês</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(summary?.totals.thisMonth || 0)}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 mb-1">📊 Média Mensal</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(summary?.totals.monthlyAverage || 0)}
                    </p>
                    <p className="text-xs text-gray-400">Últimos 3 meses</p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 mb-1">📅 Projeção Anual</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(summary?.totals.projection || 0)}
                    </p>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        📁 Por Categoria
                    </h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90"
                    >
                        + Novo Gasto
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summary?.categories.map((cat) => (
                        <div
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                            className={`glass rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${selectedCategory === cat.id ? 'ring-2 ring-purple-500' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">{cat.iconEmoji}</span>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                                    <p className="text-xs text-gray-500">{cat.transactionCount} gastos</p>
                                </div>
                            </div>
                            <p className="text-lg font-bold" style={{ color: cat.color }}>
                                {formatCurrency(cat.monthTotal)}
                            </p>
                            <p className="text-xs text-gray-400">
                                Média: {formatCurrency(cat.monthlyAverage)}
                            </p>
                            {cat.budgetUsed !== null && (
                                <div className="mt-2">
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${cat.budgetUsed > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(cat.budgetUsed, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{cat.budgetUsed.toFixed(0)}% do orçamento</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {(!summary?.categories || summary.categories.length === 0) && (
                        <div className="col-span-full glass rounded-2xl p-12 text-center">
                            <span className="text-6xl block mb-4">📝</span>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Nenhum gasto este mês
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Comece a registrar seus gastos diários
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold"
                            >
                                + Adicionar Primeiro Gasto
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Expenses */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    📋 Gastos Recentes
                </h3>

                <div className="space-y-3">
                    {expenses
                        .filter(e => !selectedCategory || e.categoryId === selectedCategory)
                        .slice(0, 20)
                        .map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{expense.category.iconEmoji}</span>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {expense.description}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(expense.date).toLocaleDateString('pt-BR')} •
                                            {paymentTypes.find(p => p.value === expense.paymentType)?.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(expense.amount)}
                                    </p>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}

                    {expenses.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                            Nenhum gasto registrado ainda
                        </p>
                    )}
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Gasto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Categoria
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                                    className={`p-3 rounded-xl text-center transition-all ${formData.categoryId === cat.id
                                            ? 'bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500'
                                            : 'bg-gray-100 dark:bg-gray-700'
                                        }`}
                                >
                                    <span className="text-2xl block">{cat.iconEmoji}</span>
                                    <span className="text-xs">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Ex: Almoço no restaurante"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Data</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                        <div className="grid grid-cols-4 gap-2">
                            {paymentTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentType: type.value })}
                                    className={`p-2 rounded-xl text-center transition-all text-sm ${formData.paymentType === type.value
                                            ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                                            : 'bg-gray-100 dark:bg-gray-700'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90"
                    >
                        Salvar Gasto
                    </button>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
