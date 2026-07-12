import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { OverviewCharts } from '@/components/dashboard/analytics-charts'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, Users, Store, ShoppingCart, Repeat, MapPin } from 'lucide-react'
import { LocationSalesAnalytics } from '@/components/dashboard/location-sales-analytics'

const RATE_WINDOWS = [7, 30, 90] as const

export default async function AdminAnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ window?: string }>
}) {
    const resolvedSearchParams = await searchParams
    const windowDays = RATE_WINDOWS.includes(Number(resolvedSearchParams.window) as any)
        ? Number(resolvedSearchParams.window)
        : 30

    const supabase = await createAdminClient()

    // 1. Fetch platform-wide stats
    const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true }) as any
    const { count: totalStores } = await supabase.from('stores').select('id', { count: 'exact', head: true }) as any
    const { count: totalOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true }) as any
    // NOTE: orders has no 'completed' status (enum is pending|paid|processing|
    // shipped|delivered|cancelled) and no total_amount column (it's `total`)
    // -- this previously always summed to 0.
    const { data: deliveredOrders } = await supabase
        .from('orders')
        .select('user_id, store_id, total, created_at')
        .eq('status', 'delivered') as any

    const totalRevenue = (deliveredOrders || []).reduce((sum: number, order: any) => sum + (order.total || 0), 0)

    // 2. Fetch Chart Data (Last 30 Days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true }) as any

    // Aggregate by Day
    const dailyStats: Record<string, { revenue: number, orders: number }> = {}

    // Initialize last 30 days with 0
    for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
        dailyStats[dateStr] = { revenue: 0, orders: 0 }
    }

    (recentOrders || []).forEach((order: any) => {
        const dateStr = new Date(order.created_at).toISOString().split('T')[0]
        if (dailyStats[dateStr]) {
            dailyStats[dateStr].revenue += (order.total || 0)
            dailyStats[dateStr].orders += 1
        }
    })

    const chartData = Object.entries(dailyStats)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, stats]) => ({
            date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            revenue: stats.revenue,
            orders: stats.orders
        }))

    // 3. Fetch User Roles Distribution
    const { data: usersData } = await supabase.from('users').select('role') as any
    const roleCounts: Record<string, number> = {}

        ; (usersData || []).forEach((u: any) => {
            const role = u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Unknown'
            roleCounts[role] = (roleCounts[role] || 0) + 1
        })

    const usersByRole = Object.entries(roleCounts).map(([name, value]) => ({ name, value }))

    // 4. Sales by Location -- attributed to each store's primary
    // store_locations row (Phase 2.5), weighted by delivered-order revenue
    // rather than just counting active logistics configs (the old proxy,
    // which measured setup activity, not actual sales).
    const orderStoreIds = Array.from(new Set((deliveredOrders || []).map((o: any) => o.store_id).filter(Boolean)))

    const { data: storesData } = orderStoreIds.length
        ? await supabase.from('stores').select('id, name, shop_type').in('id', orderStoreIds) as any
        : { data: [] as any[] }

    const storeById: Record<string, { name: string; shop_type: string }> = {}
    ; (storesData || []).forEach((s: any) => { storeById[s.id] = { name: s.name, shop_type: s.shop_type } })

    const { data: primaryLocations } = orderStoreIds.length
        ? await supabase.from('store_locations').select('store_id, market_name, city, name').in('store_id', orderStoreIds).eq('is_primary', true) as any
        : { data: [] as any[] }

    const locationByStore: Record<string, string> = {}
    ; (primaryLocations || []).forEach((l: any) => {
        locationByStore[l.store_id] = l.market_name || l.city || l.name || 'Unknown'
    })

    const locationRevenue: Record<string, number> = {}
    ; (deliveredOrders || []).forEach((o: any) => {
        const loc = locationByStore[o.store_id]
        if (!loc) return
        locationRevenue[loc] = (locationRevenue[loc] || 0) + (o.total || 0)
    })

    // Top 6 locations by revenue
    const usersByLocation = Object.entries(locationRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }))

    // 5. Conversion -- distinct paying customers and sales volume per
    // customer, all-time, across delivered orders.
    const customerTotals: Record<string, number> = {}
    ; (deliveredOrders || []).forEach((o: any) => {
        if (!o.user_id) return
        customerTotals[o.user_id] = (customerTotals[o.user_id] || 0) + (o.total || 0)
    })
    const totalPayingCustomers = Object.keys(customerTotals).length
    const avgSalesPerCustomer = totalPayingCustomers > 0 ? totalRevenue / totalPayingCustomers : 0

    // 6. Rate -- repeat-purchase rate within the selected window, and how
    // many times each customer bought from a given brand (wholesaler) in
    // that window.
    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - windowDays)
    const ordersInWindow = (deliveredOrders || []).filter((o: any) => new Date(o.created_at) >= windowStart)

    const customerOrderCountsInWindow: Record<string, number> = {}
    ordersInWindow.forEach((o: any) => {
        if (!o.user_id) return
        customerOrderCountsInWindow[o.user_id] = (customerOrderCountsInWindow[o.user_id] || 0) + 1
    })
    const customersInWindow = Object.keys(customerOrderCountsInWindow).length
    const repeatCustomersInWindow = Object.values(customerOrderCountsInWindow).filter((c) => c > 1).length
    const repeatRatePct = customersInWindow > 0 ? (repeatCustomersInWindow / customersInWindow) * 100 : 0

    const customerBrandCounts: Record<string, { customerId: string; storeId: string; storeName: string; count: number }> = {}
    ordersInWindow.forEach((o: any) => {
        const store = storeById[o.store_id]
        if (!store || store.shop_type !== 'brand' || !o.user_id) return
        const key = `${o.user_id}:${o.store_id}`
        if (!customerBrandCounts[key]) {
            customerBrandCounts[key] = { customerId: o.user_id, storeId: o.store_id, storeName: store.name, count: 0 }
        }
        customerBrandCounts[key].count += 1
    })
    const topRepeatBrandCustomers = Object.values(customerBrandCounts)
        .filter((c) => c.count > 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

    const topCustomerIds = Array.from(new Set(topRepeatBrandCustomers.map((c) => c.customerId)))
    const { data: topCustomersData } = topCustomerIds.length
        ? await supabase.from('users').select('id, full_name, email').in('id', topCustomerIds) as any
        : { data: [] as any[] }
    const userById: Record<string, { full_name: string; email: string }> = {}
    ; (topCustomersData || []).forEach((u: any) => { userById[u.id] = u })

    const stats = [
        { label: 'Total Users', value: totalUsers || 0, icon: Users, color: 'text-emerald-500' },
        { label: 'Total Stores', value: totalStores || 0, icon: Store, color: 'text-emerald-500' },
        { label: 'Total Orders', value: totalOrders || 0, icon: ShoppingCart, color: 'text-purple-500' },
        { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'text-orange-500' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
                <p className="text-gray-400">Overview of platform-wide metrics</p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="bg-gray-800 border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">{stat.label}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="rounded-xl bg-gray-800 p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Revenue & Orders Trends</h2>
                <OverviewCharts
                    data={chartData}
                    usersByRole={usersByRole}
                    usersByLocation={usersByLocation}
                />
            </div>

            {/* Conversion & Repeat-Purchase Rate */}
            <div className="rounded-xl bg-gray-800 p-6 border border-gray-700 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Conversion & Repeat-Purchase Rate</h2>
                        <p className="text-sm text-gray-400">Conversion is all-time; rate is windowed to catch how often repeat buying happens.</p>
                    </div>
                    <div className="flex gap-2">
                        {RATE_WINDOWS.map((w) => (
                            <Link
                                key={w}
                                href={`/admin/analytics?window=${w}`}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${windowDays === w
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                {w}d
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gray-850 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Paying Customers (all-time)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{totalPayingCustomers}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-850 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Avg Sales / Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{formatPrice(avgSalesPerCustomer)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-850 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Customers ({windowDays}d)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{customersInWindow}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-850 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Repeat-Purchase Rate ({windowDays}d)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white flex items-center gap-2">
                                <Repeat className="h-5 w-5 text-emerald-400" />
                                {repeatRatePct.toFixed(1)}%
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{repeatCustomersInWindow} of {customersInWindow} bought more than once</p>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Most Loyal Customers per Brand ({windowDays}d, 2+ purchases from the same wholesaler)
                    </h3>
                    {topRepeatBrandCustomers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-700">
                                        <th className="pb-2 font-medium">Customer</th>
                                        <th className="pb-2 font-medium">Brand</th>
                                        <th className="pb-2 font-medium text-right">Purchases</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topRepeatBrandCustomers.map((c) => {
                                        const user = userById[c.customerId]
                                        return (
                                            <tr key={`${c.customerId}:${c.storeId}`} className="border-b border-gray-800 last:border-0">
                                                <td className="py-2 text-gray-200">{user?.full_name || user?.email || 'Unknown customer'}</td>
                                                <td className="py-2 text-gray-400">{c.storeName}</td>
                                                <td className="py-2 text-right text-white font-medium">{c.count}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No customer has bought more than once from the same brand in this window yet.</p>
                    )}
                </div>
            </div>

            {/* Advanced Analytics */}
            <LocationSalesAnalytics />
        </div>
    )
}
