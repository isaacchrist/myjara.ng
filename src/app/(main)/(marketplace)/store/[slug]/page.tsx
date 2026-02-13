import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/marketplace/product-card"
import { StoreProductGrid } from "@/components/marketplace/store-product-grid"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Store, Building, Calendar, Package, ExternalLink } from "lucide-react"
import { CopyPhoneButton } from "@/components/marketplace/copy-phone-button"
import { StoreGalleryBanner } from "@/components/marketplace/store-gallery"
import { ABUJA_MARKETS } from "@/lib/constants"

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch store details with settings AND owner info
    const { data: store } = await (supabase
        .from('stores') as any)
        .select(`
            *,
            owner:users!inner(avatar_url, phone, full_name, email)
        `)
        .eq('slug', slug)
        .single()

    if (!store) {
        notFound()
    }

    // Parse settings and metadata
    const settings = store.settings as any
    const theme = settings?.theme || { primaryColor: '#10b981', layout: 'grid' }
    const primaryColor = theme.primaryColor
    const layout = theme.layout === 'list' ? 'list' : 'grid'

    // Determine store type from user metadata or store settings
    const storeType = store.shop_type || settings?.shop_type || 'physical'

    const storeTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
        physical: { label: 'Physical Store', icon: Building, color: 'bg-emerald-100 text-emerald-700' },
        online: { label: 'Online Store', icon: Store, color: 'bg-purple-100 text-purple-700' },
        market_day: { label: 'Market Day Seller', icon: Calendar, color: 'bg-orange-100 text-orange-700' },
        brand: { label: 'Official Brand / Wholesaler', icon: Building, color: 'bg-indigo-100 text-indigo-700' },
        wholesaler: { label: 'Wholesaler', icon: Package, color: 'bg-indigo-100 text-indigo-700' },
    }
    const typeInfo = storeTypeConfig[storeType] || storeTypeConfig.physical

    // Fetch products
    const { data: products } = await supabase
        .from('products')
        .select(`
            *,
            store:stores(name, slug),
            product_images(url, is_primary)
        `)
        .eq('store_id', store.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    // Fetch logistics (for location display)
    const { data: logistics } = await supabase
        .from('store_logistics')
        .select('city')
        .eq('store_id', store.id)
        .eq('is_active', true)

    const cities = logistics ? [...new Set(logistics.map((l: any) => l.city))] : []

    // Use Owner Data (fallback to store data if specific overrides exist, usually user data is master)
    const profilePic = store.owner?.avatar_url || store.profile_picture_url || store.logo_url
    const contactPhone = store.owner?.phone || store.phone
    // Parse gallery images (from gallery_urls JSONB or banner_url fallback)
    const galleryImages: string[] = Array.isArray(store.gallery_urls) ? store.gallery_urls : []
    if (galleryImages.length === 0 && store.banner_url) {
        galleryImages.push(store.banner_url)
    }

    // Get market day locations for market_day stores
    const frequentMarkets: string[] = Array.isArray(store.frequent_markets) ? store.frequent_markets : []
    const marketLocations = frequentMarkets
        .map(name => ABUJA_MARKETS.find(m => m.name === name))
        .filter(Boolean) as typeof ABUJA_MARKETS

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Store Banner & Header */}
            <div className="bg-white pb-8 shadow-sm">
                {/* Banner Area — Gallery or Gradient */}
                <StoreGalleryBanner images={galleryImages} storeName={store.name} />

                <div className="container mx-auto px-4">
                    <div className="relative -mt-16 mb-6 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                        {/* Profile Picture / Logo */}
                        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg shrink-0 flex items-center justify-center bg-gray-100">
                            {profilePic ? (
                                <Image
                                    src={profilePic}
                                    alt={store.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <span className="text-4xl font-bold text-gray-400">
                                    {(store.name || 'S').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="mt-4 flex-1 text-center sm:mt-0 sm:text-left">
                            <h1 className="text-3xl font-bold">{store.name}</h1>

                            {/* Store Type Badge */}
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                <Badge className={`${typeInfo.color} flex items-center gap-1.5 px-3 py-1`}>
                                    <typeInfo.icon className="h-3.5 w-3.5" />
                                    {typeInfo.label}
                                </Badge>

                                {store.registered_at && (
                                    <Badge className="bg-gray-100 text-gray-700 flex items-center gap-1.5 px-3 py-1">
                                        <span>Joined {new Date(store.registered_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                    </Badge>
                                )}

                                {cities.length > 0 && (
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4" />
                                        <span>{cities.join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Phone Number Button */}
                        {contactPhone && (
                            <div className="mt-4 sm:mt-0">
                                <CopyPhoneButton phone={contactPhone} />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {store.description && (
                        <div className="max-w-3xl mb-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About this Store</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {store.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Market Day Locations — Only for market_day stores */}
            {storeType === 'market_day' && marketLocations.length > 0 && (
                <div className="container mx-auto mt-6 px-4">
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-orange-500" />
                            Market Day Locations
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">Find this seller at the following markets:</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {marketLocations.map(market => (
                                <div
                                    key={market.name}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-amber-50"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900">{market.name}</p>
                                        <p className="text-sm text-orange-600">{market.days.join(', ')}</p>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${market.lat},${market.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shrink-0"
                                    >
                                        <MapPin className="h-3.5 w-3.5" />
                                        Open Map
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Section */}
            <div className="container mx-auto mt-8 px-4">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Products</h2>
                    <div className="text-sm text-gray-500">
                        {products?.length || 0} items
                    </div>
                </div>

                {products && products.length > 0 ? (
                    <StoreProductGrid
                        products={products}
                        categories={products.map((p: any) => p.category_id).filter((v: any, i: any, a: any) => a.indexOf(v) === i)}
                        storeName={store.name}
                        storeSlug={store.slug}
                        retailerAvatar={profilePic}
                        cities={cities}
                        layout={layout}
                        brandColor={primaryColor}
                    />
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-gray-500">No products found in this store.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
