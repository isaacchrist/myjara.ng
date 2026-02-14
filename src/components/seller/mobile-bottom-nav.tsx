'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    MessageSquare,
    MoreHorizontal,
    X,
    Wallet,
    Settings,
    BarChart3,
    Calendar,
    AlertTriangle,
    Headphones,
    Store
} from 'lucide-react'

interface MobileBottomNavProps {
    shopType?: string
    unreadCount?: number
    storeSlug?: string
}

export function MobileBottomNav({ shopType, unreadCount = 0, storeSlug }: MobileBottomNavProps) {
    const pathname = usePathname()
    const [showMore, setShowMore] = useState(false)

    // Primary tabs (always visible in bottom bar)
    const primaryTabs = [
        {
            href: '/seller/dashboard',
            label: 'Home',
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
            badge: unreadCount > 0 ? unreadCount : undefined,
        },
    ]

    // Secondary items (shown in "More" sheet)
    const secondaryItems = [
        ...(shopType !== 'brand' ? [{
            href: '/seller/market-days',
            label: 'Market Days',
            icon: Calendar,
            active: pathname.includes('/seller/market-days'),
        }] : []),
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
            href: '/seller/profile/edit',
            label: 'Settings',
            icon: Settings,
            active: pathname.includes('/seller/profile'),
        },
        {
            href: '/seller/disputes',
            label: 'Disputes',
            icon: AlertTriangle,
            active: pathname.includes('/seller/disputes'),
        },
        {
            href: '/seller/support',
            label: 'Support',
            icon: Headphones,
            active: pathname.includes('/seller/support'),
        },
        ...(storeSlug ? [{
            href: `/store/${storeSlug}`,
            label: 'View Store',
            icon: Store,
            active: false,
        }] : []),
    ]

    const isMoreActive = secondaryItems.some(item => item.active)

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-1">
                    {primaryTabs.map(tab => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative touch-manipulation transition-colors",
                                tab.active
                                    ? "text-emerald-600"
                                    : "text-gray-400 active:text-gray-600"
                            )}
                        >
                            <div className="relative">
                                <tab.icon className="h-5 w-5" />
                                {(tab as any).badge && (
                                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white">
                                        {(tab as any).badge > 99 ? '99+' : (tab as any).badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
                            {tab.active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-b-full" />
                            )}
                        </Link>
                    ))}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMore(true)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative touch-manipulation transition-colors",
                            isMoreActive || showMore
                                ? "text-emerald-600"
                                : "text-gray-400 active:text-gray-600"
                        )}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="text-[10px] font-medium leading-tight">More</span>
                        {isMoreActive && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-b-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* More Sheet Overlay */}
            {showMore && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[60] bg-black/40 md:hidden"
                        onClick={() => setShowMore(false)}
                    />

                    {/* Sheet */}
                    <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden animate-in slide-in-from-bottom duration-200">
                        <div className="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden">
                            {/* Handle + Close */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">More Options</h3>
                                <button
                                    onClick={() => setShowMore(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="p-3 space-y-1 overflow-y-auto">
                                {secondaryItems.map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setShowMore(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors touch-manipulation min-h-[48px]",
                                            item.active
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5", item.active ? "text-emerald-600" : "text-gray-400")} />
                                        {item.label}
                                        {item.active && (
                                            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-600" />
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {/* Safe area padding for devices with home indicator */}
                            <div className="h-6" />
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
