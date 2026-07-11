'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server' // Use server client
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ADMIN_COOKIE = 'myjara_admin_session'

// Master key login -- a single shared secret (ADMIN_SECRET_KEY env var),
// kept intentionally as a break-glass fallback alongside real per-admin
// accounts (adminUserLoginAction below). Grants the same /admin/* access as
// a platform_admin account, but is not tied to any individual identity and
// must never be usable to reach an individual tenant's own dashboard --
// that per-store bypass (stores.admin_access_key) has been removed
// entirely, see 029_remove_store_admin_key.sql.
export async function loginWithKey(key: string) {
    if (!process.env.ADMIN_SECRET_KEY || key !== process.env.ADMIN_SECRET_KEY) {
        return { success: false, error: 'Invalid Access Key' }
    }

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_COOKIE, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
    })

    return { success: true, redirect: '/admin' }
}

// Real per-admin login: an actual users row with role = 'platform_admin',
// authenticated the same way every other account on the platform is
// (email/password via Supabase auth), so each admin action is attributable
// to a real identity (and their admin- tag) instead of one shared key.
export async function adminUserLoginAction(email: string, password: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
        return { success: false, error: 'Invalid email or password' }
    }

    const { data: profile } = await (supabase.from('users') as any)
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

    if (profile?.role !== 'platform_admin') {
        await supabase.auth.signOut()
        return { success: false, error: 'This account does not have admin access' }
    }

    return { success: true, redirect: '/admin' }
}

export async function logoutAdmin(redirectTo: string = '/admin') {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE)

    // Also end a real-user admin session, if that's how they logged in.
    const supabase = await createClient()
    await supabase.auth.signOut()

    redirect(redirectTo)
}

// True if the caller has EITHER a valid master-key session OR is signed in
// as a real platform_admin user. Kept as a plain boolean for the existing
// call sites that just need a yes/no gate; use getAdminIdentity() where the
// caller (which admin, for audit/display) actually matters.
export async function getAdminSession() {
    const cookieStore = await cookies()
    if (cookieStore.get(ADMIN_COOKIE)?.value === 'true') {
        return true
    }

    const identity = await getAdminIdentity()
    return identity !== null
}

export type AdminIdentity =
    | { type: 'master' }
    | { type: 'user'; id: string; fullName: string; tag: string | null }

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
    const cookieStore = await cookies()
    if (cookieStore.get(ADMIN_COOKIE)?.value === 'true') {
        return { type: 'master' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await (supabase.from('users') as any)
        .select('full_name, tag, role')
        .eq('id', user.id)
        .maybeSingle()

    if (profile?.role !== 'platform_admin') return null

    return { type: 'user', id: user.id, fullName: profile.full_name, tag: profile.tag }
}

// Admin-only: create another platform_admin account. Callable only from an
// already-authenticated admin session (master key or existing admin user).
export async function createAdminAccountAction(data: { email: string; password: string; fullName: string }) {
    const isAdmin = await getAdminSession()
    if (!isAdmin) {
        return { success: false, error: 'Unauthorized' }
    }

    const admin = await createAdminClient()

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            full_name: data.fullName,
            role: 'platform_admin'
        }
    })

    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create admin account' }
    }

    const { error: upsertError } = await admin.from('users').upsert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: 'platform_admin',
        verification_status: 'approved'
    } as any, { onConflict: 'id' })

    if (upsertError) {
        return { success: false, error: upsertError.message }
    }

    return { success: true }
}

export async function listAdminAccountsAction() {
    const isAdmin = await getAdminSession()
    if (!isAdmin) return []

    const admin = await createAdminClient()
    const { data } = await admin
        .from('users')
        .select('id, full_name, email, tag, created_at')
        .eq('role', 'platform_admin')
        .order('created_at', { ascending: false })

    return data || []
}
