import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { getChatRoomsAction } from '@/app/actions/chat'
import { User, Store, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function VendorInboxPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Get Active Store
    const { getActiveStore } = await import('@/lib/store-context')
    const storeData = await getActiveStore()
    if (!storeData || !storeData.activeStore) redirect('/onboarding/store')

    const { activeStore } = storeData

    // Fetch Rooms
    const rooms: any[] = await getChatRoomsAction('store', activeStore.id)

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Messages</h1>

            {rooms.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                        <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="max-w-xs mt-2 text-sm">When customers or admins contact you, their messages will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {rooms.map((room) => {
                        const otherPartyName = room.user?.full_name || room.user?.email || 'Unknown User'
                        const lastActive = room.updated_at ? formatDistanceToNow(new Date(room.updated_at), { addSuffix: true }) : 'New'

                        return (
                            <Link href={`/seller/messages/${room.id}`} key={room.id}>
                                <Card className="hover:border-emerald-500 transition-colors cursor-pointer group">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                                                {otherPartyName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700">{otherPartyName}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Chat ID: {room.id.slice(0, 8)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-400">{lastActive}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
