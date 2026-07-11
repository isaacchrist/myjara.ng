import { UsersTable } from '@/components/admin/users-table'
import { Card, CardContent } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { Users, CheckCircle, Clock } from 'lucide-react'

export default async function AdminUsersPage() {
    const supabase = await createAdminClient()

    // 1. Fetch Users
    const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    // 2. Fetch Stores (to link to users)
    // NOTE: stores has no is_verified column -- verification lives on
    // users.verification_status (set by approveWholesalerAction/
    // rejectWholesalerAction), stores.status just tracks whether the store
    // is active/suspended as a side effect of that same approval.
    const { data: storesData } = await supabase
        .from('stores')
        .select('id, name, slug, owner_id, shop_type, market_name, status')

    // 3. Merge Data
    const users: any[] = (usersData || []).map((user: any) => {
        const userStore = (storesData as any[])?.find((s: any) => s.owner_id === user.id)
        return {
            ...user,
            store: userStore,
            // Customers have no verification concept -- default true. Sellers
            // are verified once an admin approves them (verification_status).
            is_verified: userStore ? user.verification_status === 'approved' : true
        }
    })

    const totalUsers = users.length
    const verifiedUsers = users.filter(u => u.is_verified).length
    const pendingUsers = users.filter(u => !u.is_verified).length

    // (Dead code removed)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-gray-400">Manage platform users and sellers</p>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Users className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{totalUsers}</p>
                            <p className="text-sm text-gray-400">Total Users</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{verifiedUsers}</p>
                            <p className="text-sm text-gray-400">Verified / Active</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{pendingUsers}</p>
                            <p className="text-sm text-gray-400">Pending Review</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table Component */}
            <UsersTable initialUsers={users} />
        </div>
    )
}
