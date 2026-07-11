'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MessageSquare, Send, Store, Search, ChevronLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
    getAdminChatRoomsAction,
    getAdminMessagesAction,
    sendAdminMessageAction,
    markAdminMessagesReadAction,
    getOrCreateAdminChatRoomAction,
    searchStoresForAdminAction
} from '@/app/actions/admin-chat'

type ChatRoom = {
    id: string
    user_id: string
    updated_at: string
    last_message_content: string | null
    store: {
        id: string
        name: string
        logo_url: string | null
        owner: { full_name: string; email: string } | null
    } | null
}

type Message = {
    id: string
    room_id: string
    sender_id: string
    content: string
    created_at: string
}

export default function AdminMessagesPage() {
    const [rooms, setRooms] = useState<ChatRoom[]>([])
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sending, setSending] = useState(false)
    const [search, setSearch] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [newChatResults, setNewChatResults] = useState<any[]>([])
    const [isSearchingNew, setIsSearchingNew] = useState(false)
    const [isStartingChat, setIsStartingChat] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true)
            const result = await getAdminChatRoomsAction()
            if ('error' in result) {
                setError(result.error || 'Failed to load conversations')
            } else {
                setRooms(result.data as any)
            }
            setLoading(false)
        }
        fetchRooms()
    }, [])

    useEffect(() => {
        if (!selectedRoomId) return

        const fetchMessages = async () => {
            setLoadingMessages(true)
            const data = await getAdminMessagesAction(selectedRoomId)
            setMessages(data as Message[])
            setLoadingMessages(false)
            markAdminMessagesReadAction(selectedRoomId)
        }

        fetchMessages()
    }, [selectedRoomId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (search.trim().length < 2) {
            setNewChatResults([])
            return
        }
        setIsSearchingNew(true)
        const timeoutId = setTimeout(async () => {
            const results = await searchStoresForAdminAction(search)
            const existingStoreIds = new Set(rooms.map(r => r.store?.id))
            setNewChatResults(results.filter((s: any) => !existingStoreIds.has(s.id)))
            setIsSearchingNew(false)
        }, 400)
        return () => clearTimeout(timeoutId)
    }, [search, rooms])

    const handleStartNewChat = async (storeId: string) => {
        setIsStartingChat(true)
        const result = await getOrCreateAdminChatRoomAction(storeId)
        if ('data' in result && result.data) {
            const roomId = (result.data as any).id
            const refreshed = await getAdminChatRoomsAction()
            if (!('error' in refreshed)) {
                setRooms(refreshed.data as any)
            }
            setSelectedRoomId(roomId)
            setSearch('')
            setNewChatResults([])
        }
        setIsStartingChat(false)
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedRoomId) return

        setSending(true)
        const content = newMessage.trim()
        const result = await sendAdminMessageAction(selectedRoomId, content)
        if (!('error' in result)) {
            setNewMessage('')
            const data = await getAdminMessagesAction(selectedRoomId)
            setMessages(data as Message[])
        }
        setSending(false)
    }

    const filteredRooms = rooms.filter(room =>
        room.store?.name?.toLowerCase().includes(search.toLowerCase()) ||
        room.store?.owner?.full_name?.toLowerCase().includes(search.toLowerCase())
    )

    const selectedRoom = rooms.find(r => r.id === selectedRoomId)

    return (
        <div className="h-[calc(100vh-100px)] min-h-[500px] flex flex-col bg-white border rounded-lg overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-emerald-600" />
                        Support Messages
                    </h1>
                    <p className="text-sm text-gray-500">Conversations between MyJara admin and stores</p>
                </div>
                <Link href="/admin">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>

            {error ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 max-w-sm">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* Rooms List */}
                    <div className={`w-80 border-r flex flex-col bg-gray-50 ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search stores..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                </div>
                            ) : filteredRooms.length === 0 ? (
                                <div className="text-center p-8 text-gray-500">
                                    No conversations found
                                </div>
                            ) : (
                                filteredRooms.map((room) => (
                                    <button
                                        key={room.id}
                                        onClick={() => setSelectedRoomId(room.id)}
                                        className={`w-full p-4 text-left border-b hover:bg-white transition-colors ${selectedRoomId === room.id ? 'bg-white border-l-4 border-l-emerald-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                <Store className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {room.store?.name || 'Unknown Store'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {room.last_message_content || 'No messages yet'}
                                                </p>
                                            </div>
                                            <div className="text-xs text-gray-400 shrink-0">
                                                {formatDistanceToNow(new Date(room.updated_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {search.trim().length >= 2 && (
                            <div className="border-t bg-white p-2 max-h-64 overflow-y-auto">
                                <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Start new conversation
                                </div>
                                {isSearchingNew ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    </div>
                                ) : newChatResults.length > 0 ? (
                                    <div className="space-y-1">
                                        {newChatResults.map((store: any) => (
                                            <button
                                                key={store.id}
                                                type="button"
                                                disabled={isStartingChat}
                                                onClick={() => handleStartNewChat(store.id)}
                                                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-emerald-50 disabled:opacity-50"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                                    <Store className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-gray-900">{store.name}</p>
                                                    <p className="truncate text-xs text-gray-500">{store.owner?.full_name || store.owner?.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-3 text-center text-sm text-gray-400">No new stores found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chat Area */}
                    <div className={`flex-1 flex flex-col bg-white ${!selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
                        {selectedRoomId ? (
                            <>
                                <div className="p-4 border-b flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setSelectedRoomId(null)}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Store className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{selectedRoom?.store?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedRoom?.store?.owner?.email}</p>
                                    </div>
                                </div>

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
                                        messages.map((msg) => {
                                            const isAdmin = selectedRoom && msg.sender_id === selectedRoom.user_id
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isAdmin
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-gray-100 text-gray-900'
                                                            }`}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p className={`text-xs mt-1 ${isAdmin ? 'text-emerald-200' : 'text-gray-400'
                                                            }`}>
                                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

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
            )}
        </div>
    )
}
