import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getNotificationsAction, markAllNotificationsReadAction } from '@/app/actions/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?redirect=/notifications')

    const notifications = await getNotificationsAction()
    await markAllNotificationsReadAction()

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto max-w-2xl px-4">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">Notifications</h1>

                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <Bell className="mb-4 h-10 w-10 opacity-20" />
                            <p>No notifications yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n: any) => {
                            const row = (
                                <Card className={!n.is_read ? 'border-emerald-200 bg-emerald-50/50' : ''}>
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                        {n.body && <p className="mt-1 text-sm text-gray-500">{n.body}</p>}
                                        <p className="mt-2 text-xs text-gray-400">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                            return n.link ? (
                                <Link key={n.id} href={n.link} className="block">
                                    {row}
                                </Link>
                            ) : (
                                <div key={n.id}>{row}</div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
