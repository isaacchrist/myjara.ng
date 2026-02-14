'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Category } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Loader2, Check } from 'lucide-react'

function CategorySelectionContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get existing params to preserve
    const phone = searchParams.get('phone')
    const shopType = searchParams.get('type') || 'physical'

    // State for Categories
    interface CategoryWithChildren extends Category {
        subcategories: Category[]
    }
    const [categories, setCategories] = useState<CategoryWithChildren[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)

    // Selection State
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [viewingCategory, setViewingCategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Load Categories on Mount
    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('sort_order')

            if (data) {
                // Organize into Tree: Parent -> Children
                const allCategories = data as Category[]
                const parents = allCategories.filter(c => !c.parent_id)
                const children = allCategories.filter(c => c.parent_id)

                const tree = parents.map(parent => ({
                    ...parent,
                    subcategories: children.filter(c => c.parent_id === parent.id)
                }))

                setCategories(tree)
                // Default view first category
                if (tree.length > 0) setViewingCategory(tree[0].id)
            }
            setIsLoadingCategories(false)
        }
        fetchCategories()
    }, [])

    const toggleSelection = (id: string) => {
        // Enforce basic limit of 5 initially (User can upgrade later)
        const LIMIT = 5
        if (selectedCategories.includes(id)) {
            setSelectedCategories(prev => prev.filter(catId => catId !== id))
        } else {
            if (selectedCategories.length >= LIMIT) return
            setSelectedCategories(prev => [...prev, id])
        }
    }

    const handleContinue = () => {
        if (selectedCategories.length === 0) return
        setLoading(true)
        const params = new URLSearchParams()
        if (phone) params.set('phone', phone)
        if (shopType) params.set('type', shopType)

        // Pass selections
        params.set('categories', selectedCategories.join(','))
        // Legacy support
        params.set('category', selectedCategories[0])

        router.push(`/register/retailer?${params.toString()}`)
    }

    const currentCategory = categories.find(c => c.id === viewingCategory)

    if (isLoadingCategories) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 md:py-12 px-4">
            <div className="w-full max-w-5xl space-y-6 md:space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">What do you sell?</h1>
                    <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base">
                        Select up to 5 categories or subcategories that best describe your business.
                    </p>
                </div>

                {/* Selection Chips */}
                {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        <span className="text-sm font-medium text-gray-600 mr-1">Selected:</span>
                        <span className="text-sm font-bold text-emerald-600">{selectedCategories.length}/5</span>
                    </div>
                )}

                {/* Mobile: Accordion layout / Desktop: Side-by-side panels */}
                {/* MOBILE VIEW */}
                <div className="md:hidden space-y-2">
                    {categories.map(cat => {
                        const isSelected = selectedCategories.includes(cat.id)
                        const isExpanded = viewingCategory === cat.id
                        const childSelectedCount = cat.subcategories.filter(sub => selectedCategories.includes(sub.id)).length

                        return (
                            <div key={cat.id} className="rounded-xl border bg-white overflow-hidden">
                                {/* Category header row */}
                                <div
                                    onClick={() => setViewingCategory(isExpanded ? null : cat.id)}
                                    className={`flex items-center justify-between p-4 cursor-pointer touch-manipulation transition-colors ${isExpanded ? 'bg-emerald-50 border-b border-emerald-100' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{cat.icon}</span>
                                        <div>
                                            <span className={`text-sm font-medium ${isExpanded ? 'text-emerald-900' : 'text-gray-700'}`}>{cat.name}</span>
                                            {(childSelectedCount > 0 || isSelected) && (
                                                <span className="block text-xs text-emerald-600 font-medium">
                                                    {isSelected ? 'Selected' : `${childSelectedCount} selected`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(cat.id) }}
                                            className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors touch-manipulation ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}
                                        >
                                            {isSelected && <Check className="h-4 w-4 text-white" />}
                                        </div>
                                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90 text-emerald-500' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded subcategories */}
                                {isExpanded && cat.subcategories.length > 0 && (
                                    <div className="p-3 space-y-2 bg-gray-50/50">
                                        {cat.subcategories.map(sub => {
                                            const isSubSelected = selectedCategories.includes(sub.id)
                                            return (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => toggleSelection(sub.id)}
                                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between touch-manipulation min-h-[48px] ${isSubSelected
                                                        ? 'bg-emerald-600 text-white shadow-md active:bg-emerald-700'
                                                        : 'bg-white border border-gray-100 active:bg-emerald-50'
                                                        }`}
                                                >
                                                    <span className="font-medium">{sub.name}</span>
                                                    {isSubSelected && <CheckCircle2 className="h-4 w-4" />}
                                                    {!isSubSelected && <div className="h-4 w-4 rounded-full border border-gray-300" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {isExpanded && cat.subcategories.length === 0 && (
                                    <div className="p-4 text-center text-gray-400 text-sm">
                                        No subcategories. Use the checkbox above to select this category directly.
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden md:grid grid-cols-12 gap-6 items-start h-[600px]">
                    {/* Main Categories List (Left) */}
                    <div className="col-span-5 flex flex-col gap-2 h-full overflow-y-auto pr-2">
                        <h3 className="font-semibold text-gray-700 ml-1 mb-2">Categories</h3>
                        {categories.map(cat => {
                            const isSelected = selectedCategories.includes(cat.id)
                            const isViewing = viewingCategory === cat.id
                            const childSelectedCount = cat.subcategories.filter(sub => selectedCategories.includes(sub.id)).length

                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => setViewingCategory(cat.id)}
                                    className={`cursor-pointer group relative rounded-xl border p-3 transition-all flex items-center justify-between ${isViewing
                                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 shadow-sm'
                                        : 'border-white bg-white hover:border-emerald-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{cat.icon}</span>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium ${isViewing ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                {cat.name}
                                            </span>
                                            {(childSelectedCount > 0 || isSelected) && (
                                                <span className="text-xs text-emerald-600 font-medium">
                                                    {isSelected ? 'Selected' : `${childSelectedCount} sub-items selected`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(cat.id) }}
                                            className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 hover:border-emerald-400 bg-white'
                                                }`}
                                        >
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <ChevronRight className={`h-4 w-4 text-gray-400 ${isViewing ? 'text-emerald-500' : ''}`} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Subcategories Panel (Right) */}
                    <div className="col-span-7 h-full">
                        <h3 className="font-semibold text-gray-700 ml-1 mb-2">Subcategories</h3>
                        <Card className="h-full border-2 border-emerald-100 bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
                            <CardContent className="p-0 flex-1 overflow-y-auto">
                                {currentCategory ? (
                                    <div className="p-4 space-y-1">
                                        <div className="flex items-center gap-2 pb-4 pt-2 px-2 border-b border-gray-100 mb-2 sticky top-0 bg-white z-10">
                                            <span className="text-2xl">{currentCategory.icon}</span>
                                            <h4 className="font-bold text-gray-900">{currentCategory.name}</h4>
                                        </div>

                                        {currentCategory.subcategories.length > 0 ? (
                                            <div className="grid gap-2">
                                                {currentCategory.subcategories.map(sub => {
                                                    const isSelected = selectedCategories.includes(sub.id)
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => toggleSelection(sub.id)}
                                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between group ${isSelected
                                                                ? 'bg-emerald-600 text-white shadow-md'
                                                                : 'bg-white border border-gray-100/50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                                                }`}
                                                        >
                                                            <span className="font-medium">{sub.name}</span>
                                                            {isSelected && <CheckCircle2 className="h-4 w-4" />}
                                                            {!isSelected && <div className="h-4 w-4 rounded-full border border-gray-300 group-hover:border-emerald-400" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-gray-400">
                                                <p>No subcategories found. You can select the main category.</p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => toggleSelection(currentCategory.id)}
                                                >
                                                    Select {currentCategory.name}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                                        <div className="p-4 rounded-full bg-gray-100 mb-4">
                                            <ArrowLeft className="h-6 w-6" />
                                        </div>
                                        <p>Select a category from the left to view specific options</p>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">
                                    Selected: <span className="text-emerald-600 font-bold">{selectedCategories.length}</span>/5
                                </span>
                                {selectedCategories.length >= 5 && (
                                    <span className="text-xs text-amber-600 font-medium">Max limit reached</span>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <Button variant="ghost" onClick={() => router.back()}>
                        Back
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleContinue}
                        disabled={selectedCategories.length === 0 || loading}
                        className="bg-emerald-600 hover:bg-emerald-700 min-w-[200px]"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Continue ({selectedCategories.length}) <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function CategorySelectionPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        }>
            <CategorySelectionContent />
        </Suspense>
    )
}
