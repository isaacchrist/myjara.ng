'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Loader2, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ABUJA_MARKETS } from '@/lib/constants'

// Placeholder for a simple pulse animation component
function PulseAnimation() {
    return (
        <div className="relative flex items-center justify-center w-32 h-32 my-6">
            <div className="absolute w-full h-full bg-emerald-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute w-2/3 h-2/3 bg-emerald-200 rounded-full animate-pulse opacity-75"></div>
            <div className="relative bg-white p-3 rounded-full shadow-lg z-10">
                <Navigation className="h-8 w-8 text-emerald-600 fill-emerald-600" />
            </div>
        </div>
    )
}

interface GeoLocationCaptureProps {
    onLocationCaptured: (data: { lat: number, lng: number, marketName: string, accuracy: number }) => void
    initialMarket?: string
}

export function GeoLocationCapture({ onLocationCaptured, initialMarket }: GeoLocationCaptureProps) {
    const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error' | 'manual'>('idle')
    const [coords, setCoords] = useState<{ lat: number, lng: number, accuracy: number } | null>(null)
    const [market, setMarket] = useState<string>(initialMarket || '')
    const [errorMsg, setErrorMsg] = useState('')

    const requestLocation = () => {
        setStatus('requesting')
        setErrorMsg('')

        if (!navigator.geolocation) {
            setStatus('error')
            setErrorMsg('Geolocation is not supported by your browser.')
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords

                // Validation: Accuracy must be better than 75m
                // User requirement: "location accuracy should be to 50m - 75m"
                if (accuracy > 75) {
                    setStatus('error')
                    setErrorMsg(`Signal weak (Accuracy: ${Math.round(accuracy)}m). Please move outdoors for better reception (< 75m required).`)
                    return
                }

                setCoords({ lat: latitude, lng: longitude, accuracy })
                setStatus('success')

                // If market is already selected, verify completion
                if (market) {
                    onLocationCaptured({ lat: latitude, lng: longitude, marketName: market, accuracy })
                }
            },
            (err) => {
                console.error(err)
                setStatus('error')
                setErrorMsg(err.message || 'Unable to retrieve location. Please allow access.')
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        )
    }

    const handleMarketChange = (val: string) => {
        setMarket(val)
        if (coords) {
            onLocationCaptured({ ...coords, marketName: val })
        }
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/30">

            {status === 'idle' && (
                <div className="text-center space-y-4">
                    <div className="bg-emerald-100 p-4 rounded-full inline-block">
                        <MapPin className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Add Business Location</h4>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Please stand at your shop's physical location and click below to capture your coordinates.
                        </p>
                    </div>
                    <Button onClick={requestLocation} className="bg-emerald-600 hover:bg-emerald-700">
                        <Navigation className="mr-2 h-4 w-4" />
                        Detect My Location
                    </Button>
                </div>
            )}

            {status === 'requesting' && (
                <div className="text-center space-y-4 animate-in fade-in">
                    <PulseAnimation />
                    <div>
                        <h4 className="font-bold text-gray-900">Detecting...</h4>
                        <p className="text-sm text-gray-500">Please wait while we pinpoint your location.</p>
                        <p className="text-xs text-gray-400 mt-2">Make sure "Location Access" is allowed.</p>
                    </div>
                </div>
            )}

            {status === 'success' && coords && (
                <div className="w-full text-center space-y-4 animate-in fade-in zoom-in-95">
                    <div className="inline-flex items-center justify-center gap-2 text-emerald-700 bg-emerald-100 px-4 py-2 rounded-full text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Location Captured
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left text-sm bg-white p-4 rounded-lg border shadow-sm">
                        <div>
                            <span className="text-gray-500 block text-xs uppercase">Latitude</span>
                            <span className="font-mono font-medium">{coords.lat.toFixed(6)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs uppercase">Longitude</span>
                            <span className="font-mono font-medium">{coords.lng.toFixed(6)}</span>
                        </div>
                        <div className="col-span-2 border-t pt-2">
                            <span className="text-gray-500 block text-xs uppercase">Accuracy</span>
                            <span className={`font-mono text-xs ${coords.accuracy > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                ±{coords.accuracy.toFixed(1)}m {coords.accuracy > 50 ? '(Acceptable)' : '(Excellent)'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 text-left w-full">
                        <label className="text-sm font-medium">Which market is this?</label>
                        <Select value={market} onValueChange={handleMarketChange}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select Market" />
                            </SelectTrigger>
                            <SelectContent>
                                {ABUJA_MARKETS.map(m => (
                                    <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                                ))}
                                <SelectItem value="Other">Other / Not Listed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {!market && (
                        <p className="text-xs text-amber-600 font-medium">Please select a market to finish.</p>
                    )}
                </div>
            )}

            {status === 'error' && (
                <div className="text-center space-y-4 animate-in fade-in">
                    <div className="bg-red-100 p-4 rounded-full inline-block">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Couldn't Detect Location</h4>
                        <p className="text-sm text-red-600 max-w-xs mx-auto">{errorMsg}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
                        <Button variant="outline" onClick={requestLocation}>
                            Try Again
                        </Button>
                        <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => {
                            setStatus('manual')
                            setCoords({ lat: 0, lng: 0, accuracy: 0 })
                        }}>
                            Enter Manually / Skip
                        </Button>
                    </div>
                </div>
            )}

            {status === 'manual' && (
                <div className="w-full text-center space-y-4 animate-in fade-in">
                    <div className="bg-amber-50 p-4 rounded-full inline-block">
                        <MapPin className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Manual Entry</h4>
                        <p className="text-sm text-gray-500">Since we couldn't detect your location, please tell us which market you are in.</p>
                    </div>

                    <div className="space-y-2 text-left w-full max-w-xs mx-auto">
                        <label className="text-sm font-medium">Which market is this?</label>
                        <Select value={market} onValueChange={(val) => {
                            setMarket(val)
                            onLocationCaptured({ lat: 0, lng: 0, accuracy: 0, marketName: val })
                        }}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select Market" />
                            </SelectTrigger>
                            <SelectContent>
                                {ABUJA_MARKETS.map(m => (
                                    <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                                ))}
                                <SelectItem value="Other">Other / Not Listed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    )
}
