import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/marketplace/product-card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Store, Building, Calendar, Package } from "lucide-react"
import { CopyPhoneButton } from "@/components/marketplace/copy-phone-button"

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch store details with settings
    const { data: store } = await (supabase
        .from('stores') as any)
        .select('*')
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

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Store Banner & Header */}
            <div className="bg-white pb-8 shadow-sm">
                {/* Banner Area */}
                <div
                    className="h-48 w-full bg-cover bg-center"
                    style={{
                        backgroundColor: primaryColor + '20',
                        backgroundImage: store.banner_url ? `url(${store.banner_url})` : 'none'
                    }}
                />

                <div className="container mx-auto px-4">
                    <div className="relative -mt-16 mb-6 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                        {/* Profile Picture / Logo */}
                        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg shrink-0">
                            {store.profile_picture_url || store.logo_url ? (
                                <Image
                                    src={store.profile_picture_url || store.logo_url}
                                    alt={store.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div
                                    className="flex h-full w-full items-center justify-center text-4xl font-bold text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {store.name.charAt(0)}
                                </div>
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
                        {store.phone && (
                            <div className="mt-4 sm:mt-0">
                                <CopyPhoneButton phone={store.phone} />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {store.description && (
                        <p className="max-w-2xl text-gray-600">
                            {store.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Products Section */}
            <div className="container mx-auto mt-8 px-4">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Products</h2>
                    <div className="text-sm text-gray-500">
                        {products?.length || 0} items
                    </div>
                </div>

                {products && products.length > 0 ? (
                    <div className={
                        layout === 'list'
                            ? "flex flex-col gap-4 max-w-3xl"
                            : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    }>
                        {products.map((product: any) => {
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
                                    cities={cities}
                                    variant={layout}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-gray-500">No products found in this store.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

