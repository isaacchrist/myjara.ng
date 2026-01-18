'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShoppingBag, User, LogOut, LayoutDashboard, MessageSquare, ChevronDown, Heart, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
                        <Image src="/logo.png" alt="MyJara Logo" width={140} height={40} className="h-10 w-auto" priority />
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

                        <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-full" title="Search">
                            <Link href="/search">
                                <Search className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="relative h-10 w-10 rounded-full" title="Cart">
                            <Link href="/cart">
                                <ShoppingBag className="h-5 w-5" />
                                {mounted && count > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                        {count}
                                    </span>
                                )}
                            </Link>
                        </Button>
                        <Link
                            href="/register/seller"
                            className="hidden md:inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                            <Store className="mr-2 h-4 w-4" />
                            Sell on MyJara
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-2">
                                {user.user_metadata?.role === 'brand_admin' && (
                                    <Button variant="outline" size="sm" asChild className="h-10">
                                        <Link href="/dashboard">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            My Dashboard
                                        </Link>
                                    </Button>
                                )}
                                {user.user_metadata?.role === 'retailer' && (
                                    <Button variant="outline" size="sm" asChild className="h-10">
                                        <Link href="/seller/dashboard">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            My Dashboard
                                        </Link>
                                    </Button>
                                )}
                                {user.user_metadata?.role === 'platform_admin' && (
                                    <Button variant="outline" size="sm" asChild className="h-10">
                                        <Link href="/admin">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Admin
                                        </Link>
                                    </Button>
                                )}

                                <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-full" title="Messages">
                                    <Link href="/inbox">
                                        <MessageSquare className="h-5 w-5" />
                                        <span className="sr-only">Messages</span>
                                    </Link>
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative flex items-center gap-2 h-10 py-1 pl-1 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200">
                                            <div className="relative">
                                                <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-950 shadow-sm">
                                                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
                                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                                                        {user.user_metadata?.full_name?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-gray-950"></span>
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline-block">
                                                {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                                            </span>
                                            <ChevronDown className="h-3 w-3 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64 p-2 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-lg z-50" align="end" forceMount>
                                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-md mb-2">
                                            <DropdownMenuLabel className="font-normal p-0">
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-semibold leading-none text-emerald-900 dark:text-emerald-100">{user.user_metadata?.full_name || 'User'}</p>
                                                    <p className="text-xs leading-none text-emerald-600 dark:text-emerald-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                        </div>
                                        <DropdownMenuGroup>
                                            {(user.user_metadata?.role === 'customer' || !user.user_metadata?.role) && (
                                                <DropdownMenuItem asChild className="cursor-pointer">
                                                    <Link href="/customer/dashboard" className="w-full flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-emerald-500" />
                                                        <span>My Account</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href="/customer/settings" className="w-full flex items-center">
                                                    <LayoutDashboard className="mr-2 h-4 w-4 text-emerald-500" />
                                                    <span>Profile Settings</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href="/customer/favorites" className="w-full flex items-center">
                                                    <Heart className="mr-2 h-4 w-4 text-emerald-500" />
                                                    <span>Liked Vendors</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href="/customer/disputes" className="w-full flex items-center">
                                                    <MessageSquare className="mr-2 h-4 w-4 text-emerald-500" />
                                                    <span>My Disputes</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                        <DropdownMenuSeparator className="my-2" />
                                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 hover:shadow-md hover:scale-105" asChild>
                                    <Link href="/register/seller">Sell on MyJara</Link>
                                </Button>
                            </div>
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
