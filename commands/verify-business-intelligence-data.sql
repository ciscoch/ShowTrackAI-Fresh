-- Verify Business Intelligence Data Storage
-- Check if enhanced receipt fields were properly saved to Supabase

-- 1. Check if the business intelligence columns exist
SELECT 
    'SCHEMA VERIFICATION' as test_section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'expenses'
AND column_name IN ('business_intelligence', 'vendor_intelligence')
ORDER BY column_name;

-- 2. Check recent expenses with business intelligence data
SELECT 
    'RECENT EXPENSES WITH BI DATA' as test_section,
    id,
    description,
    amount,
    vendor,
    category,
    CASE 
        WHEN business_intelligence IS NOT NULL THEN 'Has BI Data'
        ELSE 'No BI Data'
    END as bi_status,
    CASE 
        WHEN vendor_intelligence IS NOT NULL THEN 'Has Vendor Data'
        ELSE 'No Vendor Data'
    END as vendor_status,
    created_at
FROM public.expenses 
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Extract business intelligence fields from recent expenses
SELECT 
    'BUSINESS INTELLIGENCE DETAILS' as test_section,
    id,
    description,
    amount,
    
    -- Extract feed type
    business_intelligence->>'feed_type' as feed_type,
    
    -- Extract brand names
    business_intelligence->'brand_names' as brand_names,
    
    -- Extract equipment purchased
    business_intelligence->'equipment_purchased' as equipment_purchased,
    
    -- Extract seasonal indicator
    business_intelligence->>'seasonal_indicator' as seasonal_indicator,
    
    -- Check if bulk purchase indicators exist
    CASE 
        WHEN business_intelligence->'bulk_purchase_indicators' IS NOT NULL 
        THEN 'Has Bulk Data'
        ELSE 'No Bulk Data'
    END as bulk_data_status,
    
    created_at
FROM public.expenses 
WHERE business_intelligence IS NOT NULL
AND created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Extract vendor intelligence details
SELECT 
    'VENDOR INTELLIGENCE DETAILS' as test_section,
    id,
    vendor,
    amount,
    
    -- Extract vendor address
    vendor_intelligence->>'vendor_address' as vendor_address,
    
    -- Extract vendor phone
    vendor_intelligence->>'vendor_phone' as vendor_phone,
    
    -- Extract vendor category
    vendor_intelligence->>'vendor_category' as vendor_category,
    
    -- Extract payment method
    vendor_intelligence->>'payment_method' as payment_method,
    
    -- Extract transaction time
    vendor_intelligence->>'transaction_time' as transaction_time,
    
    -- Extract tax information
    vendor_intelligence->>'tax_rate' as tax_rate,
    vendor_intelligence->>'tax_amount' as tax_amount,
    
    created_at
FROM public.expenses 
WHERE vendor_intelligence IS NOT NULL
AND created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if any feed-related business intelligence was captured
SELECT 
    'FEED ANALYTICS VERIFICATION' as test_section,
    COUNT(*) as total_feed_expenses,
    COUNT(CASE WHEN business_intelligence->>'feed_type' IS NOT NULL THEN 1 END) as expenses_with_feed_type,
    COUNT(CASE WHEN business_intelligence->'brand_names' IS NOT NULL THEN 1 END) as expenses_with_brands,
    
    -- Sample feed types captured
    array_agg(DISTINCT business_intelligence->>'feed_type') FILTER (WHERE business_intelligence->>'feed_type' IS NOT NULL) as captured_feed_types,
    
    -- Sample brands captured
    array_agg(DISTINCT brand.value) FILTER (WHERE brand.value IS NOT NULL) as captured_brands
    
FROM public.expenses,
LATERAL jsonb_array_elements_text(COALESCE(business_intelligence->'brand_names', '[]'::jsonb)) as brand(value)
WHERE category = 'feed_supplies'
AND created_at >= CURRENT_DATE - INTERVAL '1 day';

-- 6. Verify the enhanced receipt from STRUTTY'S specifically
SELECT 
    'STRUTTYS RECEIPT VERIFICATION' as test_section,
    id,
    description,
    amount,
    vendor,
    
    -- Check for JACOBY'S brand detection
    CASE 
        WHEN business_intelligence->'brand_names' ? 'JACOBY''S' THEN '✅ JACOBY''S Detected'
        WHEN business_intelligence->'brand_names' ? 'JACOBYS' THEN '✅ JACOBYS Detected'
        ELSE '❌ JACOBY''S Not Detected'
    END as jacobys_brand_detection,
    
    -- Check for equipment detection
    CASE 
        WHEN business_intelligence->'equipment_purchased' ? 'FENCE FEEDER 16"' THEN '✅ Fence Feeder Detected'
        WHEN business_intelligence->'equipment_purchased' ? 'SCOOP,ENCLOSED 3QT' THEN '✅ Scoop Detected'
        ELSE '❌ Equipment Not Detected'
    END as equipment_detection,
    
    -- Check for feed type classification
    business_intelligence->>'feed_type' as feed_type_detected,
    
    -- Check vendor intelligence
    CASE 
        WHEN vendor_intelligence->>'vendor_phone' = '(830) 981-2258' THEN '✅ Phone Detected'
        ELSE '❌ Phone Not Detected'
    END as phone_detection,
    
    created_at
FROM public.expenses 
WHERE vendor ILIKE '%STRUTTY%'
AND created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 7. Summary statistics
SELECT 
    'SUMMARY STATISTICS' as test_section,
    COUNT(*) as total_recent_expenses,
    COUNT(CASE WHEN business_intelligence IS NOT NULL THEN 1 END) as expenses_with_bi,
    COUNT(CASE WHEN vendor_intelligence IS NOT NULL THEN 1 END) as expenses_with_vendor_intel,
    
    ROUND(
        100.0 * COUNT(CASE WHEN business_intelligence IS NOT NULL THEN 1 END) / COUNT(*), 
        2
    ) as bi_coverage_percentage,
    
    ROUND(
        100.0 * COUNT(CASE WHEN vendor_intelligence IS NOT NULL THEN 1 END) / COUNT(*), 
        2
    ) as vendor_intel_coverage_percentage
    
FROM public.expenses 
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day';