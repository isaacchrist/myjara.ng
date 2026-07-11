'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, ArrowRight, Loader2, CheckCircle2, MapPin, CreditCard, Ticket, ShoppingBag } from 'lucide-react'
import { ProfilePictureUpload } from '@/components/shared/profile-picture-upload'
import { ImageUpload } from '@/components/ui/image-upload'
import { PhoneDialpad } from '@/components/shared/phone-dialpad'
import { GeoLocationCapture } from '@/components/shared/geo-location-capture'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { BrandOnboardingDialog } from './onboarding-dialog'

function BrandRegisterForm() {
    const router = useRouter()
    const { toast } = useToast()

    // Steps: 1=Personal, 2=Business(Location), 3=Done
    const [step, setStep] = useState<1 | 2 | 3 | 'phone_entry'>('phone_entry')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [onboarding, setOnboarding] = useState<{ slug: string; tag?: string } | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        // Personal
        fullName: '',
        email: '',
        password: '',
        phone: '',
        sex: '' as 'male' | 'female' | '',
        dateOfBirth: '',
        residentialAddress: '',

        // Business
        businessName: '',
        businessDescription: '',
        businessLocation: {
            lat: null as number | null,
            lng: null as number | null,
            accuracy: 0
        },
        categories: [] as string[],

        agreedToPolicy: false,
        profilePictureUrl: '',

        cacUrl: [] as string[], // New
        storeImages: [] as string[] // Gallery
    })

    const [categoryTree, setCategoryTree] = useState<{ id: string; name: string; icon: string | null; subcategories: { id: string; name: string }[] }[]>([])

    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient()
            const { data: allCategories } = await supabase
                .from('categories')
                .select('id, name, icon, parent_id')
                .order('sort_order') as any
            const parents = (allCategories || []).filter((c: any) => !c.parent_id)
            setCategoryTree(parents.map((p: any) => ({
                id: p.id,
                name: p.name,
                icon: p.icon,
                subcategories: (allCategories || []).filter((c: any) => c.parent_id === p.id).map((c: any) => ({ id: c.id, name: c.name })),
            })))
        }
        fetchCategories()
    }, [])

    const toggleCategory = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(categoryId)
                ? prev.categories.filter(id => id !== categoryId)
                : [...prev.categories, categoryId]
        }))
    }

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
                dateOfBirth: formData.dateOfBirth,
                sex: formData.sex,
                residentialAddress: formData.residentialAddress,

                // Business
                businessName: formData.businessName,
                businessDescription: formData.businessDescription,
                shopType: 'brand',

                // Location
                latitude: formData.businessLocation.lat,
                longitude: formData.businessLocation.lng,
                marketName: '', // Wholesalers don't attend markets
                accuracy: formData.businessLocation.accuracy,

                // Meta
                categories: formData.categories,
                categoryId: '',
                subcategoryId: '',
                agreedToPolicy: formData.agreedToPolicy,
                profilePictureUrl: formData.profilePictureUrl,
                cacUrl: formData.cacUrl?.[0] || '' // Pick first or empty
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

            // Sign the new account in so the dashboard/store tabs opened from the
            // onboarding dialog actually work (registerBrand creates the auth user
            // server-side via the admin API, which doesn't establish a session).
            const supabase = createClient()
            await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password })

            toast({ title: 'Application Submitted!', description: 'Your Wholesaler account is pending verification.' })
            setOnboarding({ slug: result.slug || '', tag: result.tag })

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
                <Input name="businessName" value={formData.businessName} onChange={e => setFormData(prev => ({ ...prev, businessName: e.target.value }))} placeholder="My Brand Global Ltd." />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person Name</label>
                <Input name="fullName" value={formData.fullName} onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Manager Name" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input name="phone" type="tel" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="08012345678" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input name="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="contact@mybrand.com" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input name="password" type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person's Sex</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="sex" value="male" checked={formData.sex === 'male'} onChange={() => setFormData(prev => ({ ...prev, sex: 'male' }))} className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="sex" value="female" checked={formData.sex === 'female'} onChange={() => setFormData(prev => ({ ...prev, sex: 'female' }))} className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Female</span>
                    </label>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person's Date of Birth</label>
                <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Residential Address</label>
                <textarea
                    value={formData.residentialAddress}
                    onChange={e => setFormData(prev => ({ ...prev, residentialAddress: e.target.value }))}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Contact person's home address"
                />
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">CAC Certification</label>
                <p className="text-xs text-gray-500 mb-2">Upload your CAC certificate for business verification.</p>
                <ImageUpload
                    value={formData.cacUrl}
                    onChange={(urls) => setFormData(prev => ({ ...prev, cacUrl: urls }))}
                    maxFiles={1}
                    bucket="product-images"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Warehouse / Office Photos (Optional)</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 mb-3">Add photos of your warehouse, office, or products. These will be shown on your profile.</p>
                    <ImageUpload
                        value={formData.storeImages}
                        onChange={(urls) => setFormData(prev => ({ ...prev, storeImages: urls }))}
                        maxFiles={5}
                        bucket="store-images"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Business Description</label>
                <textarea
                    value={formData.businessDescription}
                    onChange={e => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[100px]"
                    placeholder="Describe what you supply..."
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Product Categories</label>
                <p className="text-xs text-gray-500 mb-2">Select the categories you supply ({formData.categories.length} selected)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {categoryTree.map(category => {
                        const isSelected = formData.categories.includes(category.id)
                        return (
                            <div key={category.id} className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category.id)}
                                    className={`w-full flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'
                                        }`}
                                >
                                    <span className="text-xl mb-1">{category.icon}</span>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>{category.name}</span>
                                </button>
                                {isSelected && category.subcategories.length > 0 && (
                                    <div className="pl-2 space-y-1">
                                        {category.subcategories.map(sub => {
                                            const isSubSelected = formData.categories.includes(sub.id)
                                            return (
                                                <button
                                                    type="button"
                                                    key={sub.id}
                                                    onClick={() => toggleCategory(sub.id)}
                                                    className={`w-full text-left text-[11px] px-2 py-1 rounded-md ${isSubSelected ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-gray-500 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {sub.name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Warehouse / Office Location
                </h4>
                <p className="text-sm text-gray-500 mb-3">Capture your warehouse or main office location.</p>
                <GeoLocationCapture
                    initialMarket="" // No market for wholesalers
                    hideMarketSelector={true}
                    onLocationCaptured={(data) => setFormData(prev => ({ ...prev, businessLocation: { lat: data.lat, lng: data.lng, accuracy: data.accuracy } }))}
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
                            <Button variant="outline" onClick={() => setStep('phone_entry')}>Back</Button>
                        )}

                        {step === 1 ? (
                            <Button onClick={() => setStep(2)} disabled={!formData.fullName || !formData.email || !formData.password || !formData.sex || !formData.dateOfBirth || !formData.residentialAddress}>
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

            {onboarding && (
                <BrandOnboardingDialog
                    open={!!onboarding}
                    slug={onboarding.slug}
                    onDone={() => router.push(onboarding.tag ? `/verification-pending?tag=${encodeURIComponent(onboarding.tag)}` : '/verification-pending')}
                />
            )}
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
