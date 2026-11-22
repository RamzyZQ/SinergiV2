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
  const [periodList, setPeriodList] = React.useState<PeriodOption[]>(periods)

  React.useEffect(() => {
    setPeriodList(periods)
  }, [periods])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean)
  const pathPeriodId =
    pathSegments[0] === "admin" && pathSegments[1] === "periods"
      ? pathSegments[2]
      : undefined

  // Auto-fetch active period if not present in the current periodList
  React.useEffect(() => {
    if (!pathPeriodId) return
    const isKnown = periodList.some((p) => p.id === pathPeriodId)
    if (!isKnown) {
      const supabase = createClient()
      supabase
        .from("scholarship_periods")
        .select("id, nama, status")
        .eq("id", pathPeriodId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPeriodList((prev) => {
              if (prev.some((p) => p.id === data.id)) return prev
              return [data, ...prev]
            })
          }
        })
    }
  }, [pathPeriodId, periodList])

  const isUuid = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

  const tabLabels: Record<string, string> = {
    admin: "Admin",
    periods: "Periode",
    audit: "Audit Log",
    overview: "Overview",
    criteria: "Kriteria & Bobot",
    applicants: "Pelamar & Verifikasi",
    calculate: "Kalkulasi ELECTRE",
    results: "Hasil & Ranking",
    analysis: "Sensitivitas",
    publish: "Publikasi",
  }

  const breadcrumbs = pathSegments.map((segment, index) => {
    // If this segment is the period ID (index 2 after /admin/periods)
    if (index === 2 && pathSegments[0] === "admin" && pathSegments[1] === "periods") {
      const period = periodList.find((item) => item.id === segment)
      const label = period?.nama || "Workspace"
      const href = `/admin/periods/${segment}/overview`
      return {
        href,
        label,
        fullLabel: period?.nama || "Workspace Periode",
        key: `period-${segment}-${index}`,
      }
    }

    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const label = tabLabels[segment] || (isUuid(segment) ? "Detail" : segment)
    return {
      href,
      label,
      fullLabel: label,
      key: `path-${segment}-${index}`,
    }
  })

  // Selected period: match URL active period first
  const selectedPeriod =
    periodList.find((p) => p.id === (activePeriodId || pathPeriodId)) ||
    (pathPeriodId ? null : periodList[0] || null)

  const currentTab = pathSegments[3]
  const targetTab = currentTab && tabLabels[currentTab] ? currentTab : "overview"

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    if (newId) {
      router.push(`/admin/periods/${newId}/${targetTab}`)
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
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-3 sm:gap-6">
        {/* Left: Mobile Toggle + Logo (mobile) + Breadcrumb (desktop) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          {/* Mobile logo */}
          <div className="lg:hidden shrink-0">
            <Link href="/admin" className="focus-visible:outline-none">
              <SinergiLogo size="sm" subtitle={false} />
            </Link>
          </div>

          {/* Breadcrumbs desktop */}
          <nav aria-label="Breadcrumb" className="hidden md:flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs font-medium text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => {
              const isFirstCrumb = idx === 0 && breadcrumbs.length > 2
              const isLastCrumb = idx === breadcrumbs.length - 1

              return (
                <React.Fragment key={crumb.key}>
                  {idx > 0 && (
                    <ChevronRight
                      className={cn(
                        "size-3.5 opacity-40 shrink-0",
                        idx === 1 && breadcrumbs.length > 3 ? "hidden xl:block" : ""
                      )}
                    />
                  )}
                  {isLastCrumb ? (
                    <span
                      aria-current="page"
                      title={crumb.fullLabel}
                      className="max-w-[110px] sm:max-w-[140px] lg:max-w-[180px] truncate whitespace-nowrap font-semibold text-foreground inline-block align-middle shrink-0"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      title={crumb.fullLabel}
                      className={cn(
                        "truncate whitespace-nowrap hover:text-foreground transition-colors inline-block align-middle shrink-0",
                        isFirstCrumb && breadcrumbs.length > 3 ? "hidden xl:inline" : "",
                        idx === 2
                          ? "max-w-[90px] sm:max-w-[120px] lg:max-w-[150px] xl:max-w-[180px]"
                          : "max-w-[70px] sm:max-w-[100px]"
                      )}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        </div>

        {/* Right: Period Selector + User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Period Selector */}
          {periodList.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-muted/50 border rounded-xl px-2.5 py-1.5 shrink-0 max-w-[280px] sm:max-w-[360px]">
              <Calendar className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
              <select
                aria-label="Pilih Periode Aktif"
                value={selectedPeriod?.id || ""}
                onChange={handlePeriodChange}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[100px] sm:max-w-[130px] md:max-w-[160px] truncate"
              >
                {selectedPeriod && !periodList.some((p) => p.id === selectedPeriod.id) && (
                  <option value={selectedPeriod.id} className="bg-popover text-popover-foreground">
                    {selectedPeriod.nama}
                  </option>
                )}
                {periodList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-popover text-popover-foreground">
                    {p.nama}
                  </option>
                ))}
              </select>
              {selectedPeriod && (
                <StatusBadge
                  status={selectedPeriod.status}
                  size="sm"
                  className="shrink-0 whitespace-nowrap hidden sm:inline-flex"
                />
              )}
            </div>
          )}

          {/* User Avatar Menu */}
          <div className="relative shrink-0">
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

