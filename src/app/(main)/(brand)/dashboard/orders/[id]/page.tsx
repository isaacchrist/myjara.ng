import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Gift, MapPin, Truck, ChevronRight, Package, Calendar, User, Mail, Phone } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { OrderActions } from "../order-actions"

export default async function BrandOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Auth Check - Ensure user owns the store this order belongs to
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect(`/login?redirect=/dashboard/orders/${id}`)
    }

    // 2. Fetch Order Details with Brand Check
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            user:users(full_name, email),
            order_items(*, product:products(name, price, product_images(url, is_primary))),
            logistics:store_logistics(*),
            store:stores!inner(owner_id)
        `)
        .eq('id', id)
        .eq('store.owner_id', user.id)
        .single() as any

    if (error || !order) {
        notFound()
    }

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700',
        paid: 'bg-emerald-100 text-emerald-700',
        processing: 'bg-blue-100 text-blue-700',
        shipped: 'bg-purple-100 text-purple-700',
        delivered: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700',
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/orders">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
                    <p className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Items & Fulfillment */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Card */}
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
                                                <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                                                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                    <span>{formatPrice(item.unit_price)} × {item.quantity}</span>
                                                    {item.jara_quantity > 0 && (
                                                        <Badge variant="jara">+{item.jara_quantity} Jara Items</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right font-bold text-gray-900">
                                                {formatPrice(item.total_price)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Shipping/Logistics Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Logistics & Delivery</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Selected Method</h4>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${order.logistics?.type === 'pickup' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {order.logistics?.type === 'pickup' ? <MapPin className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold">{order.logistics?.location_name || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{order.logistics?.city} • {order.logistics?.delivery_timeline}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Delivery Address</h4>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-1 h-5 w-5 text-gray-400" />
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {order.delivery_address?.address || 'No detailed address provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Customer & Payment */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-bold">
                                    {order.user.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold">{order.user.full_name || 'Anonymous User'}</p>
                                    <p className="text-xs text-gray-500">{order.user.email}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/dashboard/support?user=${order.user_id}`}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Chat with Customer
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Payment</CardTitle>
                                <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                                    {order.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Order Total</span>
                                <span>{formatPrice(order.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Logistics Fee</span>
                                <span>{formatPrice(order.logistics_fee)}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between font-bold text-lg">
                                <span>Earnings</span>
                                <span className="text-emerald-600">{formatPrice(order.total)}</span>
                            </div>

                            {order.flutterwave_tx_ref && (
                                <p className="text-[10px] text-center text-gray-400 font-mono mt-4">
                                    FLW REF: {order.flutterwave_tx_ref}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Card */}
                    <Card className="bg-emerald-50 border-emerald-100">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-emerald-900">Fulfillment Action</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-emerald-700 mb-4">
                                Make sure to include all {order.order_items.reduce((sum: number, i: any) => sum + i.jara_quantity, 0)} Jara gift items in the package!
                            </p>
                            <OrderActions orderId={order.id} currentStatus={order.status} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
