'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderTree, ChevronRight, ChevronDown, Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/app/actions/categories'
import { toast } from 'sonner'

type Category = {
    id: string
    name: string
    slug: string
    icon: string | null
    parent_id: string | null
}

function NewCategoryForm({ parentId, onDone }: { parentId: string | null; onDone: () => void }) {
    const [name, setName] = useState('')
    const [icon, setIcon] = useState('')
    const [saving, setSaving] = useState(false)

    const handleCreate = async () => {
        if (!name.trim()) return
        setSaving(true)
        const result = await createCategoryAction({ name: name.trim(), icon: icon.trim(), parentId })
        setSaving(false)
        if (result.success) {
            toast.success('Category created')
            setName('')
            setIcon('')
            onDone()
        } else {
            toast.error(result.error || 'Failed to create category')
        }
    }

    return (
        <div className="flex items-center gap-2 p-3 pl-10 bg-gray-850">
            <Input
                placeholder="Icon (emoji)"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-24 bg-gray-900 border-gray-700 text-white"
            />
            <Input
                placeholder={parentId ? 'Subcategory name' : 'Category name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate} disabled={saving || !name.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
        </div>
    )
}

function CategoryRow({ category, indent, onChanged }: { category: Category; indent: boolean; onChanged: () => void }) {
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(category.name)
    const [icon, setIcon] = useState(category.icon || '')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) return
        setSaving(true)
        const result = await updateCategoryAction(category.id, { name: name.trim(), icon: icon.trim() })
        setSaving(false)
        if (result.success) {
            toast.success('Category updated')
            setEditing(false)
            onChanged()
        } else {
            toast.error(result.error || 'Failed to update category')
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return
        setDeleting(true)
        const result = await deleteCategoryAction(category.id)
        setDeleting(false)
        if (result.success) {
            toast.success('Category deleted')
            onChanged()
        } else {
            toast.error(result.error || 'Failed to delete category')
        }
    }

    if (editing) {
        return (
            <div className={`flex items-center gap-2 p-3 ${indent ? 'pl-10' : ''} bg-gray-850`}>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-24 bg-gray-900 border-gray-700 text-white" />
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-900 border-gray-700 text-white" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className={`flex items-center gap-3 p-3 ${indent ? 'pl-10 text-gray-300 hover:bg-gray-700/50' : 'bg-gray-750 hover:bg-gray-700'} transition-colors group`}>
            {indent ? <ChevronRight className="h-4 w-4 text-gray-500" /> : <FolderTree className="h-5 w-5 text-purple-400" />}
            {category.icon && <span>{category.icon}</span>}
            <span className={indent ? '' : 'font-medium text-white'}>{category.name}</span>
            <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-400" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
            </span>
        </div>
    )
}

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
    const [categories] = useState(initialCategories)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [addingChildTo, setAddingChildTo] = useState<string | null>(null)
    const [addingTop, setAddingTop] = useState(false)

    // Server actions revalidate the page path, but since this is a client
    // component holding its own copy of the list, force a hard reload of the
    // data by re-fetching isn't wired up -- simplest correct option is a
    // full route refresh.
    const onChanged = () => {
        setAddingChildTo(null)
        setAddingTop(false)
        window.location.reload()
    }

    const parentCategories = categories.filter((c) => !c.parent_id)
    const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

    const toggle = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div className="space-y-6">
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
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <FolderTree className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{categories.length - parentCategories.length}</p>
                            <p className="text-sm text-gray-400">Subcategories</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-white">Category Hierarchy</CardTitle>
                        <CardDescription className="text-gray-400">All product categories and their subcategories</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setAddingTop(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Add Category
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {addingTop && <NewCategoryForm parentId={null} onDone={onChanged} />}
                        {parentCategories.map((parent) => {
                            const children = getChildren(parent.id)
                            const isExpanded = expanded.has(parent.id)
                            return (
                                <div key={parent.id} className="border border-gray-700 rounded-lg overflow-hidden">
                                    <div className="flex items-center">
                                        <button
                                            className="p-2 text-gray-500 hover:text-white"
                                            onClick={() => toggle(parent.id)}
                                            aria-label="Toggle subcategories"
                                        >
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        <div className="flex-1">
                                            <CategoryRow category={parent} indent={false} onChanged={onChanged} />
                                        </div>
                                        <span className="text-gray-500 text-sm mr-4">{children.length} subcategories</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="mr-2 text-gray-400 hover:text-white"
                                            onClick={() => { setAddingChildTo(parent.id); setExpanded((prev) => new Set(prev).add(parent.id)) }}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Sub
                                        </Button>
                                    </div>
                                    {isExpanded && (children.length > 0 || addingChildTo === parent.id) && (
                                        <div className="bg-gray-850 border-t border-gray-700">
                                            {children.map((child) => (
                                                <CategoryRow key={child.id} category={child} indent onChanged={onChanged} />
                                            ))}
                                            {addingChildTo === parent.id && (
                                                <NewCategoryForm parentId={parent.id} onDone={onChanged} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {parentCategories.length === 0 && (
                            <div className="text-center text-gray-500 py-8">No categories found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
