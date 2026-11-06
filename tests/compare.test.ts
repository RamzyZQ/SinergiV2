import { describe, it, expect } from "vitest"
import {
  calculateSAW,
  calculateTOPSIS,
  calculateSpearmanCorrelation,
  CompareCriterion,
  CompareAlternative,
} from "@/lib/compare"

describe("Comparative Methods (SAW & TOPSIS)", () => {
  const criteria: CompareCriterion[] = [
    { id: "c1", name: "IPK", type: "benefit", weight: 40 },
    { id: "c2", name: "Penghasilan", type: "cost", weight: 30 },
    { id: "c3", name: "Prestasi", type: "benefit", weight: 30 },
  ]

  const alternatives: CompareAlternative[] = [
    {
      id: "a1",
      name: "Budi",
      scores: { c1: 4.0, c2: 2.0, c3: 5.0 }, // high IPK, low income (good for cost), high prestasi
    },
    {
      id: "a2",
      name: "Siti",
      scores: { c1: 3.5, c2: 4.0, c3: 4.0 }, // medium IPK, high income (bad for cost), medium prestasi
    },
    {
      id: "a3",
      name: "Andi",
      scores: { c1: 3.0, c2: 5.0, c3: 2.0 }, // lower IPK, high income, low prestasi
    },
  ]

  it("calculates SAW correctly with benefit and cost criteria", () => {
    const sawResult = calculateSAW(criteria, alternatives, 2)

    expect(sawResult).toHaveLength(3)
    // Budi should be ranked #1
    expect(sawResult[0].id).toBe("a1")
    expect(sawResult[0].ranking).toBe(1)
    expect(sawResult[0].passed).toBe(true)

    // Andi should be ranked #3
    expect(sawResult[2].id).toBe("a3")
    expect(sawResult[2].ranking).toBe(3)
    expect(sawResult[2].passed).toBe(false)
  })

  it("calculates TOPSIS correctly with ideal solutions", () => {
    const topsisResult = calculateTOPSIS(criteria, alternatives, 2)

    expect(topsisResult).toHaveLength(3)
    // Budi should be ranked #1
    expect(topsisResult[0].id).toBe("a1")
    expect(topsisResult[0].ranking).toBe(1)
    expect(topsisResult[0].passed).toBe(true)

    // Closeness should be between 0 and 1
    expect(topsisResult[0].closeness).toBeGreaterThan(0)
    expect(topsisResult[0].closeness).toBeLessThanOrEqual(1)
  })

  it("calculates Spearman correlation correctly", () => {
    const ranksA = [
      { id: "a1", ranking: 1 },
      { id: "a2", ranking: 2 },
      { id: "a3", ranking: 3 },
    ]
    const ranksB = [
      { id: "a1", ranking: 1 },
      { id: "a2", ranking: 2 },
      { id: "a3", ranking: 3 },
    ]

    const perfectCorr = calculateSpearmanCorrelation(ranksA, ranksB)
    expect(perfectCorr.coefficient).toBe(1.0)
    expect(perfectCorr.interpretation).toBe("Korelasi Sangat Kuat")

    const invertedRanks = [
      { id: "a1", ranking: 3 },
      { id: "a2", ranking: 2 },
      { id: "a3", ranking: 1 },
    ]
    const invertedCorr = calculateSpearmanCorrelation(ranksA, invertedRanks)
    expect(invertedCorr.coefficient).toBe(-1.0)
  })
})
