'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';

interface FamilyMember {
    id: string;
    name: string;
    lastName: string;
    email?: string;
    canManage: boolean;
    isActive: boolean;
}

export default function FamilyMembersPage() {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        canManage: false
    });

    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/family-members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMembers(await response.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingMember
            ? `${process.env.NEXT_PUBLIC_API_URL}/family-members/${editingMember.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/family-members`;

        try {
            const response = await fetch(url, {
                method: editingMember ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                fetchMembers();
                closeModal();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Desativar este membro?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/family-members/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchMembers();
    };

    const openModal = (member?: FamilyMember) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                name: member.name,
                lastName: member.lastName,
                email: member.email || '',
                canManage: member.canManage
            });
        } else {
            setEditingMember(null);
            setFormData({ name: '', lastName: '', email: '', canManage: false });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMember(null);
        setFormData({ name: '', lastName: '', email: '', canManage: false });
    };

    if (loading) {
        return (
            <DashboardLayout title="Família" subtitle="Membros que compartilham as finanças">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Família" subtitle="Membros que compartilham as finanças">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">
                        Cadastre os membros da família para rastrear quem fez cada compra.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                    + Novo Membro
                </button>
            </div>

            {/* Members Grid */}
            {members.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum membro cadastrado</h3>
                    <p className="text-gray-500 mb-6">Adicione membros da família para rastrear gastos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                        <div key={member.id} className="glass rounded-2xl p-6 hover:shadow-lg transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                                    {member.name[0]}{member.lastName[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {member.name} {member.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {member.email || 'Sem email'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`text-xs px-3 py-1 rounded-full ${member.canManage
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {member.canManage ? '🔑 Pode gerenciar' : '👀 Somente visualizar'}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => openModal(member)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">✏️</button>
                                    <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingMember ? 'Editar Membro' : 'Novo Membro'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sobrenome *</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (opcional)</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="canManage"
                            checked={formData.canManage}
                            onChange={(e) => setFormData({ ...formData, canManage: e.target.checked })}
                            className="w-5 h-5 rounded"
                        />
                        <label htmlFor="canManage" className="text-sm text-gray-700 dark:text-gray-300">
                            Pode gerenciar todas as finanças (acesso completo)
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
                            {editingMember ? 'Salvar' : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
