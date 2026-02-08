"use client"

import { LayoutDashboard, Map, BarChart3, Recycle, Settings, LogOut, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", active: true },
  { icon: Map, label: "Live Map", href: "/map", active: false },
  { icon: BarChart3, label: "Analytics", href: "/analytics", active: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut, userProfile } = useAuth()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30">
          <Recycle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">PROTON</h1>
          <p className="text-xs text-muted-foreground">E-Waste System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className={cn("w-5 h-5", pathname === item.href && "drop-shadow-[0_0_8px_var(--primary)]")} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Stats (Mini) */}
      {userProfile && (
        <div className="px-6 py-2 mb-2">
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground">Stars</span>
              <span className="font-bold text-yellow-500">⭐ {userProfile.totalStars || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Tests</span>
              <span className="font-bold">{userProfile.testsCompleted || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
        {user ? (
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-sidebar-accent transition-all duration-200"
          >
            <User className="w-5 h-5" />
            Sign In
          </Link>
        )}

        {user && (
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  )
}
