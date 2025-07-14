-- =========================================================================
-- Initialize FFA Data for Current User
-- =========================================================================
-- Creates initial degree progress records for the logged-in user
-- Run this script after the main FFA database extension is complete
-- =========================================================================

-- Initialize degree progress for user (replace with your actual user ID)
-- User ID from logs: 26650701-8eea-40d2-b374-4b4c67bbd710

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

-- Track an analytics event for initial setup
INSERT INTO public.ffa_analytics_events (
    user_id,
    event_type,
    event_category,
    event_action,
    event_data,
    privacy_level,
    timestamp
) VALUES (
    '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid,
    'ffa_setup',
    'system_initialization',
    'user_data_initialized',
    '{"degree_levels_created": 5, "sae_projects_created": 1, "sample_records_created": 3}'::jsonb,
    'private',
    now()
);

-- Verification query
SELECT 
    'Degree Progress Records' as table_name,
    COUNT(*) as record_count,
    array_agg(degree_level) as degrees_created
FROM public.ffa_degree_progress 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid

UNION ALL

SELECT 
    'SAE Projects' as table_name,
    COUNT(*) as record_count,
    array_agg(project_name) as projects_created
FROM public.ffa_sae_projects 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid

UNION ALL

SELECT 
    'SAE Records' as table_name,
    COUNT(*) as record_count,
    array_agg(activity_type) as activity_types
FROM public.ffa_sae_records 
WHERE user_id = '26650701-8eea-40d2-b374-4b4c67bbd710'::uuid;