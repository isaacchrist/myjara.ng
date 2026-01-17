import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Heart, LayoutDashboard, Store } from 'lucide-react'
import { LikeButton } from '@/components/shared/like-button'

export default async function FavoritesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: favorites } = await supabase
        .from('favorite_stores')
        .select(`
            id,
            store_id,
            stores (
                id,
                store_name,
                description,
                logo_url,
                city,
                shop_type
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Liked Vendors</h1>
                    <p className="text-gray-500 mt-1">Your favorite stores and wholesalers.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/customer/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {favorites && favorites.length > 0 ? (
                    favorites.map((fav: any) => {
                        const store = fav.stores
                        if (!store) return null

                        return (
                            <Link href={`/store/${store.id}`} key={fav.id} className="block group">
                                <Card className="h-full transition-all duration-300 hover:shadow-md group-hover:border-emerald-200">
                                    <CardContent className="p-6 relative">
                                        <div className="absolute top-4 right-4 z-10">
                                            <LikeButton storeId={store.id} initialIsLiked={true} />
                                        </div>

                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <Avatar className="h-20 w-20 border-4 border-emerald-50">
                                                <AvatarImage src={store.logo_url} />
                                                <AvatarFallback className="text-lg bg-emerald-100 text-emerald-700">
                                                    {store.store_name?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                    {store.store_name}
                                                </h3>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                        {store.shop_type}
                                                    </Badge>
                                                    {store.city && (
                                                        <span className="text-sm text-gray-500 flex items-center">
                                                            <Store className="h-3 w-3 mr-1" />
                                                            {store.city}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-500 line-clamp-2 w-full">
                                                {store.description || "No description available."}
                                            </p>

                                            <Button className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors mt-2">
                                                View Store
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })
                ) : (
                    <div className="col-span-full py-12 text-center">
                        <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                            <Heart className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No favorites yet</h3>
                        <p className="text-gray-500 mt-2 mb-6">
                            Start exploring stores and save the ones you love!
                        </p>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <Link href="/search">Find Stores</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
