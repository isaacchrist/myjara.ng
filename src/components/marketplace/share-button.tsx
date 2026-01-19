'use client'

import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareButtonProps {
    title: string
    text: string
}

export function ShareButton({ title, text }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const url = window.location.href

        // Try Native Share API first (Mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url
                })
                return
            } catch (err) {
                // Ignore abort errors
            }
        }

        // Fallback to Clipboard
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success('Link copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Failed to copy link')
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied' : 'Share'}
        </Button>
    )
}
