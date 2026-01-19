import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/product-card'
import { ABUJA_MARKETS } from '@/lib/constants'
import { MapPin, Calendar, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Resolve Slug to Market Name
    // e.g. 'wuse-market' -> 'Wuse Market'
    const marketInfo = ABUJA_MARKETS.find(m =>
        m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase()
    )

    if (!marketInfo) {
        // Fallback: Try to de-slugify roughly if not found in constants (e.g. dynamic markets)
        // Or just 404
        return notFound()
    }

    const marketName = marketInfo.name

    // 2. Fetch Stores attending this market
    // frequent_markets is JSONB e.g. ["Wuse Market", "Garki Market"]
    // We use .contains() to find matches
    const { data: stores } = await (supabase
        .from('stores') as any)
        .select('id, name, slug, frequent_markets, market_name')
        .contains('frequent_markets', [marketName])

    // Also fetch stores where 'market_name' (primary location) IS this market
    // This requires an OR condition. 
    // Supabase .or() syntax: 'frequent_markets.cs.["Wuse Market"],market_name.eq.Wuse Market'
    // Let's rely on two queries or specific OR syntax.
    // Simpler: Fetch stores matching logic.
    const { data: storesPrimary } = await supabase
        .from('stores')
        .select('id')
        .eq('market_name', marketName)

    const storeIds = new Set<string>()
    stores?.forEach((s: any) => storeIds.add(s.id))
    storesPrimary?.forEach((s: any) => storeIds.add(s.id))

    const uniqueStoreIds = Array.from(storeIds)

    let products: any[] = []

    if (uniqueStoreIds.length > 0) {
        // 3. Fetch Products from these stores
        const { data: fetchedProducts } = await supabase
            .from('products')
            .select(`
                *,
                store:stores(name, slug),
                product_images(url, is_primary)
            `)
            .in('store_id', uniqueStoreIds)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(50) // Limit to 50 for now

        products = fetchedProducts || []
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Market Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <MapPin className="h-8 w-8 text-emerald-600" />
                                {marketName}
                            </h1>
                            <p className="text-gray-500 mt-2 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Open on: {marketInfo.days.join(', ')}
                            </p>
                        </div>
                        {marketInfo.lat && marketInfo.lng && (
                            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium">
                                📍 {marketInfo.lat}, {marketInfo.lng}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Info Card */}
                <Card className="mb-8 bg-blue-50 border-blue-200">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-900">Market Day Deals</p>
                            <p className="text-sm text-blue-700">
                                Browse products from verified retailers who attend {marketName}.
                                Prices and availability may vary.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Grid */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Featured Products</h2>
                    <span className="text-sm text-gray-500">{products.length} items found</span>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {products.map((product) => {
                            const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.url
                                || product.product_images?.[0]?.url

                            return (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    price={product.price}
                                    jaraBuyQty={product.jara_buy_quantity}
                                    jaraGetQty={product.jara_get_quantity}
                                    storeName={product.store.name}
                                    storeSlug={product.store.slug}
                                    imageUrl={primaryImage}
                                    variant="grid"
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No products found for this market right now.</p>
                        <p className="text-gray-400">Check back on market days!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
