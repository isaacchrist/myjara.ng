import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function CategoriesPage() {
    const supabase = await createClient()

    // Fetch categories with product counts
    // Note: In a real app with many products, we might use a summary table or a specific RPC
    // For now, we fetch all categories and a count of active products
    const { data: categories, error } = await supabase
        .from('categories')
        .select(`
            *,
            products(count)
        `)
        .eq('products.status', 'active')
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
                        Explore thousands of products across all brand categories on MyJara.
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categories?.map((category: any) => (
                        <Link
                            key={category.id}
                            href={`/search?category=${category.slug}`}
                            className="group"
                        >
                            <Card className="h-full overflow-hidden border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                <CardContent className="p-8">
                                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                        {category.icon || '📦'}
                                    </div>
                                    <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                        {category.name}
                                    </h3>
                                    <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                                        <ShoppingBag className="h-4 w-4" />
                                        <span>{category.products?.[0]?.count || 0} Products</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                                        Explore now
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {(!categories || categories.length === 0) && (
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
