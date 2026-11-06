"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  ScrollText,
  GraduationCap,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Kelola Periode",
    href: "/admin/periods",
    icon: Calendar,
  },
  {
    name: "Audit Log",
    href: "/admin/audit",
    icon: ScrollText,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b">
        <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
          <GraduationCap className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight">SINERGI ADMIN</span>
          <span className="text-[10px] text-muted-foreground uppercase font-medium">
            SPK Beasiswa ELECTRE
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("size-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="size-3.5 opacity-80" />}
            </Link>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t text-xs text-muted-foreground bg-muted/20">
        <p className="font-medium text-foreground">Sistem Seleksi Beasiswa</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Metode ELECTRE I + Net Dominance</p>
      </div>
    </aside>
  )
}
