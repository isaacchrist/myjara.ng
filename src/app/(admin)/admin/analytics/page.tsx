import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { OverviewCharts } from '@/components/dashboard/analytics-charts'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, Users, Store, ShoppingCart } from 'lucide-react'

export default async function AdminAnalyticsPage() {
    const supabase = await createAdminClient()

    // Fetch platform-wide stats
    const { count: totalUsers } = await supabase.from('stores').select('owner_id', { count: 'exact', head: true }) as any
    const { count: totalStores } = await supabase.from('stores').select('id', { count: 'exact', head: true }) as any
    const { count: totalOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true }) as any
    const { data: revenueData } = await supabase.from('orders').select('total_amount').eq('status', 'completed') as any

    const totalRevenue = (revenueData || []).reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)

    // Mock chart data for now (would need proper RPC for real data)
    const chartData = Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 50) + 5
    }))

    const stats = [
        { label: 'Total Sellers', value: totalUsers || 0, icon: Users, color: 'text-blue-500' },
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
                <OverviewCharts data={chartData} />
            </div>
        </div>
    )
}
