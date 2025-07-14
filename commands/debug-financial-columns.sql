-- Debug Financial Table Column Names
-- Run this to check the exact column names in your Supabase tables

-- Check expenses table columns
SELECT 
    'EXPENSES TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'expenses'
ORDER BY ordinal_position;

-- Check income table columns  
SELECT 
    'INCOME TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'income'
ORDER BY ordinal_position;

-- Check animals table columns (for predicted_sale_cost)
SELECT 
    'ANIMALS TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'animals'
WHERE column_name LIKE '%cost%' OR column_name LIKE '%sale%'
ORDER BY ordinal_position;

-- Test simple queries to verify column names work
SELECT 'EXPENSES TEST' as test, COUNT(*) as count FROM public.expenses;
SELECT 'INCOME TEST' as test, COUNT(*) as count FROM public.income;
SELECT 'ANIMALS TEST' as test, COUNT(*) as count FROM public.animals;