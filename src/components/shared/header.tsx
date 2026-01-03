'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, ShoppingBag, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                            <span className="text-lg font-bold text-white">M</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                            My<span className="text-emerald-600">Jara</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-8 md:flex">
                        <Link
                            href="/search"
                            className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
                        >
                            Explore
                        </Link>
                        <Link
                            href="/categories"
                            className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
                        >
                            Categories
                        </Link>
                        <Link
                            href="/how-it-works"
                            className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600"
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
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/register/brand">Sell on MyJara</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6 text-gray-700" />
                        ) : (
                            <Menu className="h-6 w-6 text-gray-700" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "absolute left-0 right-0 top-16 border-b border-gray-100 bg-white p-4 shadow-lg transition-all duration-200 md:hidden",
                    mobileMenuOpen ? "block" : "hidden"
                )}
            >
                <nav className="flex flex-col gap-4">
                    <Link
                        href="/search"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <Search className="h-5 w-5" />
                        Explore Products
                    </Link>
                    <Link
                        href="/categories"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Categories
                    </Link>
                    <Link
                        href="/orders"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <ShoppingBag className="h-5 w-5" />
                        My Orders
                    </Link>
                    <hr className="my-2" />
                    <Link
                        href="/login"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <User className="h-5 w-5" />
                        Sign In
                    </Link>
                    <Button className="w-full" asChild>
                        <Link href="/register/brand">Sell on MyJara</Link>
                    </Button>
                </nav>
            </div>
        </header>
    )
}
