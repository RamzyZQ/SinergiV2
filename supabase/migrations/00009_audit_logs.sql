-- ============================================================================
-- Migration: 00009_audit_logs.sql
-- Description: Create append-only audit_logs table for tracking changes
-- ============================================================================

CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id),     -- User who performed the action (NULL for system)
  aksi       TEXT NOT NULL,                       -- Action: INSERT, UPDATE, DELETE
  entitas    TEXT NOT NULL,                       -- Table name
  entitas_id UUID,                                -- Row ID in the target table
  sebelum    JSONB,                               -- Row data before the change (NULL for INSERT)
  sesudah    JSONB,                               -- Row data after the change (NULL for DELETE)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'Append-only audit trail. No UPDATE or DELETE allowed.';

-- Indexes for efficient querying
-- Lookup by entity type and specific entity
CREATE INDEX idx_audit_logs_entitas_entitas_id ON audit_logs(entitas, entitas_id);

-- Lookup by time (most recent first)
CREATE INDEX idx_audit_logs_created_at_desc ON audit_logs(created_at DESC);
