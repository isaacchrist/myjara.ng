import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { OverviewCharts } from '@/components/dashboard/analytics-charts'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, Users, Store, ShoppingCart } from 'lucide-react'
import { LocationSalesAnalytics } from '@/components/dashboard/location-sales-analytics'

export default async function AdminAnalyticsPage() {
    const supabase = await createAdminClient()

    // 1. Fetch platform-wide stats
    const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true }) as any
    const { count: totalStores } = await supabase.from('stores').select('id', { count: 'exact', head: true }) as any
    const { count: totalOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true }) as any
    const { data: revenueData } = await supabase.from('orders').select('total_amount').eq('status', 'completed') as any

    const totalRevenue = (revenueData || []).reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)

    // 2. Fetch Chart Data (Last 30 Days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at, total_amount')
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
            dailyStats[dateStr].revenue += (order.total_amount || 0)
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

    // 4. Fetch User Location Distribution (via Stores -> Logistics)
    // Since we don't have user addresses easily accessible for all users, we use Store Locations as a proxy for "active business areas"
    const { data: storeLocations } = await supabase
        .from('store_logistics')
        .select('city')
        .eq('is_active', true) as any

    const locationCounts: Record<string, number> = {}

        ; (storeLocations || []).forEach((l: any) => {
            if (l.city) {
                locationCounts[l.city] = (locationCounts[l.city] || 0) + 1
            }
        })

    // Get Top 6 locations
    const usersByLocation = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }))

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

            {/* Advanced Analytics */}
            <LocationSalesAnalytics />
        </div>
    )
}
