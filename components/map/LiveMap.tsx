"use client"

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useState } from "react"
import { getBins, getNearbyBins } from "@/lib/api"
import { MapPin, Navigation2 } from "lucide-react"

// Custom marker icons
const createCustomIcon = (color: string, isPulsing = false) => {
    const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      ${isPulsing ? '<animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>' : ''}
    </svg>
  `
    return L.divIcon({
        html: svgIcon,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
        className: isPulsing ? 'pulsing-marker' : ''
    })
}

const activeIcon = createCustomIcon('#22c55e') // Green for active
const fullIcon = createCustomIcon('#ef4444') // Red for full
const inactiveIcon = createCustomIcon('#6b7280') // Gray for inactive
const nearestIcon = createCustomIcon('#22c55e', true) // Pulsing green for nearest
const userIcon = L.divIcon({
    html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: 'user-location-marker'
})

type Bin = {
    binId: string
    latitude: number
    longitude: number
    areaName?: string
    current_capacity?: number
    max_capacity?: number
    status?: string
    distance?: number
}

const defaultCenter: [number, number] = [28.6139, 77.2090] // Delhi center

export default function LiveMap() {
    const [bins, setBins] = useState<Bin[]>([])
    const [center, setCenter] = useState<[number, number]>(defaultCenter)
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
    const [nearestBin, setNearestBin] = useState<Bin | null>(null)
    const [loading, setLoading] = useState(true)
    const [locationError, setLocationError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        // Request user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    if (!mounted) return
                    const { latitude, longitude } = position.coords
                    setUserLocation([latitude, longitude])
                    setCenter([latitude, longitude])

                    // Fetch nearby bins (within 3 km)
                    try {
                        const nearbyBins = await getNearbyBins(latitude, longitude, 3.0)
                        if (!mounted) return
                        setBins(nearbyBins)

                        // Find nearest bin
                        if (nearbyBins.length > 0) {
                            const nearest = nearbyBins.reduce((prev: Bin, curr: Bin) =>
                                (curr.distance || Infinity) < (prev.distance || Infinity) ? curr : prev
                            )
                            setNearestBin(nearest)
                        }
                    } catch (error) {
                        console.error("Failed to fetch nearby bins", error)
                        // Fallback to all bins if nearby fetch fails
                        const allBins = await getBins()
                        if (mounted) setBins(allBins)
                    }
                    setLoading(false)
                },
                (error) => {
                    console.error("Geolocation error:", error)
                    setLocationError("Could not get your location. Showing all bins.")
                    // Fetch all bins if location access denied
                    getBins().then((allBins) => {
                        if (mounted) {
                            setBins(allBins)
                            if (allBins.length > 0) {
                                setCenter([allBins[0].latitude, allBins[0].longitude])
                            }
                        }
                        setLoading(false)
                    })
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            )
        } else {
            setLocationError("Geolocation not supported")
            // Fetch all bins
            getBins().then((allBins) => {
                if (mounted) {
                    setBins(allBins)
                    if (allBins.length > 0) {
                        setCenter([allBins[0].latitude, allBins[0].longitude])
                    }
                }
                setLoading(false)
            })
        }

        return () => {
            mounted = false
        }
    }, [])

    const getMarkerIcon = (bin: Bin) => {
        if (nearestBin && bin.binId === nearestBin.binId) {
            return nearestIcon
        }

        switch (bin.status) {
            case 'full':
                return fullIcon
            case 'inactive':
                return inactiveIcon
            default:
                return activeIcon
        }
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'full': return 'text-red-500'
            case 'inactive': return 'text-gray-500'
            default: return 'text-green-500'
        }
    }

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'full': return 'bg-red-100 text-red-700 border-red-300'
            case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300'
            default: return 'bg-green-100 text-green-700 border-green-300'
        }
    }

    if (loading) {
        return (
            <div className="h-full w-full rounded-xl overflow-hidden border border-border bg-secondary flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading map and bins...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full rounded-xl overflow-hidden border border-border relative">
            {locationError && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                        <Navigation2 className="w-4 h-4" />
                        {locationError}
                    </p>
                </div>
            )}

            <MapContainer center={center} zoom={userLocation ? 13 : 11} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker */}
                {userLocation && (
                    <>
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>
                                <div className="p-1">
                                    <h3 className="font-bold text-blue-600">Your Location</h3>
                                    <p className="text-xs">You are here</p>
                                </div>
                            </Popup>
                        </Marker>
                        {/* Circle showing 3km radius */}
                        <Circle
                            center={userLocation}
                            radius={3000}
                            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1 }}
                        />
                    </>
                )}

                {/* Bin markers */}
                {bins.map((bin) => (
                    <Marker
                        key={bin.binId}
                        position={[bin.latitude, bin.longitude]}
                        icon={getMarkerIcon(bin)}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-base">{bin.areaName || bin.binId}</h3>
                                    {nearestBin && bin.binId === nearestBin.binId && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">Nearest</span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-600 mb-1">Bin ID: {bin.binId}</p>

                                {/* Capacity */}
                                {bin.current_capacity !== undefined && bin.max_capacity !== undefined && (
                                    <div className="mt-2 mb-2">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600">Trash Stored</span>
                                            <span className="font-semibold">{bin.current_capacity} / {bin.max_capacity} kg</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${(bin.current_capacity / bin.max_capacity) >= 0.9 ? 'bg-red-500' :
                                                        (bin.current_capacity / bin.max_capacity) >= 0.6 ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min((bin.current_capacity / bin.max_capacity) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                <div className="mt-2">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(bin.status)} uppercase font-semibold`}>
                                        {bin.status || 'active'}
                                    </span>
                                </div>

                                {/* Distance */}
                                {bin.distance !== undefined && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        <Navigation2 className="w-3 h-3" />
                                        {bin.distance < 1 ?
                                            `${Math.round(bin.distance * 1000)} m away` :
                                            `${bin.distance.toFixed(2)} km away`
                                        }
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg p-3 z-[1000]">
                <h4 className="text-xs font-semibold mb-2 text-foreground">Bin Status</h4>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-muted-foreground">Full</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span className="text-muted-foreground">Inactive</span>
                    </div>
                </div>
            </div>

            {/* Bin counter */}
            <div className="absolute top-4 right-4 bg-card border border-border rounded-lg shadow-lg px-3 py-2 z-[1000]">
                <p className="text-xs font-semibold text-foreground">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {bins.length} bin{bins.length !== 1 ? 's' : ''} nearby
                </p>
            </div>
        </div>
    )
}
