import { createAdminClient } from '@/lib/supabase/server'
import { CategoriesManager } from '@/components/admin/categories-manager'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
    const supabase = await createAdminClient()

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug, icon, parent_id')
        .order('name') as any

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Category Management</h1>
                <p className="text-gray-400">View and manage product categories</p>
            </div>
            <CategoriesManager initialCategories={categories || []} />
        </div>
    )
}
