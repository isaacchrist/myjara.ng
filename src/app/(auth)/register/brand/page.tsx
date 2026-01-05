'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, User, Mail, Lock, ArrowRight, Loader2, CheckCircle2, MapPin, Calendar, ShoppingBag, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

export default function BrandRegisterPage() {
    const router = useRouter()
    // Steps: 1=Role, 2=Account/Personal, 3=Business/KYC, 4=Store(Wholesaler only)
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [role, setRole] = useState<'brand_admin' | 'retailer'>('brand_admin') // brand_admin = Wholesaler

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        dateOfBirth: '',
        residentialAddress: '',

        // Business / KYC
        businessAddress: '',
        hasPhysicalStore: 'no', // yes/no
        productRange: '', // Comma separated
        isMultiCategory: false,

        // Store (Wholesaler only)
        storeName: '',
        storeSlug: '',
        storeDescription: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => {
            const newData = { ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }

            if (name === 'storeName') {
                newData.storeSlug = slugify(value)
            }
            return newData
        })
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, storeSlug: slugify(e.target.value) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()

            // Prepare Metadata
            const metaData: any = {
                full_name: formData.fullName,
                role: role,
                date_of_birth: formData.dateOfBirth,
                residential_address: formData.residentialAddress,
                business_address: formData.businessAddress,
                has_physical_store: formData.hasPhysicalStore === 'yes',
                product_range: formData.productRange.split(',').map(s => s.trim()).filter(Boolean),
                is_multi_category: formData.isMultiCategory
            }

            // Add Store Data if Wholesaler
            if (role === 'brand_admin') {
                metaData.store_name = formData.storeName
                metaData.store_slug = formData.storeSlug
                metaData.store_description = formData.storeDescription
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: metaData,
                },
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('Failed to create user account')

            // Redirect based on outcome
            if (role === 'brand_admin') {
                router.push('/verification-pending')
            } else {
                // Retailers might go straight to dashboard or homepage? 
                // Assuming they also need verification or just welcome.
                // For now, send them to dashboard too (as a buyer/retailer view) or verification pending if verification applies to them too.
                // User said "1 day verification wait" - implies for everyone? Or just wholesalers?
                // "stores should be only created by wholesalers... and they should be able to see their profile... wait for confirmation"
                // Assuming Wholesalers need verification. Retailers might be instant?
                // Let's send everyone to verification pending for safety based on the strict requirements.
                router.push('/verification-pending')
            }

        } catch (err) {
            console.error(err)
            if (err instanceof Error && err.message.includes('stores_slug_key')) {
                setError('This Store URL is already taken. Please choose another.')
            } else {
                setError(err instanceof Error ? err.message : 'Something went wrong')
            }
            setLoading(false)
        }
    }

    const nextStep = () => {
        if (step === 1) {
            setStep(2)
        } else if (step === 2) {
            if (formData.email && formData.password && formData.fullName && formData.dateOfBirth) setStep(3)
            else setError("Please fill in all personal details")
        } else if (step === 3) {
            if (formData.businessAddress) {
                // Skip step 4 if Retailer
                if (role === 'retailer') {
                    // Submit? No, let's just show the submit button on step 3 for retailers.
                    // Handled in render.
                } else {
                    setStep(4)
                }
            } else setError("Please fill in business details")
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
            <div className="w-full max-w-xl space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Create your <span className="text-emerald-600">MyJara</span> Account
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Join as a Wholesaler or Retailer.
                    </p>
                </div>

                <Card className="border-emerald-100 shadow-xl">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <CardTitle className="text-xl">
                                    {step === 1 && 'Select User Role'}
                                    {step === 2 && 'Personal Details'}
                                    {step === 3 && 'Business Profile'}
                                    {step === 4 && 'Store Details'}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    Step <span className="font-bold text-emerald-600">{step}</span> of {role === 'retailer' ? 3 : 4}
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${(step / (role === 'retailer' ? 3 : 4)) * 100}%` }}
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Step 1: Role Selection */}
                            {step === 1 && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div
                                        className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${role === 'brand_admin' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-emerald-200'}`}
                                        onClick={() => setRole('brand_admin')}
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                            <Store className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Wholesaler</h3>
                                        <p className="mt-1 text-sm text-gray-500">I want to create a store and sell products in bulk.</p>
                                    </div>

                                    <div
                                        className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${role === 'retailer' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-emerald-200'}`}
                                        onClick={() => setRole('retailer')}
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                            <ShoppingBag className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Retailer</h3>
                                        <p className="mt-1 text-sm text-gray-500">I want to buy products for my business.</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Personal Details */}
                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input name="fullName" value={formData.fullName} onChange={handleChange} className="pl-10" required placeholder="John Doe" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input name="email" type="email" value={formData.email} onChange={handleChange} className="pl-10" required placeholder="john@example.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input name="password" type="password" value={formData.password} onChange={handleChange} className="pl-10" required placeholder="••••••••" minLength={8} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className="pl-10" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Residential Address</label>
                                        <textarea name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[80px]" required placeholder="Your home address" />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Business/KYC Details */}
                            {step === 3 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Business Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <textarea name="businessAddress" value={formData.businessAddress} onChange={handleChange} className="w-full rounded-md border border-input pl-10 px-3 py-2 text-sm min-h-[80px]" required placeholder="Your business location" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Do you have a physical store?</label>
                                        <select name="hasPhysicalStore" value={formData.hasPhysicalStore} onChange={handleChange} className="w-full rounded-md border border-input px-3 py-2 text-sm bg-white">
                                            <option value="no">No, Online Only</option>
                                            <option value="yes">Yes, I have a physical location</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Product Range (Categories)</label>
                                        <Input name="productRange" value={formData.productRange} onChange={handleChange} placeholder="e.g. Grains, Spices, Textiles" required />
                                        <p className="text-xs text-gray-500">Separate with commas</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="multi" name="isMultiCategory" checked={formData.isMultiCategory} onChange={handleChange} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-600" />
                                        <label htmlFor="multi" className="text-sm font-medium text-gray-700">I sell multiple categories of goods</label>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Store Details (Wholesaler Only) */}
                            {step === 4 && role === 'brand_admin' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Store Name</label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input name="storeName" value={formData.storeName} onChange={handleChange} className="pl-10" required placeholder="My Awesome Store" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Store URL</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">myjara.com/store/</span>
                                            <Input name="storeSlug" value={formData.storeSlug} onChange={handleSlugChange} className="font-mono text-sm" required placeholder="my-store" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Short Description</label>
                                        <textarea name="storeDescription" value={formData.storeDescription} onChange={handleChange} className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[80px]" placeholder="Briefly describe your store..." />
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            {step > 1 && (
                                <Button type="button" variant="ghost" onClick={() => setStep(prev => (prev - 1) as any)} disabled={loading}>
                                    Back
                                </Button>
                            )}

                            {(step === 4 || (step === 3 && role === 'retailer')) ? (
                                <Button type="submit" className="ml-auto bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                                    ) : (
                                        <>Submit Application <CheckCircle2 className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            ) : (
                                <Button type="button" className="ml-auto" onClick={nextStep}>
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-sm text-gray-500">
                    Already have an account? <Link href="/login" className="font-medium text-emerald-600 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
