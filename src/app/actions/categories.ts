'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/app/actions/admin-auth'
import { revalidatePath } from 'next/cache'

function slugify(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

export async function createCategoryAction(data: { name: string; icon?: string; parentId?: string | null }) {
    if (!(await getAdminSession())) {
        return { success: false, error: 'Unauthorized' }
    }

    const admin = await createAdminClient()

    const slug = slugify(data.name)
    if (!slug) {
        return { success: false, error: 'Name is required' }
    }

    const { error } = await (admin.from('categories') as any).insert({
        name: data.name,
        slug,
        icon: data.icon || null,
        parent_id: data.parentId || null,
    })

    if (error) {
        console.error('Create category error:', error)
        return { success: false, error: error.code === '23505' ? 'A category with that name already exists' : 'Failed to create category' }
    }

    revalidatePath('/admin/categories')
    return { success: true }
}

export async function updateCategoryAction(id: string, data: { name: string; icon?: string }) {
    if (!(await getAdminSession())) {
        return { success: false, error: 'Unauthorized' }
    }

    const admin = await createAdminClient()

    const { error } = await (admin.from('categories') as any)
        .update({ name: data.name, icon: data.icon || null })
        .eq('id', id)

    if (error) {
        console.error('Update category error:', error)
        return { success: false, error: 'Failed to update category' }
    }

    revalidatePath('/admin/categories')
    return { success: true }
}

export async function deleteCategoryAction(id: string) {
    if (!(await getAdminSession())) {
        return { success: false, error: 'Unauthorized' }
    }

    const admin = await createAdminClient()

    const { count: childCount } = await admin
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', id) as any

    if (childCount && childCount > 0) {
        return { success: false, error: 'Delete or reassign its subcategories first' }
    }

    const { count: productCount } = await admin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id) as any

    if (productCount && productCount > 0) {
        return { success: false, error: `${productCount} product(s) still use this category` }
    }

    const { error } = await admin.from('categories').delete().eq('id', id)

    if (error) {
        console.error('Delete category error:', error)
        return { success: false, error: 'Failed to delete category' }
    }

    revalidatePath('/admin/categories')
    return { success: true }
}
