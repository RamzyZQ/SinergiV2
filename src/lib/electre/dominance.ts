import { MatrixStep } from './types';

export interface DominanceOutput {
  aggregateDominanceMatrix: MatrixStep<number>;
  dominanceCounts: Array<{
    id: string;
    name: string;
    dominasi: number;
    didominasi: number;
    netScore: number;
  }>;
}

/**
 * Calculates Aggregate Dominance Matrix E = F * G,
 * and individual Dominasi, Didominasi, and Net Dominance Scores.
 */
export function buildAggregateDominance(
  F: number[][],
  G: number[][],
  rowLabels: string[],
  rowIds: string[]
): DominanceOutput {
  const m = F.length;
  const headers = [...rowLabels];

  // 1. Calculate Aggregate Matrix E = F * G
  const E: number[][] = [];
  for (let k = 0; k < m; k++) {
    const row: number[] = [];
    for (let l = 0; l < m; l++) {
      row.push(F[k][l] * G[k][l]);
    }
    E.push(row);
  }

  // 2. Calculate Dominasi (row sum) and Didominasi (col sum)
  const dominanceCounts = [];
  for (let k = 0; k < m; k++) {
    let dominasi = 0;
    for (let l = 0; l < m; l++) {
      if (k !== l) {
        dominasi += E[k][l];
      }
    }

    let didominasi = 0;
    for (let l = 0; l < m; l++) {
      if (k !== l) {
        didominasi += E[l][k];
      }
    }

    dominanceCounts.push({
      id: rowIds[k],
      name: rowLabels[k],
      dominasi,
      didominasi,
      netScore: dominasi - didominasi,
    });
  }

  return {
    aggregateDominanceMatrix: { headers, rowLabels, rowIds, matrix: E },
    dominanceCounts,
  };
}
