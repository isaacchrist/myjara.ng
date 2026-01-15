'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatJara } from '@/lib/utils'
import { LocationButton } from './location-button'

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
        <div className={variant === 'list' ? 'block h-40 w-full' : ''}>
            <Card className={`group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${variant === 'list' ? 'flex flex-row' : ''
                }`}>
                {/* Clickable Product Link */}
                <Link href={`/product/${id}`} className="contents">
                    {/* Image */}
                    <div className={`relative overflow-hidden bg-gray-100 cursor-pointer ${variant === 'list' ? 'h-full w-48 shrink-0' : 'aspect-square w-full'
                        }`}>
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100">
                                <Image
                                    src="/logo.png"
                                    alt="MyJara"
                                    width={80}
                                    height={80}
                                    className="opacity-40"
                                />
                            </div>
                        )}

                        {/* Jara Badge */}
                        {jaraGetQty > 0 && (
                            <div className="absolute left-3 top-3">
                                <Badge variant="jara" className="shadow-md">
                                    🎁 {jaraText}
                                </Badge>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Content */}
                <div className={`p-4 ${variant === 'list' ? 'flex flex-1 flex-col justify-between' : ''}`}>
                    <Link href={`/product/${id}`} className="block cursor-pointer">
                        <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-emerald-600">
                            {name}
                        </h3>
                    </Link>

                    <Link
                        href={`/store/${storeSlug}`}
                        className="mt-1 inline-block text-xs text-gray-500 hover:text-emerald-600 hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        by {storeName}
                    </Link>

                    <div>
                        <div className="mt-3 flex items-end justify-between">
                            <Link href={`/product/${id}`}>
                                <span className="text-lg font-bold text-gray-900 hover:text-emerald-600 cursor-pointer">
                                    {formatPrice(price)}
                                </span>
                            </Link>
                        </div>

                        {/* Location - Opens Google Maps */}
                        <LocationButton
                            cities={cities}
                            storeName={storeName}
                        />
                    </div>
                </div>
            </Card>
        </div>
    )
}
