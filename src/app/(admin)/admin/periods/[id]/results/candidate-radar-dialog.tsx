"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts"
import { Award, User, BookOpen, TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface CandidateDetailData {
  id: string
  name: string
  nim: string
  prodi: string
  ranking: number
  dominasi: number
  didominasi: number
  netScore: number
  passed: boolean
  scores: Record<string, number>
  rawValues: Record<string, number | null>
  metadata?: {
    ipk?: number
    penghasilan?: number
    submittedAt?: string
  }
}

export interface CriterionInfo {
  id: string
  name: string
  type: "benefit" | "cost"
  weight: number
}

interface CandidateRadarDialogProps {
  candidate: CandidateDetailData | null
  criteria: CriterionInfo[]
  averageScores: Record<string, number>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CandidateRadarDialog({
  candidate,
  criteria,
  averageScores,
  open,
  onOpenChange,
}: CandidateRadarDialogProps) {
  if (!candidate) return null

  // Format radar data
  const radarData = criteria.map((c) => {
    const studentScore = candidate.scores[c.id] ?? 0
    const avgScore = Number((averageScores[c.id] ?? 0).toFixed(2))
    return {
      criterion: c.name.length > 15 ? c.name.slice(0, 15) + "..." : c.name,
      fullCriterionName: c.name,
      "Skor Kandidat": studentScore,
      "Rata-rata": avgScore,
      fullMark: 5,
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold text-xs bg-muted">
                  Peringkat #{candidate.ranking}
                </Badge>
                <StatusBadge status={candidate.passed ? "passed" : "not_passed"} size="sm" />
              </div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <User className="size-5 text-primary" />
                {candidate.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                NIM: {candidate.nim || "-"} • Program Studi: {candidate.prodi || "-"}
              </DialogDescription>
            </div>

            <div className="text-right">
              <div className="text-xs text-muted-foreground">Skor Akhir (Net Score)</div>
              <div className="text-2xl font-black text-primary">
                {candidate.netScore > 0 ? `+${candidate.netScore}` : candidate.netScore}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block">
                Dominasi (E+)
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {candidate.dominasi}
              </span>
              <span className="text-[10px] text-muted-foreground block">kandidat didominasi</span>
            </div>

            <div className="p-3 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-center">
              <span className="text-[11px] font-medium text-rose-800 dark:text-rose-300 block">
                Didominasi (E-)
              </span>
              <span className="text-xl font-bold text-rose-700 dark:text-rose-400">
                {candidate.didominasi}
              </span>
              <span className="text-[10px] text-muted-foreground block">kandidat mengungguli</span>
            </div>

            <div className="p-3 rounded-lg border bg-muted/40 text-center">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Status Kelulusan
              </span>
              <div className="mt-1">
                <StatusBadge status={candidate.passed ? "passed" : "not_passed"} size="sm" />
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {candidate.passed ? "Memenuhi kuota" : "Di luar kuota"}
              </span>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Award className="size-4 text-primary" />
              Visualisasi Radar Profil Kriteria
            </h4>
            <p className="text-xs text-muted-foreground">
              Membandingkan skor konversi kriteria kandidat terhadap nilai rata-rata seluruh pelamar
            </p>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid strokeOpacity={0.25} />
                  <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Skor Kandidat"
                    dataKey="Skor Kandidat"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.35}
                  />
                  <Radar
                    name="Rata-rata Peserta"
                    dataKey="Rata-rata"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.15}
                    strokeDasharray="4 4"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-popover p-2.5 text-xs shadow-md">
                          <p className="font-semibold text-foreground mb-1">
                            {data.fullCriterionName}
                          </p>
                          <div className="space-y-1 text-muted-foreground">
                            <p className="flex justify-between gap-4">
                              <span className="text-emerald-600 font-medium">Skor Kandidat:</span>
                              <span className="font-bold text-foreground">
                                {data["Skor Kandidat"]} / 5
                              </span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-500 font-medium">Rata-rata:</span>
                              <span className="font-bold text-foreground">
                                {data["Rata-rata"]} / 5
                              </span>
                            </p>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              Rincian Penilaian per Kriteria
            </h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-muted-foreground text-left font-medium">
                    <th className="py-2.5 px-3">Kriteria</th>
                    <th className="py-2.5 px-3">Tipe & Bobot</th>
                    <th className="py-2.5 px-3 text-center">Nilai Input</th>
                    <th className="py-2.5 px-3 text-center">Skor Skala</th>
                    <th className="py-2.5 px-3 text-center">Rata-rata</th>
                    <th className="py-2.5 px-3 text-center">Deviasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {criteria.map((c) => {
                    const studentScore = candidate.scores[c.id] ?? 0
                    const avgScore = Number((averageScores[c.id] ?? 0).toFixed(2))
                    const diff = Number((studentScore - avgScore).toFixed(2))
                    const rawVal = candidate.rawValues[c.id]

                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground">{c.name}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={
                                c.type === "benefit"
                                  ? "text-blue-600 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 text-[10px]"
                                  : "text-amber-600 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-[10px]"
                              }
                            >
                              {c.type === "benefit" ? "Benefit" : "Cost"}
                            </Badge>
                            <span className="text-muted-foreground font-mono">{c.weight}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {rawVal !== null && rawVal !== undefined ? rawVal : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-foreground">
                          {studentScore} / 5
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {avgScore}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                              diff > 0
                                ? "text-emerald-600"
                                : diff < 0
                                ? "text-rose-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {diff > 0 ? (
                              <TrendingUp className="size-3" />
                            ) : diff < 0 ? (
                              <TrendingDown className="size-3" />
                            ) : (
                              <Minus className="size-3" />
                            )}
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
