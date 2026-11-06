import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Value mapping helper
// ---------------------------------------------------------------------------

export interface ScaleItem {
  id: string;
  label: string;
  nilai_min: number;
  nilai_max: number;
  skor: number;
}

export function findScoreFromScale(scales: ScaleItem[], rawValue: number): number {
  if (!scales || scales.length === 0) return rawValue;
  const matched = scales.find(
    (scale) => rawValue >= scale.nilai_min && rawValue <= scale.nilai_max
  );
  if (matched) return matched.skor;

  // Fallback: if value is higher than max of all scales or lower than min
  const sorted = [...scales].sort((a, b) => a.nilai_min - b.nilai_min);
  if (rawValue < sorted[0].nilai_min) return sorted[0].skor;
  if (rawValue > sorted[sorted.length - 1].nilai_max) return sorted[sorted.length - 1].skor;

  return scales[0].skor;
}

// ---------------------------------------------------------------------------
// Schemas for Draft & Submission
// ---------------------------------------------------------------------------

export const applicationCriterionValueSchema = z.object({
  criteria_id: z.string().uuid(),
  nilai_mentah: z.number().nullable(),
  skor: z.number().nullable(),
});

export const saveApplicationDraftSchema = z.object({
  application_id: z.string().uuid(),
  period_id: z.string().uuid(),
  // Profile fields sync
  nama: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  nim: z.string().optional(),
  prodi: z.string().optional(),
  semester: z.number().min(1).max(14).optional().nullable(),
  // Criteria values
  values: z.array(applicationCriterionValueSchema),
});

export type SaveApplicationDraftInput = z.infer<typeof saveApplicationDraftSchema>;

export const submitApplicationSchema = z.object({
  application_id: z.string().uuid(),
  period_id: z.string().uuid(),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
