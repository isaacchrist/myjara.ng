'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface RegistrationData {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    dateOfBirth: string;
    sex: string;
    residentialAddress: string;

    // Business
    businessName: string;
    businessDescription?: string;
    shopType: string;

    // Location
    latitude: number | null;
    longitude: number | null;
    marketName: string | null;
    accuracy: number;

    // Meta
    categoryId: string;
    subcategoryId: string;
    agreedToPolicy: boolean;
    profilePictureUrl?: string; // Optional
}

export async function registerRetailer(formData: RegistrationData) {
    console.log('--- Register Retailer Action Started ---')
    console.log('Email:', formData.email)

    // 1. Create Auth User (Standard SignUp to trigger emails etc.)
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                full_name: formData.fullName,
                role: 'retailer', // Important for triggers/RLS later
                phone: formData.phone,
                shop_type: formData.shopType, // Redundant but good for metadata
                business_name: formData.businessName
            }
        }
    })

    if (authError) {
        console.error('Auth Error:', authError)
        return { success: false, error: authError.message }
    }

    if (!authData.user || !authData.user.id) {
        return { success: false, error: 'User creation failed (no ID returned).' }
    }

    const userId = authData.user.id
    console.log('Auth User Created:', userId)

    // 2. Insert Store Data (Using Admin Client to bypass RLS/Verification)
    const admin = await createAdminClient()

    // Prepare Store Data
    const storeSlug = (formData.businessName || formData.fullName || 'store')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + userId.substring(0, 4)

    const storeData: any = {
        owner_id: userId,
        name: formData.businessName || formData.fullName,
        slug: storeSlug,
        description: formData.businessDescription || 'Retailer Account',
        status: 'pending', // Waiting for Admin Verification
        shop_type: formData.shopType,
        market_name: formData.marketName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        // profile_image: formData.profilePictureUrl // If DB has this column
    }

    console.log('Inserting Store Data:', storeData)

    const { error: storeError } = await admin
        .from('stores')
        .insert(storeData)

    if (storeError) {
        console.error('Store Insert Error:', storeError)

        // Critical: If store creation fails, we might want to delete the user? 
        // Or just let the user exist but return an error?
        // Let's return the error so the UI shows it.
        return {
            success: false,
            error: `Account created but Store data failed to save: ${storeError.message}. Details: ${storeError.details}`
        }
    }

    console.log('Store Created Successfully')
    return { success: true }
}
