import Link from 'next/link'
import { Store, ShoppingCart, Users, CreditCard, TrendingUp, AlertCircle, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { getAdminSession } from '@/app/actions/admin-auth'
import { AdminKeyForm } from '@/components/admin/admin-key-form'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    const isAdmin = await getAdminSession()

    if (!isAdmin) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Access Restricted</h1>
                    <p className="text-gray-400">Please provide your credentials below.</p>
                </div>
                <AdminKeyForm
                    title="Platform Administrator"
                    description="Enter your master key to unlock global controls."
                />
            </div>
        )
    }

    const supabase = await createAdminClient()

    // 1. Fetch Stats
    // Active Stores
    const { count: activeStoresCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })

    // Total Orders (Today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: ordersTodayCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

    // Active Users (Use public.users table)
    const { count: totalUsersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })


    // Revenue (MTD)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startOfMonth)
        .eq('status', 'completed') as any

    const revenueMTD = (revenueData || []).reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)


    const stats = [
        { label: 'Active Stores', value: activeStoresCount || 0, change: '', icon: Store, color: 'emerald' },
        { label: 'Orders Today', value: ordersTodayCount || 0, change: '', icon: ShoppingCart, color: 'blue' },
        { label: 'Revenue (MTD)', value: formatPrice(revenueMTD), change: '', icon: CreditCard, color: 'purple' },
        { label: 'Total Users', value: totalUsersCount || 0, change: '', icon: Users, color: 'amber' },
    ]

    // 2. Pending Stores
    const { data: pendingStoresData } = await supabase
        .from('stores')
        .select('id, name, created_at, slug') // Category might be in a related table via store_product_categories?
        // Simplifying for Overview: just show name and date
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(5) as any

    const pendingStores = (pendingStoresData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: 'Pending Review', // Placeholder if category not directly on store
        appliedAt: formatDistanceToNow(new Date(s.created_at), { addSuffix: true })
    }))

    // 3. Recent Transactions
    const { data: recentTxData } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, store_id') // Join store?
        // .select('*, store:stores(name)') if relations set up?
        // Let's assume store name fetch or just show store ID if relations tricky without testing.
        .order('created_at', { ascending: false })
        .limit(5) as any

    // We might need to fetch store names separately if relation not obvious
    const recentTransactions = await Promise.all((recentTxData || []).map(async (tx: any) => {
        let storeName = 'Unknown Store'
        if (tx.store_id) {
            const { data: s } = await supabase.from('stores').select('name').eq('id', tx.store_id).single() as any
            if (s) storeName = s.name
        }
        return {
            id: tx.id.slice(0, 8).toUpperCase(),
            store: storeName,
            amount: tx.total_amount,
            status: tx.status
        }
    }))


    // Dashboard Content
    return (
        <div className="space-y-8 text-white animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Platform Overview</h1>
                <p className="text-gray-400">Monitor and manage the MyJara marketplace</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-gray-800 bg-gray-800/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={`rounded-lg bg-${stat.color}-500/20 p-2`}>
                                    <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-gray-400">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pending Approvals */}
                <Card className="border-gray-800 bg-gray-800/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <AlertCircle className="h-5 w-5 text-amber-400" />
                            Pending Store Approvals
                        </CardTitle>
                        <Link href="/admin/stores" className="text-sm text-emerald-400 hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingStores.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No pending approvals</p>
                            ) : (
                                pendingStores.map((store: any) => (
                                    <div
                                        key={store.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 text-lg">
                                                🏪
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{store.name}</p>
                                                <p className="text-sm text-gray-400">{store.category} • {store.appliedAt}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="border-gray-800 bg-gray-800/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <CreditCard className="h-5 w-5 text-purple-400" />
                            Recent Transactions
                        </CardTitle>
                        <Link href="/admin/transactions" className="text-sm text-emerald-400 hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentTransactions.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No recent transactions</p>
                            ) : (
                                recentTransactions.map((tx: any) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 font-mono text-xs text-gray-300">
                                                💳
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">#{tx.id}</p>
                                                <p className="text-sm text-gray-400">{tx.store}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-white">{formatPrice(tx.amount)}</p>
                                            <Badge
                                                className={
                                                    tx.status === 'success' || tx.status === 'completed' ? 'border-0 bg-green-500/20 text-green-400' :
                                                        tx.status === 'pending' ? 'border-0 bg-yellow-500/20 text-yellow-400' :
                                                            'border-0 bg-red-500/20 text-red-400'
                                                }
                                            >
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Health */}
            <Card className="border-gray-800 bg-gray-800/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        Platform Health
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-gray-800 p-4">
                            <p className="text-sm text-gray-400">API Response Time</p>
                            <p className="mt-1 text-xl font-bold text-green-400">45ms</p>
                        </div>
                        <div className="rounded-lg bg-gray-800 p-4">
                            <p className="text-sm text-gray-400">Uptime (30d)</p>
                            <p className="mt-1 text-xl font-bold text-green-400">99.9%</p>
                        </div>
                        <div className="rounded-lg bg-gray-800 p-4">
                            <p className="text-sm text-gray-400">Active Issues</p>
                            <div className="flex justify-between items-end">
                                <p className="mt-1 text-xl font-bold text-yellow-400">3</p>
                                <Link href="/admin/disputes" className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                                    Manage Disputes
                                </Link>
                            </div>
                        </div>
                        <div className="rounded-lg bg-gray-800 p-4">
                            <p className="text-sm text-gray-400">Payment Success Rate</p>
                            <p className="mt-1 text-xl font-bold text-green-400">98.5%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
