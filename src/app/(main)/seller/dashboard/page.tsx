import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, ShoppingCart, TrendingUp, Plus, User, MapPin, CreditCard, Settings, Store, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export default async function RetailerDashboardPage() {
    const supabase = await createClient()

    // 1. Get Current User and Role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase.from('users').select('role, full_name, email, phone, avatar_url').eq('id', user.id).single() as any

    // Strictly allow only retailers and brand admins
    if (userData?.role !== 'retailer' && userData?.role !== 'brand_admin') {
        redirect('/')
    }

    const isWholesaler = userData?.role === 'brand_admin'

    // 2. Fetch Store Data
    const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single() as any

    // 3. Fetch Products Count (if store exists)
    let productCount = 0
    if (store) {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id)
        productCount = count || 0
    }

    // 4. Fetch Order Stats
    const [ordersRes, spendRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', user.id),
        supabase.from('orders').select('total_amount').eq('customer_id', user.id).neq('status', 'cancelled')
    ])

    const totalOrders = ordersRes.count || 0
    const totalSpend = (spendRes.data as any[])?.reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0) || 0

    // 5. Recent Orders
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Calculate subscription status
    const isExpired = store?.subscription_expiry && new Date(store.subscription_expiry) < new Date()
    const daysUntilExpiry = store?.subscription_expiry
        ? Math.ceil((new Date(store.subscription_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isWholesaler ? 'Wholesaler Dashboard' : 'Retailer Dashboard'}
                    </h1>
                    <p className="text-gray-500">
                        Welcome back, {userData?.full_name || user.user_metadata.full_name || 'Seller'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="outline">
                        <Link href="/seller/products/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Link>
                    </Button>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Browse Marketplace
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Subscription Warning */}
            {isExpired && (
                <Card className="border-red-200 bg-red-50 mb-6">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <p className="font-medium text-red-900">Subscription Expired</p>
                                <p className="text-sm text-red-700">Renew to continue selling on MyJara</p>
                            </div>
                        </div>
                        <Button asChild className="bg-red-600 hover:bg-red-700">
                            <Link href="/seller/subscription">Renew Now</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {daysUntilExpiry && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 mb-6">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <p className="text-yellow-900">Your subscription expires in <strong>{daysUntilExpiry} days</strong></p>
                        </div>
                        <Button asChild variant="outline" className="border-yellow-600 text-yellow-700">
                            <Link href="/seller/subscription">Renew</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Location Prompt */}
            {store && (!store.latitude || !store.longitude) && !isWholesaler && (
                <Card className="border-emerald-200 bg-emerald-50 mb-6">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-emerald-600" />
                            <div>
                                <p className="font-medium text-emerald-900">Add Your Store Location</p>
                                <p className="text-sm text-emerald-700">Help customers find you by adding your precise location.</p>
                            </div>
                        </div>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link href="/seller/products/new">Add Location via Product</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Profile & Store Info */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Your Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">
                                {(userData?.full_name || 'R')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="font-semibold text-lg">{userData?.full_name}</p>
                                <p className="text-sm text-gray-500">{userData?.email}</p>
                                <p className="text-sm text-gray-500">{userData?.phone}</p>
                                <Badge className="mt-2">{userData?.role}</Badge>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <Link href="/seller/profile" className="text-sm text-emerald-600 hover:underline">
                                View Full Profile →
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Store Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Your Store
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {store ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-lg">{store.name}</p>
                                    <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                                        {store.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p><strong>Type:</strong> {store.shop_type || 'Not Set'}</p>
                                    <p><strong>Plan:</strong> {store.subscription_plan || 'Basic'}</p>
                                    {store.market_name && <p><strong>Market:</strong> {store.market_name}</p>}
                                    {store.latitude && store.longitude && (
                                        <p className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            Location Verified
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No store found. Contact support.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <Package className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-gray-900">{productCount}</p>
                            <p className="text-sm text-gray-500">Products Listed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <ShoppingCart className="h-5 w-5 text-emerald-600" />
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
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(totalSpend)}</p>
                            <p className="text-sm text-gray-500">Total Spent</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-gray-900 capitalize">{store?.subscription_plan || 'Basic'}</p>
                            <p className="text-sm text-gray-500">Current Plan</p>
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
                            {recentOrders && recentOrders.length > 0 ? (
                                recentOrders.map((order: any) => (
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
                                                className={
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'shipped' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
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
                        <div className="grid gap-3">
                            <Link href="/seller/products" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <Package className="h-5 w-5 text-emerald-600" />
                                <span className="text-sm font-medium">My Products</span>
                            </Link>
                            <Link href="/seller/products/new" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <Plus className="h-5 w-5 text-emerald-600" />
                                <span className="text-sm font-medium">Add Product</span>
                            </Link>

                            {!isWholesaler && (
                                <Link href="/seller/market-days" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium">Market Days</span>
                                </Link>
                            )}

                            <Link href="/seller/profile" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <User className="h-5 w-5 text-purple-600" />
                                <span className="text-sm font-medium">Edit Profile</span>
                            </Link>
                            <Link href="/seller/subscription" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <CreditCard className="h-5 w-5 text-orange-600" />
                                <span className="text-sm font-medium">Subscription</span>
                            </Link>
                            <Link href="/" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <ShoppingCart className="h-5 w-5 text-gray-600" />
                                <span className="text-sm font-medium">Browse Marketplace</span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

