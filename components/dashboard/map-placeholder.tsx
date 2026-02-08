"use client"

import { MapPin, Navigation } from "lucide-react"
import { useEffect, useState } from "react"
import { getBins } from "@/lib/api"

export function MapPlaceholder() {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchBins = async () => {
      try {
        const bins = await getBins()
        if (!mounted) return
        setCount(bins.length)
        setError(false)
      } catch (e) {
        console.error("Failed to fetch bins", e)
        if (mounted) {
          setError(true)
          setCount(0)
        }
      }
    }
    fetchBins()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="relative rounded-xl bg-card border border-border overflow-hidden h-80 group hover:border-primary/30 transition-all duration-300">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(57, 255, 20, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57, 255, 20, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Map pins simulation */}
      <div className="absolute inset-0 p-8">
        <div className="relative w-full h-full">
          {/* Simulated active bins */}
          <div className="absolute top-1/4 left-1/4 animate-pulse">
            <div className="relative">
              <MapPin className="w-6 h-6 text-primary drop-shadow-[0_0_10px_var(--primary)]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
            </div>
          </div>
          <div className="absolute top-1/3 right-1/3">
            <MapPin className="w-6 h-6 text-primary/70" />
          </div>
          <div className="absolute bottom-1/3 left-1/2">
            <div className="relative">
              <MapPin className="w-6 h-6 text-primary drop-shadow-[0_0_10px_var(--primary)]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
          <div className="absolute top-1/2 right-1/4">
            <MapPin className="w-6 h-6 text-primary/50" />
          </div>
          <div className="absolute bottom-1/4 right-1/2">
            <MapPin className="w-6 h-6 text-primary/80" />
          </div>
        </div>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4 group-hover:scale-110 transition-transform duration-300">
          <Navigation className="w-8 h-8 text-primary drop-shadow-[0_0_15px_var(--primary)]" />
        </div>
        <p className="text-lg font-semibold text-foreground">Live Collection Map</p>
        {error ? (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Backend not running - Start FastAPI server</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">{count === null ? 'Loading...' : `${count} active bins across the network`}</p>
        )}
      </div>

      {/* Corner indicators */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full">
        <span className="text-xs font-medium text-primary">LIVE</span>
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-secondary rounded-full">
        <span className="text-xs font-medium text-muted-foreground">Zoom: 12x</span>
      </div>
    </div>
  )
}
