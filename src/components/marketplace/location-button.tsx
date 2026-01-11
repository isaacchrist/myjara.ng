'use client'

import { useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'

interface LocationButtonProps {
    cities: string[]
    storeName?: string
    className?: string
}

export function LocationButton({ cities, storeName, className = '' }: LocationButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleLocationClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (cities.length === 0) return

        setLoading(true)

        // Build destination string (first city + Abuja, Nigeria for accuracy)
        const destination = `${cities[0]}, Abuja, Nigeria`

        try {
            // Check if geolocation is available
            if (!navigator.geolocation) {
                // Fallback: Open Google Maps with just the destination
                openGoogleMaps(null, destination)
                return
            }

            // Request user's location
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    openGoogleMaps({ lat: latitude, lng: longitude }, destination)
                    setLoading(false)
                },
                (error) => {
                    console.warn('Geolocation error:', error.message)
                    // Fallback: Open Google Maps with just the destination (user can set origin manually)
                    openGoogleMaps(null, destination)
                    setLoading(false)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // Cache for 5 minutes
                }
            )
        } catch (error) {
            console.error('Location error:', error)
            openGoogleMaps(null, destination)
            setLoading(false)
        }
    }

    const openGoogleMaps = (
        origin: { lat: number; lng: number } | null,
        destination: string
    ) => {
        const baseUrl = 'https://www.google.com/maps/dir/'

        let url: string
        if (origin) {
            // With origin coordinates
            url = `${baseUrl}${origin.lat},${origin.lng}/${encodeURIComponent(destination)}`
        } else {
            // Without origin - Google Maps will use current location or ask
            url = `${baseUrl}/${encodeURIComponent(destination)}`
        }

        // Open in new tab
        window.open(url, '_blank', 'noopener,noreferrer')
        setLoading(false)
    }

    if (cities.length === 0) return null

    return (
        <button
            onClick={handleLocationClick}
            className={`mt-2 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors group/loc ${className}`}
            title={`Get directions to ${cities[0]}`}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <MapPin className="h-3 w-3 group-hover/loc:scale-110 transition-transform" />
            )}
            <span className="truncate underline decoration-dotted underline-offset-2">
                {cities.slice(0, 2).join(', ')}
                {cities.length > 2 && ` +${cities.length - 2}`}
            </span>
            <Navigation className="h-2.5 w-2.5 opacity-0 group-hover/loc:opacity-100 transition-opacity" />
        </button>
    )
}
