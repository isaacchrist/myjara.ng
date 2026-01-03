import { notFound } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/marketplace/product-card"
import { Button } from "@/components/ui/button"
import { MessageCircle, MapPin } from "lucide-react"

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

    // Parse settings
    const settings = store.settings as any
    const theme = settings?.theme || { primaryColor: '#10b981', layout: 'grid' }
    const primaryColor = theme.primaryColor
    const layout = theme.layout === 'list' ? 'list' : 'grid'

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

    // Fetch logistics (for location display if needed, simplified for now)
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
                        backgroundColor: primaryColor + '20', // 20% opacity as fallback/tint
                        backgroundImage: store.banner_url ? `url(${store.banner_url})` : 'none'
                    }}
                />

                <div className="container mx-auto px-4">
                    <div className="relative -mt-16 mb-6 flex flex-col items-center sm:block sm:items-start">
                        {/* Logo */}
                        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
                            {store.logo_url ? (
                                <Image
                                    src={store.logo_url}
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

                        <div className="mt-4 text-center sm:text-left">
                            <h1 className="text-3xl font-bold">{store.name}</h1>
                            {cities.length > 0 && (
                                <div className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-500 sm:justify-start">
                                    <MapPin className="h-4 w-4" />
                                    <span>{cities.join(', ')}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions (Chat, etc.) */}
                        <div className="mt-4 flex gap-3 sm:absolute sm:bottom-0 sm:right-0 sm:mt-0">
                            {/* Future: Add 'Follow' or general 'Chat with Store' button */}
                        </div>
                    </div>

                    <p className="max-w-2xl text-gray-600">
                        {store.description}
                    </p>
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
