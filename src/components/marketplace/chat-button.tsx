"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ChatButtonProps {
    productId: string
    productName: string
    storeId: string
    className?: string
}

export function ChatButton({ productId, productName, storeId, className }: ChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient()

    const handleStartChat = async () => {
        try {
            setIsLoading(true)

            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast({
                    title: "Please sign in",
                    description: "You need to be signed in to chat with sellers.",
                    variant: "destructive",
                })
                router.push(`/login?redirect=/product/${productId}`)
                return
            }

            // Check for existing conversation for this product
            let conversationId = null

            const { data: existingConvos, error: fetchError } = await supabase
                .from('chat_conversations')
                .select('id')
                .eq('user_id', user.id)
                .eq('store_id', storeId)
                .eq('product_id', productId)
                .eq('product_id', productId)
                .single() as any

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is no rows
                console.error("Error checking conversation:", fetchError)
                throw fetchError
            }

            if (existingConvos) {
                conversationId = existingConvos.id
            } else {
                const { data: newConvo, error: createError } = await (supabase
                    .from('chat_conversations') as any)
                    .insert({
                        user_id: user.id,
                        store_id: storeId,
                        product_id: productId
                    })
                    .select('id')
                    .single() as any

                if (createError) throw createError
                conversationId = newConvo.id

                // Send creating message "Starting chat about..."
                await (supabase.from('chat_messages') as any).insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    sender_type: 'customer',
                    message: `Hi, I have a question about ${productName}.`,
                    is_read: false
                })
            }

            // Redirect to chat page (assuming we have one, or open a drawer?)
            // For now, let's assume we have a customer chat page.
            // But we haven't built the customer chat interface yet! 
            // The plan says "Customer view: 'Chat about this product' button".
            // We should redirect to `/account/chat/${conversationId}` or similar.
            // But we don't have that page. 
            // Let's create a Chat Interface. 
            // For now, let's redirect to `/chat/${conversationId}` which we will build next.
            router.push(`/chat/${conversationId}`)

        } catch (error) {
            console.error("Error starting chat:", error)
            toast({
                title: "Error",
                description: "Failed to start conversation. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button onClick={handleStartChat} disabled={isLoading} className={className}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {isLoading ? "Starting..." : "Chat with Seller"}
        </Button>
    )
}
