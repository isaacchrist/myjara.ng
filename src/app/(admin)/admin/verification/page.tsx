import { createAdminClient } from '@/lib/supabase/server'
import { VerificationList } from '@/components/admin/verification-list'

export const dynamic = 'force-dynamic'

export default async function VerificationPage() {
    const supabase = await createAdminClient()

    // Business-legitimacy fields (cac_url/id_card_url, rc_number,
    // tax_id_number, directors_info, and the wholesaler trading-profile
    // columns) are included below -- a prior pass here deliberately excluded
    // rc_number/tax_id_number/directors_info as "settlement/tax data," but
    // that's exactly the KYC data this queue exists to review, and it also
    // excluded cac_url/id_card_url even though those are unambiguously
    // identity-verification documents. bank_name/account_number/
    // account_name stay excluded -- that genuinely is settlement data, not
    // needed to decide whether to approve a store.
    const { data, error } = await supabase
        .from('stores')
        .select(`
            id,
            name,
            slug,
            description,
            logo_url,
            created_at,
            owner_id,
            settings,
            phone,
            shop_type,
            subscription_plan,
            categories,
            frequent_markets,
            cac_url,
            id_card_url,
            legal_name,
            registration_type,
            nafdac_number,
            sales_model,
            expected_order_volume,
            minimum_order_quantity,
            offers_delivery,
            delivery_coverage_area,
            payment_terms,
            years_in_business,
            catalog_url,
            owner:users!owner_id (
                id,
                full_name,
                email,
                avatar_url,
                phone,
                date_of_birth,
                sex,
                residential_address,
                rc_number,
                tax_id_number,
                directors_info
            )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching pending stores:', error)
    }

    const stores = (data as any) || []

    return (
        <div className="space-y-6 p-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Verification Requests</h1>
                <p className="text-gray-500">Review and approve pending retailer and wholesaler applications.</p>
            </div>

            <VerificationList initialStores={stores} />
        </div>
    )
}
