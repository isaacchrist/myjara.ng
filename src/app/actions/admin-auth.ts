'use server'

import { createClient } from '@/lib/supabase/server' // Use server client
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_COOKIE = 'myjara_admin_session'
const STORE_ADMIN_COOKIE = 'myjara_store_admin_session'

export async function loginWithKey(key: string) {
    // 1. Check Global Admin Key
    if (process.env.ADMIN_SECRET_KEY && key === process.env.ADMIN_SECRET_KEY) {
        cookies().set(ADMIN_COOKIE, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        })
        return { success: true, type: 'global', redirect: '/admin/dashboard' }
    }

    // 2. Check Store Key
    // We need a Supabase client with Service Role to search hidden keys?
    // Actually, standard RLS might hide 'admin_access_key' from public. 
    // We should usually use the Service Role key for this check if RLS hides it.
    // For now, let's assume we can query it or use a secure RPC.

    // WARNING: 'createClient' usually uses the user's session. 
    // Here we might need a service role client to query sensitive keys safely.
    // Assuming for this prototype we are okay querying it if RLS allows, 
    // OR we use the direct SQL query via a secure function.

    // To be safe and simple without service role setup in this file context:
    // We will query the table. If RLS blocks it, we need to adjust RLS or use Service Role.
    // Let's assume we have read access to verify.

    const supabase = createClient()

    // Note: This query might fail if RLS prevents reading 'admin_access_key'.
    // Ideally, we'd have a Postgres function `check_store_key(key)` that returns the store_id.
    // Let's try direct query first.
    const { data: store, error } = await supabase
        .from('stores')
        .select('id, owner_id, slug')
        .eq('admin_access_key', key)
        .single()

    if (store && !error) {
        // Create a synthetic session or just a cookie indicating we are admin for THIS store
        // We can't easily "log in" as the user without their password via Supabase Auth here.
        // SO, we will set a special cookie that our middleware/layout respects.

        // We'll store the store_id in the cookie
        cookies().set(STORE_ADMIN_COOKIE, store.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        })

        // We probably want to redirect to that store's dashboard.
        // But the dashboard heavily relies on `supabase.auth.getUser()`.
        // If we bypass auth, the dashboard might break.
        // TRICKY: The user wants "Key Auth".
        // Solution: We might need to impersonate or have the dashboard support "Key Session".
        // For now, let's redirect to dashboard and see if we can patch the layout to read this cookie as fallback.

        return { success: true, type: 'store', redirect: '/dashboard' }
    }

    return { success: false, error: 'Invalid Access Key' }
}


export async function logoutAdmin() {
    cookies().delete(ADMIN_COOKIE)
    cookies().delete(STORE_ADMIN_COOKIE)
    redirect('/admin/login')
}

export async function getStoreSession() {
    const storeId = cookies().get(STORE_ADMIN_COOKIE)?.value
    return storeId || null
}
