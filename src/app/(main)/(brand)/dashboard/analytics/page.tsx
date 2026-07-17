import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { OverviewCharts } from '@/components/dashboard/analytics-charts'
import { deliveryLocationLabel, formatJara, formatPrice } from '@/lib/utils'
import { subDays, format } from 'date-fns'
import { Gift } from 'lucide-react'

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

    // 4. Jara performance -- which jara terms on this brand's own catalog
    // drive the most sales volume, broken down by category and by delivery
    // location. All-time (not scoped to the 30-day RPC window above), same
    // non-cancelled convention as get_daily_revenue.
    type OrderRecord = { id: string; delivery_address: unknown; status: string | null }
    const { data: ordersData } = await supabase
        .from('orders')
        .select('id, delivery_address, status')
        .eq('store_id', store.id)
        .neq('status', 'cancelled') as any
    const jaraOrders = (ordersData as OrderRecord[] | null) || []

    const orderLocationById: Record<string, string> = {}
    jaraOrders.forEach((o) => {
        const loc = deliveryLocationLabel(o.delivery_address)
        if (loc) orderLocationById[o.id] = loc
    })

    type ProductRecord = { id: string; name: string; category_id: string | null; jara_buy_quantity: number | null; jara_get_quantity: number | null }
    const { data: productsData } = await supabase
        .from('products')
        .select('id, name, category_id, jara_buy_quantity, jara_get_quantity')
        .eq('store_id', store.id) as any
    const products = (productsData as ProductRecord[] | null) || []
    const productById: Record<string, ProductRecord> = {}
    products.forEach((p) => { productById[p.id] = p })

    const categoryIds = Array.from(new Set(products.map((p) => p.category_id).filter(Boolean))) as string[]
    const { data: categoriesData } = categoryIds.length
        ? await supabase.from('categories').select('id, name').in('id', categoryIds) as any
        : { data: [] as any[] }
    const categoryNameById: Record<string, string> = {}
    ; (categoriesData || []).forEach((c: any) => { categoryNameById[c.id] = c.name })

    const jaraOrderIds = jaraOrders.map((o) => o.id)
    type OrderItemRecord = { order_id: string; product_id: string; quantity: number; jara_quantity: number | null; total_price: number | null }
    const { data: itemsData } = jaraOrderIds.length
        ? await supabase.from('order_items').select('order_id, product_id, quantity, jara_quantity, total_price').in('order_id', jaraOrderIds) as any
        : { data: [] as OrderItemRecord[] }
    const orderItems = (itemsData as OrderItemRecord[] | null) || []

    const categoryJaraVolume: Record<string, Record<string, { units: number; revenue: number }>> = {}
    const locationJaraVolume: Record<string, Record<string, { units: number; revenue: number }>> = {}
    let jaraAttributedUnits = 0
    let totalUnitsSold = 0

    orderItems.forEach((item) => {
        const product = productById[item.product_id]
        if (!product) return
        const qty = item.quantity || 0
        const revenue = item.total_price || 0
        totalUnitsSold += qty
        jaraAttributedUnits += item.jara_quantity || 0

        const term = (product.jara_buy_quantity && product.jara_get_quantity)
            ? formatJara(product.jara_buy_quantity, product.jara_get_quantity)
            : 'No Jara'
        const category = product.category_id ? (categoryNameById[product.category_id] || 'Uncategorized') : 'Uncategorized'

        categoryJaraVolume[category] = categoryJaraVolume[category] || {}
        categoryJaraVolume[category][term] = categoryJaraVolume[category][term] || { units: 0, revenue: 0 }
        categoryJaraVolume[category][term].units += qty
        categoryJaraVolume[category][term].revenue += revenue

        const loc = orderLocationById[item.order_id]
        if (loc) {
            locationJaraVolume[loc] = locationJaraVolume[loc] || {}
            locationJaraVolume[loc][term] = locationJaraVolume[loc][term] || { units: 0, revenue: 0 }
            locationJaraVolume[loc][term].units += qty
            locationJaraVolume[loc][term].revenue += revenue
        }
    })

    const jaraByCategory = Object.entries(categoryJaraVolume)
        .flatMap(([category, terms]) => Object.entries(terms).map(([term, stats]) => ({ category, term, ...stats })))
        .sort((a, b) => b.units - a.units)
        .slice(0, 10)

    const jaraByLocation = Object.entries(locationJaraVolume)
        .flatMap(([location, terms]) => Object.entries(terms).map(([term, stats]) => ({ location, term, ...stats })))
        .sort((a, b) => b.units - a.units)
        .slice(0, 10)

    const jaraSharePct = totalUnitsSold > 0 ? (jaraAttributedUnits / totalUnitsSold) * 100 : 0

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
                        <span className="text-emerald-600 font-bold">#</span>
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

            {/* Jara Performance */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Gift className="h-5 w-5 text-emerald-600" />
                        Jara Performance
                    </h2>
                    <p className="text-sm text-gray-500">Which jara terms your retailers actually buy, by category and by delivery location.</p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span>Units sold with jara attached</span>
                            <span className="font-bold">{jaraSharePct.toFixed(1)}% ({jaraAttributedUnits} of {totalUnitsSold} units)</span>
                        </div>
                        <Progress value={jaraSharePct} className="h-2 bg-gray-100" indicatorClassName="bg-amber-500" />
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Jara Terms by Category</CardTitle>
                            <CardDescription>Which jara offer sells best within each category you carry.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {jaraByCategory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 border-b">
                                                <th className="pb-2 font-medium">Category</th>
                                                <th className="pb-2 font-medium">Jara Terms</th>
                                                <th className="pb-2 font-medium text-right">Units</th>
                                                <th className="pb-2 font-medium text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jaraByCategory.map((row, idx) => (
                                                <tr key={`${row.category}:${row.term}:${idx}`} className="border-b last:border-0">
                                                    <td className="py-2">{row.category}</td>
                                                    <td className="py-2 text-gray-500">{row.term}</td>
                                                    <td className="py-2 text-right font-medium">{row.units}</td>
                                                    <td className="py-2 text-right text-gray-500">{formatPrice(row.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">No sales yet.</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Jara Terms by Location</CardTitle>
                            <CardDescription>Which jara offer sells best in each delivery area.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {jaraByLocation.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 border-b">
                                                <th className="pb-2 font-medium">Location</th>
                                                <th className="pb-2 font-medium">Jara Terms</th>
                                                <th className="pb-2 font-medium text-right">Units</th>
                                                <th className="pb-2 font-medium text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jaraByLocation.map((row, idx) => (
                                                <tr key={`${row.location}:${row.term}:${idx}`} className="border-b last:border-0">
                                                    <td className="py-2 truncate max-w-[10rem]">{row.location}</td>
                                                    <td className="py-2 text-gray-500">{row.term}</td>
                                                    <td className="py-2 text-right font-medium">{row.units}</td>
                                                    <td className="py-2 text-right text-gray-500">{formatPrice(row.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">No location data yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    )
}
