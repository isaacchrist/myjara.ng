"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Truck, Loader2, Store, Gift } from "lucide-react"
import { formatPrice, generateOrderNumber } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { getLogisticsForStoresAction } from "@/app/actions/logistics"

interface CartCheckoutFormProps {
    userId: string
    userEmail: string
}

export function CartCheckoutForm({ userId, userEmail }: CartCheckoutFormProps) {
    const { items, total, clearCart } = useCart()
    const [logistics, setLogistics] = useState<any[]>([])
    const [selectedLogistics, setSelectedLogistics] = useState<Record<string, string>>({}) // storeId -> logisticsId
    const [address, setAddress] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loadingLogistics, setLoadingLogistics] = useState(true)

    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    // 1. Group items by Store
    const itemsByStore = useMemo(() => {
        return items.reduce((acc, item) => {
            if (!acc[item.storeId]) {
                acc[item.storeId] = {
                    storeName: item.storeName,
                    items: [],
                    subtotal: 0
                }
            }
            acc[item.storeId].items.push(item)
            acc[item.storeId].subtotal += item.price * item.quantity
            return acc
        }, {} as Record<string, { storeName: string, items: typeof items, subtotal: number }>)
    }, [items])

    // 2. Fetch Logistics
    useEffect(() => {
        const storeIds = Object.keys(itemsByStore)
        if (storeIds.length === 0) {
            setLoadingLogistics(false)
            return
        }

        getLogisticsForStoresAction(storeIds).then(data => {
            setLogistics(data)
            setLoadingLogistics(false)
        })
    }, [itemsByStore])

    // 3. Calculation
    const totalShipping = Object.entries(selectedLogistics).reduce((acc, [storeId, logisticsId]) => {
        const option = logistics.find(l => l.id === logisticsId)
        return acc + (option?.delivery_fee || 0)
    }, 0)

    const gradTotal = total + totalShipping

    const handleCheckout = async () => {
        // Validation
        const storeIds = Object.keys(itemsByStore)
        const pendingStores = storeIds.filter(id => !selectedLogistics[id])

        if (pendingStores.length > 0) {
            toast({
                title: "Missing Delivery Options",
                description: "Please select a delivery method for all stores.",
                variant: "destructive"
            })
            return
        }

        if (!address.trim()) {
            toast({
                title: "Address Required",
                description: "Please enter your delivery address.",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        try {
            const createdOrderIds: string[] = []

            // Loop through each store and create an order
            for (const storeId of storeIds) {
                const storeData = itemsByStore[storeId]
                const logisticsId = selectedLogistics[storeId]
                const logisticsOption = logistics.find(l => l.id === logisticsId)
                const shippingFee = logisticsOption?.delivery_fee || 0
                const storeTotal = storeData.subtotal + shippingFee
                const orderNumber = generateOrderNumber()

                // A. Create Order
                const { data: order, error: orderError } = await (supabase
                    .from('orders') as any)
                    .insert({
                        user_id: userId,
                        store_id: storeId,
                        order_number: orderNumber,
                        subtotal: storeData.subtotal,
                        logistics_fee: shippingFee,
                        total: storeTotal,
                        status: 'pending',
                        logistics_option_id: logisticsId,
                        delivery_address: { address: address }
                    })
                    .select()
                    .single()

                if (orderError) throw orderError
                createdOrderIds.push(order.id)

                // B. Create Order Items
                const orderItemsData = storeData.items.map(item => ({
                    order_id: order.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    jara_quantity: (item.jaraBuyQty && item.jaraGetQty)
                        ? Math.floor(item.quantity / item.jaraBuyQty) * item.jaraGetQty
                        : 0,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                }))

                const { error: itemsError } = await (supabase
                    .from('order_items') as any)
                    .insert(orderItemsData)

                if (itemsError) throw itemsError
            }

            // Success
            toast({
                title: "Orders Placed!",
                description: `Successfully created ${createdOrderIds.length} orders.`,
            })

            clearCart()

            // If single order, go to it. If multiple, maybe go to orders list?
            if (createdOrderIds.length === 1) {
                router.push(`/orders/${createdOrderIds[0]}`)
            } else {
                router.push('/orders') // Redirect to list of orders so they can pay individually
            }

        } catch (error: any) {
            console.error("Checkout Error:", error)
            toast({
                title: "Checkout Failed",
                description: error.message || "Failed to process orders.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (items.length === 0) {
        return <div className="p-8 text-center text-gray-500">Your cart is empty.</div>
    }

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Store Groups */}
            <div className="lg:col-span-2 space-y-8">
                {/* Address (Global for this checkout) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Address</CardTitle>
                        <CardDescription>One address for all deliveries.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder="Apartment, Street, City, State, Phone"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="bg-white"
                        />
                    </CardContent>
                </Card>

                {Object.entries(itemsByStore).map(([storeId, storeData]) => {
                    const storeLogistics = logistics.filter(l => l.store_id === storeId)
                    return (
                        <Card key={storeId} className="border-l-4 border-l-emerald-500">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Store className="h-5 w-5 text-gray-500" />
                                    <CardTitle>Order from {storeData.storeName}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Items List */}
                                <div className="space-y-3">
                                    {storeData.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{item.quantity}x</Badge>
                                                <span>{item.name}</span>
                                            </div>
                                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Logistics Selector */}
                                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <Truck className="h-4 w-4" />
                                        Delivery Method
                                    </p>

                                    {loadingLogistics ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading options...
                                        </div>
                                    ) : storeLogistics.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {storeLogistics.map(opt => (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => setSelectedLogistics(prev => ({ ...prev, [storeId]: opt.id }))}
                                                    className={`cursor-pointer rounded-lg border p-3 text-sm transition-all ${selectedLogistics[storeId] === opt.id
                                                            ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex justify-between font-bold">
                                                        <span>{opt.type === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                                                        <span>{opt.delivery_fee === 0 ? 'FREE' : formatPrice(opt.delivery_fee)}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {opt.location_name} • {opt.delivery_timeline}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-500">No delivery options available for this store.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Right: Summary */}
            <div className="space-y-6">
                <Card className="sticky top-24">
                    <CardHeader>
                        <CardTitle>Total Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Total Shipping</span>
                            <span>{formatPrice(totalShipping)}</span>
                        </div>
                        <div className="border-t pt-4 flex justify-between font-bold text-xl">
                            <span>Total</span>
                            <span className="text-emerald-600">{formatPrice(gradTotal)}</span>
                        </div>

                        <Button
                            className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 mt-4"
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : "Place All Orders"}
                        </Button>
                        <p className="text-xs text-center text-gray-400">
                            You'll pay for each order individually on the next step.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
