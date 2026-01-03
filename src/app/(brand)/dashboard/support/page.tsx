"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"

export default function SupportPage() {
    const [conversations, setConversations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchConversations = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get store for this user
            const { data: store } = await supabase
                .from("stores")
                .select("id")
                .eq("owner_id", user.id)
                .single() as any

            if (store) {
                const { data } = await supabase
                    .from("chat_conversations")
                    .select(`
                        id,
                        last_message_at,
                        product:products(name),
                        user:users(full_name, email)
                    `)
                    .eq("store_id", store.id)
                    .order("last_message_at", { ascending: false })

                setConversations(data || [])
            }
            setIsLoading(false)
        }
        fetchConversations()
    }, [supabase])

    if (isLoading) return <div className="p-8 text-center">Loading support chats...</div>

    return (
        <div className="container mx-auto p-6">
            <h1 className="mb-8 text-3xl font-bold">Customer Support</h1>

            <div className="grid gap-4">
                {conversations.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-gray-500">
                            <MessageCircle className="mb-4 h-12 w-12 opacity-20" />
                            <p>No active conversations.</p>
                        </CardContent>
                    </Card>
                ) : (
                    conversations.map((chat) => (
                        <Link key={chat.id} href={`/dashboard/support/${chat.id}`}>
                            <Card className="transition-all hover:bg-gray-50">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                            {chat.user?.full_name[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{chat.user?.full_name || 'Guest'}</p>
                                            <p className="text-sm text-gray-500">
                                                {chat.product ? `Regarding: ${chat.product.name}` : 'General Inquiry'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={chat.last_message_at ? 'default' : 'secondary'}>
                                            {chat.last_message_at ? 'Active' : 'New'}
                                        </Badge>
                                        <p className="mt-1 text-xs text-gray-400">
                                            {new Date(chat.last_message_at || chat.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
