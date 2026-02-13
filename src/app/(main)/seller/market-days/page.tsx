'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, CheckCircle2, Store, Navigation, Trash2, Plus, Loader2 } from 'lucide-react'
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
    const [saving, setSaving] = useState(false)
    const [enrolledMarkets, setEnrolledMarkets] = useState<string[]>([])
    const [capturingGps, setCapturingGps] = useState<string | null>(null)

    useEffect(() => {
        if (!store) return

        // Load existing frequent markets from store
        const frequentMarkets: string[] = Array.isArray((store as any)?.frequent_markets) ? (store as any).frequent_markets : []
        setEnrolledMarkets(frequentMarkets)
        setLoading(false)
    }, [store])

    // Get all markets with their real schedule info
    const allMarkets = ABUJA_MARKETS.map(market => {
        const isEnrolled = enrolledMarkets.includes(market.name)
        const today = new Date()
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' })
        const isOpenToday = market.days.includes(dayOfWeek)

        // Find next market day
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        let nextMarketDate: Date | null = null
        for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(d.getDate() + i)
            const dayName = daysOfWeek[d.getDay()]
            if (market.days.includes(dayName)) {
                nextMarketDate = d
                break
            }
        }

        return {
            ...market,
            isEnrolled,
            isOpenToday,
            nextMarketDate,
            isDaily: market.days.length === 7,
        }
    })

    // Enrolled first, then alphabetical
    const sortedMarkets = [...allMarkets].sort((a, b) => {
        if (a.isEnrolled && !b.isEnrolled) return -1
        if (!a.isEnrolled && b.isEnrolled) return 1
        return a.name.localeCompare(b.name)
    })

    const handleEnlist = async (marketName: string) => {
        const updated = [...enrolledMarkets, marketName]
        setEnrolledMarkets(updated)
        await saveMarkets(updated)
    }

    const handleDelist = async (marketName: string) => {
        const updated = enrolledMarkets.filter(m => m !== marketName)
        setEnrolledMarkets(updated)
        await saveMarkets(updated)
    }

    const saveMarkets = async (markets: string[]) => {
        if (!store) return
        setSaving(true)
        try {
            const supabase = createClient()
            const { error } = await (supabase as any)
                .from('stores')
                .update({ frequent_markets: markets })
                .eq('id', store.id)

            if (error) throw error

            toast({ title: 'Saved', description: 'Market list updated successfully.' })
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const captureGpsForMarket = (marketName: string) => {
        if (!navigator.geolocation) {
            toast({ title: 'Error', description: 'Geolocation not supported', variant: 'destructive' })
            return
        }

        setCapturingGps(marketName)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                // Save GPS to store's latitude/longitude (simple approach)
                // In a more complex system, each market would have its own GPS in a junction table
                try {
                    const supabase = createClient()
                    const { error } = await (supabase as any)
                        .from('stores')
                        .update({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        })
                        .eq('id', store?.id)

                    if (error) throw error
                    toast({ title: 'GPS Captured!', description: `Location saved for ${marketName}` })
                } catch (err) {
                    toast({ title: 'Error', description: 'Failed to save location', variant: 'destructive' })
                } finally {
                    setCapturingGps(null)
                }
            },
            () => {
                toast({ title: 'Error', description: 'Failed to get location. Please enable GPS.', variant: 'destructive' })
                setCapturingGps(null)
            }
        )
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
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
                    <p className="text-gray-500">Manage the markets you attend and help customers find you</p>
                </div>
            </div>

            {/* Enrolled Markets Summary */}
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-emerald-900">Your Markets</p>
                            <p className="text-sm text-emerald-700">
                                {enrolledMarkets.length === 0
                                    ? 'You haven\'t selected any markets yet. Add markets below!'
                                    : `You are listed at ${enrolledMarkets.length} market${enrolledMarkets.length > 1 ? 's' : ''}`
                                }
                            </p>
                        </div>
                        {saving && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
                    </div>
                </CardContent>
            </Card>

            {/* Market Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedMarkets.map((market) => (
                    <Card
                        key={market.name}
                        className={market.isEnrolled
                            ? 'border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200'
                            : 'hover:shadow-md transition-shadow'
                        }
                    >
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    {market.isEnrolled && (
                                        <Badge className="bg-emerald-100 text-emerald-700">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Enrolled
                                        </Badge>
                                    )}
                                    {market.isOpenToday && (
                                        <Badge className="bg-orange-100 text-orange-700">Open Today</Badge>
                                    )}
                                </div>
                            </div>
                            <CardTitle className="text-lg mt-1">{market.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {market.isDaily
                                    ? 'Open Daily'
                                    : market.days.join(', ')
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Google Maps Link */}
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${market.lat},${market.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
                                >
                                    <MapPin className="h-4 w-4" />
                                    View on Google Maps →
                                </a>

                                {/* Next Market Day */}
                                {market.nextMarketDate && (
                                    <p className="text-xs text-gray-500">
                                        Next: {market.nextMarketDate.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {market.isEnrolled ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => captureGpsForMarket(market.name)}
                                                disabled={capturingGps === market.name}
                                                className="flex-1 text-xs"
                                            >
                                                {capturingGps === market.name ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <Navigation className="h-3 w-3 mr-1" />
                                                )}
                                                Capture GPS
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelist(market.name)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Delist
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={() => handleEnlist(market.name)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
                                            size="sm"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add to My Markets
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
