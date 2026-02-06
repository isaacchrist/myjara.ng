
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Users, ShoppingBag, DollarSign, MapPin } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: store } = await (supabase.from('stores').select('*').eq('owner_id', user.id).single() as any)

    if (!store) {
        redirect('/register/seller')
    }

    // Fetch Products Count
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)

    // Fetch basic order stats (Mocking breakdown for now as we don't track viewer roles yet)
    // In a real scenario, we'd log page views with user roles.

    const stats = [
        { label: 'Total Revenue', value: '₦0', icon: DollarSign, change: '+0% from last month' },
        { label: 'Store Visits', value: '124', icon: Users, change: '+12% from last month' },
        { label: 'Total Products', value: productCount || 0, icon: ShoppingBag, change: 'Active items' },
        { label: 'Conversion Rate', value: '0%', icon: TrendingUp, change: 'Based on visits' },
    ]

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {/* Customer Breakdown (Requested Feature) */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Customer Demographics</CardTitle>
                        <CardDescription>
                            breakdown of who is viewing your store.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">Students</span>
                                <span className="font-bold">65%</span>
                            </div>
                            <Progress value={65} className="h-2 bg-gray-100" indicatorClassName="bg-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">University Staff</span>
                                <span className="font-bold">20%</span>
                            </div>
                            <Progress value={20} className="h-2 bg-gray-100" indicatorClassName="bg-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">External Visitors</span>
                                <span className="font-bold">15%</span>
                            </div>
                            <Progress value={15} className="h-2 bg-gray-100" indicatorClassName="bg-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                {/* Top Locations */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Locations</CardTitle>
                        <CardDescription>
                            Where your customers are asking for delivery.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <MapPin className="h-5 w-5 text-emerald-600 mr-3" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">University Main Gate</p>
                                    <p className="text-xs text-gray-500">45 deliveries</p>
                                </div>
                                <div className="font-bold text-sm">#1</div>
                            </div>
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <MapPin className="h-5 w-5 text-emerald-600 mr-3" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">Hostel A</p>
                                    <p className="text-xs text-gray-500">32 deliveries</p>
                                </div>
                                <div className="font-bold text-sm">#2</div>
                            </div>
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <MapPin className="h-5 w-5 text-emerald-600 mr-3" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">Staff Quarters</p>
                                    <p className="text-xs text-gray-500">18 deliveries</p>
                                </div>
                                <div className="font-bold text-sm">#3</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
