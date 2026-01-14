'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface Loan {
    id: string;
    name: string;
    principalAmount: number;
    interestRate: number;
    remainingAmount: number;
    monthlyPayment: number;
    startDate: string;
    endDate: string;
    status: string;
    progress: number;
    totalMonths: number;
    paidMonths: number;
}

export default function LoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [simulateModal, setSimulateModal] = useState(false);
    const [simulation, setSimulation] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        principalAmount: '',
        interestRate: '',
        monthlyPayment: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });
    const [simData, setSimData] = useState({ principalAmount: '', interestRate: '', months: '12' });

    useEffect(() => { fetchLoans(); }, []);

    const fetchLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setLoans(await response.json());
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                fetchLoans();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSimulate = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(simData)
            });
            setSimulation(await response.json());
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este empréstimo?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loans/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchLoans();
    };

    const totalDebt = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.remainingAmount, 0);
    const monthlyTotal = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.monthlyPayment, 0);

    if (loading) {
        return (
            <DashboardLayout title="Empréstimos" subtitle="Gerencie suas dívidas">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Empréstimos" subtitle="Gerencie suas dívidas">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dívida Total</p>
                    <p className="text-2xl font-bold text-red-600">
                        R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Parcelas Mensais</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {monthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button onClick={() => setSimulateModal(true)} className="w-full py-3 px-6 bg-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        🧮 Simular
                    </button>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Novo
                    </button>
                </div>
            </div>

            {/* Loans List */}
            {loans.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum empréstimo cadastrado</h3>
                    <p className="text-gray-500 mb-6">Registre seus financiamentos e empréstimos.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {loans.map((loan) => (
                        <div key={loan.id} className={`glass rounded-2xl p-6 hover:shadow-xl transition-all group ${loan.status === 'paid' ? 'opacity-60' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {loan.name}
                                        {loan.status === 'paid' && <span className="text-sm bg-green-500 text-white px-2 py-1 rounded">QUITADO</span>}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {loan.interestRate}% a.a. • {loan.paidMonths}/{loan.totalMonths} parcelas
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(loan.id)}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Valor Original</p>
                                    <p className="font-bold text-gray-900 dark:text-white">R$ {loan.principalAmount.toLocaleString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Restante</p>
                                    <p className="font-bold text-red-600">R$ {loan.remainingAmount.toLocaleString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Parcela</p>
                                    <p className="font-bold text-gray-900 dark:text-white">R$ {loan.monthlyPayment.toLocaleString('pt-BR')}</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Progresso</span>
                                    <span>{loan.progress.toFixed(0)}% pago</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                                        style={{ width: `${loan.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Empréstimo" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            placeholder="Ex: Financiamento Carro"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor Principal</label>
                            <input
                                type="number"
                                value={formData.principalAmount}
                                onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Taxa Anual (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.interestRate}
                                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Parcela Mensal</label>
                            <input
                                type="number"
                                value={formData.monthlyPayment}
                                onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Data Início</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Data Fim</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold">Criar</button>
                    </div>
                </form>
            </Modal>

            {/* Simulate Modal */}
            <Modal isOpen={simulateModal} onClose={() => { setSimulateModal(false); setSimulation(null); }} title="Simular Empréstimo" size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor</label>
                            <input
                                type="number"
                                value={simData.principalAmount}
                                onChange={(e) => setSimData({ ...simData, principalAmount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Taxa Anual (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={simData.interestRate}
                                onChange={(e) => setSimData({ ...simData, interestRate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Meses</label>
                            <input
                                type="number"
                                value={simData.months}
                                onChange={(e) => setSimData({ ...simData, months: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                    </div>
                    <button onClick={handleSimulate} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold">Calcular</button>

                    {simulation && (
                        <div className="glass rounded-xl p-4 mt-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Parcela</p>
                                    <p className="text-xl font-bold text-green-600">R$ {simulation.monthlyPayment.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Total Pago</p>
                                    <p className="text-xl font-bold">R$ {simulation.totalPayment.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Total Juros</p>
                                    <p className="text-xl font-bold text-red-600">R$ {simulation.totalInterest.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </DashboardLayout>
    );
}
