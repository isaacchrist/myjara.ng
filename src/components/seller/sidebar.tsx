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
    Store
} from 'lucide-react'
import StoreSwitcher from '@/components/store-switcher'

interface SidebarProps {
    stores: any[]
    activeStoreId?: string
}

export function SellerSidebar({ stores, activeStoreId }: SidebarProps) {
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
            href: '/seller/products', // This page might not exist yet? Or is it /seller/dashboard/products?
            // Actually existing routes seem to be /seller/products/new
            // Let's assume we want a product list page. For now point to dashboard or create one later.
            // Based on task.md, we have seller/products/[id]/edit. So a list must exist?
            // "Product Editing: Create seller/products/[id]/edit/page.tsx"
            // Wait, do we have a product list page? 
            // implementation_plan.md phase 16 mentions "Product Editing".
            // Let's double check if /seller/products exists. If not, maybe just New Product for now.
            label: 'Products',
            icon: Package,
            active: pathname.includes('/seller/products'),
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
                <StoreSwitcher items={stores} currentStoreId={activeStoreId} />
            </div>
            <div className="flex-1 space-y-1 px-3">
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-emerald-600",
                            route.active
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        )}
                    >
                        <route.icon className="h-4 w-4" />
                        {route.label}
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
