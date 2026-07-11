import { createAdminClient } from '@/lib/supabase/server'
import { VerificationList } from '@/components/admin/verification-list'

export const dynamic = 'force-dynamic'

export default async function VerificationPage() {
    const supabase = await createAdminClient()

    // Deliberately narrow (no bank_name/account_number/account_name/
    // rc_number/tax_id_number/directors_info): identity verification needs
    // who this is and their KYC details, not settlement/tax data.
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
            owner:users!owner_id (
                id,
                full_name,
                email,
                avatar_url,
                phone,
                date_of_birth,
                sex,
                residential_address
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
