'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Building, FileText, Loader2, LogOut, ShoppingBag, Store } from 'lucide-react'
import { logoutAdmin } from '@/app/actions/admin-auth'
import { approveWholesalerAction, rejectWholesalerAction } from '@/app/actions/verification'

// Interface for Pending User
interface PendingUser {
    id: string
    email: string
    full_name: string
    role: 'brand_admin' | 'retailer'
    // Wholesaler Fields
    business_address?: string
    rc_number?: string
    tax_id_number?: string
    bank_name?: string
    account_number?: string
    // Retailer Fields
    shop_type?: 'physical' | 'online' | 'market_day'
    market_days?: string[]
    phone_number?: string
    created_at: string
}

export default function VerificationQueueClient() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchPendingUsers()
    }, [])

    const fetchPendingUsers = async () => {
        setLoading(true)
        // Fetch users pending verification
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', ['brand_admin', 'retailer'])
            .eq('verification_status', 'pending')

        if (data) setPendingUsers(data as any)
        setLoading(false)
    }

    const handleVerification = async (userId: string, role: string, status: 'approved' | 'rejected') => {
        setActionLoading(userId)

        try {
            // Re-use logic for both for now, or split if actions differ significantly later.
            // Currently approveWholesalerAction updates user status, which works for both.
            // But if retailer has no store entry, it might fail? 
            // Retailers don't have 'stores' table entries yet in this flow? 
            // Wait, Wholesaler action updates 'stores' too. Retailers don't have stores.
            // For MVP, if role is retailer, we just update user table.

            // We should ideally have a separate action or update the existing one to handle role check.
            // For speed, let's use the existing one but be aware it might try to update a store that doesn't exist?
            // Actually, the server action 'approveWholesalerAction' does:
            // update user -> approved
            // update store -> active (where owner_id = user_id)
            // If store doesn't exist, the second query just does nothing (no error usually in supabase simple update).
            // So it should be safe to reuse for Retailers.

            const result = status === 'approved'
                ? await approveWholesalerAction(userId)
                : await rejectWholesalerAction(userId)

            if (result.success) {
                setPendingUsers(prev => prev.filter(u => u.id !== userId))
            } else {
                console.error("Verification failed:", result.error)
            }
        } catch (err) {
            console.error("Unexpected error during verification:", err)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Global Administration</h1>
                        <p className="text-gray-500">Overview and Verification Queue</p>
                    </div>
                    <Button variant="outline" onClick={() => logoutAdmin()} className="gap-2">
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                </header>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-emerald-600" />
                                Review Queue
                                <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700">{pendingUsers.length} Pending</Badge>
                            </CardTitle>
                            <CardDescription>Approve new Wholesalers and Retailers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
                            ) : pendingUsers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                    No pending applications found.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingUsers.map(user => (
                                        <div key={user.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                            {/* Type Strip */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${user.role === 'brand_admin' ? 'bg-orange-500' : 'bg-blue-500'}`} />

                                            <div className="flex-1 space-y-3 pl-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-lg text-gray-900">{user.full_name}</h3>
                                                            <Badge variant="outline" className={user.role === 'brand_admin' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-blue-600 border-blue-200 bg-blue-50'}>
                                                                {user.role === 'brand_admin' ? 'Wholesaler' : 'Retailer'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-500">{user.email} • {user.phone_number || 'No Phone'}</p>
                                                    </div>
                                                </div>

                                                {/* Wholesaler Details */}
                                                {user.role === 'brand_admin' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 bg-orange-50/50 p-3 rounded-md border border-orange-100">
                                                        <div>
                                                            <h4 className="font-medium text-gray-700 mb-1">Business Info</h4>
                                                            <p className="text-gray-600 text-xs">RC: {user.rc_number} | TIN: {user.tax_id_number}</p>
                                                            <p className="text-gray-600 text-xs">{user.business_address}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-700 mb-1">Bank Info</h4>
                                                            <p className="text-gray-600 text-xs">{user.bank_name} - {user.account_number}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Retailer Details */}
                                                {user.role === 'retailer' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 bg-blue-50/50 p-3 rounded-md border border-blue-100">
                                                        <div>
                                                            <h4 className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                                {user.shop_type === 'physical' && <Store className="h-3 w-3" />}
                                                                {user.shop_type === 'online' && <FileText className="h-3 w-3" />}
                                                                {user.shop_type === 'market_day' && <ShoppingBag className="h-3 w-3" />}
                                                                Shop Type: <span className="uppercase">{user.shop_type?.replace('_', ' ')}</span>
                                                            </h4>
                                                            {user.shop_type === 'market_day' && (
                                                                <p className="text-blue-700 text-xs">
                                                                    <strong>Markets:</strong> {Array.isArray(user.market_days) ? user.market_days.join(', ') : 'None listed'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex sm:flex-col justify-center gap-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
                                                <Button
                                                    className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                                                    onClick={() => handleVerification(user.id, user.role, 'approved')}
                                                    disabled={!!actionLoading}
                                                >
                                                    {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full sm:w-auto"
                                                    onClick={() => handleVerification(user.id, user.role, 'rejected')}
                                                    disabled={!!actionLoading}
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
