"use client"

import * as React from "react"
import { CalendarClock, Clock3 } from "lucide-react"
import { formatDateTimeJakarta } from "@/lib/datetime"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnnouncementCountdownProps {
  announcementAt: string | null
}

interface RemainingTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function AnnouncementCountdown({ announcementAt }: AnnouncementCountdownProps) {
  const [remaining, setRemaining] = React.useState<RemainingTime | null>(null)
  const [isPast, setIsPast] = React.useState(false)

  React.useEffect(() => {
    if (!announcementAt) return
    const target = new Date(announcementAt).getTime()
    if (!Number.isFinite(target)) return

    const update = () => {
      const difference = target - Date.now()
      if (difference <= 0) {
        setIsPast(true)
        setRemaining(null)
        return
      }

      setIsPast(false)
      const seconds = Math.floor(difference / 1000)
      setRemaining({
        days: Math.floor(seconds / 86400),
        hours: Math.floor((seconds % 86400) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        seconds: seconds % 60,
      })
    }

    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [announcementAt])

  return (
    <Card className="overflow-hidden border-primary/15 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          Countdown Pengumuman
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcementAt ? (
          <p className="text-xs text-muted-foreground">
            Jadwal resmi: {formatDateTimeJakarta(announcementAt)}
          </p>
        ) : null}
        {!announcementAt ? (
          <p className="text-sm text-muted-foreground">Tanggal pengumuman resmi belum ditetapkan panitia.</p>
        ) : isPast ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4" aria-hidden="true" />
            Jadwal pengumuman telah tiba. Hasil akan tersedia setelah dipublikasikan panitia.
          </p>
        ) : remaining ? (
          <div className="grid grid-cols-4 gap-2" aria-label="Waktu tersisa menuju pengumuman" aria-live="off">
            {([
              ["Hari", remaining.days],
              ["Jam", remaining.hours],
              ["Menit", remaining.minutes],
              ["Detik", remaining.seconds],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-primary/5 px-2 py-3 text-center">
                <div className="text-xl font-bold tabular-nums text-primary">{value}</div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Menghitung waktu menuju pengumuman…</p>
        )}
      </CardContent>
    </Card>
  )
}
