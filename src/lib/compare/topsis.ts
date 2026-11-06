import { CompareAlternative, CompareCriterion, TOPSISResult } from "./types"

export function calculateTOPSIS(
  criteria: CompareCriterion[],
  alternatives: CompareAlternative[],
  quota: number
): TOPSISResult[] {
  if (alternatives.length === 0 || criteria.length === 0) {
    return []
  }

  // 1. Normalize weights so sum = 1
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 1
  const normalizedWeights: Record<string, number> = {}
  for (const c of criteria) {
    normalizedWeights[c.id] = c.weight / totalWeight
  }

  // 2. Vector Normalization: compute sqrt(sum(x_ij^2)) for each criterion
  const columnNorms: Record<string, number> = {}
  for (const c of criteria) {
    const sumSq = alternatives.reduce((acc, a) => {
      const val = a.scores[c.id] ?? 0
      return acc + val * val
    }, 0)
    columnNorms[c.id] = Math.sqrt(sumSq) || 0.0001
  }

  // 3. Weighted normalized matrix v_ij
  const weightedMatrix: Record<string, Record<string, number>> = {}
  for (const a of alternatives) {
    weightedMatrix[a.id] = {}
    for (const c of criteria) {
      const x = a.scores[c.id] ?? 0
      const r = x / columnNorms[c.id]
      weightedMatrix[a.id][c.id] = (normalizedWeights[c.id] || 0) * r
    }
  }

  // 4. Positive Ideal Solution (A+) and Negative Ideal Solution (A-)
  const aPlus: Record<string, number> = {}
  const aMinus: Record<string, number> = {}

  for (const c of criteria) {
    const colValues = alternatives.map((a) => weightedMatrix[a.id][c.id])

    if (c.type === "benefit") {
      aPlus[c.id] = Math.max(...colValues)
      aMinus[c.id] = Math.min(...colValues)
    } else {
      // Cost: minimum is ideal positive, maximum is ideal negative
      aPlus[c.id] = Math.min(...colValues)
      aMinus[c.id] = Math.max(...colValues)
    }
  }

  // 5. Calculate distances D+ and D- for each alternative
  const scored = alternatives.map((a) => {
    let sumSqPlus = 0
    let sumSqMinus = 0

    for (const c of criteria) {
      const v = weightedMatrix[a.id][c.id]
      const diffPlus = v - aPlus[c.id]
      const diffMinus = v - aMinus[c.id]

      sumSqPlus += diffPlus * diffPlus
      sumSqMinus += diffMinus * diffMinus
    }

    const dPlus = Math.sqrt(sumSqPlus)
    const dMinus = Math.sqrt(sumSqMinus)
    const denominator = dPlus + dMinus

    const closeness = denominator > 0 ? dMinus / denominator : 0.5

    return {
      id: a.id,
      name: a.name,
      dPlus: Number(dPlus.toFixed(4)),
      dMinus: Number(dMinus.toFixed(4)),
      closeness: Number(closeness.toFixed(4)),
    }
  })

  // 6. Sort descending by relative closeness C_i
  scored.sort((a, b) => b.closeness - a.closeness)

  // 7. Assign rankings and passed status
  return scored.map((item, index) => ({
    id: item.id,
    name: item.name,
    dPlus: item.dPlus,
    dMinus: item.dMinus,
    closeness: item.closeness,
    ranking: index + 1,
    passed: index < quota,
  }))
}
