
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, ShoppingBag, DollarSign, MapPin, Package } from 'lucide-react'
import { redirect } from 'next/navigation'

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
    const { data: orders } = await supabase
        .from('orders')
        .select('id, total, status, delivery_address, created_at')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

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
    const locationCounts = orders?.reduce((acc: any, curr) => {
        if (!curr.delivery_address) return acc
        // Try to extract a meaningful location name. Assuming simple string or object with 'address'/'city'
        let loc = 'Unknown'
        if (typeof curr.delivery_address === 'string') loc = curr.delivery_address
        else if (typeof curr.delivery_address === 'object') {
            // Adapt based on actual JSON structure. 
            // Common pattern: { address: "...", city: "..." }
            const addr = (curr.delivery_address as any).address || (curr.delivery_address as any).street
            loc = addr || 'Unknown Location'
        }

        // Simpler grouping: First 15 chars to group similar inputs? 
        // Or just use as is. Let's use as is for now but maybe truncate
        if (loc.length > 30) loc = loc.substring(0, 30) + '...'

        if (loc !== 'Unknown') {
            acc[loc] = (acc[loc] || 0) + 1
        }
        return acc
    }, {}) || {}

    const topLocations = Object.entries(locationCounts)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

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
        </div>
    )
}
