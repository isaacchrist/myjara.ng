'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function RejectionBanner() {
    const [isRejected, setIsRejected] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const checkVerificationStatus = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user?.user_metadata?.verification_status === 'rejected') {
                setIsRejected(true)
            }
            setLoaded(true)
        }

        checkVerificationStatus()
    }, [])

    if (!loaded || !isRejected || dismissed) return null

    return (
        <div className="bg-red-600 text-white px-4 py-3 relative animate-in slide-in-from-top-2 duration-300">
            <div className="container mx-auto flex items-center justify-center gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium text-center">
                    <strong>Account Rejected:</strong> Your seller application has been rejected.
                    Please <a href="/support" className="underline font-bold">contact support</a> for more information.
                </p>
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-red-700 rounded transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
