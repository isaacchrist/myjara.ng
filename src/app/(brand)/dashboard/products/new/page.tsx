'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, X, Info, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'

export default function NewProductPage() {
    const router = useRouter()
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
        subcategory: '',
        jaraBuyQty: '0',
        jaraGetQty: '0',
        status: 'active'
    })

    // Image State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)

            // Validate (max 4, size 2MB)
            if (selectedFiles.length + newFiles.length > 4) {
                toast({ title: 'Error', description: 'Maximum 4 images allowed', variant: 'destructive' })
                return
            }

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file))

            setSelectedFiles(prev => [...prev, ...newFiles])
            setPreviews(prev => [...prev, ...newPreviews])
        }
    }

    const removeImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => {
            // Revoke URL to prevent memory leak
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()

            // 1. Auth & Store Check
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id, slug')
                .eq('owner_id', user.id)
                .single() as any

            if (storeError || !store) throw new Error('Store not found. Please create a store first.')

            // 2. Create Product
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    store_id: store.id,
                    category_id: formData.category,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    stock_quantity: parseInt(formData.stockQuantity),
                    jara_buy_quantity: parseInt(formData.jaraBuyQty) || 0,
                    jara_get_quantity: parseInt(formData.jaraGetQty) || 0,
                    status: formData.status,
                    attributes: {
                        subcategory_id: formData.subcategory
                    }
                } as any)
                .select('id')
                .single() as any

            if (productError) throw productError
            if (!product) throw new Error('Product creation failed')

            // 3. Upload Images
            if (selectedFiles.length > 0) {
                setUploading(true)
                const imagePromises = selectedFiles.map(async (file, index) => {
                    const ext = file.name.split('.').pop()
                    const path = `${store.id}/${product.id}/${Date.now()}_${index}.${ext}`

                    const { error: uploadError } = await supabase.storage
                        .from('product-images')
                        .upload(path, file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('product-images')
                        .getPublicUrl(path)

                    return {
                        product_id: product.id,
                        url: publicUrl,
                        sort_order: index,
                        is_primary: index === 0
                    }
                })

                const uploadedImages = await Promise.all(imagePromises)

                const { error: imgDbError } = await supabase
                    .from('product_images')
                    .insert(uploadedImages as any)

                if (imgDbError) throw imgDbError
            }

            toast({ title: 'Success', description: 'Product created successfully!' })
            router.push('/dashboard/products')
            router.refresh()

        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Failed to create product')
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    // Derived Logic
    const selectedCategory = PRODUCT_CATEGORIES.find(c => c.id === formData.category)

    return (
        <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2">
                            <Info className="h-4 w-4" /> {error}
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
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {PRODUCT_CATEGORIES.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subcategory</label>
                                    <select
                                        name="subcategory"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.subcategory}
                                        onChange={handleChange}
                                        disabled={!selectedCategory}
                                        required
                                    >
                                        <option value="">Select Subcategory</option>
                                        {selectedCategory?.subcategories.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
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
                            <CardTitle>Product Images</CardTitle>
                            <CardDescription>Upload up to 4 images. First image is the cover.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="grid w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50 mb-4"
                            >
                                <div>
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-sm font-medium text-gray-600">
                                        Upload Images
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        JPEG, PNG (Max 2MB)
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {previews.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group border">
                                        <img src={url} alt="Preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        {i === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1">
                                                Cover
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {Array.from({ length: Math.max(0, 4 - previews.length) }).map((_, i) => (
                                    <div key={i} className="aspect-square rounded-md bg-gray-50 border flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-gray-200" />
                                    </div>
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
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0">
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {uploading ? 'Uploading...' : 'Saving...'}
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
