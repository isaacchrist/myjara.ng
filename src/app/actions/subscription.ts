'use server'

import { createClient } from '@/lib/supabase/server'

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
