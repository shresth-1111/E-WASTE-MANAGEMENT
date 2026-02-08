"use client"

import dynamic from "next/dynamic"
import { Sidebar } from "@/components/dashboard/sidebar"

// Dynamic import to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import("@/components/map/LiveMap"), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-secondary animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
})

export default function MapPage() {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 min-h-screen p-8">
                <header className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground">Live Collection Map</h2>
                    <p className="text-sm text-muted-foreground">Real-time tracking of e-waste collection bins</p>
                </header>

                <div className="h-[calc(100vh-12rem)] min-h-[500px]">
                    <LiveMap />
                </div>
            </main>
        </div>
    )
}
