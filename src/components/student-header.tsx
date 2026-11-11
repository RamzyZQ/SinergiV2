"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, User, LogOut, Home, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { SinergiLogo } from "@/components/sinergi-logo"
import { cn } from "@/lib/utils"

interface StudentHeaderProps {
  userName?: string
  userEmail?: string
}

const navLinks = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/profile", label: "Profil Saya", icon: User },
]

export function StudentHeader({
  userName = "Mahasiswa",
  userEmail = "",
}: StudentHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "M"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto max-w-5xl flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            aria-label="SINERGI - Beranda"
          >
            <SinergiLogo size="sm" subtitle={false} />
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors font-medium text-sm",
                  pathname === href
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Notification + User */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 text-muted-foreground hover:text-foreground rounded-lg"
            aria-label="Notifikasi"
          >
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-1.5 bg-[oklch(0.72_0.17_55)] rounded-full ring-2 ring-background" />
          </Button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu pengguna"
              aria-expanded={menuOpen}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                {userName.split(" ")[0]}
              </span>
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-popover text-popover-foreground shadow-lg z-50 p-1.5 animate-in fade-in-50 zoom-in-95">
                  {/* User info */}
                  <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                    <p className="text-sm font-semibold truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {userEmail}
                    </p>
                  </div>

                  {/* Mobile nav links */}
                  <div className="sm:hidden py-1 border-b border-border/50 mb-1">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg font-medium transition-colors",
                          pathname === href ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        )}
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        {label}
                      </Link>
                    ))}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium transition-colors"
                    >
                      <User className="size-4 text-muted-foreground" />
                      Pengaturan Profil
                    </Link>

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
    </header>
  )
}

