"use client"

import * as React from "react"
import { Bell, CheckCheck, Inbox, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface NotificationItem {
  id: string
  jenis: string
  judul: string
  pesan: string | null
  dibaca: boolean
  created_at: string
}

export function StudentNotificationMenu() {
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const loadedRef = React.useRef(false)

  React.useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const loadNotifications = async () => {
    setLoading(true)
    setErrorMessage(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("notifications")
      .select("id, jenis, judul, pesan, dibaca, created_at")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      setErrorMessage("Notifikasi belum dapat dimuat. Coba lagi sebentar.")
    } else {
      setNotifications((data || []) as NotificationItem[])
      loadedRef.current = true
    }
    setLoading(false)
  }

  const toggleMenu = () => {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen && !loadedRef.current) void loadNotifications()
  }

  const markRead = async (notification: NotificationItem) => {
    if (notification.dibaca) return
    setNotifications((current) => current.map((item) =>
      item.id === notification.id ? { ...item, dibaca: true } : item
    ))
    const { error } = await createClient()
      .from("notifications")
      .update({ dibaca: true })
      .eq("id", notification.id)
    if (error) {
      setNotifications((current) => current.map((item) =>
        item.id === notification.id ? { ...item, dibaca: false } : item
      ))
      setErrorMessage("Status baca notifikasi gagal disimpan.")
    }
  }

  const markAllRead = async () => {
    const unreadIds = notifications.filter((item) => !item.dibaca).map((item) => item.id)
    if (unreadIds.length === 0) return
    setNotifications((current) => current.map((item) => ({ ...item, dibaca: true })))
    const { error } = await createClient()
      .from("notifications")
      .update({ dibaca: true })
      .in("id", unreadIds)
    if (error) {
      setNotifications((current) => current.map((item) =>
        unreadIds.includes(item.id) ? { ...item, dibaca: false } : item
      ))
      setErrorMessage("Notifikasi belum dapat ditandai sudah dibaca.")
    }
  }

  const unreadCount = notifications.filter((item) => !item.dibaca).length

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative size-9 rounded-lg text-muted-foreground hover:text-foreground"
        aria-label={unreadCount ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
        aria-expanded={open}
        aria-controls="student-notification-panel"
        onClick={toggleMenu}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#D9A441] text-[9px] font-bold text-[#263449] ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <section
          id="student-notification-panel"
          aria-label="Daftar notifikasi"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl"
        >
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Notifikasi</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
              >
                <CheckCheck className="size-3.5" /> Tandai dibaca
              </button>
            )}
          </header>

          {errorMessage && <p role="alert" className="px-4 py-2 text-xs text-destructive">{errorMessage}</p>}
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Memuat notifikasi…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-muted-foreground">
              <Inbox className="size-6" />
              <p className="text-sm">Belum ada notifikasi.</p>
            </div>
          ) : (
            <ul className="max-h-[min(70vh,28rem)] overflow-y-auto divide-y">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => void markRead(notification)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/60 ${notification.dibaca ? "opacity-75" : "bg-primary/[0.035]"}`}
                  >
                    <span className="flex items-start gap-2.5">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.dibaca ? "bg-transparent" : "bg-[#D9A441]"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{notification.judul}</span>
                        {notification.pesan && <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{notification.pesan}</span>}
                        <time className="mt-1.5 block text-[10px] text-muted-foreground" dateTime={notification.created_at}>
                          {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.created_at))}
                        </time>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className="border-t px-4 py-2 text-center">
            <button type="button" onClick={() => void loadNotifications()} className="text-xs font-medium text-primary hover:underline">
              Muat ulang
            </button>
          </footer>
        </section>
      )}
    </div>
  )
}
