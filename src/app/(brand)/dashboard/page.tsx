import Link from 'next/link'
import { Package, ShoppingCart, Eye, TrendingUp, Gift, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

// Mock dashboard data
const stats = [
    { label: 'Total Orders', value: '156', change: '+12%', icon: ShoppingCart },
    { label: 'Revenue (30d)', value: '₦2.4M', change: '+8%', icon: TrendingUp },
    { label: 'Products', value: '34', change: '+2', icon: Package },
    { label: 'Page Views', value: '1.2K', change: '+24%', icon: Eye },
]

const recentOrders = [
    { id: 'ORD-0042', product: 'Rice 50kg ×3', total: 144000, status: 'processing' },
    { id: 'ORD-0041', product: 'Rice 25kg ×5', total: 112500, status: 'shipped' },
    { id: 'ORD-0040', product: 'Beans 10kg ×2', total: 28000, status: 'delivered' },
    { id: 'ORD-0039', product: 'Garri 50kg ×1', total: 35000, status: 'delivered' },
]

const jaraStats = {
    givenThisWeek: 45,
    changePercent: 23,
    topProduct: 'Premium Basmati Rice',
}

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back! Here's what's happening with your store.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <stat.icon className="h-5 w-5 text-gray-400" />
                                <Badge variant="secondary" className="text-emerald-600">
                                    {stat.change}
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Orders */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Orders</CardTitle>
                        <Link href="/dashboard/orders" className="text-sm text-emerald-600 hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-mono">
                                            📦
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{order.id}</p>
                                            <p className="text-sm text-gray-500">{order.product}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                                        <Badge
                                            variant={
                                                order.status === 'delivered' ? 'success' :
                                                    order.status === 'shipped' ? 'default' :
                                                        'warning'
                                            }
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Jara Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-amber-500" />
                            Jara Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
                                <span className="text-3xl font-bold text-amber-600">
                                    {jaraStats.givenThisWeek}
                                </span>
                            </div>
                            <p className="mt-4 text-gray-500">Items given this week</p>
                            <Badge variant="jara" className="mt-2">
                                +{jaraStats.changePercent}% vs last week
                            </Badge>
                        </div>
                        <div className="mt-6 rounded-lg bg-gray-50 p-4">
                            <p className="text-xs text-gray-500">Top Jara Product</p>
                            <p className="mt-1 font-medium text-gray-900">{jaraStats.topProduct}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Link
                            href="/dashboard/products/new"
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
                        >
                            <Package className="h-6 w-6 text-emerald-600" />
                            <span className="font-medium text-gray-900">Add Product</span>
                        </Link>
                        <Link
                            href="/dashboard/jara"
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-amber-500 hover:bg-amber-50"
                        >
                            <Gift className="h-6 w-6 text-amber-600" />
                            <span className="font-medium text-gray-900">Set Jara Offer</span>
                        </Link>
                        <Link
                            href="/dashboard/orders"
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
                        >
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                            <span className="font-medium text-gray-900">View Orders</span>
                        </Link>
                        <Link
                            href="/dashboard/analytics"
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-500 hover:bg-purple-50"
                        >
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                            <span className="font-medium text-gray-900">Analytics</span>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
