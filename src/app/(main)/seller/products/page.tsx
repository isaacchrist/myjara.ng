import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, Plus, Edit, Trash2, ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export default async function SellerProductsPage({ searchParams }: { searchParams: { category?: string } }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get store
    const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single() as any

    if (!store) {
        return (
            // ... (No Store Found UI - omitted for brevity, keeping same if possible or re-rendering)
            <div className="p-8 max-w-4xl mx-auto">
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
                        <h2 className="text-xl font-semibold">No Store Found</h2>
                        <p className="text-gray-600 mt-2">Your store hasn't been set up yet. Please contact support.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Get Store Categories Metadata
    let storeCategories: any[] = []
    if (store.categories && store.categories.length > 0) {
        const { data: cats } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', store.categories)
        storeCategories = cats || []
    }

    // Filter Logic
    let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    if (searchParams.category) {
        query = query.eq('category_id', searchParams.category)
    }

    const { data: products, count } = await query

    // Category limits by plan
    const categoryLimits: Record<string, number> = {
        basic: 5,
        pro: 15,
        exclusive: 30
    }
    const currentLimit = categoryLimits[store.subscription_plan || 'basic'] || 5

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/seller/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">My Products</h1>
                        <p className="text-gray-500">{count || 0} products listed</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Category Filter */}
                    {storeCategories.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Filter:</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={!searchParams.category ? 'secondary' : 'ghost'}
                                    asChild
                                >
                                    <Link href="/seller/products">All</Link>
                                </Button>
                                {storeCategories.map(cat => (
                                    <Button
                                        key={cat.id}
                                        size="sm"
                                        variant={searchParams.category === cat.id ? 'secondary' : 'ghost'}
                                        className={searchParams.category === cat.id ? 'bg-emerald-100 text-emerald-700' : ''}
                                        asChild
                                    >
                                        <Link href={`/seller/products?category=${cat.id}`}>
                                            {cat.name}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/seller/products/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Plan Info */}
            <Card className="bg-gray-50">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Your <span className="capitalize font-semibold">{store.subscription_plan || 'Basic'}</span> plan allows up to <strong>{currentLimit}</strong> category selections</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/seller/subscription">Upgrade Plan</Link>
                    </Button>
                </CardContent>
            </Card>

            {/* Products Grid */}
            {products && products.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product: any) => (
                        <Card key={product.id} className="overflow-hidden">
                            <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                                {product.images && product.images[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Package className="h-12 w-12 text-gray-300" />
                                )}
                                {product.category_id && (
                                    <Badge className="absolute top-2 right-2 bg-white/90 text-gray-800 hover:bg-white">
                                        {/* Ideally fetch category name here or map it, but for list view maybe just icon? */}
                                        Category
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold truncate flex-1">{product.name}</h3>
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                                        {product.status || 'draft'}
                                    </Badge>
                                </div>
                                <p className="text-lg font-bold text-emerald-600">{formatPrice(product.price)}</p>
                                <p className="text-sm text-gray-500 mt-1">Stock: {product.stock_quantity || 0}</p>
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline" asChild className="flex-1">
                                        <Link href={`/seller/products/${product.id}/edit`}>
                                            <Edit className="h-3 w-3 mr-1" /> Edit
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700">No Products Found</h2>
                        <p className="text-gray-500 mt-2 mb-6">
                            {searchParams.category ? 'No products in this category.' : 'Start selling by adding your first product'}
                        </p>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <Link href="/seller/products/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
