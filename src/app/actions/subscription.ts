'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function validatePromoCodeAction(code: string) {
    // Validation can stay as anon/user client
    const supabase = await createClient()
    const { data, error } = await (supabase.from('promo_codes') as any)
        .select('*')
        .eq('code', code)
        .single()

    if (error || !data) {
        return { success: false, error: 'Invalid promo code' }
    }

    if (data.valid_until && new Date(data.valid_until) < new Date()) {
        return { success: false, error: 'Promo code expired' }
    }

    if (data.max_uses && data.uses_count >= data.max_uses) {
        return { success: false, error: 'Promo code usage limit reached' }
    }

    return { success: true, discount: data.discount_percentage, code: data.code }
}

export async function createSubscriptionAction(userId: string, planId: string, method: 'flutterwave' | 'promo_code', refOrCode: string) {
    // USE ADMIN CLIENT to bypass RLS during registration flow
    const supabase = await createAdminClient()
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 Month validity

    // If promo code, verify again and increment usage
    if (method === 'promo_code') {
        // Note: We validate using the simple client in separate function, but here we trust the logic.
        // Re-validating briefly:
        const { success } = await validatePromoCodeAction(refOrCode)
        if (!success) return { success: false, error: 'Invalid or expired promo code' }

        // Increment usage (RPC called as Admin)
        await (supabase as any).rpc('increment_promo_usage', { code_input: refOrCode })
    }

    // Create Subscription
    const { error } = await (supabase.from('subscriptions') as any).insert({
        user_id: userId,
        plan_type: planId,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        payment_method: method,
        flutterwave_ref: method === 'flutterwave' ? refOrCode : null
    })

    if (error) {
        console.error("Sub Error", error)
        return { success: false, error: error.message || 'Failed to create subscription' }
    }

    return { success: true }
}

export async function checkSubscriptionStatus(userId: string) {
    const supabase = await createClient()
    const { data } = await (supabase.from('subscriptions') as any)
        .select('status, current_period_end, plan_type')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

    if (!data) return { active: false, inGracePeriod: false }

    const now = new Date()
    const expiry = new Date(data.current_period_end)
    const expiryPlus24h = new Date(expiry.getTime() + 24 * 60 * 60 * 1000)

    if (now > expiryPlus24h) {
        // Hard Lock
        return { active: false, inGracePeriod: false, reason: 'expired_locked' }
    } else if (now > expiry) {
        // Grace Period
        return { active: true, inGracePeriod: true, plan: data.plan_type }
    } else {
        // Active
        return { active: true, inGracePeriod: false, plan: data.plan_type }
    }
}
