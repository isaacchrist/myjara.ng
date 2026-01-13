'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShoppingBag, User, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

import { useCart } from '@/context/cart-context'
import dynamic from 'next/dynamic'

// Lazy load MobileNav to reduce initial bundle size for mobile
const MobileNav = dynamic(() => import('./mobile-nav').then(mod => mod.MobileNav), {
    ssr: false,
    loading: () => <div className="p-2"><div className="h-6 w-6 bg-gray-100 rounded animate-pulse" /></div>
})

export function Header() {
    // const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Removed
    const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null)
    const [mounted, setMounted] = useState(false)

    const { count } = useCart()
    const supabase = createClient()
    const router = useRouter()

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null)
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                router.refresh()
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }




    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-4xl font-bold text-emerald-600 tracking-wide" style={{ fontFamily: '"Lobster", cursive' }}>
                            MyJara
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-8 md:flex">
                        <Link
                            href="/search"
                            className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500"
                        >
                            Explore
                        </Link>
                        <Link
                            href="/categories"
                            className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500"
                        >
                            Categories
                        </Link>
                        <Link
                            href="/how-it-works"
                            className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500"
                        >
                            How It Works
                        </Link>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden items-center gap-3 md:flex">

                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/search">
                                <Search className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="relative">
                            <Link href="/cart">
                                <ShoppingBag className="h-5 w-5" />
                                {mounted && count > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                        {count}
                                    </span>
                                )}
                            </Link>
                        </Button>

                        {user ? (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleLogout}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/inbox">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Messages
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 hover:shadow-md hover:scale-105" asChild>
                                    <Link href="/register/seller">Sell on MyJara</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button - REPLACED WITH ISOLATED COMPONENT */}
                    <div className="md:hidden">
                        <MobileNav user={user} count={mounted ? count : 0} onLogout={handleLogout} />
                    </div>
                </div>
            </div>
        </header>
    )
}
