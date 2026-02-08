"use client"

import { useState, useEffect } from "react"
import { adminLogin, getBins, createBin, updateBin, deleteBin } from "@/lib/api"
import { AdminLogin } from "@/components/admin/admin-login"
import { BinsTable } from "@/components/admin/bins-table"
import { Shield } from "lucide-react"

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if admin is authenticated (stored in localStorage)
        const adminAuth = localStorage.getItem("admin_authenticated")
        if (adminAuth === "true") {
            setIsAuthenticated(true)
        }
        setLoading(false)
    }, [])

    const handleLogin = async (email: string, password: string) => {
        try {
            await adminLogin(email, password)
            localStorage.setItem("admin_authenticated", "true")
            setIsAuthenticated(true)
            return true
        } catch (error: any) {
            throw error
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("admin_authenticated")
        setIsAuthenticated(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <AdminLogin onLogin={handleLogin} />
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Admin Header */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                            <p className="text-xs text-muted-foreground">E-Waste Bin Management</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="p-8">
                <BinsTable />
            </main>
        </div>
    )
}
