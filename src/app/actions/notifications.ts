'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/app/actions/admin-auth'

export async function getNotificationsAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

    if (error) {
        console.error('Error fetching notifications:', error)
        return []
    }

    return data || []
}

export async function markAllNotificationsReadAction() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
}

// Admin-panel variant -- the admin cookie session has no auth.uid(), so it
// resolves the same "first platform_admin user" identity used by
// admin-chat.ts's requireAdminIdentity().
export async function getAdminNotificationsAction() {
    const isAdmin = await getAdminSession()
    if (!isAdmin) return []

    const supabase = await createAdminClient()
    const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'platform_admin')
        .limit(1)
        .maybeSingle() as any

    if (!adminUser) return []

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', adminUser.id)
        .order('created_at', { ascending: false })
        .limit(30)

    if (error) {
        console.error('Error fetching admin notifications:', error)
        return []
    }

    return data || []
}

export async function markAllAdminNotificationsReadAction() {
    const isAdmin = await getAdminSession()
    if (!isAdmin) return

    const supabase = await createAdminClient()
    const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'platform_admin')
        .limit(1)
        .maybeSingle() as any

    if (!adminUser) return

    await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', adminUser.id)
        .eq('is_read', false)
}

// Internal helper for other server actions to create a notification.
// Uses the service-role client since the acting party (e.g. the other
// side of a chat, an admin approving verification) is rarely the
// notification's recipient, so RLS would otherwise block the insert.
export async function createNotification(params: { userId: string; type: string; title: string; body?: string; link?: string }) {
    const supabase = await createAdminClient()
    await (supabase as any).from('notifications').insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body || null,
        link: params.link || null,
    })
}
