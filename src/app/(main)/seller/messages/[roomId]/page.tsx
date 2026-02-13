import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChatWindow } from '@/components/chat/chat-window'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface ChatRoomPageProps {
    params: Promise<{
        roomId: string
    }>
}

export default async function VendorChatRoomPage({ params }: ChatRoomPageProps) {
    const { roomId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch Room Details to verify access and get recipient name
    const { data: room, error } = await supabase
        .from('chat_rooms')
        .select(`
            *,
            user:users!user_id(full_name, email),
            store:stores!store_id(owner_id, name)
        `)
        .eq('id', roomId)
        .single() as any

    if (error || !room) {
        notFound()
    }

    // Verify Access: Must be room.user_id (Customer) OR room.store.owner_id (Vendor)
    // Since this is /seller/messages, we expect the user to be the STORE OWNER.
    if (room.store.owner_id !== user.id) {
        // Edge case: Admin? Admin might use a different interface.
        // For now strict check.
        redirect('/seller/messages')
    }

    // Determine Recipient Name (The other party)
    // If I am store owner, recipient is the User (Customer or Admin-as-User)
    // Note: Admin welcome message creates a room where user_id is Admin.
    const recipientName = room.user?.full_name || room.user?.email || 'Customer'

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
            {/* Header / Breadcrumb */}
            <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
                <Link href="/seller/messages" className="text-gray-500 hover:text-emerald-600">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <span className="font-semibold text-gray-700">Back to Inbox</span>
            </div>

            <div className="flex-1 p-4 md:p-6 overflow-hidden">
                <Card className="h-full flex flex-col overflow-hidden shadow-md">
                    <ChatWindow
                        roomId={roomId}
                        currentUserId={user.id}
                        recipientName={recipientName}
                        className="flex-1"
                    />
                </Card>
            </div>
        </div>
    )
}
