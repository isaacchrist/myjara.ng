'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/app/actions/admin-auth'
import { revalidatePath } from 'next/cache'

export type LegalAudience = 'global' | 'customer' | 'retailer' | 'brand_admin'
export type LegalDocType = 'privacy' | 'terms'

export type LegalDocument = {
    id: string
    doc_type: LegalDocType
    audience: LegalAudience
    title: string
    content: string
    version: number
    updated_at: string
}

// Public: used by /terms and /privacy. Prefers a role-specific override,
// falls back to the 'global' document if the viewer has no role or no
// override exists for their role.
export async function getLegalDocumentAction(docType: LegalDocType, audience: LegalAudience | null): Promise<LegalDocument | null> {
    const supabase = await createClient()

    if (audience && audience !== 'global') {
        const { data: override } = await (supabase.from('legal_documents') as any)
            .select('*')
            .eq('doc_type', docType)
            .eq('audience', audience)
            .maybeSingle()

        if (override) return override
    }

    const { data: global } = await (supabase.from('legal_documents') as any)
        .select('*')
        .eq('doc_type', docType)
        .eq('audience', 'global')
        .maybeSingle()

    return global || null
}

// Admin-only: every document, for the management UI.
export async function getAllLegalDocumentsForAdminAction(): Promise<LegalDocument[]> {
    if (!(await getAdminSession())) return []

    const admin = await createAdminClient()
    const { data } = await (admin.from('legal_documents') as any)
        .select('*')
        .order('doc_type')
        .order('audience')

    return data || []
}

export async function upsertLegalDocumentAction(doc: {
    id?: string
    doc_type: LegalDocType
    audience: LegalAudience
    title: string
    content: string
}) {
    if (!(await getAdminSession())) {
        return { success: false, error: 'Unauthorized' }
    }

    if (!doc.title.trim() || !doc.content.trim()) {
        return { success: false, error: 'Title and content are required' }
    }

    const admin = await createAdminClient()

    const { error } = doc.id
        ? await (admin.from('legal_documents') as any)
            .update({
                title: doc.title.trim(),
                content: doc.content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', doc.id)
        : await (admin.from('legal_documents') as any)
            .insert({
                doc_type: doc.doc_type,
                audience: doc.audience,
                title: doc.title.trim(),
                content: doc.content,
            })

    if (error) {
        console.error('Upsert legal document error:', error)
        return { success: false, error: error.code === '23505' ? 'A document for that audience already exists' : 'Failed to save document' }
    }

    revalidatePath('/admin/legal')
    revalidatePath('/terms')
    revalidatePath('/privacy')
    return { success: true }
}

export async function deleteLegalDocumentAction(id: string) {
    if (!(await getAdminSession())) {
        return { success: false, error: 'Unauthorized' }
    }

    const admin = await createAdminClient()
    const { error } = await admin.from('legal_documents').delete().eq('id', id)

    if (error) {
        console.error('Delete legal document error:', error)
        return { success: false, error: 'Failed to delete document' }
    }

    revalidatePath('/admin/legal')
    revalidatePath('/terms')
    revalidatePath('/privacy')
    return { success: true }
}
