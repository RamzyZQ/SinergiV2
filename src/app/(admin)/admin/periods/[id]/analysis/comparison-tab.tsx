"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { CheckCircle2, Scale, HelpCircle } from "lucide-react"
import {
  CompareAlternative,
  CompareCriterion,
  calculateSAW,
  calculateTOPSIS,
  calculateSpearmanCorrelation,
} from "@/lib/compare"

interface ComparisonTabProps {
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
    electreRank: number
    electrePassed: boolean
    electreNetScore: number
  }>
  quota: number
}

export function ComparisonTab({ criteria, alternatives, quota }: ComparisonTabProps) {
  // Convert criteria & alternatives for comparative calculation
  const compareCriteria: CompareCriterion[] = criteria.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    weight: c.weight,
  }))

  const compareAlternatives: CompareAlternative[] = alternatives.map((a) => ({
    id: a.id,
    name: a.name,
    scores: a.scores,
  }))

  // 1. Run SAW
  const sawResults = calculateSAW(compareCriteria, compareAlternatives, quota)
  const sawRankMap = new Map(sawResults.map((r) => [r.id, r]))

  // 2. Run TOPSIS
  const topsisResults = calculateTOPSIS(compareCriteria, compareAlternatives, quota)
  const topsisRankMap = new Map(topsisResults.map((r) => [r.id, r]))

  // 3. Compute Spearman Correlations
  const electreRanks = alternatives.map((a) => ({ id: a.id, ranking: a.electreRank }))
  const sawRanks = sawResults.map((r) => ({ id: r.id, ranking: r.ranking }))
  const topsisRanks = topsisResults.map((r) => ({ id: r.id, ranking: r.ranking }))

  const corrSawElectre = calculateSpearmanCorrelation(electreRanks, sawRanks)
  const corrTopsisElectre = calculateSpearmanCorrelation(electreRanks, topsisRanks)
  const corrSawTopsis = calculateSpearmanCorrelation(sawRanks, topsisRanks)

  return (
    <div className="space-y-6 pt-2">
      {/* Correlation KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-2xs border-primary/20 bg-primary/5">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
              Validasi Silang 1
            </span>
            <CardTitle className="text-sm font-bold">ELECTRE I vs TOPSIS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="text-2xl font-black text-primary font-mono">
              rₛ = {corrTopsisElectre.coefficient > 0 ? `+${corrTopsisElectre.coefficient}` : corrTopsisElectre.coefficient}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>{corrTopsisElectre.interpretation}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
              Validasi Silang 2
            </span>
            <CardTitle className="text-sm font-bold">ELECTRE I vs SAW</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="text-2xl font-black text-blue-600 font-mono">
              rₛ = {corrSawElectre.coefficient > 0 ? `+${corrSawElectre.coefficient}` : corrSawElectre.coefficient}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>{corrSawElectre.interpretation}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Korelasi Silang
            </span>
            <CardTitle className="text-sm font-bold">TOPSIS vs SAW</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="text-2xl font-black text-foreground font-mono">
              rₛ = {corrSawTopsis.coefficient > 0 ? `+${corrSawTopsis.coefficient}` : corrSawTopsis.coefficient}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>{corrSawTopsis.interpretation}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Method Comparison Table */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Scale className="size-4 text-primary" />
                Matriks Perbandingan Peringkat Multi-Metode
              </CardTitle>
              <CardDescription className="text-xs">
                Perbandingan peringkat pelamar antara metode ELECTRE I (resmi), SAW, dan TOPSIS
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Kuota Penerima: {quota} Mahasiswa
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b">
                <tr className="text-muted-foreground text-left font-medium">
                  <th className="py-2.5 px-3">Nama Pelamar</th>
                  <th className="py-2.5 px-3 text-center bg-primary/5 border-x font-bold text-primary">
                    ELECTRE I (Resmi)
                  </th>
                  <th className="py-2.5 px-3 text-center font-bold">SAW</th>
                  <th className="py-2.5 px-3 text-center font-bold">TOPSIS</th>
                  <th className="py-2.5 px-3 text-center">Konsistensi Kuota</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alternatives.map((alt) => {
                  const saw = sawRankMap.get(alt.id)
                  const topsis = topsisRankMap.get(alt.id)

                  const passedElectre = alt.electrePassed
                  const passedSaw = saw ? saw.passed : false
                  const passedTopsis = topsis ? topsis.passed : false

                  const passedCount =
                    (passedElectre ? 1 : 0) + (passedSaw ? 1 : 0) + (passedTopsis ? 1 : 0)

                  return (
                    <tr key={alt.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        <div>{alt.name}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          NIM: {alt.nim || "-"} • {alt.prodi || "-"}
                        </div>
                      </td>

                      {/* ELECTRE */}
                      <td className="py-2.5 px-3 text-center bg-primary/5 border-x">
                        <div className="font-bold text-foreground font-mono">
                          #{alt.electreRank}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Net: {alt.electreNetScore > 0 ? `+${alt.electreNetScore}` : alt.electreNetScore}
                        </div>
                      </td>

                      {/* SAW */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-bold text-foreground font-mono">
                          #{saw?.ranking ?? "-"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Skor: {saw?.score ?? "-"}
                        </div>
                      </td>

                      {/* TOPSIS */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-bold text-foreground font-mono">
                          #{topsis?.ranking ?? "-"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          C: {topsis?.closeness ?? "-"}
                        </div>
                      </td>

                      {/* Consistency Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {passedCount === 3 ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Lolos di 3 Metode
                          </Badge>
                        ) : passedCount === 2 ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px]">
                            Lolos di 2 Metode
                          </Badge>
                        ) : passedCount === 1 ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                            Lolos di 1 Metode
                          </Badge>
                        ) : (
                          <StatusBadge status="not_passed" size="sm" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Explanatory Footer */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <HelpCircle className="size-4 text-primary" />
            Catatan Perbedaan Paradigma Metode SPK
          </div>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            <b>ELECTRE I</b> menggunakan konsep <i>outranking</i> berbasis perbandingan pasangan alternatif (concordance & discordance) sehingga sangat tangguh mencegah alternatif dengan nilai satu kriteria yang sangat buruk lolos secara kompensatoris. <b>SAW</b> menggunakan penjumlahan terbobot linier, sementara <b>TOPSIS</b> mengukur jarak relatif terhadap solusi ideal positif dan negatif. Korelasi Spearman yang tinggi membuktikan objektivitas dan konsistensi perankingan beasiswa.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
