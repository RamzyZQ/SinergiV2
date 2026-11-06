import { CompareAlternative, CompareCriterion, SAWResult } from "./types"

export function calculateSAW(
  criteria: CompareCriterion[],
  alternatives: CompareAlternative[],
  quota: number
): SAWResult[] {
  if (alternatives.length === 0 || criteria.length === 0) {
    return []
  }

  // 1. Normalize weights so sum = 1
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 1
  const normalizedWeights: Record<string, number> = {}
  for (const c of criteria) {
    normalizedWeights[c.id] = c.weight / totalWeight
  }

  // 2. Find min and max for each criterion
  const maxValues: Record<string, number> = {}
  const minValues: Record<string, number> = {}

  for (const c of criteria) {
    const vals = alternatives.map((a) => a.scores[c.id] ?? 0)
    maxValues[c.id] = Math.max(...vals, 0.0001)
    const positiveVals = vals.filter((v) => v > 0)
    minValues[c.id] = positiveVals.length > 0 ? Math.min(...positiveVals) : 0.0001
  }

  // 3. Compute preference value V_i
  const scored = alternatives.map((alt) => {
    let preferenceValue = 0

    for (const c of criteria) {
      const x = alt.scores[c.id] ?? 0
      let r = 0

      if (c.type === "benefit") {
        r = x / (maxValues[c.id] || 1)
      } else {
        // Cost: min / x
        r = x > 0 ? (minValues[c.id] || 1) / x : 0
      }

      preferenceValue += (normalizedWeights[c.id] || 0) * r
    }

    return {
      id: alt.id,
      name: alt.name,
      score: Number(preferenceValue.toFixed(4)),
    }
  })

  // 4. Sort descending
  scored.sort((a, b) => b.score - a.score)

  // 5. Assign rankings and passed status
  return scored.map((item, index) => ({
    id: item.id,
    name: item.name,
    score: item.score,
    ranking: index + 1,
    passed: index < quota,
  }))
}
