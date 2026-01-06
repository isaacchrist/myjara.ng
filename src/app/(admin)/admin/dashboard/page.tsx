'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Building, User, FileText, Loader2, LogOut } from 'lucide-react'
import { logoutAdmin } from '@/app/actions/admin-auth'

// Interface for Pending User
interface PendingUser {
    id: string
    email: string
    full_name: string
    business_address: string
    rc_number: string
    tax_id_number: string
    bank_name: string
    account_number: string
    created_at: string
}

export default function GlobalAdminDashboard() {
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
            .eq('role', 'brand_admin')
            .eq('verification_status', 'pending')

        if (data) setPendingUsers(data)
        setLoading(false)
    }

    const handleVerification = async (userId: string, status: 'approved' | 'rejected') => {
        setActionLoading(userId)

        // 1. Update User Status
        const { error: userError } = await supabase
            .from('users')
            .update({ verification_status: status } as any)
            .eq('id', userId)

        if (userError) {
            console.error("Error updating user:", userError)
            setActionLoading(null)
            return
        }

        // 2. If Approved, Activate Store
        if (status === 'approved') {
            const { error: storeError } = await supabase
                .from('stores')
                .update({ status: 'active' } as any)
                .eq('owner_id', userId)

            if (storeError) {
                console.error("Error activating store:", storeError)
                // Optional: Revert user status? For now just log.
            }
        } else if (status === 'rejected') {
            // Optional: Set store to rejected or banned?
            const { error: storeError } = await supabase
                .from('stores')
                .update({ status: 'inactive' } as any) // or rejected
                .eq('owner_id', userId)
        }

        // Remove from list
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
        setActionLoading(null)
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
                                Wholesaler Verification Queue
                                <Badge variant="secondary" className="ml-auto">{pendingUsers.length} Pending</Badge>
                            </CardTitle>
                            <CardDescription>Review and approve new wholesaler applications.</CardDescription>
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
                                        <div key={user.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-gray-900">{user.full_name}</h3>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                                                    <div className="bg-gray-50 p-3 rounded-md">
                                                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><FileText className="h-3 w-3" /> Business Details</h4>
                                                        <div className="space-y-1 text-gray-600">
                                                            <p><span className="text-gray-400">RC Number:</span> {user.rc_number}</p>
                                                            <p><span className="text-gray-400">TIN:</span> {user.tax_id_number || 'N/A'}</p>
                                                            <p><span className="text-gray-400">Address:</span> {user.business_address}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-3 rounded-md">
                                                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><Building className="h-3 w-3" /> Bank Details</h4>
                                                        <div className="space-y-1 text-gray-600">
                                                            <p><span className="text-gray-400">Bank:</span> {user.bank_name}</p>
                                                            <p><span className="text-gray-400">Account:</span> {user.account_number}</p>
                                                            {/* We typically verify this against name */}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex sm:flex-col justify-center gap-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
                                                <Button
                                                    className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                                                    onClick={() => handleVerification(user.id, 'approved')}
                                                    disabled={!!actionLoading}
                                                >
                                                    {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full sm:w-auto"
                                                    onClick={() => handleVerification(user.id, 'rejected')}
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
