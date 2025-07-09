-- ============================================================================
-- ShowTrackAI Supabase Integration Verification Script
-- ============================================================================
-- This script verifies that animals and journal entries have been properly 
-- integrated with the Supabase database
-- ============================================================================

-- Check if core tables exist
SELECT 'Checking if core tables exist...' as status;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'animals', 'journal_entries', 'animal_weights', 'animal_photos')
ORDER BY table_name;

-- ============================================================================
-- PROFILES VERIFICATION
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'PROFILES VERIFICATION' as section;
SELECT '============================================================================' as separator;

-- Count total profiles
SELECT 
  'Total Profiles:' as metric,
  COUNT(*) as count
FROM public.profiles;

-- Profile breakdown by role
SELECT 
  'Profiles by Role:' as metric,
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- Profile breakdown by subscription tier
SELECT 
  'Profiles by Subscription:' as metric,
  subscription_tier,
  COUNT(*) as count
FROM public.profiles
GROUP BY subscription_tier
ORDER BY count DESC;

-- Recent profiles (last 7 days)
SELECT 
  'Recent Profiles (Last 7 Days):' as metric,
  COUNT(*) as count
FROM public.profiles
WHERE created_at >= NOW() - INTERVAL '7 days';

-- ============================================================================
-- ANIMALS VERIFICATION
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'ANIMALS VERIFICATION' as section;
SELECT '============================================================================' as separator;

-- Count total animals
SELECT 
  'Total Animals:' as metric,
  COUNT(*) as count
FROM public.animals;

-- Animals by species
SELECT 
  'Animals by Species:' as metric,
  species,
  COUNT(*) as count
FROM public.animals
GROUP BY species
ORDER BY count DESC;

-- Animals by health status
SELECT 
  'Animals by Health Status:' as metric,
  health_status,
  COUNT(*) as count
FROM public.animals
GROUP BY health_status
ORDER BY count DESC;

-- Recent animals (last 7 days)
SELECT 
  'Recent Animals (Last 7 Days):' as metric,
  COUNT(*) as count
FROM public.animals
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Animals with photos
SELECT 
  'Animals with Photos:' as metric,
  COUNT(DISTINCT a.id) as animals_with_photos,
  COUNT(ap.id) as total_photos
FROM public.animals a
LEFT JOIN public.animal_photos ap ON a.id = ap.animal_id
WHERE ap.id IS NOT NULL;

-- Animals with weight records
SELECT 
  'Animals with Weight Records:' as metric,
  COUNT(DISTINCT a.id) as animals_with_weights,
  COUNT(aw.id) as total_weight_records
FROM public.animals a
LEFT JOIN public.animal_weights aw ON a.id = aw.animal_id
WHERE aw.id IS NOT NULL;

-- Sample animal data (first 5 animals)
SELECT 
  'Sample Animal Data:' as section,
  a.name,
  a.species,
  a.breed,
  a.current_weight,
  a.health_status,
  p.full_name as owner_name,
  a.created_at
FROM public.animals a
JOIN public.profiles p ON a.owner_id = p.id
ORDER BY a.created_at DESC
LIMIT 5;

-- ============================================================================
-- JOURNAL ENTRIES VERIFICATION
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'JOURNAL ENTRIES VERIFICATION' as section;
SELECT '============================================================================' as separator;

-- Count total journal entries
SELECT 
  'Total Journal Entries:' as metric,
  COUNT(*) as count
FROM public.journal_entries;

-- Journal entries by type
SELECT 
  'Journal Entries by Type:' as metric,
  entry_type,
  COUNT(*) as count
FROM public.journal_entries
GROUP BY entry_type
ORDER BY count DESC;

-- Recent journal entries (last 7 days)
SELECT 
  'Recent Journal Entries (Last 7 Days):' as metric,
  COUNT(*) as count
FROM public.journal_entries
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Journal entries with animal associations
SELECT 
  'Journal Entries with Animals:' as metric,
  COUNT(*) as count
FROM public.journal_entries
WHERE animal_id IS NOT NULL;

-- Journal entries with photos
SELECT 
  'Journal Entries with Photos:' as metric,
  COUNT(DISTINCT je.id) as entries_with_photos,
  COUNT(jp.id) as total_photos
FROM public.journal_entries je
LEFT JOIN public.journal_photos jp ON je.id = jp.journal_entry_id
WHERE jp.id IS NOT NULL;

-- Sample journal entries (first 5)
SELECT 
  'Sample Journal Entries:' as section,
  je.title,
  je.entry_type,
  CASE 
    WHEN je.animal_id IS NOT NULL THEN a.name 
    ELSE 'No specific animal' 
  END as associated_animal,
  p.full_name as author_name,
  je.created_at
FROM public.journal_entries je
JOIN public.profiles p ON je.author_id = p.id
LEFT JOIN public.animals a ON je.animal_id = a.id
ORDER BY je.created_at DESC
LIMIT 5;

-- ============================================================================
-- WEIGHT TRACKING VERIFICATION
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'WEIGHT TRACKING VERIFICATION' as section;
SELECT '============================================================================' as separator;

-- Count total weight records
SELECT 
  'Total Weight Records:' as metric,
  COUNT(*) as count
FROM public.animal_weights;

-- Weight records by measurement method
SELECT 
  'Weight Records by Method:' as metric,
  measurement_method,
  COUNT(*) as count
FROM public.animal_weights
GROUP BY measurement_method
ORDER BY count DESC;

-- Recent weight records (last 7 days)
SELECT 
  'Recent Weight Records (Last 7 Days):' as metric,
  COUNT(*) as count
FROM public.animal_weights
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Average weights by species
SELECT 
  'Average Weights by Species:' as metric,
  a.species,
  ROUND(AVG(aw.weight), 2) as avg_weight,
  COUNT(aw.id) as weight_records
FROM public.animal_weights aw
JOIN public.animals a ON aw.animal_id = a.id
GROUP BY a.species
ORDER BY avg_weight DESC;

-- ============================================================================
-- DATA RELATIONSHIPS VERIFICATION
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'DATA RELATIONSHIPS VERIFICATION' as section;
SELECT '============================================================================' as separator;

-- Animals per user
SELECT 
  'Animals per User:' as metric,
  p.full_name as user_name,
  p.role,
  COUNT(a.id) as animal_count
FROM public.profiles p
LEFT JOIN public.animals a ON p.id = a.owner_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.role
HAVING COUNT(a.id) > 0
ORDER BY animal_count DESC
LIMIT 10;

-- Journal entries per user
SELECT 
  'Journal Entries per User:' as metric,
  p.full_name as user_name,
  p.role,
  COUNT(je.id) as journal_count
FROM public.profiles p
LEFT JOIN public.journal_entries je ON p.id = je.author_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.role
HAVING COUNT(je.id) > 0
ORDER BY journal_count DESC
LIMIT 10;

-- Most active users (combined animals + journal entries)
SELECT 
  'Most Active Users:' as metric,
  p.full_name as user_name,
  COUNT(DISTINCT a.id) as animals,
  COUNT(DISTINCT je.id) as journal_entries,
  (COUNT(DISTINCT a.id) + COUNT(DISTINCT je.id)) as total_activity
FROM public.profiles p
LEFT JOIN public.animals a ON p.id = a.owner_id
LEFT JOIN public.journal_entries je ON p.id = je.author_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name
HAVING (COUNT(DISTINCT a.id) + COUNT(DISTINCT je.id)) > 0
ORDER BY total_activity DESC
LIMIT 10;

-- ============================================================================
-- RECENT ACTIVITY SUMMARY
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'RECENT ACTIVITY SUMMARY (Last 24 Hours)' as section;
SELECT '============================================================================' as separator;

-- Activity in last 24 hours
SELECT 
  'New Profiles (24h):' as activity_type,
  COUNT(*) as count
FROM public.profiles
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'New Animals (24h):' as activity_type,
  COUNT(*) as count
FROM public.animals
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'New Journal Entries (24h):' as activity_type,
  COUNT(*) as count
FROM public.journal_entries
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'New Weight Records (24h):' as activity_type,
  COUNT(*) as count
FROM public.animal_weights
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'New Photos (24h):' as activity_type,
  COUNT(*) as count
FROM public.animal_photos
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'DATA INTEGRITY CHECKS' as section;
SELECT '============================================================================' as separator;

-- Orphaned animals (animals without valid owner)
SELECT 
  'Orphaned Animals:' as integrity_check,
  COUNT(*) as count
FROM public.animals a
LEFT JOIN public.profiles p ON a.owner_id = p.id
WHERE p.id IS NULL;

-- Orphaned journal entries (entries without valid author)
SELECT 
  'Orphaned Journal Entries:' as integrity_check,
  COUNT(*) as count
FROM public.journal_entries je
LEFT JOIN public.profiles p ON je.author_id = p.id
WHERE p.id IS NULL;

-- Journal entries with invalid animal references
SELECT 
  'Journal Entries with Invalid Animal Refs:' as integrity_check,
  COUNT(*) as count
FROM public.journal_entries je
LEFT JOIN public.animals a ON je.animal_id = a.id
WHERE je.animal_id IS NOT NULL AND a.id IS NULL;

-- Weight records with invalid animal references
SELECT 
  'Weight Records with Invalid Animal Refs:' as integrity_check,
  COUNT(*) as count
FROM public.animal_weights aw
LEFT JOIN public.animals a ON aw.animal_id = a.id
WHERE a.id IS NULL;

-- ============================================================================
-- STORAGE AND PERFORMANCE METRICS
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'STORAGE AND PERFORMANCE METRICS' as section;
SELECT '============================================================================' as separator;

-- Table sizes
SELECT 
  'Table Storage Usage:' as metric,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'animals', 'journal_entries', 'animal_weights', 'animal_photos', 'journal_photos')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Total database size
SELECT 
  'Total Database Size:' as metric,
  pg_size_pretty(pg_database_size(current_database())) as size;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT '============================================================================' as separator;
SELECT 'INTEGRATION VERIFICATION SUMMARY' as section;
SELECT '============================================================================' as separator;

WITH summary_stats AS (
  SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'student') as student_count,
    (SELECT COUNT(*) FROM public.animals) as animal_count,
    (SELECT COUNT(*) FROM public.journal_entries) as journal_count,
    (SELECT COUNT(*) FROM public.animal_weights) as weight_count,
    (SELECT COUNT(*) FROM public.animal_photos) as photo_count
)
SELECT 
  'SUMMARY:' as report,
  student_count || ' students managing ' || 
  animal_count || ' animals with ' || 
  journal_count || ' journal entries, ' || 
  weight_count || ' weight records, and ' || 
  photo_count || ' photos uploaded.' as integration_status
FROM summary_stats;

-- Check if integration is working (basic health check)
WITH health_check AS (
  SELECT 
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) > 0 
       AND (SELECT COUNT(*) FROM public.animals) > 0 
       AND (SELECT COUNT(*) FROM public.journal_entries) > 0
      THEN '✅ INTEGRATION WORKING'
      ELSE '❌ INTEGRATION ISSUES DETECTED'
    END as status
)
SELECT 
  'HEALTH CHECK:' as report,
  status as integration_health
FROM health_check;

SELECT '============================================================================' as separator;
SELECT 'End of Verification Report' as section;
SELECT '============================================================================' as separator;