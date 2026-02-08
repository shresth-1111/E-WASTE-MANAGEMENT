"use client"

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useState } from "react"

// Fix for Leaflet icons in Next.js
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow. png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

interface AdminMapProps {
    center: [number, number]
    onMapClick?: (lat: number, lng: number) => void
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng)
            }
        },
    })
    return null
}

export default function AdminMap({ center, onMapClick }: AdminMapProps) {
    const [markerPosition, setMarkerPosition] = useState<[number, number]>(center)

    const handleMapClick = (lat: number, lng: number) => {
        setMarkerPosition([lat, lng])
        if (onMapClick) {
            onMapClick(lat, lng)
        }
    }

    return (
        <div className="h-[400px] w-full">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                key={`${center[0]}-${center[1]}`}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                <Marker position={markerPosition} icon={defaultIcon} />
            </MapContainer>
        </div>
    )
}
