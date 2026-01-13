import { AdminKeyForm } from '@/components/admin/admin-key-form'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getAdminSession } from '@/app/actions/admin-auth'

export default async function StoreAdminPage({ params }: { params: { slug: string } }) {
    const { slug } = params

    // 1. If already Global Admin, redirect to dashboard
    const isAdmin = await getAdminSession()
    if (isAdmin) {
        redirect('/dashboard')
    }

    // Verify store exists
    const supabase = await createClient()
    const { data: store } = await (supabase.from('stores') as any)
        .select('name')
        .eq('slug', slug)
        .single()

    if (!store) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
            <div className="mb-12 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{store.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">Store Administration Portal</p>
            </div>

            <AdminKeyForm
                expectedSlug={slug}
                title="Management Access"
                description={`Enter the access key for ${store.name} to continue.`}
            />

            <div className="mt-12 text-center text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} MyJara Platform. All rights reserved.</p>
            </div>
        </div>
    )
}
