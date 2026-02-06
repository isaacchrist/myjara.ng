'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function forgotPassword(email: string) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
        console.error('Forgot Password Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        console.error('Update Password Error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
