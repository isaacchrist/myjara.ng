"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { getMessagesAction, sendMessageAction, markMessagesReadAction } from "@/app/actions/chat"
import { formatDistanceToNow } from "date-fns"

interface ChatWindowProps {
    roomId: string
    currentUserId: string
    recipientName: string
    className?: string
}

export function ChatWindow({ roomId, currentUserId, recipientName, className }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // 1. Initial Fetch
    useEffect(() => {
        const fetchMessages = async () => {
            const data = await getMessagesAction(roomId)
            setMessages(data || [])
            setIsLoading(false)
            markMessagesReadAction(roomId)
        }
        fetchMessages()
    }, [roomId])

    // 2. Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel(`chat:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const newMsg = payload.new
                    setMessages((prev) => [...prev, newMsg])
                    if (newMsg.sender_id !== currentUserId) {
                        markMessagesReadAction(roomId)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, currentUserId, supabase])

    // 3. Auto Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() || isSending) return

        const content = newMessage
        setNewMessage("") // Optimistic clear
        setIsSending(true)

        // Optimistic UI update (optional, but good for UX)
        // const tempId = Math.random().toString()
        // setMessages(prev => [...prev, {id: tempId, content, sender_id: currentUserId, created_at: new Date().toISOString(), is_temp: true}])

        const result = await sendMessageAction(roomId, content)
        if (result.error) {
            // Handle error (remove optimistic msg if implemented)
            console.error("Failed to send")
        }

        setIsSending(false)
    }

    return (
        <div className={`flex flex-col h-full bg-white ${className}`}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                <div>
                    <h3 className="font-bold text-gray-900">{recipientName}</h3>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="block h-2 w-2 rounded-full bg-green-500"></span>
                        Online
                    </p>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-gray-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender_id === currentUserId
                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                                ? 'bg-emerald-600 text-white rounded-br-none'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-white"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={isSending || !newMessage.trim()}
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    )
}
