import Link from 'next/link'
import { ArrowLeft, MapPin, MessageCircle, ShoppingCart, Store, Truck } from 'lucide-react'
import { ChatButton } from '@/components/marketplace/chat-button'
import { AddToCartButton } from '@/components/marketplace/add-to-cart-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice, formatJara } from '@/lib/utils'

// Mock product data - would come from Supabase in production
const getProduct = async (id: string) => {
    return {
        id,
        name: 'Premium Basmati Rice (50kg)',
        description: `Imported premium long-grain Basmati rice. Perfect for special occasions, biryanis, and fried rice. Each bag is 50kg of pure quality.

Features:
• Extra long grain
• Aged for perfect aroma
• Low glycemic index
• Non-GMO

This rice is sourced directly from the best farms and carefully processed to maintain its natural qualities. The grains cook up fluffy and separate, making it ideal for a variety of dishes.`,
        price: 48000,
        jaraBuyQty: 5,
        jaraGetQty: 1,
        stockQuantity: 100,
        store: {
            id: 'store-1',
            name: 'FoodMart Nigeria',
            slug: 'foodmart',
            logoUrl: null,
        },
        category: {
            id: 'cat-1',
            name: 'Food & Groceries',
        },
        images: [
            '/products/rice-1.jpg',
            '/products/rice-2.jpg',
            '/products/rice-3.jpg',
        ],
        logistics: [
            { id: 'log-1', type: 'pickup', locationName: 'Ikeja Warehouse', city: 'Lagos', deliveryFee: 0, timeline: 'Same day' },
            { id: 'log-2', type: 'pickup', locationName: 'Lekki Hub', city: 'Lagos', deliveryFee: 0, timeline: 'Same day' },
            { id: 'log-3', type: 'delivery', locationName: 'Lagos Mainland', city: 'Lagos', deliveryFee: 2000, timeline: '1-2 days' },
            { id: 'log-4', type: 'delivery', locationName: 'Lagos Island', city: 'Lagos', deliveryFee: 2500, timeline: '1-2 days' },
        ],
    }
}

interface ProductPageProps {
    params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params
    const product = await getProduct(id)
    const jaraText = formatJara(product.jaraBuyQty, product.jaraGetQty)

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <Link
                    href="/search"
                    className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to search
                </Link>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Image Gallery */}
                    <div>
                        <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                            {/* Main image placeholder */}
                            <div className="flex h-full items-center justify-center">
                                <span className="text-8xl">📦</span>
                            </div>
                        </div>
                        {/* Thumbnails */}
                        <div className="mt-4 flex gap-3">
                            {[1, 2, 3].map((i) => (
                                <button
                                    key={i}
                                    className="h-20 w-20 overflow-hidden rounded-lg border-2 border-transparent bg-gray-100 transition-all hover:border-emerald-500"
                                >
                                    <div className="flex h-full items-center justify-center text-2xl">📦</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        {/* Store Badge */}
                        <Link
                            href={`/store/${product.store.slug}`}
                            className="mb-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-200"
                        >
                            <Store className="h-4 w-4" />
                            {product.store.name}
                        </Link>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                            {product.name}
                        </h1>

                        {/* Category */}
                        <div className="mt-2">
                            <Badge variant="secondary">{product.category.name}</Badge>
                        </div>

                        {/* Price */}
                        <div className="mt-6">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(product.price)}
                            </span>
                        </div>

                        {/* Jara Offer */}
                        {product.jaraGetQty > 0 && (
                            <Card className="mt-6 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-2xl">
                                            🎁
                                        </div>
                                        <div>
                                            <p className="font-bold text-amber-800">JARA OFFER</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {jaraText}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Buy {product.jaraBuyQty}, pay for {product.jaraBuyQty}, get {product.jaraBuyQty + product.jaraGetQty}!
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Logistics Options */}
                        <div className="mt-6">
                            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                                Pickup & Delivery Options
                            </h3>
                            <div className="space-y-2">
                                {product.logistics.map((option) => (
                                    <div
                                        key={option.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            {option.type === 'pickup' ? (
                                                <Store className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <Truck className="h-5 w-5 text-gray-400" />
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{option.locationName}</p>
                                                <p className="text-sm text-gray-500">{option.timeline}</p>
                                            </div>
                                        </div>
                                        <span className={option.deliveryFee === 0 ? 'font-medium text-emerald-600' : 'text-gray-900'}>
                                            {option.deliveryFee === 0 ? 'FREE' : formatPrice(option.deliveryFee)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Actions */}
                        <div className="mt-8 flex gap-4">
                            <ChatButton
                                productId={product.id}
                                productName={product.name}
                                storeId={product.store.id}
                                storeName={product.store.name}
                                className="flex-1"
                            />
                            <div className="flex-1 flex gap-2">
                                <AddToCartButton
                                    product={{
                                        ...product,
                                        store_id: product.store.id // normalize for cart
                                    }}
                                    className="flex-1 bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                    variant="outline"
                                />
                                <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                                    <Link href={`/checkout/${product.id}`}>
                                        Buy Now
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Stock Status */}
                        <p className="mt-4 text-center text-sm text-gray-500">
                            {product.stockQuantity > 10
                                ? '✓ In Stock'
                                : product.stockQuantity > 0
                                    ? `Only ${product.stockQuantity} left`
                                    : 'Out of Stock'}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-12">
                    <h2 className="mb-4 text-xl font-bold text-gray-900">Product Description</h2>
                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="whitespace-pre-line text-gray-600">
                            {product.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
