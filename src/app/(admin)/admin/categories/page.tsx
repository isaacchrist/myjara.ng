import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { FolderTree, ChevronRight } from 'lucide-react'

export default async function AdminCategoriesPage() {
    const supabase = await createAdminClient()

    // Fetch all categories
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .order('name') as any

    const categoryList = categories || []

    // Build tree structure
    const parentCategories = categoryList.filter((c: any) => !c.parent_id)
    const getChildren = (parentId: string) => categoryList.filter((c: any) => c.parent_id === parentId)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Category Management</h1>
                <p className="text-gray-400">View and manage product categories</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <FolderTree className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{parentCategories.length}</p>
                            <p className="text-sm text-gray-400">Parent Categories</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <FolderTree className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{categoryList.length - parentCategories.length}</p>
                            <p className="text-sm text-gray-400">Subcategories</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Tree */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Category Hierarchy</CardTitle>
                    <CardDescription className="text-gray-400">All product categories and their subcategories</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {parentCategories.map((parent: any) => {
                            const children = getChildren(parent.id)
                            return (
                                <div key={parent.id} className="border border-gray-700 rounded-lg overflow-hidden">
                                    <div className="flex items-center gap-3 p-4 bg-gray-750 hover:bg-gray-700 transition-colors">
                                        <FolderTree className="h-5 w-5 text-purple-400" />
                                        <span className="font-medium text-white">{parent.name}</span>
                                        <span className="text-gray-500 text-sm ml-auto">{children.length} subcategories</span>
                                    </div>
                                    {children.length > 0 && (
                                        <div className="bg-gray-850 border-t border-gray-700">
                                            {children.map((child: any) => (
                                                <div key={child.id} className="flex items-center gap-3 p-3 pl-10 text-gray-300 hover:bg-gray-700/50">
                                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                                    <span>{child.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {parentCategories.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No categories found. Run the seed SQL to populate categories.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
