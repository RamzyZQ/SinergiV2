"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Minus, CheckCircle, AlertTriangle } from "lucide-react"

export interface SlopeCandidate {
  id: string
  name: string
  nim: string
  officialRank: number
  officialPassed: boolean
  simulatedRank: number
  simulatedPassed: boolean
  rankDiff: number // officialRank - simulatedRank (positive means improved rank)
}

interface SlopeChartProps {
  candidates: SlopeCandidate[]
  quota: number
}

export function SlopeChart({ candidates, quota }: SlopeChartProps) {
  // Sort by simulated rank for clear display
  const sorted = [...candidates].sort((a, b) => a.simulatedRank - b.simulatedRank)

  // Identify status changes
  const newlyPassed = candidates.filter((c) => !c.officialPassed && c.simulatedPassed)
  const newlyDropped = candidates.filter((c) => c.officialPassed && !c.simulatedPassed)

  return (
    <div className="space-y-4">
      {/* Quick Alert on Rank Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                {newlyPassed.length} Kandidat Naik ke Kuota Lolos
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {newlyPassed.map((c) => c.name.split(" ")[0]).join(", ") || "Tidak ada"}
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px]">+{newlyPassed.length}</Badge>
        </div>

        <div className="p-3 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-rose-800 dark:text-rose-300">
                {newlyDropped.length} Kandidat Tergeser Keluar Kuota
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {newlyDropped.map((c) => c.name.split(" ")[0]).join(", ") || "Tidak ada"}
              </p>
            </div>
          </div>
          <Badge className="bg-rose-600 text-white text-[10px]">-{newlyDropped.length}</Badge>
        </div>
      </div>

      {/* Slope Comparison Table & Flow View */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-3 bg-muted/40 border-b flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-4">
            <span className="w-12 text-center text-muted-foreground">Rank Resmi</span>
            <span>Nama Kandidat</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Pergeseran</span>
            <span className="w-16 text-center text-primary">Rank Simulasi</span>
          </div>
        </div>

        <div className="divide-y text-xs max-h-[420px] overflow-y-auto">
          {sorted.map((cand) => {
            const isGained = !cand.officialPassed && cand.simulatedPassed
            const isLost = cand.officialPassed && !cand.simulatedPassed
            const isRankUp = cand.rankDiff > 0
            const isRankDown = cand.rankDiff < 0
            const isAtQuotaBoundary = cand.simulatedRank === quota

            return (
              <div
                key={cand.id}
                className={`p-2.5 px-3 flex items-center justify-between transition-colors ${
                  isGained
                    ? "bg-emerald-50/60 dark:bg-emerald-950/25"
                    : isLost
                    ? "bg-rose-50/60 dark:bg-rose-950/25"
                    : isAtQuotaBoundary
                    ? "border-b-2 border-b-amber-500 bg-amber-50/20"
                    : "hover:bg-muted/20"
                }`}
              >
                {/* Left: Official Rank & Name */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 text-center">
                    <span
                      className={`inline-flex items-center justify-center size-6 rounded-md font-mono text-[11px] font-bold ${
                        cand.officialPassed
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      #{cand.officialRank}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{cand.name}</p>
                    <p className="text-[10px] text-muted-foreground">NIM: {cand.nim || "-"}</p>
                  </div>
                </div>

                {/* Right: Shift indicator & Simulated Rank */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex items-center gap-1.5 w-24 justify-end">
                    {isGained ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] gap-0.5">
                        <ArrowUpRight className="size-3" />
                        Masuk Kuota
                      </Badge>
                    ) : isLost ? (
                      <Badge className="bg-rose-600 text-white text-[10px] gap-0.5">
                        <ArrowDownRight className="size-3" />
                        Keluar Kuota
                      </Badge>
                    ) : isRankUp ? (
                      <span className="text-emerald-600 font-semibold text-[11px] flex items-center">
                        <ArrowUpRight className="size-3.5" /> +{cand.rankDiff}
                      </span>
                    ) : isRankDown ? (
                      <span className="text-rose-600 font-semibold text-[11px] flex items-center">
                        <ArrowDownRight className="size-3.5" /> {cand.rankDiff}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px] flex items-center">
                        <Minus className="size-3.5" /> Stabil
                      </span>
                    )}
                  </div>

                  <div className="w-16 text-center">
                    <span
                      className={`inline-flex items-center justify-center size-7 rounded-md font-mono text-xs font-black shadow-2xs ${
                        cand.simulatedPassed
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border"
                      }`}
                    >
                      #{cand.simulatedRank}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-2.5 px-3 bg-muted/20 border-t flex items-center justify-between text-[11px] text-muted-foreground">
          <span>*Garis batas kuota penerima beasiswa berada pada peringkat #{quota}.</span>
          <span className="font-medium text-foreground">
            Total {candidates.length} kandidat dievaluasi
          </span>
        </div>
      </div>
    </div>
  )
}
