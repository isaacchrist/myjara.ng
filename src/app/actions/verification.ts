'use server'

import { createClient } from "@/lib/supabase/server"
import { sendAccountApprovedEmail, sendPolicyAcceptedEmail } from "@/lib/resend"

export async function approveWholesalerAction(userId: string) {
    const supabase = await createClient()

    // 1. Check if user exists and fetch email/name for notification
    const { data: user, error: fetchError } = await (supabase.from('users') as any)
        .select('email, full_name')
        .eq('id', userId)
        .single()

    if (fetchError || !user) {
        return { success: false, error: 'User not found' }
    }

    // 2. Update User Status
    const { error: userError } = await (supabase.from('users') as any)
        .update({ verification_status: 'approved' } as any)
        .eq('id', userId)

    if (userError) {
        return { success: false, error: 'Failed to update user status' }
    }

    // 3. Activate Store
    const { error: storeError } = await (supabase.from('stores') as any)
        .update({ status: 'active' } as any)
        .eq('owner_id', userId)

    if (storeError) {
        // Should we rollback? Ideally yes, but for now log error
        console.error('Failed to activate store for approved user', userId)
        return { success: true, warning: 'User approved but store activation failed' }
    }

    // 4. Send Email Notification
    if (user.email) {
        await sendAccountApprovedEmail({
            email: user.email,
            fullName: user.full_name || 'Partner'
        })
    }

    return { success: true }
}

export async function rejectWholesalerAction(userId: string) {
    const supabase = await createClient()

    // Update User Status
    const { error: userError } = await (supabase.from('users') as any)
        .update({ verification_status: 'rejected' } as any)
        .eq('id', userId)

    if (userError) return { success: false, error: userError.message }

    // Deactivate Store
    await (supabase.from('stores') as any)
        .update({ status: 'inactive' } as any)
        .eq('owner_id', userId)

    return { success: true }
}

export async function sendPolicyEmailAction(email: string, fullName: string) {
    const date = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return await sendPolicyAcceptedEmail({
        email,
        fullName,
        date
    });
}
