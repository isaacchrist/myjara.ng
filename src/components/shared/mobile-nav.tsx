'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, ShoppingBag, User, LayoutDashboard, MessageSquare, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MobileNavProps {
    user: import('@supabase/supabase-js').User | null
    count: number
    onLogout: () => Promise<void>
}

export function MobileNav({ user, count, onLogout }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button className="p-2">
                    {isOpen ? (
                        <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    ) : (
                        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 mb-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="text-2xl font-bold text-emerald-600 tracking-wide" style={{ fontFamily: '"Lobster", cursive' }}>
                            MyJara
                        </span>
                    </Link>

                    {user && (
                        <Link
                            href="/register/seller"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 text-lg font-semibold text-emerald-600"
                        >
                            <Store className="h-5 w-5" />
                            Sell on MyJara
                        </Link>
                    )}

                    <Link
                        href="/search"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                        onClick={() => setIsOpen(false)}
                    >
                        <Search className="h-5 w-5" />
                        Explore Products
                    </Link>
                    <Link
                        href="/categories"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                        onClick={() => setIsOpen(false)}
                    >
                        Explore Categories
                    </Link>
                    <Link
                        href="/inbox"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                        onClick={() => setIsOpen(false)}
                    >
                        <MessageSquare className="h-5 w-5" />
                        Messages
                    </Link>
                    <Link
                        href="/orders"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                        onClick={() => setIsOpen(false)}
                    >
                        <ShoppingBag className="h-5 w-5" />
                        My Orders
                    </Link>
                    {user && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                            onClick={() => setIsOpen(false)}
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                        </Link>
                    )}

                    {user ? (
                        <Button variant="outline" className="w-full mt-2" onClick={() => {
                            onLogout()
                            setIsOpen(false)
                        }}>
                            Sign Out
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2 mt-2">
                            <Link
                                href="/login"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                onClick={() => setIsOpen(false)}
                            >
                                <User className="h-5 w-5" />
                                Sign In
                            </Link>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                                <Link href="/register/seller" onClick={() => setIsOpen(false)}>
                                    Sell on MyJara
                                </Link>
                            </Button>
                        </div>
                    )}
                </nav>
            </SheetContent>
        </Sheet>
    )
}
