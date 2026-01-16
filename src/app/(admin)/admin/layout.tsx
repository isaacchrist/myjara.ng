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

    return (
        <AdminShell>
            {children}
        </AdminShell>
    )
}
