"use client"

import { Leaf, Trash2, Clock, Bell, Search } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { StatCard } from "@/components/dashboard/stat-card"
import { MapPlaceholder } from "@/components/dashboard/map-placeholder"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { Scanner } from "@/components/dashboard/scanner"

import { useAuth } from "@/contexts/AuthContext"

// ... imports

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                {user ? `Welcome back, ${user.displayName || "User"}` : "Welcome to PROTON"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg bg-secondary border border-border hover:border-primary/30 transition-all">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">3</span>
                </span>
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "G")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Smart Scanner */}
          <section>
            <Scanner />
          </section>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total CO₂ Saved"
              value="1,240 kg"
              icon={Leaf}
              trend={{ value: "12.5%", positive: true }}
            />
            <StatCard
              title="Active Bins"
              value="42"
              icon={Trash2}
              trend={{ value: "3", positive: true }}
            />
            <StatCard
              title="Pending Pickups"
              value="5"
              icon={Clock}
              trend={{ value: "2", positive: false }}
            />
          </div>

          {/* Map Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Collection Network</h3>
                <p className="text-sm text-muted-foreground">Real-time bin locations and status</p>
              </div>
              <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Open full map
              </button>
            </div>
            <MapPlaceholder />
          </section>

          {/* Transactions Table */}
          <section>
            <TransactionsTable />
          </section>
        </div>
      </main>
    </div>
  )
}
