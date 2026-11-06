export interface CompareCriterion {
  id: string
  name: string
  type: "benefit" | "cost"
  weight: number // 0 - 100 or 0 - 1
}

export interface CompareAlternative {
  id: string
  name: string
  scores: Record<string, number> // criteria_id -> score (e.g. 1 - 5)
}

export interface SAWResult {
  id: string
  name: string
  score: number // preference value V_i
  ranking: number
  passed: boolean
}

export interface TOPSISResult {
  id: string
  name: string
  dPlus: number // distance to positive ideal solution
  dMinus: number // distance to negative ideal solution
  closeness: number // relative closeness C_i (0 - 1)
  ranking: number
  passed: boolean
}

export interface SpearmanCorrelation {
  coefficient: number // -1 to 1
  interpretation: string // e.g. "Sangat Kuat"
}

export interface ComparisonSummary {
  saw: SAWResult[]
  topsis: TOPSISResult[]
  correlationWithElectre: {
    sawVsElectre: SpearmanCorrelation
    topsisVsElectre: SpearmanCorrelation
    sawVsTopsis: SpearmanCorrelation
  }
}
