"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChatWindow } from "@/components/chat/chat-window"
import { getChatRoomsAction } from "@/app/actions/chat"
import { Loader2, Search, MessageSquare, User, ArrowLeft, Store as StoreIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useSearchParams, useRouter } from "next/navigation"

function MessagesContent() {
    const [rooms, setRooms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [userId, setUserId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'store' | 'user'>('store') // 'store' = My Customers, 'user' = My Chats

    const searchParams = useSearchParams()
    const router = useRouter()
    const selectedRoomId = searchParams.get('chatId')

    const supabase = createClient()

    // 1. Fetch User & Rooms
    useEffect(() => {
        const fetchRooms = async () => {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            // If tab is 'store', we need the store ID
            let fetchedRooms: any[] = []

            if (activeTab === 'store') {
                // Get store for this user
                const { data: store } = await (supabase as any)
                    .from('stores')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single()

                if (store) {
                    fetchedRooms = await getChatRoomsAction('store', store.id) || []
                }
            } else {
                // 'user' tab - interactions as a buyer
                fetchedRooms = await getChatRoomsAction('user') || []
            }

            setRooms(fetchedRooms)
            setIsLoading(false)
        }
        fetchRooms()
    }, [activeTab])

    const filteredRooms = rooms.filter(room => {
        const targetName = activeTab === 'store'
            ? room.user?.full_name
            : room.store?.name
        return targetName?.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const selectedRoom = rooms.find(r => r.id === selectedRoomId)
    const showChatList = !selectedRoomId // Mobile: show list if no room selected

    const handleRoomSelect = (roomId: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('chatId', roomId)
        router.push(`/dashboard/messages?${params.toString()}`)
    }

    const handleBackToList = () => {
        router.push('/dashboard/messages')
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* Left: Chat List (Visible on Desktop OR Mobile when no chat selected) */}
            <Card className={`flex-col h-full min-h-0 md:flex w-full md:w-1/3 lg:w-1/4 ${showChatList ? 'flex' : 'hidden md:flex'}`}>
                {/* Header / Tabs */}
                <div className="p-4 border-b space-y-4">
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'store' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setActiveTab('store')}
                        >
                            <StoreIcon className="h-4 w-4" /> My Customers
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'user' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setActiveTab('user')}
                        >
                            <User className="h-4 w-4" /> My Chats
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder={activeTab === 'store' ? "Search customers..." : "Search stores..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-emerald-600" />
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>No messages yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredRooms.map(room => {
                                const displayName = activeTab === 'store' ? (room.user?.full_name || 'Customer') : (room.store?.name || 'Store')
                                return (
                                    <button
                                        key={room.id}
                                        onClick={() => handleRoomSelect(room.id)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${selectedRoomId === room.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''}`}
                                    >
                                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {activeTab === 'user' && room.store?.logo_url ? (
                                                <img src={room.store.logo_url} alt="Logo" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-semibold text-sm truncate">{displayName}</h4>
                                                {room.updated_at && (
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                                                        {formatDistanceToNow(new Date(room.updated_at), { addSuffix: false })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {room.last_message_content || 'Started a conversation'}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </Card>

            {/* Right: Chat Window (Visible on Desktop OR Mobile when chat selected) */}
            <Card className={`flex-col h-full min-h-0 flex-1 overflow-hidden ${!showChatList ? 'flex' : 'hidden md:flex'}`}>
                {userId && selectedRoom ? (
                    <div className="flex flex-col h-full">
                        {/* Mobile Header Back Button */}
                        <div className="md:hidden p-2 border-b bg-white flex items-center">
                            <button onClick={handleBackToList} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <span className="ml-2 font-semibold">Back to Inbox</span>
                        </div>

                        <ChatWindow
                            key={selectedRoom.id}
                            roomId={selectedRoom.id}
                            currentUserId={userId}
                            recipientName={activeTab === 'store' ? (selectedRoom.user?.full_name || "Customer") : (selectedRoom.store?.name || "Store")}
                            className="h-full border-none shadow-none"
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>}>
            <MessagesContent />
        </Suspense>
    )
}
