import { createAdminClient } from '@/lib/supabase/server'
import { VerificationList } from '@/components/admin/verification-list'

export const dynamic = 'force-dynamic'

export default async function VerificationPage() {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('stores')
        .select(`
            *,
            owner:users!owner_id (
                id,
                full_name,
                email,
                avatar_url,
                phone
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
