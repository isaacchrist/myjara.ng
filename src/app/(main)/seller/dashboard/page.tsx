import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, ShoppingCart, TrendingUp, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export default async function RetailerDashboardPage() {
    const supabase = await createClient()

    // 1. Get Current User and Role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single() as any
    // Strictly allow only retailers
    if (userData?.role !== 'retailer') {
        redirect('/')
    }

    // 2. Fetch User Stats (As a Buyer/Reseller)
    // - Total Orders Placed
    // - Total Spend (Revenue for platform, Spend for retailer)
    // - Products (If they can upload?)

    // Check if they have a store (they should if they sell)
    const { data: store } = await supabase.from('stores').select('id, name').eq('owner_id', user.id).single() as any

    let totalOrders = 0
    let totalSpend = 0
    let recentOrders: any[] = []

    // Fetch Orders PLACED by this user (customer_id = user.id)
    const [ordersRes, spendRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', user.id),
        supabase.from('orders').select('total_amount').eq('customer_id', user.id).neq('status', 'cancelled')
    ])

    totalOrders = ordersRes.count || 0
    totalSpend = (spendRes.data as any[])?.reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0) || 0

    // Recent Orders
    const { data: recent } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, items:order_items(count)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    recentOrders = recent || []

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Retailer Dashboard</h1>
                    <p className="text-gray-500">
                        Welcome back, {user.user_metadata.full_name || 'Retailer'}
                    </p>
                </div>
                {/* Filter Sidebar or Actions? User asked for filters in Admin page, here maybe just actions */}
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Browse Marketplace
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <ShoppingCart className="h-5 w-5 text-gray-400" />
                            <Badge variant="secondary" className="text-emerald-600">Active</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                            <p className="text-sm text-gray-500">Orders Placed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <TrendingUp className="h-5 w-5 text-gray-400" />
                            <Badge variant="secondary" className="text-blue-600">Total</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(totalSpend)}</p>
                            <p className="text-sm text-gray-500">Total Spend</p>
                        </div>
                    </CardContent>
                </Card>
                {/* Placeholder for Products or Store Status if they sell */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <Package className="h-5 w-5 text-gray-400" />
                            {store ? (
                                <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Store Active</Badge>
                            ) : (
                                <Badge variant="secondary">No Store</Badge>
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="text-lg font-medium text-gray-900">{store ? store.name : 'Not Selling'}</p>
                            <p className="text-sm text-gray-500">Selling Status</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Orders */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-mono">
                                                📦
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                                                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">{formatPrice(order.total_amount)}</p>
                                            <Badge
                                                variant={
                                                    order.status === 'delivered' ? 'success' :
                                                        order.status === 'shipped' ? 'default' : 'secondary'
                                                }
                                                className={
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                }
                                            >
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No orders yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <Link href="/" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                                <span className="text-sm font-medium">Start Shopping</span>
                            </Link>
                            {/* If product upload is needed for retailers */}
                            <Link href="#" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 opacity-50 cursor-not-allowed" title="Coming Soon">
                                <Plus className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-500">Upload Product (Soon)</span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
