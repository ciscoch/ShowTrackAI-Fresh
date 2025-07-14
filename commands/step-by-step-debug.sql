-- Step-by-Step Debug to Find the Exact Issue
-- Let's test each part individually to isolate the problem

-- TEST 1: Simple SELECT from expenses table
SELECT 'TEST 1: EXPENSES TABLE' as test_section;
SELECT 
    id,
    amount,
    category,
    description
FROM public.expenses 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- TEST 2: Simple SELECT from income table  
SELECT 'TEST 2: INCOME TABLE' as test_section;
SELECT 
    id,
    amount,
    source,
    description
FROM public.income 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- TEST 3: Simple SUM from expenses (no CTE)
SELECT 'TEST 3: EXPENSES SUM' as test_section;
SELECT 
    SUM(amount) as total_expenses,
    COUNT(*) as expense_count
FROM public.expenses 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- TEST 4: Simple SUM from income (no CTE)
SELECT 'TEST 4: INCOME SUM' as test_section;
SELECT 
    SUM(amount) as total_income,
    COUNT(*) as income_count
FROM public.income 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- TEST 5: Category grouping (no CTE)
SELECT 'TEST 5: CATEGORY GROUPING' as test_section;
SELECT 
    category,
    SUM(amount) as category_total
FROM public.expenses
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
GROUP BY category;

-- TEST 6: Very simple CTE test
SELECT 'TEST 6: SIMPLE CTE' as test_section;
WITH simple_test AS (
    SELECT COUNT(*) as row_count
    FROM public.expenses
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
)
SELECT row_count FROM simple_test;

-- TEST 7: CTE with amount column
SELECT 'TEST 7: CTE WITH AMOUNT' as test_section;
WITH amount_test AS (
    SELECT 
        amount,
        category
    FROM public.expenses
    WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
)
SELECT 
    SUM(amount) as total,
    COUNT(*) as count
FROM amount_test;

-- If TEST 7 fails but TEST 3 works, there's a CTE scope issue
-- If TEST 3 fails, there's a table permission or schema issue