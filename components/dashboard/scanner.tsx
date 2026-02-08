"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Loader2, ScanLine, MapPin, AlertCircle, Award, Weight, Recycle } from "lucide-react"
import { predictImage, getNearbyBins } from "@/lib/api"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"

interface PredictionResult {
    label: string
    confidence: number
    all_predictions: Record<string, number>
    stars_awarded?: number
    new_total_stars?: number
    rating?: number
    message?: string
    waste_category?: string
    estimated_weight_kg?: number
    recyclability?: string
    credits_earned?: number
    denial_reason?: string
}

interface Bin {
    binId: string
    latitude: number
    longitude: number
    areaName?: string
    distance?: number
    status?: string
}

export function Scanner() {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<PredictionResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [nearbyBins, setNearbyBins] = useState<Bin[]>([])
    const [selectedBin, setSelectedBin] = useState<string | null>(null)
    const [locationError, setLocationError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Get user location and nearby bins on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords
                    setUserLocation({ lat: latitude, lng: longitude })

                    try {
                        // Fetch bins within 0.03 km (30m) for scanning
                        const allNearbyBins = await getNearbyBins(latitude, longitude, 3.0)
                        const veryNearbyBins = allNearbyBins.filter((bin: Bin) => (bin.distance || Infinity) <= 0.03)

                        setNearbyBins(veryNearbyBins)

                        if (veryNearbyBins.length > 0) {
                            setSelectedBin(veryNearbyBins[0].binId)
                        } else {
                            setLocationError("You are not near any registered bin. Please move within 30 meters of a bin to scan waste.")
                        }
                    } catch (error) {
                        console.error("Failed to fetch nearby bins", error)
                        setLocationError("Failed to load bins. Please try again.")
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error)
                    setLocationError("Could not access your location. Please enable location services to use the scanner.")
                }
            )
        } else {
            setLocationError("Geolocation is not supported by your browser.")
        }
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile))
            setResult(null)
            setError(null)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            setFile(droppedFile)
            setPreview(URL.createObjectURL(droppedFile))
            setResult(null)
            setError(null)
        }
    }

    const handleScan = async () => {
        if (!file) return

        // Validation checks
        if (!userLocation) {
            setError("Could not determine your location. Please enable location services.")
            return
        }

        if (nearbyBins.length === 0) {
            setError("⚠️ You must be near a registered bin to scan waste. Please move within 30 meters of a bin.")
            return
        }

        if (!selectedBin) {
            setError("Please select a bin before scanning.")
            return
        }

        setLoading(true)
        setError(null)
        try {
            let token = undefined
            if (auth.currentUser) {
                token = await auth.currentUser.getIdToken()
            }

            const data = await predictImage(
                file,
                token,
                selectedBin,
                userLocation.lat,
                userLocation.lng
            )
            setResult(data)
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setFile(null)
        setPreview(null)
        setResult(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const getRecyclabilityColor = (recyclability?: string) => {
        switch (recyclability) {
            case 'recyclable': return 'text-green-600'
            case 'partially_damaged': return 'text-yellow-600'
            case 'non_recyclable': return 'text-red-600'
            default: return 'text-gray-600'
        }
    }

    const getRecyclabilityIcon = (recyclability?: string) => {
        switch (recyclability) {
            case 'recyclable': return '♻️'
            case 'partially_damaged': return '⚠️'
            case 'non_recyclable': return '🚫'
            default: return '❓'
        }
    }

    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'mobile': return '📱'
            case 'laptop': return '💻'
            case 'charger': return '🔌'
            case 'battery': return '🔋'
            case 'monitor': return '🖥️'
            case 'printer': return '🖨️'
            default: return '📦'
        }
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-primary" />
                    AI Waste Scanner
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Upload an image to identify E-Waste type and earn credits
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Location & Bin Selection */}
                {locationError ? (
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Location Required</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{locationError}</p>
                        </div>
                    </div>
                ) : nearbyBins.length > 0 ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Select Nearby Bin
                        </label>
                        <select
                            value={selectedBin || ''}
                            onChange={(e) => setSelectedBin(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        >
                            {nearbyBins.map((bin) => (
                                <option key={bin.binId} value={bin.binId}>
                                    {bin.areaName || bin.binId} - {bin.distance ? `${Math.round(bin.distance * 1000)}m away` : 'Nearby'}
                                    {bin.status === 'full' ? ' (FULL)' : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                            ✅ You are near {nearbyBins.length} bin{nearbyBins.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                ) : userLocation ? (
                    <div className="p-4 rounded-lg bg-secondary border border-border">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Searching for nearby bins...
                        </p>
                    </div>
                ) : null}

                {/* Upload Area */}
                {!preview ? (
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors bg-secondary/20"
                    >
                        <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG up to 5MB</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-border bg-black/5">
                        <button
                            onClick={reset}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-64 object-contain mx-auto"
                        />
                    </div>
                )}

                {/* Actions */}
                {file && !result && (
                    <button
                        onClick={handleScan}
                        disabled={loading || nearbyBins.length === 0 || !selectedBin}
                        className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <ScanLine className="w-4 h-4" />
                                Scan Image
                            </>
                        )}
                    </button>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {result.denial_reason ? (
                            // Denied scan
                            <div className="p-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                    <h4 className="text-lg font-bold text-red-700 dark:text-red-400">Scan Denied</h4>
                                </div>
                                <p className="text-sm text-red-600 dark:text-red-300">{result.message}</p>
                                <p className="text-xs text-red-500 dark:text-red-400 mt-2">Reason: {result.denial_reason}</p>
                            </div>
                        ) : (
                            // Successful scan
                            <>
                                <div className={cn(
                                    "p-6 rounded-lg border",
                                    (result.rating || 0) >= 4 ? "bg-green-500/10 border-green-500/20" :
                                        (result.rating || 0) >= 2 ? "bg-yellow-500/10 border-yellow-500/20" :
                                            "bg-orange-500/10 border-orange-500/20"
                                )}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-muted-foreground">Scan Results</span>
                                        <span className={cn(
                                            "px-2 py-0.5 text-xs font-bold rounded-full uppercase",
                                            result.confidence && result.confidence > 0.7 ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"
                                        )}>
                                            {((result.confidence || 0) * 100).toFixed(1)}% Confidence
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">{getCategoryIcon(result.waste_category)}</span>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-foreground capitalize">
                                                {result.waste_category || result.label}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{result.message}</p>
                                        </div>
                                    </div>

                                    {/* Rating Stars */}
                                    {result.stars_awarded !== undefined && result.stars_awarded > 0 && (
                                        <div className="flex items-center gap-2 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                            <Award className="w-5 h-5 text-yellow-600" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <span key={i} className={cn("text-xl", i < result.stars_awarded! ? "text-yellow-500" : "text-gray-300")}>
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                                    +{result.stars_awarded} Stars Earned
                                                    {result.new_total_stars !== undefined && ` (Total: ${result.new_total_stars})`}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        {/* Weight */}
                                        {result.estimated_weight_kg !== undefined && (
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Weight className="w-4 h-4 text-primary" />
                                                    <span className="text-xs text-muted-foreground">Weight</span>
                                                </div>
                                                <p className="text-sm font-bold text-foreground">{result.estimated_weight_kg.toFixed(2)} kg</p>
                                            </div>
                                        )}

                                        {/* Recyclability */}
                                        {result.recyclability && (
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Recycle className="w-4 h-4 text-primary" />
                                                    <span className="text-xs text-muted-foreground">Status</span>
                                                </div>
                                                <p className={cn("text-xs font-bold capitalize", getRecyclabilityColor(result.recyclability))}>
                                                    {getRecyclabilityIcon(result.recyclability)} {result.recyclability.replace('_', ' ')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Credits */}
                                        {result.credits_earned !== undefined && (
                                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-muted-foreground">Credits</span>
                                                </div>
                                                <p className="text-lg font-bold text-primary">+{result.credits_earned}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Other Predictions */}
                                {result.all_predictions && Object.keys(result.all_predictions).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Possibilities</p>
                                        {Object.entries(result.all_predictions)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 4)
                                            .map(([label, score]) => (
                                                <div key={label} className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="capitalize">{label}</span>
                                                        <span className="text-muted-foreground">{(score * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                                            style={{ width: `${score * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            onClick={reset}
                            className="w-full py-3 px-4 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-all"
                        >
                            Scan Another
                        </button>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
