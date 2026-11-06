export type CriteriaType = 'benefit' | 'cost';

export interface ElectreCriterion {
  id: string;
  name: string;
  type: CriteriaType;
  weight: number; // Raw weight or percentage (e.g. 25 or 0.25)
}

export interface ElectreAlternative {
  id: string;
  name: string;
  // Criteria scores mapped by criterion id
  scores: Record<string, number>;
  // Additional data for tie breaking
  metadata?: {
    ipk?: number;
    penghasilan?: number;
    submittedAt?: string;
    [key: string]: unknown;
  };
}

export interface ElectreThresholdConfig {
  thresholdCMode: 'average' | 'manual';
  manualThresholdC?: number | null;
  thresholdDMode: 'average' | 'manual';
  manualThresholdD?: number | null;
}

export interface TieBreakRule {
  field: 'net_score' | 'ipk' | 'penghasilan' | 'waktu_submit';
  order: 'asc' | 'desc';
}

export interface ElectreInput {
  criteria: ElectreCriterion[];
  alternatives: ElectreAlternative[];
  thresholds?: ElectreThresholdConfig;
  quota?: number;
  tieBreakOrder?: Array<'ipk' | 'penghasilan' | 'waktu_submit' | string>;
}

export interface MatrixStep<T = number> {
  headers: string[]; // column labels (criteria names or alternative names)
  rowLabels: string[]; // row labels (alternative names)
  rowIds: string[]; // alternative ids
  matrix: T[][];
}

export interface AlternativeRankingResult {
  id: string;
  name: string;
  dominasi: number; // jumlah alternatif yang didominasi (outranking others)
  didominasi: number; // jumlah alternatif yang mendominasi alternatif ini
  netScore: number; // dominasi - didominasi
  tieBreakDetails: {
    ipk?: number;
    penghasilan?: number;
    submittedAt?: string;
  };
  ranking: number;
  passed: boolean;
}

export interface ElectreResult {
  // Intermediate matrices for auditability & UI heatmap
  decisionMatrix: MatrixStep; // X
  normalizedMatrix: MatrixStep; // R
  weightedMatrix: MatrixStep; // V
  concordanceMatrix: MatrixStep; // C
  discordanceMatrix: MatrixStep; // D
  thresholdC: number;
  thresholdD: number;
  concordanceDominanceMatrix: MatrixStep<number>; // F (0 or 1)
  discordanceDominanceMatrix: MatrixStep<number>; // G (0 or 1)
  aggregateDominanceMatrix: MatrixStep<number>; // E = F * G (0 or 1)
  // Final rankings
  rankings: AlternativeRankingResult[];
  quota: number;
}
