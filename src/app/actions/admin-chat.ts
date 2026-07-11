'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/app/actions/admin-auth'

// Chat rooms are modeled as (user_id, store_id) pairs -- there's no separate
// "admin" participant type in the schema. Admin<->store chat reuses the same
// pattern already established by sendWelcomeMessage() in register.ts: the
// admin acts as the `user_id` party in a room, using the first user with
// role = 'platform_admin' as its identity. The admin panel authenticates via
// a signed cookie, not a Supabase session (see admin-auth.ts), so every
// query here goes through the service-role client.

async function requireAdminIdentity() {
    const isAdmin = await getAdminSession()
    if (!isAdmin) return { error: 'Unauthorized' as const }

    const supabase = await createAdminClient()
    const { data: adminUser } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'platform_admin')
        .limit(1)
        .maybeSingle() as any

    if (!adminUser) {
        return { error: 'No platform_admin user exists yet -- create one to enable admin chat.' as const }
    }

    return { supabase, adminId: adminUser.id as string }
}

export async function getAdminChatRoomsAction() {
    const ctx = await requireAdminIdentity()
    if ('error' in ctx) return { error: ctx.error }

    const { data, error } = await ctx.supabase
        .from('chat_rooms')
        .select(`
            *,
            store:stores(id, name, logo_url, owner_id, owner:users!owner_id(full_name, email))
        `)
        .eq('user_id', ctx.adminId)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching admin chat rooms:', error)
        return { error: 'Failed to load conversations' }
    }

    return { data: data || [] }
}

export async function getOrCreateAdminChatRoomAction(storeId: string) {
    const ctx = await requireAdminIdentity()
    if ('error' in ctx) return { error: ctx.error }

    const { data: existingRoom } = await ctx.supabase
        .from('chat_rooms')
        .select('*')
        .eq('user_id', ctx.adminId)
        .eq('store_id', storeId)
        .maybeSingle()

    if (existingRoom) return { data: existingRoom }

    const { data: newRoom, error } = await (ctx.supabase as any)
        .from('chat_rooms')
        .insert({ user_id: ctx.adminId, store_id: storeId })
        .select()
        .single()

    if (error) {
        console.error('Error creating admin chat room:', error)
        return { error: 'Failed to start conversation' }
    }

    return { data: newRoom }
}

export async function getAdminMessagesAction(roomId: string) {
    const ctx = await requireAdminIdentity()
    if ('error' in ctx) return []

    const { data, error } = await ctx.supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching admin messages:', error)
        return []
    }

    return data || []
}

export async function sendAdminMessageAction(roomId: string, content: string) {
    const ctx = await requireAdminIdentity()
    if ('error' in ctx) return { error: ctx.error }

    const { error } = await (ctx.supabase as any)
        .from('messages')
        .insert({ room_id: roomId, sender_id: ctx.adminId, content })

    if (error) {
        console.error('Error sending admin message:', error)
        return { error: 'Failed to send message' }
    }

    await (ctx.supabase as any)
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString(), last_message_content: content })
        .eq('id', roomId)

    return { success: true }
}

export async function markAdminMessagesReadAction(roomId: string) {
    const ctx = await requireAdminIdentity()
    if ('error' in ctx) return

    await (ctx.supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', ctx.adminId)
        .eq('is_read', false)
}
