-- Corrected Receipt Storage Test
-- Check the actual column structure of storage.buckets

-- First, check what columns exist in storage.buckets
SELECT 
    'STORAGE BUCKETS COLUMNS' as test_section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'storage' 
AND table_name = 'buckets'
ORDER BY ordinal_position;

-- Test with correct column names (most likely structure)
SELECT 
    'RECEIPT STORAGE TEST' as test_section,
    id,
    name,
    owner,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'RECEIPTS';

-- Alternative query if the above fails
SELECT 
    'ALL STORAGE BUCKETS' as test_section,
    *
FROM storage.buckets;

-- Check if RECEIPTS bucket exists with any case variations
SELECT 
    'RECEIPTS BUCKET CHECK' as test_section,
    id,
    name,
    CASE WHEN public THEN 'Public' ELSE 'Private' END as access_level,
    created_at
FROM storage.buckets 
WHERE UPPER(id) = 'RECEIPTS' OR UPPER(name) = 'RECEIPTS';

-- Create RECEIPTS bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('RECEIPTS', 'RECEIPTS', false)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket creation
SELECT 
    'RECEIPTS BUCKET VERIFICATION' as test_section,
    id,
    name,
    public,
    created_at,
    'Receipt storage bucket ready for financial integration' as status
FROM storage.buckets 
WHERE id = 'RECEIPTS';