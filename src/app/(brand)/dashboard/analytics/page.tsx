'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    Truck,
    MessageSquare,
    TrendingUp,
    ArrowUpRight,
    Copy,
    CheckCircle2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getRetailerStats, logClientContact, getRecentClients, getCompetitorPricing } from '@/app/actions/analytics'
import { createClient } from '@/lib/supabase/client'

export default function RetailerAnalyticsPage() {
    const { toast } = useToast()
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalClients: 0,
        logisticsOptIn: 0,
        contactsReceived: 0,
        messagesCount: 0
    })
    const [competitors, setCompetitors] = useState<{ name: string, price: number, jara: string, distance: string }[]>([])
    const [clients, setClients] = useState<{ id: string, name: string, phone: string, lastActive: string }[]>([])
    const [storeId, setStoreId] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Fetch store ID for the user
                const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single() as { data: { id: string } | null }

                if (store) {
                    setStoreId(store.id)

                    // Parallel data fetching
                    const [statsData, competitorsData, clientsData] = await Promise.all([
                        getRetailerStats(store.id),
                        getCompetitorPricing(),
                        getRecentClients(store.id)
                    ])

                    setStats(statsData)
                    setCompetitors(competitorsData)
                    setClients(clientsData)
                }
            }
        }
        fetchData()
    }, [])

    const copyPhone = async (phone: string, id: string) => {
        navigator.clipboard.writeText(phone)
        setCopiedId(id)
        toast({ title: 'Copied!', description: `${phone} copied to clipboard.` })

        if (storeId) {
            // Log the "Copy" action as a contact
            await logClientContact(storeId, phone, 'phone_copy')
        }

        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Retailer Analytics</h1>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClients}</div>
                        <p className="text-xs text-muted-foreground">Unique contacts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Logistics Requests</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.logisticsOptIn}</div>
                        <p className="text-xs text-muted-foreground">Delivery opt-ins</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contacts (Clicks)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.contactsReceived}</div>
                        <p className="text-xs text-muted-foreground">Profile & Phone views</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.messagesCount}</div>
                        <p className="text-xs text-muted-foreground">Inquiries received</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Competitor Analysis */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Competitor Pricing Watch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {competitors.map((comp, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{comp.name}</h4>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>{comp.distance} away</span>
                                            {comp.jara !== 'None' && (
                                                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs font-medium">
                                                    Jara: {comp.jara}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">₦{comp.price.toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">Avg. Daily Price</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Clients / Quick Contact */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Client Intent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {clients.length > 0 ? clients.map((client, idx) => (
                                <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                            {(client.name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{client.name}</p>
                                            <p className="text-xs text-gray-500">{client.lastActive}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyPhone(client.phone, client.id)}
                                        className={copiedId === client.id ? 'bg-green-50 text-green-600 border-green-200' : ''}
                                    >
                                        {copiedId === client.id ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 text-center py-4">No recent client activity.</p>
                            )}
                            <Button variant="link" className="w-full text-emerald-600">
                                View All Clients <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
