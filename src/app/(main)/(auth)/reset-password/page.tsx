'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePassword } from '@/app/actions/auth'
import { toast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            const result = await updatePassword(password)
            if (!result.success) {
                throw new Error(result.error)
            }
            setSuccess(true)
            toast({
                title: "Password updated",
                description: "You can now log in with your new password.",
            })
            // Redirect after a delay
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md border-emerald-200 bg-emerald-50">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-emerald-900">Password Updated!</h3>
                        <p className="mb-6 text-emerald-700">
                            Your password has been successfully reset. Redirecting to login...
                        </p>
                        <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link href="/login">Go to Login</Link>
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
                    <CardTitle className="text-2xl">Set New Password</CardTitle>
                    <CardDescription>
                        Create a new password for your account.
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
                            <label className="text-sm font-medium">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
