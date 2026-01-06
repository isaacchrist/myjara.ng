'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, User, Mail, Lock, ArrowRight, Loader2, CheckCircle2, MapPin, Calendar, ShoppingBag, Truck, Globe, CreditCard, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ABUJA_MARKETS, SUBSCRIPTION_PLANS } from '@/lib/constants'
import { validatePromoCodeAction, createSubscriptionAction } from '@/app/actions/subscription'
import { useToast } from '@/hooks/use-toast'

export default function RetailerRegisterPage() {
    const router = useRouter()
    const { toast } = useToast()
    // Steps: 0=ShopType, 1=Details, 2=Plan, 3=Payment
    const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        // Shop Type
        shopType: '' as 'physical' | 'online' | 'market_day' | '',
        choosenMarkets: [] as string[],

        // Personal
        fullName: '',
        email: '',
        password: '',
        phone: '',

        // Subscription
        selectedPlan: '' as 'basic' | 'pro' | 'exclusive' | '',
        paymentMethod: '' as 'flutterwave' | 'promo_code' | '',
        promoCode: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const toggleMarket = (marketName: string) => {
        setFormData(prev => {
            const current = prev.choosenMarkets
            if (current.includes(marketName)) {
                return { ...prev, choosenMarkets: current.filter(m => m !== marketName) }
            } else {
                return { ...prev, choosenMarkets: [...current, marketName] }
            }
        })
    }

    const handleRegister = async () => {
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()

            // 1. Create User
            const metaData: any = {
                full_name: formData.fullName,
                role: 'retailer',
                verification_status: 'pending', // Admins approve
                shop_type: formData.shopType,
                market_days: formData.shopType === 'market_day' ? formData.choosenMarkets : [],
                phone_number: formData.phone
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: { data: metaData }
            })

            if (authError || !authData.user) throw authError || new Error('Signup failed')

            // 2. Process Subscription
            let subResult
            if (formData.paymentMethod === 'promo_code') {
                subResult = await createSubscriptionAction(
                    authData.user.id,
                    formData.selectedPlan,
                    'promo_code',
                    formData.promoCode
                )
            } else {
                // Flutterwave placeholder: In reality, we'd redirect to payment link here
                // For MVP Registration, we assume success or handle inline.
                // Let's create a "pending" or just active default for now to satisfy flow.
                subResult = await createSubscriptionAction(
                    authData.user.id,
                    formData.selectedPlan,
                    'flutterwave',
                    'FLW_MOCK_REF_' + Date.now()
                )
            }

            if (!subResult.success) {
                // User created but sub failed. 
                // In real app, redirect to "Finish Payment" page.
                throw new Error(subResult.error || 'Subscription failed')
            }

            toast({ title: 'Welcome!', description: 'Account created successfully.' })
            router.push('/verification-pending')

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Something went wrong')
            setLoading(false)
        }
    }

    const validatePromo = async () => {
        if (!formData.promoCode) return
        setLoading(true)
        const res = await validatePromoCodeAction(formData.promoCode)
        setLoading(false)
        if (res.success) {
            toast({ title: 'Success', description: 'Promo Code Applied!', variant: 'default' })
        } else {
            setError(res.error || 'Invalid Code')
            setFormData(prev => ({ ...prev, promoCode: '' }))
        }
    }

    // ... Render Logic (Simplified for artifact brevity, actual write will be full)
    // Writing full component below

    const renderStep0 = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {[
                { id: 'physical', label: 'Physical Store', icon: Store, desc: 'I have a permanent shop location.' },
                { id: 'online', label: 'Online Store', icon: Globe, desc: 'I sell primarily via social media.' },
                { id: 'market_day', label: 'Market Day Shop', icon: ShoppingBag, desc: 'I sell at major markets on specific days.' },
            ].map((type) => (
                <div
                    key={type.id}
                    onClick={() => setFormData(p => ({ ...p, shopType: type.id as any }))}
                    className={`cursor-pointer border-2 rounded-xl p-6 flex flex-col items-center text-center transition-all hover:scale-105 ${formData.shopType === type.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-200'}`}
                >
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                        <type.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-500 mt-2">{type.desc}</p>
                </div>
            ))}

            {formData.shopType === 'market_day' && (
                <div className="col-span-1 md:col-span-3 mt-6 bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                    <h4 className="font-semibold text-gray-900 mb-4">Select Markets you frequent:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ABUJA_MARKETS.map(m => (
                            <div
                                key={m.name}
                                onClick={() => toggleMarket(m.name)}
                                className={`text-sm p-2 rounded border cursor-pointer select-none transition-colors ${formData.choosenMarkets.includes(m.name) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 hover:border-emerald-400'}`}
                            >
                                {m.name} <span className="opacity-70 text-xs block">{m.days.join(', ')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const renderStep1 = () => (
        <div className="space-y-4 max-w-md mx-auto animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Chidinma Okafor" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="080 1234 5678" />
                <p className="text-xs text-gray-500">We prefer WhatsApp for quick updates.</p>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="chidi@example.com" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4">
            {SUBSCRIPTION_PLANS.map(plan => (
                <div
                    key={plan.id}
                    onClick={() => setFormData(p => ({ ...p, selectedPlan: plan.id as any }))}
                    className={`relative cursor-pointer border rounded-xl p-6 transition-all hover:shadow-lg ${formData.selectedPlan === plan.id ? 'border-emerald-500 ring-2 ring-emerald-500 shadow-xl scale-[1.02]' : 'border-gray-200'}`}
                >
                    {plan.id === 'pro' && <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-bold">POPULAR</div>}
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                        <span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/mo</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {f}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    )

    const renderStep3 = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4">
            {/* Flutterwave Card */}
            <div
                onClick={() => setFormData(p => ({ ...p, paymentMethod: 'flutterwave' }))}
                className={`cursor-pointer group flex flex-col items-center justify-center p-8 border-2 rounded-2xl bg-white hover:border-orange-400 transition-all ${formData.paymentMethod === 'flutterwave' ? 'border-orange-500 ring-4 ring-orange-100' : 'border-gray-100'}`}
            >
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600">
                    <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Pay with Card</h3>
                <p className="text-gray-500 text-center mt-2">Secure payment via Flutterwave. Supports Cards, Transfers, and USSD.</p>
            </div>

            {/* Promo Code Card */}
            <div
                onClick={() => setFormData(p => ({ ...p, paymentMethod: 'promo_code' }))}
                className={`cursor-pointer group flex flex-col items-center justify-center p-8 border-2 rounded-2xl bg-white hover:border-purple-400 transition-all ${formData.paymentMethod === 'promo_code' ? 'border-purple-500 ring-4 ring-purple-100' : 'border-gray-100'}`}
            >
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                    <Ticket className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Use Promo Code</h3>
                <p className="text-gray-500 text-center mt-2 mb-4">Have a comprehensive registration code?</p>

                {formData.paymentMethod === 'promo_code' && (
                    <div className="w-full mt-2 space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                            <Input
                                placeholder="ENTER CODE"
                                value={formData.promoCode}
                                onChange={e => setFormData(p => ({ ...p, promoCode: e.target.value.toUpperCase() }))}
                                className="text-center font-mono tracking-widest uppercase"
                            />
                            <Button size="sm" onClick={validatePromo} disabled={!formData.promoCode || loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-5xl w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Retailer Registration</h2>
                    <p className="mt-2 text-gray-600">Join the MyJara network to access premium wholesale deals.</p>
                </div>

                <div className="relative">
                    {/* Progress Steps */}
                    <div className="flex justify-center gap-4 mb-8">
                        {['Shop Type', 'Details', 'Plan', 'Payment'].map((label, idx) => (
                            <div key={idx} className={`flex items-center gap-2 text-sm font-medium ${step >= idx ? 'text-emerald-600' : 'text-gray-400'}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= idx ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300'}`}>
                                    {idx + 1}
                                </div>
                                <span className="hidden sm:inline">{label}</span>
                            </div>
                        ))}
                    </div>

                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-8">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                                    <span className="h-2 w-2 bg-red-600 rounded-full" /> {error}
                                </div>
                            )}

                            {step === 0 && renderStep0()}
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </CardContent>
                        <CardFooter className="flex justify-between p-8 bg-gray-50/50 rounded-b-xl">
                            <Button
                                variant="outline"
                                onClick={() => setStep(s => Math.max(0, s - 1) as any)}
                                disabled={step === 0 || loading}
                            >
                                Back
                            </Button>

                            {step === 3 ? (
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 min-w-[200px]"
                                    onClick={handleRegister}
                                    disabled={loading || (formData.paymentMethod === 'promo_code' && !formData.promoCode) || !formData.paymentMethod}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Registration'}
                                </Button>
                            ) : (
                                <Button
                                    className="bg-gray-900 text-white hover:bg-gray-800"
                                    onClick={() => {
                                        if (step === 0 && !formData.shopType) return setError('Please select a shop type')
                                        if (step === 0 && formData.shopType === 'market_day' && formData.choosenMarkets.length === 0) return setError('Select at least one market')
                                        if (step === 1 && (!formData.email || !formData.password || !formData.fullName)) return setError('Fill all fields')
                                        if (step === 2 && !formData.selectedPlan) return setError('Select a plan')
                                        setError('')
                                        setStep(s => Math.min(3, s + 1) as any)
                                    }}
                                >
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
