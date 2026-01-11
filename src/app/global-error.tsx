'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global Error:', error)
    }, [error])

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-gray-50">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                    <p className="text-red-500 font-mono text-sm bg-white p-4 rounded shadow mb-4">
                        {error.message || 'Unknown Error'}
                    </p>
                    <p className="text-gray-500 text-xs mb-8">
                        Digest: {error.digest}
                    </p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
