'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface CreditCard {
    id: string;
    name: string;
    lastFourDigits: string;
    cardholderName: string | null;
    brand: string | null;
    expiryDate: string | null;
    limit: number;
    closingDay: number;
    dueDay: number;
    currentBalance: number;
    responsiblePerson: string;
}

const brandIcons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    elo: '💳',
    amex: '💳',
    hipercard: '💳',
    other: '💳'
};

export default function CardsPage() {
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        lastFourDigits: '',
        cardholderName: '',
        brand: '',
        expiryDate: '',
        limit: '',
        closingDay: '1',
        dueDay: '10',
        responsiblePerson: 'eu'
    });

    useEffect(() => { fetchCards(); }, []);

    const fetchCards = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/credit-cards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCards(await response.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingCard
            ? `${process.env.NEXT_PUBLIC_API_URL}/credit-cards/${editingCard.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/credit-cards`;

        try {
            const response = await fetch(url, {
                method: editingCard ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                fetchCards();
                closeModal();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este cartão?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/credit-cards/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchCards();
    };

    const openModal = (card?: CreditCard) => {
        if (card) {
            setEditingCard(card);
            setFormData({
                name: card.name,
                lastFourDigits: card.lastFourDigits,
                cardholderName: card.cardholderName || '',
                brand: card.brand || '',
                expiryDate: card.expiryDate || '',
                limit: card.limit.toString(),
                closingDay: card.closingDay.toString(),
                dueDay: card.dueDay.toString(),
                responsiblePerson: card.responsiblePerson || 'eu'
            });
        } else {
            setEditingCard(null);
            setFormData({ name: '', lastFourDigits: '', cardholderName: '', brand: '', expiryDate: '', limit: '', closingDay: '1', dueDay: '10', responsiblePerson: 'eu' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingCard(null); };

    const getResponsibleLabel = (person: string) => {
        const labels: Record<string, string> = { eu: '👤 Eu', spouse: '👩 Esposa', both: '👥 Casal' };
        return labels[person] || person;
    };

    const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
    const totalUsed = cards.reduce((s, c) => s + c.currentBalance, 0);

    if (loading) {
        return (
            <DashboardLayout title="Cartões" subtitle="Seus cartões de crédito">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Cartões" subtitle="Seus cartões de crédito">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Limite Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {totalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-red-600/20 to-rose-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Usado</p>
                    <p className="text-2xl font-bold text-red-600">
                        R$ {totalUsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Disponível</p>
                    <p className="text-2xl font-bold text-green-600">
                        R$ {(totalLimit - totalUsed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6 flex items-center justify-center">
                    <button onClick={() => openModal()} className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Novo Cartão
                    </button>
                </div>
            </div>

            {/* Cards Grid */}
            {cards.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">💳</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum cartão cadastrado</h3>
                    <p className="text-gray-500 mb-6">Adicione seu primeiro cartão de crédito.</p>
                    <button onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                        + Adicionar Cartão
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => {
                        const usedPercentage = (card.currentBalance / card.limit) * 100;
                        return (
                            <div key={card.id} className="glass rounded-2xl p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-lg font-bold">{card.name}</p>
                                        <p className="text-sm opacity-70">**** {card.lastFourDigits}</p>
                                        {card.cardholderName && (
                                            <p className="text-xs opacity-50 mt-1">{card.cardholderName}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button onClick={() => openModal(card)} className="p-2 hover:bg-white/10 rounded-lg">✏️</button>
                                            <button onClick={() => handleDelete(card.id)} className="p-2 hover:bg-red-500/30 rounded-lg">🗑️</button>
                                        </div>
                                        <span className="text-xs bg-white/10 px-2 py-1 rounded">
                                            {getResponsibleLabel(card.responsiblePerson)}
                                        </span>
                                    </div>
                                </div>

                                {card.brand && (
                                    <p className="text-xs opacity-50 mb-2 uppercase">{card.brand} {card.expiryDate && `• ${card.expiryDate}`}</p>
                                )}

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Usado</span>
                                        <span>R$ {card.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${usedPercentage > 80 ? 'bg-red-500' : usedPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs mt-1 opacity-70">
                                        <span>{usedPercentage.toFixed(0)}% usado</span>
                                        <span>Limite: R$ {card.limit.toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm pt-4 border-t border-white/10">
                                    <span>Fecha dia {card.closingDay}</span>
                                    <span>Vence dia {card.dueDay}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCard ? 'Editar Cartão' : 'Novo Cartão'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cartão *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="Ex: Nubank, Itaú..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Últimos 4 dígitos</label>
                            <input
                                type="text"
                                maxLength={4}
                                value={formData.lastFourDigits}
                                onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="0000"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Titular</label>
                            <input
                                type="text"
                                value={formData.cardholderName}
                                onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                placeholder="NOME SOBRENOME"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quem Usa</label>
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
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bandeira</label>
                            <select
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            >
                                <option value="">Selecione...</option>
                                <option value="visa">Visa</option>
                                <option value="mastercard">Mastercard</option>
                                <option value="elo">Elo</option>
                                <option value="amex">American Express</option>
                                <option value="hipercard">Hipercard</option>
                                <option value="other">Outra</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade</label>
                            <input
                                type="text"
                                placeholder="MM/AA"
                                maxLength={5}
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite *</label>
                            <input
                                type="number"
                                value={formData.limit}
                                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia fechamento</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.closingDay}
                                onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia vencimento</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.dueDay}
                                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                            {editingCard ? 'Salvar' : 'Criar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
