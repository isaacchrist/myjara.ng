'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { ABUJA_MARKETS } from '@/lib/constants'

export function MarketDayBanner() {
    const [mounted, setMounted] = useState(false)
    const [todayStr, setTodayStr] = useState('')

    useEffect(() => {
        setMounted(true)
        setTodayStr(new Date().toLocaleDateString('en-US', { weekday: 'long' }))
    }, [])

    if (!mounted) return null

    const openToday = ABUJA_MARKETS.filter(m => m.days.includes(todayStr))

    if (openToday.length === 0) return null

    return (
        <div className="bg-emerald-50 border-b border-emerald-100">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-pulse">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-900">
                                It's {todayStr}! Market Day is Live 🛒
                            </p>
                            <p className="text-xs text-emerald-700">
                                {openToday.length} markets in Abuja are open right now.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/markets"
                        className="group flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
                    >
                        See Open Markets
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
