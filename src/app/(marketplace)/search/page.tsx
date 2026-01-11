'use client'

import { Suspense } from 'react'
import Link from 'next/link'

export default function SearchPage() {
    return (
        <div className="min-h-screen p-8 bg-white">
            <h1 className="text-2xl font-bold mb-4">Search Page Diagnostic Mode</h1>
            <p className="mb-4">If you can see this, the Page Component crash is resolved.</p>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
                Status: <strong>Operational</strong>
            </div>
            <Link href="/" className="block mt-8 text-blue-600 underline">
                Back to Home
            </Link>
        </div>
    )
}
