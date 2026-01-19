'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Ticket, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'

export default function SubscriptionPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [store, setStore] = useState<any>(null)
    const [selectedPlan, setSelectedPlan] = useState('')
    const [promoCode, setPromoCode] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'promo_code' | ''>('')

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: store } = await supabase
                .from('stores')
                .select('*')
                .eq('owner_id', user.id)
                .single()

            setStore(store)
            setSelectedPlan((store as any)?.subscription_plan || 'basic')
            setLoading(false)
        }
        fetchData()
    }, [router])

    const handleSubscribe = async () => {
        if (!selectedPlan) {
            toast({ title: 'Error', description: 'Please select a plan', variant: 'destructive' })
            return
        }

        setProcessing(true)
        try {
            const supabase = createClient()

            // Calculate new expiry (1 month from now)
            const expiryDate = new Date()
            expiryDate.setMonth(expiryDate.getMonth() + 1)

            // Use from() with explicit type bypass
            const client = supabase as any
            const { error } = await client
                .from('stores')
                .update({
                    subscription_plan: selectedPlan,
                    subscription_expiry: expiryDate.toISOString(),
                    payment_status: 'active'
                })
                .eq('id', store.id)

            if (error) throw error

            toast({ title: 'Success!', description: 'Subscription updated successfully!' })
            router.push('/seller/dashboard')

        } catch (error: any) {
            console.error('Subscription error:', error)
            toast({ title: 'Error', description: error.message || 'Failed to update subscription', variant: 'destructive' })
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    const isExpired = store?.subscription_expiry && new Date(store.subscription_expiry) < new Date()

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/seller/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Subscription</h1>
                    <p className="text-gray-500">Manage your MyJara subscription</p>
                </div>
            </div>

            {/* Current Status */}
            <Card className={`mb-6 ${isExpired ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Current Plan</p>
                            <p className="text-xl font-bold capitalize">{store?.subscription_plan || 'Basic'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge variant={isExpired ? 'destructive' : 'default'}>
                                {isExpired ? 'Expired' : 'Active'}
                            </Badge>
                        </div>
                        {store?.subscription_expiry && (
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Expires</p>
                                <p className="font-semibold">{new Date(store.subscription_expiry).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Plans */}
            <h2 className="text-lg font-semibold mb-4">Choose a Plan</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                {SUBSCRIPTION_PLANS.map(plan => (
                    <Card
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedPlan === plan.id
                            ? 'border-emerald-500 ring-2 ring-emerald-500'
                            : 'border-gray-200'
                            }`}
                    >
                        <CardContent className="p-6">
                            {plan.id === 'pro' && (
                                <Badge className="absolute top-2 right-2 bg-emerald-500">Popular</Badge>
                            )}
                            <h3 className="text-lg font-bold">{plan.name}</h3>
                            <div className="mt-2 mb-4">
                                <span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span>
                                <span className="text-gray-500">/mo</span>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payment Method */}
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card
                    onClick={() => setPaymentMethod('flutterwave')}
                    className={`cursor-pointer transition-all ${paymentMethod === 'flutterwave' ? 'border-orange-500 ring-2 ring-orange-200' : ''
                        }`}
                >
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Pay with Card</h3>
                            <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    onClick={() => setPaymentMethod('promo_code')}
                    className={`cursor-pointer transition-all ${paymentMethod === 'promo_code' ? 'border-purple-500 ring-2 ring-purple-200' : ''
                        }`}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <Ticket className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Use Promo Code</h3>
                                <p className="text-sm text-gray-500">Enter a valid code</p>
                            </div>
                        </div>
                        {paymentMethod === 'promo_code' && (
                            <div className="mt-4">
                                <Input
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="ENTER CODE"
                                    className="text-center font-mono font-bold"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Button
                onClick={handleSubscribe}
                disabled={!selectedPlan || !paymentMethod || processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
            >
                {processing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isExpired ? 'Renew Subscription' : 'Update Subscription'}
            </Button>
        </div>
    )
}
