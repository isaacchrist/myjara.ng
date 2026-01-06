"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChatWindow } from "@/components/chat/chat-window"
import { getChatRoomsAction } from "@/app/actions/chat"
import { Loader2, Search, MessageSquare, Store } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export default function CustomerInboxPage() {
    const [rooms, setRooms] = useState<any[]>([])
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [userId, setUserId] = useState<string | null>(null)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login?redirect=/inbox')
                return
            }
            setUserId(user.id)

            // Get rooms as 'user'
            const data = await getChatRoomsAction('user')
            setRooms(data || [])
            setIsLoading(false)
        }
        init()
    }, [router])

    const filteredRooms = rooms.filter(room =>
        room.store?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedRoom = rooms.find(r => r.id === selectedRoomId)

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl h-[calc(100vh-100px)] flex flex-col">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                    <p className="text-gray-500">Chat with stores and track your inquiries</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
                    {/* Left: Chat List */}
                    <Card className="md:col-span-1 flex flex-col h-full min-h-0 bg-white">
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search stores..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredRooms.length === 0 ? (
                                <div className="text-center p-8 text-gray-500">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>No messages yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredRooms.map(room => (
                                        <button
                                            key={room.id}
                                            onClick={() => setSelectedRoomId(room.id)}
                                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${selectedRoomId === room.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
                                                }`}
                                        >
                                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                                                {room.store?.logo_url ? (
                                                    <img src={room.store.logo_url} alt={room.store.name} className="h-full w-full object-cover rounded-lg" />
                                                ) : (
                                                    <Store className="h-5 w-5 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-semibold text-sm truncate text-gray-900">
                                                        {room.store?.name || 'Store'}
                                                    </h4>
                                                    {room.updated_at && (
                                                        <span className="text-[10px] text-gray-400">
                                                            {formatDistanceToNow(new Date(room.updated_at), { addSuffix: false })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {room.last_message_content || 'View conversation'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Right: Chat Window */}
                    <Card className="md:col-span-2 h-full min-h-0 overflow-hidden flex flex-col bg-white">
                        {userId && selectedRoom ? (
                            <ChatWindow
                                key={selectedRoom.id}
                                roomId={selectedRoom.id}
                                currentUserId={userId}
                                recipientName={selectedRoom.store?.name || "Store"}
                                className="h-full border-none shadow-none"
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
                                <p>Select a conversation to start chatting</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
