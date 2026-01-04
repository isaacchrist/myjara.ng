'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Search, ShoppingBag, User, Sun, Moon, LogOut, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
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
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/orders">
                                <ShoppingBag className="h-5 w-5" />
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
                            </div>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                                    <Link href="/register/brand">Sell on MyJara</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            className="p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "absolute left-0 right-0 top-16 border-b border-gray-100 bg-white p-4 shadow-lg transition-all duration-200 md:hidden dark:border-gray-800 dark:bg-gray-950",
                    mobileMenuOpen ? "block" : "hidden"
                )}
            >
                <nav className="flex flex-col gap-4">
                    <Link
                        href="/search"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <Search className="h-5 w-5" />
                        Explore Products
                    </Link>
                    <Link
                        href="/categories"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Categories
                    </Link>
                    <Link
                        href="/orders"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <ShoppingBag className="h-5 w-5" />
                        My Orders
                    </Link>
                    {user && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <LayoutDashboard className="h-5 w-5" />
                            Dashboard
                        </Link>
                    )}
                    <hr className="my-2 dark:border-gray-800" />
                    {user ? (
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                            Sign Out
                        </Button>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <User className="h-5 w-5" />
                                Sign In
                            </Link>
                            <Button className="w-full" asChild>
                                <Link href="/register/brand" onClick={() => setMobileMenuOpen(false)}>
                                    Sell on MyJara
                                </Link>
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}
