"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Message {
    id: string
    message: string
    sender_type: 'customer' | 'brand'
    created_at: string
    sender_id: string
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Unwrap params using React.use() or await in useEffect because it's a client component receiving a promise?
    // Next.js 15+ params are promises. In client components we can use `use` hook or just unwrap in useEffect.
    // We'll use a state to hold the ID.
    const [conversationId, setConversationId] = useState<string | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()
    const { toast } = useToast()

    // Handle params unwrapping
    useEffect(() => {
        params.then(p => setConversationId(p.id))
    }, [params])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (!conversationId) return

        const fetchMessages = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // Fetch initial messages
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true })

                if (error) throw error
                setMessages(data || [])
            } catch (err: any) {
                console.error('Error fetching messages:', err)
                setError("Failed to load conversation.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((current) => [...current, payload.new as any])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, router, supabase])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !conversationId) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await (supabase.from('chat_messages') as any).insert({
                conversation_id: conversationId,
                sender_id: user.id,
                sender_type: 'customer',
                message: newMessage.trim(),
            })

            if (error) throw error
            setNewMessage("")
        } catch (err) {
            console.error('Error sending message:', err)
            toast({
                title: "Error",
                description: "Failed to send message.",
                variant: "destructive",
            })
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-500">Loading chat...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500">{error}</p>
                    <Link href="/" className="mt-4 text-emerald-600 hover:underline">Return Home</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <div className="container mx-auto flex h-screen max-w-3xl flex-col p-4">
                {/* Header */}
                <div className="mb-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Chat with Seller</h1>
                        <p className="text-sm text-gray-500">Ask questions about products, shipping, or Jara offers</p>
                    </div>
                </div>

                {/* Messages */}
                <Card className="flex-1 overflow-hidden">
                    <div className="flex h-full flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isCustomer = msg.sender_type === 'customer'
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${isCustomer
                                                ? 'bg-emerald-600 text-white rounded-br-none'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                                }`}
                                        >
                                            <p>{msg.message}</p>
                                            <p className={`mt-1 text-xs ${isCustomer ? 'text-emerald-100' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t bg-white p-4">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={!newMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Send</span>
                                </Button>
                            </form>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
