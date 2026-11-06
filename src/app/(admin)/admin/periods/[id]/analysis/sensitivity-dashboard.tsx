"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { SlopeChart, SlopeCandidate } from "./slope-chart"
import { ComparisonTab } from "./comparison-tab"
import {
  calculateElectre,
  ElectreCriterion,
  ElectreAlternative,
} from "@/lib/electre"
import { runElectreCalculationAction } from "@/app/(admin)/admin/periods/actions"
import {
  Sliders,
  RotateCcw,
  Save,
  Activity,
  BarChart3,
  Scale,
} from "lucide-react"

export interface SensitivityDashboardProps {
  period: {
    id: string
    nama: string
    kuota: number
    status: string
    threshold_c_mode: "average" | "manual"
    threshold_c: number | null
    threshold_d_mode: "average" | "manual"
    threshold_d: number | null
    tie_break_rules?: string[]
  }
  officialRun: {
    id: string
    createdAt: string
  } | null
  criteria: Array<{
    id: string
    name: string
    type: "benefit" | "cost"
    weight: number
  }>
  alternatives: Array<{
    id: string
    name: string
    nim: string
    prodi: string
    scores: Record<string, number>
    officialRank: number
    officialPassed: boolean
    officialNetScore: number
    metadata?: {
      ipk?: number
      penghasilan?: number
      submittedAt?: string
    }
  }>
}

export function SensitivityDashboard({
  period,
  officialRun,
  criteria,
  alternatives,
}: SensitivityDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<"sensitivity" | "comparison">("sensitivity")

  // State for criterion weights (starts with official weights)
  const [weights, setWeights] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const c of criteria) {
      initial[c.id] = c.weight
    }
    return initial
  })

  const [isSaving, setIsSaving] = React.useState(false)

  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  // Reset to original weights
  const handleReset = () => {
    const original: Record<string, number> = {}
    for (const c of criteria) {
      original[c.id] = c.weight
    }
    setWeights(original)
    toast.info("Bobot kriteria telah direset ke nilai resmi.")
  }

  // Normalize weights to sum to 100%
  const handleNormalize = () => {
    if (totalWeight <= 0) return
    const normalized: Record<string, number> = {}
    for (const c of criteria) {
      const current = weights[c.id] || 0
      normalized[c.id] = Number(((current / totalWeight) * 100).toFixed(1))
    }
    setWeights(normalized)
    toast.success("Bobot berhasil dinormalisasi otomatis menjadi 100%.")
  }

  // Handle single weight change
  const handleWeightChange = (criteriaId: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [criteriaId]: value,
    }))
  }

  // Real-time ELECTRE recalculation with sensitivity weights
  const sensitivityResult = React.useMemo(() => {
    if (alternatives.length === 0 || criteria.length === 0) {
      return null
    }

    const electreCriteria: ElectreCriterion[] = criteria.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      weight: weights[c.id] || 0,
    }))

    const electreAlternatives: ElectreAlternative[] = alternatives.map((a) => ({
      id: a.id,
      name: a.name,
      scores: a.scores,
      metadata: a.metadata,
    }))

    const tieBreakOrder = period.tie_break_rules || ["ipk", "penghasilan", "waktu_submit"]

    return calculateElectre({
      criteria: electreCriteria,
      alternatives: electreAlternatives,
      thresholds: {
        thresholdCMode: period.threshold_c_mode,
        manualThresholdC: period.threshold_c,
        thresholdDMode: period.threshold_d_mode,
        manualThresholdD: period.threshold_d,
      },
      quota: period.kuota,
      tieBreakOrder,
    })
  }, [criteria, alternatives, weights, period])

  // Build slope chart data
  const slopeCandidates: SlopeCandidate[] = React.useMemo(() => {
    if (!sensitivityResult) return []

    const simRankMap = new Map(sensitivityResult.rankings.map((r) => [r.id, r]))

    return alternatives.map((alt) => {
      const sim = simRankMap.get(alt.id)
      const simRank = sim ? sim.ranking : alt.officialRank
      const simPassed = sim ? sim.passed : alt.officialPassed

      return {
        id: alt.id,
        name: alt.name,
        nim: alt.nim,
        officialRank: alt.officialRank,
        officialPassed: alt.officialPassed,
        simulatedRank: simRank,
        simulatedPassed: simPassed,
        rankDiff: alt.officialRank - simRank, // positive = improved rank
      }
    })
  }, [alternatives, sensitivityResult])

  // Save current sensitivity as a simulation run
  const handleSaveSimulation = async () => {
    try {
      setIsSaving(true)
      const res = await runElectreCalculationAction(period.id, "simulation")
      if (res.success) {
        toast.success("Hasil sensitivitas berhasil disimpan sebagai Run Simulasi.")
      } else {
        toast.error("Gagal menyimpan simulasi: " + res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan simulasi.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!officialRun) {
    return (
      <Card className="border-dashed text-center py-16">
        <CardContent className="space-y-3 max-w-md mx-auto">
          <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Activity className="size-8" />
          </div>
          <CardTitle className="text-xl">Belum Ada Hasil Resmi untuk Dianalisis</CardTitle>
          <CardDescription>
            Analisis sensitivitas membutuhkan hasil kalkulasi resmi (Official Run) sebagai basis
            pembanding. Jalankan kalkulasi resmi terlebih dahulu.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in-50 duration-300">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-foreground">
              Analisis Sensitivitas & Validasi Keputusan
            </h2>
            <Badge variant="outline" className="text-primary border-primary/30 text-[11px]">
              Simulasi Dinamis
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uji ketahanan peringkat penerima beasiswa terhadap variasi bobot kriteria dan bandingkan
            dengan metode SAW & TOPSIS
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("sensitivity")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "sensitivity"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="size-3.5" />
            Sensitivitas Bobot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "comparison"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale className="size-3.5" />
            Validasi Silang (SAW & TOPSIS)
          </button>
        </div>
      </div>

      {activeTab === "sensitivity" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Weight Sliders (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sliders className="size-4 text-primary" />
                      Slider Bobot Kriteria
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Geser bobot untuk mengamati pergeseran peringkat secara langsung
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 px-2 text-xs gap-1 text-muted-foreground"
                  >
                    <RotateCcw className="size-3" />
                    Reset
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Total Weight Indicator */}
                <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
                  <span>Total Bobot Saat Ini:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold text-sm ${
                        Math.round(totalWeight) === 100
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {totalWeight.toFixed(1)}%
                    </span>
                    {Math.round(totalWeight) !== 100 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNormalize}
                        className="h-6 px-2 text-[10px]"
                      >
                        Normalisasi
                      </Button>
                    )}
                  </div>
                </div>

                {/* Individual Sliders */}
                <div className="space-y-4 pt-1">
                  {criteria.map((c) => {
                    const currentWeight = weights[c.id] || 0

                    return (
                      <div key={c.id} className="space-y-1.5 p-2.5 rounded-lg border bg-card">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">{c.name}</span>
                          <span className="font-mono font-bold text-primary">
                            {currentWeight}%
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={currentWeight}
                            onChange={(e) =>
                              handleWeightChange(c.id, parseFloat(e.target.value))
                            }
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{c.type === "benefit" ? "Benefit" : "Cost"}</span>
                          <span>Bobot resmi: {c.weight}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <Button
                    onClick={handleSaveSimulation}
                    disabled={isSaving}
                    className="w-full gap-2 text-xs"
                    variant="outline"
                  >
                    <Save className="size-3.5" />
                    {isSaving ? "Menyimpan Simulasi..." : "Simpan Hasil Simulasi Ini"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                    *Tersimpan sebagai Run Simulasi tanpa mengubah hasil resmi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Slope Chart & Impact (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Grafik Pergeseran Peringkat (Slope Chart)
                </CardTitle>
                <CardDescription className="text-xs">
                  Perbandingan urutan peringkat kandidat antara Hasil Resmi vs Hasil Simulasi Sensitivitas
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <SlopeChart candidates={slopeCandidates} quota={period.kuota} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Comparative Tab (ELECTRE vs SAW vs TOPSIS) */
        <ComparisonTab
          criteria={criteria}
          alternatives={alternatives.map((a) => ({
            id: a.id,
            name: a.name,
            nim: a.nim,
            prodi: a.prodi,
            scores: a.scores,
            electreRank: a.officialRank,
            electrePassed: a.officialPassed,
            electreNetScore: a.officialNetScore,
          }))}
          quota={period.kuota}
        />
      )}
    </div>
  )
}
