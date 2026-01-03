import Link from 'next/link'
import { Store, ShoppingCart, Users, CreditCard, TrendingUp, AlertCircle, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

const stats = [
    { label: 'Active Stores', value: '156', change: '+8', icon: Store, color: 'emerald' },
    { label: 'Orders Today', value: '1,234', change: '+12%', icon: ShoppingCart, color: 'blue' },
    { label: 'Revenue (MTD)', value: '₦12.4M', change: '+15%', icon: CreditCard, color: 'purple' },
    { label: 'Active Users', value: '8,421', change: '+5%', icon: Users, color: 'amber' },
]

const pendingStores = [
    { id: '1', name: 'TechGadgets NG', category: 'Electronics', appliedAt: '2 hours ago' },
    { id: '2', name: 'FreshFoods Ltd', category: 'Groceries', appliedAt: '5 hours ago' },
    { id: '3', name: 'StyleHub Africa', category: 'Fashion', appliedAt: '1 day ago' },
]

const recentTransactions = [
    { id: 'TX-8891', store: 'FoodMart', amount: 48000, status: 'success' },
    { id: 'TX-8890', store: 'AgroDeals', amount: 22500, status: 'success' },
    { id: 'TX-8889', store: 'TechZone', amount: 150000, status: 'pending' },
    { id: 'TX-8888', store: 'StyleHub', amount: 35000, status: 'failed' },
]

export default function AdminPage() {
    return (
        <div className="space-y-8 text-white">
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
                                <Badge className="border-0 bg-gray-700 text-emerald-400">
                                    {stat.change}
                                </Badge>
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
                        <Link href="/admin/stores?status=pending" className="text-sm text-emerald-400 hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingStores.map((store) => (
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
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-400 hover:bg-green-400/20 hover:text-green-300">
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:bg-red-400/20 hover:text-red-300">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
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
                            {recentTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 font-mono text-xs text-gray-300">
                                            💳
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{tx.id}</p>
                                            <p className="text-sm text-gray-400">{tx.store}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-white">{formatPrice(tx.amount)}</p>
                                        <Badge
                                            className={
                                                tx.status === 'success' ? 'border-0 bg-green-500/20 text-green-400' :
                                                    tx.status === 'pending' ? 'border-0 bg-yellow-500/20 text-yellow-400' :
                                                        'border-0 bg-red-500/20 text-red-400'
                                            }
                                        >
                                            {tx.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
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
                            <p className="text-sm text-gray-400">Payment Success Rate</p>
                            <p className="mt-1 text-xl font-bold text-green-400">98.5%</p>
                        </div>
                        <div className="rounded-lg bg-gray-800 p-4">
                            <p className="text-sm text-gray-400">Active Issues</p>
                            <p className="mt-1 text-xl font-bold text-yellow-400">3</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
