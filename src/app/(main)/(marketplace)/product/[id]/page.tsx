import { Share2, MapPin, ShoppingCart, Store, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShareButton } from '@/components/marketplace/share-button'
import { ContactSellerButton } from '@/components/marketplace/contact-seller-button'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: product } = await supabase.from('products').select('name, description, price, product_images(url)').eq('id', id).single() as any

    if (!product) return { title: 'Product Not Found' }

    const imageUrl = product.product_images?.[0]?.url || '/placeholder.png'
    const title = `${product.name} - ₦${product.price.toLocaleString()}`

    return {
        title: title,
        description: product.description || 'Buy on MyJara',
        openGraph: {
            title: title,
            description: product.description || 'Check out this product on MyJara',
            images: [imageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: product.description,
            images: [imageUrl],
        }
    }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch Product with Store info
    const { data: product } = await supabase
        .from('products')
        .select(`
            *,
            store:stores(*),
            product_images(url, is_primary)
        `)
        .eq('id', id)
        .single() as any

    if (!product) return notFound()

    const images = product.product_images?.map((img: any) => img.url) || []
    const mainImage = images[0] || '/placeholder.png'
    const isPhysical = product.store?.shop_type === 'physical' || product.store?.shop_type === 'market_day'
    const pickupLocation = product.pickup_location // JSONB {address, lat, lng} or string? Checking usage.
    // In add_product, it was saved as JSON object if GPS used.

    let pickupAddress = 'Contact Seller'
    if (typeof pickupLocation === 'string') {
        pickupAddress = pickupLocation
    } else if (pickupLocation?.address) {
        pickupAddress = pickupLocation.address
    } else if (product.store?.market_name) {
        pickupAddress = product.store.market_name
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/seller/products"> {/* Or Back */}
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <span className="font-semibold truncate max-w-[200px]">{product.name}</span>
                    <ShareButton title={product.name} text={`Check out ${product.name} on MyJara!`} />
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-200 border">
                            <Image src={mainImage} fill className="object-cover" alt={product.name} />
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img: string, idx: number) => (
                                    <div key={idx} className="h-20 w-20 relative rounded-lg overflow-hidden border shrink-0">
                                        <Image src={img} fill className="object-cover" alt={`View ${idx}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-start">
                                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

                            </div>
                            <p className="text-2xl font-bold text-emerald-600 mt-2">₦{product.price.toLocaleString()}</p>
                            <p className="text-gray-500 mt-4">{product.description}</p>
                        </div>

                        {/* Jara Badge */}
                        <Card className="bg-emerald-50 border-emerald-200">
                            <CardContent className="p-4 flex gap-3 items-start">
                                <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">JARA</span>
                                <div>
                                    <p className="font-bold text-emerald-900">
                                        + {product.jara_amount} {product.jara_name || (product.jara_is_same ? product.name : 'Bonus Item')}
                                    </p>
                                    {!product.jara_is_same && product.jara_description && (
                                        <p className="text-sm text-emerald-700 mt-1">{product.jara_description}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Store Info */}
                        <div className="border-t pt-6">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Seller Information
                            </h3>
                            <div className="bg-white p-4 rounded-lg border">
                                <p className="font-bold text-lg mb-1">{product.store?.name}</p>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p className="capitalize text-emerald-600 font-medium">{product.store?.shop_type?.replace('_', ' ')} Store</p>
                                    {isPhysical && (
                                        <div className="flex items-start gap-2 mt-2">
                                            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{pickupAddress}</span>
                                        </div>
                                    )}
                                </div>
                                <ContactSellerButton
                                    storeId={product.store_id}
                                    storeName={product.store?.name}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
