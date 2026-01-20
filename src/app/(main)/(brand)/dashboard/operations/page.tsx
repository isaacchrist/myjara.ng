"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Truck, ShoppingCart, MapPin, Package } from "lucide-react"

export default function OperationsPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="mb-2 text-3xl font-bold">Operations Hub</h1>
            <p className="mb-8 text-gray-500">Manage your store's logistics, fulfillment, and orders efficiently.</p>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Logistics Management */}
                <Link href="/dashboard/logistics" className="block">
                    <Card className="h-full transition-all hover:border-emerald-500 hover:shadow-md">
                        <CardHeader>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <Truck className="h-6 w-6" />
                            </div>
                            <CardTitle>Logistics Settings</CardTitle>
                            <CardDescription>
                                Configure delivery zones, fees, and pickup locations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Manage pickup points
                                </li>
                                <li className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Set delivery fees per city
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </Link>

                {/* Order Fulfillment */}
                <Link href="/dashboard/orders" className="block">
                    <Card className="h-full transition-all hover:border-emerald-500 hover:shadow-md">
                        <CardHeader>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                <Package className="h-6 w-6" />
                            </div>
                            <CardTitle>Order Fulfillment</CardTitle>
                            <CardDescription>
                                Process new orders and update shipment status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    View pending orders
                                </li>
                                <li className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Update tracking numbers
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
