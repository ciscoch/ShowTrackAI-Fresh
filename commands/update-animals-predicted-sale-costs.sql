-- Update existing animals with predicted sale costs for FFA SAE financial planning testing
-- Copy and paste this entire script into Supabase SQL Editor

-- Update test cattle 1 with realistic market steer predicted sale cost
UPDATE public.animals 
SET predicted_sale_cost = 6000.00,
    updated_at = NOW()
WHERE name = 'test cattle 1' 
  AND owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- Update Sheep 1 with show lamb predicted sale cost
UPDATE public.animals 
SET predicted_sale_cost = 750.00,
    updated_at = NOW()
WHERE name = 'Sheep 1' 
  AND owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- Update sheep test with show lamb predicted sale cost
UPDATE public.animals 
SET predicted_sale_cost = 950.00,
    updated_at = NOW()
WHERE name = 'sheep test' 
  AND owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- Update Goat test with market goat predicted sale cost
UPDATE public.animals 
SET predicted_sale_cost = 650.00,
    updated_at = NOW()
WHERE name = 'Goat test' 
  AND owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- Verify the updates
SELECT 
  name,
  species,
  project_type,
  acquisition_cost,
  predicted_sale_cost,
  (predicted_sale_cost - acquisition_cost) as potential_profit,
  updated_at
FROM public.animals 
WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710'
ORDER BY name;

-- Calculate total predicted income summary
SELECT 
  COUNT(*) as total_animals,
  COUNT(predicted_sale_cost) as animals_with_predictions,
  COALESCE(SUM(acquisition_cost), 0) as total_acquisition_cost,
  COALESCE(SUM(predicted_sale_cost), 0) as total_predicted_income,
  COALESCE(SUM(predicted_sale_cost - acquisition_cost), 0) as total_potential_profit
FROM public.animals 
WHERE owner_id = '26650701-8eea-40d2-b374-4b4c67bbd710';

-- Expected Results After Running This Script:
-- test cattle 1: $4,500 → $6,000 (profit: $1,500)
-- Sheep 1: $550 → $750 (profit: $200)
-- sheep test: $750 → $950 (profit: $200)
-- Goat test: $450 → $650 (profit: $200)
-- TOTAL PREDICTED INCOME: $8,350
-- TOTAL POTENTIAL PROFIT: $2,100