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
    const { data: storesData } = await supabase
        .from('stores')
        .select('id, name, slug, owner_id, shop_type, market_name, is_verified')

    // 3. Merge Data
    const users: any[] = (usersData || []).map((user: any) => {
        const userStore = (storesData as any[])?.find((s: any) => s.owner_id === user.id)
        return {
            ...user,
            store: userStore,
            // Assuming 'is_verified' is on the store? Or user?
            // User table doesn't have is_verified usually, Store does.
            // But we can check if store is verified for Sellers.
            // For Customers, maybe email confirmed?
            // Let's use store verification for sellers, true for customers?
            is_verified: userStore ? userStore.is_verified : true // Default true for customers (or check email_confirmed_at if exposed)
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
