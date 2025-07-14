-- Final Working Financial Analytics Query
-- Based on confirmed column structure from your Supabase database

-- ============================================================================
-- CONFIRMED COLUMN STRUCTURE:
-- expenses.amount (numeric, NOT NULL)
-- income.amount (numeric, NOT NULL)  
-- animals.acquisition_cost (numeric, nullable)
-- animals.predicted_sale_cost (numeric, nullable)
-- ============================================================================

-- Working Financial Analytics Query
WITH expense_summary AS (
    SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count,
        COALESCE(
            jsonb_object_agg(category, category_total) FILTER (WHERE category IS NOT NULL),
            '{}'::jsonb
        ) as expenses_by_category
    FROM (
        SELECT 
            category,
            SUM(amount) as category_total
        FROM public.expenses
        WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
        GROUP BY category
    ) category_expenses
),
income_summary AS (
    SELECT 
        COALESCE(SUM(amount), 0) as total_income,
        COUNT(*) as income_count
    FROM public.income
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
),
predicted_income AS (
    SELECT 
        COALESCE(SUM(predicted_sale_cost), 0) as predicted_total,
        COUNT(*) FILTER (WHERE predicted_sale_cost IS NOT NULL AND predicted_sale_cost > 0) as animals_with_predictions,
        -- Breakdown by species for educational insights
        jsonb_object_agg(
            species, 
            jsonb_build_object(
                'count', species_count,
                'total_predicted', species_total,
                'avg_predicted', ROUND(species_avg, 2)
            )
        ) FILTER (WHERE species IS NOT NULL AND species_total > 0) as prediction_breakdown
    FROM (
        SELECT 
            species,
            COUNT(*) as species_count,
            SUM(predicted_sale_cost) as species_total,
            AVG(predicted_sale_cost) as species_avg
        FROM public.animals
        WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
        AND predicted_sale_cost IS NOT NULL 
        AND predicted_sale_cost > 0
        GROUP BY species
    ) species_breakdown
)
SELECT 
    'FINANCIAL ANALYTICS SUCCESS' as test_section,
    -- Expense metrics
    es.total_expenses,
    es.expense_count,
    es.expenses_by_category,
    
    -- Income metrics
    ins.total_income,
    ins.income_count,
    
    -- Predicted income metrics
    pi.predicted_total as predicted_income,
    pi.animals_with_predictions,
    pi.prediction_breakdown,
    
    -- Combined metrics
    (ins.total_income + pi.predicted_total) as total_projected_income,
    (ins.total_income + pi.predicted_total - es.total_expenses) as net_profit,
    
    -- Profitability analysis
    CASE 
        WHEN (ins.total_income + pi.predicted_total) > 0 
        THEN ROUND(((ins.total_income + pi.predicted_total - es.total_expenses) / (ins.total_income + pi.predicted_total) * 100), 2)
        ELSE 0 
    END as profit_margin_percent,
    
    -- Break-even analysis for FFA SAE
    CASE 
        WHEN pi.predicted_total > 0 AND es.total_expenses > 0
        THEN ROUND((es.total_expenses / pi.predicted_total * 100), 2)
        ELSE 0
    END as break_even_percentage,
    
    -- Educational insights
    CASE 
        WHEN (ins.total_income + pi.predicted_total - es.total_expenses) > 0 
        THEN 'Profitable - Your SAE project is on track for success!'
        WHEN (ins.total_income + pi.predicted_total - es.total_expenses) = 0 
        THEN 'Break-even - Your project covers all costs.'
        ELSE 'Loss - Review expenses and consider increasing predicted sale values.'
    END as ffa_sae_analysis

FROM expense_summary es, income_summary ins, predicted_income pi;

-- Detailed Animal Financial Breakdown
SELECT 
    'ANIMAL FINANCIAL BREAKDOWN' as test_section,
    a.name as animal_name,
    a.species,
    a.ear_tag,
    a.acquisition_cost,
    a.predicted_sale_cost,
    (a.predicted_sale_cost - COALESCE(a.acquisition_cost, 0)) as potential_profit,
    
    -- Associated expenses
    COALESCE(animal_expenses.total_expenses, 0) as allocated_expenses,
    
    -- Associated income 
    COALESCE(animal_income.total_income, 0) as earned_income,
    
    -- Net position per animal
    (COALESCE(animal_income.total_income, 0) + COALESCE(a.predicted_sale_cost, 0) - COALESCE(animal_expenses.total_expenses, 0) - COALESCE(a.acquisition_cost, 0)) as net_animal_profit,
    
    -- ROI calculation
    CASE 
        WHEN COALESCE(a.acquisition_cost, 0) + COALESCE(animal_expenses.total_expenses, 0) > 0
        THEN ROUND((
            (COALESCE(animal_income.total_income, 0) + COALESCE(a.predicted_sale_cost, 0) - COALESCE(a.acquisition_cost, 0) - COALESCE(animal_expenses.total_expenses, 0)) / 
            (COALESCE(a.acquisition_cost, 0) + COALESCE(animal_expenses.total_expenses, 0)) * 100
        ), 2)
        ELSE 0
    END as roi_percentage

FROM public.animals a
LEFT JOIN (
    SELECT 
        animal_id,
        SUM(amount) as total_expenses,
        COUNT(*) as expense_count
    FROM public.expenses 
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
    GROUP BY animal_id
) animal_expenses ON a.id = animal_expenses.animal_id
LEFT JOIN (
    SELECT 
        animal_id,
        SUM(amount) as total_income,
        COUNT(*) as income_count
    FROM public.income 
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
    GROUP BY animal_id
) animal_income ON a.id = animal_income.animal_id

WHERE a.owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
ORDER BY net_animal_profit DESC;

-- Expected Results Based on Your Data:
-- Total Expenses: $45.99 (feed supplies)
-- Total Income: $1,200.00 (sale revenue)  
-- Predicted Income: Sum of your 4 animals' predicted_sale_cost
-- Net Profit: $1,200 + predicted_income - $45.99
-- Profit Margin: Very healthy percentage
-- Break-even Analysis: Should show low break-even percentage (good!)
-- FFA SAE Analysis: "Profitable - Your SAE project is on track for success!"