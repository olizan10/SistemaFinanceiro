'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface ThirdPartyLoan {
    id: string;
    creditorName: string;
    creditorPhone: string | null;
    principalAmount: number;
    monthlyInterest: number;
    currentBalance: number;
    accruedInterest: number;
    totalPaid: number;
    startDate: string;
    nextPaymentDate: string | null;
    notes: string | null;
    status: string;
    responsiblePerson: string;
    monthsSinceStart: number;
    payments: { id: string; amount: number; paymentDate: string }[];
}

export default function ThirdPartyLoansPage() {
    const [loans, setLoans] = useState<ThirdPartyLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentModal, setPaymentModal] = useState<ThirdPartyLoan | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [formData, setFormData] = useState({
        creditorName: '',
        creditorPhone: '',
        principalAmount: '',
        monthlyInterest: '',
        startDate: new Date().toISOString().split('T')[0],
        nextPaymentDate: '',
        notes: '',
        responsiblePerson: 'eu'
    });

    useEffect(() => { fetchLoans(); }, []);

    const fetchLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/third-party-loans`, {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/third-party-loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                fetchLoans();
                setIsModalOpen(false);
                setFormData({
                    creditorName: '', creditorPhone: '', principalAmount: '', monthlyInterest: '',
                    startDate: new Date().toISOString().split('T')[0], nextPaymentDate: '', notes: '', responsiblePerson: 'eu'
                });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handlePayment = async () => {
        if (!paymentModal || !paymentAmount) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/third-party-loans/${paymentModal.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: paymentAmount })
            });
            fetchLoans();
            setPaymentModal(null);
            setPaymentAmount('');
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este empréstimo?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/third-party-loans/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchLoans();
    };

    const totalDebt = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.currentBalance, 0);
    const totalInterest = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.accruedInterest, 0);

    if (loading) {
        return (
            <DashboardLayout title="Empréstimos com Terceiros" subtitle="Agiotas e empréstimos informais">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Empréstimos com Terceiros" subtitle="Agiotas e empréstimos informais">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dívida Total</p>
                    <p className="text-2xl font-bold text-purple-600">
                        R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Juros Acumulados</p>
                    <p className="text-2xl font-bold text-red-600">
                        R$ {totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Empréstimos Ativos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {loans.filter(l => l.status === 'active').length}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Novo Empréstimo
                    </button>
                </div>
            </div>

            {/* Warning */}
            {totalDebt > 0 && (
                <div className="glass rounded-2xl p-4 mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Atenção: Juros acumulando!</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Os juros são calculados mensalmente. Priorize quitar estas dívidas para evitar crescimento exponencial.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loans List */}
            {loans.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">🤝</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum empréstimo cadastrado</h3>
                    <p className="text-gray-500 mb-6">Cadastre empréstimos com terceiros (agiotas) para controlar.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {loans.map((loan) => (
                        <div key={loan.id} className={`glass rounded-2xl p-6 hover:shadow-xl transition-all group ${loan.status === 'paid' ? 'opacity-60' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {loan.creditorName}
                                        {loan.status === 'paid' && <span className="text-sm bg-green-500 text-white px-2 py-1 rounded">QUITADO</span>}
                                        <span className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                            {loan.responsiblePerson === 'eu' ? '👤 Eu' : loan.responsiblePerson === 'spouse' ? '👩 Esposa' : '👥 Casal'}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {loan.monthlyInterest}% ao mês • {loan.monthsSinceStart} meses
                                        {loan.creditorPhone && ` • ${loan.creditorPhone}`}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {loan.status === 'active' && (
                                        <button
                                            onClick={() => setPaymentModal(loan)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                                        >
                                            💵 Pagar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(loan.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Valor Emprestado</p>
                                    <p className="font-bold text-gray-900 dark:text-white">R$ {loan.principalAmount.toLocaleString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Juros Acumulados</p>
                                    <p className="font-bold text-red-600">+ R$ {loan.accruedInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Já Pago</p>
                                    <p className="font-bold text-green-600">- R$ {loan.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Saldo Devedor</p>
                                    <p className="font-bold text-purple-600 text-xl">R$ {loan.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            {loan.notes && (
                                <p className="text-sm text-gray-500 italic">📝 {loan.notes}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Empréstimo com Terceiro" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome do Credor *</label>
                            <input
                                type="text"
                                value={formData.creditorName}
                                onChange={(e) => setFormData({ ...formData, creditorName: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="Ex: João, Maria..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Telefone</label>
                            <input
                                type="text"
                                value={formData.creditorPhone}
                                onChange={(e) => setFormData({ ...formData, creditorPhone: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor Emprestado *</label>
                            <input
                                type="number"
                                value={formData.principalAmount}
                                onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold"
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Taxa de Juros Mensal (%) *</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.monthlyInterest}
                                onChange={(e) => setFormData({ ...formData, monthlyInterest: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="Ex: 10"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Data do Empréstimo</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Quem Pegou</label>
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
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            rows={2}
                            placeholder="Anotações sobre o empréstimo..."
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold">Cadastrar</button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Registrar Pagamento" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Credor: <strong>{paymentModal?.creditorName}</strong>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                        Saldo atual: <strong className="text-purple-600">R$ {paymentModal?.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Valor do Pagamento</label>
                        <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold"
                            placeholder="0,00"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setPaymentModal(null)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button onClick={handlePayment} className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold">Pagar</button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
