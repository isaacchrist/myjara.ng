
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Building, Store, Calendar, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyPhoneButton } from "@/components/marketplace/copy-phone-button"

export default async function RetailerDirectoryPage() {
    const supabase = await createClient()

    // Fetch active stores
    const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    const { data: allCategories } = await supabase.from('categories').select('id, name')
    const categoryNameById = new Map((allCategories || []).map((c: any) => [c.id, c.name]))

    const storeTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
        physical: { label: 'Physical Store', icon: Building, color: 'bg-emerald-100 text-emerald-700' },
        online: { label: 'Online Store', icon: Store, color: 'bg-purple-100 text-purple-700' },
        market_day: { label: 'Market Day Seller', icon: Calendar, color: 'bg-orange-100 text-orange-700' },
        brand: { label: 'Brand', icon: Building, color: 'bg-indigo-100 text-indigo-700' },
        wholesaler: { label: 'Wholesaler', icon: Package, color: 'bg-blue-100 text-blue-700' },
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Retailers</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Discover the best sellers on MyJara. From local market favorites to premium brands.
                    </p>
                </div>

                {stores && stores.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {stores.map((store: any) => {
                            const typeInfo = storeTypeConfig[store.shop_type] || storeTypeConfig.physical
                            const profilePic = store.profile_picture_url || store.logo_url

                            return (
                                <Link key={store.id} href={`/store/${store.slug}`} className="block group h-full">
                                    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray-200">
                                        <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
                                            {/* Banner overlay or pattern could go here */}
                                        </div>
                                        <CardContent className="pt-0 pb-6 px-6 relative">
                                            <div className="flex justify-between items-start">
                                                {/* Avatar */}
                                                <div className="-mt-12 mb-4 h-24 w-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                                                    {profilePic ? (
                                                        <Image
                                                            src={profilePic}
                                                            alt={store.name}
                                                            width={96}
                                                            height={96}
                                                            className="object-cover h-full w-full"
                                                        />
                                                    ) : (
                                                        <span className="text-3xl font-bold text-gray-300">
                                                            {store.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Type Badge */}
                                                <Badge className={`mt-3 ${typeInfo.color}`}>
                                                    <typeInfo.icon className="h-3 w-3 mr-1" />
                                                    {typeInfo.label}
                                                </Badge>
                                            </div>

                                            <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                                                {store.name}
                                            </h2>

                                            {store.market_name && (
                                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                                    {store.market_name}
                                                </div>
                                            )}

                                            <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">
                                                {store.description || 'Visit our store to see our products.'}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {(store.categories || []).slice(0, 3).map((catId: string) => (
                                                    <Badge key={catId} variant="secondary" className="text-xs">
                                                        {categoryNameById.get(catId) || 'Category'}
                                                    </Badge>
                                                ))}
                                                {(store.categories || []).length > 3 && (
                                                    <Badge variant="outline" className="text-xs">+{store.categories.length - 3}</Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                                <div onClick={e => e.preventDefault()}>
                                                    {store.phone && <CopyPhoneButton phone={store.phone} />}
                                                </div>
                                                <Button variant="ghost" className="text-emerald-600 p-0 hover:bg-transparent hover:text-emerald-700 right-0">
                                                    Visit Store <ArrowRight className="ml-1 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-xl">No active retailers found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
