-- ============================================================================
-- Migration: 00006_applications.sql
-- Description: Create applications and application_values tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Applications table: student scholarship applications per period
-- ---------------------------------------------------------------------------
CREATE TABLE applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id      UUID NOT NULL REFERENCES scholarship_periods(id) ON DELETE CASCADE,
  status         application_status NOT NULL DEFAULT 'draft',
  submitted_at   TIMESTAMPTZ,                        -- Timestamp when application was submitted
  catatan_admin  TEXT,                                -- Admin notes/remarks
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_id)                          -- One application per user per period
);

COMMENT ON TABLE applications IS 'Student scholarship applications, one per user per period';

-- ---------------------------------------------------------------------------
-- Application values table: stores criteria values for each application
-- ---------------------------------------------------------------------------
CREATE TABLE application_values (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  criteria_id    UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  nilai_mentah   NUMERIC,                            -- Raw value entered by student
  skor           NUMERIC,                            -- Standardized score (mapped from scale)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(application_id, criteria_id)                 -- One value per criteria per application
);

COMMENT ON TABLE application_values IS 'Criteria values for each application, raw and standardized';

-- Apply updated_at triggers
CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_application_values_updated_at
  BEFORE UPDATE ON application_values
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Indexes for efficient lookups
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_period_id ON applications(period_id);
CREATE INDEX idx_application_values_application_id ON application_values(application_id);
