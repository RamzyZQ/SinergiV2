import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  FileText,
  UserCheck,
} from "lucide-react"

export const metadata = {
  title: "Dashboard Mahasiswa — SINERGI Beasiswa",
  description: "Portal pendaftaran dan pemantauan status seleksi beasiswa mahasiswa.",
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get active period
  const { data: activePeriods } = await supabase
    .from("scholarship_periods")
    .select("*")
    .in("status", ["open", "verification", "calculated", "published"])
    .order("created_at", { ascending: false })
    .limit(1)

  const activePeriod = activePeriods?.[0] || null

  // Get user's application for active period (if any)
  let activeApplication = null
  if (activePeriod && user) {
    const { data: app } = await supabase
      .from("applications")
      .select("*")
      .eq("period_id", activePeriod.id)
      .eq("user_id", user.id)
      .maybeSingle()
    activeApplication = app
  }

  // Get past applications
  let pastApplications: Array<{
    id: string
    status: string
    created_at: string
    scholarship_periods: { nama: string; status: string } | null
  }> = []

  if (user) {
    const { data: past } = await supabase
      .from("applications")
      .select("id, status, created_at, scholarship_periods(nama, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (past) {
      pastApplications = past as unknown as typeof pastApplications
    }
  }

  const steps = [
    { key: "draft", label: "Draf Pendaftaran", icon: FileText },
    { key: "submitted", label: "Berkas Terkirim", icon: Clock },
    { key: "verified", label: "Verifikasi Berkas", icon: UserCheck },
    { key: "result", label: "Pengumuman Hasil", icon: CheckCircle },
  ]

  const getActiveStepIndex = (status?: string) => {
    if (!status || status === "draft") return 0
    if (status === "submitted") return 1
    if (status === "verified" || status === "rejected") return 2
    if (status === "passed" || status === "not_passed") return 3
    return 0
  }

  const activeStepIdx = getActiveStepIndex(activeApplication?.status)

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Portal Seleksi Beasiswa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau status pendaftaran dan pengumuman beasiswa berbasis perhitungan ELECTRE
          </p>
        </div>
      </div>

      {/* Active Period Card */}
      {activePeriod ? (
        <Card className="border-primary/20 shadow-sm overflow-hidden bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Periode Aktif
                  </span>
                  <StatusBadge status={activePeriod.status} size="sm" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {activePeriod.nama}
                </CardTitle>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-full border shadow-2xs">
                <Calendar className="size-3.5 text-primary" />
                <span>
                  Batas Akhir:{" "}
                  {new Date(activePeriod.tgl_tutup).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Stepper */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Tahapan Pendaftaran Anda
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {steps.map((step, idx) => {
                  const isCurrent = idx === activeStepIdx
                  const isDone = idx < activeStepIdx
                  const StepIcon = step.icon

                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/5 text-primary font-medium shadow-2xs"
                          : isDone
                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900"
                          : "border-border/60 bg-background text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <StepIcon className="size-4 shrink-0" />
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-background/80 border">
                          0{idx + 1}
                        </span>
                      </div>
                      <span className="text-xs line-clamp-1">{step.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Application Current Status & Action */}
            <div className="p-4 rounded-xl border bg-background/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Status Pendaftaran Anda:
                  </span>
                  <StatusBadge
                    status={activeApplication ? activeApplication.status : "draft"}
                    size="sm"
                  />
                </div>
                <p className="text-sm text-foreground">
                  {!activeApplication
                    ? "Anda belum melengkapi formulir pendaftaran untuk periode ini."
                    : activeApplication.status === "draft"
                    ? "Formulir Anda tersimpan sebagai draf. Lengkapi berkas dan kirimkan."
                    : activeApplication.status === "submitted"
                    ? "Berkas berhasil dikirim dan sedang dalam antrean verifikasi panitia."
                    : activeApplication.status === "verified"
                    ? "Berkas Anda telah diverifikasi dan siap masuk ke proses kalkulasi ELECTRE."
                    : activeApplication.status === "rejected"
                    ? "Berkas Anda memerlukan perbaikan. Silakan cek catatan admin."
                    : "Proses seleksi telah selesai dihitung."}
                </p>
              </div>

              <div>
                {!activeApplication ? (
                  <Link href={`/apply/${activePeriod.id}`}>
                    <Button className="w-full sm:w-auto gap-2">
                      <Sparkles className="size-4" />
                      Mulai Pendaftaran
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                ) : activeApplication.status === "draft" ? (
                  <Link href={`/apply/${activePeriod.id}`}>
                    <Button className="w-full sm:w-auto gap-2">
                      Lanjutkan Formulir
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                ) : activePeriod.status === "published" ? (
                  <Link href={`/result/${activePeriod.id}`}>
                    <Button variant="default" className="w-full sm:w-auto gap-2">
                      Lihat Hasil Seleksi
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled className="w-full sm:w-auto">
                    Menunggu Verifikasi & Pengumuman
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12 px-4 border-dashed">
          <CardContent className="space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="size-6" />
            </div>
            <CardTitle className="text-lg">Tidak Ada Periode Aktif</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Saat ini belum ada periode seleksi beasiswa yang dibuka. Silakan
              pantau kembali halaman ini secara berkala.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Past Applications Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Riwayat Pendaftaran</h2>
        {pastApplications.length > 0 ? (
          <div className="divide-y rounded-xl border bg-card overflow-hidden">
            {pastApplications.map((app) => (
              <div
                key={app.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {app.scholarship_periods?.nama || "Periode Beasiswa"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diajukan pada{" "}
                    {new Date(app.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <StatusBadge status={app.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Belum ada riwayat pendaftaran sebelumnya.
          </p>
        )}
      </div>
    </div>
  )
}
