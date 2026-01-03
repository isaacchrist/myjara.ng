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

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams
    const query = params.q || ''
    const city = params.city || ''
    const categoryId = params.category || null
    const minPrice = params.minPrice ? parseFloat(params.minPrice) : null
    const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null
    const minJara = params.minJara ? parseInt(params.minJara) : null

    const supabase = await createClient()

    const { data: products, error } = await (supabase as any).rpc('search_products', {
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

    const resultsCount = products?.length || 0

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Search Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Suspense fallback={<div>Loading...</div>}>
                        <SearchBar
                            initialQuery={query}
                            initialCity={city}
                        />
                    </Suspense>
                </div>
            </div>

            {/* Results */}
            <div className="container mx-auto px-4 py-8">
                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {query ? `Results for "${query}"` : 'All Products'}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {resultsCount} products found
                            {city && ` in ${city}`}
                        </p>
                    </div>
                    <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
                        <option>Most Relevant</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Best Jara</option>
                        <option>Newest</option>
                    </select>
                </div>

                {/* Product Grid */}
                {resultsCount > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {products?.map((product: any) => (
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
                        <p className="text-lg text-gray-500">No products found matching your search.</p>
                        <p className="mt-2 text-gray-400">Try adjusting your filters or search term.</p>
                    </div>
                )}

                {/* Load More */}
                {resultsCount >= 20 && (
                    <div className="mt-12 text-center">
                        <button className="rounded-lg border border-gray-200 bg-white px-8 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                            Load More Products
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
