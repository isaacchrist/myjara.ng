'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/marketplace/product-card'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input' // Assuming Input component exists
import { createClient } from '@/lib/supabase/client'

interface StoreProductGridProps {
    products: any[]
    categories: string[] // List of category IDs present in products
    storeName: string
    storeSlug: string
    retailerAvatar: string | null
    cities: string[]
    layout: 'grid' | 'list'
    brandColor?: string
}

export function StoreProductGrid({
    products,
    categories: storeCategoryIds, // real categories.id UUIDs that these products belong to
    storeName,
    storeSlug,
    retailerAvatar,
    cities,
    layout,
    brandColor
}: StoreProductGridProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([])
    const categoryIdsKey = storeCategoryIds.join(',')

    // Resolve real category names/icons for the IDs present in this store's
    // products (products.category_id is a UUID FK, not the old
    // PRODUCT_CATEGORIES slug list).
    useEffect(() => {
        if (!categoryIdsKey) return
        const fetchCategoryNames = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('categories').select('id, name, icon').in('id', categoryIdsKey.split(','))
            setCategories((data || []).map((c: { id: string; name: string; icon: string | null }) => ({ id: c.id, name: c.name, icon: c.icon || '📦' })))
        }
        fetchCategoryNames()
    }, [categoryIdsKey])

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesCategory = activeCategory ? product.category_id === activeCategory : true
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div>
            {/* Filters Header */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold">Products ({filteredProducts.length})</h2>

                    {/* Search */}
                    <div className="relative max-w-md w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search store..."
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Category Pills */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={activeCategory === null ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveCategory(null)}
                            className={activeCategory === null ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                            All
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={activeCategory === cat.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveCategory(cat.id)}
                                className={activeCategory === cat.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                <span className="mr-1">{cat.icon}</span>
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid */}
            {filteredProducts.length > 0 ? (
                <div className={
                    layout === 'list'
                        ? "flex flex-col gap-4 max-w-3xl"
                        : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                }>
                    {filteredProducts.map((product) => {
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
                                storeName={storeName}
                                storeSlug={storeSlug}
                                retailerAvatar={retailerAvatar}
                                imageUrl={primaryImage}
                                cities={cities}
                                variant={layout}
                                brandColor={product.brand_color || brandColor} // Pass if available
                            />
                        )
                    })}
                </div>
            ) : (
                <div className="py-20 text-center border-2 border-dashed rounded-xl bg-gray-50">
                    <p className="text-gray-500">No products found matching your filters.</p>
                    {(activeCategory || searchQuery) && (
                        <Button variant="link" onClick={() => { setActiveCategory(null); setSearchQuery('') }} className="text-emerald-600 mt-2">
                            Clear filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
