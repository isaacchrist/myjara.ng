'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Package, MapPin, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

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
        pickup_longitude: null as number | null
    })

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: store } = await supabase
                .from('stores')
                .select('*')
                .eq('owner_id', user.id)
                .single()
            setStore(store)

            const { data: cats } = await supabase
                .from('categories')
                .select('id, name')
                .is('parent_id', null)
                .order('name')
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
                status: 'active'
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
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
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

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Product Name *</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Fresh Tomatoes"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe your product..."
                                className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Price (₦) *</label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Stock Quantity *</label>
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
                            <label className="text-sm font-medium">Category</label>
                            <select
                                value={formData.category_id}
                                onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                className="w-full rounded-md border px-3 py-2 text-sm"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Pickup Location */}
                        <div className="pt-4 border-t">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Pickup Location
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Where can buyers pick up this product?</p>
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
                                    📍 GPS: {formData.pickup_latitude.toFixed(4)}, {formData.pickup_longitude?.toFixed(4)}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/seller/products">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Product
                    </Button>
                </div>
            </form>
        </div>
    )
}
