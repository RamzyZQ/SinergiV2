import { describe, it, expect } from 'vitest';
import {
  findScoreFromScale,
  ScaleItem,
  saveApplicationDraftSchema,
} from '@/lib/validators/application';

describe('Application Wizard & Scale Mapping Logic', () => {
  const sampleScales: ScaleItem[] = [
    {
      id: 'scale-1',
      label: 'Sangat Rendah (< Rp 1.500.000)',
      nilai_min: 0,
      nilai_max: 1500000,
      skor: 5,
    },
    {
      id: 'scale-2',
      label: 'Rendah (Rp 1.500.001 - Rp 3.000.000)',
      nilai_min: 1500001,
      nilai_max: 3000000,
      skor: 4,
    },
    {
      id: 'scale-3',
      label: 'Sedang (Rp 3.000.001 - Rp 5.000.000)',
      nilai_min: 3000001,
      nilai_max: 5000000,
      skor: 3,
    },
    {
      id: 'scale-4',
      label: 'Tinggi (> Rp 5.000.000)',
      nilai_min: 5000001,
      nilai_max: 10000000,
      skor: 1,
    },
  ];

  it('correctly maps raw values into matching scale scores', () => {
    // Exactly inside range 1
    expect(findScoreFromScale(sampleScales, 1000000)).toBe(5);
    // Boundary of range 1
    expect(findScoreFromScale(sampleScales, 1500000)).toBe(5);
    // Inside range 2
    expect(findScoreFromScale(sampleScales, 2500000)).toBe(4);
    // Inside range 3
    expect(findScoreFromScale(sampleScales, 4000000)).toBe(3);
    // Inside range 4
    expect(findScoreFromScale(sampleScales, 7500000)).toBe(1);
  });

  it('handles edge cases below minimum or above maximum cleanly', () => {
    // Value below min
    expect(findScoreFromScale(sampleScales, -100)).toBe(5);
    // Value above max
    expect(findScoreFromScale(sampleScales, 20000000)).toBe(1);
  });

  it('returns raw value when no scales are configured', () => {
    expect(findScoreFromScale([], 3.85)).toBe(3.85);
  });

  it('validates draft save payload correctly', () => {
    const validPayload = {
      application_id: '123e4567-e89b-12d3-a456-426614174000',
      period_id: '223e4567-e89b-12d3-a456-426614174000',
      nama: 'Budi Santoso',
      nim: '2021001',
      prodi: 'Informatika',
      semester: 5,
      values: [
        {
          criteria_id: '323e4567-e89b-12d3-a456-426614174000',
          nilai_mentah: 3.8,
          skor: 4,
        },
      ],
    };

    const parsed = saveApplicationDraftSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid semester values outside 1-14', () => {
    const invalidPayload = {
      application_id: '123e4567-e89b-12d3-a456-426614174000',
      period_id: '223e4567-e89b-12d3-a456-426614174000',
      semester: 16,
      values: [],
    };

    const parsed = saveApplicationDraftSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });
});
