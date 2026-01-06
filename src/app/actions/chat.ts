'use server'

import { createClient } from "@/lib/supabase/server"

// 1. Get or Create Chat Room (Customer side mainly)
export async function getOrCreateChatRoomAction(storeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Check if room exists
    const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .single()

    if (existingRoom) {
        return { data: existingRoom }
    }

    // Create new room
    const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
            user_id: user.id,
            store_id: storeId
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating chat room:", error)
        return { error: "Failed to start chat" }
    }

    return { data: newRoom }
}

// 2. Send Message
export async function sendMessageAction(roomId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('messages')
        .insert({
            room_id: roomId,
            sender_id: user.id,
            content: content
        })

    if (error) {
        console.error("Error sending message:", error)
        return { error: "Failed to send message" }
    }

    // Fire-and-forget email notification
    (async () => {
        try {
            // 1. Get Room details to find recipient
            const { data: room } = await supabase
                .from('chat_rooms')
                .select(`
                    *,
                    store:stores(name, owner_id, owner:users!owner_id(email, full_name)),
                    user:users!user_id(email, full_name)
                `)
                .eq('id', roomId)
                .single() as any

            if (!room) return

            // 2. Determine Recipient
            let recipientEmail = ""
            let recipientName = ""
            let senderName = ""
            let link = ""

            // If I am the user, send to Store Owner
            if (user.id === room.user_id) {
                recipientEmail = room.store.owner.email
                recipientName = room.store.name // Address store by name usually
                senderName = room.user.full_name || "Customer"
                link = `https://myjara.ng/dashboard/support`
            }
            // If I am the Store Owner (or staff), send to User
            else {
                recipientEmail = room.user.email
                recipientName = room.user.full_name || "Customer"
                senderName = room.store.name
                link = `https://myjara.ng/inbox` // Creating this page next
            }

            if (recipientEmail) {
                const { sendUnreadMessageEmail } = await import('@/lib/resend')
                await sendUnreadMessageEmail({
                    email: recipientEmail,
                    recipientName,
                    senderName,
                    messagePreview: content.length > 50 ? content.substring(0, 50) + "..." : content,
                    actionLink: link
                })
            }

        } catch (err) {
            console.error("Failed to trigger notification:", err)
        }
    })()

    return { success: true }
}

// 3. Get Messages for a Room
export async function getMessagesAction(roomId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

    if (error) {
        return []
    }

    return data
}

// 4. Get User's Chat Rooms (For Brand Dashboard mainly, or Customer Inbox)
export async function getChatRoomsAction(role: 'user' | 'store' = 'user', storeId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let query = supabase
        .from('chat_rooms')
        .select(`
            *,
            user:users(full_name, email),
            store:stores(name, logo_url)
        `)
        .order('updated_at', { ascending: false })

    if (role === 'user') {
        query = query.eq('user_id', user.id)
    } else {
        // Find stores owned by user if storeId not provided (though usually it is)
        if (storeId) {
            query = query.eq('store_id', storeId)
        } else {
            // Complex case: find all rooms for all stores owned by user
            // Simplified: just return empty if no storeId for now, enforcing context
            return []
        }
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching rooms:", error)
        return []
    }

    return data
}

// 5. Mark messages as read
export async function markMessagesReadAction(roomId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Mark all messages in room NOT sent by me as read
    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', user.id)
        .eq('is_read', false)
}
