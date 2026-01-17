import { getAdminSession } from '@/app/actions/admin-auth'
import { AdminShell } from '@/components/admin/admin-shell'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const isAdmin = await getAdminSession()

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        )
    }

    // Fetch Pending Verifications Count
    // Using simple client for now (serverless optimized)
    // We can't import createClient inside server component easily unless it's server-optimized
    // src/lib/supabase/server.ts exports createAdminClient
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createAdminClient()

    // Check pending count
    const { count } = await supabase
        .from('stores')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

    const pendingCount = count || 0

    return (
        <AdminShell pendingVerifications={pendingCount}>
            {children}
        </AdminShell>
    )
}
