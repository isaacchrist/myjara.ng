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

    // 1. Create Auth User Silently (using Admin API to prevent auto-email)
    // We create the account but keeping it 'pending' is handled by the Store Status.
    // The user wants the email to be sent ONLY after verification.
    const admin = await createAdminClient()

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true, // Auto-verify email so we don't depend on user clicking a link immediately
        user_metadata: {
            full_name: formData.fullName,
            role: 'retailer',
            phone: formData.phone,
            shop_type: formData.shopType,
            business_name: formData.businessName
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

    // 2. Insert Store Data (Using Admin Client)

    // 2a. Manually Create Public User (Bypass Trigger reliability issues)
    const { error: publicUserError } = await admin.from('users').insert({
        id: userId,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'retailer',
        avatar_url: formData.profilePictureUrl
    } as any)

    if (publicUserError) {
        // If it already exists (duplicate key), we might be fine if the trigger beat us to it.
        // But if it's a real error, we should log it.
        if (!publicUserError.message.includes('duplicate key')) {
            console.error('Public User Create Error:', publicUserError)
            return { success: false, error: 'Failed to create user record: ' + publicUserError.message }
        }
    }

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

export async function registerBrand(formData: RegistrationData) {
    console.log('--- Register Brand (Wholesaler) Action Started ---')

    // 1. Create Auth User Silently
    const admin = await createAdminClient()

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
            full_name: formData.fullName,
            role: 'brand_admin', // Wholesaler Role
            phone: formData.phone,
            shop_type: 'wholesaler',
            business_name: formData.businessName
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
    console.log('Brand User Created:', userId)

    // 2. Manually Create Public User
    const { error: publicUserError } = await admin.from('users').insert({
        id: userId,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'brand_admin',
        avatar_url: formData.profilePictureUrl
    } as any)

    if (publicUserError && !publicUserError.message.includes('duplicate key')) {
        console.error('Public User Create Error:', publicUserError)
        return { success: false, error: 'Failed to create user record: ' + publicUserError.message }
    }

    // 3. Insert Store Data
    const storeSlug = (formData.businessName || formData.fullName || 'brand')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + userId.substring(0, 4)

    const storeData: any = {
        owner_id: userId,
        name: formData.businessName || formData.fullName,
        slug: storeSlug,
        description: formData.businessDescription || 'Wholesaler Account',
        status: 'pending',
        shop_type: 'brand',
        market_name: formData.marketName,
        latitude: formData.latitude,
        longitude: formData.longitude,
    }

    const { error: storeError } = await admin
        .from('stores')
        .insert(storeData)

    if (storeError) {
        console.error('Store Insert Error:', storeError)
        return {
            success: false,
            error: `Account created but Store data failed to save: ${storeError.message}`
        }
    }

    return { success: true }
}
