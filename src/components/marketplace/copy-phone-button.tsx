'use client'

import { useState } from 'react'
import { Phone, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyPhoneButtonProps {
    phone: string
}

export function CopyPhoneButton({ phone }: CopyPhoneButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(phone)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <Button
            onClick={handleCopy}
            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-6 rounded-xl shadow-lg transition-all hover:shadow-xl"
            size="lg"
        >
            <Phone className="h-5 w-5" />
            <span className="font-mono font-bold text-lg">{phone}</span>
            {copied ? (
                <Check className="h-5 w-5 text-emerald-200" />
            ) : (
                <Copy className="h-5 w-5 text-emerald-200" />
            )}
        </Button>
    )
}
