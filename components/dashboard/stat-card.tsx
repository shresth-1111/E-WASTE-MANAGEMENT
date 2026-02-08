import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-card border border-border p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(57,255,20,0.05)] group">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20">
            <Icon className="w-6 h-6 text-primary drop-shadow-[0_0_10px_var(--primary)]" />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend.positive 
                ? "text-primary bg-primary/10" 
                : "text-destructive bg-destructive/10"
            )}>
              {trend.positive ? "+" : ""}{trend.value}
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
      </div>
    </div>
  )
}
