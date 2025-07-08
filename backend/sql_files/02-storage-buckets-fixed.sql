-- ============================================================================
-- STORAGE BUCKETS SETUP FOR SHOWTRACK AI (DASHBOARD METHOD)
-- ============================================================================

-- NOTE: The storage.objects table policies require special permissions.
-- Instead of running SQL, use the Supabase Dashboard Storage section.

-- ============================================================================
-- STEP 1: CREATE BUCKETS USING SUPABASE DASHBOARD
-- ============================================================================

-- Go to Supabase Dashboard > Storage > Create Bucket
-- Create these buckets manually:

-- 1. Bucket: animal-photos
--    - Public: Yes
--    - File size limit: 50MB
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- 2. Bucket: journal-photos  
--    - Public: Yes
--    - File size limit: 50MB
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- 3. Bucket: medical-documents
--    - Public: No
--    - File size limit: 50MB
--    - Allowed MIME types: image/jpeg, image/png, application/pdf, text/plain

-- 4. Bucket: profile-pictures
--    - Public: Yes
--    - File size limit: 10MB
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- 5. Bucket: receipts
--    - Public: No
--    - File size limit: 50MB
--    - Allowed MIME types: image/jpeg, image/png, application/pdf

-- ============================================================================
-- STEP 2: ONLY RUN THIS SQL (Basic bucket creation)
-- ============================================================================

-- Create storage buckets (this part should work)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('animal-photos', 'animal-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('journal-photos', 'journal-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('medical-documents', 'medical-documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'text/plain']),
  ('profile-pictures', 'profile-pictures', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('receipts', 'receipts', false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('animal-photos', 'journal-photos', 'medical-documents', 'profile-pictures', 'receipts')
ORDER BY id;

-- ============================================================================
-- NOTES FOR MANUAL POLICY SETUP
-- ============================================================================

-- After creating buckets, you need to set up RLS policies manually.
-- Go to: Supabase Dashboard > Storage > [bucket-name] > Policies

-- For each bucket, create these policies:

-- ANIMAL-PHOTOS BUCKET:
-- 1. Policy Name: "Users can upload animal photos"
--    Operation: INSERT
--    Target Roles: authenticated
--    Using Expression: true
--    With Check: bucket_id = 'animal-photos'

-- 2. Policy Name: "Users can view accessible animal photos"  
--    Operation: SELECT
--    Target Roles: authenticated
--    Using Expression: bucket_id = 'animal-photos'

-- 3. Policy Name: "Users can update own animal photos"
--    Operation: UPDATE  
--    Target Roles: authenticated
--    Using Expression: bucket_id = 'animal-photos' AND auth.uid()::text = (storage.foldername(name))[1]

-- 4. Policy Name: "Users can delete own animal photos"
--    Operation: DELETE
--    Target Roles: authenticated  
--    Using Expression: bucket_id = 'animal-photos' AND auth.uid()::text = (storage.foldername(name))[1]

-- REPEAT SIMILAR POLICIES FOR OTHER BUCKETS

-- ============================================================================
-- ALTERNATIVE: Use Supabase CLI (if available)
-- ============================================================================

-- If you have Supabase CLI access, you can create buckets with:
-- supabase storage create animal-photos --public
-- supabase storage create journal-photos --public  
-- supabase storage create medical-documents --private
-- supabase storage create profile-pictures --public
-- supabase storage create receipts --private