import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label: string }
  className?: string
  highlight?: boolean
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  trend,
  className,
  highlight,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow",
        highlight && "ring-2 ring-[#2563EB] ring-offset-1",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-[#1E293B] truncate">{value}</p>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 truncate">{subtitle}</p>}
          {trend && (
            <p className={cn(
              "mt-1 text-xs font-medium",
              trend.value >= 0 ? "text-green-600" : "text-red-500"
            )}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl ml-3 flex-shrink-0", iconBg)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        )}
      </div>
    </div>
  )
}
