import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, ShoppingCart, Eye, TrendingUp, Gift, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Get User's Store
    // Using maybeSingle() because new users might not have a store yet (though reg flow creates one?)
    // Actually, branding flow creates store. Retailer flow creates user + metadata.
    // Retailers don't have "Stores" in the same way? Wait.
    // If I am a Retailer, do I have a Store ID?
    // Wholesalers have 'stores' table entries.
    // Retailers: The dashboard is for "Brand" (Wholesaler)?
    // The path is `(brand)/dashboard`.
    // If I am a Retailer, I might be redirected elsewhere?
    // Let's assume this dashboard is for Wholesalers (Brands).
    // But the user asked for "Retailer Dashboard Development".
    // Is `(brand)/dashboard` shared?
    // Let's check metadata role.

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single() as any
    const isRetailer = userData?.role === 'retailer'

    let storeId = null
    let storeName = ''

    if (isRetailer) {
        // Retailers don't have a record in 'stores' table usually?
        // Or maybe they do if they want to sell?
        // For now, let's assume they might not.
        // But the dashboard shows "Total Orders", "Revenue". Retailers BUY. 
        // So "Total Orders" for a Retailer = Orders they PLACED?
        // "Revenue" = ? (Maybe irrelevant for Retailer unless they resell on platform?)
        // The prompt said: "Develop Retailer Dashboard... Overview: Fetch and display real data for orders and products."
        // Retailers BUY products. So "Products" might mean "Inventory bought"?
        // Or "Products" they uploaded?
        // "Implement product upload functionality". So Retailers CAN sell?
        // If Retailers can sell, they need a Store.
        // Let's check if they have a store.
    }

    const { data: store } = await supabase.from('stores').select('id, name, slug').eq('owner_id', user.id).single() as any

    // Stats Data Containers
    let totalOrders = 0
    let totalRevenue = 0
    let totalProducts = 0
    let recentOrders: any[] = []

    if (store) {
        storeId = store.id
        storeName = store.name

        // Fetch Stats
        const [ordersRes, productsRes, revenueRes] = await Promise.all([
            // Orders Count
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
            // Products Count
            supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
            // Revenue (Sum of delivered orders)
            supabase.from('orders').select('total_amount').eq('store_id', store.id).eq('status', 'delivered')
        ])

        totalOrders = ordersRes.count || 0
        totalProducts = productsRes.count || 0
        totalRevenue = (revenueRes.data as any[])?.reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0) || 0

        // Recent Orders
        const { data: recent } = await supabase
            .from('orders')
            .select('id, total_amount, status, created_at, items:order_items(count)')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })
            .limit(5)

        recentOrders = recent || []
    } else {
        // No store found. Is this a new user?
        // If Retailer, maybe they don't have a store yet but want to apply?
    }

    // Prepare Display Data
    const stats = [
        { label: 'Total Orders', value: totalOrders.toString(), change: '0%', icon: ShoppingCart },
        { label: 'Revenue', value: formatPrice(totalRevenue), change: '0%', icon: TrendingUp },
        { label: 'Products', value: totalProducts.toString(), change: '0%', icon: Package },
        { label: 'Store Views', value: 'Coming Soon', change: '-', icon: Eye },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">
                        {storeName ? `Overview for ${storeName}` : 'Welcome! Set up your store to get started.'}
                    </p>
                </div>
                {store && (
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/dashboard/products/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Link>
                    </Button>
                )}
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

            {!store && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-amber-900">No Store Found</h3>
                        <p className="text-amber-700 mb-4">You haven't created a store profile yet.</p>
                        <Button asChild>
                            <Link href="/onboarding/store">Create Store</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

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
                                                        order.status === 'shipped' ? 'default' :
                                                            'secondary' // Changed from 'warning' which might not exist in variant
                                                }
                                                className={
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                                                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
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

                {/* Quick Actions (Replaced Jara Stats for now as it's complex) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
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
        </div>
    )
}
