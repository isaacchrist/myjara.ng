'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { getNotificationsAction, markAllNotificationsReadAction } from '@/app/actions/notifications'

interface NotificationBellProps {
    variant?: 'light' | 'dark'
    // Admin panel authenticates via a signed cookie, not a Supabase session,
    // so it needs separate admin-scoped fetch/mark-read actions.
    fetchFn?: () => Promise<any[]>
    markReadFn?: () => Promise<void>
}

// Polls rather than subscribing to realtime -- consistent with the rest of
// the chat/messages UI in this app, which also polls instead of using
// Supabase realtime channels.
export function NotificationBell({ variant = 'light', fetchFn = getNotificationsAction, markReadFn = markAllNotificationsReadAction }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [open, setOpen] = useState(false)

    const load = useCallback(async () => {
        const data = await fetchFn()
        setNotifications(data)
    }, [fetchFn])

    useEffect(() => {
        load()
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [load])

    const unreadCount = notifications.filter((n) => !n.is_read).length
    const isDark = variant === 'dark'

    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen && unreadCount > 0) {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            await markReadFn()
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`relative h-10 w-10 rounded-full ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : ''}`}
                    title="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-80 p-0 ${isDark ? 'border-gray-700 bg-gray-800' : ''}`} align="end">
                <div className={`border-b px-4 py-3 text-sm font-semibold ${isDark ? 'border-gray-700 text-white' : 'text-gray-900'}`}>
                    Notifications
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className={`p-6 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((n) => {
                            const row = (
                                <div
                                    className={`border-b px-4 py-3 last:border-b-0 ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'hover:bg-gray-50'
                                        } ${!n.is_read ? (isDark ? 'bg-gray-700/30' : 'bg-emerald-50/50') : ''}`}
                                >
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{n.title}</p>
                                    {n.body && (
                                        <p className={`mt-0.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{n.body}</p>
                                    )}
                                    <p className={`mt-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            )
                            return n.link ? (
                                <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                                    {row}
                                </Link>
                            ) : (
                                <div key={n.id}>{row}</div>
                            )
                        })
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
