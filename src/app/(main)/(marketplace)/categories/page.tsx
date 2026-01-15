import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpandableCategories } from '@/components/marketplace/expandable-categories'

export default async function CategoriesPage() {
    const supabase = await createClient()

    // Fetch all categories (including subcategories) with product counts
    const { data: categories, error } = await supabase
        .from('categories')
        .select(`
            id,
            name,
            slug,
            icon,
            parent_id,
            products(count)
        `)
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('Error fetching categories:', error)
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 md:py-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">Browse Categories</h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-500">
                        Explore thousands of products across all categories on MyJara. Click on a category to see subcategories.
                    </p>
                </div>

                {/* Categories Grid - Expandable */}
                {categories && categories.length > 0 ? (
                    <ExpandableCategories categories={categories as any} />
                ) : (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                            <ShoppingBag className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No categories found</h3>
                        <p className="text-gray-500">We're still setting up our marketplace categories. Check back soon!</p>
                    </div>
                )}

                {/* Secondary CTA */}
                <div className="mt-20 rounded-3xl bg-emerald-900 p-8 text-center text-white md:p-12">
                    <h2 className="mb-4 text-3xl font-bold">Can't find what you're looking for?</h2>
                    <p className="mb-8 text-emerald-100/80">Search directly for specific products or brands across Nigeria.</p>
                    <Button size="lg" className="rounded-full bg-emerald-500 hover:bg-emerald-400" asChild>
                        <Link href="/search">Open Search Engine</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

