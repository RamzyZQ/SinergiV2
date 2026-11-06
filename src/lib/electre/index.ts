import { ElectreInput, ElectreResult } from './types';
import { buildNormalizedMatrices } from './normalize';
import { buildConcordanceMatrices } from './concordance';
import { buildDiscordanceMatrices } from './discordance';
import { buildAggregateDominance } from './dominance';
import { rankAndBreakTies } from './tiebreak';

export * from './types';
export * from './normalize';
export * from './concordance';
export * from './discordance';
export * from './dominance';
export * from './tiebreak';

/**
 * Executes the complete ELECTRE I algorithm with Net Dominance ranking and sequential tie-breaking.
 * Pure deterministic function with zero side effects or database access.
 */
export function calculateElectre(input: ElectreInput): ElectreResult {
  const { criteria, alternatives, thresholds, quota, tieBreakOrder } = input;

  // Handle empty alternative case
  if (!alternatives || alternatives.length === 0) {
    const emptyStep = { headers: [], rowLabels: [], rowIds: [], matrix: [] };
    return {
      decisionMatrix: emptyStep,
      normalizedMatrix: emptyStep,
      weightedMatrix: emptyStep,
      concordanceMatrix: emptyStep,
      discordanceMatrix: emptyStep,
      thresholdC: 0,
      thresholdD: 0,
      concordanceDominanceMatrix: emptyStep,
      discordanceDominanceMatrix: emptyStep,
      aggregateDominanceMatrix: emptyStep,
      rankings: [],
      quota: quota ?? 0,
    };
  }

  const rowLabels = alternatives.map((a) => a.name);
  const rowIds = alternatives.map((a) => a.id);

  // 1. Decision, Normalized, and Weighted Matrices (X, R, V)
  const { decisionMatrix, normalizedMatrix, weightedMatrix, normalizedWeights } =
    buildNormalizedMatrices(criteria, alternatives);

  // 2. Concordance Analysis (C, c, F)
  const manualC =
    thresholds?.thresholdCMode === 'manual' ? thresholds.manualThresholdC : null;
  const { concordanceMatrix, thresholdC, concordanceDominanceMatrix } =
    buildConcordanceMatrices(
      criteria,
      normalizedWeights,
      decisionMatrix.matrix,
      rowLabels,
      rowIds,
      manualC
    );

  // 3. Discordance Analysis (D, d, G)
  const manualD =
    thresholds?.thresholdDMode === 'manual' ? thresholds.manualThresholdD : null;
  const { discordanceMatrix, thresholdD, discordanceDominanceMatrix } =
    buildDiscordanceMatrices(
      criteria,
      weightedMatrix.matrix,
      decisionMatrix.matrix,
      rowLabels,
      rowIds,
      manualD
    );

  // 4. Aggregate Dominance Matrix (E = F * G) and Net Dominance Counts
  const { aggregateDominanceMatrix, dominanceCounts } =
    buildAggregateDominance(
      concordanceDominanceMatrix.matrix,
      discordanceDominanceMatrix.matrix,
      rowLabels,
      rowIds
    );

  // 5. Ranking and Tie-Breaking
  const rankings = rankAndBreakTies(dominanceCounts, alternatives, {
    quota,
    tieBreakOrder,
  });

  return {
    decisionMatrix,
    normalizedMatrix,
    weightedMatrix,
    concordanceMatrix,
    discordanceMatrix,
    thresholdC,
    thresholdD,
    concordanceDominanceMatrix,
    discordanceDominanceMatrix,
    aggregateDominanceMatrix,
    rankings,
    quota: quota ?? alternatives.length,
  };
}
