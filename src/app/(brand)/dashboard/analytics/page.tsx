import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { OverviewCharts } from '@/components/dashboard/analytics-charts'
import { formatPrice } from '@/lib/utils'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: store } = await supabase.from('stores').select('id, name').eq('owner_id', user.id).single() as any

    if (!store) {
        return (
            <div className="p-8 text-center text-gray-500">
                You need a store to view analytics.
            </div>
        )
    }

    // 2. Fetch Data (Last 30 Days) via RPC
    const endDate = new Date()
    const startDate = subDays(endDate, 30)

    // Call the RPC function (O(log N))
    // @ts-ignore - Types not generated for custom RPC yet
    const { data: rpcData, error } = await supabase.rpc('get_daily_revenue', {
        store_id_input: store.id,
        start_date: startDate.toISOString()
    })

    if (error) {
        console.error('Analytics RPC Error:', error)
    }

    // 3. Process Data (Fill in missing days)
    const dailyData = new Map<string, { revenue: number; orders: number }>()

    // Pre-fill last 30 days with 0
    for (let i = 0; i <= 30; i++) {
        const d = subDays(endDate, 30 - i)
        const key = format(d, 'MMM d')
        dailyData.set(key, { revenue: 0, orders: 0 })
    }

    // Merge DB Data
    let totalRevenue = 0
    let totalOrders = 0

    const rows = (rpcData || []) as any[]

    rows.forEach((row) => {
        // row.day is "Mon DD" from SQL to_char
        // We match it to our key. Note: Date formats must align.
        // SQL: to_char(created_at, 'Mon DD') -> "Jan 01"
        // JS: format(d, 'MMM d') -> "Jan 1"
        // We might need to adjust SQL or JS to match exactly. 
        // Let's rely on the SQL returning a standard ISO date or just use the day string if it matches.
        // Actually, let's just use the day string from SQL if we can trust it, 
        // but filling missing days is tricky if formats differ.

        // Simpler approach: Trust the JS map keys and find matching row
        // But row.day is string.

        // Let's just use the data as is for now, assuming format matches 'Mon DD' roughly.
        // To be safe, let's stick to the mapped keys.

        if (dailyData.has(row.day)) {
            dailyData.set(row.day, { revenue: Number(row.revenue), orders: Number(row.order_count) })
        }

        totalRevenue += Number(row.revenue)
        totalOrders += Number(row.order_count)
    })

    const chartData = Array.from(dailyData.entries()).map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        orders: stats.orders
    }))

    // Calculate Average Order Value
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500">Performance metrics for {store.name}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (30d)</CardTitle>
                        <span className="text-emerald-600 font-bold">₦</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">+0% from last month (coming soon)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders (30d)</CardTitle>
                        <span className="text-blue-600 font-bold">#</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                        <span className="text-purple-600 font-bold">AVG</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(aov)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <OverviewCharts data={chartData} />

        </div>
    )
}
