'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Ticket, Check, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useSellerStore } from '@/context/seller-store-context'
import { SUBSCRIPTION_PLANS, WHOLESALER_PLANS } from '@/lib/constants'
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3'
import { validatePromoCodeAction } from '@/app/actions/subscription'

export default function SubscriptionPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { store } = useSellerStore()
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState('')
    const [promoCode, setPromoCode] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'promo_code' | ''>('')
    const [userEmail, setUserEmail] = useState('')
    const [userName, setUserName] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            setUserEmail(user.email || '')
            setUserName(user.user_metadata?.full_name || user.email || '')

            if (!store) return

            setSelectedPlan((store as any)?.subscription_plan || 'basic')
            setLoading(false)
        }
        fetchData()
    }, [router, store])

    // Get plans based on store type
    const plans = store?.shop_type === 'brand' ? WHOLESALER_PLANS : SUBSCRIPTION_PLANS
    const selectedPlanData = plans.find(p => p.id === selectedPlan)
    const currentPlan = (store as any)?.subscription_plan || 'basic'

    // Flutterwave config
    const flwConfig = {
        public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || '',
        tx_ref: `sub_${store?.id}_${Date.now()}`,
        amount: selectedPlanData?.price || 0,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: userEmail,
            phone_number: '',
            name: userName,
        },
        customizations: {
            title: 'MyJara Subscription',
            description: `${selectedPlanData?.name || ''} Plan - Monthly`,
            logo: 'https://myjara.ng/logo.png',
        },
    }

    const handleFlutterPayment = useFlutterwave(flwConfig)

    const handleSubscribe = async () => {
        if (!selectedPlan) {
            toast({ title: 'Error', description: 'Please select a plan', variant: 'destructive' })
            return
        }
        if (!paymentMethod) {
            toast({ title: 'Error', description: 'Please select a payment method', variant: 'destructive' })
            return
        }

        // If same plan and not expired, no change needed
        const isExpired = store?.subscription_expiry && new Date(store.subscription_expiry) < new Date()
        if (selectedPlan === currentPlan && !isExpired) {
            toast({ title: 'No Change', description: 'You are already on this plan.', variant: 'destructive' })
            return
        }

        if (paymentMethod === 'flutterwave') {
            // Check if Flutterwave key is configured
            const flwKey = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY
            if (!flwKey || flwKey === 'placeholder-fw-public' || flwKey.length < 10) {
                toast({
                    title: 'Payment Not Available',
                    description: 'Flutterwave payment is not configured yet. Please use a promo code or contact admin.',
                    variant: 'destructive'
                })
                return
            }

            setProcessing(true)
            handleFlutterPayment({
                callback: async (response) => {
                    if (response.status === 'successful' || response.status === 'completed') {
                        // Payment confirmed — now update subscription
                        try {
                            const supabase = createClient()
                            const expiryDate = new Date()
                            expiryDate.setMonth(expiryDate.getMonth() + 1)

                            const { error } = await (supabase as any)
                                .from('stores')
                                .update({
                                    subscription_plan: selectedPlan,
                                    subscription_expiry: expiryDate.toISOString(),
                                    payment_status: 'active'
                                })
                                .eq('id', store?.id)

                            if (error) throw error

                            toast({ title: 'Payment Successful!', description: `Your plan has been upgraded to ${selectedPlanData?.name}.` })
                            router.push('/seller/dashboard')
                        } catch (err: any) {
                            toast({ title: 'Error', description: 'Payment received but subscription update failed. Contact support.', variant: 'destructive' })
                        }
                    } else {
                        toast({ title: 'Payment Failed', description: 'The transaction was not successful. No changes were made.', variant: 'destructive' })
                    }
                    closePaymentModal()
                    setProcessing(false)
                },
                onClose: () => {
                    setProcessing(false)
                }
            })
        } else if (paymentMethod === 'promo_code') {
            if (!promoCode.trim()) {
                toast({ title: 'Error', description: 'Please enter a promo code', variant: 'destructive' })
                return
            }

            setProcessing(true)
            try {
                const result = await validatePromoCodeAction(promoCode)
                if (!result.success) {
                    toast({ title: 'Invalid Code', description: result.error, variant: 'destructive' })
                    setProcessing(false)
                    return
                }

                // Promo valid — update subscription
                const supabase = createClient()
                const expiryDate = new Date()
                expiryDate.setMonth(expiryDate.getMonth() + 1)

                const { error } = await (supabase as any)
                    .from('stores')
                    .update({
                        subscription_plan: selectedPlan,
                        subscription_expiry: expiryDate.toISOString(),
                        payment_status: 'active'
                    })
                    .eq('id', store?.id)

                if (error) throw error

                toast({ title: 'Success!', description: `Promo code applied. Your plan is now ${selectedPlanData?.name}.` })
                router.push('/seller/dashboard')
            } catch (err: any) {
                toast({ title: 'Error', description: err.message || 'Failed to apply promo code', variant: 'destructive' })
            } finally {
                setProcessing(false)
            }
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
    const planChanged = selectedPlan !== currentPlan

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
                {plans.map(plan => (
                    <Card
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedPlan === plan.id
                            ? 'border-emerald-500 ring-2 ring-emerald-500'
                            : 'border-gray-200'
                            }`}
                    >
                        <CardContent className="p-6">
                            {(plan.id === 'pro' || plan.id === 'supplier_pro') && (
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
                                        <Check className="h-4 w-4 text-emerald-500" />
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

            {/* Info banner */}
            {!planChanged && !isExpired && (
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">
                        You are currently on the <strong className="capitalize">{currentPlan}</strong> plan. Select a different plan to upgrade or downgrade.
                    </p>
                </div>
            )}

            <Button
                onClick={handleSubscribe}
                disabled={!selectedPlan || !paymentMethod || processing || (!planChanged && !isExpired)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
            >
                {processing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isExpired ? 'Renew Subscription' : planChanged ? 'Upgrade Plan' : 'No Changes to Apply'}
            </Button>
        </div>
    )
}
