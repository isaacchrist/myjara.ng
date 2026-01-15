'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Category {
    id: string
    name: string
    slug: string
    icon: string | null
    parent_id: string | null
    products: { count: number }[]
    subcategories?: Category[]
}

interface ExpandableCategoriesProps {
    categories: Category[]
}

export function ExpandableCategories({ categories }: ExpandableCategoriesProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Separate parent and child categories
    const parentCategories = categories.filter(cat => !cat.parent_id)

    // Group subcategories by parent_id
    const subcategoriesByParent: Record<string, Category[]> = {}
    categories.forEach(cat => {
        if (cat.parent_id) {
            if (!subcategoriesByParent[cat.parent_id]) {
                subcategoriesByParent[cat.parent_id] = []
            }
            subcategoriesByParent[cat.parent_id].push(cat)
        }
    })

    const toggleCategory = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parentCategories.map((category) => {
                const isExpanded = expandedId === category.id
                const subs = subcategoriesByParent[category.id] || []

                return (
                    <div key={category.id} className="group">
                        <Card className={`h-full overflow-hidden border-0 transition-all duration-300 ${isExpanded ? 'shadow-xl ring-2 ring-emerald-500' : 'hover:-translate-y-1 hover:shadow-xl'}`}>
                            <CardContent className="p-6">
                                {/* Header - Clickable to expand */}
                                <div
                                    className="cursor-pointer"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-2xl transition-colors group-hover:bg-emerald-100">
                                            {category.icon || '📦'}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            )}
                                        </Button>
                                    </div>
                                    <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                        {category.name}
                                    </h3>
                                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                                        <ShoppingBag className="h-4 w-4" />
                                        <span>{category.products?.[0]?.count || 0} Products</span>
                                        <span className="text-emerald-600 font-medium">
                                            • {subs.length} subcategories
                                        </span>
                                    </div>
                                </div>

                                {/* Subcategories - Expandable */}
                                {isExpanded && subs.length > 0 && (
                                    <div className="mt-4 border-t pt-4 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                        {subs.map((sub) => (
                                            <Link
                                                key={sub.id}
                                                href={`/search?category=${sub.slug}`}
                                                className="flex items-center gap-3 rounded-lg p-2 hover:bg-emerald-50 transition-colors"
                                            >
                                                <span className="text-lg">{sub.icon || '📁'}</span>
                                                <span className="text-sm font-medium text-gray-700 hover:text-emerald-600">
                                                    {sub.name}
                                                </span>
                                                <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {/* View All Link */}
                                {!isExpanded && (
                                    <Link
                                        href={`/search?category=${category.slug}`}
                                        className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:underline"
                                    >
                                        View all
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )
            })}
        </div>
    )
}
