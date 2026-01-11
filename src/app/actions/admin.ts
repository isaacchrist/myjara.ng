'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from './admin-auth'

export async function getVerificationQueue() {
    // 1. Check Admin Session
    const isAdmin = await getAdminSession()
    if (!isAdmin) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // 2. Use Admin Client (Service Role) to bypass RLS
        const supabase = await createAdminClient()

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', ['brand_admin', 'retailer'])
            .eq('verification_status', 'pending')
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Error fetching verification queue:', error)
        return { success: false, error: error.message }
    }
}
