'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDisputeAction(data: {
    orderId: string
    reason: string
    description: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Resolve store_id from the order so store owners can see disputes
    // filed against their store. Also doubles as a check that the order
    // belongs to this customer (existing "Users can view own orders" RLS
    // policy already scopes this read to the caller's own orders).
    const { data: order } = await (supabase.from('orders') as any)
        .select('store_id')
        .eq('id', data.orderId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!order) {
        return { success: false, error: 'Order not found. Check the Order ID and try again.' }
    }

    const { error } = await (supabase.from('disputes') as any).insert({
        customer_id: user.id,
        store_id: order.store_id,
        order_id: data.orderId,
        reason: data.reason,
        description: data.description,
        status: 'pending'
    })

    if (error) {
        console.error('Create dispute error:', error)
        return { success: false, error: 'Failed to submit dispute' }
    }

    revalidatePath('/customer/disputes')
    return { success: true }
}

export async function createSupportTicketAction(data: {
    subject: string
    description: string
    cause: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: store } = await (supabase.from('stores') as any)
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

    const { error } = await (supabase.from('disputes') as any).insert({
        customer_id: user.id,
        store_id: store?.id ?? null,
        reason: data.subject,
        description: data.description,
        cause: data.cause,
        status: 'pending'
    })

    if (error) {
        console.error('Create support ticket error:', error)
        return { success: false, error: 'Failed to submit ticket' }
    }

    return { success: true }
}

export async function resolveDisputeAction(disputeId: string, status: 'resolved' | 'closed') {
    const admin = await createAdminClient()

    const { error } = await (admin.from('disputes') as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', disputeId)

    if (error) {
        console.error('Resolve dispute error:', error)
        return { success: false, error: 'Failed to update dispute' }
    }

    revalidatePath('/admin/disputes')
    return { success: true }
}
