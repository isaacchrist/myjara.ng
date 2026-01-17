import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, LayoutDashboard } from 'lucide-react'

export default async function DisputesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: disputes } = await supabase
        .from('disputes')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Disputes</h1>
                    <p className="text-gray-500 mt-1">Manage and track your order issues.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/customer/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/customer/disputes/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Open Dispute
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {disputes && disputes.length > 0 ? (
                    disputes.map((dispute: any) => (
                        <Card key={dispute.id} className="overflow-hidden">
                            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{dispute.reason}</h3>
                                        <Badge variant={dispute.status === 'resolved' ? 'success' : 'secondary'}>
                                            {dispute.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">Order ID: {dispute.order_id}</p>
                                    <p className="text-sm text-gray-700 line-clamp-2">{dispute.description}</p>
                                </div>
                                <div className="text-right text-sm text-gray-500 flex-shrink-0">
                                    <p>Opened on {new Date(dispute.created_at).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No disputes found</h3>
                            <p className="max-w-xs mx-auto mt-2 mb-6">
                                If you have an issue with an order, you can open a dispute here.
                            </p>
                            <Button asChild>
                                <Link href="/customer/disputes/new">Open New Dispute</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
