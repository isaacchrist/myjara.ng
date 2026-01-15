'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow, format } from 'date-fns'
import { Loader2, Search, Filter, MessageSquare, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

type Dispute = {
    id: string
    created_at: string
    subject: string
    description: string
    cause: string | null
    status: 'open' | 'resolved' | 'closed'
    user: {
        id: string
        full_name: string
        email: string
        role: string
    }
}

const CAUSE_OPTIONS = [
    { value: 'all', label: 'All Causes' },
    { value: 'payment', label: '💳 Payment' },
    { value: 'delivery', label: '🚚 Delivery' },
    { value: 'product_quality', label: '📦 Quality' },
    { value: 'account', label: '👤 Account' },
    { value: 'other', label: '❓ Other' },
]

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [loading, setLoading] = useState(true)
    const [filterRole, setFilterRole] = useState<'all' | 'retailer' | 'brand_admin' | 'consumer'>('all')
    const [filterCause, setFilterCause] = useState('all')
    const [search, setSearch] = useState('')

    const supabase = createClient()

    useEffect(() => {
        const fetchDisputes = async () => {
            setLoading(true)

            // We fetch disputes and join users.
            // Note: If 'role' is not on public.users, we might need to adjust.
            // Assuming public.users is synced with auth.users roles.
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    user:users (
                        id,
                        full_name,
                        email,
                        role
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching disputes:", error)
            } else {
                setDisputes((data as any) || [])
            }
            setLoading(false)
        }
        fetchDisputes()
    }, [])

    // Filter Logic
    const filteredDisputes = disputes.filter(d => {
        // Role Filter
        const userRole = d.user?.role || 'consumer'
        const matchesRole = filterRole === 'all'
            ? true
            : filterRole === 'consumer'
                ? (userRole !== 'retailer' && userRole !== 'brand_admin')
                : userRole === filterRole

        // Cause Filter
        const matchesCause = filterCause === 'all' || d.cause === filterCause

        // Search Filter
        const matchesSearch =
            d.subject.toLowerCase().includes(search.toLowerCase()) ||
            d.description.toLowerCase().includes(search.toLowerCase()) ||
            d.user?.full_name?.toLowerCase().includes(search.toLowerCase())

        return matchesRole && matchesCause && matchesSearch
    })

    const handleResolve = async (id: string, newStatus: 'resolved' | 'closed') => {
        const { error } = await (supabase as any)
            .from('disputes')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
        }
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
                    <p className="text-gray-500">Review and resolve user submitted tickets.</p>
                </div>
                <Link href="/admin">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>

            {/* Controls */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search subjects, descriptions, or users..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                            <Button
                                variant={filterRole === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilterRole('all')}
                                className={filterRole === 'all' ? 'bg-gray-900' : ''}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterRole === 'brand_admin' ? 'default' : 'outline'}
                                onClick={() => setFilterRole('brand_admin')}
                                className={filterRole === 'brand_admin' ? 'bg-purple-600 hover:bg-purple-700' : 'text-purple-600 border-purple-200'}
                            >
                                Wholesalers
                            </Button>
                            <Button
                                variant={filterRole === 'retailer' ? 'default' : 'outline'}
                                onClick={() => setFilterRole('retailer')}
                                className={filterRole === 'retailer' ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-600 border-blue-200'}
                            >
                                Retailers
                            </Button>
                            <Button
                                variant={filterRole === 'consumer' ? 'default' : 'outline'}
                                onClick={() => setFilterRole('consumer')}
                                className={filterRole === 'consumer' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-emerald-600 border-emerald-200'}
                            >
                                Consumers
                            </Button>
                        </div>
                    </div>

                    {/* Cause Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 font-medium self-center mr-2">Filter by cause:</span>
                        {CAUSE_OPTIONS.map((c) => (
                            <Button
                                key={c.value}
                                size="sm"
                                variant={filterCause === c.value ? 'default' : 'outline'}
                                onClick={() => setFilterCause(c.value)}
                                className={filterCause === c.value ? 'bg-gray-800' : ''}
                            >
                                {c.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : filteredDisputes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No disputes found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredDisputes.map(dispute => (
                        <Card key={dispute.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50/50 pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            {dispute.subject}
                                            <Badge variant={dispute.status === 'open' ? 'destructive' : 'outline'} className={dispute.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                                                {dispute.status}
                                            </Badge>
                                        </CardTitle>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>{dispute.user?.full_name || 'Unknown User'}</span>
                                            <span>•</span>
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {dispute.user?.role || 'Consumer'}
                                            </Badge>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {dispute.status === 'open' && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleResolve(dispute.id, 'resolved')}>
                                                    <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-gray-600" onClick={() => handleResolve(dispute.id, 'closed')}>
                                                    <XCircle className="h-4 w-4 mr-1" /> Close
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
