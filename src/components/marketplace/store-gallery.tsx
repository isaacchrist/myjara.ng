'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface StoreGalleryProps {
    images: string[]
    storeName: string
}

export function StoreGalleryBanner({ images, storeName }: StoreGalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const bannerImage = images[0]

    const prev = () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))
    const next = () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))

    if (!images || images.length === 0) {
        return (
            <div className="h-48 md:h-56 w-full bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">📷</span>
                <p className="text-sm text-emerald-600 font-medium">No store photos yet</p>
            </div>
        )
    }

    return (
        <>
            {/* Banner */}
            <div
                className="relative h-48 md:h-56 w-full cursor-pointer group overflow-hidden"
                onClick={() => { setCurrentIndex(0); setLightboxOpen(true) }}
            >
                <Image
                    src={bannerImage}
                    alt={`${storeName} store`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                />
                {/* Overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    {images.length > 1 && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                            📷 View {images.length} photos
                        </span>
                    )}
                </div>
                {/* Image count badge */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                        1 / {images.length}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Previous button */}
                    {images.length > 1 && (
                        <button
                            className="absolute left-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                            onClick={(e) => { e.stopPropagation(); prev() }}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                    )}

                    {/* Current image */}
                    <div
                        className="relative w-full max-w-4xl h-[70vh] mx-16"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={images[currentIndex]}
                            alt={`${storeName} photo ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                        />
                    </div>

                    {/* Next button */}
                    {images.length > 1 && (
                        <button
                            className="absolute right-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                            onClick={(e) => { e.stopPropagation(); next() }}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                        {currentIndex + 1} / {images.length}
                    </div>

                    {/* Thumbnail dots */}
                    {images.length > 1 && images.length <= 10 && (
                        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
