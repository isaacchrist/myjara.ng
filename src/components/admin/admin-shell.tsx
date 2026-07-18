'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/shared/brand-logo'
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
    CheckCircle,
    Bug,
    Lightbulb,
    Package,
    Tag,
    FileText
} from 'lucide-react'
import { logoutAdmin, type AdminIdentity } from '@/app/actions/admin-auth'
import { getAdminNotificationsAction, markAllAdminNotificationsReadAction } from '@/app/actions/notifications'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/shared/notification-bell'

const sidebarGroups: { label: string | null; items: { icon: typeof LayoutDashboard; label: string; href: string; badge?: boolean }[] }[] = [
    {
        label: null,
        items: [{ icon: LayoutDashboard, label: 'Overview', href: '/admin' }],
    },
    {
        label: 'Catalog',
        items: [
            { icon: Store, label: 'Stores', href: '/admin/stores' },
            { icon: Package, label: 'Products', href: '/admin/products' },
            { icon: CheckCircle, label: 'Verification', href: '/admin/verification', badge: true },
            { icon: FolderTree, label: 'Categories', href: '/admin/categories' },
        ],
    },
    {
        label: 'Commerce',
        items: [
            { icon: CreditCard, label: 'Transactions', href: '/admin/transactions' },
            { icon: Tag, label: 'Pricing', href: '/admin/pricing' },
            { icon: Shield, label: 'Disputes', href: '/admin/disputes' },
        ],
    },
    {
        label: 'People',
        items: [
            { icon: Users, label: 'Users', href: '/admin/users' },
            { icon: MessageSquare, label: 'Messages', href: '/admin/messages' },
        ],
    },
    {
        label: 'Insights',
        items: [
            { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
            { icon: Lightbulb, label: 'Recommendations', href: '/admin/recommendations' },
        ],
    },
    {
        label: 'System',
        items: [
            { icon: FileText, label: 'Legal Pages', href: '/admin/legal' },
            { icon: Settings, label: 'Settings', href: '/admin/settings' },
            { icon: Bug, label: 'Debug', href: '/admin/debug' },
        ],
    },
]

const sidebarItems = sidebarGroups.flatMap((g) => g.items)

function initialsFor(identity: AdminIdentity | null) {
    if (!identity) return 'A'
    if (identity.type === 'master') return 'M'
    return (identity.fullName || 'A').trim().charAt(0).toUpperCase()
}

function labelFor(identity: AdminIdentity | null) {
    if (!identity) return 'Admin'
    if (identity.type === 'master') return 'Master Admin'
    return identity.fullName || 'Admin'
}

export function AdminShell({ children, pendingVerifications = 0, identity = null }: { children: React.ReactNode, pendingVerifications?: number, identity?: AdminIdentity | null }) {
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
                className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-900 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo & Close Button */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 px-6">
                    <Link href="/admin" className="flex items-center gap-2">
                        <BrandLogo size={32} dark />
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-gray-400 hover:text-white md:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-5">
                    {sidebarGroups.map((group, groupIndex) => (
                        <div key={group.label || `group-${groupIndex}`}>
                            {group.label && (
                                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                                    {group.label}
                                </p>
                            )}
                            <ul className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    const showBadge = item.label === 'Verification' && pendingVerifications > 0

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors ${isActive
                                                    ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                                                    : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                                                    }`}
                                            >
                                                <item.icon className="h-4.5 w-4.5 shrink-0" />
                                                <span className="truncate">{item.label}</span>
                                                {showBadge && (
                                                    <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs text-white font-bold">
                                                        {pendingVerifications}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Identity & Logout */}
                <div className="shrink-0 border-t border-gray-800 p-4">
                    <div className="flex items-center gap-3 rounded-lg px-1 pb-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400">
                            {initialsFor(identity)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{labelFor(identity)}</p>
                            <p className="truncate text-xs text-gray-500">{identity?.type === 'user' && identity.tag ? identity.tag : 'Platform Admin'}</p>
                        </div>
                    </div>
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
                            <span className="text-white font-medium truncate">
                                {sidebarItems.find(i => i.href === pathname)?.label || 'Overview'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell
                            variant="dark"
                            fetchFn={getAdminNotificationsAction}
                            markReadFn={markAllAdminNotificationsReadAction}
                        />
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
