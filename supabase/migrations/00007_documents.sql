-- ============================================================================
-- Migration: 00007_documents.sql
-- Description: Create documents table for application file uploads
-- ============================================================================

CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  jenis             TEXT NOT NULL,                                    -- Document type (e.g., KTM, transkrip)
  storage_path      TEXT NOT NULL,                                    -- Path in Supabase Storage
  status_verifikasi verification_status NOT NULL DEFAULT 'pending',   -- Verification status
  verified_by       UUID REFERENCES auth.users(id),                   -- Admin who verified
  verified_at       TIMESTAMPTZ,                                      -- When verification occurred
  catatan           TEXT,                                              -- Verification notes
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE documents IS 'Uploaded documents for scholarship applications';

-- Apply updated_at trigger
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Index for efficient lookup by application
CREATE INDEX idx_documents_application_id ON documents(application_id);
