'use client'

import { useState } from 'react'
import { ABUJA_MARKETS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function MarketsPage() {
    const [search, setSearch] = useState('')
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    const filteredMarkets = ABUJA_MARKETS.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.days.some(d => d.toLowerCase().includes(search.toLowerCase()))
    )

    const openToday = ABUJA_MARKETS.filter(m => m.days.includes(today))

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
            <div className="bg-emerald-900 text-white py-16 px-4">
                <div className="max-w-7xl mx-auto text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Abuja Market Days</h1>
                    <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                        Discover fresh deals from your favorite local markets. Find out who is open today and plan your shopping trip.
                    </p>

                    <div className="max-w-md mx-auto relative mt-8">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search markets or days (e.g. 'Karmo' or 'Saturday')"
                            className="pl-10 h-11 bg-white text-gray-900 border-none shadow-xl rounded-full"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">

                {/* Open Today Section */}
                {openToday.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900">Open Today ({today})</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {openToday.map(market => (
                                <Link href={`/search?market=${encodeURIComponent(market.name)}`} key={market.name}>
                                    <Card className="hover:shadow-lg transition-all border-emerald-500 border-l-4 cursor-pointer h-full group">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                    <MapPin className="h-6 w-6" />
                                                </div>
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Open Now</Badge>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700">{market.name}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" /> {market.days.join(', ')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* All Markets Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">All Markets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMarkets.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No markets found matching your search.
                            </div>
                        ) : (
                            filteredMarkets.map(market => (
                                <Link href={`/search?market=${encodeURIComponent(market.name)}`} key={market.name}>
                                    <Card className="hover:shadow-md transition-all cursor-pointer h-full border-gray-200 hover:border-emerald-200">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                {market.days.includes(today) && (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Open Today</Badge>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{market.name}</h3>
                                            <p className="text-sm text-gray-500 flex flex-wrap gap-2">
                                                {market.days.map(d => (
                                                    <span key={d} className={`px-2 py-0.5 rounded text-xs ${d === today ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-100 text-gray-600'}`}>
                                                        {d}
                                                    </span>
                                                ))}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold text-emerald-900 mb-2">Compare Prices across Markets</h3>
                    <p className="text-emerald-700 mb-6 max-w-2xl mx-auto">
                        Looking for the best deal? Use our comparison tool to find the cheapest source or the best Jara offer for valid products across all Abuja markets.
                    </p>
                    <Link href="/search?compare=true">
                        <div className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                            Start Comparing
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
