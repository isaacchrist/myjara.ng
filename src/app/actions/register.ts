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
    categories?: string[]; // Array of category IDs (New)
    categoryId: string;
    subcategoryId: string;
    agreedToPolicy: boolean;
    profilePictureUrl?: string; // Optional

    // New Fields for Persistence
    selectedPlan?: 'basic' | 'pro' | 'exclusive';
    promoCode?: string;
    choosenMarkets?: string[]; // Array of strings
}

export async function registerRetailer(formData: RegistrationData) {
    console.log('--- Register Retailer Action Started ---')
    console.log('Email:', formData.email)

    const admin = await createAdminClient()

    // 0. CHECK PHONE UNIQUENESS
    if (formData.phone) {
        const { data: existingPhone } = await (admin.from('users') as any)
            .select('id')
            .eq('phone', formData.phone)
            .maybeSingle()

        if (existingPhone) {
            return { success: false, error: 'This phone number is already registered. Please use a different number.' }
        }
    }

    // 1. Create Auth User Silently (using Admin API)
    let userId: string | null = null;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
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
        // RECOVERY: If user exists, check if we can proceed
        if (authError.message.includes('already registered') || authError.message.includes('unique constraint')) {
            console.log('User exists. Checking if store exists...')

            // Fetch the user ID by email
            // Note: 'get_user_id_by_email' might not exist or have different signature. 
            // We rely on the public table check primarily.

            const { data: publicUser } = await admin.from('users').select('id, role').eq('email', formData.email).single() as any

            if (publicUser && publicUser.id) {
                userId = publicUser.id
                console.log('Found user in public table:', userId)

                // Check if they already have a store
                const { data: existingStore } = await admin.from('stores').select('id').eq('owner_id', userId as string).single()
                if (existingStore) {
                    return { success: false, error: 'User already has a registered store. Please Log In.' }
                }
                // If no store, we proceed to create it (Recovery Mode)
                console.log('User exists but no store. Proceeding to store creation.')
            } else {
                return { success: false, error: 'Account exists in Auth but not Public. Contact Support or use different email.' }
            }
        } else {
            return { success: false, error: authError.message }
        }
    } else {
        if (!authData.user || !authData.user.id) {
            return { success: false, error: 'User creation failed (no ID returned).' }
        }
        userId = authData.user.id
        console.log('Auth User Created:', userId)

        // 2a. Manually Create Public User - MOVED BELOW to run for all paths
        // This ensures existing users also get updated with new metadata (avatar path, etc)
    }



    if (!userId) return { success: false, error: 'Could not determine User ID.' }

    // 2. Ensuring Public User Logic (Run effectively as upsert for both paths)
    // This is critical because if user came from trigger or existing auth, they might lack avatar/phone
    const { error: publicUserError } = await admin.from('users').upsert({
        id: userId,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'retailer',
        avatar_url: formData.profilePictureUrl,
        // NEW FIELDS (Phase 9)
        sex: formData.sex,
        date_of_birth: formData.dateOfBirth,
        residential_address: formData.residentialAddress,
        emergency_contacts: [] // Initialize empty array
    } as any, { onConflict: 'id' })

    if (publicUserError && !publicUserError.message.includes('duplicate key')) {
        console.error('Public User Create/Update Error:', publicUserError)
        return { success: false, error: 'Failed to update user record: ' + publicUserError.message }
    }

    // Prepare Store Data
    const storeSlug = (formData.businessName || formData.fullName || 'store')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + userId.substring(0, 4)

    // Calculate expiry (1 month trial or pay immediately? Requirement says "1 month from registration to block")
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    const storeData: any = {
        owner_id: userId,
        name: formData.businessName || formData.fullName,
        slug: storeSlug,
        description: formData.businessDescription || 'Retailer Account',
        status: 'pending',
        shop_type: formData.shopType,
        market_name: formData.marketName,
        latitude: formData.latitude,
        longitude: formData.longitude,

        // NEW FIELDS
        subscription_plan: formData.selectedPlan || 'basic',
        subscription_expiry: expiryDate.toISOString(),
        payment_status: 'trial',
        categories: formData.categories && formData.categories.length > 0
            ? formData.categories
            : [formData.categoryId, formData.subcategoryId].filter(Boolean),
        frequent_markets: formData.choosenMarkets || [],

        // Public Contact Info (Synced for visibility)
        phone: formData.phone,
        profile_picture_url: formData.profilePictureUrl,
    }

    // Map usage of categories if passed differently
    // Actually the interface has categoryId (single).
    // User said: "selection... should not be restricted to 1... limited to 5".
    // I need to update the Interface to accept an array if I want to support multiple.
    // For now, I persist what I have.

    console.log('Inserting Store Data:', storeData)

    // Check if store was already created by trigger
    const { data: existingTriggerStore } = await admin
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle() as any

    let storeError = null

    if (existingTriggerStore) {
        // UPDATE existing store
        console.log('Trigger created store found. Updating with full data...')
        const { error } = await (admin as any)
            .from('stores')
            .update(storeData)
            .eq('id', existingTriggerStore.id)
        storeError = error
    } else {
        // INSERT new store
        const { error } = await admin
            .from('stores')
            .insert(storeData)
        storeError = error
    }

    if (storeError) {
        console.error('Store Insert Error:', storeError)
        return {
            success: false,
            error: `Account created but Store data failed to save: ${storeError.message}`
        }
    }

    console.log('Store Created Successfully')
    return { success: true }
}

export async function registerBrand(formData: RegistrationData) {
    console.log('--- Register Brand (Wholesaler) Action Started ---')

    const admin = await createAdminClient()

    // 1. Create Auth User Silently
    let userId: string | null = null;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
            full_name: formData.fullName,
            role: 'brand_admin', // Wholesaler Role
            phone: formData.phone,
            shop_type: 'brand',
            business_name: formData.businessName
        }
    })

    if (authError) {
        console.error('Auth Error:', authError)
        // RECOVERY
        if (authError.message.includes('already registered') || authError.message.includes('unique constraint')) {
            console.log('User exists (Brand). Checking if store exists...')
            const { data: publicUser } = await admin.from('users').select('id, role').eq('email', formData.email).single() as any

            if (publicUser && publicUser.id) {
                userId = publicUser.id
                console.log('Found user in public table:', userId)

                // Check if they already have a store
                const { data: existingStore } = await admin.from('stores').select('id').eq('owner_id', userId as string).single()
                if (existingStore) {
                    return { success: false, error: 'User already has a registered store. Please Log In.' }
                }
                console.log('User exists but no store. Proceeding to store creation.')
            } else {
                return { success: false, error: 'Account exists in Auth but not Public. Contact Support.' }
            }
        } else {
            return { success: false, error: authError.message }
        }
    } else {
        if (!authData.user || !authData.user.id) {
            return { success: false, error: 'User creation failed (no ID returned).' }
        }
        userId = authData.user.id
        console.log('Brand User Created:', userId)

        // 2. Manually Create Public User - MOVED BELOW to run for all paths
    }



    if (!userId) return { success: false, error: 'Could not determine User ID.' }

    // 2. Ensuring Public User Logic (Run effectively as upsert for both paths)
    const { error: publicUserError } = await admin.from('users').upsert({
        id: userId,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'brand_admin',
        avatar_url: formData.profilePictureUrl,
        // NEW FIELDS (Phase 9)
        sex: formData.sex,
        date_of_birth: formData.dateOfBirth,
        residential_address: formData.residentialAddress,
        emergency_contacts: [] // Initialize empty array
    } as any, { onConflict: 'id' })

    if (publicUserError && !publicUserError.message.includes('duplicate key')) {
        console.error('Public User Create/Update Error:', publicUserError)
    }

    // 3. Insert Store Data
    const storeSlug = (formData.businessName || formData.fullName || 'brand')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + userId.substring(0, 4)

    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1)

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

        // DEFAULTS FOR WHOLESALERS
        subscription_plan: 'pro', // Assume Wholesalers get Pro or Custom features? Or 'basic'.
        subscription_expiry: expiryDate.toISOString(),
        payment_status: 'trial',
        categories: [],
        frequent_markets: [],

        // Public Contact Info (Synced for visibility on storefront)
        phone: formData.phone,
        profile_picture_url: formData.profilePictureUrl,
    }

    // Check if store was already created by trigger
    const { data: existingBrandStore } = await admin
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle() as any

    let storeError = null

    if (existingBrandStore) {
        // UPDATE existing store
        const { error } = await (admin as any)
            .from('stores')
            .update(storeData)
            .eq('id', existingBrandStore.id)
        storeError = error
    } else {
        // INSERT new store
        const { error } = await admin
            .from('stores')
            .insert(storeData)
        storeError = error
    }

    if (storeError) {
        console.error('Store Insert Error:', storeError)
        return {
            success: false,
            error: `Account created but Store data failed to save: ${storeError.message}`
        }
    }

    return { success: true }
}
