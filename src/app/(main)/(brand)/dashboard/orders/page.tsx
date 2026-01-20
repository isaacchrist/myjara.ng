"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Truck,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { updateOrderFulfillmentStatus } from "./actions"

export default function BrandOrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const supabase = createClient()
    const { toast } = useToast()

    const fetchOrders = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: store } = await supabase
                .from("stores")
                .select("id")
                .eq("owner_id", user.id)
                .single() as any

            if (!store) return

            let query = supabase
                .from("orders")
                .select(`
                    *,
                    user:users(full_name, email),
                    order_items(count)
                `)
                .eq("store_id", store.id)
                .order("created_at", { ascending: false })

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter)
            }

            const { data, error } = await query

            if (error) throw error
            setOrders(data || [])
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load orders",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [statusFilter])

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const result = await updateOrderFulfillmentStatus(orderId, newStatus)

            if (result.error) throw new Error(result.error)

            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            toast({
                title: "Status Updated",
                description: `Order is now ${newStatus}`
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update status",
                variant: "destructive"
            })
        }
    }

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700',
        paid: 'bg-emerald-100 text-emerald-700',
        processing: 'bg-emerald-100 text-emerald-700',
        shipped: 'bg-purple-100 text-purple-700',
        delivered: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700',
    }

    const filteredOrders = orders.filter(o =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500">Manage and fulfill your customer orders</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search order # or customer..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending Payment</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <Button variant="outline" onClick={fetchOrders}>
                    <Filter className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Orders Table-like Cards */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <AlertCircle className="mb-4 h-12 w-12 opacity-20" />
                            <p>No orders found matching your criteria.</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className="overflow-hidden hover:border-emerald-200 transition-colors">
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-lg">
                                            📦
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900">{order.order_number}</h3>
                                                <Badge className={`${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                By <span className="font-medium text-gray-700">{order.user?.full_name || 'Guest'}</span> • {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 sm:text-right">
                                        <div className="flex-1 sm:flex-none">
                                            <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                                            <p className="text-xs text-gray-500">{order.order_items?.[0]?.count || 1} items</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/orders/${order.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Link>
                                            </Button>

                                            {order.status === 'paid' && (
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateOrderStatus(order.id, 'processing')}>
                                                    Process
                                                </Button>
                                            )}
                                            {order.status === 'processing' && (
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => updateOrderStatus(order.id, 'shipped')}>
                                                    Ship
                                                </Button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                                    Deliver
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
