'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProfileUpdateData {
    // Personal identity (users) -- registration-collected, now editable.
    // email / date_of_birth are deliberately NOT here: they stay locked and
    // change only through support (email is the auth identity, DOB is KYC data).
    fullName?: string;
    sex?: string;

    phone?: string;
    residentialAddress?: string;
    emergencyContacts?: { name: string, number: string }[];
    profilePictureUrl?: string; // New

    // Store updates
    latitude?: number | null;
    longitude?: number | null;
    storeDescription?: string;
    categories?: string[]; // Array of category IDs (parents and/or subcategories, flat)

    // Brand/wholesaler trading profile -- operational data that legitimately
    // changes over time, so editable here. The legal-identity fields
    // (legal_name, registration_type, rc_number, tax_id_number, nafdac_number)
    // are intentionally NOT editable -- those route through support.
    salesModel?: string;
    expectedOrderVolume?: string;
    minimumOrderQuantity?: string;
    offersDelivery?: string;
    deliveryCoverageArea?: string;
    paymentTerms?: string;
    yearsInBusiness?: number | null;

    // Settlement Account
    bankName?: string;
    accountNumber?: string;
    accountName?: string;

    // Store Gallery
    galleryUrls?: string[];

    // Market Day Locations
    frequentMarkets?: string[];

    // Social Links (merged into stores.settings.social, alongside theme)
    socialLinks?: { facebook?: string; instagram?: string; twitter?: string; whatsapp?: string; tiktok?: string };

    // Brand color (merged into stores.settings.theme.primaryColor, alongside social)
    themeColor?: string;
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
    if (formData.fullName !== undefined) updateData.full_name = formData.fullName
    if (formData.sex !== undefined) updateData.sex = formData.sex
    if (formData.phone !== undefined) updateData.phone = formData.phone
    if (formData.residentialAddress !== undefined) updateData.residential_address = formData.residentialAddress
    if (formData.emergencyContacts !== undefined) updateData.emergency_contacts = formData.emergencyContacts
    if (formData.profilePictureUrl !== undefined) updateData.avatar_url = formData.profilePictureUrl

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

    if (formData.categories !== undefined) {
        storeUpdate.categories = formData.categories
    }

    // SYNC Public Contact Info
    if (formData.phone !== undefined) storeUpdate.phone = formData.phone
    if (formData.profilePictureUrl !== undefined) storeUpdate.profile_picture_url = formData.profilePictureUrl

    // Settlement Account
    if (formData.bankName !== undefined) storeUpdate.bank_name = formData.bankName
    if (formData.accountNumber !== undefined) storeUpdate.account_number = formData.accountNumber
    if (formData.accountName !== undefined) storeUpdate.account_name = formData.accountName

    // Gallery URLs
    if (formData.galleryUrls !== undefined) storeUpdate.gallery_urls = formData.galleryUrls

    // Market Day Locations
    if (formData.frequentMarkets !== undefined) storeUpdate.frequent_markets = formData.frequentMarkets

    // Brand/wholesaler trading profile (operational, editable). DB CHECK
    // constraints (035) restrict sales_model to b2b|b2c|both and offers_delivery
    // to delivery|pickup_only|both -- the edit UI only offers those values.
    if (formData.salesModel !== undefined) storeUpdate.sales_model = formData.salesModel || null
    if (formData.expectedOrderVolume !== undefined) storeUpdate.expected_order_volume = formData.expectedOrderVolume || null
    if (formData.minimumOrderQuantity !== undefined) storeUpdate.minimum_order_quantity = formData.minimumOrderQuantity || null
    if (formData.offersDelivery !== undefined) storeUpdate.offers_delivery = formData.offersDelivery || null
    if (formData.deliveryCoverageArea !== undefined) storeUpdate.delivery_coverage_area = formData.deliveryCoverageArea || null
    if (formData.paymentTerms !== undefined) storeUpdate.payment_terms = formData.paymentTerms || null
    if (formData.yearsInBusiness !== undefined) storeUpdate.years_in_business = formData.yearsInBusiness

    // Social Links / theme color -- settings is a shared JSONB blob, so merge
    // rather than overwrite. Both share one fetch so setting both in the same
    // call doesn't clobber one with a stale read of the other.
    if (formData.socialLinks !== undefined || formData.themeColor !== undefined) {
        const { data: existingStore } = await (supabase.from('stores') as any)
            .select('settings')
            .eq('owner_id', user.id)
            .single()
        const existingSettings = existingStore?.settings || {}
        storeUpdate.settings = {
            ...existingSettings,
            ...(formData.socialLinks !== undefined && { social: formData.socialLinks }),
            ...(formData.themeColor !== undefined && {
                theme: { ...(existingSettings.theme || {}), primaryColor: formData.themeColor },
            }),
        }
    }

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
