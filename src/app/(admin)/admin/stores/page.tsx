import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Store, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default async function AdminStoresPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; status?: string }>
}) {
    const { type = 'all', status = 'all' } = await searchParams
    const supabase = await createAdminClient()

    let query = supabase
        .from('stores')
        .select('id, name, slug, description, status, shop_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

    if (type === 'wholesaler') query = query.eq('shop_type', 'brand')
    else if (type === 'retailer') query = query.neq('shop_type', 'brand')

    if (status !== 'all') query = query.eq('status', status)

    const { data: stores } = await query as any
    const storeList = stores || []

    // Unfiltered counts for the stat cards, independent of the active tab filter
    const { data: allStores } = await supabase.from('stores').select('id, status, shop_type') as any
    const counts = {
        total: (allStores || []).length,
        active: (allStores || []).filter((s: any) => s.status === 'active').length,
        pending: (allStores || []).filter((s: any) => s.status === 'pending').length,
        wholesaler: (allStores || []).filter((s: any) => s.shop_type === 'brand').length,
        retailer: (allStores || []).filter((s: any) => s.shop_type !== 'brand').length,
    }

    const typeTab = (value: string, label: string) => {
        const params = new URLSearchParams()
        if (value !== 'all') params.set('type', value)
        if (status !== 'all') params.set('status', status)
        const href = params.toString() ? `?${params.toString()}` : '?'
        const active = type === value
        return (
            <Link key={value} href={href}>
                <Button size="sm" variant={active ? 'default' : 'outline'} className={active ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-gray-600 text-gray-300'}>
                    {label}
                </Button>
            </Link>
        )
    }

    const statusTab = (value: string, label: string) => {
        const params = new URLSearchParams()
        if (type !== 'all') params.set('type', type)
        if (value !== 'all') params.set('status', value)
        const href = params.toString() ? `?${params.toString()}` : '?'
        const active = status === value
        return (
            <Link key={value} href={href}>
                <Button size="sm" variant={active ? 'default' : 'outline'} className={active ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-gray-600 text-gray-300'}>
                    {label}
                </Button>
            </Link>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Store Management</h1>
                <p className="text-gray-400">View and manage all platform stores</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Store className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{counts.total}</p>
                            <p className="text-sm text-gray-400">Total Stores ({counts.retailer} retail / {counts.wholesaler} wholesale)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Store className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{counts.active}</p>
                            <p className="text-sm text-gray-400">Active</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <Store className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{counts.pending}</p>
                            <p className="text-sm text-gray-400">Pending</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 font-normal">Type</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap pt-0">
                    {typeTab('all', 'All')}
                    {typeTab('retailer', 'Retailers')}
                    {typeTab('wholesaler', 'Wholesalers')}
                </CardContent>
                <CardHeader className="pb-3 pt-0">
                    <CardTitle className="text-sm text-gray-400 font-normal">Status</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap pt-0">
                    {statusTab('all', 'All')}
                    {statusTab('active', 'Active')}
                    {statusTab('pending', 'Pending')}
                    {statusTab('suspended', 'Suspended')}
                </CardContent>
            </Card>

            {/* Stores Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {storeList.map((store: any) => (
                    <Card key={store.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-white text-lg">{store.name}</CardTitle>
                                    <CardDescription className="text-gray-500">@{store.slug}</CardDescription>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <Badge className={STATUS_STYLES[store.status] || STATUS_STYLES.pending}>
                                        {store.status || 'pending'}
                                    </Badge>
                                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                                        {store.shop_type === 'brand' ? 'Wholesaler' : 'Retailer'}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                {store.description || 'No description provided'}
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:text-white flex-1" asChild>
                                    <Link href={`/store/${store.slug}`} target="_blank">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Store
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {storeList.length === 0 && (
                    <Card className="bg-gray-800 border-gray-700 col-span-full">
                        <CardContent className="py-12 text-center text-gray-500">
                            No stores found
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
