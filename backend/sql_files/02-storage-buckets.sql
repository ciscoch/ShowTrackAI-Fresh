-- ============================================================================
-- STORAGE BUCKETS SETUP FOR SHOWTRACK AI
-- Run this after database.sql and before policies.sql
-- ============================================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  -- Animal photos - public bucket for animal images
  ('animal-photos', 'animal-photos', true, false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  
  -- Journal photos - public bucket for journal entry images
  ('journal-photos', 'journal-photos', true, false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  
  -- Medical documents - private bucket for sensitive health records
  ('medical-documents', 'medical-documents', false, false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'text/plain']),
  
  -- Profile pictures - public bucket for user avatars
  ('profile-pictures', 'profile-pictures', true, false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  
  -- Receipts - private bucket for financial documentation
  ('receipts', 'receipts', false, false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR FILE ACCESS CONTROL
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ANIMAL PHOTOS BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload animal photos
CREATE POLICY "Users can upload animal photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'animal-photos');

-- Allow users to view animal photos they have access to
CREATE POLICY "Users can view animal photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'animal-photos' AND (
      -- Users can see their own photos
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Educators can see student photos
      EXISTS (
        SELECT 1 FROM public.profile_relationships pr
        WHERE pr.student_id::text = (storage.foldername(name))[1]
        AND pr.educator_id = auth.uid()
        AND pr.active = true
      ) OR
      -- Veterinarians can see consultation animal photos
      EXISTS (
        SELECT 1 FROM public.consultations c
        JOIN public.animals a ON c.patient_animal_id = a.id
        WHERE a.owner_id::text = (storage.foldername(name))[1]
        AND c.veterinarian_id = auth.uid()
      )
    )
  );

-- Allow users to update their own animal photos
CREATE POLICY "Users can update their own animal photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'animal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own animal photos
CREATE POLICY "Users can delete their own animal photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'animal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- JOURNAL PHOTOS BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload journal photos
CREATE POLICY "Users can upload journal photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'journal-photos');

-- Allow users to view journal photos they have access to
CREATE POLICY "Users can view journal photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'journal-photos' AND (
      -- Users can see their own photos
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Educators can see non-private student journal photos
      EXISTS (
        SELECT 1 FROM public.profile_relationships pr
        JOIN public.journal_entries je ON je.author_id = pr.student_id
        WHERE pr.student_id::text = (storage.foldername(name))[1]
        AND pr.educator_id = auth.uid()
        AND pr.active = true
        AND je.is_private = false
      )
    )
  );

-- Allow users to manage their own journal photos
CREATE POLICY "Users can manage their own journal photos" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- MEDICAL DOCUMENTS BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload medical documents
CREATE POLICY "Users can upload medical documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-documents');

-- Allow users to view medical documents they have access to
CREATE POLICY "Users can view medical documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'medical-documents' AND (
      -- Users can see their own documents
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Educators can see student medical documents
      EXISTS (
        SELECT 1 FROM public.profile_relationships pr
        WHERE pr.student_id::text = (storage.foldername(name))[1]
        AND pr.educator_id = auth.uid()
        AND pr.active = true
      ) OR
      -- Veterinarians can see consultation medical documents
      EXISTS (
        SELECT 1 FROM public.consultations c
        JOIN public.animals a ON c.patient_animal_id = a.id
        WHERE a.owner_id::text = (storage.foldername(name))[1]
        AND c.veterinarian_id = auth.uid()
      )
    )
  );

-- Allow users to manage their own medical documents
CREATE POLICY "Users can manage their own medical documents" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- PROFILE PICTURES BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload profile pictures
CREATE POLICY "Users can upload profile pictures" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures');

-- Allow anyone to view profile pictures (public bucket)
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'profile-pictures');

-- Allow users to manage their own profile pictures
CREATE POLICY "Users can manage their own profile pictures" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- RECEIPTS BUCKET POLICIES
-- ============================================================================

-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts');

-- Allow users to view receipts they have access to
CREATE POLICY "Users can view receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND (
      -- Users can see their own receipts
      auth.uid()::text = (storage.foldername(name))[1] OR
      -- Educators can see student receipts
      EXISTS (
        SELECT 1 FROM public.profile_relationships pr
        WHERE pr.student_id::text = (storage.foldername(name))[1]
        AND pr.educator_id = auth.uid()
        AND pr.active = true
      )
    )
  );

-- Allow users to manage their own receipts
CREATE POLICY "Users can manage their own receipts" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- NOTES
-- ============================================================================

-- Storage bucket configuration:
-- - File size limits are in bytes (52MB for most, 10MB for profile pictures)
-- - Public buckets allow direct URL access for images
-- - Private buckets require authentication for access
-- - Policies ensure users can only access files they own or have permission to see
-- - Folder structure: bucket/user_id/filename for user-specific files

-- After running this script:
-- 1. Verify buckets were created in Supabase Dashboard > Storage
-- 2. Test file upload functionality
-- 3. Verify access controls work as expected