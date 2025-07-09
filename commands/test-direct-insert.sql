-- Test direct insert to journal_entries table
-- Run this in Supabase SQL Editor to test if RLS is blocking inserts

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'journal_entries';

-- Try a direct insert (this will work if RLS is properly configured)
INSERT INTO journal_entries (
    title,
    content,
    author_id,
    metadata
) VALUES (
    'Test Direct Insert',
    'Testing if RLS allows inserts',
    (SELECT id FROM auth.users LIMIT 1),
    '{"category": "Other", "duration": 15}'::jsonb
);

-- Check if the insert worked
SELECT title, content, author_id, created_at 
FROM journal_entries 
WHERE title = 'Test Direct Insert';