import { createClient } from '@/lib/supabase/server'
import { getLegalDocumentAction } from '@/app/actions/legal'

export default async function TermsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let audience: 'customer' | 'retailer' | 'brand_admin' | null = null
    if (user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single() as any
        if (userData?.role === 'customer' || userData?.role === 'retailer' || userData?.role === 'brand_admin') {
            audience = userData.role
        }
    }

    const doc = await getLegalDocumentAction('terms', audience)

    return (
        <div className="container mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold text-gray-900">{doc?.title || 'Terms of Service'}</h1>
            {doc && (
                <p className="mt-2 text-sm text-gray-400">Last updated {new Date(doc.updated_at).toLocaleDateString()}</p>
            )}
            <div className="prose prose-gray mt-8 max-w-none whitespace-pre-wrap text-gray-700">
                {doc?.content || 'This page has not been published yet.'}
            </div>
        </div>
    )
}
