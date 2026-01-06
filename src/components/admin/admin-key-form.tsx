'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithKey } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'

interface AdminKeyFormProps {
    expectedSlug?: string
    title?: string
    description?: string
}

export function AdminKeyForm({
    expectedSlug,
    title = "Secure Access",
    description = "Enter your secret access key to continue."
}: AdminKeyFormProps) {
    const [key, setKey] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await loginWithKey(key, expectedSlug)
            if (result.success && result.redirect) {
                router.push(result.redirect)
            } else {
                setError(result.error || 'Authentication failed. Please check your key.')
                setLoading(false)
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                <CardHeader className="text-center space-y-2 pt-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 mb-2 transform transition-transform hover:scale-110">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                        {description}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 px-8">
                        {error && (
                            <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="font-medium">{error}</p>
                            </div>
                        )}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">
                                Access Key
                            </label>
                            <div className="relative group">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="pl-10 text-center font-mono tracking-[0.3em] h-12 border-gray-200 dark:border-gray-800 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-950"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-10">
                        <Button
                            type="submit"
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                            disabled={loading || !key}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying Access...</>
                            ) : (
                                'Unlock Portal'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <p className="mt-8 text-sm text-gray-400 dark:text-gray-600 flex items-center gap-2">
                Protected by MyJara Security Shield
            </p>
        </div>
    )
}
