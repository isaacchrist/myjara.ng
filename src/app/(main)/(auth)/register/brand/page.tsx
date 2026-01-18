'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, ArrowRight, Loader2, CheckCircle2, MapPin, CreditCard, Ticket, ShoppingBag } from 'lucide-react'
import { ProfilePictureUpload } from '@/components/shared/profile-picture-upload'
import { PhoneDialpad } from '@/components/shared/phone-dialpad'
import { GeoLocationCapture } from '@/components/shared/geo-location-capture'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Brands might have different plans, but reusing for simplicity as per requirement "wholesaler accounts"
// Usually wholesalers don't pay subscription? Or do they? Assuming YES for now or just generic registration.
const SUBSCRIPTION_PLANS = [
    { id: 'standard', name: 'Brand Standard', price: 0, features: ['Unlimited Products', 'Vendor Dashboard', 'Direct Messaging'] },
    { id: 'premium', name: 'Brand Premium', price: 5000, features: ['Featured Listings', 'Priority Support', 'Analytics'] },
]

function BrandRegisterForm() {
    const router = useRouter()
    const { toast } = useToast()

    // Steps: 1=Personal, 2=Business(Location), 3=Done
    const [step, setStep] = useState<1 | 2 | 3 | 'phone_entry'>('phone_entry')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        // Personal
        fullName: '',
        email: '',
        password: '',
        phone: '',

        // Business
        businessName: '',
        businessDescription: '',
        businessLocation: {
            lat: null as number | null,
            lng: null as number | null,
            marketName: '',
            accuracy: 0
        },

        agreedToPolicy: false,
        profilePictureUrl: ''
    })

    const handleRegister = async () => {
        setLoading(true)
        setError('')

        try {
            // Prepare Payload
            const payload = {
                // Personal
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phone: formData.phone,
                dateOfBirth: '2000-01-01', // Default or ask? Wholesaler might be corporate.
                sex: 'male', // Default
                residentialAddress: 'Office Address', // Default

                // Business
                businessName: formData.businessName,
                businessDescription: formData.businessDescription,
                shopType: 'brand',

                // Location
                latitude: formData.businessLocation.lat,
                longitude: formData.businessLocation.lng,
                marketName: formData.businessLocation.marketName,
                accuracy: formData.businessLocation.accuracy,

                // Meta
                categoryId: '', // Optional for Brand?
                subcategoryId: '',
                agreedToPolicy: formData.agreedToPolicy,
                profilePictureUrl: formData.profilePictureUrl
            }

            // Call Server Action
            const { registerBrand } = await import('@/app/actions/register')
            const result = await registerBrand(payload)

            if (!result.success) {
                if (result.error?.includes('User already registered')) {
                    throw new Error('An account with this email/phone already exists.')
                }
                throw new Error(result.error || 'Registration failed')
            }

            // Success Redirect
            toast({ title: 'Application Submitted!', description: 'Your Wholesaler account is pending verification.' })
            router.push('/verification-pending')

        } catch (err: any) {
            console.error('Registration error:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handlePhoneSubmit = (phone: string) => {
        setFormData(prev => ({ ...prev, phone }))
        setStep(1)
    }

    if (step === 'phone_entry') return <PhoneDialpad title="Wholesaler Registration" subtitle="Enter your business phone number" onSubmit={handlePhoneSubmit} />

    const renderStep1 = () => (
        <div className="space-y-4 max-w-md mx-auto animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col items-center py-4">
                <label className="text-sm font-medium text-gray-700 mb-3">Logo / Profile Picture</label>
                <ProfilePictureUpload value={formData.profilePictureUrl} onChange={(url) => setFormData(prev => ({ ...prev, profilePictureUrl: url || '' }))} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Business / Brand Name</label>
                <Input value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder="My Brand Global Ltd." />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person Name</label>
                <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Manager Name" />
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
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contact@mybrand.com" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Business Description</label>
                <textarea
                    value={formData.businessDescription}
                    onChange={e => setFormData({ ...formData, businessDescription: e.target.value })}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[100px]"
                    placeholder="Describe what you supply..."
                />
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Warehouse / Office Location
                </h4>
                <GeoLocationCapture
                    initialMarket=""
                    onLocationCaptured={(data) => setFormData(prev => ({ ...prev, businessLocation: data }))}
                />
            </div>

            <div className="pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2">
                    <input type="checkbox" id="policy" checked={formData.agreedToPolicy} onChange={(e) => setFormData(p => ({ ...p, agreedToPolicy: e.target.checked }))} className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600" required />
                    <label htmlFor="policy" className="text-sm text-gray-600">
                        I agree to the <a href="#" className="text-emerald-600 underline">Wholesaler Agreement</a>.
                    </label>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-200px)] flex flex-col pt-8">
            <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Wholesaler Registration</CardTitle>
                        <CardDescription>Step {step} of 2</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><span className="font-bold">Error:</span> {error}</div>}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 bg-gray-50">
                        {step > 1 ? (
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        ) : (
                            <Button variant="outline" onClick={() => setStep('phone_entry')}>Change Number</Button>
                        )}

                        {step === 1 ? (
                            <Button onClick={() => setStep(2)} disabled={!formData.fullName || !formData.email || !formData.password}>
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleRegister} disabled={loading || !formData.agreedToPolicy || formData.businessLocation.lat === null} className="bg-emerald-600 hover:bg-emerald-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Application
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default function BrandRegisterPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>}>
            <BrandRegisterForm />
        </Suspense>
    )
}
