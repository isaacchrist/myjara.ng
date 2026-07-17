
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, ShoppingBag, DollarSign, MapPin, Package, Gift } from 'lucide-react'
import { redirect } from 'next/navigation'
import { deliveryLocationLabel, formatJara, formatPrice } from '@/lib/utils'

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { getActiveStore } = await import('@/lib/store-context')
    const storeData = await getActiveStore()

    if (!storeData) {
        redirect('/register/seller')
    }

    const { activeStore: store } = storeData

    // Fetch Products Count
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)

    // Fetch all orders for analytics
    type OrderRecord = { id: string; total: number | null; status: string | null; delivery_address: any; created_at: string }
    const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total, status, delivery_address, created_at')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
    const orders = ordersData as OrderRecord[] | null

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.filter(o => o.status !== 'cancelled' && o.status !== 'pending').reduce((acc, curr) => acc + (curr.total || 0), 0) || 0

    // Calculate Order Status Breakdown
    const statusCounts = orders?.reduce((acc: any, curr) => {
        const s = curr.status || 'pending'
        acc[s] = (acc[s] || 0) + 1
        return acc
    }, {}) || {}

    const statusBreakdown = [
        { label: 'Delivered', value: statusCounts['delivered'] || 0, color: 'bg-emerald-500' },
        { label: 'Processing', value: (statusCounts['processing'] || 0) + (statusCounts['shipped'] || 0), color: 'bg-blue-500' },
        { label: 'Pending', value: statusCounts['pending'] || 0, color: 'bg-yellow-500' },
        { label: 'Cancelled', value: statusCounts['cancelled'] || 0, color: 'bg-red-500' },
    ].sort((a, b) => b.value - a.value)

    const totalTrackedOrders = statusBreakdown.reduce((acc, curr) => acc + curr.value, 0)

    // Calculate Top Locations
    const orderLocationById: Record<string, string> = {}
    ; (orders || []).forEach((o) => {
        const loc = deliveryLocationLabel(o.delivery_address)
        if (loc) orderLocationById[o.id] = loc
    })

    const locationCounts: Record<string, number> = {}
    Object.values(orderLocationById).forEach((loc) => {
        locationCounts[loc] = (locationCounts[loc] || 0) + 1
    })

    const topLocations = Object.entries(locationCounts)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    // Jara performance -- which jara terms on this seller's own catalog
    // drive the most sales volume, broken down by category and by delivery
    // location. Sales orders = same non-cancelled/non-pending set as revenue
    // above, for consistency with this page's existing convention.
    const salesOrderIds = (orders || [])
        .filter((o) => o.status !== 'cancelled' && o.status !== 'pending')
        .map((o) => o.id)

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

    type OrderItemRecord = { order_id: string; product_id: string; quantity: number; jara_quantity: number | null; total_price: number | null }
    const { data: itemsData } = salesOrderIds.length
        ? await supabase.from('order_items').select('order_id, product_id, quantity, jara_quantity, total_price').in('order_id', salesOrderIds) as any
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

    const stats = [
        { label: 'Total Revenue', value: '₦' + totalRevenue.toLocaleString(), icon: DollarSign, change: 'Lifetime sales' },
        { label: 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, change: 'Lifetime orders' },
        { label: 'Total Products', value: (productCount || 0).toString(), icon: Package, change: 'Active items' },
        { label: 'Avg Order Value', value: totalOrders > 0 ? '₦' + Math.round(totalRevenue / totalOrders).toLocaleString() : '₦0', icon: TrendingUp, change: 'Per order' },
    ]

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Order Status Breakdown (Replaces Demographics) */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Order Status Breakdown</CardTitle>
                        <CardDescription>
                            Distribution of your order statuses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {totalTrackedOrders > 0 ? (
                            statusBreakdown.map((item) => (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">{item.label}</span>
                                        <span className="font-bold">{Math.round((item.value / totalTrackedOrders) * 100)}% ({item.value})</span>
                                    </div>
                                    <Progress value={(item.value / totalTrackedOrders) * 100} className="h-2 bg-gray-100" indicatorClassName={item.color} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">No orders yet.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Locations */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Delivery Locations</CardTitle>
                        <CardDescription>
                            Where your customers are asking for delivery.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topLocations.length > 0 ? (
                                topLocations.map((loc, idx) => (
                                    <div key={idx} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                        <MapPin className="h-5 w-5 text-emerald-600 mr-3" />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm truncate">{loc.name}</p>
                                            <p className="text-xs text-gray-500">{loc.count} deliveries</p>
                                        </div>
                                        <div className="font-bold text-sm">#{idx + 1}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">No location data yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Jara Performance */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Gift className="h-5 w-5 text-emerald-600" />
                        Jara Performance
                    </h2>
                    <p className="text-sm text-muted-foreground">Which jara terms your customers actually buy, by category and by delivery location.</p>
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
                                            <tr className="text-left text-muted-foreground border-b">
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
                                                    <td className="py-2 text-muted-foreground">{row.term}</td>
                                                    <td className="py-2 text-right font-medium">{row.units}</td>
                                                    <td className="py-2 text-right text-muted-foreground">{formatPrice(row.revenue)}</td>
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
                                            <tr className="text-left text-muted-foreground border-b">
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
                                                    <td className="py-2 text-muted-foreground">{row.term}</td>
                                                    <td className="py-2 text-right font-medium">{row.units}</td>
                                                    <td className="py-2 text-right text-muted-foreground">{formatPrice(row.revenue)}</td>
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
