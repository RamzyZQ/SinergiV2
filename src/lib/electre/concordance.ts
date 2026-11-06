import { ElectreCriterion, MatrixStep } from './types';

export interface ConcordanceOutput {
  concordanceMatrix: MatrixStep;
  thresholdC: number;
  concordanceDominanceMatrix: MatrixStep<number>;
}

/**
 * Calculates Concordance Set C(k, l), Concordance Matrix C_kl,
 * Average Threshold c, and Concordance Dominance Matrix F.
 */
export function buildConcordanceMatrices(
  criteria: ElectreCriterion[],
  normalizedWeights: number[],
  X: number[][], // Decision matrix (for exact benefit/cost comparison)
  rowLabels: string[],
  rowIds: string[],
  manualThresholdC?: number | null
): ConcordanceOutput {
  const m = X.length;
  const n = criteria.length;

  const headers = [...rowLabels]; // Square matrix (m x m)

  // 1. Calculate Concordance Matrix C (m x m)
  const C: number[][] = [];
  for (let k = 0; k < m; k++) {
    const row: number[] = [];
    for (let l = 0; l < m; l++) {
      if (k === l) {
        row.push(0);
        continue;
      }

      // Find concordance set C(k, l)
      let sumWeight = 0;
      for (let j = 0; j < n; j++) {
        const isBenefit = criteria[j].type === 'benefit';
        const isBetterOrEqual = isBenefit
          ? X[k][j] >= X[l][j]
          : X[k][j] <= X[l][j]; // For cost, smaller is better

        if (isBetterOrEqual) {
          sumWeight += normalizedWeights[j];
        }
      }
      row.push(Number(sumWeight.toFixed(6)));
    }
    C.push(row);
  }

  // 2. Calculate Threshold c: average of non-diagonal elements
  let thresholdC = 0;
  if (manualThresholdC !== null && manualThresholdC !== undefined && !isNaN(manualThresholdC)) {
    thresholdC = Number(manualThresholdC);
  } else if (m > 1) {
    let sumOffDiag = 0;
    const countOffDiag = m * (m - 1);
    for (let k = 0; k < m; k++) {
      for (let l = 0; l < m; l++) {
        if (k !== l) {
          sumOffDiag += C[k][l];
        }
      }
    }
    thresholdC = Number((sumOffDiag / countOffDiag).toFixed(6));
  }

  // 3. Concordance Dominance Matrix F (m x m): F_kl = 1 if C_kl >= c, else 0
  const F: number[][] = [];
  for (let k = 0; k < m; k++) {
    const row: number[] = [];
    for (let l = 0; l < m; l++) {
      if (k === l) {
        row.push(0);
      } else {
        row.push(C[k][l] >= thresholdC ? 1 : 0);
      }
    }
    F.push(row);
  }

  return {
    concordanceMatrix: { headers, rowLabels, rowIds, matrix: C },
    thresholdC,
    concordanceDominanceMatrix: { headers, rowLabels, rowIds, matrix: F },
  };
}
