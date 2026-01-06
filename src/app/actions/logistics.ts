"use server"

import { createClient } from "@/lib/supabase/server"

export async function getLogisticsForStoresAction(storeIds: string[]) {
    const supabase = await createClient()

    if (!storeIds || storeIds.length === 0) return []

    const { data, error } = await supabase
        .from('store_logistics')
        .select('*')
        .in('store_id', storeIds)
        .eq('is_active', true)

    if (error) {
        console.error("Error fetching logistics:", error)
        return []
    }

    return data
}
