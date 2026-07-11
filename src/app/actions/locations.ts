'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type StoreLocation = {
    id: string
    store_id: string
    name: string
    address: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
    phone: string | null
    gallery_urls: string[]
    location_type: 'physical' | 'market_day'
    market_name: string | null
    is_primary: boolean
    is_active: boolean
}

async function getOwnedStoreId(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: store } = await (supabase.from('stores') as any).select('id').eq('owner_id', user.id).single()
    return store?.id ?? null
}

export async function getStoreLocationsAction(): Promise<{ data?: StoreLocation[]; error?: string }> {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { error: 'Not authenticated' }

    const { data, error } = await (supabase.from('store_locations') as any)
        .select('*')
        .eq('store_id', storeId)
        .order('is_primary', { ascending: false })
        .order('created_at')

    if (error) return { error: error.message }
    return { data }
}

export async function addLocationAction(location: {
    name: string
    address?: string
    city?: string
    latitude?: number | null
    longitude?: number | null
    phone?: string
}) {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { success: false, error: 'Not authenticated' }

    if (!location.name?.trim()) {
        return { success: false, error: 'Location name is required' }
    }

    const { error } = await (supabase.from('store_locations') as any).insert({
        store_id: storeId,
        name: location.name.trim(),
        address: location.address || null,
        city: location.city || null,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        phone: location.phone || null,
        location_type: 'physical',
        is_primary: false,
        is_active: true,
    })

    if (error) return { success: false, error: 'Failed to add location' }

    revalidatePath('/seller/profile/edit')
    return { success: true }
}

export async function updateLocationAction(id: string, location: {
    name: string
    address?: string
    city?: string
    latitude?: number | null
    longitude?: number | null
    phone?: string
    is_active?: boolean
}) {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { success: false, error: 'Not authenticated' }

    const { data: locationRow } = await (supabase.from('store_locations') as any)
        .select('is_primary')
        .eq('id', id)
        .eq('store_id', storeId)
        .single()

    if (!locationRow) return { success: false, error: 'Location not found' }

    const { error } = await (supabase.from('store_locations') as any)
        .update({
            name: location.name.trim(),
            address: location.address || null,
            city: location.city || null,
            latitude: location.latitude ?? null,
            longitude: location.longitude ?? null,
            phone: location.phone || null,
            is_active: location.is_active ?? true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) return { success: false, error: 'Failed to update location' }

    // Keep stores' denormalized "primary location" fields (still read by the
    // storefront, seller dashboard, etc.) in sync when the primary location
    // itself is edited, so those read sites don't drift from reality.
    if (locationRow.is_primary) {
        await (supabase.from('stores') as any)
            .update({
                phone: location.phone || null,
                latitude: location.latitude ?? null,
                longitude: location.longitude ?? null,
            })
            .eq('id', storeId)
    }

    revalidatePath('/seller/profile/edit')
    revalidatePath('/store')
    return { success: true }
}

export async function deleteLocationAction(id: string) {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { success: false, error: 'Not authenticated' }

    const { data: locationRow } = await (supabase.from('store_locations') as any)
        .select('is_primary')
        .eq('id', id)
        .eq('store_id', storeId)
        .single()

    if (locationRow?.is_primary) {
        return { success: false, error: 'Cannot delete your primary location. Set another location as primary first.' }
    }

    const { error } = await supabase.from('store_locations').delete().eq('id', id).eq('store_id', storeId)
    if (error) return { success: false, error: 'Failed to delete location' }

    revalidatePath('/seller/profile/edit')
    return { success: true }
}

export async function setPrimaryLocationAction(id: string) {
    const supabase = await createClient()
    const storeId = await getOwnedStoreId(supabase)
    if (!storeId) return { success: false, error: 'Not authenticated' }

    const { data: newPrimary } = await (supabase.from('store_locations') as any)
        .select('*')
        .eq('id', id)
        .eq('store_id', storeId)
        .single()

    if (!newPrimary) return { success: false, error: 'Location not found' }

    await (supabase.from('store_locations') as any).update({ is_primary: false }).eq('store_id', storeId)
    await (supabase.from('store_locations') as any).update({ is_primary: true }).eq('id', id)

    // Mirror the new primary location's fields onto stores so existing
    // single-location read sites keep showing the right address.
    await (supabase.from('stores') as any)
        .update({
            phone: newPrimary.phone,
            latitude: newPrimary.latitude,
            longitude: newPrimary.longitude,
        })
        .eq('id', storeId)

    revalidatePath('/seller/profile/edit')
    revalidatePath('/store')
    return { success: true }
}
