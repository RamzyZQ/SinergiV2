-- ============================================================================
-- Migration: 00001_enum_types.sql
-- Description: Create all custom enum types for Seleksi Beasiswa ELECTRE
-- ============================================================================

-- Status lifecycle of a scholarship period
CREATE TYPE period_status AS ENUM (
  'draft',        -- Period is being configured
  'open',         -- Period is open for applications
  'closed',       -- Application window has closed
  'verification', -- Documents are being verified
  'calculated',   -- ELECTRE calculation has been run
  'published'     -- Results have been published
);

-- Status lifecycle of a student application
CREATE TYPE application_status AS ENUM (
  'draft',      -- Application is being filled out
  'submitted',  -- Application has been submitted
  'verified',   -- Application has been verified by admin
  'rejected',   -- Application has been rejected by admin
  'passed',     -- Applicant passed the selection
  'not_passed'  -- Applicant did not pass
);

-- ELECTRE criteria type
CREATE TYPE criteria_type AS ENUM (
  'benefit', -- Higher value is better
  'cost'     -- Lower value is better
);

-- Source of criteria value
CREATE TYPE criteria_source AS ENUM (
  'input',    -- Manually inputted value
  'document'  -- Derived from uploaded document
);

-- Document verification status
CREATE TYPE verification_status AS ENUM (
  'pending',  -- Awaiting verification
  'approved', -- Document approved
  'rejected'  -- Document rejected
);

-- Type of ELECTRE calculation run
CREATE TYPE calculation_type AS ENUM (
  'official',   -- Official calculation (affects results)
  'simulation'  -- Simulation run (what-if analysis)
);

-- How the concordance/discordance threshold is determined
CREATE TYPE threshold_mode AS ENUM (
  'average', -- Use the average of the matrix values
  'manual'   -- Manually specified threshold
);

-- Notification delivery status
CREATE TYPE notification_send_status AS ENUM (
  'pending', -- Not yet sent
  'sent',    -- Successfully sent
  'failed'   -- Failed to send
);

-- Types of notifications
CREATE TYPE notification_type AS ENUM (
  'result_published',      -- Selection results have been published
  'application_verified',  -- Application has been verified
  'application_rejected',  -- Application has been rejected
  'period_opened',         -- A new period is open
  'period_closed'          -- A period has closed
);
