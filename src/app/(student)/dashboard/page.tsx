import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentScholarshipHero } from "@/components/student-scholarship-hero"
import {
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  UserCheck,
  ChevronRight,
  Trophy,
  AlertCircle,
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

  // Show currently open scholarships in the rotating hero and retain the
  // latest active period for the student's application status panel.
  const [{ data: activePeriods }, { data: openScholarshipRows }] = await Promise.all([
    supabase
      .from("scholarship_periods")
      .select("*")
      .in("status", ["open", "verification", "calculated", "published"])
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("scholarship_periods")
      .select("id, nama, deskripsi, tgl_tutup, kuota")
      .eq("status", "open")
      .order("tgl_tutup", { ascending: true }),
  ])

  const activePeriod = activePeriods?.[0] || null
  const openScholarships = openScholarshipRows || []

  // Get user's application for active period (if any) — parallel with past applications
  const [appResult, pastResult] = await Promise.all([
    activePeriod && user
      ? supabase
          .from("applications")
          .select("*")
          .eq("period_id", activePeriod.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("applications")
          .select("id, status, created_at, scholarship_periods(nama, status)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const activeApplication = appResult.data

  type PastApp = {
    id: string
    status: string
    created_at: string
    scholarship_periods: { nama: string; status: string } | null
  }
  const pastApplications: PastApp[] = (pastResult.data as unknown as PastApp[]) || []

  const steps = [
    {
      key: "draft",
      label: "Isi Formulir",
      sublabel: "Data diri & berkas",
      icon: FileText,
      color: "text-blue-500",
    },
    {
      key: "submitted",
      label: "Kirim Berkas",
      sublabel: "Submit pendaftaran",
      icon: Clock,
      color: "text-[#D9A441]",
    },
    {
      key: "verified",
      label: "Verifikasi",
      sublabel: "Peninjauan admin",
      icon: UserCheck,
      color: "text-[#2456A6]",
    },
    {
      key: "result",
      label: "Pengumuman",
      sublabel: "Hasil seleksi",
      icon: Trophy,
      color: "text-emerald-500",
    },
  ]

  const getActiveStepIndex = (status?: string) => {
    if (!status || status === "draft") return 0
    if (status === "submitted") return 1
    if (status === "verified" || status === "rejected") return 2
    if (status === "passed" || status === "not_passed") return 3
    return 0
  }

  const activeStepIdx = getActiveStepIndex(activeApplication?.status)

  const getStatusMessage = (status?: string) => {
    if (!status) return "Anda belum melengkapi formulir pendaftaran untuk periode ini."
    if (status === "draft") return "Formulir Anda tersimpan sebagai draf. Lengkapi berkas dan kirimkan."
    if (status === "submitted") return "Berkas berhasil dikirim dan sedang dalam antrean verifikasi panitia."
    if (status === "verified") return "Berkas Anda telah diverifikasi dan siap masuk ke proses kalkulasi ELECTRE."
    if (status === "rejected") return "Berkas Anda memerlukan perbaikan. Silakan cek catatan admin."
    return "Proses seleksi telah selesai dihitung."
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 sm:-mt-8">
        <StudentScholarshipHero scholarships={openScholarships} />
      </div>

      {/* Active Period Card */}
      {activePeriod ? (
        <Card className="border-primary/15 shadow-sm overflow-hidden">
          {/* Card header with period info */}
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Periode Aktif
                  </span>
                  <StatusBadge status={activePeriod.status} size="sm" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black">
                  {activePeriod.nama}
                </CardTitle>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-full border shadow-sm">
                <Calendar className="size-3.5 text-primary" />
                <span>
                  Tutup:{" "}
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
            {/* ===== HORIZONTAL STEPPER (Tokopedia/Shopee style) ===== */}
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-4">
                Tahapan Pendaftaran
              </span>

              <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" aria-hidden="true">
                  {/* Progress fill */}
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min((activeStepIdx / (steps.length - 1)) * 100, 100)}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-4 relative z-10">
                  {steps.map((step, idx) => {
                    const isCurrent = idx === activeStepIdx
                    const isDone = idx < activeStepIdx
                    const StepIcon = step.icon

                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center gap-2 px-1"
                      >
                        {/* Step circle */}
                        <div
                          className={[
                            "size-10 rounded-full flex items-center justify-center border-2 transition-all",
                            isDone
                              ? "bg-primary border-primary text-primary-foreground shadow-sm"
                              : isCurrent
                              ? "bg-background border-primary text-primary shadow-md ring-4 ring-primary/15"
                              : "bg-background border-border text-muted-foreground",
                          ].join(" ")}
                        >
                          {isDone ? (
                            <CheckCircle className="size-5" />
                          ) : (
                            <StepIcon className="size-4" />
                          )}
                        </div>

                        {/* Step label */}
                        <div className="text-center">
                          <p
                            className={[
                              "text-xs font-semibold leading-tight",
                              isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground",
                            ].join(" ")}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                            {step.sublabel}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Status + Action Panel */}
            <div className="p-4 rounded-xl border bg-background/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Status Pendaftaran:
                  </span>
                  <StatusBadge
                    status={activeApplication ? activeApplication.status : "draft"}
                    size="sm"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80">
                    {getStatusMessage(activeApplication?.status)}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {!activeApplication ? (
                  <Link href={`/apply/${activePeriod.id}`}>
                    <Button className="w-full sm:w-auto gap-2 font-semibold">
                      Mulai Pendaftaran
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                ) : activeApplication.status === "draft" ? (
                  <Link href={`/apply/${activePeriod.id}`}>
                    <Button className="w-full sm:w-auto gap-2 font-semibold">
                      Lanjutkan Formulir
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                ) : activePeriod.status === "published" ? (
                  <Link href={`/result/${activePeriod.id}`}>
                    <Button variant="default" className="w-full sm:w-auto gap-2 font-semibold">
                      Lihat Hasil Seleksi
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled className="w-full sm:w-auto text-sm">
                    Menunggu Verifikasi
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-14 px-4 border-dashed border-2">
          <CardContent className="space-y-3">
            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="size-7" />
            </div>
            <CardTitle className="text-lg font-bold">Tidak Ada Periode Aktif</CardTitle>
            <CardDescription className="max-w-sm mx-auto text-sm">
              Saat ini belum ada periode seleksi beasiswa yang dibuka. Pantau kembali halaman ini
              secara berkala.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Registration history */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Riwayat Pendaftaran</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Status pengajuan beasiswa yang pernah Anda ikuti
            </p>
          </div>
          {pastApplications.length > 0 && (
            <span className="rounded-full border border-[#DCE5F1] bg-[#EAF2FF] px-3 py-1 text-xs font-semibold text-[#173B70]">
              {pastApplications.length} pengajuan
            </span>
          )}
        </div>
        {pastApplications.length > 0 ? (
          <Card className="overflow-hidden rounded-2xl border-[#DCE5F1] bg-white">
            <div className="divide-y divide-[#DCE5F1]">
              {pastApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex cursor-pointer flex-col gap-3 px-5 py-5 transition-colors duration-200 hover:bg-[#EAF2FF]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2456A6] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[#263449]">
                      {app.scholarship_periods?.nama || "Periode Beasiswa"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Diajukan pada{" "}
                      {new Date(app.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} size="sm" />
                    <ChevronRight className="size-4 text-[#8492A6]" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="border-dashed border-[#DCE5F1] bg-white">
            <CardContent className="py-9 text-center">
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#2456A6]">
                <FileText className="size-5" />
              </div>
              <p className="text-sm font-semibold text-[#263449]">
                Belum ada riwayat pendaftaran
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Pengajuan beasiswa Anda akan muncul di sini beserta status dan tanggal pengajuannya.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

