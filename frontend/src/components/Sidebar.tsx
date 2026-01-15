'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
    href: string;
    label: string;
    icon: string;
}

const menuItems: SidebarItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/alerts', label: 'Alertas', icon: '🔔' },
    { href: '/accounts', label: 'Contas', icon: '🏦' },
    { href: '/variable-expenses', label: 'Gastos Diários', icon: '☕' },
    { href: '/card-debts', label: 'Dívidas Cartão', icon: '💳' },
    { href: '/transactions', label: 'Transações', icon: '💸' },
    { href: '/budgets', label: 'Orçamentos', icon: '📋' },
    { href: '/goals', label: 'Metas', icon: '🎯' },
    { href: '/loans', label: 'Empréstimos', icon: '💰' },
    { href: '/third-party-loans', label: 'Terceiros', icon: '🤝' },
    { href: '/debt-simulator', label: 'Simulador', icon: '🧮' },
    { href: '/fixed-expenses', label: 'Contas Fixas', icon: '📅' },
    { href: '/history', label: 'Histórico', icon: '📜' },
    { href: '/fees', label: 'Taxas/Juros', icon: '💹' },
    { href: '/investments', label: 'Investimentos', icon: '📈' },
    { href: '/family', label: 'Família', icon: '👨‍👩‍👧' },
    { href: '/reports', label: 'Relatórios', icon: '📈' },
    { href: '/settings', label: 'Configurações', icon: '⚙️' },
];


interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Overlay mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'
                    } lg:relative`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                    {isOpen && (
                        <h1 className="text-xl font-bold gradient-text">
                            FinançasPRO
                        </h1>
                    )}
                    <button
                        onClick={onToggle}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {isOpen ? '◀' : '▶'}
                    </button>
                </div>

                {/* Menu */}
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                {isOpen && (
                                    <span className="font-medium">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
