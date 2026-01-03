'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, Plus, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { InsertTables } from '@/types/database'

export default function NewProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
        jaraBuyQty: '0',
        jaraGetQty: '0',
    })

    // In a real app, this would be fetched from the DB
    const categories = [
        { id: 'cat-1', name: 'Electronics' },
        { id: 'cat-2', name: 'Fashion' },
        { id: 'cat-3', name: 'Food & Groceries' },
        { id: 'cat-4', name: 'Health & Beauty' },
        { id: 'cat-5', name: 'Home & Garden' },
    ]

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()

            // Get current user and their store
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (storeError || !store) throw new Error('Store not found')

            // Create product
            const { error: productError } = await supabase
                .from('products')
                .insert({
                    store_id: (store as any).id,
                    category_id: formData.category || null, // Handle optional category
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    stock_quantity: parseInt(formData.stockQuantity),
                    jara_buy_quantity: parseInt(formData.jaraBuyQty) || 0,
                    jara_get_quantity: parseInt(formData.jaraGetQty) || 0,
                    status: 'active',
                } as any)

            if (productError) throw productError

            router.push('/dashboard/products')
            router.refresh()
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Failed to create product')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/products">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                    <p className="text-sm text-gray-500">Create a new listing for your store</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="space-y-6 lg:col-span-2">
                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Product Name</label>
                                <Input
                                    name="name"
                                    placeholder="e.g. Premium Basmati Rice (50kg)"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    name="description"
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Describe your product features, specifications, etc."
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        name="category"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Stock Quantity</label>
                                    <Input
                                        name="stockQuantity"
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 100"
                                        value={formData.stockQuantity}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Jara</CardTitle>
                            <CardDescription>
                                Set your price and configure your Jara (bonus) offer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Unit Price (₦)</label>
                                <Input
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="text-lg font-medium"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                                <div className="mb-4 flex items-center gap-2 text-amber-900">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                                        🎁
                                    </div>
                                    <h3 className="font-semibold">Jara Configuration</h3>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Customer Buys (Qty)
                                        </label>
                                        <Input
                                            name="jaraBuyQty"
                                            type="number"
                                            min="0"
                                            className="bg-white"
                                            value={formData.jaraBuyQty}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Customer Gets Free (Qty)
                                        </label>
                                        <Input
                                            name="jaraGetQty"
                                            type="number"
                                            min="0"
                                            className="bg-white"
                                            value={formData.jaraGetQty}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {parseInt(formData.jaraBuyQty) > 0 && parseInt(formData.jaraGetQty) > 0 && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                                        <Info className="h-4 w-4" />
                                        Preview: Buy {formData.jaraBuyQty}, Get {formData.jaraGetQty} Jara
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Media</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50">
                                <div>
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-sm font-medium text-gray-600">
                                        Upload Images
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Drag & drop or click
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-square rounded-md bg-gray-100" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Create Product'
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    )
}
