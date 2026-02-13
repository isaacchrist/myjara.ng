import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { getChatRoomsAction } from '@/app/actions/chat'
import { MessageSquare, Search } from 'lucide-react'
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Messages</h1>
                <span className="text-sm text-gray-500">{rooms.length} conversation{rooms.length !== 1 ? 's' : ''}</span>
            </div>

            {rooms.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                        <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="max-w-xs mt-2 text-sm">When customers or admins contact you, their messages will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {rooms.map((room) => {
                        const otherPartyName = room.user?.full_name || room.user?.email || 'Unknown User'
                        const avatarUrl = room.user?.avatar_url
                        const lastActive = room.updated_at ? formatDistanceToNow(new Date(room.updated_at), { addSuffix: true }) : 'New'

                        return (
                            <Link href={`/seller/messages/${room.id}`} key={room.id}>
                                <Card className="hover:border-emerald-500 transition-colors cursor-pointer group">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                                {avatarUrl ? (
                                                    <Image
                                                        src={avatarUrl}
                                                        alt={otherPartyName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-gray-600 font-bold text-lg">
                                                        {otherPartyName.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700">{otherPartyName}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {room.user?.email || `Chat ID: ${room.id.slice(0, 8)}`}
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
