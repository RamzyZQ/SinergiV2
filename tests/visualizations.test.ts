import { describe, it, expect } from "vitest"

describe("Visualization utilities", () => {
  it("formats top N ranking data correctly", () => {
    const rawData = [
      { id: "1", name: "Budi Santoso", ranking: 1, netScore: 5, passed: true },
      { id: "2", name: "Siti Rahma", ranking: 2, netScore: 3, passed: true },
      { id: "3", name: "Ahmad Fauzi", ranking: 3, netScore: 1, passed: false },
    ]

    const chartData = rawData.map((d) => ({
      name: `#${d.ranking} ${d.name.split(" ")[0]}`,
      fullName: d.name,
      netScore: d.netScore,
      passed: d.passed,
      ranking: d.ranking,
    }))

    expect(chartData).toHaveLength(3)
    expect(chartData[0].name).toBe("#1 Budi")
    expect(chartData[0].passed).toBe(true)
  })

  it("calculates radar criteria comparison correctly", () => {
    const criteria = [
      { id: "c1", name: "IPK", weight: 30 },
      { id: "c2", name: "Penghasilan", weight: 25 },
      { id: "c3", name: "Prestasi", weight: 25 },
      { id: "c4", name: "Organisasi", weight: 20 },
    ]

    const studentScores = { c1: 4.5, c2: 3.0, c3: 5.0, c4: 2.0 }
    const averageScores = { c1: 3.8, c2: 3.2, c3: 3.0, c4: 3.1 }

    const radarData = criteria.map((c) => ({
      criterion: c.name,
      studentScore: studentScores[c.id as keyof typeof studentScores] ?? 0,
      avgScore: Number((averageScores[c.id as keyof typeof averageScores] ?? 0).toFixed(2)),
      fullMark: 5,
    }))

    expect(radarData).toHaveLength(4)
    expect(radarData[0].criterion).toBe("IPK")
    expect(radarData[0].studentScore).toBe(4.5)
    expect(radarData[0].avgScore).toBe(3.8)
  })
})
