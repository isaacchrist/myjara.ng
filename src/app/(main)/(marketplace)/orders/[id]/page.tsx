import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Gift, MapPin, Truck, ChevronRight, Package, Calendar, Tag } from "lucide-react"
import { formatPrice, formatJara } from "@/lib/utils"
import { PaymentButton } from "@/components/marketplace/payment-button"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect(`/login?redirect=/orders/${id}`)
    }

    // 2. Fetch Order Details
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            store:stores(name, slug, logo_url, flutterwave_subaccount_id),
            order_items(*, product:products(name, price, product_images(url, is_primary))),
            logistics:store_logistics(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single() as any

    if (error || !order) {
        notFound()
    }

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700',
        paid: 'bg-emerald-100 text-emerald-700',
        processing: 'bg-emerald-100 text-emerald-700',
        shipped: 'bg-purple-100 text-purple-700',
        delivered: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700',
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link
                    href="/dashboard"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to my orders
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                {order.store.name}
                            </span>
                        </div>
                    </div>
                    <div>
                        <Badge className={`px-4 py-1.5 text-sm font-medium ${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
                            {order.status.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left: Order Items & Shipping */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Items</CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-gray-100">
                                {order.order_items.map((item: any) => {
                                    const primaryImage = item.product.product_images?.find((img: any) => img.is_primary)?.url
                                        || item.product.product_images?.[0]?.url

                                    return (
                                        <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                                            <div className="flex gap-4">
                                                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                    {primaryImage ? (
                                                        <Image src={primaryImage} alt={item.product.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xl font-bold bg-emerald-100 text-emerald-600">
                                                            {item.product.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{item.product.name}</h3>
                                                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                        <span>{formatPrice(item.unit_price)} × {item.quantity}</span>
                                                        {item.jara_quantity > 0 && (
                                                            <Badge variant="jara">+{item.jara_quantity} Jara Items</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right font-bold">
                                                    {formatPrice(item.total_price)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>

                        {/* Order Details Grid */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Shipping info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Truck className="h-4 w-4" />
                                        <span className="text-sm font-medium">Logistics Details</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-bold">{order.logistics.location_name}</p>
                                    <p className="text-sm text-gray-500 mt-1">{order.logistics.city}</p>
                                    <p className="text-sm font-medium mt-2 text-emerald-600 capitalize">
                                        {order.logistics.type} Service
                                    </p>
                                    {order.logistics.delivery_timeline && (
                                        <p className="text-xs text-gray-400 mt-1">Est. {order.logistics.delivery_timeline}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Delivery Address */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm font-medium">Delivery Address</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{order.delivery_address?.address || 'No address provided'}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right: Payment Summary */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping Fee</span>
                                    <span>{order.logistics_fee === 0 ? 'Free' : formatPrice(order.logistics_fee)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-emerald-600">{formatPrice(order.total)}</span>
                                </div>

                                {order.status === 'pending' && (
                                    <PaymentButton
                                        order={order}
                                        userEmail={user.email || ''}
                                        userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'}
                                    />
                                )}

                                <Card className="bg-emerald-50 border-emerald-100 mt-4">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                                            <Gift className="h-4 w-4" />
                                            Jara Secured
                                        </div>
                                        <p className="text-xs text-emerald-600">
                                            This order qualifies for {order.order_items.reduce((sum: number, i: any) => sum + i.jara_quantity, 0)} Jara gift items.
                                        </p>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>

                        {/* Need Help? */}
                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h3 className="font-bold mb-2">Need help with this order?</h3>
                            <p className="text-sm text-gray-500 mb-4">Contact {order.store.name} directly via real-time chat.</p>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/store/${order.store.slug}`}>
                                    Contact Store
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
