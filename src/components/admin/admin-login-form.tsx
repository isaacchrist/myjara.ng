'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithKey, adminUserLoginAction } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Loader2, AlertCircle, ShieldCheck, Mail, Lock } from 'lucide-react'

export function AdminLoginForm() {
    const [mode, setMode] = useState<'account' | 'key'>('account')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [key, setKey] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleAccountLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await adminUserLoginAction(email, password)
            if (result.success && result.redirect) {
                router.push(result.redirect)
            } else {
                setError(result.error || 'Invalid email or password.')
                setLoading(false)
            }
        } catch {
            setError('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    const handleKeyLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await loginWithKey(key)
            if (result.success && result.redirect) {
                router.push(result.redirect)
            } else {
                setError(result.error || 'Authentication failed. Please check your key.')
                setLoading(false)
            }
        } catch {
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
                    <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Login</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                        {mode === 'account' ? 'Sign in with your admin account.' : 'Enter the master access key.'}
                    </CardDescription>
                </CardHeader>

                <div className="flex px-8 gap-2">
                    <button
                        type="button"
                        onClick={() => { setMode('account'); setError('') }}
                        className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${mode === 'account' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('key'); setError('') }}
                        className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${mode === 'key' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Master Key
                    </button>
                </div>

                {mode === 'account' ? (
                    <form onSubmit={handleAccountLogin}>
                        <CardContent className="space-y-4 px-8 pt-4">
                            {error && (
                                <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required autoFocus />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="px-8 pb-10 pt-2">
                            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl" disabled={loading || !email || !password}>
                                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...</> : 'Sign In'}
                            </Button>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleKeyLogin}>
                        <CardContent className="space-y-6 px-8 pt-4">
                            {error && (
                                <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
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
                            <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl" disabled={loading || !key}>
                                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</> : 'Unlock Portal'}
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
            <p className="mt-8 text-sm text-gray-400 dark:text-gray-600">
                Protected by MyJara Security Shield
            </p>
        </div>
    )
}
