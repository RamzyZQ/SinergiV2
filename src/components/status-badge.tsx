import * as React from "react"
import { cn } from "@/lib/utils"
import {
  FileEdit,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  DoorOpen,
  Lock,
  Search,
  Calculator,
  Globe,
  FlaskConical,
  AlertCircle,
  LucideIcon,
} from "lucide-react"

export type AppStatusKey =
  | "draft"
  | "submitted"
  | "pending"
  | "verified"
  | "approved"
  | "passed"
  | "rejected"
  | "not_passed"
  | "open"
  | "closed"
  | "verification"
  | "calculated"
  | "published"
  | "simulation"
  | (string & {})

interface StatusConfig {
  label: string
  icon: LucideIcon
  className: string
  dotClass: string
}

const statusConfigs: Record<string, StatusConfig> = {
  // Application statuses
  draft: {
    label: "Draf",
    icon: FileEdit,
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  submitted: {
    label: "Diajukan",
    icon: Send,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  pending: {
    label: "Menunggu",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  verified: {
    label: "Terverifikasi",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  approved: {
    label: "Disetujui",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  passed: {
    label: "Lolos",
    icon: Trophy,
    className: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700 font-semibold",
    dotClass: "bg-emerald-500",
  },
  rejected: {
    label: "Ditolak",
    icon: XCircle,
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
  not_passed: {
    label: "Tidak Lolos",
    icon: XCircle,
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },

  // Period cycle statuses
  open: {
    label: "Pendaftaran Dibuka",
    icon: DoorOpen,
    className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    dotClass: "bg-sky-500",
  },
  closed: {
    label: "Ditutup",
    icon: Lock,
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  verification: {
    label: "Tahap Verifikasi",
    icon: Search,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  calculated: {
    label: "Sudah Dihitung",
    icon: Calculator,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
  published: {
    label: "Dipublikasi",
    icon: Globe,
    className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
    dotClass: "bg-teal-500",
  },

  // Calculation types
  simulation: {
    label: "Simulasi",
    icon: FlaskConical,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
}

export interface StatusBadgeProps {
  status: AppStatusKey
  label?: string
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  showDot?: boolean
  className?: string
}

export function StatusBadge({
  status,
  label,
  size = "md",
  showIcon = true,
  showDot = false,
  className,
}: StatusBadgeProps) {
  const normalizedKey = (status || "").toLowerCase()
  const config = statusConfigs[normalizedKey] || {
    label: status || "Unknown",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-700 border-gray-200",
    dotClass: "bg-gray-400",
  }

  const Icon = config.icon
  const displayLabel = label || config.label

  const sizeClasses = {
    sm: "text-[11px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  }

  const iconSizes = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  }

  return (
    <span
      data-status={normalizedKey}
      className={cn(
        "inline-flex items-center font-medium rounded-full border shadow-2xs transition-colors",
        sizeClasses[size],
        config.className,
        className
      )}
    >
      {showDot && (
        <span
          className={cn("size-1.5 rounded-full shrink-0", config.dotClass)}
          aria-hidden="true"
        />
      )}
      {showIcon && !showDot && (
        <Icon className={cn("shrink-0", iconSizes[size])} aria-hidden="true" />
      )}
      <span>{displayLabel}</span>
    </span>
  )
}
