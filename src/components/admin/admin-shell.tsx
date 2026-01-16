'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    LayoutDashboard,
    Store,
    FolderTree,
    CreditCard,
    Users,
    BarChart3,
    Settings,
    Shield,
    LogOut,
    ChevronRight,
    Menu,
    X,
    MessageSquare,
    CheckCircle
} from 'lucide-react'
import { logoutAdmin } from '@/app/actions/admin-auth'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Shield, label: 'Disputes', href: '/admin/disputes' },
    { icon: Store, label: 'Stores', href: '/admin/stores' },
    { icon: CheckCircle, label: 'Verification', href: '/admin/verification', badge: true }, // Added Verification
    { icon: FolderTree, label: 'Categories', href: '/admin/categories' },
    { icon: CreditCard, label: 'Transactions', href: '/admin/transactions' },
    { icon: MessageSquare, label: 'Messages', href: '/admin/messages' }, // Added Messages explicitly if missing
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-800 bg-gray-900 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo & Close Button */}
                <div className="flex h-16 items-center justify-between border-b border-gray-800 px-6">
                    <Link href="/admin" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="MyJara Logo" width={120} height={40} className="h-8 w-auto brightness-0 invert" />
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-gray-400 hover:text-white md:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                        {item.badge && (
                                            <span className="ml-auto flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500">
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="border-t border-gray-800 p-4">
                    <button
                        onClick={async () => await logoutAdmin()}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-400 hover:text-white md:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Link href="/admin" className="hover:text-white hidden sm:inline">Admin</Link>
                            <ChevronRight className="h-4 w-4 hidden sm:inline" />
                            <span className="text-white font-medium truncat">
                                {sidebarItems.find(i => i.href === pathname)?.label || 'Overview'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm text-gray-400 hover:text-white"
                        >
                            View Site →
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
