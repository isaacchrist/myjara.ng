'use client'

import { useState } from 'react'
// (Imports removed)
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2 } from 'lucide-react'

type User = {
    id: string
    email: string
    full_name: string
    role: string
    is_verified: boolean
    created_at: string
    store?: {
        id: string
        name: string
        slug: string
        shop_type: string
        market_name?: string
    }
}

interface UsersTableProps {
    initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [shopTypeFilter, setShopTypeFilter] = useState('all')

    const filteredUsers = initialUsers.filter((user) => {
        // Search Filter
        const searchLower = search.toLowerCase()
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.store?.name?.toLowerCase().includes(searchLower)

        // Role Filter
        const matchesRole = roleFilter === 'all' || user.role === roleFilter

        // Shop Type Filter (Only for Retailers)
        // Note: shop_type might need to be populated correctly in DB
        let matchesShopType = true
        if (roleFilter === 'retailer' && shopTypeFilter !== 'all') {
            // Check store shop_type or market_name context
            if (shopTypeFilter === 'market_day') {
                matchesShopType = !!user.store?.market_name
            } else {
                // Fuzzy match or exact match depending on how data is stored
                matchesShopType = user.store?.shop_type?.toLowerCase().includes(shopTypeFilter) || false
            }
        }

        return matchesSearch && matchesRole && matchesShopType
    })

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="customer">Customers</SelectItem>
                            <SelectItem value="retailer">Retailers</SelectItem>
                            <SelectItem value="brand_admin">Wholesalers</SelectItem>
                        </SelectContent>
                    </Select>

                    {roleFilter === 'retailer' && (
                        <Select value={shopTypeFilter} onValueChange={setShopTypeFilter}>
                            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                                <SelectValue placeholder="Shop Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="physical">Physical Store</SelectItem>
                                <SelectItem value="online">Online Store</SelectItem>
                                <SelectItem value="market_day">Market Day</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <div className="rounded-md border border-gray-700 bg-gray-800">
                {/* Fallback to simple div if Table component missing, but using standard HTML table structure for safety if component doesn't match */}
                <div className="w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-700/50 text-gray-400">
                            <tr>
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Store/Info</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-700/50">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium text-white">{user.full_name}</p>
                                                <p className="text-gray-400 text-xs">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="capitalize text-gray-300 border-gray-600">
                                                {user.role === 'brand_admin' ? 'Wholesaler' : user.role}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            {user.store ? (
                                                <div>
                                                    <p className="text-white">{user.store.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.store.shop_type === 'brand' ? 'Wholesale' : user.store.shop_type}
                                                        {user.store.market_name && ` • ${user.store.market_name}`}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {user.is_verified ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-0">Verified</Badge>
                                            ) : (
                                                <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 border-0">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No users found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
