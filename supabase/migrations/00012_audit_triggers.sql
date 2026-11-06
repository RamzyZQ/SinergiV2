-- ============================================================================
-- Migration: 00012_audit_triggers.sql
-- Description: Create generic audit trigger function and apply to tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Generic audit trigger function
-- Records INSERT, UPDATE, and DELETE operations into audit_logs
-- SECURITY DEFINER so it can insert into audit_logs bypassing RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, aksi, entitas, entitas_id, sebelum, sesudah)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, aksi, entitas, entitas_id, sebelum, sesudah)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, aksi, entitas, entitas_id, sebelum, sesudah)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_trigger_func() IS 'Generic audit trigger that logs all DML operations';

-- ===========================================================================
-- CRITERIA — Track INSERT, UPDATE, DELETE (bobot/skala changes)
-- ===========================================================================
CREATE TRIGGER audit_criteria_insert
  AFTER INSERT ON criteria
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_criteria_update
  AFTER UPDATE ON criteria
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_criteria_delete
  AFTER DELETE ON criteria
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ===========================================================================
-- CRITERIA_SCALES — Track INSERT, UPDATE, DELETE
-- ===========================================================================
CREATE TRIGGER audit_criteria_scales_insert
  AFTER INSERT ON criteria_scales
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_criteria_scales_update
  AFTER UPDATE ON criteria_scales
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_criteria_scales_delete
  AFTER DELETE ON criteria_scales
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ===========================================================================
-- SCHOLARSHIP_PERIODS — Track UPDATE on status column
-- ===========================================================================
CREATE TRIGGER audit_scholarship_periods_update
  AFTER UPDATE ON scholarship_periods
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION audit_trigger_func();

-- ===========================================================================
-- APPLICATIONS — Track UPDATE on status column
-- ===========================================================================
CREATE TRIGGER audit_applications_update
  AFTER UPDATE ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION audit_trigger_func();

-- ===========================================================================
-- DOCUMENTS — Track UPDATE on status_verifikasi
-- ===========================================================================
CREATE TRIGGER audit_documents_update
  AFTER UPDATE ON documents
  FOR EACH ROW
  WHEN (OLD.status_verifikasi IS DISTINCT FROM NEW.status_verifikasi)
  EXECUTE FUNCTION audit_trigger_func();

-- ===========================================================================
-- CALCULATION_RUNS — Track INSERT (when calculations are performed)
-- ===========================================================================
CREATE TRIGGER audit_calculation_runs_insert
  AFTER INSERT ON calculation_runs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
