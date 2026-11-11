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

  // ✅ PERFORMANCE: Run all independent queries in parallel using Promise.all
  const [
    { count: totalApplicants },
    { data: statusCounts },
    { data: periods },
    { data: latestRun },
  ] = await Promise.all([
    // Total applicants count
    supabase.from("applications").select("*", { count: "exact", head: true }),

    // All status counts in one query — group by status
    supabase.from("applications").select("status"),

    // All periods
    supabase
      .from("scholarship_periods")
      .select("*")
      .order("created_at", { ascending: false }),

    // Latest calculation run
    supabase
      .from("calculation_runs")
      .select("snapshot_threshold, hasil_matriks")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Derive counts from the fetched status rows (avoids 6 separate queries)
  const counts = (statusCounts || []).reduce(
    (acc, row) => {
      const s = row.status as string
      acc[s] = (acc[s] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const draftCount = counts["draft"] ?? 0
  const pendingVerification = counts["submitted"] ?? 0
  const totalVerified = counts["verified"] ?? 0
  const rejectedCount = counts["rejected"] ?? 0
  const passedCount = counts["passed"] ?? 0
  const notPassedCount = counts["not_passed"] ?? 0

  // Find most active period
  const activePeriod =
    periods?.find((p) =>
      ["open", "verification", "calculated", "published"].includes(p.status)
    ) ||
    periods?.[0] ||
    null

  // Calculate total quota across all periods
  const totalQuota = (periods || []).reduce((acc, p) => acc + (p.kuota || 0), 0)

  // Extract cutoff score from latest run
  let cutoffScore: number | null = null
  if (latestRun?.hasil_matriks && typeof latestRun.hasil_matriks === "object") {
    const hasil = latestRun.hasil_matriks as Record<string, unknown>
    if (typeof hasil.cutoff_net_score === "number") {
      cutoffScore = hasil.cutoff_net_score
    }
  }

  // Build Action Items
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

  if (pendingVerification > 0 && activePeriod) {
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

  const verificationPeriods = (periods || []).filter((p) => p.status === "verification")
  for (const vp of verificationPeriods) {
    actionItems.push({
      id: `calc-${vp.id}`,
      title: `Kalkulasi ELECTRE Siap Dijalankan: ${vp.nama}`,
      description:
        "Tahap verifikasi telah aktif. Pastikan semua pelamar terverifikasi dan jalankan kalkulasi matriks ELECTRE.",
      href: `/admin/periods/${vp.id}/calculate`,
      badge: "Kalkulasi",
      badgeVariant: "warning",
      icon: <Calculator className="size-4 text-amber-600" />,
    })
  }

  const calculatedPeriods = (periods || []).filter((p) => p.status === "calculated")
  for (const cp of calculatedPeriods) {
    actionItems.push({
      id: `pub-${cp.id}`,
      title: `Publikasi Hasil Siap: ${cp.nama}`,
      description:
        "Hasil perankingan ELECTRE telah dihitung resmi dan siap dipublikasikan ke mahasiswa beserta notifikasi email.",
      href: `/admin/periods/${cp.id}/publish`,
      badge: "Publikasi",
      badgeVariant: "default",
      icon: <Send className="size-4 text-primary" />,
    })
  }

  // Donut chart dataset
  const donutData: StatusDistributionItem[] = [
    { status: "draft", label: "Draft Mahasiswa", count: draftCount, color: "#94a3b8" },
    { status: "submitted", label: "Menunggu Verifikasi", count: pendingVerification, color: "#f59e0b" },
    { status: "verified", label: "Terverifikasi", count: totalVerified, color: "#0d9488" },
    { status: "passed", label: "Lolos Seleksi", count: passedCount, color: "#10b981" },
    { status: "not_passed", label: "Tidak Lolos", count: notPassedCount, color: "#6b7280" },
    { status: "rejected", label: "Berkas Ditolak", count: rejectedCount, color: "#ef4444" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan seleksi penerimaan beasiswa, antrean verifikasi, dan distribusi status
          </p>
        </div>

        <Link href="/admin/periods">
          <Button className="gap-2 font-semibold shrink-0">
            <Calendar className="size-4" />
            Kelola Periode
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applicants */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Pelamar
            </CardTitle>
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
              <Users className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalApplicants ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Dari seluruh periode beasiswa</p>
          </CardContent>
        </Card>

        {/* Needs Verification */}
        <Card className="shadow-sm border-amber-200/60 bg-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Perlu Verifikasi
            </CardTitle>
            <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="size-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-700">
              {pendingVerification}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Berkas diajukan menunggu peninjauan</p>
          </CardContent>
        </Card>

        {/* Total Quota */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Kuota
            </CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{totalQuota}</div>
            <p className="text-xs text-muted-foreground mt-1">Akumulasi kuota beasiswa tersedia</p>
          </CardContent>
        </Card>

        {/* Cutoff Score */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Garis Batas Lolos
            </CardTitle>
            <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">
              {cutoffScore !== null ? (cutoffScore > 0 ? `+${cutoffScore}` : cutoffScore) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cutoffScore !== null ? "Net Score batas kuota terakhir" : "Belum dihitung resmi"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Action Items & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Action Items */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="size-4 text-[oklch(0.72_0.17_55)]" />
              Perlu Ditindak
            </h2>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
              {actionItems.length} tindakan
            </span>
          </div>

          {actionItems.length > 0 ? (
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{item.title}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.badgeVariant === "destructive"
                              ? "bg-destructive/10 text-destructive"
                              : item.badgeVariant === "warning"
                              ? "bg-amber-500/10 text-amber-600"
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
                    <Button size="sm" variant="outline" className="w-full sm:w-auto gap-1 text-xs font-semibold">
                      Tindak Lanjuti
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="py-10 text-center space-y-2">
                <CheckCircle2 className="size-9 text-emerald-500 mx-auto" />
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
          <Card className="shadow-sm h-full flex flex-col justify-between">
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
            className="text-xs text-primary font-semibold hover:underline underline-offset-4 flex items-center gap-1"
          >
            Lihat semua
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {periods && periods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periods.slice(0, 6).map((period) => (
              <Card
                key={period.id}
                className="hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-bold line-clamp-1">
                      {period.nama}
                    </CardTitle>
                    <StatusBadge status={period.status} size="sm" />
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {period.deskripsi || "Tidak ada deskripsi"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                    <span className="font-semibold font-mono">Kuota: {period.kuota} Mhs</span>
                    <Link href={`/admin/periods/${period.id}/overview`}>
                      <Button variant="ghost" size="sm" className="gap-1 font-semibold text-xs h-7">
                        Buka
                        <ArrowRight className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Belum ada periode beasiswa yang dibuat.
              </p>
              <Link href="/admin/periods">
                <Button size="sm" className="font-semibold">Buat Periode Baru</Button>
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
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-xl border bg-card p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  )
}

