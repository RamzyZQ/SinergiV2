import { ElectreCriterion, ElectreAlternative, MatrixStep } from './types';

export interface NormalizationOutput {
  decisionMatrix: MatrixStep;
  normalizedMatrix: MatrixStep;
  weightedMatrix: MatrixStep;
  normalizedWeights: number[];
}

/**
 * Builds Decision Matrix X, Vector-Normalized Matrix R, and Weighted Normalized Matrix V.
 */
export function buildNormalizedMatrices(
  criteria: ElectreCriterion[],
  alternatives: ElectreAlternative[]
): NormalizationOutput {
  const m = alternatives.length;
  const n = criteria.length;

  const rowLabels = alternatives.map((a) => a.name);
  const rowIds = alternatives.map((a) => a.id);
  const headers = criteria.map((c) => c.name);

  // 1. Build Decision Matrix X (m x n)
  const X: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const score = alternatives[i].scores[criteria[j].id] ?? 0;
      row.push(score);
    }
    X.push(row);
  }

  // 2. Vector Normalization: r_ij = x_ij / sqrt(sum_k x_kj^2)
  const colDenominators: number[] = [];
  for (let j = 0; j < n; j++) {
    let sumSq = 0;
    for (let i = 0; i < m; i++) {
      sumSq += X[i][j] * X[i][j];
    }
    colDenominators.push(Math.sqrt(sumSq));
  }

  const R: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const denom = colDenominators[j];
      const val = denom === 0 ? 0 : X[i][j] / denom;
      // Round to 6 decimals for numerical precision
      row.push(Number(val.toFixed(6)));
    }
    R.push(row);
  }

  // 3. Normalize Weights: w'_j = w_j / sum(w)
  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
  const normalizedWeights = criteria.map((c) =>
    totalWeight === 0 ? 1 / n : Number(c.weight) / totalWeight
  );

  // 4. Weighted Matrix: v_ij = w'_j * r_ij
  const V: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const val = R[i][j] * normalizedWeights[j];
      row.push(Number(val.toFixed(6)));
    }
    V.push(row);
  }

  return {
    decisionMatrix: { headers, rowLabels, rowIds, matrix: X },
    normalizedMatrix: { headers, rowLabels, rowIds, matrix: R },
    weightedMatrix: { headers, rowLabels, rowIds, matrix: V },
    normalizedWeights,
  };
}
