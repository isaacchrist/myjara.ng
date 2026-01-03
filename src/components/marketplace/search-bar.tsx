'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
    initialQuery?: string
    initialCity?: string
    showFilters?: boolean
}

export function SearchBar({
    initialQuery = '',
    initialCity = '',
    showFilters = true
}: SearchBarProps) {
    const router = useRouter()
    const [query, setQuery] = useState(initialQuery)
    const [city, setCity] = useState(initialCity)
    const [showFilterPanel, setShowFilterPanel] = useState(false)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (city) params.set('city', city)
        router.push(`/search?${params.toString()}`)
    }

    const cities = [
        'Lagos',
        'Abuja',
        'Port Harcourt',
        'Kano',
        'Ibadan',
        'Kaduna',
        'Benin City',
        'Enugu',
    ]

    return (
        <div className="w-full">
            <form onSubmit={handleSearch}>
                <div className="flex flex-col gap-3 sm:flex-row">
                    {/* Main Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search for products..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-12 pl-12 text-base"
                        />
                    </div>

                    {/* City Filter */}
                    <div className="relative sm:w-48">
                        <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="flex h-12 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-12 pr-4 text-base shadow-sm transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="">All Cities</option>
                            {cities.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Button */}
                    <Button type="submit" size="lg" className="h-12 px-8">
                        <Search className="mr-2 h-5 w-5" />
                        Search
                    </Button>

                    {/* Filter Toggle */}
                    {showFilters && (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="h-12"
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </form>

            {/* Expanded Filters */}
            {showFilters && showFilterPanel && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {/* Price Range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Price Range
                            </label>
                            <div className="flex gap-2">
                                <Input type="number" placeholder="Min" className="h-10" />
                                <Input type="number" placeholder="Max" className="h-10" />
                            </div>
                        </div>

                        {/* Jara Minimum */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Minimum Free Items
                            </label>
                            <select className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
                                <option value="">Any Jara</option>
                                <option value="1">At least 1 free</option>
                                <option value="2">At least 2 free</option>
                                <option value="3">At least 3 free</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Category
                            </label>
                            <select className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
                                <option value="">All Categories</option>
                                <option value="electronics">Electronics</option>
                                <option value="fashion">Fashion</option>
                                <option value="food-groceries">Food & Groceries</option>
                                <option value="health-beauty">Health & Beauty</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
