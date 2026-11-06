"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Layers,
  Sliders,
  Users,
  Calculator,
  Trophy,
  Activity,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PeriodWorkspaceTabsProps {
  periodId: string
}

export function PeriodWorkspaceTabs({ periodId }: PeriodWorkspaceTabsProps) {
  const pathname = usePathname()

  const tabs = [
    {
      name: "Overview",
      href: `/admin/periods/${periodId}/overview`,
      icon: Layers,
    },
    {
      name: "Kriteria & Bobot",
      href: `/admin/periods/${periodId}/criteria`,
      icon: Sliders,
    },
    {
      name: "Pelamar & Verifikasi",
      href: `/admin/periods/${periodId}/applicants`,
      icon: Users,
    },
    {
      name: "Kalkulasi ELECTRE",
      href: `/admin/periods/${periodId}/calculate`,
      icon: Calculator,
    },
    {
      name: "Hasil & Ranking",
      href: `/admin/periods/${periodId}/results`,
      icon: Trophy,
    },
    {
      name: "Sensitivitas",
      href: `/admin/periods/${periodId}/analysis`,
      icon: Activity,
    },
    {
      name: "Publikasi",
      href: `/admin/periods/${periodId}/publish`,
      icon: Send,
    },
  ]

  return (
    <div className="border-b bg-card -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
      <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
