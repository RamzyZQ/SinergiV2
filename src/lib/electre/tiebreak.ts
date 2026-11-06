import { AlternativeRankingResult, ElectreAlternative } from './types';

export interface TieBreakOptions {
  quota?: number;
  tieBreakOrder?: Array<'ipk' | 'penghasilan' | 'waktu_submit' | string>;
}

/**
 * Sorts alternatives by Net Dominance Score with configurable sequential tie-breaking.
 */
export function rankAndBreakTies(
  dominanceCounts: Array<{
    id: string;
    name: string;
    dominasi: number;
    didominasi: number;
    netScore: number;
  }>,
  alternatives: ElectreAlternative[],
  options: TieBreakOptions = {}
): AlternativeRankingResult[] {
  const quota = options.quota ?? Infinity;
  const tieBreakOrder = options.tieBreakOrder || ['ipk', 'penghasilan', 'waktu_submit'];

  // Map alternative metadata
  const altMap = new Map(alternatives.map((a) => [a.id, a]));

  const combined = dominanceCounts.map((dc) => {
    const alt = altMap.get(dc.id);
    const meta = alt?.metadata || {};

    return {
      id: dc.id,
      name: dc.name,
      dominasi: dc.dominasi,
      didominasi: dc.didominasi,
      netScore: dc.netScore,
      tieBreakDetails: {
        ipk: typeof meta.ipk === 'number' ? meta.ipk : undefined,
        penghasilan: typeof meta.penghasilan === 'number' ? meta.penghasilan : undefined,
        submittedAt: typeof meta.submittedAt === 'string' ? meta.submittedAt : undefined,
      },
    };
  });

  // Multi-tier sort
  combined.sort((a, b) => {
    // Tier 1: Net Score (descending)
    if (b.netScore !== a.netScore) {
      return b.netScore - a.netScore;
    }

    // Tier 2: Configurable Tie-Break Sequence
    for (const rule of tieBreakOrder) {
      if (rule === 'ipk') {
        const ipkA = a.tieBreakDetails.ipk ?? 0;
        const ipkB = b.tieBreakDetails.ipk ?? 0;
        if (ipkB !== ipkA) return ipkB - ipkA; // highest IPK first
      } else if (rule === 'penghasilan') {
        const incA = a.tieBreakDetails.penghasilan ?? Infinity;
        const incB = b.tieBreakDetails.penghasilan ?? Infinity;
        if (incA !== incB) return incA - incB; // lowest income first (need-based)
      } else if (rule === 'waktu_submit') {
        const timeA = a.tieBreakDetails.submittedAt ? new Date(a.tieBreakDetails.submittedAt).getTime() : Infinity;
        const timeB = b.tieBreakDetails.submittedAt ? new Date(b.tieBreakDetails.submittedAt).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB; // earliest submit first
      }
    }

    // Fallback: alphabet
    return a.name.localeCompare(b.name);
  });

  // Assign rankings and quota qualification
  return combined.map((item, index) => {
    const ranking = index + 1;
    return {
      ...item,
      ranking,
      passed: ranking <= quota,
    };
  });
}
