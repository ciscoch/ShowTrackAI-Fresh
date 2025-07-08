-- Initial seed data for ShowTrackAI
-- This file contains sample data to get started with the platform

-- ============================================================================
-- ORGANIZATIONS (FFA Chapters, Schools, etc.)
-- ============================================================================

insert into public.organizations (id, name, type, address, contact_email, contact_phone) values
  ('00000000-0000-0000-0000-000000000001', 'Liberty High School FFA', 'ffa_chapter', '123 Liberty Lane, Liberty, TX 77575', 'ffa@libertyhs.edu', '(281) 555-0100'),
  ('00000000-0000-0000-0000-000000000002', 'Riverside Agricultural Academy', 'school', '456 River Road, Riverside, CA 92501', 'info@riverag.edu', '(951) 555-0200'),
  ('00000000-0000-0000-0000-000000000003', 'Valley View FFA Chapter', 'ffa_chapter', '789 Valley Drive, Valley View, OH 44125', 'contact@valleyviewffa.org', '(216) 555-0300');

-- ============================================================================
-- AET STANDARDS
-- ============================================================================

-- Insert common AET (Agricultural Experience Tracker) standards
insert into public.aet_standards (id, code, title, description, category, grade_level) values
  ('10000000-0000-0000-0000-000000000001', 'AS.01.01', 'Animal Systems and Related Biotechnologies', 'Analyze the role of animal agriculture in the global food system', 'Animal Science', '9-12'),
  ('10000000-0000-0000-0000-000000000002', 'AS.02.01', 'Animal Nutrition and Feed Management', 'Understand principles of animal nutrition and feed formulation', 'Animal Science', '9-12'),
  ('10000000-0000-0000-0000-000000000003', 'AS.03.01', 'Animal Health and Veterinary Medicine', 'Apply animal health management practices', 'Animal Science', '9-12'),
  ('10000000-0000-0000-0000-000000000004', 'AS.04.01', 'Animal Reproduction and Breeding', 'Understand principles of animal genetics and breeding', 'Animal Science', '9-12'),
  ('10000000-0000-0000-0000-000000000005', 'AS.05.01', 'Animal Behavior and Welfare', 'Analyze animal behavior and welfare considerations', 'Animal Science', '9-12'),
  ('10000000-0000-0000-0000-000000000006', 'BS.01.01', 'Business Management in Agriculture', 'Apply business management principles in agricultural enterprises', 'Business', '9-12'),
  ('10000000-0000-0000-0000-000000000007', 'BS.02.01', 'Agricultural Finance and Economics', 'Analyze economic principles in agricultural businesses', 'Business', '9-12'),
  ('10000000-0000-0000-0000-000000000008', 'BS.03.01', 'Agricultural Marketing', 'Develop marketing strategies for agricultural products', 'Business', '9-12'),
  ('10000000-0000-0000-0000-000000000009', 'CS.01.01', 'Career Exploration in Agriculture', 'Explore career opportunities in agriculture', 'Career Skills', '9-12'),
  ('10000000-0000-0000-0000-000000000010', 'CS.02.01', 'Leadership Development', 'Develop leadership skills through agricultural activities', 'Career Skills', '9-12');

-- ============================================================================
-- SAMPLE USER PROFILES (for testing)
-- ============================================================================

-- Note: In production, these would be created through Supabase Auth
-- This is just for reference of the expected data structure

-- Sample educator profile
-- insert into public.profiles (id, email, full_name, role, subscription_tier, organization_id) values
--   ('20000000-0000-0000-0000-000000000001', 'educator@libertyhs.edu', 'Sarah Johnson', 'educator', 'elite', '00000000-0000-0000-0000-000000000001');

-- Sample student profiles
-- insert into public.profiles (id, email, full_name, role, subscription_tier, organization_id) values
--   ('20000000-0000-0000-0000-000000000002', 'student1@email.com', 'Emma Davis', 'student', 'freemium', '00000000-0000-0000-0000-000000000001'),
--   ('20000000-0000-0000-0000-000000000003', 'student2@email.com', 'Michael Brown', 'student', 'elite', '00000000-0000-0000-0000-000000000001');

-- Sample veterinarian profile
-- insert into public.profiles (id, email, full_name, role, subscription_tier) values
--   ('20000000-0000-0000-0000-000000000004', 'vet@animalclinic.com', 'Dr. Lisa Martinez', 'veterinarian', 'elite');

-- ============================================================================
-- SAMPLE VETERINARIAN PROFILE
-- ============================================================================

-- Sample veterinarian professional profile
-- insert into public.veterinarian_profiles (id, license_number, license_state, specializations, years_experience, clinic_name, clinic_address, consultation_rate, bio, verified_at) values
--   ('20000000-0000-0000-0000-000000000004', 'TX12345', 'TX', array['Large Animal', 'Livestock Health', 'Reproduction'], 8, 'Liberty Animal Clinic', '100 Main St, Liberty, TX 77575', 75.00, 'Dr. Martinez specializes in large animal veterinary care with extensive experience in livestock health management.', now());

-- ============================================================================
-- SAMPLE ANIMALS (for demo purposes)
-- ============================================================================

-- Sample cattle
-- insert into public.animals (id, owner_id, name, species, breed, sex, birth_date, ear_tag, current_weight, target_weight, health_status) values
--   ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Bella', 'cattle', 'Angus', 'Female', '2023-03-15', 'A001', 850.50, 1200.00, 'healthy'),
--   ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Thunder', 'cattle', 'Hereford', 'Male', '2023-01-20', 'A002', 950.75, 1400.00, 'healthy'),
--   ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Daisy', 'cattle', 'Holstein', 'Female', '2022-12-10', 'A003', 1100.25, 1300.00, 'healthy');

-- Sample sheep
-- insert into public.animals (id, owner_id, name, species, breed, sex, birth_date, ear_tag, current_weight, target_weight, health_status) values
--   ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'Woolly', 'sheep', 'Suffolk', 'Female', '2023-04-01', 'S001', 120.00, 180.00, 'healthy'),
--   ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'Ram', 'sheep', 'Dorper', 'Male', '2023-02-14', 'S002', 140.50, 220.00, 'healthy');

-- ============================================================================
-- SAMPLE WEIGHT MEASUREMENTS
-- ============================================================================

-- Sample weight tracking data
-- insert into public.animal_weights (animal_id, weight, measurement_method, confidence_score, measured_at) values
--   ('30000000-0000-0000-0000-000000000001', 750.00, 'manual', 1.00, '2024-01-15 10:00:00Z'),
--   ('30000000-0000-0000-0000-000000000001', 780.25, 'ai_prediction', 0.92, '2024-02-15 10:00:00Z'),
--   ('30000000-0000-0000-0000-000000000001', 810.50, 'manual', 1.00, '2024-03-15 10:00:00Z'),
--   ('30000000-0000-0000-0000-000000000001', 835.75, 'ai_prediction', 0.88, '2024-04-15 10:00:00Z'),
--   ('30000000-0000-0000-0000-000000000001', 850.50, 'manual', 1.00, '2024-05-15 10:00:00Z');

-- ============================================================================
-- SAMPLE JOURNAL ENTRIES
-- ============================================================================

-- Sample journal entries for educational tracking
-- insert into public.journal_entries (id, author_id, animal_id, title, content, entry_type, tags) values
--   ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Daily Health Check', 'Performed routine health check on Bella. Eyes clear, nose dry, good appetite. Noticed slight limp in left front leg - will monitor closely.', 'health', array['health_check', 'observation', 'lameness']),
--   ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Feed Analysis', 'Switched to new feed mixture with higher protein content (18% vs 16%). Bella seems to prefer the new feed and is eating more consistently.', 'feeding', array['nutrition', 'feed_change', 'appetite']),
--   ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'Breeding Preparation', 'Woolly is approaching breeding age. Reviewed breeding records and genetic information. Planning to breed with registered Suffolk ram next month.', 'breeding', array['genetics', 'breeding_plan', 'suffolk']);

-- ============================================================================
-- SAMPLE EXPENSES
-- ============================================================================

-- Sample expense tracking
-- insert into public.expenses (user_id, animal_id, category, subcategory, amount, description, vendor, expense_date) values
--   ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'feed', 'grain', 85.50, 'Premium cattle feed - 50lb bag', 'Liberty Feed Store', '2024-06-01'),
--   ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'veterinary', 'vaccination', 45.00, 'Annual vaccination set', 'Liberty Animal Clinic', '2024-06-05'),
--   ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'equipment', 'tools', 25.99, 'Halter and lead rope', 'Ranch Supply Co', '2024-06-10'),
--   ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'feed', 'hay', 120.00, 'Premium alfalfa hay - 20 bales', 'Valley Hay Company', '2024-06-15');

-- ============================================================================
-- SAMPLE EVENTS
-- ============================================================================

-- Sample calendar events
-- insert into public.events (id, creator_id, title, description, event_type, start_datetime, end_datetime, location, animal_ids) values
--   ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'County Fair Livestock Show', 'Annual county fair livestock competition', 'show', '2024-08-15 09:00:00Z', '2024-08-15 17:00:00Z', 'Liberty County Fairgrounds', array['30000000-0000-0000-0000-000000000001']),
--   ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Vaccination Reminder', 'Annual booster vaccinations due', 'vaccination', '2024-07-15 10:00:00Z', '2024-07-15 11:00:00Z', 'Liberty Animal Clinic', array['30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002']),
--   ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Breeding Schedule', 'Planned breeding for Woolly', 'breeding', '2024-07-01 08:00:00Z', '2024-07-01 09:00:00Z', 'Farm - Breeding Facility', array['30000000-0000-0000-0000-000000000004']);

-- ============================================================================
-- FUNCTIONS FOR DEMO DATA GENERATION
-- ============================================================================

-- Function to generate sample weight progression for an animal
create or replace function public.generate_sample_weights(
  p_animal_id uuid,
  p_start_weight numeric,
  p_end_weight numeric,
  p_start_date date,
  p_end_date date,
  p_measurement_interval integer default 30
)
returns void as $$
declare
  measurement_date date := p_start_date;
  current_weight numeric := p_start_weight;
  weight_increment numeric;
  days_total integer;
  measurement_count integer;
begin
  days_total := p_end_date - p_start_date;
  measurement_count := days_total / p_measurement_interval;
  weight_increment := (p_end_weight - p_start_weight) / measurement_count;
  
  while measurement_date <= p_end_date loop
    insert into public.animal_weights (animal_id, weight, measurement_method, confidence_score, measured_at)
    values (
      p_animal_id,
      current_weight + (random() * 10 - 5), -- Add some natural variation
      case when random() > 0.3 then 'manual' else 'ai_prediction' end,
      case when random() > 0.3 then 1.0 else 0.85 + (random() * 0.15) end,
      measurement_date::timestamp with time zone
    );
    
    measurement_date := measurement_date + p_measurement_interval;
    current_weight := current_weight + weight_increment;
  end loop;
end;
$$ language plpgsql;

-- Function to create sample health records for an animal
create or replace function public.generate_sample_health_records(
  p_animal_id uuid,
  p_owner_id uuid
)
returns void as $$
begin
  -- Annual vaccination
  insert into public.animal_health_records (animal_id, recorded_by, health_event_type, description, severity, occurred_at)
  values (
    p_animal_id,
    p_owner_id,
    'vaccination',
    'Annual vaccination series completed - includes IBR, BVD, PI3, BRSV',
    'low',
    (current_date - interval '30 days')::timestamp with time zone
  );
  
  -- Health checkup
  insert into public.animal_health_records (animal_id, recorded_by, health_event_type, description, severity, occurred_at)
  values (
    p_animal_id,
    p_owner_id,
    'checkup',
    'Routine health examination - all vitals normal, good body condition',
    'low',
    (current_date - interval '60 days')::timestamp with time zone
  );
  
  -- Minor treatment
  insert into public.animal_health_records (animal_id, recorded_by, health_event_type, description, severity, treatment, occurred_at)
  values (
    p_animal_id,
    p_owner_id,
    'treatment',
    'Minor cut on leg from fence wire',
    'low',
    'Cleaned wound, applied antiseptic, monitoring for infection',
    (current_date - interval '45 days')::timestamp with time zone
  );
end;
$$ language plpgsql;

-- ============================================================================
-- DEMO DATA INITIALIZATION FUNCTION
-- ============================================================================

-- Function to set up complete demo environment
create or replace function public.initialize_demo_data()
returns void as $$
begin
  -- This function can be called to set up a complete demo environment
  -- It would create sample users, animals, and related data
  -- In practice, this would be customized based on the specific demo needs
  
  raise notice 'Demo data initialization function created. Call with specific parameters to generate sample data.';
end;
$$ language plpgsql;

-- ============================================================================
-- INITIAL SYSTEM SETTINGS
-- ============================================================================

-- Insert system configuration data if needed
-- This could include default settings, feature flags, etc.

-- Example: Default subscription tier limits
-- create table if not exists public.subscription_limits (
--   tier subscription_tier primary key,
--   max_animals integer,
--   max_storage_gb integer,
--   ai_predictions_per_month integer,
--   advanced_analytics boolean,
--   vet_consultations boolean
-- );

-- insert into public.subscription_limits values
--   ('freemium', 5, 1, 10, false, false),
--   ('elite', 100, 50, 1000, true, true);

-- ============================================================================
-- NOTES
-- ============================================================================

-- This seed file provides:
-- 1. Sample organizations (FFA chapters, schools)
-- 2. Complete AET standards for educational tracking
-- 3. Helper functions for generating demo data
-- 4. Framework for system configuration

-- To use this in development:
-- 1. Run the database.sql schema first
-- 2. Run this seed.sql file
-- 3. Create test users through Supabase Auth
-- 4. Use the helper functions to generate sample data for testing

-- For production:
-- 1. Only include the AET standards and organizations data
-- 2. Remove all sample user/animal data
-- 3. Keep the helper functions for demo environments