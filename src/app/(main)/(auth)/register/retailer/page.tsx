'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Store, User, Mail, Lock, ArrowRight, Loader2, CheckCircle2, MapPin, Calendar, ShoppingBag, CreditCard, Ticket, Phone } from 'lucide-react'
import { ProfilePictureUpload } from '@/components/shared/profile-picture-upload'
import { PhoneDialpad } from '@/components/shared/phone-dialpad'
import { GeoLocationCapture } from '@/components/shared/geo-location-capture'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ABUJA_MARKETS, SUBSCRIPTION_PLANS } from '@/lib/constants'
import { validatePromoCodeAction, createSubscriptionAction } from '@/app/actions/subscription'
import { useToast } from '@/hooks/use-toast'

function RetailerRegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    // URL Params
    const urlPhone = searchParams.get('phone')
    // Support multi-category param (comma separated)
    const urlCategories = searchParams.get('categories') ? searchParams.get('categories')?.split(',') : null
    // Legacy support
    const urlCategory = searchParams.get('category')
    const urlSubcategory = searchParams.get('subcategory')

    // Steps: 1=Personal, 2=Business(Location), 3=Plan, 4=Payment
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 'phone_entry'>(urlPhone ? 1 : 'phone_entry')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        // Shop Type
        shopType: (searchParams.get('type') as 'physical' | 'online' | 'market_day' | '') || 'physical',
        choosenMarkets: [] as string[],

        // Personal
        fullName: '',
        email: '',
        password: '',
        phone: urlPhone || '',
        sex: '' as 'male' | 'female' | '',
        dateOfBirth: '',
        residentialAddress: '',

        // Business
        businessName: '',
        businessLocation: {
            lat: null as number | null,
            lng: null as number | null,
            marketName: '',
            accuracy: 0
        },
        hasPhysicalStore: (searchParams.get('type') === 'physical' ? 'yes' : 'no'),

        // Category Data
        categories: urlCategories || [], // Array of IDs
        categoryId: urlCategory || '',
        subcategoryId: urlSubcategory || '',

        agreedToPolicy: false,

        // Subscription
        selectedPlan: '' as 'basic' | 'pro' | 'exclusive' | '',
        paymentMethod: '' as 'flutterwave' | 'promo_code' | '',
        promoCode: '',
        profilePictureUrl: ''
    })

    const STORAGE_KEY = 'myjara_retailer_registration_v2'

    // Load/Save Storage
    useEffect(() => {
        if (urlPhone && !urlCategory && !urlCategories) {
            const params = new URLSearchParams(searchParams.toString())
            router.push(`/register/retailer/category?${params.toString()}`)
        }
    }, [urlPhone, urlCategory, urlCategories, router, searchParams])

    useEffect(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Override with URL params if present
                if (urlCategories) parsed.categories = urlCategories
                if (urlCategory) parsed.categoryId = urlCategory
                if (urlSubcategory) parsed.subcategoryId = urlSubcategory
                if (urlPhone) parsed.phone = urlPhone

                if (!parsed.businessLocation) parsed.businessLocation = { lat: null, lng: null, marketName: '', accuracy: 0 }
                setFormData(prev => ({ ...prev, ...parsed }))
            } catch (e) { console.error(e) }
        }
    }, [urlCategories, urlCategory, urlSubcategory, urlPhone])

    useEffect(() => {
        const timeout = setTimeout(() => {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        }, 500)
        return () => clearTimeout(timeout)
    }, [formData])

    // Category Name Fetch
    const [categoryDisplay, setCategoryDisplay] = useState('')
    useEffect(() => {
        const fetchCategoryDetails = async () => {
            if (formData.categories && formData.categories.length > 0) {
                setCategoryDisplay(`${formData.categories.length} categories selected`)
                return
            }

            // Legacy display logic
            if (!formData.categoryId) return
            const supabase = createClient()
            const { data: cat } = await supabase.from('categories').select('name').eq('id', formData.categoryId).single() as any
            let subName = ''
            if (formData.subcategoryId) {
                const { data: sub } = await supabase.from('categories').select('name').eq('id', formData.subcategoryId).single() as any
                if (sub) subName = sub.name
            }
            if (cat) setCategoryDisplay(`${cat.name}${subName ? ` - ${subName}` : ''}`)
            else setCategoryDisplay('Unknown Category')
        }
        fetchCategoryDetails()
    }, [formData.categoryId, formData.subcategoryId, formData.categories])

    const getCategoryName = () => {
        if (formData.categories && formData.categories.length > 0) return categoryDisplay
        return (!formData.categoryId ? 'No Category Selected' : categoryDisplay || 'Loading...')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleRegister = async () => {
        setLoading(true)
        setError('')

        try {
            // Prepare Payload for Server Action
            const payload = {
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                sex: formData.sex,
                residentialAddress: formData.residentialAddress,

                businessName: formData.businessName,
                businessDescription: `Retailer specializing in ${categoryDisplay}`,
                shopType: formData.shopType || 'physical',

                latitude: formData.businessLocation.lat,
                longitude: formData.businessLocation.lng,
                marketName: formData.businessLocation.marketName,
                accuracy: formData.businessLocation.accuracy,

                // Pass new categories array
                categories: formData.categories,
                categoryId: formData.categoryId,
                subcategoryId: formData.subcategoryId,

                agreedToPolicy: formData.agreedToPolicy,
                profilePictureUrl: formData.profilePictureUrl,

                // New Fields - Sanitize empty strings to undefined
                // Utilize truthiness check which works for empty string and undefined
                selectedPlan: formData.selectedPlan ? (formData.selectedPlan as any) : 'basic',
                promoCode: (formData.paymentMethod === 'promo_code' && formData.promoCode) ? formData.promoCode : undefined,
                choosenMarkets: formData.choosenMarkets
            }

            // Call Server Action
            const { registerRetailer } = await import('@/app/actions/register')
            const result = await registerRetailer(payload)

            if (!result.success) {
                // If user exists error
                if (result.error?.includes('User already registered') || result.error?.includes('unique constraint')) {
                    throw new Error('An account with this email/phone already exists.')
                }
                throw new Error(result.error || 'Registration failed')
            }

            // Success Redirect
            toast({ title: 'Welcome!', description: 'Account created successfully.' })
            sessionStorage.removeItem(STORAGE_KEY)
            router.push('/verification-pending')

        } catch (err: any) {
            console.error('Registration error:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const validatePromo = async () => {
        if (!formData.promoCode) return
        setLoading(true)
        const res = await validatePromoCodeAction(formData.promoCode)
        setLoading(false)
        if (res.success) toast({ title: 'Success', description: 'Promo Code Applied!', variant: 'default' })
        else { setError(res.error || 'Invalid Code'); setFormData(prev => ({ ...prev, promoCode: '' })) }
    }

    const handlePhoneSubmit = (phone: string) => {
        const params = new URLSearchParams()
        if (formData.shopType) params.set('type', formData.shopType)
        params.set('phone', phone)
        router.push(`/register/retailer/category?${params.toString()}`)
    }

    if (step === 'phone_entry') return <PhoneDialpad title="Enter Phone Number" subtitle="Verify your account" onSubmit={handlePhoneSubmit} />

    const toggleMarket = (market: string) => {
        setFormData(prev => {
            const current = prev.choosenMarkets
            if (current.includes(market)) {
                return { ...prev, choosenMarkets: current.filter(m => m !== market) }
            } else {
                return { ...prev, choosenMarkets: [...current, market] }
            }
        })
    }

    const renderStep1 = () => (
        <div className="space-y-4 max-w-md mx-auto animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col items-center py-4">
                <label className="text-sm font-medium text-gray-700 mb-3">Profile Picture *</label>
                <ProfilePictureUpload value={formData.profilePictureUrl} onChange={(url) => setFormData(prev => ({ ...prev, profilePictureUrl: url || '' }))} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Chidinma Okafor" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-md">
                    <span className="font-mono font-medium text-gray-700">{formData.phone}</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-emerald-600" onClick={() => setStep('phone_entry')}>Change</Button>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="chidi@example.com" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Sex</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="sex" value="male" checked={formData.sex === 'male'} onChange={handleChange} className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="sex" value="female" checked={formData.sex === 'female'} onChange={handleChange} className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Female</span>
                    </label>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Residential Address</label>
                <textarea name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[80px]" required placeholder="Your home address" />
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Business / Shop Name</label>
                <Input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Chidi's Boutique" required />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Selected Category</label>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-800 font-medium text-sm">
                    {getCategoryName()}
                </div>
                <div className="flex justify-end">
                    <Link href={`/register/retailer/category?phone=${formData.phone}&type=${formData.shopType}`} className="text-xs text-emerald-600 hover:underline">Change Category</Link>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Business Location
                </h4>
                <p className="text-sm text-gray-500 mb-4">We need to capture your exact shop location.</p>
                <GeoLocationCapture
                    initialMarket={formData.shopType === 'market_day' ? (formData.choosenMarkets[0] || '') : ''}
                    onLocationCaptured={(data) => setFormData(prev => ({ ...prev, businessLocation: data }))}
                />
            </div>

            <div className="pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2">
                    <input type="checkbox" id="policy" name="agreedToPolicy" checked={formData.agreedToPolicy} onChange={(e) => setFormData(p => ({ ...p, agreedToPolicy: e.target.checked }))} className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600" required />
                    <label htmlFor="policy" className="text-sm text-gray-600">
                        I agree to the <a href="#" className="text-emerald-600 underline">MyJara Operations Policy</a>.
                    </label>
                </div>
            </div>

            {/* Market Days Selection (For frequent markets) */}
            {formData.shopType === 'market_day' && (
                <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-600" /> Frequent Markets
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">Select the markets you attend regularly (besides your main spot):</p>
                    <div className="grid grid-cols-2 gap-3">
                        {ABUJA_MARKETS.map(m => (
                            <div
                                key={m.name}
                                onClick={() => toggleMarket(m.name)}
                                className={`text-sm p-3 rounded-lg border cursor-pointer select-none transition-all text-center ${formData.choosenMarkets.includes(m.name) ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'}`}
                            >
                                {m.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const renderStep3 = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4">
            {SUBSCRIPTION_PLANS.map(plan => (
                <div key={plan.id} onClick={() => setFormData(p => ({ ...p, selectedPlan: plan.id as any }))} className={`relative cursor-pointer border rounded-xl p-6 transition-all hover:shadow-lg ${formData.selectedPlan === plan.id ? 'border-emerald-500 ring-2 ring-emerald-500 shadow-xl scale-[1.02]' : 'border-gray-200'}`}>
                    {plan.id === 'pro' && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-bold">POPULAR</div>}
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2 mb-4"><span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span><span className="text-gray-500 text-sm">/mo</span></div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">{plan.features.map((f, i) => <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {f}</li>)}</ul>
                </div>
            ))}
        </div>
    )

    const renderStep4 = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4">
            <div onClick={() => setFormData(p => ({ ...p, paymentMethod: 'flutterwave' }))} className={`cursor-pointer group flex flex-col items-center justify-center p-8 border-2 rounded-2xl bg-white hover:border-orange-400 transition-all ${formData.paymentMethod === 'flutterwave' ? 'border-orange-500 ring-4 ring-orange-100' : 'border-gray-100'}`}>
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600"><CreditCard className="h-8 w-8" /></div>
                <h3 className="text-xl font-bold text-gray-900">Pay with Card</h3>
            </div>
            <div onClick={() => setFormData(p => ({ ...p, paymentMethod: 'promo_code' }))} className={`cursor-pointer group flex flex-col items-center justify-center p-8 border-2 rounded-2xl bg-white hover:border-purple-400 transition-all ${formData.paymentMethod === 'promo_code' ? 'border-purple-500 ring-4 ring-purple-100' : 'border-gray-100'}`}>
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600"><Ticket className="h-8 w-8" /></div>
                <h3 className="text-xl font-bold text-gray-900">Use Promo Code</h3>
                {formData.paymentMethod === 'promo_code' && (
                    <div className="w-full mt-2 space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                            <Input placeholder="ENTER CODE" value={formData.promoCode} onChange={(e) => setFormData(p => ({ ...p, promoCode: e.target.value.toUpperCase() }))} className="text-center font-mono font-bold tracking-widest" />
                            <Button size="icon" onClick={validatePromo} disabled={loading}><CheckCircle2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    const progress = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100

    return (
        <div className="min-h-[calc(100vh-200px)] flex flex-col pt-8">
            <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 max-w-xl mx-auto">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
                        <span className={step >= 1 ? 'text-emerald-600' : ''}>Personal</span>
                        <span className={step >= 2 ? 'text-emerald-600' : ''}>Business</span>
                        <span className={step >= 3 ? 'text-emerald-600' : ''}>Plan</span>
                        <span className={step >= 4 ? 'text-emerald-600' : ''}>Payment</span>
                    </div>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {step === 1 && 'Personal Details'}
                            {step === 2 && 'Business Details'}
                            {step === 3 && 'Choose Your Plan'}
                            {step === 4 && 'Payment Method'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && 'Tell us a bit about yourself'}
                            {step === 2 && 'Verify your business location'}
                            {step === 3 && 'Select a subscription plan'}
                            {step === 4 && 'Complete your registration'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><span className="font-bold">Error:</span> {error}</div>}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 bg-gray-50">
                        {step > 1 ? (
                            <Button variant="outline" onClick={() => setStep(prev => typeof prev === 'number' ? (prev - 1) as any : prev)}>Back</Button>
                        ) : (
                            <Button variant="outline" onClick={() => setStep('phone_entry')}>Change Number</Button>
                        )}

                        {step < 4 ? (
                            <Button onClick={() => setStep(prev => typeof prev === 'number' ? (prev + 1) as any : prev)}
                                disabled={
                                    (step === 1 && (!formData.fullName || !formData.residentialAddress)) ||
                                    (step === 2 && (formData.businessLocation.lat === null || !formData.agreedToPolicy)) ||
                                    (step === 3 && !formData.selectedPlan)
                                }
                            >
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleRegister} disabled={loading || !formData.paymentMethod} className="bg-emerald-600 hover:bg-emerald-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Complete Registration
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default function RetailerRegisterPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>}>
            <RetailerRegisterForm />
        </Suspense>
    )
}
