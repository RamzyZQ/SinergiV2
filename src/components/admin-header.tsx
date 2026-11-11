"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronRight,
  LogOut,
  Calendar,
  Menu,
  X,
  LayoutDashboard,
  ScrollText,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import { createClient } from "@/lib/supabase/client"
import { SinergiLogo } from "@/components/sinergi-logo"
import { cn } from "@/lib/utils"

interface PeriodOption {
  id: string
  nama: string
  status: string
}

interface AdminHeaderProps {
  userName?: string
  userEmail?: string
  periods?: PeriodOption[]
  activePeriodId?: string
}

export function AdminHeader({
  userName = "Administrator",
  userEmail = "admin@kampus.ac.id",
  periods = [],
  activePeriodId,
}: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const label =
      segment === "admin"
        ? "Admin"
        : segment === "periods"
        ? "Periode"
        : segment === "audit"
        ? "Audit Log"
        : segment === "overview"
        ? "Overview"
        : segment === "criteria"
        ? "Kriteria & Bobot"
        : segment === "applicants"
        ? "Pelamar"
        : segment === "calculate"
        ? "Perhitungan ELECTRE"
        : segment === "results"
        ? "Hasil & Ranking"
        : segment === "analysis"
        ? "Sensitivitas"
        : segment === "publish"
        ? "Publikasi"
        : segment

    return { href, label }
  })

  // Selected period
  const selectedPeriod =
    periods.find((p) => p.id === activePeriodId) || periods[0] || null

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    if (newId) {
      router.push(`/admin/periods/${newId}/overview`)
    }
  }

  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Toggle + Logo (mobile) + Breadcrumb (desktop) */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          {/* Mobile logo */}
          <div className="lg:hidden">
            <Link href="/admin" className="focus-visible:outline-none">
              <SinergiLogo size="sm" subtitle={false} />
            </Link>
          </div>

          {/* Breadcrumbs desktop */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight className="size-3.5 opacity-40 shrink-0" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-foreground truncate max-w-[180px]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Period Selector + User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Period Selector */}
          {periods.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 border rounded-xl px-2.5 py-1.5">
              <Calendar className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
              <select
                aria-label="Pilih Periode Aktif"
                value={selectedPeriod?.id || ""}
                onChange={handlePeriodChange}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">
                    {p.nama}
                  </option>
                ))}
              </select>
              {selectedPeriod && (
                <StatusBadge status={selectedPeriod.status} size="sm" />
              )}
            </div>
          )}

          {/* User Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu admin"
              aria-expanded={menuOpen}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                {userName.split(" ")[0]}
              </span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-popover text-popover-foreground shadow-lg z-50 p-1.5 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                    <p className="text-sm font-semibold truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {userEmail}
                    </p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left"
                    >
                      <LogOut className="size-4" />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="lg:hidden border-t bg-card px-4 py-3 space-y-1 shadow-inner">
          <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Menu Admin
          </div>
          {[
            { href: "/admin", label: "Dashboard", icon: Home },
            { href: "/admin/periods", label: "Kelola Periode", icon: Calendar },
            { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === href || (href !== "/admin" && pathname.startsWith(href))
                  ? "bg-primary/10 text-primary font-semibold"
                  : "hover:bg-muted text-foreground/70"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

