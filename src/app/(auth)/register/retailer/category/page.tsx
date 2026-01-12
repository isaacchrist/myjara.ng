'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Category } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'

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

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Load Categories on Mount
    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('sort_order')

            if (error) {
                console.error('Failed to load categories', error)
            } else if (data) {
                // Organize into Tree: Parent -> Children
                const allCategories = data as Category[]
                const parents = allCategories.filter(c => !c.parent_id)
                const children = allCategories.filter(c => c.parent_id)

                const tree = parents.map(parent => ({
                    ...parent,
                    subcategories: children.filter(c => c.parent_id === parent.id)
                }))

                setCategories(tree)
            }
            setIsLoadingCategories(false)
        }
        fetchCategories()
    }, [])

    const handleCategoryClick = (catId: string) => {
        setSelectedCategory(catId)
        setSelectedSubcategory(null) // Reset sub on main change
    }

    const handleContinue = () => {
        if (!selectedCategory || !selectedSubcategory) return
        setLoading(true)
        const params = new URLSearchParams()
        if (phone) params.set('phone', phone)
        if (shopType) params.set('type', shopType)
        params.set('category', selectedCategory) // Now a UUID
        params.set('subcategory', selectedSubcategory) // Now a UUID
        router.push(`/register/retailer?${params.toString()}`)
    }

    const currentCategory = categories.find(c => c.id === selectedCategory)

    if (isLoadingCategories) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">What do you sell?</h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Select the primary category that best describes your business. This helps us personalize your experience.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Main Categories Grid */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 ml-1">1. Choose Category</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className={`cursor-pointer group relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:shadow-md ${selectedCategory === cat.id
                                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                                        : 'border-white bg-white hover:border-emerald-200'
                                        }`}
                                >
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                                            {cat.icon}
                                        </span>
                                        <span className={`text-sm font-medium ${selectedCategory === cat.id ? 'text-emerald-900' : 'text-gray-600'}`}>
                                            {cat.name}
                                        </span>
                                    </div>
                                    {selectedCategory === cat.id && (
                                        <div className="absolute top-2 right-2 text-emerald-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subcategories Panel */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 ml-1">2. Select Specific Type</h3>
                        <Card className={`h-full border-2 ${selectedCategory ? 'border-emerald-100' : 'border-dashed border-gray-200 bg-gray-50/50'}`}>
                            <CardContent className="p-6 h-full">
                                {selectedCategory && currentCategory ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                                        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                                            <span className="text-2xl">{currentCategory.icon}</span>
                                            <h4 className="font-bold text-gray-900">{currentCategory.name}</h4>
                                        </div>

                                        <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
                                            {currentCategory.subcategories.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => setSelectedSubcategory(sub.id)}
                                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedSubcategory === sub.id
                                                        ? 'bg-emerald-600 text-white shadow-md'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                                                        }`}
                                                >
                                                    <span className="font-medium">{sub.name}</span>
                                                    {selectedSubcategory === sub.id && <CheckCircle2 className="h-4 w-4" />}
                                                    {selectedSubcategory !== sub.id && <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50" />}
                                                </button>
                                            ))}
                                        </div>
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
                        </Card>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                    <Button variant="ghost" onClick={() => router.back()}>
                        Back
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleContinue}
                        disabled={!selectedCategory || !selectedSubcategory || loading}
                        className="bg-emerald-600 hover:bg-emerald-700 min-w-[200px]"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Continue to Details <ArrowRight className="ml-2 h-5 w-5" />
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
