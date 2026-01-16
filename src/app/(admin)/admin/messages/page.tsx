'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MessageSquare, Send, User, Search, ChevronLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

type Conversation = {
    id: string
    created_at: string
    updated_at: string
    participant_1: string
    participant_2: string
    last_message: string | null
    other_user: {
        id: string
        full_name: string
        email: string
        role: string
    }
}

type Message = {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    created_at: string
}

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sending, setSending] = useState(false)
    const [search, setSearch] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const supabase = createClient()

    // Fetch all conversations
    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true)

            // For admin, fetch all conversations
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    user1:users!conversations_participant_1_fkey (id, full_name, email, role),
                    user2:users!conversations_participant_2_fkey (id, full_name, email, role)
                `)
                .order('updated_at', { ascending: false })

            if (!error && data) {
                // Format conversations to show the "other" user (non-admin)
                const formatted = data.map((conv: any) => ({
                    ...conv,
                    other_user: conv.user1?.role === 'admin' ? conv.user2 : conv.user1
                }))
                setConversations(formatted)
            }
            setLoading(false)
        }

        fetchConversations()
    }, [])

    // Fetch messages for selected conversation
    useEffect(() => {
        if (!selectedConversation) return

        const fetchMessages = async () => {
            setLoadingMessages(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', selectedConversation)
                .order('created_at', { ascending: true })

            if (!error && data) {
                setMessages(data as Message[])
            }
            setLoadingMessages(false)
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`messages:${selectedConversation}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedConversation}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedConversation, supabase])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return

        setSending(true)
        try {
            const { error } = await (supabase as any)
                .from('messages')
                .insert({
                    conversation_id: selectedConversation,
                    sender_id: 'admin', // Admin identifier
                    content: newMessage.trim()
                })

            if (!error) {
                setNewMessage('')
                // Update conversation's last_message
                await (supabase as any)
                    .from('conversations')
                    .update({
                        last_message: newMessage.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedConversation)
            }
        } catch (err) {
            console.error('Send error:', err)
        } finally {
            setSending(false)
        }
    }

    const filteredConversations = conversations.filter(conv =>
        conv.other_user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        conv.other_user?.email?.toLowerCase().includes(search.toLowerCase())
    )

    const selectedConv = conversations.find(c => c.id === selectedConversation)

    return (
        <div className="h-[calc(100vh-100px)] min-h-[500px] flex flex-col bg-white border rounded-lg overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-emerald-600" />
                        Support Messages
                    </h1>
                    <p className="text-sm text-gray-500">Manage user conversations</p>
                </div>
                <Link href="/admin">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Conversations List */}
                <div className={`w-80 border-r flex flex-col bg-gray-50 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {/* Search */}
                    <div className="p-4 border-b bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search users..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">
                                No conversations found
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv.id)}
                                    className={`w-full p-4 text-left border-b hover:bg-white transition-colors ${selectedConversation === conv.id ? 'bg-white border-l-4 border-l-emerald-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {conv.other_user?.full_name || 'Unknown User'}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {conv.last_message || 'No messages yet'}
                                            </p>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="mt-2 text-xs">
                                        {conv.other_user?.role || 'user'}
                                    </Badge>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-white ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">{selectedConv?.other_user?.full_name}</p>
                                    <p className="text-xs text-gray-500">{selectedConv?.other_user?.email}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {loadingMessages ? (
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        No messages in this conversation
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_id === 'admin' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender_id === 'admin'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${msg.sender_id === 'admin' ? 'text-emerald-200' : 'text-gray-400'
                                                    }`}>
                                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        disabled={sending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={sending || !newMessage.trim()}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p>Select a conversation to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
