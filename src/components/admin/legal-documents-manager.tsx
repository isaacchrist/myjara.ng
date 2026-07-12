'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'
import {
    upsertLegalDocumentAction,
    deleteLegalDocumentAction,
    type LegalDocument,
    type LegalDocType,
    type LegalAudience,
} from '@/app/actions/legal'
import { toast } from 'sonner'

const DOC_TYPES: { key: LegalDocType; label: string }[] = [
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms of Service' },
]

const AUDIENCES: { key: LegalAudience; label: string; description: string }[] = [
    { key: 'global', label: 'Global', description: 'Shown to everyone, including logged-out visitors, unless a role override below applies.' },
    { key: 'customer', label: 'Customers', description: 'Overrides Global for logged-in customers.' },
    { key: 'retailer', label: 'Retailers', description: 'Overrides Global for retailer (shop owner) accounts.' },
    { key: 'brand_admin', label: 'Wholesalers / Brands', description: 'Overrides Global for brand/wholesaler accounts.' },
]

function DocumentForm({
    docType,
    audience,
    doc,
    onDone,
}: {
    docType: LegalDocType
    audience: LegalAudience
    doc?: LegalDocument
    onDone: () => void
}) {
    const [title, setTitle] = useState(doc?.title || (docType === 'privacy' ? 'Privacy Policy' : 'Terms of Service'))
    const [content, setContent] = useState(doc?.content || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Title and content are required')
            return
        }
        setSaving(true)
        const result = await upsertLegalDocumentAction({
            id: doc?.id,
            doc_type: docType,
            audience,
            title: title.trim(),
            content,
        })
        setSaving(false)
        if (result.success) {
            toast.success(doc ? 'Document updated' : 'Document created')
            onDone()
        } else {
            toast.error(result.error || 'Failed to save document')
        }
    }

    return (
        <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg space-y-3">
            <div>
                <label className="text-xs text-gray-500">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-gray-900 border-gray-700 text-white" />
            </div>
            <div>
                <label className="text-xs text-gray-500">Content</label>
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={14}
                    className="bg-gray-900 border-gray-700 text-white font-mono text-sm"
                    placeholder="Plain text or Markdown-style paragraphs -- rendered as-is with line breaks preserved."
                />
            </div>
            <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onDone}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
            </div>
        </div>
    )
}

function DocumentRow({ doc, onChanged }: { doc: LegalDocument; onChanged: () => void }) {
    const [editing, setEditing] = useState(false)
    const [busy, setBusy] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Remove this ${doc.audience} override? Viewers in that group will fall back to the Global document.`)) return
        setBusy(true)
        const result = await deleteLegalDocumentAction(doc.id)
        setBusy(false)
        if (result.success) {
            toast.success('Override removed')
            onChanged()
        } else {
            toast.error(result.error || 'Failed to remove override')
        }
    }

    if (editing) {
        return <DocumentForm docType={doc.doc_type} audience={doc.audience} doc={doc} onDone={() => { setEditing(false); onChanged() }} />
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-750 hover:bg-gray-700 transition-colors group">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
                <FileText className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{doc.title}</p>
                <p className="text-xs text-gray-400">
                    {doc.content.length.toLocaleString()} characters &middot; updated {new Date(doc.updated_at).toLocaleDateString()}
                </p>
            </div>
            <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                {doc.audience !== 'global' && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-400" onClick={handleDelete} disabled={busy}>
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                )}
            </span>
        </div>
    )
}

export function LegalDocumentsManager({ initialDocuments }: { initialDocuments: LegalDocument[] }) {
    const [addingKey, setAddingKey] = useState<string | null>(null)

    const onChanged = () => {
        setAddingKey(null)
        window.location.reload()
    }

    return (
        <div className="space-y-6">
            {DOC_TYPES.map(({ key: docType, label }) => (
                <Card key={docType} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">{label}</CardTitle>
                        <CardDescription className="text-gray-400">
                            Editable at /admin/legal, rendered at /{docType === 'privacy' ? 'privacy' : 'terms'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {AUDIENCES.map(({ key: audience, label: audienceLabel, description }) => {
                            const doc = initialDocuments.find((d) => d.doc_type === docType && d.audience === audience)
                            const addKey = `${docType}:${audience}`

                            return (
                                <div key={audience} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-300">{audienceLabel}</p>
                                            <p className="text-xs text-gray-500">{description}</p>
                                        </div>
                                        {!doc && addingKey !== addKey && (
                                            <Button size="sm" variant="outline" onClick={() => setAddingKey(addKey)}>
                                                <Plus className="h-4 w-4 mr-1" /> Add override
                                            </Button>
                                        )}
                                    </div>
                                    {doc && <DocumentRow doc={doc} onChanged={onChanged} />}
                                    {!doc && addingKey === addKey && (
                                        <DocumentForm docType={docType} audience={audience} onDone={onChanged} />
                                    )}
                                    {!doc && addingKey !== addKey && (
                                        <p className="text-xs text-gray-600 italic pl-1">No override -- falls back to Global.</p>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
