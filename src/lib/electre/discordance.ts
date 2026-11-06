import { ElectreCriterion, MatrixStep } from './types';

export interface DiscordanceOutput {
  discordanceMatrix: MatrixStep;
  thresholdD: number;
  discordanceDominanceMatrix: MatrixStep<number>;
}

/**
 * Calculates Discordance Set D(k, l), Discordance Matrix D_kl,
 * Average Threshold d, and Discordance Dominance Matrix G.
 */
export function buildDiscordanceMatrices(
  criteria: ElectreCriterion[],
  V: number[][], // Weighted normalized matrix
  X: number[][], // Decision matrix for benefit/cost comparison
  rowLabels: string[],
  rowIds: string[],
  manualThresholdD?: number | null
): DiscordanceOutput {
  const m = V.length;
  const n = criteria.length;

  const headers = [...rowLabels]; // Square matrix (m x m)

  // 1. Calculate Discordance Matrix D (m x m)
  const D: number[][] = [];
  for (let k = 0; k < m; k++) {
    const row: number[] = [];
    for (let l = 0; l < m; l++) {
      if (k === l) {
        row.push(0);
        continue;
      }

      // Determine discordance set D(k, l)
      const discordanceIndices: number[] = [];
      for (let j = 0; j < n; j++) {
        const isBenefit = criteria[j].type === 'benefit';
        // k is worse than l
        const isWorse = isBenefit
          ? X[k][j] < X[l][j]
          : X[k][j] > X[l][j]; // For cost, higher is worse

        if (isWorse) {
          discordanceIndices.push(j);
        }
      }

      // If D(k, l) is empty, discordance index is 0
      if (discordanceIndices.length === 0) {
        row.push(0);
        continue;
      }

      // Max absolute difference across all criteria j
      let maxAll = 0;
      for (let j = 0; j < n; j++) {
        const diff = Math.abs(V[k][j] - V[l][j]);
        if (diff > maxAll) maxAll = diff;
      }

      // Zero denominator check (all weighted values identical)
      if (maxAll === 0) {
        row.push(0);
        continue;
      }

      // Max absolute difference for j in D(k, l)
      let maxDiscordant = 0;
      for (const j of discordanceIndices) {
        const diff = Math.abs(V[k][j] - V[l][j]);
        if (diff > maxDiscordant) maxDiscordant = diff;
      }

      const d_kl = maxDiscordant / maxAll;
      row.push(Number(d_kl.toFixed(6)));
    }
    D.push(row);
  }

  // 2. Calculate Threshold d: average of non-diagonal elements
  let thresholdD = 0;
  if (manualThresholdD !== null && manualThresholdD !== undefined && !isNaN(manualThresholdD)) {
    thresholdD = Number(manualThresholdD);
  } else if (m > 1) {
    let sumOffDiag = 0;
    const countOffDiag = m * (m - 1);
    for (let k = 0; k < m; k++) {
      for (let l = 0; l < m; l++) {
        if (k !== l) {
          sumOffDiag += D[k][l];
        }
      }
    }
    thresholdD = Number((sumOffDiag / countOffDiag).toFixed(6));
  }

  // 3. Discordance Dominance Matrix G (m x m): G_kl = 1 if D_kl <= d, else 0
  const G: number[][] = [];
  for (let k = 0; k < m; k++) {
    const row: number[] = [];
    for (let l = 0; l < m; l++) {
      if (k === l) {
        row.push(0);
      } else {
        row.push(D[k][l] <= thresholdD ? 1 : 0);
      }
    }
    G.push(row);
  }

  return {
    discordanceMatrix: { headers, rowLabels, rowIds, matrix: D },
    thresholdD,
    discordanceDominanceMatrix: { headers, rowLabels, rowIds, matrix: G },
  };
}
