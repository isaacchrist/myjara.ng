'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { createNotification } from "@/app/actions/notifications"

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
    const { data: newRoom, error } = await (supabase as any)
        .from('chat_rooms')
        .insert({
            user_id: user.id,
            store_id: storeId
        })
        .select()
        .single()

    if (error) {
        // 23505 = unique_violation on (user_id, store_id) -- a concurrent call
        // (double-click, or two entry points at once) already created the
        // room between our lookup and insert. Return that room instead of
        // surfacing a generic error for what is actually a success.
        if (error.code === '23505') {
            const { data: raceRoom } = await supabase
                .from('chat_rooms')
                .select('*')
                .eq('user_id', user.id)
                .eq('store_id', storeId)
                .single()
            if (raceRoom) return { data: raceRoom }
        }
        console.error("Error creating chat room:", error)
        return { error: "Failed to start chat" }
    }

    return { data: newRoom }
}

// 1b. Get or Create Chat Room (Store side -- messaging a specific customer,
// e.g. from an order detail page)
export async function getOrCreateChatRoomWithCustomerAction(storeId: string, customerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('owner_id', user.id)
        .maybeSingle()

    if (!store) return { error: "Not authorized for this store" }

    const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('user_id', customerId)
        .eq('store_id', storeId)
        .maybeSingle()

    if (existingRoom) return { data: existingRoom }

    const { data: newRoom, error } = await (supabase as any)
        .from('chat_rooms')
        .insert({ user_id: customerId, store_id: storeId })
        .select('id')
        .single()

    if (error) {
        if (error.code === '23505') {
            const { data: raceRoom } = await supabase
                .from('chat_rooms')
                .select('id')
                .eq('user_id', customerId)
                .eq('store_id', storeId)
                .single()
            if (raceRoom) return { data: raceRoom }
        }
        console.error("Error creating chat room with customer:", error)
        return { error: "Failed to start chat" }
    }

    return { data: newRoom }
}

// 2. Send Message
export async function sendMessageAction(roomId: string, content: string, productId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await (supabase as any)
        .from('messages')
        .insert({
            room_id: roomId,
            sender_id: user.id,
            content: content,
            product_id: productId || null
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
                    store:stores(name, owner_id, owner:users!owner_id(email, full_name, role)),
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
            let recipientId = ""
            let inAppLink = ""
            const preview = content.length > 50 ? content.substring(0, 50) + "..." : content

            // If I am the user, send to Store Owner
            if (user.id === room.user_id) {
                recipientEmail = room.store.owner.email
                recipientName = room.store.name // Address store by name usually
                senderName = room.user.full_name || "Customer"
                link = `https://myjara.com.ng/dashboard/support`
                recipientId = room.store.owner_id
                inAppLink = room.store.owner.role === 'retailer'
                    ? `/seller/messages/${roomId}`
                    : `/dashboard/messages?chatId=${roomId}`
            }
            // If I am the Store Owner (or staff), send to User
            else {
                recipientEmail = room.user.email
                recipientName = room.user.full_name || "Customer"
                senderName = room.store.name
                link = `https://myjara.com.ng/inbox` // Creating this page next
                recipientId = room.user_id
                inAppLink = `/inbox`
            }

            if (recipientId) {
                await createNotification({
                    userId: recipientId,
                    type: 'message',
                    title: `New message from ${senderName}`,
                    body: preview,
                    link: inAppLink,
                })
            }

            if (recipientEmail) {
                const { sendUnreadMessageEmail } = await import('@/lib/resend')
                await sendUnreadMessageEmail({
                    email: recipientEmail,
                    recipientName,
                    senderName,
                    messagePreview: preview,
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
        .select('*, product:products(id, name, price, store_id, product_images(url, is_primary))')
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
            user:users(full_name, email, avatar_url),
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
    await (supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', user.id)
        .eq('is_read', false)
}

// 6. Search users by name, email, or tag (for starting new conversations)
export async function searchUsersAction(query: string) {
    if (!query || query.trim().length < 2) return []

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Post-021 RLS only allows reading users you already share a chat room
    // or order with -- searching for someone new needs the admin client.
    const admin = await createAdminClient()
    const { data, error } = await admin
        .from('users')
        .select('id, full_name, email, avatar_url, role, tag')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,tag.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10)

    if (error) {
        console.error('User search error:', error)
        return []
    }

    return data || []
}

// 7. Get or create chat room between current user and another user (via store)
export async function createChatWithUserAction(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Find the target user's store
    const { data: targetStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', targetUserId)
        .limit(1)
        .single()

    if (targetStore) {
        // Target has a store, create room with their store
        return getOrCreateChatRoomAction((targetStore as any).id)
    }

    // If target doesn't have a store, we can't create a standard room
    // For now, return error
    return { error: 'User does not have a store to chat with.' }
}

// 8b. List a store's active products (for the chat composer's product-attach picker)
export async function getStoreProductsForChatAction(storeId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, product_images(url, is_primary)')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30)

    if (error) {
        console.error('Error fetching store products for chat:', error)
        return []
    }

    return data || []
}

// 8. Search Stores (for Customer Inbox to start new chats)
// Matches on store name OR the owner's user tag (e.g. "jara-mart-4a1c"), so a
// vendor can be found by the short tag from their profile instead of only
// the store's display name.
export async function searchStoresAction(query: string) {
    if (!query || query.trim().length < 2) return []

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Tag lookup needs to see across users (that's the point -- finding a
    // vendor you've never talked to yet), which the post-021 RLS policies on
    // `users` no longer allow via the session client. Admin client only for
    // this narrow id lookup, never returning anything beyond ownerIds.
    const admin = await createAdminClient()
    const { data: ownersByTag } = await admin
        .from('users')
        .select('id')
        .ilike('tag', `%${query}%`)
        .limit(10)

    const ownerIds = (ownersByTag || []).map((u: any) => u.id)

    let storesQuery = supabase
        .from('stores')
        .select('id, name, logo_url, shop_type')
        .eq('status', 'active')
        .limit(10)

    storesQuery = ownerIds.length > 0
        ? storesQuery.or(`name.ilike.%${query}%,owner_id.in.(${ownerIds.join(',')})`)
        : storesQuery.ilike('name', `%${query}%`)

    const { data, error } = await storesQuery

    if (error) {
        console.error('Store search error:', error)
        return []
    }

    return data || []
}
