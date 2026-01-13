"use client"

import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Store } from "lucide-react"
import { formatPrice } from "@/lib/utils"

export default function CartPage() {
    const { items, updateQuantity, removeItem, total, clearCart } = useCart()

    // Group items by store
    const itemsByStore = items.reduce((acc, item) => {
        if (!acc[item.storeId]) {
            acc[item.storeId] = {
                storeName: item.storeName,
                items: []
            }
        }
        acc[item.storeId].items.push(item)
        return acc
    }, {} as Record<string, { storeName: string, items: typeof items }>)

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
                <div className="bg-emerald-50 p-6 rounded-full mb-6">
                    <ShoppingBag className="h-16 w-16 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                <p className="text-gray-500 mb-8 max-w-md">
                    It looks like you haven't added any items to your cart yet. Browse our marketplace to find great products and Jara deals!
                </p>
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/search">Start Shopping</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart ({items.length} items)</h1>

            <div className="grid gap-12 lg:grid-cols-3">
                {/* Left Col: Cart Items */}
                <div className="lg:col-span-2 space-y-8">
                    {Object.entries(itemsByStore).map(([storeId, storeData]) => (
                        <div key={storeId} className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-500 font-medium pb-2 border-b border-gray-100">
                                <Store className="h-4 w-4" />
                                Sold by {storeData.storeName}
                            </div>

                            {storeData.items.map((item) => {
                                // Calculate Jara for this item
                                const jaraBonus = (item.jaraBuyQty && item.jaraGetQty)
                                    ? Math.floor(item.quantity / item.jaraBuyQty) * item.jaraGetQty
                                    : 0

                                return (
                                    <div key={item.id} className="flex gap-4 py-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-emerald-100 transition-colors">
                                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-100">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xl font-bold bg-emerald-100 text-emerald-600">
                                                    {item.name[0]}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col justify-between">
                                            <div className="flex justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                                                    <p className="font-bold text-emerald-600">{formatPrice(item.price)}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div className="flex items-end justify-between mt-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center rounded-lg border border-gray-200">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{formatPrice(item.price * item.quantity)}</p>
                                                    {jaraBonus > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                            🎁 +{jaraBonus} Jara
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}

                    <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
                        Clear Cart
                    </Button>
                </div>

                {/* Right Col: Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-24 shadow-sm border-gray-200">
                        <CardContent className="p-6 space-y-6">
                            <h2 className="font-bold text-xl">Order Summary</h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span className="text-xs text-gray-400">Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-2xl text-emerald-600">{formatPrice(total)}</span>
                            </div>

                            <Button className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" asChild>
                                <Link href="/checkout">
                                    Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>

                            <p className="text-center text-xs text-gray-400">
                                Secure Checkout via Flutterwave
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
