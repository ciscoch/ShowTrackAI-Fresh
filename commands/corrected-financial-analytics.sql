-- Corrected Financial Analytics Query
-- Based on your actual Supabase schema

-- First, let's test individual table access to identify the issue
SELECT 'EXPENSES COLUMN TEST' as test_section, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name IN ('amount', 'expense_amount', 'cost', 'total');

SELECT 'INCOME COLUMN TEST' as test_section, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'income' AND column_name IN ('amount', 'income_amount', 'total', 'value');

-- Test if the column is named differently
SELECT 'EXPENSES AMOUNT COLUMNS' as test_section, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'expenses' 
AND (column_name ILIKE '%amount%' OR column_name ILIKE '%cost%' OR column_name ILIKE '%total%' OR column_name ILIKE '%value%');

-- Alternative Financial Analytics Query using explicit column checks
WITH expense_check AS (
    SELECT 
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'amount'
        ) THEN 'amount'
        ELSE 'COLUMN_NOT_FOUND'
        END as amount_column
),
expense_summary AS (
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN (SELECT amount_column FROM expense_check) = 'amount' THEN amount
                ELSE 0
            END
        ), 0) as total_expenses,
        COUNT(*) as expense_count
    FROM public.expenses
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
),
income_summary AS (
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'income' AND column_name = 'amount'
                ) THEN amount
                ELSE 0
            END
        ), 0) as total_income,
        COUNT(*) as income_count
    FROM public.income
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
)
SELECT 
    'CORRECTED ANALYTICS' as test_section,
    es.total_expenses,
    es.expense_count,
    ins.total_income,
    ins.income_count,
    (SELECT amount_column FROM expense_check) as detected_expense_column
FROM expense_summary es, income_summary ins;

-- Simple test query to see what data exists
SELECT 
    'DATA EXISTS TEST' as test_section,
    (SELECT COUNT(*) FROM public.expenses WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as expense_rows,
    (SELECT COUNT(*) FROM public.income WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as income_rows,
    (SELECT COUNT(*) FROM public.animals WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as animal_rows;

-- Alternative query if column names are different
-- Try this version if the above fails:
/*
WITH expense_summary AS (
    SELECT 
        COUNT(*) as expense_count,
        COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total_expenses
    FROM public.expenses
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
),
income_summary AS (
    SELECT 
        COUNT(*) as income_count,
        COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total_income
    FROM public.income
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
)
SELECT 
    'SIMPLE ANALYTICS' as test_section,
    es.expense_count,
    es.total_expenses,
    ins.income_count,
    ins.total_income
FROM expense_summary es, income_summary ins;
*/