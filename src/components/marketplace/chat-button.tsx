"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MessageCircle } from "lucide-react"
import { ChatWindow } from "@/components/chat/chat-window"
import { getOrCreateChatRoomAction } from "@/app/actions/chat"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ChatButtonProps {
    storeId: string
    storeName: string
    productId?: string
    productName?: string
    className?: string
}

export function ChatButton({ storeId, storeName, productId, productName, className }: ChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [roomId, setRoomId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const handleOpen = async () => {
        setIsLoading(true)

        // Check Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast({
                title: "Login Required",
                description: "Please login to chat with the store.",
            })
            router.push(`/login?redirect=/product/${productId}`) // Simplified redirect
            setIsLoading(false)
            return
        }
        setUserId(user.id)

        // Init Chat
        const result = await getOrCreateChatRoomAction(storeId)
        if (result.error || !result.data) {
            toast({
                title: "Error",
                description: "Could not start chat session.",
                variant: 'destructive'
            })
        } else {
            setRoomId(result.data.id)
            setIsOpen(true)
        }
        setIsLoading(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    className={className}
                    onClick={(e) => {
                        e.preventDefault() // Prevent Nav if wrapped in Link
                        handleOpen()
                    }}
                    disabled={isLoading}
                >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat with Seller
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 sm:max-w-md w-full">
                {roomId && userId ? (
                    <div className="h-full pt-10"> {/* pt-10 to account for close button overlapping */}
                        <ChatWindow
                            roomId={roomId}
                            currentUserId={userId}
                            recipientName={storeName}
                            className="h-full border-none shadow-none"
                        />
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        Loading chat...
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
