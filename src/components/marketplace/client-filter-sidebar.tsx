'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, ChevronUp, MapPin, Tag, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ABUJA_LOCATIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface FilterProps {
    currentParams: {
        category: string | null
        minPrice: number | null
        maxPrice: number | null
        minJara: number | null
        city: string | null
    }
}

export default function ClientFilterSidebar({ currentParams }: FilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Local state for immediate UI feedback before navigation
    const [priceRange, setPriceRange] = useState({
        min: currentParams.minPrice || '',
        max: currentParams.maxPrice || ''
    })
    const [selectedLga, setSelectedLga] = useState<string>('')

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`?${params.toString()}`)
    }

    const appliedFiltersCount = [
        currentParams.category,
        currentParams.minPrice,
        currentParams.maxPrice,
        currentParams.minJara,
        currentParams.city
    ].filter(Boolean).length

    const clearFilters = () => {
        router.push('/search')
        setPriceRange({ min: '', max: '' })
        setSelectedLga('')
    }

    return (
        <aside className="h-fit rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    Filters
                    {appliedFiltersCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">
                            {appliedFiltersCount}
                        </span>
                    )}
                </h3>
                {appliedFiltersCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-red-500 hover:underline font-medium"
                    >
                        Reset
                    </button>
                )}
            </div>

            <div className="space-y-8">
                {/* Location Filter */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        Location (Abuja)
                    </label>
                    <div className="space-y-2">
                        <select
                            className="w-full rounded-lg border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                            value={selectedLga}
                            onChange={(e) => {
                                setSelectedLga(e.target.value)
                                // If "All Abuja" selected, clear city filter, else set it
                                updateFilter('city', e.target.value === 'all' ? null : e.target.value)
                            }}
                        >
                            <option value="all">All of Abuja</option>
                            {ABUJA_LOCATIONS.map(loc => (
                                <option key={loc.lga} value={loc.lga}>{loc.lga}</option>
                            ))}
                        </select>

                        {/* Show Districts if LGA selected */}
                        {selectedLga && selectedLga !== 'all' && (
                            <div className="pl-2 animate-in slide-in-from-left-2 text-sm">
                                <label className="text-xs text-gray-500 mb-1 block">District / Area</label>
                                <select
                                    className="w-full rounded-lg border-gray-200 text-sm bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500"
                                    value={currentParams.city || ''}
                                    onChange={(e) => updateFilter('city', e.target.value)}
                                >
                                    <option value={selectedLga}>All {selectedLga}</option>
                                    {ABUJA_LOCATIONS.find(l => l.lga === selectedLga)?.districts.map(dist => (
                                        <option key={dist} value={dist}>{dist}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Jara Deals Toggle */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-emerald-500" />
                        Jara Deals
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={!!currentParams.minJara}
                                onChange={(e) => updateFilter('minJara', e.target.checked ? '1' : null)}
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                        </div>
                        <span className="text-sm text-gray-700">Show only items with Jara</span>
                    </label>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900">Price Range (₦)</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))}
                            onBlur={() => updateFilter('minPrice', priceRange.min || null)}
                            className="w-full rounded-lg border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))}
                            onBlur={() => updateFilter('maxPrice', priceRange.max || null)}
                            className="w-full rounded-lg border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* Logistics Badge */}
                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Truck className="h-3 w-3" />
                        <span>Logistics options available at checkout</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
