"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getOrCreateChatRoomAction } from "@/app/actions/chat"

interface ContactSellerButtonProps {
    storeId: string
    storeName: string
    className?: string
}

export function ContactSellerButton({ storeId, storeName, className }: ContactSellerButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleContact = async () => {
        setIsLoading(true)
        try {
            const result = await getOrCreateChatRoomAction(storeId)

            if (result.error) {
                if (result.error === "Unauthorized") {
                    router.push("/login")
                    return
                }
                throw new Error(result.error)
            }

            if (result.data) {
                router.push(`/chat/${result.data.id}`)
            }
        } catch (error) {
            console.error("Error starting chat:", error)
            toast({
                title: "Error",
                description: "Failed to start chat with seller. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleContact}
            className={`w-full bg-emerald-600 hover:bg-emerald-700 ${className}`}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <MessageCircle className="mr-2 h-4 w-4" />
            )}
            Contact Seller
        </Button>
    )
}
