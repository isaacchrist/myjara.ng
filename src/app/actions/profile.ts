'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProfileUpdateData {
    phone?: string;
    residentialAddress?: string;
    emergencyContacts?: { name: string, number: string }[];
    profilePictureUrl?: string; // New

    // Store updates
    latitude?: number | null;
    longitude?: number | null;
    storeDescription?: string;
    categories?: string[]; // Array of category IDs
}

export async function updateProfile(formData: ProfileUpdateData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // 0. CHECK PHONE UNIQUENESS (if changing phone)
    if (formData.phone) {
        const { data: existingPhone } = await (supabase.from('users') as any)
            .select('id')
            .eq('phone', formData.phone)
            .neq('id', user.id) // Exclude current user
            .maybeSingle()

        if (existingPhone) {
            return { success: false, error: 'This phone number is already in use by another account.' }
        }
    }

    // 1. Update User Data
    const updateData: Record<string, any> = {}
    if (formData.phone) updateData.phone = formData.phone
    if (formData.residentialAddress) updateData.residential_address = formData.residentialAddress
    if (formData.emergencyContacts) updateData.emergency_contacts = formData.emergencyContacts
    if (formData.profilePictureUrl) updateData.avatar_url = formData.profilePictureUrl

    if (Object.keys(updateData).length > 0) {
        const { error: userError } = await (supabase
            .from('users') as any)
            .update(updateData)
            .eq('id', user.id)

        if (userError) {
            console.error('User Update Error:', userError)
            return { success: false, error: 'Failed to update user profile' }
        }
    }

    // 2. Update Store Data (Sync Public Info)
    const storeUpdate: Record<string, any> = {}

    if (formData.latitude !== undefined && formData.longitude !== undefined) {
        storeUpdate.latitude = formData.latitude
        storeUpdate.longitude = formData.longitude
    }

    if (formData.storeDescription !== undefined) {
        storeUpdate.description = formData.storeDescription
    }

    if (formData.categories && formData.categories.length > 0) {
        storeUpdate.categories = formData.categories
    }

    // SYNC Public Contact Info
    if (formData.phone) storeUpdate.phone = formData.phone
    if (formData.profilePictureUrl) storeUpdate.profile_picture_url = formData.profilePictureUrl

    if (Object.keys(storeUpdate).length > 0) {
        const { error: storeError } = await (supabase
            .from('stores') as any)
            .update(storeUpdate)
            .eq('owner_id', user.id)

        if (storeError) {
            console.error('Store Update Error:', storeError)
            return { success: false, error: 'Failed to update store information' }
        }
    }

    revalidatePath('/seller/profile')
    revalidatePath('/seller/dashboard')
    revalidatePath(`/store/${user.user_metadata?.store_slug}`) // Try to invalidate store page if possible (slug unknown here, but maybe not critical)
    return { success: true }
}
