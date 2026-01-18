'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { sendAccountApprovedEmail } from '@/lib/resend'

export async function approveStore(storeId: string) {
    console.log('--- Approving Store ---', storeId)
    const admin = await createAdminClient()

    // 1. Get Store & Owner Details
    const { data: store, error: fetchError } = await admin
        .from('stores')
        .select('*, owner:users!owner_id(email, full_name)')
        .eq('id', storeId)
        .single() as any

    if (fetchError || !store) {
        console.error('Fetch Store Error:', fetchError)
        return { success: false, error: 'Store not found' }
    }

    // 2. Update Status to Active
    const { error: updateError } = await (admin
        .from('stores') as any)
        .update({ status: 'active' })
        .eq('id', storeId)

    if (updateError) {
        return { success: false, error: updateError.message }
    }

    // 3. Send Email
    if (store.owner?.email) {
        console.log('Sending Approval Email to:', store.owner.email)
        await sendAccountApprovedEmail({
            email: store.owner.email,
            fullName: store.owner.full_name || 'Partner'
        })
    }

    return { success: true }
}

export async function rejectStore(storeId: string) {
    const admin = await createAdminClient()

    // For now just suspend
    const { error } = await (admin
        .from('stores') as any)
        .update({ status: 'suspended' })
        .eq('id', storeId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}
