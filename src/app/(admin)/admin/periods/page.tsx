import * as React from "react"
import Link from "next/link"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import {
  Calendar,
  ArrowRight,
  Users,
  GraduationCap,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react"
import { CreatePeriodDialog } from "@/components/create-period-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Kelola Periode Beasiswa — Admin SINERGI",
  description:
    "Kelola jadwal pendaftaran, kuota penerima, dan pantau seluruh tahapan seleksi beasiswa mahasiswa secara terpusat.",
}

const statusAccentColors: Record<string, { bar: string; badgeBorder: string }> = {
  open: { bar: "bg-[#D9A441]", badgeBorder: "border-[#D9A441]" },
  verification: { bar: "bg-[#2456A6]", badgeBorder: "border-[#2456A6]" },
  calculated: { bar: "bg-indigo-500", badgeBorder: "border-indigo-500" },
  published: { bar: "bg-emerald-500", badgeBorder: "border-emerald-500" },
  closed: { bar: "bg-slate-400", badgeBorder: "border-slate-400" },
  draft: { bar: "bg-slate-300", badgeBorder: "border-slate-300" },
}

export default function AdminPeriodsPage() {
  return (
    <React.Suspense fallback={<AdminPeriodsFallback />}>
      <AdminPeriodsContent />
    </React.Suspense>
  )
}

async function AdminPeriodsContent() {
  await connection()
  const supabase = await createClient()

  // Concurrently fetch periods and applications to calculate applicant counts
  const [{ data: periods }, { data: applications }] = await Promise.all([
    supabase
      .from("scholarship_periods")
      .select(`
        id,
        nama,
        deskripsi,
        tgl_buka,
        tgl_tutup,
        kuota,
        status,
        created_at
      `)
      .order("created_at", { ascending: false }),
    supabase.from("applications").select("period_id, status"),
  ])

  // Aggregate applicant counts per period
  const applicantCountMap = (applications || []).reduce(
    (acc, app) => {
      acc[app.period_id] = (acc[app.period_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const periodList = periods || []
  const totalPeriods = periodList.length
  const openPeriods = periodList.filter((p) => p.status === "open").length
  const totalQuota = periodList.reduce((acc, p) => acc + (p.kuota || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#173B70]">
            Kelola Periode Beasiswa
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Kelola jadwal pendaftaran, kuota penerima, dan pantau seluruh tahapan seleksi beasiswa mahasiswa secara terpusat.
          </p>
        </div>

        <div className="shrink-0">
          <CreatePeriodDialog />
        </div>
      </div>

      {/* Overview Stats Strip */}
      {totalPeriods > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#DCE5F1] bg-white shadow-2xs">
            <div className="size-10 rounded-lg bg-[#EAF2FF] flex items-center justify-center shrink-0">
              <Layers className="size-5 text-[#2456A6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Total Periode</p>
              <p className="text-lg font-bold text-[#173B70] leading-tight">
                {totalPeriods}{" "}
                <span className="text-xs font-normal text-muted-foreground">Program</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#DCE5F1] bg-white shadow-2xs">
            <div className="size-10 rounded-lg bg-[#FFF7E8] flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-[#D9A441]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Pendaftaran Dibuka</p>
              <p className="text-lg font-bold text-[#D9A441] leading-tight">
                {openPeriods}{" "}
                <span className="text-xs font-normal text-muted-foreground">Periode Aktif</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#DCE5F1] bg-white shadow-2xs">
            <div className="size-10 rounded-lg bg-[#EAF2FF] flex items-center justify-center shrink-0">
              <Users className="size-5 text-[#2456A6]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Total Kuota Penerima</p>
              <p className="text-lg font-bold text-[#173B70] leading-tight">
                {totalQuota}{" "}
                <span className="text-xs font-normal text-muted-foreground">Mahasiswa</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feed List: Memanjang terus urut ke bawah */}
      {periodList.length > 0 ? (
        <div className="space-y-3.5">
          {periodList.map((period) => {
            const applicantCount = applicantCountMap[period.id] || 0
            const accent = statusAccentColors[period.status] || {
              bar: "bg-[#2456A6]",
              badgeBorder: "border-[#2456A6]",
            }

            return (
              <article
                key={period.id}
                className="group relative flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl border border-[#DCE5F1] bg-white p-5 sm:p-6 shadow-2xs transition-all duration-200 hover:border-[#2456A6]/50 hover:shadow-md"
              >
                {/* Left Colored Accent Stripe */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${accent.bar}`}
                  aria-hidden="true"
                />

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 pl-2.5 sm:pl-3 space-y-2.5">
                  {/* Title & Single-line Status Badge */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#173B70] group-hover:text-[#2456A6] transition-colors leading-snug">
                      {period.nama}
                    </h2>
                    <StatusBadge
                      status={period.status}
                      size="sm"
                      className="shrink-0 whitespace-nowrap"
                    />
                  </div>

                  {/* Description: full-width, no mid-word cuts */}
                  <p className="text-sm text-[#64748B] leading-relaxed max-w-4xl">
                    {period.deskripsi || "Tidak ada deskripsi untuk periode beasiswa ini."}
                  </p>

                  {/* Metadata Chips: Kuota, Pelamar, Tanggal */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-[#64748B]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="size-3.5 text-[#2456A6] shrink-0" />
                      <span>
                        Kuota:{" "}
                        <strong className="text-[#263449] font-semibold">
                          {period.kuota} Mahasiswa
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium">
                      <GraduationCap className="size-3.5 text-[#D9A441] shrink-0" />
                      <span>
                        Pendaftar:{" "}
                        <strong className="text-[#263449] font-semibold">
                          {applicantCount} Orang
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                      <span>
                        Batas Akhir:{" "}
                        <strong className="text-[#263449] font-medium">
                          {new Date(period.tgl_tutup).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </div>

                    {period.tgl_buka && (
                      <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground/80">
                        <Clock className="size-3.5 shrink-0" />
                        <span>
                          Dibuka:{" "}
                          {new Date(period.tgl_buka).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 pl-2.5 sm:pl-3 lg:pl-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#DCE5F1]/80">
                  <Link href={`/admin/periods/${period.id}/overview`} className="w-full sm:w-auto inline-block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto gap-2 border-[#DCE5F1] bg-white font-semibold text-[#173B70] hover:border-[#2456A6] hover:bg-[#EAF2FF] hover:text-[#173B70] px-4 py-2 rounded-xl transition-all shadow-2xs group-hover:bg-[#173B70] group-hover:text-white group-hover:border-[#173B70]"
                    >
                      Buka Workspace
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12 px-4 border-dashed rounded-2xl">
          <CardContent className="space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="size-6" />
            </div>
            <CardTitle className="text-lg">Belum Ada Periode</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Mulai dengan membuat periode baru untuk menyusun kriteria, bobot, dan membuka pendaftaran mahasiswa.
            </CardDescription>
            <div className="pt-2">
              <CreatePeriodDialog />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AdminPeriodsFallback() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-card">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Feed List Skeletons */}
      <div className="space-y-3.5">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-6"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-5 pt-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
