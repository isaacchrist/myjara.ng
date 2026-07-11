'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/app/actions/admin-auth'
import { revalidatePath } from 'next/cache'

export type SubscriptionPlan = {
    id: string
    shop_type: 'physical' | 'online' | 'market_day' | 'brand'
    plan_key: string
    name: string
    price: number
    features: string[]
    sort_order: number
    is_active: boolean
}

// Public: used by the subscription purchase flow and registration plan
// picker. Only returns active plans.
export async function getActivePlansAction(shopType: string): Promise<SubscriptionPlan[]> {
    const supabase = await createClient()
    const { data } = await (supabase.from('subscription_plans') as any)
        .select('*')
        .eq('shop_type', shopType)
        .eq('is_active', true)
        .order('sort_order')

    return data || []
}

// Admin-only: all plans (including inactive), grouped by shop_type in the UI.
export async function getAllPlansForAdminAction(): Promise<SubscriptionPlan[]> {
    if (!(await getAdminSession())) return []

    const admin = await createAdminClient()
    const { data } = await (admin.from('subscription_plans') as any)
        .select('*')
        .order('shop_type')
        .order('sort_order')

    return data || []
}

export async function upsertPlanAction(plan: Partial<SubscriptionPlan> & { shop_type: string; plan_key: string }) {
    if (!(await getAdminSession())) {
        return { success: false, error: 'Unauthorized' }
    }

    const admin = await createAdminClient()
    const payload = {
        shop_type: plan.shop_type,
        plan_key: plan.plan_key,
        name: plan.name,
        price: plan.price,
        features: plan.features,
        sort_order: plan.sort_order,
        is_active: plan.is_active,
        updated_at: new Date().toISOString(),
    }

    const { error } = plan.id
        ? await (admin.from('subscription_plans') as any).update(payload).eq('id', plan.id)
        : await (admin.from('subscription_plans') as any).insert(payload)

    if (error) {
        console.error('Upsert plan error:', error)
        return { success: false, error: error.code === '23505' ? 'A plan with that key already exists for this shop type' : 'Failed to save plan' }
    }

    revalidatePath('/admin/pricing')
    return { success: true }
}

export async function deletePlanAction(id: string) {
    if (!(await getAdminSession())) {
        return { success: false, error: 'Unauthorized' }
    }

    const admin = await createAdminClient()
    const { error } = await admin.from('subscription_plans').delete().eq('id', id)

    if (error) {
        console.error('Delete plan error:', error)
        return { success: false, error: 'Failed to delete plan' }
    }

    revalidatePath('/admin/pricing')
    return { success: true }
}
