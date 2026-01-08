'use server'

import { createClient } from '@/lib/supabase/server'
import { getStoreSession } from './admin-auth'

export async function getRetailerStats(storeId: string) {
    const supabase = await createClient()

    // 1. Total Clients (Unique contacts in client_contacts)
    const { count: totalClients } = await supabase
        .from('client_contacts')
        .select('client_identifier', { count: 'exact', head: true })
        .eq('store_id', storeId)

    // 2. Contacts (Total interactions)
    const { count: contactsReceived } = await supabase
        .from('client_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)

    // 3. Logistics Opt-in (Mock for now, or check orders with delivery)
    // For MVP we'll query orders if we had that table structure fully populated with delivery details
    // using a placeholder for now
    const logisticsOptIn = 0

    // 4. Messages
    const { count: messagesCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
    // Assuming we can link messages to store via room or recipient
    // This query might need adjustment based on valid message-store relation
    // For now, let's assume we filter by room participants if possible, or just mock slightly
    // If rooms table has store_id:
    // .eq('room_id.store_id', storeId) 
    // usage dependent on schema. Returning 0 if complex join needed for MVP.

    return {
        totalClients: totalClients || 0,
        logisticsOptIn: logisticsOptIn,
        contactsReceived: contactsReceived || 0,
        messagesCount: messagesCount || 0
    }
}

export async function logClientContact(storeId: string, clientIdentifier: string, contactType: 'phone_copy' | 'whatsapp' | 'call') {
    const supabase = await createClient()

    const { error } = await supabase
        .from('client_contacts')
        .insert({
            store_id: storeId,
            client_identifier: clientIdentifier,
            contact_type: contactType
        })

    if (error) {
        console.error('Error logging contact:', error)
        return { success: false }
    }

    return { success: true }
}

export async function getRecentClients(storeId: string) {
    const supabase = await createClient()

    // Fetch recent unique contacts
    const { data, error } = await supabase
        .from('client_contacts')
        .select('client_identifier, created_at, metadata')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error || !data) return []

    // Deduplicate by client_identifier on client side if needed, 
    // or just return the recent interactions list
    return data.map(contact => ({
        id: contact.client_identifier, // Using identifier as ID for display
        name: contact.metadata?.name || 'Unknown User',
        phone: contact.client_identifier,
        lastActive: new Date(contact.created_at).toLocaleDateString()
    }))
}

export async function getCompetitorPricing() {
    // Determine user location or category and fetch relevant competitors
    // For MVP returning mock data structure to be consistent with UI
    // In real implementation: 
    // const { data } = await supabase.from('products').select(...).eq('category', myCategory).neq('store_id', myId)

    return [
        { name: 'Emeka & Sons', price: 12000, jara: 'Buy 5 Get 1', distance: '0.5km' },
        { name: 'Mama Nkechi Store', price: 11500, jara: 'None', distance: '1.2km' },
        { name: 'Garki Wholesalers', price: 11800, jara: 'Free Delivery', distance: '2.0km' },
    ]
}
