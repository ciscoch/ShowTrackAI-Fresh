-- =========================================================================
-- Medical Records Database Schema Verification Script
-- =========================================================================
-- Run this script in Supabase SQL editor to verify all medical tables exist
-- and have the correct structure for the ShowTrackAI medical records system
-- =========================================================================

-- Check if medical tables exist
SELECT 'TABLE EXISTENCE CHECK' as verification_type, 
       'animal_health_records' as table_name,
       CASE WHEN EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'animal_health_records'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 'TABLE EXISTENCE CHECK' as verification_type, 
       'animal_vaccinations' as table_name,
       CASE WHEN EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'animal_vaccinations'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 'TABLE EXISTENCE CHECK' as verification_type, 
       'animal_medications' as table_name,
       CASE WHEN EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'animal_medications'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check table structure for animal_health_records
SELECT 'COLUMN CHECK' as verification_type,
       'animal_health_records' as table_name,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'animal_health_records'
ORDER BY ordinal_position;

-- Check table structure for animal_vaccinations  
SELECT 'COLUMN CHECK' as verification_type,
       'animal_vaccinations' as table_name,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'animal_vaccinations'
ORDER BY ordinal_position;

-- Check table structure for animal_medications
SELECT 'COLUMN CHECK' as verification_type,
       'animal_medications' as table_name,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'animal_medications'
ORDER BY ordinal_position;

-- Check RLS (Row Level Security) status
SELECT 'RLS CHECK' as verification_type,
       schemaname,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('animal_health_records', 'animal_vaccinations', 'animal_medications')
AND schemaname = 'public';

-- Check foreign key constraints
SELECT 'FOREIGN KEY CHECK' as verification_type,
       tc.table_name,
       tc.constraint_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('animal_health_records', 'animal_vaccinations', 'animal_medications');

-- Check indexes for performance
SELECT 'INDEX CHECK' as verification_type,
       schemaname,
       tablename,
       indexname,
       indexdef
FROM pg_indexes 
WHERE tablename IN ('animal_health_records', 'animal_vaccinations', 'animal_medications')
AND schemaname = 'public';

-- Verify RLS policies exist
SELECT 'RLS POLICY CHECK' as verification_type,
       schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual
FROM pg_policies 
WHERE tablename IN ('animal_health_records', 'animal_vaccinations', 'animal_medications')
AND schemaname = 'public';

-- Test basic insert permissions (this will fail if user doesn't have proper access)
-- Comment out this section if you want to avoid test data
/*
INSERT INTO animal_health_records (
  animal_id,
  recorded_by, 
  health_event_type,
  description,
  occurred_at
) VALUES (
  gen_random_uuid(),
  auth.uid(),
  'checkup',
  'Test health record - please delete',
  NOW()
) RETURNING id, 'TEST INSERT SUCCESSFUL' as test_result;
*/

-- Summary report
SELECT '🏥 MEDICAL DATABASE VERIFICATION COMPLETE' as summary,
       'Check results above for any missing tables or configuration issues' as next_steps;

-- Expected results for properly configured medical database:
-- ✅ animal_health_records table exists with all required columns
-- ✅ animal_vaccinations table exists with all required columns  
-- ✅ animal_medications table exists with all required columns
-- ✅ RLS is enabled on all medical tables
-- ✅ Foreign key constraints are properly configured
-- ✅ Performance indexes are in place
-- ✅ RLS policies protect data access properly

SELECT 'SETUP INSTRUCTIONS' as info_type,
'If any tables are missing, run the main database.sql script from /backend/supabase/config/database.sql' as instructions;