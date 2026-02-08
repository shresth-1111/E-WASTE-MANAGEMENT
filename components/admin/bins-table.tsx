"use client"

import { useState, useEffect, useRef } from "react"
import { getBins, createBin, updateBin, deleteBin } from "@/lib/api"
import { MapPin, Plus, Edit, Trash2, Loader2, Navigation2, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"

const AdminMap = dynamic(() => import("@/components/admin/admin-map"), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-secondary animate-pulse rounded-lg" />
})

interface Bin {
    binId: string
    latitude: number
    longitude: number
    areaName: string
    current_capacity: number
    max_capacity: number
    status: string
}

export function BinsTable() {
    const [bins, setBins] = useState<Bin[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<"add" | "edit">("add")
    const [selectedBin, setSelectedBin] = useState<Bin | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        areaName: "",
        latitude: 0,
        longitude: 0,
        current_capacity: 0,
        max_capacity: 100,
        status: "active"
    })

    useEffect(() => {
        loadBins()
        // Get user location for "Use My Location" feature
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => console.error("Geolocation error:", error)
            )
        }
    }, [])

    const loadBins = async () => {
        setLoading(true)
        try {
            const data = await getBins()
            setBins(data)
        } catch (error) {
            console.error("Failed to load bins", error)
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setModalMode("add")
        setFormData({
            areaName: "",
            latitude: userLocation?.lat || 28.6139,
            longitude: userLocation?.lng || 77.2090,
            current_capacity: 0,
            max_capacity: 100,
            status: "active"
        })
        setIsModalOpen(true)
    }

    const openEditModal = (bin: Bin) => {
        setModalMode("edit")
        setSelectedBin(bin)
        setFormData({
            areaName: bin.areaName,
            latitude: bin.latitude,
            longitude: bin.longitude,
            current_capacity: bin.current_capacity,
            max_capacity: bin.max_capacity,
            status: bin.status
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (modalMode === "add") {
                await createBin(formData)
            } else if (selectedBin) {
                await updateBin(selectedBin.binId, formData)
            }
            setIsModalOpen(false)
            loadBins()
        } catch (error) {
            console.error("Failed to save bin", error)
            alert("Failed to save bin. Please try again.")
        }
    }

    const handleDelete = async (binId: string) => {
        if (deleteConfirm !== binId) {
            setDeleteConfirm(binId)
            setTimeout(() => setDeleteConfirm(null), 3000)
            return
        }

        try {
            await deleteBin(binId)
            setDeleteConfirm(null)
            loadBins()
        } catch (error) {
            console.error("Failed to delete bin", error)
            alert("Failed to delete bin. Please try again.")
        }
    }

    const useMyLocation = () => {
        if (userLocation) {
            setFormData(prev => ({
                ...prev,
                latitude: userLocation.lat,
                longitude: userLocation.lng
            }))
        } else {
            alert("Location not available. Please enable location services.")
        }
    }

    const handleMapClick = (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
        }))
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'full': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700'
            default: return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Bin Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {loading ? "Loading..." : `${bins.length} bins total`}
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New Bin
                </button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading bins...</p>
                    </div>
                ) : bins.length === 0 ? (
                    <div className="p-12 text-center">
                        <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No bins found. Add your first bin to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/50 border-b border-border">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bin ID</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trash Stored</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacity</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bins.map((bin) => (
                                    <tr key={bin.binId} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="font-medium text-foreground">{bin.areaName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{bin.binId}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-foreground">{bin.current_capacity} kg</span>
                                                <div className="w-20 bg-secondary rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${(bin.current_capacity / bin.max_capacity) >= 0.9 ? 'bg-red-500' :
                                                                (bin.current_capacity / bin.max_capacity) >= 0.6 ? 'bg-yellow-500' :
                                                                    'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min((bin.current_capacity / bin.max_capacity) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{bin.max_capacity} kg</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full border font-semibold uppercase ${getStatusColor(bin.status)}`}>
                                                {bin.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                                            {bin.latitude.toFixed(4)}, {bin.longitude.toFixed(4)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(bin)}
                                                    className="p-2 hover:bg-secondary rounded-lg transition-colors group"
                                                    title="Edit Bin"
                                                >
                                                    <Edit className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bin.binId)}
                                                    className={`p-2 rounded-lg transition-colors group ${deleteConfirm === bin.binId
                                                            ? 'bg-destructive/20 hover:bg-destructive/30'
                                                            : 'hover:bg-destructive/10'
                                                        }`}
                                                    title={deleteConfirm === bin.binId ? "Click again to confirm" : "Delete Bin"}
                                                >
                                                    <Trash2 className={`w-4 h-4 ${deleteConfirm === bin.binId ? 'text-destructive' : 'text-muted-foreground group-hover:text-destructive'
                                                        }`} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-xl font-bold text-foreground">
                                {modalMode === "add" ? "Add New Bin" : "Update Bin"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {modalMode === "add"
                                    ? "Add a new e-waste collection bin to the system"
                                    : `Editing ${selectedBin?.areaName}`
                                }
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Area Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Area Name *</label>
                                <input
                                    type="text"
                                    value={formData.areaName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, areaName: e.target.value }))}
                                    placeholder="e.g., Connaught Place"
                                    required
                                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Navigation2 className="w-4 h-4 text-primary" />
                                    Location Coordinates
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                                            required
                                            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                                            required
                                            className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={useMyLocation}
                                    className="w-full py-2 px-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Navigation2 className="w-4 h-4" />
                                    Use My Current Location
                                </button>
                            </div>

                            {/* Map for location selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Select Location on Map</label>
                                <div className="rounded-lg overflow-hidden border border-border">
                                    <AdminMap
                                        center={[formData.latitude, formData.longitude]}
                                        onMapClick={handleMapClick}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Click on the map to set bin location</p>
                            </div>

                            {/* Capacity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Current Capacity (kg)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.current_capacity}
                                        onChange={(e) => setFormData(prev => ({ ...prev, current_capacity: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Max Capacity (kg)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.max_capacity}
                                        onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseFloat(e.target.value) || 100 }))}
                                        required
                                        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="active">Active</option>
                                    <option value="full">Full</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 px-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {modalMode === "add" ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                    {modalMode === "add" ? "Add Bin" : "Update Bin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
