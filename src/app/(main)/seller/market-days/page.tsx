'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, CheckCircle2, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useSellerStore } from '@/context/seller-store-context'
import { ABUJA_MARKETS } from '@/lib/constants'

export default function MarketDaysPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { store } = useSellerStore()
    const [loading, setLoading] = useState(true)
    // const [store, setStore] = useState<any>(null)
    const [upcomingMarkets, setUpcomingMarkets] = useState<any[]>([])
    const [enrolledMarkets, setEnrolledMarkets] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            if (!store) return

            // store is already available from context

            // Simulate fetching next market days for Abuja Markets
            // In a real app, this would come from a 'market_days' table
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            const next7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() + i)
                return d
            })

            const simulatedMarkets = ABUJA_MARKETS.map(market => {
                // Find next market day (just a simulation)
                const randomDay = next7Days[Math.floor(Math.random() * 7)]
                return {
                    id: market.name,
                    name: market.name,
                    date: randomDay,
                    location: market.lat && market.lng ? `${market.lat}, ${market.lng}` : 'Abuja',
                    status: 'active'
                }
            }).sort((a, b) => a.date.getTime() - b.date.getTime())

            setUpcomingMarkets(simulatedMarkets)

            // Fetch existing enrollments (simulated from local storage or DB if table existed)
            // For now, we'll just use a local state simulation or check store.frequent_markets
            if ((store as any)?.frequent_markets) {
                // Pre-select frequent markets as "interested"
            }

            setLoading(false)
        }
        fetchData()
    }, [router, store])

    const handleEnlist = async (market: any) => {
        if (!store) return

        toast({ title: 'Enlisted!', description: `You have successfully enlisted for ${market.name} on ${market.date.toLocaleDateString()}.` })
        setEnrolledMarkets(prev => [...prev, market.id])

        // In real app: Insert into 'market_attendance' table
        /*
        const { error } = await supabase.from('market_attendance').insert({
            store_id: store.id,
            market_name: market.name,
            market_date: market.date,
            status: 'confirmed'
        })
        */
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Market Days...</div>
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/seller/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Market Days</h1>
                    <p className="text-gray-500">Enlist for upcoming market days to boost visibility</p>
                </div>
            </div>

            {/* Store Status */}
            {!(store as any)?.frequent_markets?.length && (
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4 flex gap-4 items-center">
                        <Store className="h-5 w-5 text-emerald-600" />
                        <div>
                            <p className="font-medium text-emerald-900">Add Frequent Markets</p>
                            <p className="text-sm text-emerald-700">Update your profile to show which markets you regularly attend.</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="ml-auto bg-white hover:bg-emerald-100">
                            <Link href="/seller/profile">Update Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingMarkets.map((market) => {
                    const isEnrolled = enrolledMarkets.includes(market.id)
                    const isFrequent = (store as any)?.frequent_markets?.includes(market.name)

                    return (
                        <Card key={market.id} className={isEnrolled ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant={isFrequent ? 'default' : 'secondary'} className={isFrequent ? 'bg-purple-100 text-purple-700' : ''}>
                                        {isFrequent ? 'Frequent Spot' : 'Market Day'}
                                    </Badge>
                                    {isEnrolled && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                                </div>
                                <CardTitle className="text-lg">{market.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {market.date.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4" />
                                        {market.location}
                                    </div>
                                    <Button
                                        onClick={() => handleEnlist(market)}
                                        disabled={isEnrolled}
                                        className={`w-full ${isEnrolled ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                        {isEnrolled ? 'Enlisted' : 'Enlist for Market Day'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
