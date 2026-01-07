"use client"

import { useRouter, useSearchParams } from 'next/navigation'

export function ClientSortSelect({ currentSort }: { currentSort: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('sort', e.target.value)
        router.push(`?${params.toString()}`)
    }

    return (
        <select
            value={currentSort}
            onChange={handleSortChange}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
        >
            <option value="relevance">Most Relevant</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="jara_desc">Best Jara</option>
            <option value="hybrid">Best Value</option>
        </select>
    )
}
