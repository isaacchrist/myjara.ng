'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithKey } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Loader2, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
    const [key, setKey] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await loginWithKey(key)
            if (result.success && result.redirect) {
                router.push(result.redirect)
            } else {
                setError(result.error || 'Authentication failed')
                setLoading(false)
            }
        } catch (err) {
            setError('An unexpected error occurred')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <Card className="w-full max-w-md border-emerald-100 shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                        <Key className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-emerald-950">System Access</CardTitle>
                    <CardDescription>
                        Enter your secure access key to continue.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="sk_live_..."
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="text-center font-mono tracking-widest"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            disabled={loading || !key}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                            ) : (
                                'Authenticate'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
