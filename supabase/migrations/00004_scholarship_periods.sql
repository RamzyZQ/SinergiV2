-- ============================================================================
-- Migration: 00004_scholarship_periods.sql
-- Description: Create scholarship_periods table for managing selection periods
-- ============================================================================

CREATE TABLE scholarship_periods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama             TEXT NOT NULL,                                    -- Period name
  deskripsi        TEXT,                                             -- Description
  tgl_buka         TIMESTAMPTZ NOT NULL,                             -- Opening date
  tgl_tutup        TIMESTAMPTZ NOT NULL,                             -- Closing date
  kuota            INTEGER NOT NULL CHECK (kuota > 0),               -- Number of scholarships available
  status           period_status NOT NULL DEFAULT 'draft',           -- Current lifecycle status

  -- ELECTRE threshold settings
  threshold_c_mode threshold_mode NOT NULL DEFAULT 'average',        -- Concordance threshold mode
  threshold_c      NUMERIC(5,4),                                     -- Manual concordance threshold value
  threshold_d_mode threshold_mode NOT NULL DEFAULT 'average',        -- Discordance threshold mode
  threshold_d      NUMERIC(5,4),                                     -- Manual discordance threshold value

  -- Tie-breaking rules (ordered JSON array of field names)
  tie_break_rules  JSONB NOT NULL DEFAULT '["ipk","penghasilan","waktu_submit"]'::jsonb,

  created_by       UUID REFERENCES auth.users(id),                   -- Admin who created the period
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Closing date must be after opening date
  CHECK (tgl_tutup > tgl_buka)
);

COMMENT ON TABLE scholarship_periods IS 'Scholarship selection periods with ELECTRE configuration';

-- Apply the reusable updated_at trigger
CREATE TRIGGER set_scholarship_periods_updated_at
  BEFORE UPDATE ON scholarship_periods
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
