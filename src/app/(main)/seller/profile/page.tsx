'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, MapPin, CreditCard, Store, Phone, Mail, Calendar, ArrowLeft, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SellerProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [userData, setUserData] = useState<any>(null)
    const [store, setStore] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()
            setUserData(userData)

            const { data: store } = await supabase
                .from('stores')
                .select('*')
                .eq('owner_id', user.id)
                .single()
            setStore(store)

            setLoading(false)
        }
        fetchData()
    }, [router])

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            </div>
        )
    }

    const expiryDate = store?.subscription_expiry ? new Date(store.subscription_expiry) : null
    const isExpired = expiryDate && expiryDate < new Date()

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">My Profile</h1>
                        <p className="text-gray-500">View and manage your account details</p>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-600">
                                {(userData?.full_name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-xl">{userData?.full_name || 'Not Set'}</p>
                                <Badge className="mt-1">{userData?.role || 'retailer'}</Badge>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{userData?.email || user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{userData?.phone || 'Not Set'}</span>
                                    {userData?.phone && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() => {
                                                navigator.clipboard.writeText(userData.phone)
                                                // Ideally show toast
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {userData?.sex && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 w-24">Sex:</span>
                                    <span className="capitalize">{userData.sex}</span>
                                </div>
                            )}
                            {userData?.date_of_birth && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 w-24">Date of Birth:</span>
                                    <span>{new Date(userData.date_of_birth).toLocaleDateString()}</span>
                                </div>
                            )}
                            {userData?.residential_address && (
                                <div className="flex items-start gap-2">
                                    <span className="text-gray-500 w-24 shrink-0">Address:</span>
                                    <span>{userData.residential_address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-red-500" />
                        Emergency Contacts
                    </CardTitle>
                    <Button variant="outline" size="sm">Manage</Button>
                </CardHeader>
                <CardContent>
                    {userData?.emergency_contacts && userData.emergency_contacts.length > 0 ? (
                        <div className="space-y-2">
                            {userData.emergency_contacts.map((contact: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                    <div>
                                        <p className="font-bold">{contact.number}</p>
                                        {contact.name && <p className="text-xs text-gray-500">{contact.name}</p>}
                                    </div>
                                    <Button size="sm" variant="ghost">Call</Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-2">No emergency contacts added.</p>
                            <Link href="/seller/profile/edit" className="text-emerald-600 hover:underline">Add Emergency Contacts</Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* My Customers (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        My Customers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-gray-500">
                        <p>Customer history will appear here once you start receiving orders.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Store Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Store Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {store ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Store Name</p>
                                    <p className="font-semibold">{store.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Store Type</p>
                                    <p className="font-semibold capitalize">{store.shop_type || 'Not Set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                                        {store.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Market</p>
                                    <p className="font-semibold">{store.market_name || 'Not Set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    {store.latitude && store.longitude ? (
                                        <p className="flex items-center gap-1 text-emerald-600">
                                            <MapPin className="h-4 w-4" />
                                            Verified ({store.latitude.toFixed(4)}, {store.longitude.toFixed(4)})
                                        </p>
                                    ) : (
                                        <p className="text-yellow-600">Not Set - Add your location</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Categories</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {store.categories && store.categories.length > 0 ? (
                                            store.categories.map((cat: string, i: number) => (
                                                <Badge key={i} variant="outline">{cat}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-gray-400">None selected</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No store found. Please contact support.</p>
                    )}
                </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card className={isExpired ? 'border-red-200' : ''}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Current Plan</p>
                                <p className="font-semibold text-xl capitalize">{store?.subscription_plan || 'Basic'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Payment Status</p>
                                <Badge variant={store?.payment_status === 'active' ? 'default' : 'secondary'}>
                                    {store?.payment_status || 'Trial'}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Expiry Date</p>
                                {expiryDate ? (
                                    <p className={`font-semibold ${isExpired ? 'text-red-600' : ''}`}>
                                        <Calendar className="inline h-4 w-4 mr-1" />
                                        {expiryDate.toLocaleDateString()}
                                        {isExpired && ' (Expired)'}
                                    </p>
                                ) : (
                                    <p className="text-gray-400">Not Set</p>
                                )}
                            </div>
                            <Button asChild className={isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}>
                                <Link href="/seller/subscription">
                                    {isExpired ? 'Renew Now' : 'Manage Subscription'}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
