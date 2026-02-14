import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function SellerDisputesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Get Active Store
    const { getActiveStore } = await import('@/lib/store-context')
    const storeData = await getActiveStore()
    const activeStore = storeData?.activeStore

    if (!activeStore) {
        return (
            <div className="p-8 text-center">
                <p>Please select a store to view disputes.</p>
                <Button asChild className="mt-4">
                    <Link href="/seller/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        )
    }

    // Fetch disputes for this store
    const { data: disputes } = await supabase
        .from('disputes')
        .select(`
            *,
            orders!order_id (
                order_number
            ),
            customer:users!customer_id (
                full_name,
                email
            )
        `)
        .eq('store_id', activeStore.id)
        .order('created_at', { ascending: false })

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Disputes Received</h1>
                    <p className="text-gray-500 mt-1">Manage claims filed against your store.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/seller/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4">
                {disputes && disputes.length > 0 ? (
                    disputes.map((dispute: any) => (
                        <Card key={dispute.id} className="overflow-hidden border-l-4 border-l-red-500">
                            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{dispute.reason}</h3>
                                        <Badge variant={
                                            dispute.status === 'resolved' ? 'success' :
                                                dispute.status === 'pending' ? 'destructive' : 'secondary'
                                        }>
                                            {dispute.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Order #{dispute.orders?.order_number || 'Unknown'} • From: {dispute.customer?.full_name || dispute.customer?.email || 'Customer'}
                                    </p>
                                    <p className="text-sm text-gray-700 line-clamp-2 mt-2 bg-gray-50 p-2 rounded">
                                        "{dispute.description}"
                                    </p>
                                </div>
                                <div className="text-right text-sm text-gray-500 flex-shrink-0">
                                    <p>{formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}</p>
                                    <Button size="sm" variant="outline" className="mt-2" asChild>
                                        <Link href={`/seller/messages`}>
                                            Contact Admin
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <div className="rounded-full bg-green-100 p-3 mb-4">
                                <AlertCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No disputes found</h3>
                            <p className="max-w-xs mx-auto mt-2">
                                Great job! You have no open disputes against your store.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
