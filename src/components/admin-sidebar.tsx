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
    <aside className="hidden lg:flex w-64 h-full flex-col border-r border-white/10 bg-[#173B70] text-white shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-20 shrink-0 flex flex-col justify-center gap-1.5 px-5 py-3 border-b border-white/15">
        <Link href="/admin" className="w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#173B70]">
          <SinergiLogo size="md" subtitle={false} tone="dark" />
        </Link>
        <span className="pl-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">Panel Admin</span>
      </div>

      {/* Nav items */}
      <nav aria-label="Navigasi admin" className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-white/65 uppercase tracking-[0.16em]">
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
                "relative isolate flex min-h-[60px] items-center justify-between gap-2 overflow-hidden px-3 py-2.5 rounded-2xl text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-300 ease-out group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#173B70]",
                isActive
                  ? "bg-[#2456A6] text-white shadow-md shadow-black/10 before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-full before:bg-[#D9A441]"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              )}
              onPointerMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect()
                const glow = event.currentTarget.querySelector<HTMLElement>("[data-cursor-glow]")
                if (glow) {
                  glow.style.transform = `translate3d(${event.clientX - bounds.left - 64}px, ${event.clientY - bounds.top - 64}px, 0)`
                }
              }}
            >
              <span
                aria-hidden="true"
                data-cursor-glow
                className="pointer-events-none absolute left-0 top-0 z-0 size-32 rounded-full bg-[#D9A441]/20 opacity-0 blur-2xl transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none group-hover:opacity-100"
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  isActive
                    ? "bg-white/15"
                    : "bg-white/10 group-hover:bg-white/15"
                )}>
                  <Icon className={cn(
                    "size-[18px]",
                    isActive ? "text-white" : "text-white/80 group-hover:text-white"
                  )} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold leading-tight">{item.name}</span>
                  <span className={cn(
                    "mt-1 text-xs leading-tight",
                    isActive ? "text-white/85" : "text-white/65 group-hover:text-white/85"
                  )}>
                    {item.description}
                  </span>
                </div>
              </div>
              {isActive && <ChevronRight className="relative z-10 size-3.5 text-[#F5E7C4] opacity-90 shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="mt-auto shrink-0 p-4 border-t border-white/15">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-1.5">
          <p className="text-xs font-semibold text-white">Metode ELECTRE I</p>
          <p className="text-xs text-white/70 leading-relaxed">
            Net Dominance · Transparan · Berbasis Data
          </p>
        </div>
      </div>
    </aside>
  )
}

