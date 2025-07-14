-- Corrected Financial Analytics Query
-- Fixed the missing "S" in SELECT

SELECT 
    'FINANCIAL ANALYTICS SUCCESS' as test_section,
    
    -- Expense metrics (direct subqueries)
    (SELECT COALESCE(SUM(amount), 0) 
     FROM public.expenses 
     WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as total_expenses,
     
    (SELECT COUNT(*) 
     FROM public.expenses 
     WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as expense_count,
    
    -- Income metrics (direct subqueries)
    (SELECT COALESCE(SUM(amount), 0) 
     FROM public.income 
     WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as total_income,
     
    (SELECT COUNT(*) 
     FROM public.income 
     WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') as income_count,
    
    -- Predicted income metrics (direct subqueries)
    (SELECT COALESCE(SUM(predicted_sale_cost), 0) 
     FROM public.animals 
     WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710' 
     AND predicted_sale_cost IS NOT NULL 
     AND predicted_sale_cost > 0) as predicted_income,
     
    (SELECT COUNT(*) 
     FROM public.animals 
     WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710' 
     AND predicted_sale_cost IS NOT NULL 
     AND predicted_sale_cost > 0) as animals_with_predictions,
    
    -- Combined calculations
    (
        (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') + 
        (SELECT COALESCE(SUM(predicted_sale_cost), 0) FROM public.animals WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710' AND predicted_sale_cost > 0)
    ) as total_projected_income,
    
    (
        (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') + 
        (SELECT COALESCE(SUM(predicted_sale_cost), 0) FROM public.animals WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710' AND predicted_sale_cost > 0) -
        (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710')
    ) as net_profit,
    
    -- FFA SAE Analysis
    CASE 
        WHEN (
            (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') + 
            (SELECT COALESCE(SUM(predicted_sale_cost), 0) FROM public.animals WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710' AND predicted_sale_cost > 0) -
            (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710')
        ) > 0 
        THEN 'Profitable - Your SAE project is on track for success!'
        WHEN (
            (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') + 
            (SELECT COALESCE(SUM(predicted_sale_cost), 0) FROM public.animals WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710' AND predicted_sale_cost > 0) -
            (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710')
        ) = 0 
        THEN 'Break-even - Your project covers all costs.'
        ELSE 'Loss - Review expenses and consider increasing predicted sale values.'
    END as ffa_sae_analysis;

-- Category Breakdown (separate query)
SELECT 
    'EXPENSE CATEGORIES' as test_section,
    category,
    SUM(amount) as category_total,
    COUNT(*) as category_count,
    ROUND((SUM(amount) / (SELECT SUM(amount) FROM public.expenses WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710') * 100), 2) as category_percentage
FROM public.expenses
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
GROUP BY category
ORDER BY category_total DESC;

-- Animal Breakdown (separate query)
SELECT 
    'ANIMAL FINANCIAL BREAKDOWN' as test_section,
    a.name as animal_name,
    a.species,
    a.ear_tag,
    COALESCE(a.acquisition_cost, 0) as acquisition_cost,
    COALESCE(a.predicted_sale_cost, 0) as predicted_sale_cost,
    (COALESCE(a.predicted_sale_cost, 0) - COALESCE(a.acquisition_cost, 0)) as potential_profit,
    
    -- Direct subqueries for animal-specific expenses/income
    (SELECT COALESCE(SUM(amount), 0) 
     FROM public.expenses 
     WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710' 
     AND animal_id = a.id) as allocated_expenses,
     
    (SELECT COALESCE(SUM(amount), 0) 
     FROM public.income 
     WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710' 
     AND animal_id = a.id) as earned_income,
    
    -- Net profit per animal
    (
        (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710' AND animal_id = a.id) +
        COALESCE(a.predicted_sale_cost, 0) -
        (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710' AND animal_id = a.id) -
        COALESCE(a.acquisition_cost, 0)
    ) as net_animal_profit

FROM public.animals a
WHERE a.owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
ORDER BY net_animal_profit DESC;