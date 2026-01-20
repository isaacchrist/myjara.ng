import Link from 'next/link'
import { Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export default async function ProductsPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get store for this user
    // (In real app, we'd handle the case where user has no store or multiple stores)
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id || '')
        .single()

    // Fetch products
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', (store as any)?.id || '')
        .order('created_at', { ascending: false }) as any

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-sm text-gray-500">Manage your product catalog and Jara offers</p>
                </div>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/dashboard/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search products..."
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </div>

            {/* Products Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Product Name</th>
                                <th className="px-6 py-4 font-medium">Price</th>
                                <th className="px-6 py-4 font-medium">Stock</th>
                                <th className="px-6 py-4 font-medium">Jara Offer</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!products || products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <p className="mb-2 text-lg">No products found</p>
                                        <p className="mb-4 text-sm">Get started by creating your first product</p>
                                        <Button asChild variant="outline">
                                            <Link href="/dashboard/products/new">
                                                Create Product
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ) : (
                                (products as any[]).map((product: any) => (
                                    <tr key={product.id} className="group hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gray-100" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.category_id || 'Uncategorized'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {formatPrice(product.price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={product.stock_quantity < 10 ? 'text-orange-600' : 'text-gray-600'}>
                                                {product.stock_quantity} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.jara_get_qty > 0 ? (
                                                <Badge variant="jara" className="text-xs">
                                                    Buy {product.jara_buy_qty} Get {product.jara_get_qty} Jara
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                                                {product.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-600">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
