'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Store, Phone, Mail, CheckCircle, XCircle, User, Calendar, MapPinned, Tag, ShieldCheck, FileText } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

type PendingStore = {
    id: string
    name: string
    slug: string
    description: string
    logo_url: string | null
    created_at: string
    owner_id: string
    settings: any
    phone: string | null
    shop_type: string | null
    subscription_plan: string | null
    categories: string[] | null
    frequent_markets: string[] | null
    cac_url: string | null
    id_card_url: string | null
    legal_name: string | null
    registration_type: string | null
    nafdac_number: string | null
    sales_model: string | null
    expected_order_volume: string | null
    minimum_order_quantity: string | null
    offers_delivery: string | null
    delivery_coverage_area: string | null
    payment_terms: string | null
    years_in_business: number | null
    catalog_url: string | null
    owner: {
        id: string
        full_name: string
        email: string
        avatar_url: string | null
        phone: string | null
        date_of_birth: string | null
        sex: string | null
        residential_address: string | null
        rc_number: string | null
        tax_id_number: string | null
        directors_info: { name: string; role: string; is_primary_signatory?: boolean }[] | null
    }
}

interface VerificationListProps {
    initialStores: PendingStore[]
}

export function VerificationList({ initialStores }: VerificationListProps) {
    const [stores, setStores] = useState<PendingStore[]>(initialStores)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const { toast } = useToast()
    const supabase = createClient()

    const handleVerification = async (storeId: string, ownerId: string, status: 'active' | 'suspended') => {
        setActionLoading(storeId)
        try {
            const { approveWholesalerAction, rejectWholesalerAction } = await import('@/app/actions/verification')
            const result = status === 'active'
                ? await approveWholesalerAction(ownerId)
                : await rejectWholesalerAction(ownerId)

            if (!result.success) throw new Error(result.error)

            toast({
                title: status === 'active' ? 'Store Approved & Email Sent' : 'Store Rejected',
                description: `The store has been ${status === 'active' ? 'verified' : 'rejected'}.`,
            })

            // Remove from list
            setStores(prev => prev.filter(s => s.id !== storeId))
        } catch (error: any) {
            console.error('Error updating store:', error)
            toast({
                title: 'Error',
                description: error.message || 'Failed to update store status',
                variant: 'destructive',
            })
        } finally {
            setActionLoading(null)
        }
    }

    if (stores.length === 0) {
        return (
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p>No pending verification requests at the moment.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {stores.map((store) => (
                <Card key={store.id} className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="bg-gray-50/50 pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="relative h-16 w-16 overflow-hidden rounded-lg border bg-white shadow-sm">
                                    {store.logo_url ? (
                                        <Image
                                            src={store.logo_url}
                                            alt={store.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-emerald-50 text-emerald-600">
                                            <Store className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900">{store.name}</CardTitle>
                                    <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 capitalize">
                                            {store.shop_type || 'Retailer/Brand'}
                                        </Badge>
                                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                                            Pending
                                        </Badge>
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Owner Details */}
                        <div className="space-y-3 rounded-lg border p-4 bg-gray-50/30">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 relative shrink-0">
                                    {store.owner?.avatar_url ? (
                                        <Image src={store.owner.avatar_url} alt={store.owner.full_name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-500">
                                            <User className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900">{store.owner?.full_name}</p>
                                    <p className="text-sm text-gray-500 truncate">{store.owner?.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {(store.phone || store.owner?.phone) && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{store.phone || store.owner?.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{store.owner?.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Store Description */}
                        {store.description && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                                <p className="text-sm text-gray-600 line-clamp-3">{store.description}</p>
                            </div>
                        )}

                        {/* Subscription & Categories */}
                        <div className="space-y-3 rounded-lg border p-4 bg-blue-50/30">
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">Plan & Categories</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Subscription:</span>
                                    <Badge className="ml-2 capitalize">{store.subscription_plan || 'basic'}</Badge>
                                </div>
                                {store.categories && store.categories.length > 0 && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block mb-1">Categories:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {store.categories.slice(0, 5).map((cat: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>
                                            ))}
                                            {store.categories.length > 5 && (
                                                <Badge variant="outline" className="text-xs">+{store.categories.length - 5} more</Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {store.frequent_markets && store.frequent_markets.length > 0 && (
                                <div className="text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPinned className="h-3 w-3 text-gray-400" />
                                        <span className="text-gray-500">Frequent Markets:</span>
                                    </div>
                                    <p className="text-gray-700">{store.frequent_markets.join(', ')}</p>
                                </div>
                            )}
                        </div>

                        {/* Personal Info */}
                        {(store.owner?.date_of_birth || store.owner?.sex || store.owner?.residential_address) && (
                            <div className="space-y-2 rounded-lg border p-4 bg-amber-50/30">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm font-medium text-gray-900">Personal Information</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {store.owner?.sex && (
                                        <div><span className="text-gray-500">Sex:</span> <span className="capitalize">{store.owner.sex}</span></div>
                                    )}
                                    {store.owner?.date_of_birth && (
                                        <div><span className="text-gray-500">DOB:</span> {new Date(store.owner.date_of_birth).toLocaleDateString()}</div>
                                    )}
                                    {store.owner?.residential_address && (
                                        <div className="col-span-2"><span className="text-gray-500">Address:</span> {store.owner.residential_address}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Business Verification (wholesaler business-legitimacy fields) */}
                        {(store.cac_url || store.id_card_url || store.legal_name || store.registration_type || store.owner?.rc_number || store.owner?.tax_id_number || store.nafdac_number || (store.owner?.directors_info && store.owner.directors_info.length > 0)) && (
                            <div className="space-y-3 rounded-lg border p-4 bg-emerald-50/30">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-900">Business Verification</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {store.legal_name && (
                                        <div className="col-span-2"><span className="text-gray-500">Legal Name:</span> {store.legal_name}</div>
                                    )}
                                    {store.registration_type && (
                                        <div><span className="text-gray-500">Type:</span> <span className="capitalize">{store.registration_type.replace('_', ' ')}</span></div>
                                    )}
                                    {store.owner?.rc_number && (
                                        <div><span className="text-gray-500">RC/BN Number:</span> {store.owner.rc_number}</div>
                                    )}
                                    {store.owner?.tax_id_number && (
                                        <div><span className="text-gray-500">TIN:</span> {store.owner.tax_id_number}</div>
                                    )}
                                    {store.nafdac_number && (
                                        <div><span className="text-gray-500">NAFDAC:</span> {store.nafdac_number}</div>
                                    )}
                                    {store.owner?.directors_info && store.owner.directors_info.length > 0 && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Signatory:</span> {store.owner.directors_info[0].name} ({store.owner.directors_info[0].role})
                                        </div>
                                    )}
                                    {(store.sales_model || store.expected_order_volume) && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Trading:</span> {store.sales_model && <span className="uppercase">{store.sales_model}</span>}
                                            {store.sales_model && store.expected_order_volume && ' · '}
                                            {store.expected_order_volume}
                                        </div>
                                    )}
                                    {store.minimum_order_quantity && (
                                        <div><span className="text-gray-500">MOQ:</span> {store.minimum_order_quantity}</div>
                                    )}
                                    {store.payment_terms && (
                                        <div><span className="text-gray-500">Payment Terms:</span> {store.payment_terms}</div>
                                    )}
                                    {store.offers_delivery && (
                                        <div><span className="text-gray-500">Delivery:</span> <span className="capitalize">{store.offers_delivery.replace('_', ' ')}</span></div>
                                    )}
                                    {store.years_in_business !== null && store.years_in_business !== undefined && (
                                        <div><span className="text-gray-500">Years in Business:</span> {store.years_in_business}</div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3 pt-1">
                                    {store.cac_url && (
                                        <a href={store.cac_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
                                            <FileText className="h-3.5 w-3.5" /> View CAC Certificate
                                        </a>
                                    )}
                                    {store.id_card_url && (
                                        <a href={store.id_card_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
                                            <FileText className="h-3.5 w-3.5" /> View ID Card
                                        </a>
                                    )}
                                    {store.catalog_url && (
                                        <a href={store.catalog_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
                                            <FileText className="h-3.5 w-3.5" /> View Catalog
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleVerification(store.id, store.owner.id, 'active')}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === store.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Approve Store
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleVerification(store.id, store.owner.id, 'suspended')}
                                disabled={!!actionLoading}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
