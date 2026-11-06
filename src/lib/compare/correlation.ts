import { SpearmanCorrelation } from "./types"

/**
 * Calculates Spearman's Rank Correlation Coefficient (r_s) between two sets of rankings
 * Formula: r_s = 1 - (6 * sum(d_i^2)) / (n * (n^2 - 1))
 */
export function calculateSpearmanCorrelation(
  rankingsA: Array<{ id: string; ranking: number }>,
  rankingsB: Array<{ id: string; ranking: number }>
): SpearmanCorrelation {
  const n = rankingsA.length

  if (n <= 1) {
    return {
      coefficient: 1.0,
      interpretation: "Sempurna (Alternatif Tunggal)",
    }
  }

  const rankBMap = new Map(rankingsB.map((item) => [item.id, item.ranking]))

  let sumD2 = 0
  for (const itemA of rankingsA) {
    const rankB = rankBMap.get(itemA.id) ?? itemA.ranking
    const diff = itemA.ranking - rankB
    sumD2 += diff * diff
  }

  const denominator = n * (n * n - 1)
  const coefficient = Number((1 - (6 * sumD2) / denominator).toFixed(3))

  let interpretation = "Tidak Berkorelasi"
  const absCoeff = Math.abs(coefficient)

  if (absCoeff >= 0.8) {
    interpretation = "Korelasi Sangat Kuat"
  } else if (absCoeff >= 0.6) {
    interpretation = "Korelasi Kuat"
  } else if (absCoeff >= 0.4) {
    interpretation = "Korelasi Sedang"
  } else if (absCoeff >= 0.2) {
    interpretation = "Korelasi Lemah"
  } else {
    interpretation = "Sangat Lemah / Tidak Terkorelasi"
  }

  return {
    coefficient,
    interpretation,
  }
}
