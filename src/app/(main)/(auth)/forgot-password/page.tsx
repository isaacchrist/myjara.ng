'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { forgotPassword } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await forgotPassword(email)
            if (!result.success) {
                throw new Error(result.error)
            }
            setSubmitted(true)
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md border-emerald-200 bg-emerald-50">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-emerald-900">Check your email</h3>
                        <p className="mb-6 text-emerald-700">
                            We've sent a password reset link to <strong>{email}</strong>.
                            Please verify your inbox.
                        </p>
                        <Button asChild variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending Link...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </Button>

                        <div className="text-center">
                            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
