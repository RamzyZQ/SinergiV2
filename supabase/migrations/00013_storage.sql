-- ============================================================================
-- Migration: 00013_storage.sql
-- Description: Create private storage bucket and policies for documents
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Create a private storage bucket for scholarship application documents
-- Max file size: 5MB
-- Allowed types: PDF, JPEG, PNG
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- ===========================================================================
-- STORAGE POLICIES
-- Path pattern: {period_id}/{user_id}/{jenis}/{filename}
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Students can upload files to their own folder
-- Path check: the second folder segment must match the user's ID
-- ---------------------------------------------------------------------------
CREATE POLICY users_upload_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Students can read their own files; admin can read all files
-- ---------------------------------------------------------------------------
CREATE POLICY users_read_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    (
      (storage.foldername(name))[2] = auth.uid()::text
      OR is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- Admin can read all files in the documents bucket
-- ---------------------------------------------------------------------------
CREATE POLICY admin_read_all ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND is_admin()
  );

-- ---------------------------------------------------------------------------
-- Students can delete their own files (for re-upload)
-- ---------------------------------------------------------------------------
CREATE POLICY users_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
