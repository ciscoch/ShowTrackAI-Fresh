-- Working Financial Analytics Query
-- Based on confirmed data existence in your Supabase tables

-- Let's first see the actual structure of your data
SELECT 'EXPENSES SAMPLE' as section, * FROM public.expenses 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710' LIMIT 1;

SELECT 'INCOME SAMPLE' as section, * FROM public.income 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710' LIMIT 1;

-- Check the exact column names for amount fields
SELECT 
    'AMOUNT COLUMNS CHECK' as section,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('expenses', 'income')
AND (
    column_name ILIKE '%amount%' OR 
    column_name ILIKE '%cost%' OR 
    column_name ILIKE '%total%' OR 
    column_name ILIKE '%value%' OR
    column_name ILIKE '%price%'
)
ORDER BY table_name, column_name;

-- Working Financial Analytics (using your confirmed data structure)
-- Based on your CSV results, the correct query should be:

WITH expense_summary AS (
    SELECT 
        COUNT(*) as expense_count,
        -- Use the exact column name from your schema verification
        COALESCE(SUM(amount::numeric), 0) as total_expenses,
        jsonb_object_agg(category, category_total) FILTER (WHERE category IS NOT NULL) as expenses_by_category
    FROM (
        SELECT 
            category,
            SUM(amount::numeric) as category_total
        FROM public.expenses
        WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
        GROUP BY category
    ) category_expenses
),
income_summary AS (
    SELECT 
        COUNT(*) as income_count,
        COALESCE(SUM(amount::numeric), 0) as total_income
    FROM public.income
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
),
predicted_income AS (
    SELECT 
        COALESCE(SUM(predicted_sale_cost::numeric), 0) as predicted_total,
        COUNT(*) FILTER (WHERE predicted_sale_cost IS NOT NULL AND predicted_sale_cost > 0) as animals_with_predictions
    FROM public.animals
    WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
)
SELECT 
    'FINANCIAL ANALYTICS SUCCESS' as test_section,
    es.expense_count,
    es.total_expenses,
    es.expenses_by_category,
    ins.income_count,
    ins.total_income,
    pi.predicted_total as predicted_income,
    pi.animals_with_predictions,
    (ins.total_income + pi.predicted_total) as total_projected_income,
    (ins.total_income + pi.predicted_total - es.total_expenses) as net_profit,
    CASE 
        WHEN (ins.total_income + pi.predicted_total) > 0 
        THEN ROUND(((ins.total_income + pi.predicted_total - es.total_expenses) / (ins.total_income + pi.predicted_total) * 100)::numeric, 2)
        ELSE 0 
    END as profit_margin_percent
FROM expense_summary es, income_summary ins, predicted_income pi;

-- If the above still fails, try this simpler version:
SELECT 
    'SIMPLE FINANCIAL TEST' as test_section,
    (SELECT COUNT(*) FROM public.expenses WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as expenses_count,
    (SELECT COUNT(*) FROM public.income WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as income_count,
    (SELECT COUNT(*) FROM public.animals WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as animals_count;

-- Expected results based on your data:
-- expenses_count: 1 (your test expense of $45.99)
-- income_count: 1 (your test income of $1,200.00)
-- animals_count: 4 (your animals with predicted sale costs)