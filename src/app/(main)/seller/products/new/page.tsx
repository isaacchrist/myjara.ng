'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ImageUpload } from '@/components/ui/image-upload'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function AddProductPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [store, setStore] = useState<any>(null)
    const [categories, setCategories] = useState<any[]>([])

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        images: [] as string[],
        pickup_location: '',
        pickup_latitude: null as number | null,
        pickup_longitude: null as number | null,

        // Jara Fields
        jara_is_same: true,
        jara_amount: '1',
        jara_name: '',
        jara_description: '',
        jara_image: [] as string[] // Array for consistency with upload component
    })

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single()
            setStore(store)

            const { data: cats } = await supabase.from('categories').select('id, name').is('parent_id', null).order('name')
            setCategories(cats || [])
        }
        fetchData()
    }, [router])

    const capturePickupLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: 'Error', description: 'Geolocation not supported', variant: 'destructive' })
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    pickup_latitude: position.coords.latitude,
                    pickup_longitude: position.coords.longitude,
                    pickup_location: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
                }))
                toast({ title: 'Success', description: 'Pickup location captured!' })
            },
            (error) => {
                toast({ title: 'Error', description: 'Failed to get location: ' + error.message, variant: 'destructive' })
            }
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!store) {
            toast({ title: 'Error', description: 'No store found', variant: 'destructive' })
            return
        }

        // 1. Validation: Minimum 2 Images
        if (formData.images.length < 2) {
            toast({
                title: 'Validation Error',
                description: 'Please upload at least 2 images for your product.',
                variant: 'destructive'
            })
            return
        }

        // 2. Validation: Jara Logic (if different)
        if (!formData.jara_is_same) {
            if (!formData.jara_name || !formData.jara_description || formData.jara_image.length === 0) {
                toast({
                    title: 'Validation Error',
                    description: 'Please provide Name, Description, and Image for the Jara product.',
                    variant: 'destructive'
                })
                return
            }
        }

        setLoading(true)
        try {
            const supabase = createClient()

            const productData = {
                store_id: store.id,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                stock_quantity: parseInt(formData.stock_quantity) || 0,
                category_id: formData.category_id || null,
                images: formData.images,
                pickup_location: formData.pickup_location ? {
                    address: formData.pickup_location,
                    latitude: formData.pickup_latitude,
                    longitude: formData.pickup_longitude
                } : null,
                status: 'active',

                // Jara Data
                jara_is_same: formData.jara_is_same,
                jara_amount: parseInt(formData.jara_amount) || 1,
                jara_name: formData.jara_is_same ? null : formData.jara_name,
                jara_description: formData.jara_is_same ? null : formData.jara_description,
                jara_image_url: (!formData.jara_is_same && formData.jara_image.length > 0) ? formData.jara_image[0] : null
            }

            const { error } = await supabase.from('products').insert(productData as any)

            if (error) throw error

            toast({ title: 'Success', description: 'Product added successfully!' })
            router.push('/seller/products')

        } catch (error: any) {
            console.error('Error adding product:', error)
            toast({ title: 'Error', description: error.message || 'Failed to add product', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/seller/products">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Add New Product</h1>
                    <p className="text-gray-500">List a product for sale on MyJara</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Product Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Fresh Tomatoes"
                                required
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe your product..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Price (₦) *</Label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Stock Quantity *</Label>
                                <Input
                                    type="number"
                                    value={formData.stock_quantity}
                                    onChange={e => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Category</Label>
                            <select
                                value={formData.category_id}
                                onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Images */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Images</CardTitle>
                        <CardDescription>Upload at least 2 images of your product.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ImageUpload
                            value={formData.images}
                            onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                            maxFiles={5}
                        />
                    </CardContent>
                </Card>

                {/* Pickup Location */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pickup Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label>Location</Label>
                        <div className="flex gap-2">
                            <Input
                                value={formData.pickup_location}
                                onChange={e => setFormData(prev => ({ ...prev, pickup_location: e.target.value }))}
                                placeholder="e.g. Wuse Market, Block A"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" onClick={capturePickupLocation}>
                                <MapPin className="h-4 w-4 mr-1" />
                                Use GPS
                            </Button>
                        </div>
                        {formData.pickup_latitude && (
                            <p className="text-xs text-emerald-600 mt-1">
                                📍 GPS captured: {formData.pickup_latitude.toFixed(4)}, {formData.pickup_longitude?.toFixed(4)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Jara Options */}
                <Card className="border-emerald-200 bg-emerald-50/30">
                    <CardHeader>
                        <CardTitle className="text-emerald-800">Jara Options</CardTitle>
                        <CardDescription>Configure the bonus (Jara) customers get when buying this.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Same as Main Product</Label>
                                <p className="text-sm text-gray-500">
                                    Is the Jara item the same as the product above?
                                </p>
                            </div>
                            <Switch
                                checked={formData.jara_is_same}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, jara_is_same: checked }))}
                            />
                        </div>

                        <div>
                            <Label>Jara Amount (Quantity)</Label>
                            <Input
                                type="number"
                                value={formData.jara_amount}
                                onChange={e => setFormData(prev => ({ ...prev, jara_amount: e.target.value }))}
                                className="max-w-[150px]"
                            />
                        </div>

                        {!formData.jara_is_same && (
                            <div className="space-y-4 p-4 border rounded-lg bg-white animate-in slide-in-from-top-2">
                                <h3 className="font-semibold text-gray-900">Jara Details</h3>
                                <div>
                                    <Label>Jara Name *</Label>
                                    <Input
                                        value={formData.jara_name}
                                        onChange={e => setFormData(prev => ({ ...prev, jara_name: e.target.value }))}
                                        placeholder="e.g. Small packet of pepper"
                                    />
                                </div>
                                <div>
                                    <Label>Description *</Label>
                                    <Input
                                        value={formData.jara_description}
                                        onChange={e => setFormData(prev => ({ ...prev, jara_description: e.target.value }))}
                                        placeholder="Brief description"
                                    />
                                </div>
                                <div>
                                    <Label>Jara Image *</Label>
                                    <ImageUpload
                                        value={formData.jara_image}
                                        onChange={(urls) => setFormData(prev => ({ ...prev, jara_image: urls }))}
                                        maxFiles={1}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/seller/products">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 w-40">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Product
                    </Button>
                </div>
            </form>
        </div>
    )
}
