"use client"

import { useState } from "react"
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PaymentButtonProps {
    order: any
    userEmail: string
    userName: string
}

export function PaymentButton({ order, userEmail, userName }: PaymentButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const config = {
        public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxx-X",
        tx_ref: order.order_number,
        amount: order.total,
        currency: "NGN",
        payment_options: "card,mobilemoney,ussd",
        customer: {
            email: userEmail,
            phone_number: "",
            name: userName,
        },
        customizations: {
            title: "MyJara Order",
            description: `Payment for Order ${order.order_number}`,
            logo: "https://myjara.ng/logo.png",
        },
        // If the store has a subaccount, we use it for split payments
        subaccounts: order.store.flutterwave_subaccount_id ? [
            {
                id: order.store.flutterwave_subaccount_id,
                transaction_charge_type: "flat_subaccount",
                transaction_charge: 0 // Platform takes 0 for now as per "free" model
            }
        ] : undefined
    }

    const handleFlutterPayment = useFlutterwave(config)

    const handlePayment = () => {
        setIsProcessing(true)
        handleFlutterPayment({
            callback: async (response) => {
                console.log(response)

                if (response.status === "successful" || response.status === "completed") {
                    // 1. Update order status
                    const { error: orderError } = await (supabase
                        .from('orders') as any)
                        .update({
                            status: 'paid',
                            flutterwave_tx_ref: response.transaction_id.toString()
                        })
                        .eq('id', order.id)

                    if (orderError) {
                        toast({
                            title: "Order Update Failed",
                            description: "Your payment was successful but we couldn't update the order. Please contact support.",
                            variant: "destructive"
                        })
                    }

                    // 2. Record transaction
                    const { error: txError } = await (supabase
                        .from('transactions') as any)
                        .insert({
                            order_id: order.id,
                            store_id: order.store_id,
                            flutterwave_tx_id: response.transaction_id.toString(),
                            amount: order.total,
                            status: 'success',
                            gateway_response: response
                        })

                    toast({
                        title: "Payment Successful!",
                        description: "Your order is now being processed."
                    })

                    router.refresh()
                } else {
                    toast({
                        title: "Payment Failed",
                        description: "The transaction was not successful.",
                        variant: "destructive"
                    })
                }

                closePaymentModal()
                setIsProcessing(false)
            },
            onClose: () => {
                setIsProcessing(false)
            },
        })
    }

    return (
        <Button
            className="w-full mt-4 h-12 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
            onClick={handlePayment}
            disabled={isProcessing}
        >
            {isProcessing ? "Processing..." : "Complete Payment"}
        </Button>
    )
}
