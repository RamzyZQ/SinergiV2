import { describe, it, expect } from 'vitest';
import { calculateElectre, ElectreCriterion, ElectreAlternative } from '@/lib/electre';

describe('ELECTRE I Pure Calculation Engine', () => {
  // -------------------------------------------------------------------------
  // 1. Classical Textbook / Literature Example Test
  // -------------------------------------------------------------------------
  it('correctly calculates textbook example matrices and net dominance ranking', () => {
    // 3 alternatives (A1, A2, A3), 3 criteria (C1 benefit, C2 benefit, C3 cost)
    const criteria: ElectreCriterion[] = [
      { id: 'c1', name: 'IPK (Benefit)', type: 'benefit', weight: 40 },
      { id: 'c2', name: 'Prestasi (Benefit)', type: 'benefit', weight: 35 },
      { id: 'c3', name: 'Penghasilan Ortu (Cost)', type: 'cost', weight: 25 },
    ];

    const alternatives: ElectreAlternative[] = [
      {
        id: 'a1',
        name: 'Mahasiswa 1',
        scores: { c1: 4, c2: 3, c3: 2 },
        metadata: { ipk: 3.8, penghasilan: 2000000, submittedAt: '2024-11-01T10:00:00Z' },
      },
      {
        id: 'a2',
        name: 'Mahasiswa 2',
        scores: { c1: 3, c2: 5, c3: 4 },
        metadata: { ipk: 3.5, penghasilan: 4000000, submittedAt: '2024-11-01T11:00:00Z' },
      },
      {
        id: 'a3',
        name: 'Mahasiswa 3',
        scores: { c1: 5, c2: 2, c3: 1 },
        metadata: { ipk: 3.9, penghasilan: 1000000, submittedAt: '2024-11-01T09:00:00Z' },
      },
    ];

    const result = calculateElectre({
      criteria,
      alternatives,
      quota: 2,
    });

    // Check dimensions
    expect(result.decisionMatrix.matrix.length).toBe(3);
    expect(result.decisionMatrix.matrix[0].length).toBe(3);
    expect(result.concordanceMatrix.matrix.length).toBe(3);
    expect(result.discordanceMatrix.matrix.length).toBe(3);
    expect(result.aggregateDominanceMatrix.matrix.length).toBe(3);

    // Diagonal elements of concordance & discordance must be 0
    for (let i = 0; i < 3; i++) {
      expect(result.concordanceMatrix.matrix[i][i]).toBe(0);
      expect(result.discordanceMatrix.matrix[i][i]).toBe(0);
      expect(result.aggregateDominanceMatrix.matrix[i][i]).toBe(0);
    }

    // Threshold c and d must be positive numbers
    expect(result.thresholdC).toBeGreaterThan(0);
    expect(result.thresholdC).toBeLessThanOrEqual(1);
    expect(result.thresholdD).toBeGreaterThanOrEqual(0);
    expect(result.thresholdD).toBeLessThanOrEqual(1);

    // Rankings length must match alternatives length
    expect(result.rankings.length).toBe(3);
    expect(result.rankings[0].ranking).toBe(1);
    expect(result.rankings[1].ranking).toBe(2);
    expect(result.rankings[2].ranking).toBe(3);

    // Quota of 2 must have top 2 passed, 3rd not passed
    expect(result.rankings[0].passed).toBe(true);
    expect(result.rankings[1].passed).toBe(true);
    expect(result.rankings[2].passed).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 2. Cost vs Benefit Logic
  // -------------------------------------------------------------------------
  it('correctly handles cost criteria where smaller value is superior', () => {
    const criteria: ElectreCriterion[] = [
      { id: 'c1', name: 'Biaya UKT (Cost)', type: 'cost', weight: 100 },
    ];

    const alternatives: ElectreAlternative[] = [
      { id: 'a1', name: 'Alternatif Murah', scores: { c1: 1000000 } }, // Better
      { id: 'a2', name: 'Alternatif Mahal', scores: { c1: 5000000 } }, // Worse
    ];

    const result = calculateElectre({ criteria, alternatives });

    // Alternatif Murah (a1) has lower cost than a2, so a1 is in concordance set C(1, 2)
    // C(1, 2) = 1.0 (weight 100%)
    expect(result.concordanceMatrix.matrix[0][1]).toBe(1);
    // C(2, 1) = 0.0 (a2 is worse than a1)
    expect(result.concordanceMatrix.matrix[1][0]).toBe(0);

    // D(1, 2) has no discordant criteria, so D(1, 2) = 0
    expect(result.discordanceMatrix.matrix[0][1]).toBe(0);
    // D(2, 1) is 1.0 (a2 is strictly worse than a1 on all discordant criteria)
    expect(result.discordanceMatrix.matrix[1][0]).toBe(1);

    // a1 dominates a2
    expect(result.rankings[0].id).toBe('a1');
    expect(result.rankings[0].netScore).toBeGreaterThan(result.rankings[1].netScore);
  });

  // -------------------------------------------------------------------------
  // 3. Edge Cases
  // -------------------------------------------------------------------------
  it('safely handles zero denominator when alternatives have identical values', () => {
    const criteria: ElectreCriterion[] = [
      { id: 'c1', name: 'C1', type: 'benefit', weight: 50 },
      { id: 'c2', name: 'C2', type: 'benefit', weight: 50 },
    ];

    const identicalAlternatives: ElectreAlternative[] = [
      { id: 'a1', name: 'Kembar A', scores: { c1: 4, c2: 4 }, metadata: { ipk: 3.8 } },
      { id: 'a2', name: 'Kembar B', scores: { c1: 4, c2: 4 }, metadata: { ipk: 3.5 } },
    ];

    // Must not throw NaN or Infinity
    const result = calculateElectre({ criteria, alternatives: identicalAlternatives });
    expect(result.discordanceMatrix.matrix[0][1]).toBe(0);
    expect(result.discordanceMatrix.matrix[1][0]).toBe(0);
    expect(Number.isNaN(result.thresholdD)).toBe(false);

    // Tie-break should rank Kembar A first due to higher IPK
    expect(result.rankings[0].id).toBe('a1');
    expect(result.rankings[1].id).toBe('a2');
  });

  it('handles single alternative without throwing division by zero', () => {
    const criteria: ElectreCriterion[] = [
      { id: 'c1', name: 'C1', type: 'benefit', weight: 100 },
    ];
    const singleAlt: ElectreAlternative[] = [
      { id: 'a1', name: 'Solo', scores: { c1: 4 } },
    ];

    const result = calculateElectre({ criteria, alternatives: singleAlt });
    expect(result.rankings.length).toBe(1);
    expect(result.rankings[0].ranking).toBe(1);
    expect(result.thresholdC).toBe(0);
    expect(result.thresholdD).toBe(0);
  });

  it('handles empty alternatives list gracefully', () => {
    const criteria: ElectreCriterion[] = [
      { id: 'c1', name: 'C1', type: 'benefit', weight: 100 },
    ];
    const result = calculateElectre({ criteria, alternatives: [] });
    expect(result.rankings).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 4. Sequential Tie-Breaking Order Test
  // -------------------------------------------------------------------------
  it('applies sequential tie-breaking (IPK -> Penghasilan -> Waktu Submit) when net scores tie', () => {
    const criteria: ElectreCriterion[] = [
      { id: 'c1', name: 'C1', type: 'benefit', weight: 50 },
      { id: 'c2', name: 'C2', type: 'benefit', weight: 50 },
    ];

    const alternatives: ElectreAlternative[] = [
      {
        id: 'a1',
        name: 'Mahasiswa 1',
        scores: { c1: 3, c2: 3 },
        metadata: { ipk: 3.75, penghasilan: 3000000, submittedAt: '2024-11-01T10:00:00Z' },
      },
      {
        id: 'a2',
        name: 'Mahasiswa 2 (IPK Lebih Tinggi)',
        scores: { c1: 3, c2: 3 },
        metadata: { ipk: 3.85, penghasilan: 3000000, submittedAt: '2024-11-01T12:00:00Z' },
      },
      {
        id: 'a3',
        name: 'Mahasiswa 3 (IPK sama dgn A1 tp ortu lebih butuh)',
        scores: { c1: 3, c2: 3 },
        metadata: { ipk: 3.75, penghasilan: 1500000, submittedAt: '2024-11-01T14:00:00Z' },
      },
    ];

    const result = calculateElectre({
      criteria,
      alternatives,
      tieBreakOrder: ['ipk', 'penghasilan', 'waktu_submit'],
    });

    // All 3 have identical scores, so net scores will be equal
    // 1st place: a2 (highest IPK 3.85)
    expect(result.rankings[0].id).toBe('a2');
    // 2nd place: a3 (IPK 3.75, lower income 1.5M vs 3M)
    expect(result.rankings[1].id).toBe('a3');
    // 3rd place: a1 (IPK 3.75, income 3M)
    expect(result.rankings[2].id).toBe('a1');
  });

  // -------------------------------------------------------------------------
  // 5. Deterministic Reproducibility
  // -------------------------------------------------------------------------
  it('produces 100% deterministic, reproducible snapshots given identical input', () => {
    const criteria: ElectreCriterion[] = [
      { id: 'c1', name: 'IPK', type: 'benefit', weight: 30 },
      { id: 'c2', name: 'Gaji', type: 'cost', weight: 40 },
      { id: 'c3', name: 'Organisasi', type: 'benefit', weight: 30 },
    ];

    const alternatives: ElectreAlternative[] = [
      { id: 'a1', name: 'Ahmad', scores: { c1: 4, c2: 2, c3: 5 } },
      { id: 'a2', name: 'Budi', scores: { c1: 3, c2: 4, c3: 3 } },
      { id: 'a3', name: 'Citra', scores: { c1: 5, c2: 1, c3: 4 } },
      { id: 'a4', name: 'Dewi', scores: { c1: 4, c2: 3, c3: 2 } },
    ];

    const run1 = calculateElectre({ criteria, alternatives, quota: 2 });
    const run2 = calculateElectre({ criteria, alternatives, quota: 2 });

    expect(run1).toEqual(run2);
    expect(JSON.stringify(run1)).toEqual(JSON.stringify(run2));
  });
});
