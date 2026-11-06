"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calculator,
  Play,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MatrixStep, AlternativeRankingResult } from "@/lib/electre"
import { runElectreCalculationAction } from "@/app/(admin)/admin/periods/actions"

interface CalculationStepperProps {
  periodId: string
  periodStatus: string
  quota: number
  verifiedApplicantsCount: number
  criteriaCount: number
  totalWeight: number
  existingRun: {
    id: string
    tipe: "official" | "simulation"
    created_at: string
    hasil_matriks: {
      decisionMatrix: MatrixStep
      normalizedMatrix: MatrixStep
      weightedMatrix: MatrixStep
      concordanceMatrix: MatrixStep
      discordanceMatrix: MatrixStep
      concordanceDominanceMatrix: MatrixStep<number>
      discordanceDominanceMatrix: MatrixStep<number>
      aggregateDominanceMatrix: MatrixStep<number>
    }
    snapshot_threshold: {
      c_mode: string
      threshold_c: number
      d_mode: string
      threshold_d: number
    }
    rankings: AlternativeRankingResult[]
  } | null
}

const STEPS = [
  {
    num: 1,
    title: "Matriks Keputusan (X)",
    short: "Matriks X",
    desc: "Matriks awal berukuran (m x n) berisi skor terstandarisasi alternatif berdasarkan skala penilaian kriteria.",
  },
  {
    num: 2,
    title: "Matriks Normalisasi (R)",
    short: "Normalisasi R",
    desc: "Normalisasi vektor r_ij = x_ij / √(Σ x_kj²) untuk menyelaraskan skala pengukuran antar-kriteria.",
  },
  {
    num: 3,
    title: "Matriks Terbobot (V)",
    short: "Terbobot V",
    desc: "Matriks v_ij = w_j × r_ij yang mengalikan nilai ternormalisasi dengan bobot kepentingan kriteria.",
  },
  {
    num: 4,
    title: "Matriks Concordance (C)",
    short: "Concordance C",
    desc: "Menghitung derajat kesepakatan bahwa alternatif k lebih unggul atau setara dibanding alternatif l.",
  },
  {
    num: 5,
    title: "Matriks Discordance (D)",
    short: "Discordance D",
    desc: "Menghitung derajat ketidaksepakatan / penolakan dominasi alternatif k terhadap alternatif l.",
  },
  {
    num: 6,
    title: "Threshold Nilai Batas (c & d)",
    short: "Threshold c & d",
    desc: "Nilai ambang batas rata-rata elemen di luar diagonal untuk menentukan dominasi concordance dan discordance.",
  },
  {
    num: 7,
    title: "Matriks Dominan (F & G)",
    short: "Dominan F & G",
    desc: "Matriks biner (0/1): F_kl = 1 jika C_kl ≥ c, dan G_kl = 1 jika D_kl ≤ d (ketidaksepakatan di bawah ambang).",
  },
  {
    num: 8,
    title: "Agregat Dominasi (E = F × G)",
    short: "Agregat E",
    desc: "Perkalian elemen biner E_kl = F_kl × G_kl. Bernilai 1 jika alternatif k secara absolut mendominasi alternatif l.",
  },
  {
    num: 9,
    title: "Ranking Net Dominance & Tie-Break",
    short: "Hasil Ranking",
    desc: "Peringkat akhir dihitung dari Net Score (Jumlah Mendominasi − Jumlah Didominasi) beserta aturan tie-break.",
  },
]

export function CalculationStepper({
  periodId,
  quota,
  verifiedApplicantsCount,
  criteriaCount,
  totalWeight,
  existingRun,
}: CalculationStepperProps) {
  const router = useRouter()

  const [activeStep, setActiveStep] = React.useState(1)
  const [calculationData, setCalculationData] = React.useState(existingRun)

  // Simulation mode flag
  const [isSimulation, setIsSimulation] = React.useState(
    existingRun?.tipe === "simulation"
  )

  // Confirmation dialogs
  const [officialDialogOpen, setOfficialDialogOpen] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [runError, setRunError] = React.useState<string | null>(null)

  // Handler: Run calculation
  const handleRunCalculation = async (type: "official" | "simulation") => {
    setRunning(true)
    setRunError(null)

    const res = await runElectreCalculationAction(periodId, type)
    setRunning(false)

    if (res.success && res.data) {
      setOfficialDialogOpen(false)
      setIsSimulation(type === "simulation")

      const r = res.data.result
      setCalculationData({
        id: res.data.runId,
        tipe: type,
        created_at: new Date().toISOString(),
        hasil_matriks: {
          decisionMatrix: r.decisionMatrix,
          normalizedMatrix: r.normalizedMatrix,
          weightedMatrix: r.weightedMatrix,
          concordanceMatrix: r.concordanceMatrix,
          discordanceMatrix: r.discordanceMatrix,
          concordanceDominanceMatrix: r.concordanceDominanceMatrix,
          discordanceDominanceMatrix: r.discordanceDominanceMatrix,
          aggregateDominanceMatrix: r.aggregateDominanceMatrix,
        },
        snapshot_threshold: {
          c_mode: "average",
          threshold_c: r.thresholdC,
          d_mode: "average",
          threshold_d: r.thresholdD,
        },
        rankings: r.rankings,
      })

      router.refresh()
    } else {
      setRunError(res.error || "Gagal menjalankan perhitungan ELECTRE.")
    }
  }

  // Helper to render Heatmap Matrix Table
  const renderMatrixTable = (
    stepData: MatrixStep<number> | undefined,
    type: "plain" | "concordance" | "discordance" | "aggregate" = "plain"
  ) => {
    if (!stepData || !stepData.matrix || stepData.matrix.length === 0) {
      return (
        <div className="p-8 text-center text-xs text-muted-foreground italic">
          Data matriks belum tersedia. Silakan jalankan perhitungan terlebih dahulu.
        </div>
      )
    }

    return (
      <div className="overflow-x-auto border rounded-xl bg-background shadow-2xs">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="p-3 text-left font-semibold text-muted-foreground border-r whitespace-nowrap min-w-[160px]">
                Alternatif \ Kriteria
              </th>
              {stepData.headers.map((h, i) => (
                <th
                  key={i}
                  className="p-3 text-center font-semibold text-muted-foreground border-r last:border-r-0 whitespace-nowrap min-w-[90px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y font-mono">
            {stepData.matrix.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/10 transition-colors">
                <td className="p-3 font-sans font-semibold text-foreground border-r bg-muted/10 whitespace-nowrap">
                  {stepData.rowLabels[rIdx]}
                </td>
                {row.map((val, cIdx) => {
                  const isDiag = rIdx === cIdx

                  // Heatmap coloring logic
                  let cellBg = ""
                  if (type === "aggregate") {
                    if (val === 1) cellBg = "bg-emerald-100 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-300"
                    else if (isDiag) cellBg = "bg-muted/40 text-muted-foreground/40"
                  } else if (type === "concordance") {
                    if (!isDiag && val > 0.5) cellBg = "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold"
                    else if (isDiag) cellBg = "bg-muted/40 text-muted-foreground/40"
                  } else if (type === "discordance") {
                    if (!isDiag && val > 0.5) cellBg = "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold"
                    else if (isDiag) cellBg = "bg-muted/40 text-muted-foreground/40"
                  }

                  return (
                    <td
                      key={cIdx}
                      className={`p-3 text-center border-r last:border-r-0 ${cellBg}`}
                    >
                      {isDiag ? "-" : typeof val === "number" ? val.toFixed(4) : val}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Simulation Banner */}
      {isSimulation && (
        <div className="p-4 rounded-xl border border-purple-300 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-800 flex items-start gap-3">
          <FlaskConical className="size-5 text-purple-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
              Mode Simulasi Aktif
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Data yang tampil saat ini adalah hasil simulasi pengujian dan <strong>TIDAK MENGUBAH</strong> hasil resmi maupun status kelulusan mahasiswa.
            </p>
          </div>
        </div>
      )}

      {/* Action Header Card */}
      <Card className="shadow-xs border-primary/20">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Mesin SPK ELECTRE I
                </span>
                {calculationData ? (
                  <Badge variant={isSimulation ? "secondary" : "default"}>
                    {isSimulation ? "Hasil Simulasi" : "Snapshot Resmi"}
                  </Badge>
                ) : (
                  <Badge variant="outline">Belum Dihitung</Badge>
                )}
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold mt-0.5">
                Kalkulasi Matriks & Ranking Net Dominance
              </CardTitle>
              <CardDescription>
                Tersedia {verifiedApplicantsCount} pelamar terverifikasi dan {criteriaCount} kriteria (Total bobot {totalWeight}%)
              </CardDescription>
            </div>

            {/* Run Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={running || verifiedApplicantsCount === 0}
                onClick={() => handleRunCalculation("simulation")}
                className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300"
              >
                {running ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FlaskConical className="size-3.5" />
                )}
                Jalankan Simulasi
              </Button>

              <Button
                size="sm"
                disabled={running || verifiedApplicantsCount === 0}
                onClick={() => setOfficialDialogOpen(true)}
                className="gap-2 bg-primary font-semibold shadow-xs"
              >
                <Play className="size-3.5" />
                Jalankan Perhitungan Resmi
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Stepper Navigation bar */}
        <CardContent className="pt-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar pb-2">
            {STEPS.map((s) => {
              const isCurrent = activeStep === s.num
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-[10px] size-4 rounded-full bg-background/20 flex items-center justify-center font-bold">
                    {s.num}
                  </span>
                  <span>{s.short}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card className="shadow-xs border-border">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Calculator className="size-4" />
            <span>Langkah {activeStep} dari 9</span>
          </div>
          <CardTitle className="text-base sm:text-lg font-bold">
            {STEPS[activeStep - 1].title}
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            {STEPS[activeStep - 1].desc}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* STEP 1: X */}
          {activeStep === 1 && renderMatrixTable(calculationData?.hasil_matriks?.decisionMatrix)}

          {/* STEP 2: R */}
          {activeStep === 2 && renderMatrixTable(calculationData?.hasil_matriks?.normalizedMatrix)}

          {/* STEP 3: V */}
          {activeStep === 3 && renderMatrixTable(calculationData?.hasil_matriks?.weightedMatrix)}

          {/* STEP 4: C (Heatmap) */}
          {activeStep === 4 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-3 rounded bg-blue-100 border border-blue-200 inline-block" />
                <span>Biru menandakan nilai concordance tinggi (&gt; 0.5)</span>
              </div>
              {renderMatrixTable(calculationData?.hasil_matriks?.concordanceMatrix, "concordance")}
            </div>
          )}

          {/* STEP 5: D (Heatmap) */}
          {activeStep === 5 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-3 rounded bg-amber-100 border border-amber-200 inline-block" />
                <span>Oranye menandakan nilai discordance tinggi (&gt; 0.5)</span>
              </div>
              {renderMatrixTable(calculationData?.hasil_matriks?.discordanceMatrix, "discordance")}
            </div>
          )}

          {/* STEP 6: Threshold c & d */}
          {activeStep === 6 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border bg-card space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Threshold Concordance (c)
                </span>
                <div className="text-3xl font-extrabold text-primary font-mono">
                  {calculationData?.snapshot_threshold?.threshold_c?.toFixed(4) ?? "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rata-rata elemen matriks C di luar diagonal utama. Pasangan alternatif dengan C_kl ≥ c dianggap dominan concordance.
                </p>
              </div>

              <div className="p-5 rounded-xl border bg-card space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Threshold Discordance (d)
                </span>
                <div className="text-3xl font-extrabold text-primary font-mono">
                  {calculationData?.snapshot_threshold?.threshold_d?.toFixed(4) ?? "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rata-rata elemen matriks D di luar diagonal utama. Pasangan alternatif dengan D_kl ≤ d dianggap lolos toleransi discordance.
                </p>
              </div>
            </div>
          )}

          {/* STEP 7: Dominance F & G */}
          {activeStep === 7 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Matriks Dominan Concordance (F)
                </h4>
                {renderMatrixTable(calculationData?.hasil_matriks?.concordanceDominanceMatrix)}
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Matriks Dominan Discordance (G)
                </h4>
                {renderMatrixTable(calculationData?.hasil_matriks?.discordanceDominanceMatrix)}
              </div>
            </div>
          )}

          {/* STEP 8: Aggregate E (Heatmap) */}
          {activeStep === 8 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-3 rounded bg-emerald-200 border border-emerald-300 inline-block" />
                <span>Hijau bernilai 1: Alternatif baris mendominasi alternatif kolom secara mutlak</span>
              </div>
              {renderMatrixTable(calculationData?.hasil_matriks?.aggregateDominanceMatrix, "aggregate")}
            </div>
          )}

          {/* STEP 9: Rankings & Tie-Break */}
          {activeStep === 9 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Kuota Penerima Beasiswa: <strong>{quota} Mahasiswa</strong></span>
                <span>Urutan Tie-break: Net Score → IPK → Penghasilan → Waktu Submit</span>
              </div>

              {calculationData?.rankings && calculationData.rankings.length > 0 ? (
                <div className="border rounded-xl overflow-hidden bg-background">
                  <div className="grid grid-cols-12 bg-muted/40 p-3 text-[11px] font-semibold text-muted-foreground uppercase border-b">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-4">Nama Mahasiswa</div>
                    <div className="col-span-2 text-center">Dominasi (+)</div>
                    <div className="col-span-2 text-center">Didominasi (-)</div>
                    <div className="col-span-1 text-center">Net Score</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>

                  <div className="divide-y text-xs">
                    {calculationData.rankings.map((r) => (
                      <div
                        key={r.id}
                        className={`grid grid-cols-12 p-3 items-center hover:bg-muted/10 transition-colors ${
                          r.passed
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                            : ""
                        }`}
                      >
                        <div className="col-span-1 text-center font-bold font-mono">
                          #{r.ranking}
                        </div>
                        <div className="col-span-4 min-w-0">
                          <span className="font-semibold text-foreground block truncate">
                            {r.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            IPK: {r.tieBreakDetails.ipk ?? "-"} • Ortu:{" "}
                            {r.tieBreakDetails.penghasilan
                              ? `Rp ${r.tieBreakDetails.penghasilan.toLocaleString("id-ID")}`
                              : "-"}
                          </span>
                        </div>
                        <div className="col-span-2 text-center font-mono font-semibold text-emerald-600">
                          +{r.dominasi}
                        </div>
                        <div className="col-span-2 text-center font-mono font-semibold text-rose-600">
                          -{r.didominasi}
                        </div>
                        <div className="col-span-1 text-center font-mono font-bold text-primary">
                          {r.netScore}
                        </div>
                        <div className="col-span-2 text-right">
                          {r.passed ? (
                            <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                              <Trophy className="size-3" /> Lolos
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-medium text-xs">
                              Tidak Lolos
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  Belum ada hasil kalkulasi untuk ditampilkan.
                </div>
              )}
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={activeStep === 1}
              onClick={() => setActiveStep((p) => Math.max(p - 1, 1))}
              className="gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              Langkah Sebelumnya
            </Button>

            <Button
              size="sm"
              disabled={activeStep === 9}
              onClick={() => setActiveStep((p) => Math.min(p + 1, 9))}
              className="gap-1.5"
            >
              Langkah Berikutnya
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog: Run Official Calculation */}
      <Dialog open={officialDialogOpen} onOpenChange={setOfficialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Sparkles className="size-5" />
            </div>
            <DialogTitle className="text-center">
              Jalankan Perhitungan Resmi ELECTRE I
            </DialogTitle>
            <DialogDescription className="text-center text-xs pt-1 leading-relaxed">
              Kalkulasi resmi akan mengunci snapshot matriks penilaian dan memperbarui ranking final penerima beasiswa sesuai kuota periode.
            </DialogDescription>
          </DialogHeader>

          {/* Parameters summary */}
          <div className="p-3.5 rounded-xl bg-muted/40 border text-xs space-y-2">
            <h5 className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
              Ringkasan Parameter Seleksi:
            </h5>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>Jumlah Pelamar Terverifikasi: <strong>{verifiedApplicantsCount} Mahasiswa</strong></div>
              <div>Jumlah Kriteria Penilaian: <strong>{criteriaCount} Kriteria</strong></div>
              <div>Akumulasi Bobot: <strong>{totalWeight.toFixed(2)}%</strong></div>
              <div>Kuota Penerima: <strong>{quota} Mahasiswa</strong></div>
            </div>
          </div>

          {runError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
              {runError}
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={running}
              onClick={() => setOfficialDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={running}
              onClick={() => handleRunCalculation("official")}
              className="gap-2 bg-primary font-semibold"
            >
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menghitung Matriks...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Mulai Perhitungan Resmi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
