"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatWindow } from "@/components/chat/chat-window"
import { getChatRoomsAction } from "@/app/actions/chat"
import { Loader2, Search, MessageSquare, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function BrandSupportPage() {
    const [rooms, setRooms] = useState<any[]>([])
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    const supabase = createClient()

    // 1. Fetch Rooms
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            // Get store for this user (Simplified: assumes 1 store for now)
            const { data: store } = await (supabase as any)
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (store) {
                setCurrentStoreId(store.id)
                const data = await getChatRoomsAction('store', store.id)
                setRooms(data || [])
            }
            setIsLoading(false)
        }
        init()
    }, [])

    const filteredRooms = rooms.filter(room =>
        room.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedRoom = rooms.find(r => r.id === selectedRoomId)

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col"> {/* Adjust height for layout */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Support Messages</h1>
                <p className="text-gray-500">Chat directly with your customers</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
                {/* Left: Chat List */}
                <Card className="md:col-span-1 flex flex-col h-full min-h-0">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

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
                                {filteredRooms.map(room => (
                                    <button
                                        key={room.id}
                                        onClick={() => setSelectedRoomId(room.id)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${selectedRoomId === room.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
                                            }`}
                                    >
                                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-semibold text-sm truncate">
                                                    {room.user?.full_name || 'Customer'}
                                                </h4>
                                                {room.updated_at && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatDistanceToNow(new Date(room.updated_at), { addSuffix: false })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {room.last_message_content || 'Started a conversation'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right: Chat Window */}
                <Card className="md:col-span-2 h-full min-h-0 overflow-hidden flex flex-col">
                    {userId && selectedRoom ? (
                        <ChatWindow
                            key={selectedRoom.id} // Re-mount on change
                            roomId={selectedRoom.id}
                            currentUserId={userId}
                            recipientName={selectedRoom.user?.full_name || "Customer"}
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
    )
}
