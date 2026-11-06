"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts"
import {
  CandidateDetailData,
  CriterionInfo,
  CandidateRadarDialog,
} from "./candidate-radar-dialog"
import { CandidateComparisonDialog } from "./candidate-comparison-dialog"
import {
  Trophy,
  Users,
  Target,
  CheckCircle,
  Search,
  SlidersHorizontal,
  Radar,
  ArrowUpDown,
  History,
  Sparkles,
  ExternalLink,
  FileSpreadsheet,
  FileText,
} from "lucide-react"

export interface CalculationRunMeta {
  id: string
  tipe: "official" | "simulation"
  created_at: string
  dijalankan_oleh?: string
}

export interface ResultsDashboardProps {
  period: {
    id: string
    nama: string
    kuota: number
    status: string
  }
  runs: CalculationRunMeta[]
  selectedRunId: string
  runData: {
    runId: string
    tipe: "official" | "simulation"
    createdAt: string
    thresholdC: number
    thresholdD: number
    cutoffNetScore: number
    totalPassed: number
    totalApplicants: number
    criteria: CriterionInfo[]
    rankings: CandidateDetailData[]
    averageCriteriaScores: Record<string, number>
    concordanceMatrix?: number[][]
    discordanceMatrix?: number[][]
    aggregateDominanceMatrix?: number[][]
    alternativeIndexMap?: Record<string, number>
  } | null
}

export function ResultsDashboard({
  period,
  runs,
  selectedRunId,
  runData,
}: ResultsDashboardProps) {
  const router = useRouter()

  // State for search and filtering
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "passed" | "not_passed">("all")
  const [topCount, setTopCount] = React.useState<"10" | "20" | "all">("10")

  // State for selected candidates (comparison)
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<string[]>([])

  // Modals state
  const [radarCandidate, setRadarCandidate] = React.useState<CandidateDetailData | null>(null)
  const [isRadarOpen, setIsRadarOpen] = React.useState(false)
  const [isComparisonOpen, setIsComparisonOpen] = React.useState(false)

  // Empty state if no calculation has been run
  if (!runData || runData.rankings.length === 0) {
    return (
      <Card className="border-dashed text-center py-16">
        <CardContent className="space-y-4 max-w-md mx-auto">
          <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Trophy className="size-8" />
          </div>
          <CardTitle className="text-xl">Belum Ada Hasil Perhitungan</CardTitle>
          <CardDescription>
            Kalkulasi ELECTRE I belum dijalankan untuk periode ini. Jalankan perhitungan pada tab
            Kalkulasi ELECTRE untuk melihat perankingan dan visualisasi.
          </CardDescription>
          <Button
            onClick={() => router.push(`/admin/periods/${period.id}/calculate`)}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            Buka Menu Kalkulasi ELECTRE
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Filter rankings for table
  const filteredRankings = runData.rankings.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.prodi.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "passed"
        ? c.passed
        : !c.passed

    return matchesSearch && matchesStatus
  })

  // Data for horizontal bar chart Top N
  const chartLimit =
    topCount === "10" ? 10 : topCount === "20" ? 20 : runData.rankings.length

  const chartData = runData.rankings.slice(0, chartLimit).map((c) => ({
    name: `#${c.ranking} ${c.name.split(" ")[0]}`,
    fullName: c.name,
    nim: c.nim,
    netScore: c.netScore,
    passed: c.passed,
    ranking: c.ranking,
    dominasi: c.dominasi,
    didominasi: c.didominasi,
  }))

  // Handle candidate selection for comparison
  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId)
      } else {
        if (prev.length >= 3) {
          return prev
        }
        return [...prev, candidateId]
      }
    })
  }

  const selectedCandidatesForComparison = runData.rankings.filter((c) =>
    selectedCandidateIds.includes(c.id)
  )

  const openRadarModal = (candidate: CandidateDetailData) => {
    setRadarCandidate(candidate)
    setIsRadarOpen(true)
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in-50 duration-300">
      {/* Run Selector & Mode Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-foreground">
                Hasil Perhitungan ELECTRE I + Net Dominance
              </h2>
              {runData.tipe === "official" ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]">
                  Official Run
                </Badge>
              ) : (
                <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-[11px]">
                  Mode Simulasi
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Snapshot dieksekusi pada{" "}
              {new Date(runData.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Run Switcher Dropdown & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {runs.length > 1 && (
            <div className="flex items-center gap-2 mr-2">
              <History className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Run:</span>
              <select
                value={selectedRunId}
                onChange={(e) =>
                  router.push(`/admin/periods/${period.id}/results?runId=${e.target.value}`)
                }
                className="text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {runs.map((r, idx) => (
                  <option key={r.id} value={r.id}>
                    {r.tipe === "official" ? "[Official]" : "[Simulasi]"} Run #{runs.length - idx} (
                    {new Date(r.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    )
                  </option>
                ))}
              </select>
            </div>
          )}

          <a href={`/api/export/${period.id}/excel`} download>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shadow-2xs">
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </Button>
          </a>

          <a href={`/api/export/${period.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shadow-2xs">
              <FileText className="size-3.5 text-rose-600" />
              <span>SK PDF</span>
            </Button>
          </a>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Peserta Dihitung</span>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-foreground">{runData.totalApplicants}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Seluruh pelamar terverifikasi</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Kuota Beasiswa</span>
            <Trophy className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-primary">{period.kuota}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Penerima berperingkat teratas</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Garis Batas Lolos</span>
            <Target className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-emerald-600">
              {runData.cutoffNetScore > 0
                ? `+${runData.cutoffNetScore}`
                : runData.cutoffNetScore}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Skor net peringkat #{period.kuota}</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Rasio Kelulusan</span>
            <CheckCircle className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-blue-600">
              {runData.totalApplicants > 0
                ? ((runData.totalPassed / runData.totalApplicants) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {runData.totalPassed} dari {runData.totalApplicants} pelamar lolos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart Top N */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              Grafik Ranking Net Dominance (Top {chartLimit})
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi skor bersih (Net Dominance = E+ − E−) dengan garis batas kuota kelulusan
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tampilkan:</span>
            <div className="inline-flex rounded-lg border bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTopCount("10")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  topCount === "10"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => setTopCount("20")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  topCount === "20"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Top 20
              </button>
              <button
                type="button"
                onClick={() => setTopCount("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  topCount === "all"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua ({runData.rankings.length})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-popover p-2.5 text-xs shadow-md">
                        <p className="font-bold text-foreground">
                          #{data.ranking} {data.fullName}
                        </p>
                        <p className="text-muted-foreground text-[10px] mb-1.5">
                          NIM: {data.nim || "-"}
                        </p>
                        <div className="space-y-1 text-muted-foreground">
                          <p className="flex justify-between gap-3">
                            <span>Dominasi (E+):</span>
                            <span className="font-bold text-emerald-600">{data.dominasi}</span>
                          </p>
                          <p className="flex justify-between gap-3">
                            <span>Didominasi (E−):</span>
                            <span className="font-bold text-rose-600">{data.didominasi}</span>
                          </p>
                          <p className="flex justify-between gap-3 border-t pt-1 font-semibold text-foreground">
                            <span>Skor Bersih:</span>
                            <span>{data.netScore > 0 ? `+${data.netScore}` : data.netScore}</span>
                          </p>
                          <p className="flex justify-between gap-3 pt-0.5">
                            <span>Status:</span>
                            <span
                              className={`font-bold ${
                                data.passed ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {data.passed ? "Lolos Kuota" : "Tidak Lolos"}
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  }}
                />
                <ReferenceLine
                  x={runData.cutoffNetScore}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `Batas Kuota (${runData.cutoffNetScore})`,
                    fill: "#ef4444",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Bar dataKey="netScore" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.passed ? "#10b981" : "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-4 border-t gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-xs bg-[#10b981]" />
                Lolos Kuota (Peringkat 1 s/d {period.kuota})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-xs bg-[#94a3b8]" />
                Tidak Lolos Kuota
              </span>
            </div>
            <span className="text-[11px] italic">
              *Klik nama atau baris pada tabel di bawah untuk melihat analisis radar kriteria.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">Tabel Peringkat Lengkap</CardTitle>
            <CardDescription className="text-xs">
              Daftar pelamar yang diurutkan berdasarkan Net Dominance dan aturan tie-break
            </CardDescription>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIM, prodi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>

            <div className="inline-flex rounded-lg border bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === "all"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua ({runData.rankings.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("passed")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === "passed"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Lolos ({runData.totalPassed})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("not_passed")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === "not_passed"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tidak Lolos ({runData.totalApplicants - runData.totalPassed})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b">
                <tr className="text-muted-foreground text-left font-medium">
                  <th className="py-2.5 px-3 w-10 text-center">Pilih</th>
                  <th className="py-2.5 px-3 w-16 text-center">
                    <span className="flex items-center justify-center gap-1">
                      Rank <ArrowUpDown className="size-3" />
                    </span>
                  </th>
                  <th className="py-2.5 px-3">Nama Pelamar</th>
                  <th className="py-2.5 px-3">Program Studi</th>
                  <th className="py-2.5 px-3 text-center">Dominasi (E+)</th>
                  <th className="py-2.5 px-3 text-center">Didominasi (E−)</th>
                  <th className="py-2.5 px-3 text-center">Net Score</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRankings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada pelamar yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRankings.map((cand) => {
                    const isSelected = selectedCandidateIds.includes(cand.id)

                    return (
                      <tr
                        key={cand.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCandidateSelection(cand.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary size-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {cand.ranking <= 3 ? (
                            <span
                              className={`inline-flex items-center justify-center size-6 rounded-full text-white text-[10px] font-black ${
                                cand.ranking === 1
                                  ? "bg-amber-500 shadow-xs"
                                  : cand.ranking === 2
                                  ? "bg-slate-400"
                                  : "bg-amber-700"
                              }`}
                            >
                              {cand.ranking}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">
                              #{cand.ranking}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => openRadarModal(cand)}
                            className="font-semibold text-foreground hover:text-primary transition-colors text-left"
                          >
                            {cand.name}
                          </button>
                          <div className="text-[10px] text-muted-foreground">
                            NIM: {cand.nim || "-"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {cand.prodi || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                          {cand.dominasi}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                          {cand.didominasi}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-foreground">
                          {cand.netScore > 0 ? `+${cand.netScore}` : cand.netScore}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge
                            status={cand.passed ? "passed" : "not_passed"}
                            size="sm"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRadarModal(cand)}
                            className="h-7 px-2 text-[11px] gap-1"
                          >
                            <Radar className="size-3 text-primary" />
                            Radar
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Bar for Side-by-Side Comparison */}
      {selectedCandidateIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background px-4 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium">
              <b>{selectedCandidateIds.length}</b> dari maks 3 pelamar dipilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={selectedCandidateIds.length < 2}
              onClick={() => setIsComparisonOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-semibold rounded-full px-4 gap-1.5"
            >
              <ExternalLink className="size-3" />
              Bandingkan Berdampingan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCandidateIds([])}
              className="text-xs h-8 text-background/80 hover:text-background hover:bg-background/10 rounded-full px-3"
            >
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Radar Dialog */}
      <CandidateRadarDialog
        candidate={radarCandidate}
        criteria={runData.criteria}
        averageScores={runData.averageCriteriaScores}
        open={isRadarOpen}
        onOpenChange={setIsRadarOpen}
      />

      {/* Comparison Dialog */}
      <CandidateComparisonDialog
        candidates={selectedCandidatesForComparison}
        criteria={runData.criteria}
        open={isComparisonOpen}
        onOpenChange={setIsComparisonOpen}
        thresholdC={runData.thresholdC}
        thresholdD={runData.thresholdD}
        concordanceMatrix={runData.concordanceMatrix}
        discordanceMatrix={runData.discordanceMatrix}
        aggregateDominanceMatrix={runData.aggregateDominanceMatrix}
        alternativeIndexMap={runData.alternativeIndexMap}
      />
    </div>
  )
}
