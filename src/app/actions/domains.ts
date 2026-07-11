'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import dns from 'dns/promises'
import crypto from 'crypto'

async function getOwnedStoreId(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: store } = await (supabase.from('stores') as any).select('id').eq('owner_id', user.id).single()
    return store?.id ?? null
}

export async function getStoreDomainsAction() {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('store_domains')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}

export async function addCustomDomainAction(rawDomain: string) {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { error: 'Not authenticated' }

    const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) {
        return { error: 'Enter a valid domain, e.g. shop.yourbrand.com' }
    }

    const verificationToken = crypto.randomBytes(12).toString('hex')

    const { data, error } = await (supabase.from('store_domains') as any)
        .insert({ store_id: storeId, domain, type: 'custom', is_verified: false, verification_token: verificationToken })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') return { error: 'That domain is already connected to a store.' }
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { data }
}

export async function verifyCustomDomainAction(domainId: string) {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { error: 'Not authenticated' }

    const { data: domainRow, error: fetchError } = await (supabase.from('store_domains') as any)
        .select('*')
        .eq('id', domainId)
        .eq('store_id', storeId)
        .single()

    if (fetchError || !domainRow) return { error: 'Domain not found' }
    if (domainRow.is_verified) return { data: domainRow }

    let records: string[][] = []
    try {
        records = await dns.resolveTxt(`_myjara-verify.${domainRow.domain}`)
    } catch {
        return { error: 'Verification TXT record not found yet. DNS changes can take a few hours to propagate — try again shortly.' }
    }

    const matches = records.some((chunks) => chunks.join('').trim() === `myjara-verify=${domainRow.verification_token}`)
    if (!matches) {
        return { error: 'Found a TXT record but the value did not match. Double-check you copied it exactly.' }
    }

    const { data, error } = await (supabase.from('store_domains') as any)
        .update({ is_verified: true })
        .eq('id', domainId)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { data }
}

export async function removeCustomDomainAction(domainId: string) {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { error: 'Not authenticated' }

    const { error } = await supabase.from('store_domains').delete().eq('id', domainId).eq('store_id', storeId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
