-- =========================================================================
-- Initialize FFA Data for Current User - SIMPLIFIED VERSION
-- =========================================================================
-- Creates essential degree progress and SAE data without analytics
-- User ID: 26650701-8eea-40d2-b374-4b4c67bbd710
-- =========================================================================

-- Initialize degree progress for user
INSERT INTO public.ffa_degree_progress (
    user_id,
    degree_level,
    status,
    requirements_met,
    completion_percentage,
    created_at,
    updated_at
) VALUES 
-- Discovery Degree (Entry level)
(
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    'discovery',
    'in_progress',
    '{"basic_agriculture": true, "ffa_history": false, "sae_plan": false, "safety_training": false, "record_keeping": false, "community_service": false}'::jsonb,
    16.67, -- 1 out of 6 requirements completed
    now(),
    now()
),
-- Greenhand Degree (Next level)
(
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    'greenhand',
    'not_started',
    '{}'::jsonb,
    0,
    now(),
    now()
),
-- Chapter Degree
(
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    'chapter',
    'not_started',
    '{}'::jsonb,
    0,
    now(),
    now()
),
-- State Degree
(
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    'state',
    'not_started',
    '{}'::jsonb,
    0,
    now(),
    now()
),
-- American Degree (Highest level)
(
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    'american',
    'not_started',
    '{}'::jsonb,
    0,
    now(),
    now()
)
ON CONFLICT (user_id, degree_level) DO UPDATE SET
    updated_at = now();

-- Create a sample SAE project based on the expense data
INSERT INTO public.ffa_sae_projects (
    user_id,
    project_name,
    project_type,
    afnr_pathway,
    start_date,
    target_hours,
    actual_hours,
    target_earnings,
    actual_earnings,
    project_status,
    business_intelligence,
    created_at,
    updated_at
) VALUES (
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    'Livestock Feed and Supply Management',
    'entrepreneurship',
    'Animal Systems',
    '2024-09-01'::date,
    150, -- Target hours
    45,  -- Actual hours so far
    1500.00, -- Target earnings
    350.00,  -- Actual earnings
    'active',
    '{"cost_per_hour": 5.12, "profit_margin": 65.0, "roi_percentage": 23.3, "efficiency_metrics": {"time_to_completion": 45, "resource_utilization": 80, "goal_achievement_rate": 30}, "educational_value": {"competencies_gained": ["business_management", "animal_nutrition", "record_keeping"], "skill_development_score": 75, "career_readiness_indicators": {"problem_solving": 80, "communication": 70, "leadership": 65}}}'::jsonb,
    now(),
    now()
) ON CONFLICT DO NOTHING;

-- Add some SAE records based on the expense data
INSERT INTO public.ffa_sae_records (
    project_id,
    user_id,
    record_date,
    activity_type,
    description,
    hours_worked,
    expense_amount,
    income_amount,
    category,
    learning_objectives,
    competencies_demonstrated,
    created_at,
    updated_at
) VALUES 
-- Feed purchase record
(
    (SELECT id FROM public.ffa_sae_projects WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid LIMIT 1),
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    '2024-09-08'::date,
    'expense',
    'JACOBY''S RED TAG GROW/DEV feed purchase for livestock nutrition',
    2.0,
    57.00,
    0.00,
    'feed_supplies',
    ARRAY['understand_animal_nutrition', 'manage_feed_costs', 'supplier_relationships'],
    ARRAY['business_management', 'animal_nutrition', 'cost_analysis'],
    now(),
    now()
),
-- Equipment purchase record  
(
    (SELECT id FROM public.ffa_sae_projects WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid LIMIT 1),
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    '2024-09-08'::date,
    'expense',
    'Fence feeder and feeding equipment purchase',
    1.5,
    23.08,
    0.00,
    'equipment',
    ARRAY['equipment_selection', 'facility_management', 'cost_efficiency'],
    ARRAY['equipment_management', 'facility_planning', 'budgeting'],
    now(),
    now()
),
-- Labor/management record
(
    (SELECT id FROM public.ffa_sae_projects WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid LIMIT 1),
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    '2024-09-10'::date,
    'labor',
    'Daily feeding and livestock management activities',
    8.0,
    0.00,
    0.00,
    'daily_management',
    ARRAY['develop_work_ethic', 'animal_care_skills', 'time_management'],
    ARRAY['animal_husbandry', 'responsibility', 'work_ethic'],
    now(),
    now()
);

-- Verification queries
SELECT 'FFA Data Initialization Complete!' as status;

SELECT 
    'Degree Progress Records' as table_name,
    COUNT(*) as record_count
FROM public.ffa_degree_progress 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid;

SELECT 
    'SAE Projects' as table_name,
    COUNT(*) as record_count
FROM public.ffa_sae_projects 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid;

SELECT 
    'SAE Records' as table_name,
    COUNT(*) as record_count
FROM public.ffa_sae_records 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid;

-- Show specific data created
SELECT 
    degree_level,
    status,
    completion_percentage
FROM public.ffa_degree_progress 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid
ORDER BY 
    CASE degree_level
        WHEN 'discovery' THEN 1
        WHEN 'greenhand' THEN 2
        WHEN 'chapter' THEN 3
        WHEN 'state' THEN 4
        WHEN 'american' THEN 5
    END;