"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts"
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Clock,
  HeartHandshake,
  FileCheck,
  GraduationCap,
  Scale,
  Award,
} from "lucide-react"

export interface StudentResultViewProps {
  period: {
    id: string
    nama: string
    status: string
    kuota: number
    tie_break_rules?: string[]
  }
  student: {
    nama: string
    nim: string
    prodi: string
  }
  application: {
    status: string
    submitted_at: string | null
    catatan_admin?: string | null
  }
  result: {
    lolos: boolean
    netScore: number
    cutoffScore: number
    criteria: Array<{
      id: string
      name: string
      type: "benefit" | "cost"
      weight: number
      rawScore: number | null
      scaleScore: number
      scaleLabel?: string
    }>
  } | null
}

export function StudentResultView({
  period,
  student,
  application,
  result,
}: StudentResultViewProps) {
  // If period is not published yet
  if (period.status !== "published") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-xs mb-2">
            <ArrowLeft className="size-3.5" />
            Kembali ke Dashboard
          </Button>
        </Link>

        <Card className="border-primary/20 shadow-sm overflow-hidden text-center py-10 px-6">
          <CardContent className="space-y-5">
            <div className="size-16 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="size-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30">
                Tahap Penilaian Berlangsung
              </Badge>
              <CardTitle className="text-xl sm:text-2xl font-bold">
                Pengumuman Hasil Belum Dibuka
              </CardTitle>
              <CardDescription className="max-w-md mx-auto text-sm">
                Panitia seleksi saat ini sedang memproses verifikasi berkas dan perhitungan
                multikriteria untuk periode <b>{period.nama}</b>.
              </CardDescription>
            </div>

            <div className="p-4 rounded-xl border bg-muted/30 max-w-md mx-auto text-left text-xs space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="size-4 text-primary" />
                Informasi untuk Anda:
              </p>
              <p className="text-muted-foreground">
                Pengumuman resmi kelulusan penerima beasiswa akan dipublikasikan secara serentak
                pada portal ini setelah seluruh tahapan seleksi disetujui pimpinan.
              </p>
            </div>

            <Link href="/dashboard">
              <Button className="mt-2">Kembali ke Beranda</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If application was rejected during verification
  if (application.status === "rejected") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-xs mb-2">
            <ArrowLeft className="size-3.5" />
            Kembali ke Dashboard
          </Button>
        </Link>

        <Card className="border-rose-200 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-rose-800 dark:text-rose-300">
                  Pendaftaran Tidak Memenuhi Syarat Verifikasi
                </CardTitle>
                <CardDescription className="text-xs">
                  Periode: {period.nama}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Mohon maaf, berkas pendaftaran Anda tidak lolos tahap verifikasi dokumen administrasi
              sehingga belum dapat diikutsertakan dalam perankingan akhir beasiswa.
            </p>

            {application.catatan_admin && (
              <div className="p-4 rounded-xl border border-rose-200 bg-background space-y-1">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-400 block">
                  Catatan dari Panitia Verifikator:
                </span>
                <p className="text-foreground text-xs leading-relaxed">
                  {application.catatan_admin}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Link href="/dashboard">
                <Button variant="outline">Kembali ke Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no result object found
  if (!result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card className="text-center py-12 px-4">
          <CardTitle className="text-lg">Data Hasil Seleksi Tidak Tersedia</CardTitle>
          <CardDescription className="mt-2 text-xs">
            Data penilaian Anda belum tercatat pada periode seleksi ini.
          </CardDescription>
          <Link href="/dashboard">
            <Button className="mt-4" size="sm">
              Kembali ke Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const isPassed = result.lolos
  const netScore = result.netScore
  const cutoffScore = result.cutoffScore

  // Format radar data for student's own scores
  const radarData = result.criteria.map((c) => ({
    criterion: c.name.length > 15 ? c.name.slice(0, 15) + "..." : c.name,
    fullCriterionName: c.name,
    "Skor Anda": c.scaleScore,
    fullMark: 5,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 animate-in fade-in-50 duration-300">
      {/* Back button */}
      <div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="size-3.5" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>

      {/* Hero Announcement Card */}
      {isPassed ? (
        <Card className="border-emerald-300 dark:border-emerald-800 bg-gradient-to-b from-emerald-50/70 via-background to-card dark:from-emerald-950/30 overflow-hidden shadow-md">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <Trophy className="size-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] font-bold">
                      LOLOS SELEKSI
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="size-3 text-amber-500" />
                      Hasil Resmi
                    </span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-black text-foreground mt-1">
                    Selamat, {student.nama}!
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    NIM: {student.nim} • {student.prodi}
                  </CardDescription>
                </div>
              </div>

              <div className="bg-background/80 backdrop-blur-xs p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center sm:text-right shrink-0">
                <span className="text-[11px] text-muted-foreground block">Skor Akhir Anda</span>
                <span className="text-2xl font-black text-emerald-600">
                  {netScore > 0 ? `+${netScore}` : netScore}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">
                  Memenuhi Batas Kuota ({cutoffScore})
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Berdasarkan evaluasi menyeluruh metode ELECTRE I terhadap seluruh kriteria penilaian, Anda
              berhasil meraih posisi dalam kuota penerima beasiswa sebanyak <b>{period.kuota} mahasiswa</b>{" "}
              untuk <b>{period.nama}</b>.
            </p>

            {/* Next Steps Card */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Petunjuk Langkah Selanjutnya:
              </h4>
              <ul className="space-y-2 text-xs text-emerald-950 dark:text-emerald-200">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 mt-0.5">1.</span>
                  <span>
                    Pastikan nomor kontak dan email aktif Anda di sistem selalu dapat dihubungi.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 mt-0.5">2.</span>
                  <span>
                    Bawa dokumen fisik asli (Transkrip, KTP, KK, Slip Gaji) ke Bagian Kemahasiswaan
                    untuk pencocokan data paling lambat 7 hari kerja.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 mt-0.5">3.</span>
                  <span>
                    Penandatanganan Surat Perjanjian Kontrak (SPK) Penerima Beasiswa akan
                    dijadwalkan kemudian.
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-300 dark:border-slate-800 bg-gradient-to-b from-slate-50/70 via-background to-card dark:from-slate-900/30 overflow-hidden shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-xs shrink-0">
                  <HeartHandshake className="size-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                      BELUM LOLOS KUOTA
                    </Badge>
                    <span className="text-xs text-muted-foreground">Hasil Resmi</span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-black text-foreground mt-1">
                    Terima Kasih, {student.nama}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    NIM: {student.nim} • {student.prodi}
                  </CardDescription>
                </div>
              </div>

              <div className="bg-background/80 backdrop-blur-xs p-3 rounded-xl border text-center sm:text-right shrink-0">
                <span className="text-[11px] text-muted-foreground block">Skor Akhir Anda</span>
                <span className="text-2xl font-black text-slate-700 dark:text-slate-300">
                  {netScore > 0 ? `+${netScore}` : netScore}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block">
                  Batas Kelulusan ({cutoffScore})
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            <p className="text-sm text-foreground/90 leading-relaxed">
              Terima kasih atas dedikasi dan partisipasi Anda dalam <b>{period.nama}</b>. Karena
              keterbatasan kuota penerima sebanyak <b>{period.kuota} mahasiswa</b>, saat ini Anda
              belum berhasil masuk ke dalam kuota terpilih.
            </p>

            <div className="p-4 rounded-xl border bg-muted/40 space-y-2 text-xs">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" />
                Pesan untuk Anda:
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Tetap semangat dan terus pertahankan prestasi akademik Anda. Masih banyak peluang
                beasiswa dan program bantuan akademik lainnya pada semester mendatang. Jadikan hasil
                ini sebagai motivasi untuk terus berkembang.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Score Position Bar */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Scale className="size-4 text-primary" />
            Posisi Skor Akhir Terhadap Batas Kelulusan
          </CardTitle>
          <CardDescription className="text-xs">
            Perbandingan skor akhir Anda terhadap batas nilai minimal kuota penerima beasiswa
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary" />
                Skor Akhir Anda: <b className="text-foreground text-sm">{netScore > 0 ? `+${netScore}` : netScore}</b>
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full bg-amber-500" />
                Batas Lolos Kuota: <b className="text-foreground text-sm">{cutoffScore > 0 ? `+${cutoffScore}` : cutoffScore}</b>
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="relative pt-2 pb-6">
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all ${
                    isPassed ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(15, ((netScore + 10) / (Math.max(cutoffScore, netScore, 5) + 15)) * 100)
                    )}%`,
                  }}
                />
              </div>

              {/* Status note */}
              <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-2">
                <span>Skor Relatif Rendah</span>
                <span className="font-semibold text-foreground">
                  {isPassed
                    ? `Melampaui batas kuota sebesar ${netScore - cutoffScore} poin`
                    : `Berjarak ${cutoffScore - netScore} poin dari batas kuota`}
                </span>
                <span>Skor Relatif Unggul</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart (Kriteria Pribadi) */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="size-4 text-primary" />
            Diagram Radar Profil Penilaian Anda
          </CardTitle>
          <CardDescription className="text-xs">
            Grafik keseimbangan capaian Anda pada setiap kriteria yang dinilai (skala 1 - 5)
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid strokeOpacity={0.25} />
                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                <Radar
                  name="Skor Anda"
                  dataKey="Skor Anda"
                  stroke={isPassed ? "#10b981" : "#6366f1"}
                  fill={isPassed ? "#10b981" : "#6366f1"}
                  fillOpacity={0.4}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
                        <p className="font-bold text-foreground">{data.fullCriterionName}</p>
                        <p className="text-primary font-semibold mt-1">
                          Skor Skala: {data["Skor Anda"]} / 5
                        </p>
                      </div>
                    )
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Plain Language Criterion Cards */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Rincian Evaluasi per Kriteria</h3>
          <p className="text-xs text-muted-foreground">
            Penjelasan capaian Anda pada masing-masing indikator seleksi
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.criteria.map((c) => {
            const scoreLabel =
              c.scaleScore >= 5
                ? "Sangat Unggul"
                : c.scaleScore >= 4
                ? "Baik"
                : c.scaleScore >= 3
                ? "Cukup"
                : "Perlu Peningkatan"

            const badgeColor =
              c.scaleScore >= 4
                ? "text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                : c.scaleScore >= 3
                ? "text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/20"
                : "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/20"

            return (
              <div
                key={c.id}
                className="p-4 rounded-xl border bg-card space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground line-clamp-1">{c.name}</span>
                  <Badge variant="outline" className={`text-[10px] ${badgeColor}`}>
                    {scoreLabel}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t text-muted-foreground">
                  <span>Bobot Kriteria: <b>{c.weight}%</b></span>
                  <span>
                    Skor: <b className="text-foreground text-sm">{c.scaleScore}</b> / 5
                  </span>
                </div>

                {c.rawScore !== null && c.rawScore !== undefined && (
                  <p className="text-[11px] text-muted-foreground">
                    Nilai tercatat: <span className="font-mono font-medium text-foreground">{c.rawScore}</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tie-breaking Policy Info */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <FileCheck className="size-4 text-primary" />
            Transparansi Penentuan Urutan Seleksi (Tie-Breaking Rule)
          </div>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            Sistem seleksi beasiswa menggunakan metode perankingan Net Dominance secara adil dan
            objektif. Apabila terdapat pelamar dengan skor akhir yang sama pada batas kuota,
            penentuan urutan dilakukan secara bertingkat berdasarkan: (1) Capaian IPK tertinggi, (2)
            Penghasilan orang tua terendah (skala prioritas kebutuhan), dan (3) Waktu submit
            formulir yang lebih awal.
          </p>
        </CardContent>
      </Card>

      {/* Bottom actions */}
      <div className="pt-4 border-t flex justify-center">
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Kembali ke Dashboard Mahasiswa
          </Button>
        </Link>
      </div>
    </div>
  )
}
