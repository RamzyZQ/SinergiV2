"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { GraduationCap, Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"

interface StudentHeaderProps {
  userName?: string
  userEmail?: string
}

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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xs">
      <div className="container mx-auto max-w-5xl flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold tracking-tight text-primary focus-visible:outline-none"
          >
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <GraduationCap className="size-4" />
            </div>
            <span className="text-base sm:text-lg">SINERGI</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/dashboard"
              className={
                pathname === "/dashboard"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              Beranda
            </Link>
            <Link
              href="/profile"
              className={
                pathname === "/profile"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              Profil Saya
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 text-muted-foreground hover:text-foreground"
            aria-label="Notifikasi"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full ring-2 ring-background" />
          </Button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu pengguna"
              aria-expanded={menuOpen}
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover text-popover-foreground shadow-lg z-50 p-1.5 animate-in fade-in-50 zoom-in-95">
                  <div className="px-2.5 py-2 border-b border-border/50">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-muted font-medium transition-colors"
                    >
                      <User className="size-3.5 text-muted-foreground" />
                      Pengaturan Profil
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors text-left"
                    >
                      <LogOut className="size-3.5" />
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
