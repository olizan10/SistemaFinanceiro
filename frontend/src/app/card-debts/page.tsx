'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface FamilyMember {
    id: string;
    name: string;
    lastName: string;
}

interface CardPurchase {
    id: string;
    description: string;
    purchaseDate: string;
    totalAmount: number;
    installments: number;
    installmentAmount: number;
    paidInstallments: number;
    cardFeePercent: number;
    status: string;
    familyMember?: FamilyMember;
}

interface CardDebt {
    id: string;
    cardholderName: string;
    lastFourDigits: string;
    dueDay: number;
    totalDebt: number;
    totalPurchases?: number;
    totalInstallmentsRemaining?: number;
    purchases: CardPurchase[];
}

export default function CardDebtsPage() {
    const [cards, setCards] = useState<CardDebt[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CardDebt | null>(null);
    const [summary, setSummary] = useState({ totalDebt: 0, totalCards: 0, totalPurchases: 0, totalFees: 0 });

    const [formData, setFormData] = useState({
        cardholderName: '',
        lastFourDigits: '',
        dueDay: '10',
        description: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        totalAmount: '',
        installments: '1',
        cardFeePercent: '0',
        familyMemberId: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [cardsRes, membersRes, summaryRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/card-debts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/family-members`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/card-debts/summary/all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            setCards(await cardsRes.json());
            setFamilyMembers(await membersRes.json());
            setSummary(await summaryRes.json());
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/card-debts/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchData();
                setIsModalOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handlePayInstallment = async (purchaseId: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/card-debts/purchase/${purchaseId}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ installmentsToPay: 1 })
            });
            fetchData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDeletePurchase = async (purchaseId: string) => {
        if (!confirm('Excluir esta compra?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/card-debts/purchase/${purchaseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
    };

    const resetForm = () => {
        setFormData({
            cardholderName: '',
            lastFourDigits: '',
            dueDay: '10',
            description: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            totalAmount: '',
            installments: '1',
            cardFeePercent: '0',
            familyMemberId: ''
        });
    };

    if (loading) {
        return (
            <DashboardLayout title="Dívidas de Cartão" subtitle="Compras parceladas e faturas">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Dívidas de Cartão" subtitle="Compras parceladas e faturas">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total em Dívidas</p>
                    <p className="text-2xl font-bold text-red-600">
                        R$ {summary.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cartões</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalCards}</p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Compras Ativas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPurchases}</p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                    >
                        + Nova Compra
                    </button>
                </div>
            </div>

            {/* Cards List */}
            {cards.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">💳</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma dívida cadastrada</h3>
                    <p className="text-gray-500 mb-6">Cadastre uma compra parcelada para começar.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {cards.map((card) => (
                        <div key={card.id} className="glass rounded-2xl overflow-hidden">
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-lg font-bold">{card.cardholderName}</p>
                                        <p className="text-sm opacity-70">**** {card.lastFourDigits} • Vence dia {card.dueDay}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm opacity-70">Total Devedor</p>
                                        <p className="text-2xl font-bold text-red-400">
                                            R$ {card.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs opacity-50">
                                            {card.totalInstallmentsRemaining} parcelas restantes
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Purchases */}
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {card.purchases.filter(p => p.status === 'active').map((purchase) => (
                                    <div key={purchase.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">{purchase.description}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(purchase.purchaseDate).toLocaleDateString('pt-BR')}
                                                {purchase.familyMember && ` • ${purchase.familyMember.name} ${purchase.familyMember.lastName}`}
                                            </p>
                                        </div>
                                        <div className="text-right mr-4">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {purchase.paidInstallments}/{purchase.installments}x de R$ {purchase.installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Total: R$ {purchase.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePayInstallment(purchase.id)}
                                                className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                                            >
                                                Pagar 1x
                                            </button>
                                            <button
                                                onClick={() => handleDeletePurchase(purchase.id)}
                                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Nova Compra */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Compra no Cartão" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Titular *</label>
                            <input
                                type="text"
                                value={formData.cardholderName}
                                onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                                placeholder="NOME SOBRENOME"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">4 Últimos Dígitos *</label>
                            <input
                                type="text"
                                maxLength={4}
                                value={formData.lastFourDigits}
                                onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                                placeholder="1234"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição da Compra *</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                            placeholder="Ex: TV Samsung 55 polegadas"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parcelas</label>
                            <input
                                type="number"
                                min="1"
                                max="48"
                                value={formData.installments}
                                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia Vencimento</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.dueDay}
                                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data da Compra</label>
                            <input
                                type="date"
                                value={formData.purchaseDate}
                                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quem Comprou</label>
                            <select
                                value={formData.familyMemberId}
                                onChange={(e) => setFormData({ ...formData, familyMemberId: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                            >
                                <option value="">Eu (usuário principal)</option>
                                {familyMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} {member.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taxa do Cartão (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.cardFeePercent}
                            onChange={(e) => setFormData({ ...formData, cardFeePercent: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                            placeholder="0"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                            Cadastrar Compra
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
