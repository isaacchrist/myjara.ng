'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, MapPin } from 'lucide-react'
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

const ORDER_VOLUME_BRACKETS = ['Under 50/mo', '50-200/mo', '200-500/mo', '500+/mo']

function BrandRegisterForm() {
    const router = useRouter()
    const { toast } = useToast()

    // Steps: 1=Personal, 2=Legal & Business Identity, 3=Trading Profile & Banking, 4=Business Details & Location, 5=Done
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 'phone_entry'>('phone_entry')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [onboarding, setOnboarding] = useState<{ slug: string; tag?: string } | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        // Personal
        fullName: '',
        email: '',
        password: '',
        phone: '', // personal contact phone
        sex: '' as 'male' | 'female' | '',
        dateOfBirth: '',
        residentialAddress: '',

        // Business identity
        businessName: '', // storefront/trading name
        legalName: '', // CAC-registered legal name, if different
        registrationType: '' as 'business_name' | 'limited_company' | '',
        rcNumber: '',
        cacUrl: [] as string[],
        taxIdNumber: '',
        nafdacNumber: '',
        signatoryName: '',
        signatoryRole: '',

        // Trading profile
        businessPhone: '',
        salesModel: '' as 'b2b' | 'b2c' | 'both' | '',
        expectedOrderVolume: '',
        minimumOrderQuantity: '',
        offersDelivery: '' as 'delivery' | 'pickup_only' | 'both' | '',
        deliveryCoverageArea: '',
        paymentTerms: '',
        yearsInBusiness: '',
        catalogUrl: [] as string[],
        bankName: '',
        accountNumber: '',
        accountName: '',

        // Business details & location
        businessDescription: '',
        businessLocation: {
            lat: null as number | null,
            lng: null as number | null,
            accuracy: 0
        },
        categories: [] as string[],
        agreedToPolicy: false,
        profilePictureUrl: '',
        storeImages: [] as string[]
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
                cacUrl: formData.cacUrl?.[0] || '', // Pick first or empty
                storeImages: formData.storeImages,

                // Business-legitimacy & trading profile
                businessPhone: formData.businessPhone,
                rcNumber: formData.rcNumber,
                taxIdNumber: formData.taxIdNumber,
                signatoryName: formData.signatoryName,
                signatoryRole: formData.signatoryRole,
                legalName: formData.legalName,
                registrationType: formData.registrationType || undefined,
                nafdacNumber: formData.nafdacNumber,
                salesModel: formData.salesModel || undefined,
                expectedOrderVolume: formData.expectedOrderVolume,
                minimumOrderQuantity: formData.minimumOrderQuantity,
                offersDelivery: formData.offersDelivery || undefined,
                deliveryCoverageArea: formData.deliveryCoverageArea,
                paymentTerms: formData.paymentTerms,
                yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : null,
                catalogUrl: formData.catalogUrl?.[0] || '',
                bankName: formData.bankName,
                accountNumber: formData.accountNumber,
                accountName: formData.accountName,
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

    if (step === 'phone_entry') return <PhoneDialpad title="Wholesaler Registration" subtitle="Enter your personal phone number" onSubmit={handlePhoneSubmit} />

    const registrationNumberLabel = formData.registrationType === 'business_name'
        ? 'Business Name (BN) Number'
        : formData.registrationType === 'limited_company'
            ? 'RC Number'
            : 'CAC Registration Number (BN or RC)'

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
                <label className="text-sm font-medium">Your Personal Phone Number</label>
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
                <label className="text-sm font-medium">Contact Person&apos;s Sex</label>
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
                <label className="text-sm font-medium">Contact Person&apos;s Date of Birth</label>
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
        <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Legal Registered Business Name</label>
                <p className="text-xs text-gray-500 mb-1">As it appears on your CAC certificate, if different from your brand name.</p>
                <Input value={formData.legalName} onChange={e => setFormData(prev => ({ ...prev, legalName: e.target.value }))} placeholder="e.g. My Brand Global Nigeria Limited" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Registration Type</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="registrationType" checked={formData.registrationType === 'business_name'} onChange={() => setFormData(prev => ({ ...prev, registrationType: 'business_name' }))} className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Business Name (BN)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="registrationType" checked={formData.registrationType === 'limited_company'} onChange={() => setFormData(prev => ({ ...prev, registrationType: 'limited_company' }))} className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Limited Company (RC)</span>
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">{registrationNumberLabel}</label>
                <Input value={formData.rcNumber} onChange={e => setFormData(prev => ({ ...prev, rcNumber: e.target.value }))} placeholder="e.g. BN1234567 or RC1234567" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">CAC Certificate</label>
                <p className="text-xs text-gray-500 mb-2">Upload your CAC certificate for business verification (photo or PDF).</p>
                <ImageUpload
                    value={formData.cacUrl}
                    onChange={(urls) => setFormData(prev => ({ ...prev, cacUrl: urls }))}
                    maxFiles={1}
                    bucket="product-images"
                    accept="image/*,application/pdf"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Tax Identification Number (TIN)</label>
                <Input value={formData.taxIdNumber} onChange={e => setFormData(prev => ({ ...prev, taxIdNumber: e.target.value }))} placeholder="e.g. 12345678-0001" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">NAFDAC Number <span className="text-gray-400 font-normal">(optional)</span></label>
                <p className="text-xs text-gray-500 mb-1">If you sell food, drugs, or cosmetics.</p>
                <Input value={formData.nafdacNumber} onChange={e => setFormData(prev => ({ ...prev, nafdacNumber: e.target.value }))} placeholder="e.g. 01-1234" />
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3">Authorized Signatory</h4>
                <p className="text-xs text-gray-500 mb-3">Who is authorized to sign for this business?</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={formData.signatoryName} onChange={e => setFormData(prev => ({ ...prev, signatoryName: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role / Position</label>
                        <Input value={formData.signatoryRole} onChange={e => setFormData(prev => ({ ...prev, signatoryRole: e.target.value }))} placeholder="e.g. Director, CEO" />
                    </div>
                </div>
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Business Phone Number</label>
                <p className="text-xs text-gray-500 mb-1">Shown to customers — can be different from your personal number.</p>
                <Input type="tel" value={formData.businessPhone} onChange={e => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))} placeholder="08012345678" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Who Do You Sell To?</label>
                <div className="flex gap-4 flex-wrap">
                    {(['b2b', 'b2c', 'both'] as const).map(v => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="salesModel" checked={formData.salesModel === v} onChange={() => setFormData(prev => ({ ...prev, salesModel: v }))} className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm">{v === 'b2b' ? 'Other Businesses (B2B)' : v === 'b2c' ? 'Direct to Consumers (B2C)' : 'Both'}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Expected Monthly Order Volume <span className="text-gray-400 font-normal">(optional)</span></label>
                <select
                    value={formData.expectedOrderVolume}
                    onChange={e => setFormData(prev => ({ ...prev, expectedOrderVolume: e.target.value }))}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm bg-white"
                >
                    <option value="">Select a range</option>
                    {ORDER_VOLUME_BRACKETS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Order Quantity <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input value={formData.minimumOrderQuantity} onChange={e => setFormData(prev => ({ ...prev, minimumOrderQuantity: e.target.value }))} placeholder="e.g. 50 units, 1 carton" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Capability <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="flex gap-4 flex-wrap">
                    {(['delivery', 'pickup_only', 'both'] as const).map(v => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="offersDelivery" checked={formData.offersDelivery === v} onChange={() => setFormData(prev => ({ ...prev, offersDelivery: v }))} className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm">{v === 'delivery' ? 'We Deliver' : v === 'pickup_only' ? 'Pickup Only' : 'Both'}</span>
                        </label>
                    ))}
                </div>
            </div>

            {formData.offersDelivery && formData.offersDelivery !== 'pickup_only' && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Delivery Coverage Area <span className="text-gray-400 font-normal">(optional)</span></label>
                    <Input value={formData.deliveryCoverageArea} onChange={e => setFormData(prev => ({ ...prev, deliveryCoverageArea: e.target.value }))} placeholder="e.g. Abuja and surrounding LGAs" />
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium">Payment Terms You Offer <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input value={formData.paymentTerms} onChange={e => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))} placeholder="e.g. COD, Net-30, Prepayment" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Years in Business <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input type="number" min="0" value={formData.yearsInBusiness} onChange={e => setFormData(prev => ({ ...prev, yearsInBusiness: e.target.value }))} placeholder="e.g. 5" />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Product Catalog / Price List <span className="text-gray-400 font-normal">(optional)</span></label>
                <ImageUpload
                    value={formData.catalogUrl}
                    onChange={(urls) => setFormData(prev => ({ ...prev, catalogUrl: urls }))}
                    maxFiles={1}
                    bucket="product-images"
                    accept="image/*,application/pdf"
                />
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-1">Settlement Account <span className="text-gray-400 font-normal text-sm">(optional)</span></h4>
                <p className="text-xs text-gray-500 mb-3">For receiving payouts once approved. Can also be added later from your dashboard.</p>
                <div className="space-y-3">
                    <Input value={formData.bankName} onChange={e => setFormData(prev => ({ ...prev, bankName: e.target.value }))} placeholder="Bank Name" />
                    <Input value={formData.accountNumber} onChange={e => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))} placeholder="Account Number" />
                    <Input value={formData.accountName} onChange={e => setFormData(prev => ({ ...prev, accountName: e.target.value }))} placeholder="Account Name" />
                </div>
            </div>
        </div>
    )

    const renderStep4 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
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

    const progress = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100

    return (
        <div className="min-h-[calc(100vh-200px)] flex flex-col pt-8">
            <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 max-w-xl mx-auto">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
                        <span className={typeof step === 'number' && step >= 1 ? 'text-emerald-600' : ''}>Personal</span>
                        <span className={typeof step === 'number' && step >= 2 ? 'text-emerald-600' : ''}>Legal Identity</span>
                        <span className={typeof step === 'number' && step >= 3 ? 'text-emerald-600' : ''}>Trading Profile</span>
                        <span className={typeof step === 'number' && step >= 4 ? 'text-emerald-600' : ''}>Location</span>
                    </div>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {step === 1 && 'Personal Details'}
                            {step === 2 && 'Legal & Business Identity'}
                            {step === 3 && 'Trading Profile & Banking'}
                            {step === 4 && 'Business Details & Location'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && 'Tell us a bit about yourself'}
                            {step === 2 && 'Help us verify your business is legally registered'}
                            {step === 3 && 'How your business trades, and where to pay you'}
                            {step === 4 && 'Verify your business location'}
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
                            <Button variant="outline" onClick={() => setStep('phone_entry')}>Back</Button>
                        )}

                        {step < 4 ? (
                            <Button
                                onClick={() => setStep(prev => typeof prev === 'number' ? (prev + 1) as any : prev)}
                                disabled={
                                    (step === 1 && (!formData.fullName || !formData.businessName || !formData.email || !formData.password || !formData.sex || !formData.dateOfBirth || !formData.residentialAddress)) ||
                                    (step === 2 && (!formData.registrationType || !formData.rcNumber || formData.cacUrl.length === 0 || !formData.taxIdNumber || !formData.signatoryName || !formData.signatoryRole)) ||
                                    (step === 3 && (!formData.businessPhone || !formData.salesModel))
                                }
                            >
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
