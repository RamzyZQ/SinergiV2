import { describe, it, expect } from 'vitest';
import {
  PERIOD_STATUS,
  PERIOD_STATUS_LABELS,
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
} from '@/types/enums';

describe('Enums & Status Configuration', () => {
  it('should define all 6 period lifecycle stages in sequence', () => {
    expect(PERIOD_STATUS.DRAFT).toBe('draft');
    expect(PERIOD_STATUS.OPEN).toBe('open');
    expect(PERIOD_STATUS.CLOSED).toBe('closed');
    expect(PERIOD_STATUS.VERIFICATION).toBe('verification');
    expect(PERIOD_STATUS.CALCULATED).toBe('calculated');
    expect(PERIOD_STATUS.PUBLISHED).toBe('published');
  });

  it('should have Indonesian labels for all period statuses', () => {
    expect(PERIOD_STATUS_LABELS.draft).toBe('Draf');
    expect(PERIOD_STATUS_LABELS.open).toBe('Dibuka');
    expect(PERIOD_STATUS_LABELS.closed).toBe('Ditutup');
    expect(PERIOD_STATUS_LABELS.verification).toBe('Verifikasi');
    expect(PERIOD_STATUS_LABELS.calculated).toBe('Dihitung');
    expect(PERIOD_STATUS_LABELS.published).toBe('Dipublikasi');
  });

  it('should define all 6 application statuses', () => {
    expect(APPLICATION_STATUS.DRAFT).toBe('draft');
    expect(APPLICATION_STATUS.SUBMITTED).toBe('submitted');
    expect(APPLICATION_STATUS.VERIFIED).toBe('verified');
    expect(APPLICATION_STATUS.REJECTED).toBe('rejected');
    expect(APPLICATION_STATUS.PASSED).toBe('passed');
    expect(APPLICATION_STATUS.NOT_PASSED).toBe('not_passed');
  });

  it('should have Indonesian labels for all application statuses', () => {
    expect(APPLICATION_STATUS_LABELS.draft).toBe('Draf');
    expect(APPLICATION_STATUS_LABELS.submitted).toBe('Diajukan');
    expect(APPLICATION_STATUS_LABELS.verified).toBe('Terverifikasi');
    expect(APPLICATION_STATUS_LABELS.rejected).toBe('Ditolak');
    expect(APPLICATION_STATUS_LABELS.passed).toBe('Lolos');
    expect(APPLICATION_STATUS_LABELS.not_passed).toBe('Tidak Lolos');
  });
});
