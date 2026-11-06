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
import { CandidateDetailData, CriterionInfo } from "./candidate-radar-dialog"
import { ArrowRight, CheckCircle2, XCircle, HelpCircle } from "lucide-react"

interface CandidateComparisonDialogProps {
  candidates: CandidateDetailData[]
  criteria: CriterionInfo[]
  open: boolean
  onOpenChange: (open: boolean) => void
  thresholdC: number
  thresholdD: number
  concordanceMatrix?: number[][]
  discordanceMatrix?: number[][]
  aggregateDominanceMatrix?: number[][]
  alternativeIndexMap?: Record<string, number>
}

export function CandidateComparisonDialog({
  candidates,
  criteria,
  open,
  onOpenChange,
  thresholdC,
  thresholdD,
  concordanceMatrix,
  discordanceMatrix,
  aggregateDominanceMatrix,
  alternativeIndexMap = {},
}: CandidateComparisonDialogProps) {
  if (candidates.length < 2) return null

  // Pairwise dominance calculation
  const getPairwiseRelation = (candA: CandidateDetailData, candB: CandidateDetailData) => {
    const idxA = alternativeIndexMap[candA.id]
    const idxB = alternativeIndexMap[candB.id]

    if (
      idxA === undefined ||
      idxB === undefined ||
      !aggregateDominanceMatrix ||
      !concordanceMatrix ||
      !discordanceMatrix
    ) {
      return null
    }

    const cAB = concordanceMatrix[idxA]?.[idxB] ?? 0
    const dAB = discordanceMatrix[idxA]?.[idxB] ?? 0
    const eAB = aggregateDominanceMatrix[idxA]?.[idxB] ?? 0

    const cBA = concordanceMatrix[idxB]?.[idxA] ?? 0
    const dBA = discordanceMatrix[idxB]?.[idxA] ?? 0
    const eBA = aggregateDominanceMatrix[idxB]?.[idxA] ?? 0

    return {
      aDominatesB: eAB === 1,
      bDominatesA: eBA === 1,
      cAB: Number(cAB.toFixed(3)),
      dAB: Number(dAB.toFixed(3)),
      cBA: Number(cBA.toFixed(3)),
      dBA: Number(dBA.toFixed(3)),
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Komparasi Berdampingan Pelamar
              </DialogTitle>
              <DialogDescription className="text-xs">
                Perbandingan mendalam antar {candidates.length} kandidat berdasarkan kriteria dan relasi outranking ELECTRE I
              </DialogDescription>
            </div>
            <div className="text-right text-xs text-muted-foreground hidden sm:block">
              Threshold: <span className="font-mono font-medium">c = {thresholdC.toFixed(3)}</span> |{" "}
              <span className="font-mono font-medium">d = {thresholdD.toFixed(3)}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Candidates Header Grid */}
          <div
            className={`grid gap-4 ${
              candidates.length === 2 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {candidates.map((cand, idx) => (
              <div
                key={cand.id}
                className="p-4 rounded-xl border bg-muted/20 relative overflow-hidden space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-bold">
                    Kandidat {String.fromCharCode(65 + idx)}
                  </Badge>
                  <StatusBadge status={cand.passed ? "passed" : "not_passed"} size="sm" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{cand.name}</h4>
                  <p className="text-xs text-muted-foreground">NIM: {cand.nim || "-"}</p>
                </div>
                <div className="pt-2 border-t grid grid-cols-2 gap-2 text-center">
                  <div className="bg-background rounded-lg p-1.5 border">
                    <span className="text-[10px] text-muted-foreground block">Peringkat</span>
                    <span className="text-sm font-bold text-foreground">#{cand.ranking}</span>
                  </div>
                  <div className="bg-background rounded-lg p-1.5 border">
                    <span className="text-[10px] text-muted-foreground block">Net Score</span>
                    <span className="text-sm font-black text-primary">
                      {cand.netScore > 0 ? `+${cand.netScore}` : cand.netScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pairwise Dominance Analysis (ELECTRE Outranking) */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              Analisis Relasi Outranking Antar Kandidat
            </h4>
            <p className="text-xs text-muted-foreground">
              Menjelaskan apakah salah satu kandidat secara agregat mengeliminasi/mendominasi kandidat lain berdasarkan matriks dominasi E
            </p>

            <div className="space-y-3 pt-1">
              {candidates.map((candA, i) =>
                candidates.slice(i + 1).map((candB) => {
                  const rel = getPairwiseRelation(candA, candB)
                  if (!rel) return null

                  const labelA = candA.name.split(" ")[0]
                  const labelB = candB.name.split(" ")[0]

                  return (
                    <div
                      key={`${candA.id}-${candB.id}`}
                      className="p-3.5 rounded-lg border bg-muted/30 text-xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-sm">
                        <span className="text-primary flex items-center gap-1.5">
                          {candA.name} <ArrowRight className="size-3.5" /> {candB.name}
                        </span>
                        <div>
                          {rel.aDominatesB && !rel.bDominatesA && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                              {labelA} Mendominasi {labelB}
                            </Badge>
                          )}
                          {!rel.aDominatesB && rel.bDominatesA && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                              {labelB} Mendominasi {labelA}
                            </Badge>
                          )}
                          {rel.aDominatesB && rel.bDominatesA && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              Saling Mendominasi
                            </Badge>
                          )}
                          {!rel.aDominatesB && !rel.bDominatesA && (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Tidak Ada Dominasi Langsung
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-muted-foreground text-[11px]">
                        <div className="p-2 rounded bg-background border flex items-center justify-between">
                          <span>
                            {labelA} → {labelB}: Concordance: <b className="text-foreground">{rel.cAB}</b> (≥ {thresholdC.toFixed(2)}? {rel.cAB >= thresholdC ? "Ya" : "Tidak"}), Discordance: <b className="text-foreground">{rel.dAB}</b> (≤ {thresholdD.toFixed(2)}? {rel.dAB <= thresholdD ? "Ya" : "Tidak"})
                          </span>
                          {rel.aDominatesB ? (
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 ml-2" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground shrink-0 ml-2" />
                          )}
                        </div>

                        <div className="p-2 rounded bg-background border flex items-center justify-between">
                          <span>
                            {labelB} → {labelA}: Concordance: <b className="text-foreground">{rel.cBA}</b> (≥ {thresholdC.toFixed(2)}? {rel.cBA >= thresholdC ? "Ya" : "Tidak"}), Discordance: <b className="text-foreground">{rel.dBA}</b> (≤ {thresholdD.toFixed(2)}? {rel.dBA <= thresholdD ? "Ya" : "Tidak"})
                          </span>
                          {rel.bDominatesA ? (
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 ml-2" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground shrink-0 ml-2" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Criteria Score Comparison Matrix */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Tabel Komparasi Skor Kriteria</h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-muted-foreground text-left font-medium">
                    <th className="py-2.5 px-3">Kriteria & Bobot</th>
                    {candidates.map((cand, idx) => (
                      <th key={cand.id} className="py-2.5 px-3 text-center">
                        <div className="font-bold text-foreground">
                          {cand.name.split(" ")[0]} ({String.fromCharCode(65 + idx)})
                        </div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Skor Skala (1-5)
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center">Kandidat Unggul</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {criteria.map((c) => {
                    const scores = candidates.map((cand) => cand.scores[c.id] ?? 0)
                    const maxScore = Math.max(...scores)
                    const minScore = Math.min(...scores)
                    const isAllEqual = scores.every((s) => s === scores[0])

                    // Determine best candidate for this criterion (considering benefit vs cost)
                    let bestIdx = -1
                    if (!isAllEqual) {
                      if (c.type === "benefit") {
                        bestIdx = scores.indexOf(maxScore)
                      } else {
                        // For cost: lower raw value is better, but scale score is already configured where higher is better or lower is better
                        bestIdx = scores.indexOf(maxScore)
                      }
                    }

                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-foreground">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {c.type === "benefit" ? "Benefit" : "Cost"} • {c.weight}%
                          </div>
                        </td>

                        {candidates.map((cand) => {
                          const score = cand.scores[c.id] ?? 0
                          const isMax = score === maxScore && !isAllEqual
                          const isMin = score === minScore && !isAllEqual

                          return (
                            <td
                              key={cand.id}
                              className={`py-2.5 px-3 text-center font-bold ${
                                isMax
                                  ? "text-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
                                  : isMin
                                  ? "text-rose-600"
                                  : "text-foreground"
                              }`}
                            >
                              {score} / 5
                            </td>
                          )
                        })}

                        <td className="py-2.5 px-3 text-center font-medium">
                          {isAllEqual ? (
                            <span className="text-muted-foreground text-[11px]">Seimbang</span>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-[10px]"
                            >
                              Kandidat {String.fromCharCode(65 + bestIdx)} ({candidates[bestIdx]?.name.split(" ")[0]})
                            </Badge>
                          )}
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
