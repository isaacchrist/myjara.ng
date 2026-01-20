"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ShoppingBag,
    ChevronRight,
    Gift,
    Truck,
    Clock,
    Loader2
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function CustomerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createClient()
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login?redirect=/orders")
                return
            }

            const { data, error } = await supabase
                .from("orders")
                .select(`
                    *,
                    store:stores(name, slug, logo_url),
                    order_items(count)
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })

            if (error) {
                toast({
                    title: "Error",
                    description: "Failed to load your orders",
                    variant: "destructive"
                })
            } else {
                setOrders(data || [])
            }
            setIsLoading(false)
        }

        fetchOrders()
    }, [supabase, router, toast])

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700',
        paid: 'bg-emerald-100 text-emerald-700',
        processing: 'bg-emerald-100 text-emerald-700',
        shipped: 'bg-purple-100 text-purple-700',
        delivered: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700',
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                    <p className="text-gray-500">Track and manage your MyJara purchases</p>
                </div>

                {orders.length === 0 ? (
                    <Card className="py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-4xl">
                                🛍️
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">No orders yet</h3>
                            <p className="mt-1 text-gray-500">When you buy items, they will appear here.</p>
                            <Button asChild className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                                <Link href="/search">Start Shopping</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Link key={order.id} href={`/orders/${order.id}`}>
                                <Card className="hover:border-emerald-200 transition-all hover:shadow-md">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                                    {order.store.logo_url ? (
                                                        <img
                                                            src={order.store.logo_url}
                                                            alt={order.store.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-emerald-600 bg-emerald-50">
                                                            {order.store.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-900">{order.store.name}</h3>
                                                        <Badge className={`${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1 font-mono">
                                                            {order.order_number}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                                                    <p className="text-xs text-gray-500">{order.order_items?.[0]?.count || 1} items</p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-300" />
                                            </div>
                                        </div>
                                    </CardContent>
                                    {order.status === 'pending' && (
                                        <div className="bg-amber-50 px-6 py-2 border-t border-amber-100 flex items-center justify-between">
                                            <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                Waiting for payment
                                            </p>
                                            <span className="text-xs font-bold text-amber-800">Complete Now →</span>
                                        </div>
                                    )}
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
