import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/product-card'
import { ClientSortSelect } from '@/components/marketplace/client-sort-select'
import ClientFilterSidebar from '@/components/marketplace/client-filter-sidebar'
import { SearchBar } from '@/components/marketplace/search-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
    searchParams: Promise<{
        q?: string
        city?: string
        category?: string
        minPrice?: string
        maxPrice?: string
        minJara?: string
        market?: string
        sort?: string
        compare?: string
    }>
}

const sortProducts = (products: any[], sort: string) => {
    if (!products || !Array.isArray(products)) return []
    const sorted = [...products]
    switch (sort) {
        case 'price_asc':
            return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
        case 'price_desc':
            return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
        case 'jara_desc':
            return sorted.sort((a, b) => {
                const ratioA = a.jara_buy_quantity ? (a.jara_get_quantity / a.jara_buy_quantity) : 0
                const ratioB = b.jara_buy_quantity ? (b.jara_get_quantity / b.jara_buy_quantity) : 0
                return ratioB - ratioA
            })
        case 'hybrid':
            return sorted.sort((a, b) => {
                const ratioA = a.jara_buy_quantity ? (a.jara_get_quantity / a.jara_buy_quantity) : 0
                const ratioB = b.jara_buy_quantity ? (b.jara_get_quantity / b.jara_buy_quantity) : 0
                const scoreA = (a.price || 0) * (1 - Math.min(ratioA, 0.8))
                const scoreB = (b.price || 0) * (1 - Math.min(ratioB, 0.8))
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

    // Safe parsing helpers
    const safeFloat = (v: string | undefined) => {
        const n = parseFloat(v || '')
        return isNaN(n) ? null : n
    }
    const safeInt = (v: string | undefined) => {
        const n = parseInt(v || '')
        return isNaN(n) ? null : n
    }

    const categoryId = params.category || null
    const minPrice = safeFloat(params.minPrice)
    const maxPrice = safeFloat(params.maxPrice)
    const minJara = safeInt(params.minJara)

    // URL builder helper
    const buildUrl = (overrides: Record<string, string | number | null | undefined>) => {
        const p = new URLSearchParams()
        const merged = { ...params, ...overrides }
        Object.entries(merged).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') {
                p.set(k, String(v))
            }
        })
        return `/search?${p.toString()}`
    }

    let products: any[] = []
    let errorMessage: string | null = null

    try {
        const supabase = await createClient()

        // Try the RPC function first
        let rpcWorked = false
        try {
            const { data, error } = await (supabase as any).rpc('search_products', {
                search_query: query || null,
                filter_city: city || null,
                filter_category_id: categoryId,
                filter_min_price: minPrice,
                filter_max_price: maxPrice,
                filter_min_jara: minJara
            })

            if (!error && data && Array.isArray(data)) {
                products = data
                rpcWorked = true
            }
        } catch (rpcError) {
            console.error('RPC search_products failed:', rpcError)
        }

        // Fallback to direct query if RPC failed
        if (!rpcWorked) {
            console.log('Falling back to direct database query')

            let dbQuery = supabase
                .from('products')
                .select(`
                    id,
                    name,
                    description,
                    price,
                    jara_buy_quantity,
                    jara_get_quantity,
                    primary_image_url,
                    stores!inner (
                        id,
                        name,
                        slug,
                        logo_url,
                        status
                    ),
                    categories (
                        id,
                        name
                    )
                `)
                .eq('status', 'active')
                .eq('stores.status', 'active')
                .limit(50)

            if (query) {
                dbQuery = dbQuery.ilike('name', `%${query}%`)
            }
            if (categoryId) {
                dbQuery = dbQuery.eq('category_id', categoryId)
            }
            if (minPrice !== null) {
                dbQuery = dbQuery.gte('price', minPrice)
            }
            if (maxPrice !== null) {
                dbQuery = dbQuery.lte('price', maxPrice)
            }
            if (minJara !== null) {
                dbQuery = dbQuery.gte('jara_get_quantity', minJara)
            }

            const { data, error } = await dbQuery

            if (error) {
                console.error('Direct query failed:', error)
                errorMessage = 'Unable to load products. Please try again.'
            } else if (data) {
                // Transform the data to match expected format
                products = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    jara_buy_quantity: p.jara_buy_quantity,
                    jara_get_quantity: p.jara_get_quantity,
                    primary_image_url: p.primary_image_url,
                    store_id: p.stores?.id,
                    store_name: p.stores?.name || 'Unknown Store',
                    store_slug: p.stores?.slug || '',
                    store_logo_url: p.stores?.logo_url,
                    category_id: p.categories?.id,
                    category_name: p.categories?.name,
                    cities: []
                }))
            }
        }
    } catch (e) {
        console.error('Unexpected error:', e)
        errorMessage = 'An unexpected error occurred.'
        products = []
    }

    // Apply market filter if present
    if (market && products.length > 0) {
        products = products.filter((p: any) =>
            (p.store_name?.toLowerCase() || '').includes(market.toLowerCase()) ||
            (p.description?.toLowerCase() || '').includes(market.toLowerCase())
        )
    }

    // Apply sorting
    products = sortProducts(products, sort)

    const resultsCount = products.length

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Search Header */}
            <div className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
                <div className="container mx-auto px-4 py-6">
                    <Suspense fallback={<div className="h-12 bg-gray-100 rounded animate-pulse" />}>
                        <SearchBar
                            initialQuery={query}
                            initialCity={city}
                            showFilters={false}
                        />
                    </Suspense>

                    {/* Comparison Controls */}
                    {(compareMode || market) && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex flex-wrap items-center gap-4">
                            {market && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-emerald-900">Current Market:</span>
                                    <Badge variant="secondary" className="bg-white text-emerald-700">{market}</Badge>
                                </div>
                            )}
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-sm text-emerald-800 font-medium">Compare by:</span>
                                <div className="flex gap-2">
                                    <Link href={buildUrl({ sort: 'price_asc' })}>
                                        <Badge className={`cursor-pointer ${sort === 'price_asc' ? 'bg-emerald-600' : 'bg-white text-emerald-600 border-emerald-200'}`}>
                                            Cheapest
                                        </Badge>
                                    </Link>
                                    <Link href={buildUrl({ sort: 'jara_desc' })}>
                                        <Badge className={`cursor-pointer ${sort === 'jara_desc' ? 'bg-emerald-800' : 'bg-white text-emerald-800 border-emerald-200'}`}>
                                            Best Jara
                                        </Badge>
                                    </Link>
                                    <Link href={buildUrl({ sort: 'hybrid' })}>
                                        <Badge className={`cursor-pointer ${sort === 'hybrid' ? 'bg-emerald-500' : 'bg-white text-emerald-500 border-emerald-200'}`}>
                                            Best Value
                                        </Badge>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="container mx-auto px-4 py-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                        <p>{errorMessage}</p>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <Suspense fallback={<div className="h-64 rounded-xl bg-gray-100 animate-pulse" />}>
                            <ClientFilterSidebar
                                currentParams={{
                                    category: categoryId,
                                    minPrice: minPrice,
                                    maxPrice: maxPrice,
                                    minJara: minJara,
                                    city: city
                                }}
                            />
                        </Suspense>
                    </div>

                    {/* Results Content */}
                    <div className="flex-1">
                        {/* Results Header */}
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {market ? `${market} Listings` : (query ? `Results for "${query}"` : 'All Products')}
                                </h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {resultsCount} products found
                                    {city && ` in ${city}`}
                                </p>
                            </div>

                            {/* Sort Dropdown */}
                            {!compareMode && !market && (
                                <Suspense fallback={<div className="h-10 w-40 bg-gray-100 rounded animate-pulse" />}>
                                    <ClientSortSelect currentSort={sort} />
                                </Suspense>
                            )}
                        </div>

                        {/* Product Grid */}
                        {resultsCount > 0 ? (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.map((product: any) => (
                                    <ProductCard
                                        key={product.id}
                                        id={product.id}
                                        name={product.name || 'Unnamed Product'}
                                        price={product.price || 0}
                                        jaraBuyQty={product.jara_buy_quantity || 0}
                                        jaraGetQty={product.jara_get_quantity || 0}
                                        storeName={product.store_name || 'Unknown Store'}
                                        storeSlug={product.store_slug || ''}
                                        imageUrl={product.primary_image_url}
                                        cities={product.cities || []}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <Search className="h-8 w-8" />
                                </div>
                                <p className="text-lg text-gray-500 font-medium">No products found matching your criteria.</p>
                                <p className="mt-2 text-gray-400">Try adjusting your filters or search term.</p>
                                <Link href="/search">
                                    <Button className="mt-6" variant="outline">
                                        Clear all filters
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
