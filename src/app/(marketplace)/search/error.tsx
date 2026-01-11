'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Search Page Error:', error)
    }, [error])

    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-red-50 p-6 rounded-full mb-6">
                <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
            <p className="text-gray-600 max-w-md mb-8">
                We encountered an error while loading the search results. This might be due to a temporary connection issue.
            </p>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Go Home
                </Button>
                <Button onClick={() => reset()} className="bg-emerald-600 hover:bg-emerald-700">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try again
                </Button>
            </div>
            {error.digest && (
                <p className="mt-8 text-xs text-gray-400 font-mono">
                    Error Digest: {error.digest}
                </p>
            )}
        </div>
    )
}
