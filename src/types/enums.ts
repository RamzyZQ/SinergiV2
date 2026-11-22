import type {
  PeriodStatus,
  ApplicationStatus,
  CriteriaType,
  CriteriaSource,
  VerificationStatus,
  CalculationType,
  ThresholdMode,
  NotificationSendStatus,
  NotificationType,
} from '@/types/database';

// ---------------------------------------------------------------------------
// Period Status
// ---------------------------------------------------------------------------

export const PERIOD_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  CLOSED: 'closed',
  VERIFICATION: 'verification',
  CALCULATED: 'calculated',
  PUBLISHED: 'published',
} as const;

export const PERIOD_STATUS_LABELS: Record<PeriodStatus, string> = {
  draft: 'Draf',
  open: 'Dibuka',
  closed: 'Ditutup',
  verification: 'Verifikasi',
  calculated: 'Dihitung',
  published: 'Dipublikasi',
};

// ---------------------------------------------------------------------------
// Application Status
// ---------------------------------------------------------------------------

export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  PASSED: 'passed',
  NOT_PASSED: 'not_passed',
} as const;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draf',
  submitted: 'Diajukan',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
  passed: 'Lolos',
  not_passed: 'Tidak Lolos',
};

// ---------------------------------------------------------------------------
// Criteria Type
// ---------------------------------------------------------------------------

export const CRITERIA_TYPE = {
  BENEFIT: 'benefit',
  COST: 'cost',
} as const;

export const CRITERIA_TYPE_LABELS: Record<CriteriaType, string> = {
  benefit: 'Benefit',
  cost: 'Cost',
};

// ---------------------------------------------------------------------------
// Criteria Source
// ---------------------------------------------------------------------------

export const CRITERIA_SOURCE = {
  INPUT: 'input',
  DOCUMENT: 'document',
} as const;

export const CRITERIA_SOURCE_LABELS: Record<CriteriaSource, string> = {
  input: 'Input Manual',
  document: 'Dokumen',
};

// ---------------------------------------------------------------------------
// Verification Status
// ---------------------------------------------------------------------------

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

// ---------------------------------------------------------------------------
// Calculation Type
// ---------------------------------------------------------------------------

export const CALCULATION_TYPE = {
  OFFICIAL: 'official',
  SIMULATION: 'simulation',
} as const;

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  official: 'Resmi',
  simulation: 'Simulasi',
};

// ---------------------------------------------------------------------------
// Threshold Mode
// ---------------------------------------------------------------------------

export const THRESHOLD_MODE = {
  AVERAGE: 'average',
  MANUAL: 'manual',
} as const;

export const THRESHOLD_MODE_LABELS: Record<ThresholdMode, string> = {
  average: 'Rata-rata',
  manual: 'Manual',
};

// ---------------------------------------------------------------------------
// Notification Send Status
// ---------------------------------------------------------------------------

export const NOTIFICATION_SEND_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export const NOTIFICATION_SEND_STATUS_LABELS: Record<NotificationSendStatus, string> = {
  pending: 'Menunggu',
  sent: 'Terkirim',
  failed: 'Gagal',
};

// ---------------------------------------------------------------------------
// Notification Type
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPE = {
  RESULT_PUBLISHED: 'result_published',
  APPLICATION_VERIFIED: 'application_verified',
  APPLICATION_REJECTED: 'application_rejected',
  PERIOD_OPENED: 'period_opened',
  PERIOD_CLOSED: 'period_closed',
} as const;

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  result_published: 'Hasil Dipublikasi',
  application_verified: 'Pendaftaran Diverifikasi',
  application_rejected: 'Pendaftaran Ditolak',
  period_opened: 'Periode Dibuka',
  period_closed: 'Periode Ditutup',
};

// ---------------------------------------------------------------------------
// Status Colors (for StatusBadge component)
// ---------------------------------------------------------------------------

export type StatusColorConfig = {
  bg: string;
  text: string;
  border: string;
  dot: string;
};

export const STATUS_COLORS: Record<string, StatusColorConfig> = {
  // General / shared
  draft: { bg: 'bg-[#F5F7FB]', text: 'text-[#8492A6]', border: 'border-[#DCE5F1]', dot: 'bg-[#8492A6]' },
  submitted: { bg: 'bg-[#EAF2FF]', text: 'text-[#263449]', border: 'border-[#DCE5F1]', dot: 'bg-[#2456A6]' },
  pending: { bg: 'bg-[#E8A23A]/10', text: 'text-[#263449]', border: 'border-[#E8A23A]', dot: 'bg-[#E8A23A]' },
  verified: { bg: 'bg-[#2E9B68]/10', text: 'text-[#2E9B68]', border: 'border-[#2E9B68]/30', dot: 'bg-[#2E9B68]' },
  approved: { bg: 'bg-[#2E9B68]/10', text: 'text-[#2E9B68]', border: 'border-[#2E9B68]/30', dot: 'bg-[#2E9B68]' },
  passed: { bg: 'bg-[#2E9B68]/10', text: 'text-[#2E9B68]', border: 'border-[#2E9B68]/30', dot: 'bg-[#2E9B68]' },
  rejected: { bg: 'bg-[#D9534F]/10', text: 'text-[#D9534F]', border: 'border-[#D9534F]/30', dot: 'bg-[#D9534F]' },
  not_passed: { bg: 'bg-[#D9534F]/10', text: 'text-[#D9534F]', border: 'border-[#D9534F]/30', dot: 'bg-[#D9534F]' },

  // Period-specific
  open: { bg: 'bg-[#EAF2FF]', text: 'text-[#2456A6]', border: 'border-[#DCE5F1]', dot: 'bg-[#2456A6]' },
  closed: { bg: 'bg-[#F5F7FB]', text: 'text-[#8492A6]', border: 'border-[#DCE5F1]', dot: 'bg-[#8492A6]' },
  verification: { bg: 'bg-[#E8A23A]/10', text: 'text-[#263449]', border: 'border-[#E8A23A]', dot: 'bg-[#E8A23A]' },
  calculated: { bg: 'bg-[#EAF2FF]', text: 'text-[#2456A6]', border: 'border-[#DCE5F1]', dot: 'bg-[#2456A6]' },
  published: { bg: 'bg-[#2E9B68]/10', text: 'text-[#2E9B68]', border: 'border-[#2E9B68]/30', dot: 'bg-[#2E9B68]' },

  // Calculation type
  simulation: { bg: 'bg-[#EAF2FF]', text: 'text-[#263449]', border: 'border-[#D9A441]', dot: 'bg-[#D9A441]' },

  // Notification send status
  sent: { bg: 'bg-[#2E9B68]/10', text: 'text-[#2E9B68]', border: 'border-[#2E9B68]/30', dot: 'bg-[#2E9B68]' },
  failed: { bg: 'bg-[#D9534F]/10', text: 'text-[#D9534F]', border: 'border-[#D9534F]/30', dot: 'bg-[#D9534F]' },
} as const;

/**
 * Get the color config for a given status string.
 * Falls back to a neutral gray style if the status is unknown.
 */
export function getStatusColor(status: string): StatusColorConfig {
  return (
    STATUS_COLORS[status] ?? {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
      dot: 'bg-gray-500',
    }
  );
}
