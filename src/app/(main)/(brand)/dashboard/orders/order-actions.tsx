"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateOrderFulfillmentStatus } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, Package, Truck, CheckCircle2 } from "lucide-react"

interface OrderActionsProps {
    orderId: string
    currentStatus: string
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleUpdateStatus = async (newStatus: string) => {
        setIsLoading(true)
        try {
            const result = await updateOrderFulfillmentStatus(orderId, newStatus)
            if (result.error) throw new Error(result.error)

            toast({
                title: "Status Updated",
                description: `Order successfully marked as ${newStatus}`
            })
            router.refresh()
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (currentStatus === 'cancelled' || currentStatus === 'delivered') return null

    return (
        <div className="flex gap-2">
            {currentStatus === 'paid' && (
                <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                    onClick={() => handleUpdateStatus('processing')}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                    Start Processing
                </Button>
            )}

            {currentStatus === 'processing' && (
                <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 w-full"
                    onClick={() => handleUpdateStatus('shipped')}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                    Ship Order
                </Button>
            )}

            {currentStatus === 'shipped' && (
                <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                    onClick={() => handleUpdateStatus('delivered')}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Mark Delivered
                </Button>
            )}
        </div>
    )
}
