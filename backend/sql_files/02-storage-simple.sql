-- ============================================================================
-- SIMPLE STORAGE BUCKETS CREATION (SQL ONLY)
-- Run this instead of the complex policy version
-- ============================================================================

-- Create storage buckets (this should work without permission issues)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('animal-photos', 'animal-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('journal-photos', 'journal-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('medical-documents', 'medical-documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'text/plain']),
  ('profile-pictures', 'profile-pictures', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('receipts', 'receipts', false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Verify buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit/1024/1024 as size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('animal-photos', 'journal-photos', 'medical-documents', 'profile-pictures', 'receipts')
ORDER BY id;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets created successfully!';
  RAISE NOTICE 'Next: Set up bucket policies manually in Supabase Dashboard > Storage';
END $$;