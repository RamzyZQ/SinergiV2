import { describe, it, expect } from 'vitest';

describe('Admin Period Lifecycle & Criteria Weight Normalization', () => {
  // 1. Weight normalization test
  it('proportionally scales arbitrary weights to exactly 100.00%', () => {
    const rawWeights = [25, 15, 30, 10]; // sum = 80
    const total = rawWeights.reduce((a, b) => a + b, 0);

    let runningTotal = 0;
    const normalized = rawWeights.map((w, i) => {
      if (i === rawWeights.length - 1) {
        return Number((100 - runningTotal).toFixed(2));
      }
      const norm = Number(((w / total) * 100).toFixed(2));
      runningTotal += norm;
      return norm;
    });

    const finalSum = normalized.reduce((a, b) => a + b, 0);
    expect(finalSum).toBe(100.00);
    expect(normalized).toEqual([31.25, 18.75, 37.5, 12.5]);
  });

  it('guarantees sum is 100.00 even with repeating fractions (e.g. 1/3)', () => {
    const rawWeights = [10, 10, 10]; // 1/3 each
    const total = rawWeights.reduce((a, b) => a + b, 0);

    let runningTotal = 0;
    const normalized = rawWeights.map((w, i) => {
      if (i === rawWeights.length - 1) {
        return Number((100 - runningTotal).toFixed(2));
      }
      const norm = Number(((w / total) * 100).toFixed(2));
      runningTotal += norm;
      return norm;
    });

    const finalSum = normalized.reduce((a, b) => a + b, 0);
    expect(finalSum).toBe(100.00);
    expect(normalized).toEqual([33.33, 33.33, 33.34]);
  });

  // 2. Scale overlap & gap detector
  interface ScaleRange {
    label: string;
    nilai_min: number;
    nilai_max: number;
    skor: number;
  }

  function detectScaleIssues(scales: ScaleRange[]) {
    const sorted = [...scales].sort((a, b) => a.nilai_min - b.nilai_min);
    const overlaps: string[] = [];
    const gaps: string[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (current.nilai_max >= next.nilai_min) {
        overlaps.push(`Overlap: [${current.nilai_min}-${current.nilai_max}] and [${next.nilai_min}-${next.nilai_max}]`);
      } else if (next.nilai_min > current.nilai_max + 1) {
        gaps.push(`Gap between ${current.nilai_max} and ${next.nilai_min}`);
      }
    }

    return { overlaps, gaps };
  }

  it('detects overlapping scale ranges', () => {
    const scalesWithOverlap: ScaleRange[] = [
      { label: 'Rendah', nilai_min: 0, nilai_max: 2000000, skor: 5 },
      { label: 'Sedang', nilai_min: 1500000, nilai_max: 4000000, skor: 3 }, // overlaps at 1.5M - 2M
    ];

    const result = detectScaleIssues(scalesWithOverlap);
    expect(result.overlaps.length).toBe(1);
    expect(result.gaps.length).toBe(0);
  });

  it('detects gaps between discrete scale ranges', () => {
    const scalesWithGap: ScaleRange[] = [
      { label: 'Rendah', nilai_min: 0, nilai_max: 2000000, skor: 5 },
      { label: 'Tinggi', nilai_min: 5000000, nilai_max: 8000000, skor: 1 }, // gap between 2M and 5M
    ];

    const result = detectScaleIssues(scalesWithGap);
    expect(result.overlaps.length).toBe(0);
    expect(result.gaps.length).toBe(1);
  });

  it('passes cleanly for contiguous non-overlapping scales', () => {
    const validScales: ScaleRange[] = [
      { label: 'IPK 2.50 - 3.00', nilai_min: 2.50, nilai_max: 3.00, skor: 2 },
      { label: 'IPK 3.01 - 3.50', nilai_min: 3.01, nilai_max: 3.50, skor: 3 },
      { label: 'IPK 3.51 - 4.00', nilai_min: 3.51, nilai_max: 4.00, skor: 5 },
    ];

    const result = detectScaleIssues(validScales);
    expect(result.overlaps.length).toBe(0);
    expect(result.gaps.length).toBe(0);
  });
});
