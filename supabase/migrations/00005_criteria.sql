-- ============================================================================
-- Migration: 00005_criteria.sql
-- Description: Create criteria and criteria_scales tables for ELECTRE method
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Criteria table: defines evaluation criteria for each period
-- ---------------------------------------------------------------------------
CREATE TABLE criteria (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id    UUID NOT NULL REFERENCES scholarship_periods(id) ON DELETE CASCADE,
  nama         TEXT NOT NULL,                                          -- Criteria name
  tipe         criteria_type NOT NULL,                                 -- benefit or cost
  bobot        NUMERIC(5,2) NOT NULL CHECK (bobot > 0 AND bobot <= 100), -- Weight (percentage)
  urutan       INTEGER NOT NULL,                                       -- Display/processing order
  sumber_nilai criteria_source NOT NULL DEFAULT 'input',               -- Value source
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(period_id, urutan)                                            -- Order must be unique per period
);

COMMENT ON TABLE criteria IS 'ELECTRE evaluation criteria per scholarship period';

-- ---------------------------------------------------------------------------
-- Criteria scales table: defines the scoring scale for each criterion
-- Maps raw value ranges to standardized scores
-- ---------------------------------------------------------------------------
CREATE TABLE criteria_scales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,                          -- Human-readable label for this range
  nilai_min   NUMERIC NOT NULL,                       -- Minimum raw value (inclusive)
  nilai_max   NUMERIC NOT NULL,                       -- Maximum raw value (inclusive)
  skor        NUMERIC NOT NULL CHECK (skor > 0),      -- Standardized score
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (nilai_max >= nilai_min)                       -- Max must be >= min
);

COMMENT ON TABLE criteria_scales IS 'Scoring scales that map raw value ranges to standardized scores';

-- Apply updated_at trigger to criteria (criteria_scales has no updated_at)
CREATE TRIGGER set_criteria_updated_at
  BEFORE UPDATE ON criteria
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Index for efficient lookup of criteria by period
CREATE INDEX idx_criteria_period_id ON criteria(period_id);
