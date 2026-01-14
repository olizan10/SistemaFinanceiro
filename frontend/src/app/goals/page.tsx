'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    status: string;
    progress: number;
    remaining: number;
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contributeModal, setContributeModal] = useState<Goal | null>(null);
    const [contributeAmount, setContributeAmount] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        deadline: ''
    });

    useEffect(() => { fetchGoals(); }, []);

    const fetchGoals = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/goals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setGoals(await response.json());
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                fetchGoals();
                setIsModalOpen(false);
                setFormData({ name: '', targetAmount: '', deadline: '' });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleContribute = async () => {
        if (!contributeModal) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/goals/${contributeModal.id}/contribute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: contributeAmount })
            });
            fetchGoals();
            setContributeModal(null);
            setContributeAmount('');
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta meta?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/goals/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchGoals();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDaysRemaining = (dateStr: string) => {
        const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const totalTarget = goals.filter(g => g.status === 'active').reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved = goals.filter(g => g.status === 'active').reduce((s, g) => s + g.currentAmount, 0);

    if (loading) {
        return (
            <DashboardLayout title="Metas" subtitle="Seus objetivos financeiros">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Metas" subtitle="Seus objetivos financeiros">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total das Metas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {totalTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Guardado</p>
                    <p className="text-2xl font-bold text-green-600">
                        R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Metas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {goals.filter(g => g.status === 'active').length}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Nova Meta
                    </button>
                </div>
            </div>

            {/* Goals Grid */}
            {goals.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma meta definida</h3>
                    <p className="text-gray-500 mb-6">Crie sua primeira meta financeira!</p>
                    <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Criar Meta
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => {
                        const daysLeft = getDaysRemaining(goal.deadline);
                        const isCompleted = goal.status === 'completed';
                        const isExpired = daysLeft < 0 && !isCompleted;

                        return (
                            <div key={goal.id} className={`glass rounded-2xl p-6 hover:shadow-xl transition-all group ${isCompleted ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-4xl">{isCompleted ? '🏆' : '🎯'}</div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                                            <p className={`text-sm ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                                                {isCompleted ? '✅ Concluída!' : isExpired ? '⚠️ Prazo vencido' : `${daysLeft} dias restantes`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Progresso</span>
                                        <span className="font-medium">{goal.progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                                            style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm mb-4">
                                    <span className="text-gray-500">
                                        R$ {goal.currentAmount.toLocaleString('pt-BR')} de R$ {goal.targetAmount.toLocaleString('pt-BR')}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-500">Prazo: {formatDate(goal.deadline)}</span>
                                    {!isCompleted && (
                                        <button
                                            onClick={() => setContributeModal(goal)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                        >
                                            + Contribuir
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Meta">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Meta</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            placeholder="Ex: Viagem, Carro novo..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Objetivo</label>
                        <input
                            type="number"
                            value={formData.targetAmount}
                            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold"
                            placeholder="0,00"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo</label>
                        <input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            required
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">Criar</button>
                    </div>
                </form>
            </Modal>

            {/* Contribute Modal */}
            <Modal isOpen={!!contributeModal} onClose={() => setContributeModal(null)} title="Contribuir para Meta" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Meta: <strong>{contributeModal?.name}</strong>
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                        <input
                            type="number"
                            value={contributeAmount}
                            onChange={(e) => setContributeAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold"
                            placeholder="0,00"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setContributeModal(null)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button onClick={handleContribute} className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform">Contribuir</button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
