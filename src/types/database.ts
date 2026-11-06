export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nama: string;
          nim: string | null;
          prodi: string | null;
          semester: number | null;
          privacy_consented_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nama?: string;
          nim?: string | null;
          prodi?: string | null;
          semester?: number | null;
          privacy_consented_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          nim?: string | null;
          prodi?: string | null;
          semester?: number | null;
          privacy_consented_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      scholarship_periods: {
        Row: {
          id: string;
          nama: string;
          deskripsi: string | null;
          tgl_buka: string;
          tgl_tutup: string;
          kuota: number;
          status: Database['public']['Enums']['period_status'];
          threshold_c_mode: Database['public']['Enums']['threshold_mode'];
          threshold_c: number | null;
          threshold_d_mode: Database['public']['Enums']['threshold_mode'];
          threshold_d: number | null;
          tie_break_rules: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          deskripsi?: string | null;
          tgl_buka: string;
          tgl_tutup: string;
          kuota: number;
          status?: Database['public']['Enums']['period_status'];
          threshold_c_mode?: Database['public']['Enums']['threshold_mode'];
          threshold_c?: number | null;
          threshold_d_mode?: Database['public']['Enums']['threshold_mode'];
          threshold_d?: number | null;
          tie_break_rules?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          deskripsi?: string | null;
          tgl_buka?: string;
          tgl_tutup?: string;
          kuota?: number;
          status?: Database['public']['Enums']['period_status'];
          threshold_c_mode?: Database['public']['Enums']['threshold_mode'];
          threshold_c?: number | null;
          threshold_d_mode?: Database['public']['Enums']['threshold_mode'];
          threshold_d?: number | null;
          tie_break_rules?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      criteria: {
        Row: {
          id: string;
          period_id: string;
          nama: string;
          tipe: Database['public']['Enums']['criteria_type'];
          bobot: number;
          urutan: number;
          sumber_nilai: Database['public']['Enums']['criteria_source'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          period_id: string;
          nama: string;
          tipe: Database['public']['Enums']['criteria_type'];
          bobot: number;
          urutan: number;
          sumber_nilai?: Database['public']['Enums']['criteria_source'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          period_id?: string;
          nama?: string;
          tipe?: Database['public']['Enums']['criteria_type'];
          bobot?: number;
          urutan?: number;
          sumber_nilai?: Database['public']['Enums']['criteria_source'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      criteria_scales: {
        Row: {
          id: string;
          criteria_id: string;
          label: string;
          nilai_min: number;
          nilai_max: number;
          skor: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          criteria_id: string;
          label: string;
          nilai_min: number;
          nilai_max: number;
          skor: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          criteria_id?: string;
          label?: string;
          nilai_min?: number;
          nilai_max?: number;
          skor?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          period_id: string;
          status: Database['public']['Enums']['application_status'];
          submitted_at: string | null;
          catatan_admin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_id: string;
          status?: Database['public']['Enums']['application_status'];
          submitted_at?: string | null;
          catatan_admin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_id?: string;
          status?: Database['public']['Enums']['application_status'];
          submitted_at?: string | null;
          catatan_admin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_values: {
        Row: {
          id: string;
          application_id: string;
          criteria_id: string;
          nilai_mentah: number | null;
          skor: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          criteria_id: string;
          nilai_mentah?: number | null;
          skor?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          criteria_id?: string;
          nilai_mentah?: number | null;
          skor?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          application_id: string;
          jenis: string;
          storage_path: string;
          status_verifikasi: Database['public']['Enums']['verification_status'];
          verified_by: string | null;
          verified_at: string | null;
          catatan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          jenis: string;
          storage_path: string;
          status_verifikasi?: Database['public']['Enums']['verification_status'];
          verified_by?: string | null;
          verified_at?: string | null;
          catatan?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          jenis?: string;
          storage_path?: string;
          status_verifikasi?: Database['public']['Enums']['verification_status'];
          verified_by?: string | null;
          verified_at?: string | null;
          catatan?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      calculation_runs: {
        Row: {
          id: string;
          period_id: string;
          dijalankan_oleh: string;
          tipe: Database['public']['Enums']['calculation_type'];
          snapshot_kriteria: Json;
          snapshot_skala: Json;
          snapshot_threshold: Json;
          snapshot_input: Json;
          hasil_matriks: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          period_id: string;
          dijalankan_oleh: string;
          tipe?: Database['public']['Enums']['calculation_type'];
          snapshot_kriteria: Json;
          snapshot_skala: Json;
          snapshot_threshold: Json;
          snapshot_input: Json;
          hasil_matriks: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          period_id?: string;
          dijalankan_oleh?: string;
          tipe?: Database['public']['Enums']['calculation_type'];
          snapshot_kriteria?: Json;
          snapshot_skala?: Json;
          snapshot_threshold?: Json;
          snapshot_input?: Json;
          hasil_matriks?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      calculation_results: {
        Row: {
          id: string;
          run_id: string;
          application_id: string;
          dominasi: number;
          didominasi: number;
          net_score: number;
          ranking: number;
          lolos: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          application_id: string;
          dominasi?: number;
          didominasi?: number;
          net_score?: number;
          ranking: number;
          lolos?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          application_id?: string;
          dominasi?: number;
          didominasi?: number;
          net_score?: number;
          ranking?: number;
          lolos?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          aksi: string;
          entitas: string;
          entitas_id: string | null;
          sebelum: Json | null;
          sesudah: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          aksi: string;
          entitas: string;
          entitas_id?: string | null;
          sebelum?: Json | null;
          sesudah?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          aksi?: string;
          entitas?: string;
          entitas_id?: string | null;
          sebelum?: Json | null;
          sesudah?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          jenis: Database['public']['Enums']['notification_type'];
          judul: string;
          pesan: string | null;
          dibaca: boolean;
          status_kirim: Database['public']['Enums']['notification_send_status'];
          retry_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          jenis: Database['public']['Enums']['notification_type'];
          judul: string;
          pesan?: string | null;
          dibaca?: boolean;
          status_kirim?: Database['public']['Enums']['notification_send_status'];
          retry_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          jenis?: Database['public']['Enums']['notification_type'];
          judul?: string;
          pesan?: string | null;
          dibaca?: boolean;
          status_kirim?: Database['public']['Enums']['notification_send_status'];
          retry_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      period_status:
        | 'draft'
        | 'open'
        | 'closed'
        | 'verification'
        | 'calculated'
        | 'published';
      application_status:
        | 'draft'
        | 'submitted'
        | 'verified'
        | 'rejected'
        | 'passed'
        | 'not_passed';
      criteria_type: 'benefit' | 'cost';
      criteria_source: 'input' | 'document';
      verification_status: 'pending' | 'approved' | 'rejected';
      calculation_type: 'official' | 'simulation';
      threshold_mode: 'average' | 'manual';
      notification_send_status: 'pending' | 'sent' | 'failed';
      notification_type:
        | 'result_published'
        | 'application_verified'
        | 'application_rejected'
        | 'period_opened'
        | 'period_closed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];
export type UserRoleUpdate = Database['public']['Tables']['user_roles']['Update'];

export type ScholarshipPeriod = Database['public']['Tables']['scholarship_periods']['Row'];
export type ScholarshipPeriodInsert = Database['public']['Tables']['scholarship_periods']['Insert'];
export type ScholarshipPeriodUpdate = Database['public']['Tables']['scholarship_periods']['Update'];

export type Criteria = Database['public']['Tables']['criteria']['Row'];
export type CriteriaInsert = Database['public']['Tables']['criteria']['Insert'];
export type CriteriaUpdate = Database['public']['Tables']['criteria']['Update'];

export type CriteriaScale = Database['public']['Tables']['criteria_scales']['Row'];
export type CriteriaScaleInsert = Database['public']['Tables']['criteria_scales']['Insert'];
export type CriteriaScaleUpdate = Database['public']['Tables']['criteria_scales']['Update'];

export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

export type ApplicationValue = Database['public']['Tables']['application_values']['Row'];
export type ApplicationValueInsert = Database['public']['Tables']['application_values']['Insert'];
export type ApplicationValueUpdate = Database['public']['Tables']['application_values']['Update'];

export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export type CalculationRun = Database['public']['Tables']['calculation_runs']['Row'];
export type CalculationRunInsert = Database['public']['Tables']['calculation_runs']['Insert'];
export type CalculationRunUpdate = Database['public']['Tables']['calculation_runs']['Update'];

export type CalculationResult = Database['public']['Tables']['calculation_results']['Row'];
export type CalculationResultInsert = Database['public']['Tables']['calculation_results']['Insert'];
export type CalculationResultUpdate = Database['public']['Tables']['calculation_results']['Update'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type PeriodStatus = Database['public']['Enums']['period_status'];
export type ApplicationStatus = Database['public']['Enums']['application_status'];
export type CriteriaType = Database['public']['Enums']['criteria_type'];
export type CriteriaSource = Database['public']['Enums']['criteria_source'];
export type VerificationStatus = Database['public']['Enums']['verification_status'];
export type CalculationType = Database['public']['Enums']['calculation_type'];
export type ThresholdMode = Database['public']['Enums']['threshold_mode'];
export type NotificationSendStatus = Database['public']['Enums']['notification_send_status'];
export type NotificationType = Database['public']['Enums']['notification_type'];
