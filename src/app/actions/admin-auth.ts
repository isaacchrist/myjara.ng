'use server'

import { createClient } from '@/lib/supabase/server' // Use server client
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_COOKIE = 'myjara_admin_session'
const STORE_ADMIN_COOKIE = 'myjara_store_admin_session'

export async function loginWithKey(key: string, expectedSlug?: string) {
    // 1. Check Global Admin Key
    if (process.env.ADMIN_SECRET_KEY && key === process.env.ADMIN_SECRET_KEY) {
        // If they provided a slug but logged in with Master Key, we still allow it?
        // Usually yes, Master Admin can see everything.
        const cookieStore = await cookies()
        cookieStore.set(ADMIN_COOKIE, 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        })

        // If they were at a store admin page, redirect back there but with admin privileges?
        // For now, Master Key always goes to Global Admin Dashboard unless at a sub-route.
        return { success: true, type: 'global', redirect: expectedSlug ? `/store/${expectedSlug}/admin` : '/admin' }
    }

    // 2. Check Store Key
    const supabase = await createClient()

    let query = (supabase.from('stores') as any)
        .select('id, owner_id, slug')
        .eq('admin_access_key', key)

    if (expectedSlug) {
        query = query.eq('slug', expectedSlug)
    }

    const { data: store, error } = await query.single()

    if (store && !error) {
        const cookieStore = await cookies()
        cookieStore.set(STORE_ADMIN_COOKIE, store.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        })

        return { success: true, type: 'store', redirect: '/dashboard' }
    }

    return { success: false, error: 'Invalid Access Key' }
}

export async function logoutAdmin(redirectTo: string = '/admin') {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE)
    cookieStore.delete(STORE_ADMIN_COOKIE)
    redirect(redirectTo)
}

export async function getStoreSession() {
    const cookieStore = await cookies()
    const storeId = cookieStore.get(STORE_ADMIN_COOKIE)?.value
    return storeId || null
}

export async function getAdminSession() {
    const cookieStore = await cookies()
    return cookieStore.get(ADMIN_COOKIE)?.value === 'true'
}
