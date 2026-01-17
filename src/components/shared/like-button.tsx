'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface LikeButtonProps {
    storeId: string
    initialIsLiked?: boolean
    className?: string
}

export function LikeButton({ storeId, initialIsLiked = false, className }: LikeButtonProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const { toast } = useToast()

    // Optionally check status on mount if not passed
    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('favorite_stores')
                .select('id')
                .eq('user_id', user.id)
                .eq('store_id', storeId)
                .single()

            if (data) setIsLiked(true)
        }
        if (!initialIsLiked) checkStatus()
    }, [storeId, supabase, initialIsLiked])

    const toggleLike = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation() // Prevent navigating if inside a link card

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to like this vendor.",
                variant: "destructive"
            })
            return
        }

        setLoading(true)

        try {
            if (isLiked) {
                // Unlike
                const { error } = await (supabase
                    .from('favorite_stores') as any)
                    .delete()
                    .eq('user_id', user.id)
                    .eq('store_id', storeId)

                if (error) throw error
                setIsLiked(false)
                toast({ description: "Removed from favorites" })
            } else {
                // Like
                const { error } = await (supabase
                    .from('favorite_stores') as any)
                    .insert({ user_id: user.id, store_id: storeId })

                if (error) throw error
                setIsLiked(true)
                toast({ description: "Added to favorites" })
            }
        } catch (error) {
            console.error('Error toggling like:', error)
            toast({
                title: "Error",
                description: "Could not update favorites. Please try again.",
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleLike}
            disabled={loading}
            className={cn("rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors", className)}
        >
            <Heart
                className={cn(
                    "h-5 w-5 transition-all text-gray-400",
                    isLiked && "fill-rose-500 text-rose-500 animate-in zoom-in-50 duration-200"
                )}
            />
            <span className="sr-only">{isLiked ? 'Unlike' : 'Like'}</span>
        </Button>
    )
}
