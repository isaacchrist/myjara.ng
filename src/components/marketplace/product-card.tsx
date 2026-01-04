import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatJara } from '@/lib/utils'

interface ProductCardProps {
    id: string
    name: string
    price: number
    jaraBuyQty: number
    jaraGetQty: number
    storeName: string
    storeSlug: string
    imageUrl?: string
    cities?: string[]
    variant?: 'grid' | 'list'
}

export function ProductCard({
    id,
    name,
    price,
    jaraBuyQty,
    jaraGetQty,
    storeName,
    storeSlug,
    imageUrl,
    cities = [],
    variant = 'grid',
}: ProductCardProps) {
    const jaraText = formatJara(jaraBuyQty, jaraGetQty)

    return (
        <Link href={`/product/${id}`} className={variant === 'list' ? 'block h-40 w-full' : ''}>
            <Card className={`group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${variant === 'list' ? 'flex flex-row' : ''
                }`}>
                {/* Image */}
                <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${variant === 'list' ? 'h-full w-48 shrink-0' : 'aspect-square w-full'
                    }`}>
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-4xl text-gray-300 dark:text-gray-600">📦</span>
                        </div>
                    )}

                    {/* Jara Badge - Only show on top for grid, or adjust for list */}
                    {jaraGetQty > 0 && (
                        <div className="absolute left-3 top-3">
                            <Badge variant="jara" className="shadow-md">
                                🎁 {jaraText}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={`p-4 ${variant === 'list' ? 'flex flex-1 flex-col justify-between' : ''}`}>
                    <div>
                        <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-500">
                            {name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                            by {storeName}
                        </p>
                    </div>

                    <div>
                        <div className="mt-3 flex items-end justify-between">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatPrice(price)}
                            </span>
                        </div>

                        {/* Location */}
                        {cities.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                    {cities.slice(0, 2).join(', ')}
                                    {cities.length > 2 && ` +${cities.length - 2}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
