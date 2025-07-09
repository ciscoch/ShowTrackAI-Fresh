-- Add missing fields to animals table for FFA SAE financial planning
-- This migration adds fields needed for the predicted income and break-even analysis features

-- Add missing fields to animals table
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS pen_number text,
ADD COLUMN IF NOT EXISTS breeder text,
ADD COLUMN IF NOT EXISTS pickup_date date,
ADD COLUMN IF NOT EXISTS project_type text,
ADD COLUMN IF NOT EXISTS acquisition_cost numeric(10,2),
ADD COLUMN IF NOT EXISTS predicted_sale_cost numeric(10,2);

-- Add comments for documentation
COMMENT ON COLUMN public.animals.pen_number IS 'Physical pen location identifier';
COMMENT ON COLUMN public.animals.breeder IS 'Name of the animal breeder or farm origin';
COMMENT ON COLUMN public.animals.pickup_date IS 'Date when animal was acquired/picked up';
COMMENT ON COLUMN public.animals.project_type IS 'FFA SAE project type: Market, Breeding, Show, Dairy';
COMMENT ON COLUMN public.animals.acquisition_cost IS 'Initial purchase/acquisition cost of the animal';
COMMENT ON COLUMN public.animals.predicted_sale_cost IS 'Projected sale value for break-even analysis and SAE financial planning';

-- Update any existing animals with default values if needed
UPDATE public.animals 
SET 
  pen_number = COALESCE(pen_number, 'Pen-1'),
  project_type = COALESCE(project_type, 'Market'),
  acquisition_cost = COALESCE(acquisition_cost, 0)
WHERE pen_number IS NULL OR project_type IS NULL OR acquisition_cost IS NULL;

-- Add index for project_type since it will be used for filtering
CREATE INDEX IF NOT EXISTS idx_animals_project_type ON public.animals(project_type);

-- Add index for predicted_sale_cost for financial queries
CREATE INDEX IF NOT EXISTS idx_animals_predicted_sale_cost ON public.animals(predicted_sale_cost);

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'animals' 
  AND table_schema = 'public'
  AND column_name IN ('pen_number', 'breeder', 'pickup_date', 'project_type', 'acquisition_cost', 'predicted_sale_cost')
ORDER BY column_name;