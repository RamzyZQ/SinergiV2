-- ============================================================================
-- Migration: 00011_rls_policies.sql
-- Description: Enable RLS on ALL tables and create explicit security policies
-- ============================================================================

-- ===========================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ===========================================================================
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria            ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_scales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_values  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- PROFILES POLICIES
-- ===========================================================================

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admin can read all profiles
CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT TO authenticated
  USING (is_admin());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow insert for own profile (needed by handle_new_user trigger context)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ===========================================================================
-- USER_ROLES POLICIES
-- ===========================================================================

-- Users can see their own roles
CREATE POLICY user_roles_select_own ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin can see all roles
CREATE POLICY user_roles_select_admin ON user_roles
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can manage roles (INSERT/DELETE)
CREATE POLICY user_roles_manage_admin_insert ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY user_roles_manage_admin_delete ON user_roles
  FOR DELETE TO authenticated
  USING (is_admin());

-- NOTE: handle_new_user() is SECURITY DEFINER, so it bypasses RLS.
-- No client-side INSERT policy is needed for regular users.

-- ===========================================================================
-- SCHOLARSHIP_PERIODS POLICIES
-- ===========================================================================

-- Any authenticated user can view periods
CREATE POLICY periods_select_authenticated ON scholarship_periods
  FOR SELECT TO authenticated
  USING (true);

-- Only admin can create periods
CREATE POLICY periods_insert_admin ON scholarship_periods
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Only admin can update periods
CREATE POLICY periods_update_admin ON scholarship_periods
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ===========================================================================
-- CRITERIA POLICIES
-- ===========================================================================

-- Any authenticated user can view criteria
CREATE POLICY criteria_select_authenticated ON criteria
  FOR SELECT TO authenticated
  USING (true);

-- Only admin can create criteria
CREATE POLICY criteria_insert_admin ON criteria
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Only admin can update criteria
CREATE POLICY criteria_update_admin ON criteria
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admin can delete criteria
CREATE POLICY criteria_delete_admin ON criteria
  FOR DELETE TO authenticated
  USING (is_admin());

-- ===========================================================================
-- CRITERIA_SCALES POLICIES
-- ===========================================================================

-- Any authenticated user can view scales
CREATE POLICY scales_select_authenticated ON criteria_scales
  FOR SELECT TO authenticated
  USING (true);

-- Only admin can create scales
CREATE POLICY scales_insert_admin ON criteria_scales
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Only admin can update scales
CREATE POLICY scales_update_admin ON criteria_scales
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admin can delete scales
CREATE POLICY scales_delete_admin ON criteria_scales
  FOR DELETE TO authenticated
  USING (is_admin());

-- ===========================================================================
-- APPLICATIONS POLICIES
-- ===========================================================================

-- Students can view their own applications
CREATE POLICY applications_select_own ON applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin can view all applications
CREATE POLICY applications_select_admin ON applications
  FOR SELECT TO authenticated
  USING (is_admin());

-- Students can create applications for themselves
CREATE POLICY applications_insert_own ON applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Students can update own application ONLY when status is draft AND period is open
CREATE POLICY applications_update_own ON applications
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'draft'
    AND EXISTS (
      SELECT 1 FROM scholarship_periods sp
      WHERE sp.id = period_id AND sp.status = 'open'
    )
  )
  WITH CHECK (user_id = auth.uid());

-- Admin can update any application (for status changes, notes, etc.)
CREATE POLICY applications_update_admin ON applications
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ===========================================================================
-- APPLICATION_VALUES POLICIES
-- ===========================================================================

-- Students can view values for their own applications
CREATE POLICY app_values_select_own ON application_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

-- Admin can view all application values
CREATE POLICY app_values_select_admin ON application_values
  FOR SELECT TO authenticated
  USING (is_admin());

-- Students can insert values for own applications when app is draft and period is open
CREATE POLICY app_values_insert_own ON application_values
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN scholarship_periods sp ON sp.id = a.period_id
      WHERE a.id = application_id
        AND a.user_id = auth.uid()
        AND a.status = 'draft'
        AND sp.status = 'open'
    )
  );

-- Students can update values for own applications when app is draft and period is open
CREATE POLICY app_values_update_own ON application_values
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN scholarship_periods sp ON sp.id = a.period_id
      WHERE a.id = application_id
        AND a.user_id = auth.uid()
        AND a.status = 'draft'
        AND sp.status = 'open'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN scholarship_periods sp ON sp.id = a.period_id
      WHERE a.id = application_id
        AND a.user_id = auth.uid()
        AND a.status = 'draft'
        AND sp.status = 'open'
    )
  );

-- Admin can manage all application values (INSERT, UPDATE, DELETE)
CREATE POLICY app_values_manage_admin ON application_values
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ===========================================================================
-- DOCUMENTS POLICIES
-- ===========================================================================

-- Students can view their own documents
CREATE POLICY documents_select_own ON documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

-- Admin can view all documents
CREATE POLICY documents_select_admin ON documents
  FOR SELECT TO authenticated
  USING (is_admin());

-- Students can upload documents for their own applications
CREATE POLICY documents_insert_own ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

-- Admin can update documents (verification status, notes)
CREATE POLICY documents_update_admin ON documents
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ===========================================================================
-- CALCULATION_RUNS POLICIES
-- ===========================================================================

-- Admin can view all calculation runs
CREATE POLICY calc_runs_select_admin ON calculation_runs
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can create calculation runs
CREATE POLICY calc_runs_insert_admin ON calculation_runs
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Students can view official runs for published periods only
CREATE POLICY calc_runs_select_published ON calculation_runs
  FOR SELECT TO authenticated
  USING (
    tipe = 'official'
    AND EXISTS (
      SELECT 1 FROM scholarship_periods sp
      WHERE sp.id = period_id AND sp.status = 'published'
    )
  );

-- ===========================================================================
-- CALCULATION_RESULTS POLICIES
-- ===========================================================================

-- Admin can view all results
CREATE POLICY calc_results_select_admin ON calculation_results
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can insert results
CREATE POLICY calc_results_insert_admin ON calculation_results
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Students can view their own results for published periods (official runs only)
CREATE POLICY calc_results_select_own_published ON calculation_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calculation_runs cr
      JOIN scholarship_periods sp ON sp.id = cr.period_id
      WHERE cr.id = run_id
        AND cr.tipe = 'official'
        AND sp.status = 'published'
    )
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

-- ===========================================================================
-- AUDIT_LOGS POLICIES
-- ===========================================================================
-- Audit logs are append-only. NO UPDATE or DELETE policies.
-- SECURITY DEFINER functions (triggers) bypass RLS for INSERT.
-- Service role also bypasses RLS.

-- Admin can view audit logs
CREATE POLICY audit_logs_select_admin ON audit_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- Allow authenticated users to insert (audit triggers use SECURITY DEFINER
-- which bypasses RLS, but this policy allows direct inserts if needed)
CREATE POLICY audit_logs_insert_authenticated ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- NO UPDATE OR DELETE POLICIES — audit logs are immutable

-- ===========================================================================
-- NOTIFICATIONS POLICIES
-- ===========================================================================

-- Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin/system can insert notifications
CREATE POLICY notifications_insert_admin ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Admin can view all notifications
CREATE POLICY notifications_select_admin ON notifications
  FOR SELECT TO authenticated
  USING (is_admin());
