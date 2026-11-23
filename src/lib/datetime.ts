const JAKARTA_TIME_ZONE = "Asia/Jakarta"

export function parseJakartaDateTime(value: string): Date | null {
  if (!value) return null
  const normalized = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${normalized}+07:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTimeLocalJakarta(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

export function formatDateTimeJakarta(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Jadwal belum valid"
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date) + " WIB"
}
