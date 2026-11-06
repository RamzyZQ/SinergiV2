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
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  verified: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  passed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
  not_passed: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },

  // Period-specific
  open: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' },
  verification: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  calculated: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
  published: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },

  // Calculation type
  simulation: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },

  // Notification send status
  sent: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
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
