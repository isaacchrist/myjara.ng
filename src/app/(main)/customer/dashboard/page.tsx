import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, ShoppingBag, CreditCard, User, Heart, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export default async function CustomerDashboardPage() {
    const supabase = await createClient()

    // 1. Get Current User and Role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single() as any

    // Retailers/wholesalers/admins have their own dashboards -- without this,
    // a retailer landing here (e.g. via the header dropdown) sees a second,
    // unrelated "dashboard" showing their buyer-side order history instead
    // of their store.
    if (userData?.role === 'retailer') redirect('/seller/dashboard')
    if (userData?.role === 'brand_admin') redirect('/dashboard')
    if (userData?.role === 'platform_admin') redirect('/admin')

    // 2. Fetch User Stats
    let totalOrders = 0
    let totalSpend = 0
    let recentOrders: any[] = []

    const [ordersRes, spendRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('orders').select('total').eq('user_id', user.id).neq('status', 'cancelled')
    ])

    totalOrders = ordersRes.count || 0
    totalSpend = (spendRes.data as any[])?.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0) || 0

    // Recent Orders
    const { data: recent } = await supabase
        .from('orders')
        .select('id, total, status, created_at, items:order_items(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

    recentOrders = recent || []

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
                <p className="text-gray-500 mt-1">
                    Welcome back, {user.user_metadata.full_name || 'Customer'}
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Sidebar Navigation (Visual) */}
                <div className="lg:col-span-1 space-y-2">
                    <Card>
                        <CardContent className="p-4 space-y-1">
                            <Button variant="ghost" className="w-full justify-start bg-emerald-50 text-emerald-700 font-medium">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href="/orders">
                                    <Package className="mr-2 h-4 w-4" />
                                    My Orders
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href="/customer/favorites">
                                    <Heart className="mr-2 h-4 w-4" />
                                    Liked Vendors
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href="/customer/disputes">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    My Disputes
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href="/customer/settings">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile Settings
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                                    <p className="text-sm text-gray-500">Total Orders</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalSpend)}</p>
                                    <p className="text-sm text-gray-500">Total Spent</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <div>
                                    <Button asChild variant="link" className="p-0 h-auto font-semibold text-lg text-gray-900">
                                        <Link href="/">Continue Shopping &rarr;</Link>
                                    </Button>
                                    <p className="text-sm text-gray-500">Browse Products</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Orders */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Orders</CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/orders">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                                    <Package className="h-6 w-6 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                                                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                                                <Badge
                                                    variant={
                                                        order.status === 'delivered' ? 'success' :
                                                            order.status === 'shipped' ? 'default' : 'secondary'
                                                    }
                                                    className={
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            order.status === 'shipped' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                    }
                                                >
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="mx-auto h-12 w-12 text-gray-300 mb-2">
                                            <Package className="h-full w-full" />
                                        </div>
                                        <p>No orders yet.</p>
                                        <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                            <Link href="/">Start Shopping</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function LayoutDashboard({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    )
}
