'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, User, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import type { InsertTables } from '@/types/database'

export default function BrandRegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        storeName: '',
        storeSlug: '',
        storeDescription: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => {
            const newData = { ...prev, [name]: value }
            // Auto-generate slug from store name
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

            // 1. Sign Up User AND Create Store (Atomic via Trigger)
            // We pass store details in metadata so the database trigger can create the store record immediately.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'brand_admin',
                        // Pass store details for the trigger
                        store_name: formData.storeName,
                        store_slug: formData.storeSlug,
                        store_description: formData.storeDescription,
                    },
                },
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('Failed to create user account')

            // Store is created automatically by the database trigger now.
            // No need for a separate insert call which might fail RLS if email isn't confirmed.

            // Success!
            router.push('/dashboard?welcome=true')

        } catch (err) {
            console.error(err)
            // Handle unique violation errors that might come from the trigger (e.g. duplicate slug)
            if (err instanceof Error && err.message.includes('stores_slug_key')) {
                setError('This Store URL is already taken. Please choose another.')
            } else {
                setError(err instanceof Error ? err.message : 'Something went wrong')
            }
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Start Selling on <span className="text-emerald-600">MyJara</span>
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Create your Wholesaler or Retailer account and reach millions of customers.
                    </p>
                </div>

                <Card className="border-emerald-100 shadow-xl">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">
                                    {step === 1 ? 'Account Details' : 'Store Profile'}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className={step === 1 ? 'font-bold text-emerald-600' : ''}>1</span>
                                    <div className="h-px w-8 bg-gray-200" />
                                    <span className={step === 2 ? 'font-bold text-emerald-600' : ''}>2</span>
                                </div>
                            </div>
                            <CardDescription className="dark:text-gray-400">
                                {step === 1
                                    ? 'First, let\'s create your seller account.'
                                    : 'Now, tell us about your business.'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                name="fullName"
                                                placeholder="John Doe"
                                                className="pl-10"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                name="email"
                                                type="email"
                                                placeholder="partner@myjara.com"
                                                className="pl-10"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                name="password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Must be at least 8 characters long
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
                                            Store or Business Name
                                        </label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                name="storeName"
                                                placeholder="My Awesome Brand"
                                                className="pl-10"
                                                value={formData.storeName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Store URL
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">myjara.com/store/</span>
                                            <Input
                                                name="storeSlug"
                                                placeholder="my-awesome-brand"
                                                value={formData.storeSlug}
                                                onChange={handleSlugChange}
                                                className="font-mono text-sm"
                                                required
                                            />
                                        </div>
                                        {formData.storeSlug && (
                                            <p className="flex items-center gap-1 text-xs text-emerald-600">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Valid URL format
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Short Description
                                        </label>
                                        <textarea
                                            name="storeDescription"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="What do you sell? (e.g., Authentic Nigerian spices and grains)"
                                            value={formData.storeDescription}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-between">
                            {step === 2 ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating Store...
                                            </>
                                        ) : (
                                            <>
                                                Create Store <Store className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    className="ml-auto w-full md:w-auto"
                                    onClick={() => {
                                        if (formData.email && formData.password && formData.fullName) {
                                            setStep(2)
                                        } else {
                                            setError("Please fill in all fields")
                                        }
                                    }}
                                >
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-sm text-gray-500">
                    Already have a seller account?{' '}
                    <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
