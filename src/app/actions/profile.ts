'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProfileUpdateData {
    phone?: string;
    residentialAddress?: string;
    emergencyContacts?: { name: string, number: string }[];

    // Store updates
    latitude?: number; // For Market Day retailers
    longitude?: number;
}

export async function updateProfile(formData: ProfileUpdateData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // 1. Update User Data
    const updateData: any = {}
    if (formData.phone) updateData.phone = formData.phone
    if (formData.residentialAddress) updateData.residential_address = formData.residentialAddress
    if (formData.emergencyContacts) updateData.emergency_contacts = formData.emergencyContacts

    if (Object.keys(updateData).length > 0) {
        const { error: userError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', user.id)

        if (userError) {
            console.error('User Update Error:', userError)
            return { success: false, error: 'Failed to update user profile' }
        }
    }

    // 2. Update Store Data (e.g. GPS) if provided
    if (formData.latitude !== undefined && formData.longitude !== undefined) {
        // Verify shop_type ? Or just allow update if they own the store.
        // The UI should guard only market_day types to edit this, but backend can be lenient for owner.
        const { error: storeError } = await supabase
            .from('stores')
            .update({
                latitude: formData.latitude,
                longitude: formData.longitude
            })
            .eq('owner_id', user.id)

        if (storeError) {
            console.error('Store Update Error:', storeError)
            return { success: false, error: 'Failed to update store location' }
        }
    }

    revalidatePath('/seller/profile')
    return { success: true }
}
