import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/marketplace/search-bar'
import { ProductCard } from '@/components/marketplace/product-card'

interface SearchPageProps {
    searchParams: Promise<{
        q?: string
        city?: string
        category?: string
        minPrice?: string
        maxPrice?: string
        minJara?: string
    }>
}

const sortProducts = (products: any[], sort: string) => {
    if (!products) return []
    const sorted = [...products]
    switch (sort) {
        case 'price_asc':
            return sorted.sort((a, b) => a.price - b.price)
        case 'price_desc':
            return sorted.sort((a, b) => b.price - a.price)
        case 'jara_desc':
            return sorted.sort((a, b) => {
                const ratioA = a.jara_buy_quantity ? (a.jara_get_quantity / a.jara_buy_quantity) : 0
                const ratioB = b.jara_buy_quantity ? (b.jara_get_quantity / b.jara_buy_quantity) : 0
                return ratioB - ratioA
            })
        case 'hybrid':
            return sorted.sort((a, b) => {
                // Heuristic: Lower Price is good, Higher Jara is good.
                // Score = Price * (1 - JaraRatio). Lower score is "better value".
                // Capped JaraRatio at 0.5 to prevent free items (though logic holds).
                const ratioA = a.jara_buy_quantity ? (a.jara_get_quantity / a.jara_buy_quantity) : 0
                const ratioB = b.jara_buy_quantity ? (b.jara_get_quantity / b.jara_buy_quantity) : 0
                const scoreA = a.price * (1 - Math.min(ratioA, 0.8))
                const scoreB = b.price * (1 - Math.min(ratioB, 0.8))
                return scoreA - scoreB
            })
        default:
            return sorted
    }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams
    const query = params.q || ''
    const city = params.city || ''
    const market = params.market || null
    const sort = params.sort || 'relevance'
    const compareMode = params.compare === 'true'

    // Filters
    const categoryId = params.category || null
    const minPrice = params.minPrice ? parseFloat(params.minPrice) : null
    const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null
    const minJara = params.minJara ? parseInt(params.minJara) : null

    const supabase = await createClient()

    // Base Search
    const { data: rawProducts, error } = await (supabase as any).rpc('search_products', {
        search_query: query || null,
        filter_city: city || null,
        filter_category_id: categoryId,
        filter_min_price: minPrice,
        filter_max_price: maxPrice,
        filter_min_jara: minJara
    })

    if (error) {
        console.error('Search error:', error)
    }

    // Client-side Market Filter (Mock Logic for MVP unless we add market column to products)
    // Assuming product has 'market_days' or we check against Constants if we had store market data linked.
    // For now, if market is selected, we perform text search on store name or location if available, 
    // or just assume the user wants to see the UI state.
    // Enhanced: We filter by name/description containing market name if no direct relation.
    let products = rawProducts || []
    if (market) {
        // Simple text filter for MVP demo
        products = products.filter((p: any) =>
            p.store_name?.toLowerCase().includes(market.toLowerCase()) ||
            p.description?.toLowerCase().includes(market.toLowerCase())
        )
    }

    // Apply Sorting
    products = sortProducts(products, sort)

    const resultsCount = products.length

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Search Header */}
            <div className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
                <div className="container mx-auto px-4 py-6">
                    <Suspense fallback={<div>Loading...</div>}>
                        <SearchBar
                            initialQuery={query}
                            initialCity={city}
                        />
                    </Suspense>

                    {/* Comparison Controls */}
                    {(compareMode || market) && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2">
                            {market && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-blue-900">Current Market:</span>
                                    <Badge variant="secondary" className="bg-white text-blue-700 hover:bg-white">{market}</Badge>
                                </div>
                            )}

                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-sm text-blue-800 font-medium">Compare by:</span>
                                <div className="flex gap-2">
                                    <Link href={`/search?${new URLSearchParams({ ...params, sort: 'price_asc' })}`}>
                                        <Badge className={`cursor-pointer ${sort === 'price_asc' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                                            Cheapest
                                        </Badge>
                                    </Link>
                                    <Link href={`/search?${new URLSearchParams({ ...params, sort: 'jara_desc' })}`}>
                                        <Badge className={`cursor-pointer ${sort === 'jara_desc' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}>
                                            Best Jara
                                        </Badge>
                                    </Link>
                                    <Link href={`/search?${new URLSearchParams({ ...params, sort: 'hybrid' })}`}>
                                        <Badge className={`cursor-pointer ${sort === 'hybrid' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}>
                                            Best Value (Hybrid)
                                        </Badge>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="container mx-auto px-4 py-8">
                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {market ? `${market} Listings` : (query ? `Results for "${query}"` : 'All Products')}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {resultsCount} products found
                            {city && ` in ${city}`}
                        </p>
                    </div>

                    {/* Standard Sort Dropdown (Hidden if in Compare/Market mode to avoid conflict? Or kept logic specific) */}
                    {!compareMode && !market && (
                        <ClientSortSelect currentSort={sort} />
                    )}
                </div>

                {/* Product Grid */}
                {resultsCount > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {products.map((product: any) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                price={product.price}
                                jaraBuyQty={product.jara_buy_quantity}
                                jaraGetQty={product.jara_get_quantity}
                                storeName={product.store_name}
                                storeSlug={product.store_slug}
                                imageUrl={product.primary_image_url}
                                cities={product.cities || []}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-lg text-gray-500">No products found matching your criteria.</p>
                        <p className="mt-2 text-gray-400">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Helper Client Component for Select (to avoid cluttering server component with client event handlers)
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
function ClientSortSelect({ currentSort }: { currentSort: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const h = (e: any) => {
        const params = new URLSearchParams(searchParams as any)
        params.set('sort', e.target.value)
        router.push(`?${params.toString()}`)
    }

    return (
        <select
            value={currentSort}
            onChange={h}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
        >
            <option value="relevance">Most Relevant</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="jara_desc">Best Jara</option>
            <option value="hybrid">Best Value</option>
        </select>
    )
}
