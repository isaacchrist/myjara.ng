'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Search, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { resolveDisputeAction } from '@/app/actions/disputes'

type Dispute = {
    id: string
    created_at: string
    reason: string
    description: string
    cause: string | null
    status: 'pending' | 'under_review' | 'resolved' | 'closed'
    user: {
        id: string
        full_name: string
        email: string
        role: string
    } | null
}

const CAUSE_OPTIONS = [
    { value: 'all', label: 'All Causes' },
    { value: 'payment', label: '💳 Payment' },
    { value: 'delivery', label: '🚚 Delivery' },
    { value: 'product_quality', label: '📦 Quality' },
    { value: 'account', label: '👤 Account' },
    { value: 'other', label: '❓ Other' },
]

const STATUS_STYLES: Record<Dispute['status'], string> = {
    pending: 'bg-red-50 text-red-700 border-red-200',
    under_review: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function DisputesList({ initialDisputes }: { initialDisputes: Dispute[] }) {
    const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes)
    const [resolvingId, setResolvingId] = useState<string | null>(null)
    const [filterRole, setFilterRole] = useState<'all' | 'retailer' | 'brand_admin' | 'consumer'>('all')
    const [filterCause, setFilterCause] = useState('all')
    const [search, setSearch] = useState('')

    const filteredDisputes = disputes.filter(d => {
        const userRole = d.user?.role || 'consumer'
        const matchesRole = filterRole === 'all'
            ? true
            : filterRole === 'consumer'
                ? (userRole !== 'retailer' && userRole !== 'brand_admin')
                : userRole === filterRole

        const matchesCause = filterCause === 'all' || d.cause === filterCause

        const matchesSearch =
            d.reason.toLowerCase().includes(search.toLowerCase()) ||
            d.description.toLowerCase().includes(search.toLowerCase()) ||
            (d.user?.full_name || '').toLowerCase().includes(search.toLowerCase())

        return matchesRole && matchesCause && matchesSearch
    })

    const handleResolve = async (id: string, newStatus: 'resolved' | 'closed') => {
        setResolvingId(id)
        const result = await resolveDisputeAction(id, newStatus)
        if (result.success) {
            setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
        }
        setResolvingId(null)
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search reasons, descriptions, or users..."
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
                                className={filterRole === 'brand_admin' ? 'bg-emerald-700 hover:bg-emerald-800' : 'text-emerald-700 border-emerald-200'}
                            >
                                Wholesalers
                            </Button>
                            <Button
                                variant={filterRole === 'retailer' ? 'default' : 'outline'}
                                onClick={() => setFilterRole('retailer')}
                                className={filterRole === 'retailer' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-emerald-600 border-emerald-200'}
                            >
                                Retailers
                            </Button>
                            <Button
                                variant={filterRole === 'consumer' ? 'default' : 'outline'}
                                onClick={() => setFilterRole('consumer')}
                                className={filterRole === 'consumer' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-emerald-500 border-emerald-200'}
                            >
                                Consumers
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 font-medium self-center mr-2">Filter by cause:</span>
                        {CAUSE_OPTIONS.map((c) => (
                            <Button
                                key={c.value}
                                size="sm"
                                variant={filterCause === c.value ? 'default' : 'outline'}
                                onClick={() => setFilterCause(c.value)}
                                className={filterCause === c.value ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                                {c.label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            {filteredDisputes.length === 0 ? (
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
                                            {dispute.reason}
                                            <Badge variant="outline" className={STATUS_STYLES[dispute.status]}>
                                                {dispute.status.replace('_', ' ')}
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
                                        {(dispute.status === 'pending' || dispute.status === 'under_review') && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                    disabled={resolvingId === dispute.id}
                                                    onClick={() => handleResolve(dispute.id, 'resolved')}
                                                >
                                                    {resolvingId === dispute.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                                    Resolve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-gray-600"
                                                    disabled={resolvingId === dispute.id}
                                                    onClick={() => handleResolve(dispute.id, 'closed')}
                                                >
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
