import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Store, ExternalLink, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminStoresPage() {
    const supabase = await createAdminClient()

    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, slug, description, is_verified, created_at')
        .order('created_at', { ascending: false })
        .limit(50) as any

    const storeList = stores || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Store Management</h1>
                <p className="text-gray-400">View and manage all platform stores</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Store className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{storeList.length}</p>
                            <p className="text-sm text-gray-400">Total Stores</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Store className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{storeList.filter((s: any) => s.is_verified).length}</p>
                            <p className="text-sm text-gray-400">Verified</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <Store className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{storeList.filter((s: any) => !s.is_verified).length}</p>
                            <p className="text-sm text-gray-400">Pending</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stores Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {storeList.map((store: any) => (
                    <Card key={store.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-white text-lg">{store.name}</CardTitle>
                                    <CardDescription className="text-gray-500">@{store.slug}</CardDescription>
                                </div>
                                {store.is_verified ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Verified</Badge>
                                ) : (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                {store.description || 'No description provided'}
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:text-white flex-1" asChild>
                                    <Link href={`/store/${store.slug}`} target="_blank">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Store
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {storeList.length === 0 && (
                    <Card className="bg-gray-800 border-gray-700 col-span-full">
                        <CardContent className="py-12 text-center text-gray-500">
                            No stores found
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
