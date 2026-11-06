-- ============================================================================
-- Migration: 00008_calculation.sql
-- Description: Create calculation_runs and calculation_results tables
--              for ELECTRE method computation tracking
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Calculation runs: records each ELECTRE computation with full snapshots
-- Snapshots ensure reproducibility even if criteria/scales change later
-- ---------------------------------------------------------------------------
CREATE TABLE calculation_runs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id          UUID NOT NULL REFERENCES scholarship_periods(id) ON DELETE CASCADE,
  dijalankan_oleh    UUID NOT NULL REFERENCES auth.users(id),          -- Admin who ran the calculation
  tipe               calculation_type NOT NULL DEFAULT 'simulation',   -- Official or simulation
  snapshot_kriteria  JSONB NOT NULL,                                    -- Frozen criteria at run time
  snapshot_skala     JSONB NOT NULL,                                    -- Frozen scales at run time
  snapshot_threshold JSONB NOT NULL,                                    -- Frozen threshold settings
  snapshot_input     JSONB NOT NULL,                                    -- Frozen application values
  hasil_matriks      JSONB NOT NULL,                                    -- Full ELECTRE matrices output
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE calculation_runs IS 'ELECTRE calculation runs with immutable data snapshots';

-- ---------------------------------------------------------------------------
-- Calculation results: per-application results from a calculation run
-- ---------------------------------------------------------------------------
CREATE TABLE calculation_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         UUID NOT NULL REFERENCES calculation_runs(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  dominasi       INTEGER NOT NULL DEFAULT 0,       -- Number of alternatives this one dominates
  didominasi     INTEGER NOT NULL DEFAULT 0,       -- Number of alternatives that dominate this one
  net_score      INTEGER NOT NULL DEFAULT 0,       -- dominasi - didominasi
  ranking        INTEGER NOT NULL,                 -- Final ranking position
  lolos          BOOLEAN NOT NULL DEFAULT false,    -- Whether applicant passed
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_id, application_id)                    -- One result per application per run
);

COMMENT ON TABLE calculation_results IS 'Individual applicant results from an ELECTRE calculation run';

-- Indexes for efficient lookups
CREATE INDEX idx_calculation_runs_period_id ON calculation_runs(period_id);
CREATE INDEX idx_calculation_results_run_id ON calculation_results(run_id);
