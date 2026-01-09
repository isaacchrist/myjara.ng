"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, MapPin, Truck, Loader2, Minus, Plus } from "lucide-react"
import { formatPrice, generateOrderNumber } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface CheckoutFormProps {
    product: {
        id: string
        name: string
        price: number
        jara_buy_quantity: number
        jara_get_quantity: number
        store_id: string
        store: {
            name: string
        }
        product_images?: { url: string; is_primary: boolean }[]
    }
    logistics: {
        id: string
        type: string
        location_name: string
        city: string
        delivery_fee: number
        delivery_timeline: string
    }[]
    initialQty: number
    userId: string
    userEmail: string
}

export function CheckoutForm({ product, logistics, initialQty, userId, userEmail }: CheckoutFormProps) {
    const [quantity, setQuantity] = useState(initialQty)
    const [selectedLogisticsId, setSelectedLogisticsId] = useState<string>("")
    const [address, setAddress] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    // Calculations
    const jaraBonus = useMemo(() => {
        if (!product.jara_buy_quantity || !product.jara_get_quantity) return 0
        return Math.floor(quantity / product.jara_buy_quantity) * product.jara_get_quantity
    }, [quantity, product.jara_buy_quantity, product.jara_get_quantity])

    const subtotal = quantity * product.price
    const selectedLogistics = logistics.find(l => l.id === selectedLogisticsId)
    const shippingFee = selectedLogistics?.delivery_fee || 0
    const total = subtotal + shippingFee

    const handleCreateOrder = async () => {
        if (!selectedLogisticsId) {
            toast({
                title: "Wait!",
                description: "Please select a delivery or pickup option",
                variant: "destructive"
            })
            return
        }

        if (!address.trim()) {
            toast({
                title: "Address Required",
                description: "Enter your delivery address or contact info",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)
        try {
            const orderNumber = generateOrderNumber()

            // 1. Create Order
            const { data: order, error: orderError } = await (supabase
                .from('orders') as any)
                .insert({
                    user_id: userId,
                    store_id: product.store_id,
                    order_number: orderNumber,
                    subtotal: subtotal,
                    logistics_fee: shippingFee,
                    total: total,
                    status: 'pending',
                    logistics_option_id: selectedLogisticsId,
                    delivery_address: { address: address }
                })
                .select()
                .single()

            if (orderError) throw orderError

            // 2. Create Order Item
            const { error: itemError } = await (supabase
                .from('order_items') as any)
                .insert({
                    order_id: order.id,
                    product_id: product.id,
                    quantity: quantity,
                    jara_quantity: jaraBonus,
                    unit_price: product.price,
                    total_price: subtotal
                })

            if (itemError) throw itemError

            toast({
                title: "Order Placed!",
                description: "Your order has been created. Redirecting to payment..."
            })

            // In Step 4 we'll redirect to Flutterwave
            // For now, redirect to a mock success/order page
            router.push(`/orders/${order.id}`)

        } catch (error: any) {
            console.error("Checkout error:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to create order",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const primaryImage = product.product_images?.find((img) => img.is_primary)?.url
        || product.product_images?.[0]?.url

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Col: Details & Shipping */}
            <div className="space-y-6 lg:col-span-2">
                {/* Product Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {primaryImage ? (
                                    <Image src={primaryImage} alt={product.name} fill className="object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold bg-emerald-100 text-emerald-600">
                                        {product.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col">
                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                <p className="text-sm text-gray-500">Sold by {product.store.name}</p>
                                <div className="mt-auto flex items-center justify-between">
                                    <p className="font-bold text-lg">{formatPrice(product.price)}</p>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="rounded-full border border-gray-200 p-1 hover:bg-gray-100"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-8 text-center font-medium">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="rounded-full border border-gray-200 p-1 hover:bg-gray-100"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {jaraBonus > 0 && (
                            <div className="mt-6 flex items-center gap-3 rounded-xl bg-amber-50 p-4 border border-amber-100">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl font-bold">
                                    🎁
                                </div>
                                <div>
                                    <p className="font-bold text-amber-900">+{jaraBonus} Jara Bonus Items</p>
                                    <p className="text-sm text-amber-700">You're getting extra items at no cost!</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delivery Options */}
                <Card>
                    <CardHeader>
                        <CardTitle>How would you like to receive your order?</CardTitle>
                        <CardDescription>Select a delivery or pickup option from {product.store.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {logistics.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => setSelectedLogisticsId(option.id)}
                                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${selectedLogisticsId === option.id
                                        ? 'border-emerald-600 bg-emerald-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`p-1.5 rounded-lg ${option.type === 'pickup' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {option.type === 'pickup' ? <MapPin className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                                        </div>
                                        <span className="font-bold">{option.delivery_fee === 0 ? 'FREE' : formatPrice(option.delivery_fee)}</span>
                                    </div>
                                    <p className="font-semibold text-sm">{option.location_name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{option.city} • {option.delivery_timeline}</p>
                                </div>
                            ))}
                        </div>

                        {logistics.length === 0 && (
                            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                                <p>This brand hasn't configured logistics yet.</p>
                                <p className="text-sm">Please contact them via chat for delivery info.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Address */}
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Details</CardTitle>
                        <CardDescription>Where should {product.store.name} send your items?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Full address, apartment number, and phone number for delivery..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Right Col: Price Summary */}
            <div className="space-y-6">
                <Card className="sticky top-24">
                    <CardHeader>
                        <CardTitle>Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal ({quantity} items)</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Logistics Fee</span>
                            <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex justify-between">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-2xl font-bold text-emerald-600">{formatPrice(total)}</span>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                <Gift className="h-3 w-3 text-amber-500" />
                                Jara Included
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Extra Items Free</span>
                                <Badge variant="jara">{jaraBonus} Items</Badge>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 mt-4"
                            disabled={isSubmitting}
                            onClick={handleCreateOrder}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm & Pay"}
                        </Button>
                        <p className="text-center text-xs text-gray-400">
                            Secure payment via Flutterwave
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
