import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { DisputesList } from '@/components/admin/disputes-list'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminDisputesPage() {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('disputes')
        .select(`
            *,
            user:users!customer_id (
                id,
                full_name,
                email,
                role,
                tag
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching disputes:', error)
    }

    const disputes = (data as any) || []

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
                    <p className="text-gray-500">Review and resolve user submitted tickets.</p>
                </div>
                <Link href="/admin">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>

            <DisputesList initialDisputes={disputes} />
        </div>
    )
}
