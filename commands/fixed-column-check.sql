-- Fixed Column Check Query
-- Corrected syntax error in the animals table query

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

-- Check animals table columns (for predicted_sale_cost) - FIXED
SELECT 
    'ANIMALS TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'animals'
AND (column_name LIKE '%cost%' OR column_name LIKE '%sale%')
ORDER BY ordinal_position;

-- Test simple queries to verify column names work
SELECT 'EXPENSES TEST' as test, COUNT(*) as count FROM public.expenses;
SELECT 'INCOME TEST' as test, COUNT(*) as count FROM public.income;
SELECT 'ANIMALS TEST' as test, COUNT(*) as count FROM public.animals;

-- Also check for all amount-related columns across tables
SELECT 
    'ALL AMOUNT COLUMNS' as section,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('expenses', 'income', 'animals')
AND (
    column_name ILIKE '%amount%' OR 
    column_name ILIKE '%cost%' OR 
    column_name ILIKE '%total%' OR 
    column_name ILIKE '%value%' OR
    column_name ILIKE '%price%' OR
    column_name ILIKE '%sale%'
)
ORDER BY table_name, column_name;