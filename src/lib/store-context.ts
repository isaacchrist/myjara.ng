import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getActiveStore() {
    const cookieStore = await cookies()
    const activeStoreId = cookieStore.get('myjara_active_store')?.value

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch all stores for the user
    // We explicitly cast the result or use a defined type if available, but for now 'any[]' avoids the 'never' inference
    const { data: stores } = await supabase
        .from('stores')
        .select('id, name, slug, shop_type, status, role:owner_id')
        .eq('owner_id', user.id) as { data: any[] | null }

    if (!stores || stores.length === 0) return null

    // If activeStoreId is set and valid, return it
    if (activeStoreId) {
        const activeStore = stores.find(s => s.id === activeStoreId)
        if (activeStore) return { activeStore, stores }
    }

    return { activeStore: stores[0], stores }
}
