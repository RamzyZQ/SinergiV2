"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileEdit,
  DoorOpen,
  Lock,
  Search,
  Calculator,
  Globe,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Sliders,
  Save,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  updatePeriodSettingsAction,
  transitionPeriodStatusAction,
} from "@/app/(admin)/admin/periods/actions"

interface OverviewManagerProps {
  period: {
    id: string
    nama: string
    deskripsi: string | null
    tgl_buka: string
    tgl_tutup: string
    kuota: number
    status: "draft" | "open" | "closed" | "verification" | "calculated" | "published"
    threshold_c_mode: "average" | "manual"
    threshold_c: number | null
    threshold_d_mode: "average" | "manual"
    threshold_d: number | null
    tie_break_rules: string[]
  }
  stats: {
    criteriaCount: number
    totalWeight: number
    missingScalesCount: number
    submittedApplicants: number
    verifiedApplicants: number
    rejectedApplicants: number
    draftApplicants: number
    hasOfficialRun: boolean
  }
}

const CYCLE_STEPS = [
  { key: "draft", label: "Draf Persiapan", icon: FileEdit },
  { key: "open", label: "Pendaftaran Dibuka", icon: DoorOpen },
  { key: "closed", label: "Pendaftaran Ditutup", icon: Lock },
  { key: "verification", label: "Verifikasi Berkas", icon: Search },
  { key: "calculated", label: "Kalkulasi Selesai", icon: Calculator },
  { key: "published", label: "Hasil Dipublikasi", icon: Globe },
] as const

export function OverviewManager({ period, stats }: OverviewManagerProps) {
  const router = useRouter()

  // Transition state
  const [transitionDialogOpen, setTransitionDialogOpen] = React.useState(false)
  const [transitioning, setTransitioning] = React.useState(false)
  const [transitionError, setTransitionError] = React.useState<string | null>(null)

  // Settings form state
  const [savingSettings, setSavingSettings] = React.useState(false)
  const [settingsMessage, setSettingsMessage] = React.useState<string | null>(null)
  const [settingsError, setSettingsError] = React.useState<string | null>(null)

  const [thresholdCMode, setThresholdCMode] = React.useState(period.threshold_c_mode)
  const [thresholdDMode, setThresholdDMode] = React.useState(period.threshold_d_mode)

  const currentIdx = CYCLE_STEPS.findIndex((s) => s.key === period.status)
  const nextStep = currentIdx < CYCLE_STEPS.length - 1 ? CYCLE_STEPS[currentIdx + 1] : null

  // Determine checklist for next step
  const checklistItems: Array<{ label: string; passed: boolean; tip?: string }> = []

  if (period.status === "draft") {
    checklistItems.push({
      label: "Minimal 1 kriteria penilaian telah dibuat",
      passed: stats.criteriaCount > 0,
      tip: `Saat ini ada ${stats.criteriaCount} kriteria`,
    })
    checklistItems.push({
      label: "Total bobot kriteria harus tepat 100%",
      passed: Math.abs(stats.totalWeight - 100) < 0.01,
      tip: `Total bobot saat ini: ${stats.totalWeight.toFixed(2)}%`,
    })
    checklistItems.push({
      label: "Semua kriteria memiliki skala rentang nilai",
      passed: stats.missingScalesCount === 0 && stats.criteriaCount > 0,
      tip: stats.missingScalesCount > 0 ? `${stats.missingScalesCount} kriteria belum ada skala` : "Lengkap",
    })
    checklistItems.push({
      label: "Kuota beasiswa lebih besar dari 0",
      passed: period.kuota > 0,
      tip: `Kuota saat ini: ${period.kuota} mahasiswa`,
    })
  } else if (period.status === "open") {
    checklistItems.push({
      label: "Pendaftaran dapat ditutup kapan saja oleh admin atau sesuai batas waktu",
      passed: true,
      tip: `Total pendaftar masuk: ${stats.submittedApplicants + stats.draftApplicants}`,
    })
  } else if (period.status === "closed") {
    checklistItems.push({
      label: "Terdapat pelamar berstatus 'Diajukan' untuk diproses verifikasi",
      passed: stats.submittedApplicants > 0,
      tip: `Pelamar siap diverifikasi: ${stats.submittedApplicants} orang`,
    })
  } else if (period.status === "verification") {
    checklistItems.push({
      label: "Seluruh pelamar yang diajukan telah diverifikasi (tidak ada antrean pending)",
      passed: stats.submittedApplicants === 0,
      tip: stats.submittedApplicants > 0 ? `Sisa ${stats.submittedApplicants} pelamar belum diproses` : "Semua selesai ditinjau",
    })
    checklistItems.push({
      label: "Minimal 1 pelamar disetujui (Terverifikasi) untuk dihitung",
      passed: stats.verifiedApplicants > 0,
      tip: `Pelamar lolos verifikasi: ${stats.verifiedApplicants} orang`,
    })
  } else if (period.status === "calculated") {
    checklistItems.push({
      label: "Kalkulasi resmi (Official Calculation) telah dijalankan",
      passed: stats.hasOfficialRun,
      tip: stats.hasOfficialRun ? "Snapshot hasil resmi tersimpan" : "Belum dijalankan di tab Kalkulasi",
    })
  }

  const canTransition = checklistItems.length > 0 && checklistItems.every((item) => item.passed)

  // Handle transition submission
  const handleTransition = async () => {
    if (!nextStep) return
    setTransitioning(true)
    setTransitionError(null)

    const res = await transitionPeriodStatusAction(period.id, nextStep.key)
    setTransitioning(false)

    if (res.success) {
      setTransitionDialogOpen(false)
      router.refresh()
    } else {
      setTransitionError(res.error || "Gagal mengubah tahap periode.")
    }
  }

  // Handle settings update
  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsMessage(null)
    setSettingsError(null)

    const formData = new FormData(e.currentTarget)
    const res = await updatePeriodSettingsAction(period.id, formData)
    setSavingSettings(false)

    if (res.success) {
      setSettingsMessage(res.message || "Pengaturan berhasil disimpan.")
      router.refresh()
    } else {
      setSettingsError(res.error || "Gagal menyimpan pengaturan.")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* ================================================================== */}
      {/* 1. SIKLUS PERIODE STEPPER */}
      {/* ================================================================== */}
      <Card className="shadow-xs border-primary/20 bg-gradient-to-b from-card to-muted/10">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Siklus Hidup Periode
                </span>
                <StatusBadge status={period.status} size="sm" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold mt-0.5">
                Tahapan Seleksi Saat Ini: {CYCLE_STEPS[currentIdx]?.label}
              </CardTitle>
            </div>

            {nextStep && (
              <Button
                disabled={!canTransition}
                onClick={() => setTransitionDialogOpen(true)}
                className="gap-2 self-start sm:self-auto bg-primary shadow-xs"
              >
                <span>Lanjut ke Tahap: {nextStep.label}</span>
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Stepper visual */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {CYCLE_STEPS.map((step, idx) => {
              const isCurrent = idx === currentIdx
              const isPast = idx < currentIdx
              const StepIcon = step.icon

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : isPast
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300"
                      : "bg-muted/30 border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <StepIcon className="size-4" />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-background/30 border">
                      0{idx + 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold block leading-tight">
                      {step.label}
                    </span>
                    <span className="text-[10px] opacity-80 block mt-0.5">
                      {isCurrent ? "Sedang Berjalan" : isPast ? "Selesai" : "Mendatang"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Checklist Prasyarat Transisi */}
          {nextStep && (
            <div className="p-4 rounded-xl border bg-background/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold tracking-tight text-foreground">
                  Syarat Beralih ke Tahap {nextStep.label}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {canTransition ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Siap dilanjutkan
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="size-3.5" /> Prasyarat belum lengkap
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                      item.passed
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300"
                        : "bg-rose-50/50 border-rose-200 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-300"
                    }`}
                  >
                    {item.passed ? (
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-medium">{item.label}</span>
                      {item.tip && (
                        <span className="text-[11px] opacity-80 sm:text-right shrink-0">
                          {item.tip}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* 2. PENGATURAN DASAR, THRESHOLD & TIE BREAKING */}
      {/* ================================================================== */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sliders className="size-4" />
            <span>Konfigurasi & Parameter Seleksi</span>
          </div>
          <CardTitle className="text-lg">Pengaturan Dasar & Parameter ELECTRE</CardTitle>
          <CardDescription>
            Ubah nama, tanggal, kuota penerima, mode threshold concordance/discordance, dan urutan tie-breaking
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            {settingsMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                {settingsMessage}
              </div>
            )}
            {settingsError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                {settingsError}
              </div>
            )}

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nama">Nama Periode Beasiswa</Label>
                <Input
                  id="nama"
                  name="nama"
                  defaultValue={period.nama}
                  required
                  placeholder="Contoh: Beasiswa Prestasi Akademik Semester Ganjil 2024/2025"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="deskripsi">Deskripsi Singkat</Label>
                <Textarea
                  id="deskripsi"
                  name="deskripsi"
                  defaultValue={period.deskripsi || ""}
                  rows={2}
                  placeholder="Jelaskan sasaran beasiswa, syarat IPK, dll..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tgl_buka">Tanggal Buka Pendaftaran</Label>
                <Input
                  id="tgl_buka"
                  name="tgl_buka"
                  type="datetime-local"
                  required
                  defaultValue={
                    period.tgl_buka
                      ? new Date(period.tgl_buka).toISOString().slice(0, 16)
                      : ""
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tgl_tutup">Tanggal Tutup Pendaftaran</Label>
                <Input
                  id="tgl_tutup"
                  name="tgl_tutup"
                  type="datetime-local"
                  required
                  defaultValue={
                    period.tgl_tutup
                      ? new Date(period.tgl_tutup).toISOString().slice(0, 16)
                      : ""
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kuota">Kuota Penerima Beasiswa</Label>
                <Input
                  id="kuota"
                  name="kuota"
                  type="number"
                  min="1"
                  required
                  defaultValue={period.kuota}
                  placeholder="Jumlah mahasiswa yang lolos (kuota)"
                />
                <span className="text-[11px] text-muted-foreground">
                  Hanya Top N mahasiswa berdasarkan ranking Net Dominance yang akan berstatus Lolos.
                </span>
              </div>
            </div>

            {/* Threshold Settings Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                Parameter Threshold Concordance (c) & Discordance (d)
              </h4>
              <p className="text-xs text-muted-foreground -mt-2">
                Secara default metode ELECTRE I menggunakan rata-rata elemen matriks (Average). Anda dapat meng-override dengan nilai manual jika diperlukan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border">
                {/* Threshold C */}
                <div className="space-y-3">
                  <Label htmlFor="threshold_c_mode">Mode Threshold Concordance (c)</Label>
                  <select
                    id="threshold_c_mode"
                    name="threshold_c_mode"
                    value={thresholdCMode}
                    onChange={(e) =>
                      setThresholdCMode(e.target.value as "average" | "manual")
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="average">Rata-rata Matriks Concordance (Default)</option>
                    <option value="manual">Manual Override</option>
                  </select>

                  {thresholdCMode === "manual" && (
                    <div className="space-y-1">
                      <Label htmlFor="threshold_c" className="text-xs">
                        Nilai Threshold c (0.0000 - 1.0000)
                      </Label>
                      <Input
                        id="threshold_c"
                        name="threshold_c"
                        type="number"
                        step="0.0001"
                        min="0"
                        max="1"
                        defaultValue={period.threshold_c ?? ""}
                        placeholder="Contoh: 0.6500"
                      />
                    </div>
                  )}
                </div>

                {/* Threshold D */}
                <div className="space-y-3">
                  <Label htmlFor="threshold_d_mode">Mode Threshold Discordance (d)</Label>
                  <select
                    id="threshold_d_mode"
                    name="threshold_d_mode"
                    value={thresholdDMode}
                    onChange={(e) =>
                      setThresholdDMode(e.target.value as "average" | "manual")
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="average">Rata-rata Matriks Discordance (Default)</option>
                    <option value="manual">Manual Override</option>
                  </select>

                  {thresholdDMode === "manual" && (
                    <div className="space-y-1">
                      <Label htmlFor="threshold_d" className="text-xs">
                        Nilai Threshold d (0.0000 - 1.0000)
                      </Label>
                      <Input
                        id="threshold_d"
                        name="threshold_d"
                        type="number"
                        step="0.0001"
                        min="0"
                        max="1"
                        defaultValue={period.threshold_d ?? ""}
                        placeholder="Contoh: 0.4500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tie-breaking Rules info */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm font-semibold">
                Aturan Tie-Breaking (Pemecah Nilai Seri)
              </Label>
              <p className="text-xs text-muted-foreground">
                Jika dua alternatif memiliki skor Net Dominance yang sama, urutan prioritas pemecah seri adalah:
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="p-2 rounded bg-muted border">1. Net Score ELECTRE Tertinggi</span>
                <span className="text-muted-foreground">→</span>
                <span className="p-2 rounded bg-muted border">2. IPK Mahasiswa Tertinggi</span>
                <span className="text-muted-foreground">→</span>
                <span className="p-2 rounded bg-muted border">3. Penghasilan Ortu Terendah</span>
                <span className="text-muted-foreground">→</span>
                <span className="p-2 rounded bg-muted border">4. Waktu Submit Paling Awal</span>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" disabled={savingSettings} className="gap-2">
                {savingSettings ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Simpan Pengaturan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Transitioning Cycle Stage */}
      {nextStep && (
        <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <ArrowRight className="size-5" />
              </div>
              <DialogTitle className="text-center">
                Konfirmasi Peralihan Tahap Periode
              </DialogTitle>
              <DialogDescription className="text-center text-xs sm:text-sm pt-1">
                Anda akan mengubah status periode dari{" "}
                <strong className="text-foreground">{CYCLE_STEPS[currentIdx]?.label}</strong>{" "}
                ke <strong className="text-foreground">{nextStep.label}</strong>.
                {nextStep.key === "open" && (
                  <span className="block mt-2 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200">
                    Perhatian: Saat periode dibuka, bobot kriteria dan skala penilaian akan <strong>DIKUNCI</strong> untuk menjaga keadilan seleksi.
                  </span>
                )}
                {nextStep.key === "calculated" && (
                  <span className="block mt-2 text-primary bg-primary/10 p-2.5 rounded-lg border">
                    Periode akan siap untuk proses pembuatan matriks keputusan dan perhitungan snapshot algoritma ELECTRE I.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {transitionError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {transitionError}
              </div>
            )}

            <DialogFooter className="sm:justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={transitioning}
                onClick={() => setTransitionDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={transitioning}
                onClick={handleTransition}
                className="gap-2 bg-primary"
              >
                {transitioning ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Ya, Lanjutkan ke {nextStep.label}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
