-- ============================================================================
-- Migration: 00002_profiles.sql
-- Description: Create profiles table and reusable updated_at trigger function
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Reusable trigger function: automatically sets updated_at on row update
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Profiles table: stores user profile information
-- Linked 1:1 with auth.users via the same UUID primary key
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama                 TEXT NOT NULL DEFAULT '',
  nim                  TEXT UNIQUE,              -- Nomor Induk Mahasiswa
  prodi                TEXT,                     -- Program Studi
  semester             INTEGER CHECK (semester >= 1 AND semester <= 14),
  privacy_consented_at TIMESTAMPTZ,              -- When user consented to privacy policy
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comment on table
COMMENT ON TABLE profiles IS 'User profile data, auto-created on registration';

-- Apply the updated_at trigger
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
