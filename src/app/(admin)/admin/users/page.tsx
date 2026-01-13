import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, CheckCircle, XCircle, Clock, Search } from 'lucide-react'

export default async function AdminUsersPage() {
    const supabase = await createAdminClient()

    // Fetch all stores with owner info
    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, slug, owner_id, created_at, is_verified')
        .order('created_at', { ascending: false })
        .limit(50) as any

    const users = stores || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400">Manage platform users and sellers</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
                    />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                            <p className="text-sm text-gray-400">Total Sellers</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.filter((u: any) => u.is_verified).length}</p>
                            <p className="text-sm text-gray-400">Verified</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.filter((u: any) => !u.is_verified).length}</p>
                            <p className="text-sm text-gray-400">Pending Review</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">All Sellers</CardTitle>
                    <CardDescription className="text-gray-400">List of all registered sellers on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Store Name</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Slug</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user: any) => (
                                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                        <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                                        <td className="py-3 px-4 text-gray-300">@{user.slug}</td>
                                        <td className="py-3 px-4">
                                            {user.is_verified ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Verified</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
