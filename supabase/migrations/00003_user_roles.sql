-- ============================================================================
-- Migration: 00003_user_roles.sql
-- Description: Create user_roles table, is_admin() helper, and auth trigger
-- ============================================================================

-- ---------------------------------------------------------------------------
-- User roles table: maps users to their roles (student, admin)
-- ---------------------------------------------------------------------------
CREATE TABLE user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

COMMENT ON TABLE user_roles IS 'Role assignments for users. A user can have multiple roles.';

-- ---------------------------------------------------------------------------
-- Helper function: check if the current authenticated user is an admin
-- SECURITY DEFINER so it can read user_roles regardless of RLS
-- STABLE because it does not modify data
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin() IS 'Returns true if the current user has the admin role';

-- ---------------------------------------------------------------------------
-- Auth trigger: auto-create profile and student role on new user registration
-- SECURITY DEFINER to bypass RLS when inserting into profiles/user_roles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with nama from user metadata (if provided)
  INSERT INTO public.profiles (id, nama)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', ''));

  -- Assign default 'student' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Creates profile and assigns student role on user signup';

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
