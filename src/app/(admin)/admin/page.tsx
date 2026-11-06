import * as React from "react"
import Link from "next/link"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardDonutChart, StatusDistributionItem } from "./dashboard-donut-chart"
import {
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  FileCheck,
  Calculator,
  Send,
} from "lucide-react"

export const metadata = {
  title: "Dashboard Admin — Sistem Seleksi Beasiswa ELECTRE",
  description: "Pusat kendali dan monitoring seleksi beasiswa mahasiswa dengan metode ELECTRE I.",
}

export default function AdminDashboardPage() {
  return (
    <React.Suspense fallback={<AdminDashboardFallback />}>
      <AdminDashboardContent />
    </React.Suspense>
  )
}

async function AdminDashboardContent() {
  await connection()
  const supabase = await createClient()

  // 1. Aggregate application statistics
  const { count: totalApplicants } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })

  const { count: draftCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft")

  const { count: pendingVerification } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted")

  const { count: totalVerified } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "verified")

  const { count: rejectedCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "rejected")

  const { count: passedCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "passed")

  const { count: notPassedCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "not_passed")

  // 2. Query periods
  const { data: periods } = await supabase
    .from("scholarship_periods")
    .select("*")
    .order("created_at", { ascending: false })

  // Find most active period (prefer open/verification/calculated)
  const activePeriod = periods?.find((p) =>
    ["open", "verification", "calculated", "published"].includes(p.status)
  ) || periods?.[0] || null

  // Calculate total quota across active or all periods
  const totalQuota = (periods || []).reduce((acc, p) => acc + (p.kuota || 0), 0)

  // 3. Query latest calculation run for cutoff net score
  let cutoffScore: number | null = null
  const { data: latestRun } = await supabase
    .from("calculation_runs")
    .select("snapshot_threshold, hasil_matriks")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestRun?.hasil_matriks && typeof latestRun.hasil_matriks === "object") {
    const hasil = latestRun.hasil_matriks as Record<string, unknown>
    if (typeof hasil.cutoff_net_score === "number") {
      cutoffScore = hasil.cutoff_net_score
    }
  }

  // 4. Build Action Items ("Perlu Ditindak")
  interface ActionItem {
    id: string
    title: string
    description: string
    href: string
    badge: string
    badgeVariant: "destructive" | "warning" | "default" | "secondary"
    icon: React.ReactNode
  }

  const actionItems: ActionItem[] = []

  // Check periods with pending applicant verifications
  if ((pendingVerification ?? 0) > 0 && activePeriod) {
    actionItems.push({
      id: "verify-applicants",
      title: `${pendingVerification} Pelamar Belum Diverifikasi`,
      description: `Ada berkas pendaftaran yang telah diajukan dan membutuhkan peninjauan dokumen di periode ${activePeriod.nama}.`,
      href: `/admin/periods/${activePeriod.id}/applicants?status=submitted`,
      badge: "Mendesak",
      badgeVariant: "destructive",
      icon: <FileCheck className="size-4 text-destructive" />,
    })
  }

  // Check periods ready for calculation
  const verificationPeriods = (periods || []).filter((p) => p.status === "verification")
  for (const vp of verificationPeriods) {
    actionItems.push({
      id: `calc-${vp.id}`,
      title: `Kalkulasi ELECTRE Siap Dijalankan: ${vp.nama}`,
      description: "Tahap verifikasi telah aktif. Pastikan semua pelamar terverifikasi dan jalankan kalkulasi matriks ELECTRE.",
      href: `/admin/periods/${vp.id}/calculate`,
      badge: "Kalkulasi",
      badgeVariant: "warning",
      icon: <Calculator className="size-4 text-amber-600" />,
    })
  }

  // Check periods ready for publication
  const calculatedPeriods = (periods || []).filter((p) => p.status === "calculated")
  for (const cp of calculatedPeriods) {
    actionItems.push({
      id: `pub-${cp.id}`,
      title: `Publikasi Hasil Siap: ${cp.nama}`,
      description: "Hasil perankingan ELECTRE telah dihitung resmi dan siap dipublikasikan ke mahasiswa beserta notifikasi email.",
      href: `/admin/periods/${cp.id}/publish`,
      badge: "Publikasi",
      badgeVariant: "default",
      icon: <Send className="size-4 text-primary" />,
    })
  }

  // Donut chart dataset
  const donutData: StatusDistributionItem[] = [
    {
      status: "draft",
      label: "Draft Mahasiswa",
      count: draftCount ?? 0,
      color: "#94a3b8", // slate-400
    },
    {
      status: "submitted",
      label: "Menunggu Verifikasi",
      count: pendingVerification ?? 0,
      color: "#f59e0b", // amber-500
    },
    {
      status: "verified",
      label: "Terverifikasi",
      count: totalVerified ?? 0,
      color: "#3b82f6", // blue-500
    },
    {
      status: "passed",
      label: "Lolos Seleksi",
      count: passedCount ?? 0,
      color: "#10b981", // emerald-500
    },
    {
      status: "not_passed",
      label: "Tidak Lolos",
      count: notPassedCount ?? 0,
      color: "#6b7280", // gray-500
    },
    {
      status: "rejected",
      label: "Berkas Ditolak",
      count: rejectedCount ?? 0,
      color: "#ef4444", // red-500
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan seleksi penerimaan beasiswa, antrean verifikasi, dan distribusi status
          </p>
        </div>

        <Link href="/admin/periods">
          <Button className="gap-2">
            <Calendar className="size-4" />
            Kelola Periode Beasiswa
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Pelamar
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplicants ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari seluruh periode beasiswa
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-amber-200 bg-amber-50/20 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Perlu Verifikasi
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {pendingVerification ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Berkas diajukan menunggu peninjauan
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Kuota Penerima
            </CardTitle>
            <Award className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalQuota}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Akumulasi kuota beasiswa tersedia
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Garis Batas Lolos
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {cutoffScore !== null ? (cutoffScore > 0 ? `+${cutoffScore}` : cutoffScore) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cutoffScore !== null ? "Net Score batas kuota terakhir" : "Belum dihitung resmi"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Action Items ("Perlu Ditindak") & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Action Items List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              Perlu Ditindak
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {actionItems.length} tindakan tertunda
            </span>
          </div>

          {actionItems.length > 0 ? (
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-2xs hover:border-primary/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.title}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.badgeVariant === "destructive"
                              ? "bg-destructive/10 text-destructive"
                              : item.badgeVariant === "warning"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <Link href={item.href} className="w-full sm:w-auto shrink-0">
                    <Button size="sm" variant="outline" className="w-full sm:w-auto gap-1 text-xs">
                      Tindak Lanjuti
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="py-8 text-center space-y-2">
                <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold">Semua tugas administrasi up-to-date!</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Tidak ada berkas yang menunggu verifikasi mendesak ataupun kalkulasi yang tertunda saat ini.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Status Distribution Donut Chart */}
        <div className="lg:col-span-5">
          <Card className="shadow-2xs h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                Distribusi Status Pelamar
              </CardTitle>
              <CardDescription className="text-xs">
                Proporsi status pendaftaran mahasiswa di sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardDonutChart
                data={donutData}
                activePeriodId={activePeriod?.id || null}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Periods List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            Periode Beasiswa Terbaru
          </h2>
          <Link
            href="/admin/periods"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Lihat semua periode
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {periods && periods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periods.slice(0, 6).map((period) => (
              <Card
                key={period.id}
                className="hover:border-primary/40 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-bold line-clamp-1">
                      {period.nama}
                    </CardTitle>
                    <StatusBadge status={period.status} size="sm" />
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    {period.deskripsi || "Tidak ada deskripsi"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                    <span className="font-mono">Kuota: {period.kuota} Mahasiswa</span>
                    <Link href={`/admin/periods/${period.id}/overview`}>
                      <Button variant="ghost" size="xs" className="gap-1 font-semibold">
                        Buka Workspace
                        <ArrowRight className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Belum ada periode beasiswa yang dibuat.
              </p>
              <Link href="/admin/periods">
                <Button size="sm">Buat Periode Baru</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function AdminDashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-lg border bg-card p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border bg-card p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-4 rounded-lg border bg-card p-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  )
}
