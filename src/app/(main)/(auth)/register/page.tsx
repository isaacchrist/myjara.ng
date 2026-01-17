'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
    const router = useRouter()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (error) throw error

            router.push('/login?message=Check your email to confirm your account')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                    <CardDescription>
                        Join MyJara and start enjoying extra with every purchase
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                At least 6 characters
                            </p>
                        </div>

                        <div className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1 rounded border-gray-300" required />
                            <span className="text-sm text-gray-600">
                                I agree to the{' '}
                                <Link href="/terms" className="text-emerald-600 hover:underline">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="text-emerald-600 hover:underline">
                                    Privacy Policy
                                </Link>
                            </span>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                            Sign in
                        </Link>
                    </div>

                    <div className="mt-4 text-center">
                        <Link
                            href="/register/brand"
                            className="text-sm text-gray-500 underline hover:text-emerald-600"
                        >
                            Want to sell? Create a brand account instead
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
