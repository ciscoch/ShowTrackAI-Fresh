-- Quick Business Intelligence Verification
-- Check if enhanced receipt fields are being captured

-- 1. Check if the new columns exist
SELECT 
    'SCHEMA CHECK' as test_section,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'expenses'
AND column_name IN ('business_intelligence', 'vendor_intelligence');

-- 2. Check recent expenses for BI data
SELECT 
    'RECENT EXPENSES BI STATUS' as test_section,
    id,
    description,
    amount,
    vendor,
    CASE 
        WHEN business_intelligence IS NOT NULL THEN 'HAS BI DATA'
        ELSE 'NO BI DATA'
    END as bi_status,
    CASE 
        WHEN vendor_intelligence IS NOT NULL THEN 'HAS VENDOR DATA' 
        ELSE 'NO VENDOR DATA'
    END as vendor_status,
    created_at
FROM public.expenses 
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check for JACOBY'S brand detection in recent entries
SELECT 
    'JACOBYS BRAND DETECTION' as test_section,
    id,
    description,
    vendor,
    business_intelligence->'brand_names' as captured_brands,
    business_intelligence->>'feed_type' as feed_type,
    business_intelligence->'equipment_purchased' as equipment,
    created_at
FROM public.expenses 
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
AND (
    business_intelligence->'brand_names' ? 'JACOBY''S' OR
    business_intelligence->'brand_names' ? 'JACOBYS' OR
    description ILIKE '%JACOBY%'
)
ORDER BY created_at DESC;