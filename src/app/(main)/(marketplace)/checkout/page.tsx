import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CartCheckoutForm } from "@/components/marketplace/cart-checkout-form"

export default async function CheckoutPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?redirect=/checkout')
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                <CartCheckoutForm
                    userId={user.id}
                    userEmail={user.email || ''}
                />
            </div>
        </div>
    )
}
