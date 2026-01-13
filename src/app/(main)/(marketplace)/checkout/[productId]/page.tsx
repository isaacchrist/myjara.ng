import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Gift, MapPin, Truck, ChevronRight, Loader2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
// Use client component for the interactive parts of checkout
import { CheckoutForm } from "@/components/marketplace/checkout-form"

export default async function CheckoutPage({
    params,
    searchParams
}: {
    params: Promise<{ productId: string }>,
    searchParams: Promise<{ qty?: string }>
}) {
    const { productId } = await params
    const { qty = '1' } = await searchParams
    const initialQty = parseInt(qty) || 1

    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect(`/login?redirect=/checkout/${productId}?qty=${qty}`)
    }

    // 2. Fetch Product & Store Details
    const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
            *,
            store:stores(*),
            product_images(url, is_primary)
        `)
        .eq('id', productId)
        .single() as any

    if (productError || !product) {
        notFound()
    }

    // 3. Fetch Store Logistics
    const { data: logistics } = await supabase
        .from('store_logistics')
        .select('*')
        .eq('store_id', product.store_id)
        .eq('is_active', true)

    const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.url
        || product.product_images?.[0]?.url

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <Link
                    href={`/product/${productId}`}
                    className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to product
                </Link>

                <div className="mx-auto max-w-5xl">
                    <h1 className="mb-8 text-3xl font-bold">Complete Your Order</h1>

                    <CheckoutForm
                        product={product}
                        logistics={logistics || []}
                        initialQty={initialQty}
                        userId={user.id}
                        userEmail={user.email || ''}
                    />
                </div>
            </div>
        </div>
    )
}
