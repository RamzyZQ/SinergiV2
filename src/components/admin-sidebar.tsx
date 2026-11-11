"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  ScrollText,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SinergiLogo } from "@/components/sinergi-logo"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Ringkasan & statistik",
  },
  {
    name: "Kelola Periode",
    href: "/admin/periods",
    icon: Calendar,
    description: "Periode seleksi aktif",
  },
  {
    name: "Audit Log",
    href: "/admin/audit",
    icon: ScrollText,
    description: "Riwayat aktivitas",
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <Link href="/admin" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <SinergiLogo size="sm" subtitle="Panel Admin" />
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Navigasi Utama
        </div>
        {navigation.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)

          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive
                    ? "bg-white/15"
                    : "bg-muted group-hover:bg-primary/10"
                )}>
                  <Icon className={cn(
                    "size-4",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm leading-none">{item.name}</span>
                  <span className={cn(
                    "text-[11px] mt-0.5 leading-none",
                    isActive ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </span>
                </div>
              </div>
              {isActive && <ChevronRight className="size-3.5 opacity-70 shrink-0" />}
            </Link>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-1">
          <p className="text-xs font-semibold text-primary">Metode ELECTRE I</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Net Dominance · Transparan · Berbasis Data
          </p>
        </div>
      </div>
    </aside>
  )
}

