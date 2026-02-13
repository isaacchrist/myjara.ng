'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Wallet,
    Settings,
    BarChart3,
    Store,
    MessageSquare
} from 'lucide-react'
import StoreSwitcher from '@/components/store-switcher'

interface SidebarProps {
    stores: any[]
    activeStoreId?: string
    shopType?: string
    unreadCount?: number
}

export function SellerSidebar({ stores, activeStoreId, shopType, unreadCount = 0 }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            href: '/seller/dashboard',
            label: 'Overview',
            icon: LayoutDashboard,
            active: pathname === '/seller/dashboard',
        },
        {
            href: '/seller/orders',
            label: 'Orders',
            icon: ShoppingBag,
            active: pathname.includes('/seller/orders'),
        },
        {
            href: '/seller/products',
            label: 'Products',
            icon: Package,
            active: pathname.includes('/seller/products'),
        },
        {
            href: '/seller/messages',
            label: 'Messages',
            icon: MessageSquare,
            active: pathname.includes('/seller/messages'),
            badge: unreadCount > 0 ? unreadCount : undefined
        },
        {
            href: '/seller/analytics',
            label: 'Analytics',
            icon: BarChart3,
            active: pathname === '/seller/analytics',
        },
        {
            href: '/seller/wallet',
            label: 'Wallet',
            icon: Wallet,
            active: pathname === '/seller/wallet',
        },
        {
            href: '/seller/profile',
            label: 'Settings',
            icon: Settings,
            active: pathname.includes('/seller/profile'),
        },
    ]

    return (
        <div className="flex h-full w-64 flex-col border-r bg-gray-50/50 dark:bg-gray-900/50">
            <div className="p-6">
                <StoreSwitcher items={stores} currentStoreId={activeStoreId} shopType={shopType} />
            </div>
            <div className="flex-1 space-y-1 px-3">
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-emerald-600 justify-between",
                            route.active
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <route.icon className="h-4 w-4" />
                            {route.label}
                        </div>
                        {(route as any).badge && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                {(route as any).badge > 99 ? '99+' : (route as any).badge}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
            <div className="p-4 border-t">
                <Link
                    href={`/store/${stores.find(s => s.id === activeStoreId)?.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600"
                >
                    <Store className="h-4 w-4" />
                    View Storefront
                </Link>
            </div>
        </div>
    )
}
