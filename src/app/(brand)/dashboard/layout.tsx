'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import {
    LayoutDashboard,
    Package,
    Gift,
    Truck,
    ShoppingCart,
    MessageCircle,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight
} from 'lucide-react'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Package, label: 'Products', href: '/dashboard/products' },
    { icon: Gift, label: 'Jara Offers', href: '/dashboard/jara' },
    { icon: Truck, label: 'Logistics', href: '/dashboard/logistics' },
    { icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders' },
    { icon: MessageCircle, label: 'Messages', href: '/dashboard/messages', badge: 3 },
    { icon: MessageCircle, label: 'Support', href: '/dashboard/support' },
    { icon: Truck, label: 'Operations', href: '/dashboard/operations' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [store, setStore] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchStore = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('stores')
                .select('name, logo_url')
                .eq('owner_id', user.id)
                .single()

            if (data) setStore(data)
        }

        fetchStore()
    }, [supabase])
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10 overflow-hidden">
                <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
                <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-teal-500/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-400/20 blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm md:block dark:bg-gray-950/95 dark:border-gray-800">
                {/* Logo */}
                <div className="flex h-16 items-center border-b border-gray-100 px-6 dark:border-gray-800">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-red-600 tracking-wide" style={{ fontFamily: '"Lobster", cursive' }}>
                            MyJara
                        </span>
                    </Link>
                </div>

                {/* Store Info */}
                <div className="border-b border-gray-100 p-4 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-lg dark:bg-emerald-900/30 overflow-hidden">
                            {store?.logo_url ? (
                                <Image
                                    src={store.logo_url}
                                    alt={store.name}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            ) : (
                                '🏪'
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                                {store?.name || 'My Store'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Wholesaler Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {sidebarItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:text-amber-900 hover:shadow-md hover:scale-[1.02] dark:text-gray-400 dark:hover:from-amber-950/20 dark:hover:to-yellow-950/20 dark:hover:text-amber-400 dark:hover:shadow-amber-900/20"
                                >
                                    <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                                    {item.label}
                                    {item.badge && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-900 hover:shadow-md dark:text-gray-400 dark:hover:from-red-950/20 dark:hover:to-rose-950/20 dark:hover:text-red-400">
                        <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-0 md:ml-64 lg:ml-64 relative z-10">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 dark:bg-gray-950/80 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-500">Dashboard</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-gray-900 dark:text-gray-100">Overview</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500"
                        >
                            View Store →
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
