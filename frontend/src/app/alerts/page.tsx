'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Bill {
    id: string;
    type: string;
    name: string;
    description: string;
    amount: number;
    dueDate: string;
    dueDay: number;
    isPaid: boolean;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    icon: string;
    totalDebt?: number;
}

interface Alert {
    id: string;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    amount: number;
    dueDate?: string;
    daysUntil?: number;
    icon: string;
}

interface BillsData {
    month: number;
    year: number;
    summary: { totalBills: number; totalDue: number; totalOverdue: number; overdueCount: number; upcomingCount: number; paidCount: number };
    overdue: Bill[];
    upcoming: Bill[];
    paid: Bill[];
}

interface AlertsData {
    count: number;
    criticalCount: number;
    warningCount: number;
    alerts: Alert[];
}

export default function AlertsPage() {
    const [bills, setBills] = useState<BillsData | null>(null);
    const [alerts, setAlerts] = useState<AlertsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'alerts' | 'bills'>('alerts');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [billsRes, alertsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/bills`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/active`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            setBills(await billsRes.json());
            setAlerts(await alertsRes.json());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayFixed = async (id: string) => {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/fixed-expense/${id}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({})
        });
        fetchData();
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400';
            case 'warning': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-400';
            default: return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-green-500';
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Alertas" subtitle="Contas a pagar e vencimentos">
                <div className="flex items-center justify-center h-64"><div className="spinner w-12 h-12"></div></div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Alertas" subtitle="Contas a pagar e vencimentos">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className={`glass rounded-2xl p-6 ${alerts?.criticalCount ? 'bg-gradient-to-br from-red-600/20 to-rose-600/20 animate-pulse' : ''}`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">🚨 Críticos</p>
                    <p className="text-3xl font-bold text-red-600">{alerts?.criticalCount || 0}</p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">⚠️ Atenção</p>
                    <p className="text-3xl font-bold text-amber-600">{alerts?.warningCount || 0}</p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💰 Total a Pagar</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {(bills?.summary.totalDue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">🔴 Atrasado</p>
                    <p className="text-2xl font-bold text-red-600">
                        R$ {(bills?.summary.totalOverdue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'alerts'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                >
                    🔔 Alertas ({alerts?.count || 0})
                </button>
                <button
                    onClick={() => setActiveTab('bills')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'bills'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                >
                    📋 Contas ({bills?.summary.totalBills || 0})
                </button>
            </div>

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className="space-y-4">
                    {alerts?.alerts.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tudo em dia!</h3>
                            <p className="text-gray-500">Nenhum alerta no momento.</p>
                        </div>
                    ) : (
                        alerts?.alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`glass rounded-2xl p-6 border-l-4 ${getSeverityStyle(alert.severity)}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">{alert.icon}</div>
                                        <div>
                                            <p className="font-bold text-lg">{alert.title}</p>
                                            <p className="text-sm opacity-80">{alert.message}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold">
                                            R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        {alert.daysUntil !== undefined && (
                                            <p className="text-sm opacity-80">
                                                {alert.daysUntil === 0 ? 'Vence hoje!' :
                                                    alert.daysUntil < 0 ? `${Math.abs(alert.daysUntil)} dias atrasado` :
                                                        `em ${alert.daysUntil} dia${alert.daysUntil > 1 ? 's' : ''}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Bills Tab */}
            {activeTab === 'bills' && (
                <div className="space-y-6">
                    {/* Overdue */}
                    {bills?.overdue && bills.overdue.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-red-600 mb-4">🔴 Atrasadas ({bills.overdue.length})</h3>
                            <div className="space-y-3">
                                {bills.overdue.map((bill) => (
                                    <div key={bill.id} className="glass rounded-xl p-4 border-l-4 border-red-500 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl">{bill.icon}</div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bill.name}</p>
                                                <p className="text-sm text-gray-500">{bill.description} • Venceu {formatDate(bill.dueDate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-xl font-bold text-red-600">
                                                R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            {bill.type === 'fixed' && (
                                                <button
                                                    onClick={() => handlePayFixed(bill.id)}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming */}
                    {bills?.upcoming && bills.upcoming.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📅 Próximas ({bills.upcoming.length})</h3>
                            <div className="space-y-3">
                                {bills.upcoming.map((bill) => (
                                    <div key={bill.id} className="glass rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-12 rounded-full ${getPriorityStyle(bill.priority)}`}></div>
                                            <div className="text-2xl">{bill.icon}</div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{bill.name}</p>
                                                <p className="text-sm text-gray-500">{bill.description} • Dia {bill.dueDay}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            {bill.type === 'fixed' && (
                                                <button
                                                    onClick={() => handlePayFixed(bill.id)}
                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paid */}
                    {bills?.paid && bills.paid.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-green-600 mb-4">✅ Pagas ({bills.paid.length})</h3>
                            <div className="space-y-3 opacity-60">
                                {bills.paid.map((bill) => (
                                    <div key={bill.id} className="glass rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl">{bill.icon}</div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white line-through">{bill.name}</p>
                                                <p className="text-sm text-gray-500">{bill.description}</p>
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-green-600">
                                            R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
