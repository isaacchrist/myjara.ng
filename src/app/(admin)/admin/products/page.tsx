import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>
}) {
    const { category = 'all' } = await searchParams
    const supabase = await createAdminClient()

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .is('parent_id', null)
        .order('name') as any
    const topCategories = categories || []

    let categoryIds: string[] | null = null
    if (category !== 'all') {
        const { data: children } = await supabase.from('categories').select('id').eq('parent_id', category) as any
        categoryIds = [category, ...((children || []).map((c: any) => c.id))]
    }

    let query = supabase
        .from('products')
        .select('id, name, price, stock_quantity, status, created_at, store_id, category_id, stores(name, slug), categories(name)')
        .order('created_at', { ascending: false })
        .limit(100)

    if (categoryIds) query = query.in('category_id', categoryIds)

    const { data: products } = await query as any
    const productList = products || []

    const { count: totalCount } = await supabase.from('products').select('id', { count: 'exact', head: true }) as any

    const categoryTab = (value: string, label: string) => {
        const active = category === value
        const href = value === 'all' ? '?' : `?category=${value}`
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
                <h1 className="text-2xl font-bold text-white">Product Management</h1>
                <p className="text-gray-400">Browse all platform products by category</p>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                        <Package className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{totalCount ?? 0}</p>
                        <p className="text-sm text-gray-400">Total Products</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-400 font-normal">Category</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap pt-0">
                    {categoryTab('all', 'All')}
                    {topCategories.map((c: any) => categoryTab(c.id, c.name))}
                </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400 text-left">
                                <th className="p-4 font-medium">Product</th>
                                <th className="p-4 font-medium">Store</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Price</th>
                                <th className="p-4 font-medium">Stock</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productList.map((p: any) => (
                                <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                                    <td className="p-4 text-white">{p.name}</td>
                                    <td className="p-4 text-gray-400">
                                        {p.stores?.slug ? (
                                            <Link href={`/store/${p.stores.slug}`} target="_blank" className="hover:text-emerald-400">
                                                {p.stores.name}
                                            </Link>
                                        ) : '—'}
                                    </td>
                                    <td className="p-4 text-gray-400">{p.categories?.name || 'Uncategorized'}</td>
                                    <td className="p-4 text-gray-300">₦{Number(p.price).toLocaleString()}</td>
                                    <td className="p-4 text-gray-300">{p.stock_quantity}</td>
                                    <td className="p-4">
                                        <Badge className={STATUS_STYLES[p.status] || STATUS_STYLES.draft}>{p.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                            {productList.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">No products found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}
