-- ShowTrackAI Database Schema for Supabase
-- This schema supports the complete FFA Animal Data Platform

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create custom types
create type user_role as enum ('student', 'educator', 'veterinarian', 'admin', 'parent');
create type subscription_tier as enum ('freemium', 'elite');
create type animal_species as enum ('cattle', 'sheep', 'swine', 'goats', 'poultry', 'other');
create type consultation_status as enum ('requested', 'assigned', 'in_progress', 'completed', 'cancelled');
create type health_status as enum ('healthy', 'minor_concern', 'needs_attention', 'critical');

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  role user_role not null default 'student',
  subscription_tier subscription_tier not null default 'freemium',
  avatar_url text,
  phone text,
  address text,
  organization_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Organizations (FFA chapters, schools, etc.)
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null, -- 'ffa_chapter', 'school', 'farm', etc.
  address text,
  contact_email text,
  contact_phone text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profile relationships (student-educator links)
create table public.profile_relationships (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  educator_id uuid references public.profiles(id) on delete cascade not null,
  relationship_type text not null default 'student_educator',
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, educator_id)
);

-- ============================================================================
-- ANIMAL MANAGEMENT
-- ============================================================================

-- Animals table
create table public.animals (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  species animal_species not null,
  breed text,
  sex text,
  birth_date date,
  registration_number text,
  ear_tag text,
  microchip_id text,
  current_weight numeric(8,2),
  target_weight numeric(8,2),
  health_status health_status default 'healthy',
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Animal photos
create table public.animal_photos (
  id uuid default uuid_generate_v4() primary key,
  animal_id uuid references public.animals(id) on delete cascade not null,
  file_path text not null,
  file_size integer,
  mime_type text,
  width integer,
  height integer,
  ai_analyzed boolean default false,
  quality_score numeric(3,2),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Weight tracking
create table public.animal_weights (
  id uuid default uuid_generate_v4() primary key,
  animal_id uuid references public.animals(id) on delete cascade not null,
  weight numeric(8,2) not null,
  measurement_method text, -- 'manual', 'ai_prediction', 'scale'
  confidence_score numeric(3,2),
  photo_id uuid references public.animal_photos(id),
  notes text,
  measured_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Health records
create table public.animal_health_records (
  id uuid default uuid_generate_v4() primary key,
  animal_id uuid references public.animals(id) on delete cascade not null,
  recorded_by uuid references public.profiles(id) not null,
  health_event_type text not null, -- 'vaccination', 'illness', 'injury', 'checkup', 'medication'
  description text not null,
  severity text, -- 'low', 'medium', 'high', 'critical'
  treatment text,
  follow_up_required boolean default false,
  follow_up_date date,
  veterinarian_id uuid references public.profiles(id),
  cost numeric(10,2),
  notes text,
  metadata jsonb default '{}'::jsonb,
  occurred_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vaccinations
create table public.animal_vaccinations (
  id uuid default uuid_generate_v4() primary key,
  animal_id uuid references public.animals(id) on delete cascade not null,
  vaccine_name text not null,
  manufacturer text,
  lot_number text,
  dosage text,
  administration_route text,
  veterinarian_id uuid references public.profiles(id),
  next_due_date date,
  cost numeric(10,2),
  notes text,
  administered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Medications
create table public.animal_medications (
  id uuid default uuid_generate_v4() primary key,
  animal_id uuid references public.animals(id) on delete cascade not null,
  medication_name text not null,
  dosage text,
  frequency text,
  duration text,
  prescribed_by uuid references public.profiles(id),
  reason text,
  cost numeric(10,2),
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- EDUCATIONAL CONTENT
-- ============================================================================

-- Journal entries
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  animal_id uuid references public.animals(id) on delete cascade,
  title text not null,
  content text not null,
  entry_type text default 'general', -- 'feeding', 'health', 'behavior', 'general'
  tags text[] default array[]::text[],
  is_private boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Journal photos
create table public.journal_photos (
  id uuid default uuid_generate_v4() primary key,
  journal_entry_id uuid references public.journal_entries(id) on delete cascade not null,
  file_path text not null,
  caption text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AET standards
create table public.aet_standards (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  title text not null,
  description text,
  category text,
  grade_level text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AET mappings (activity to standards)
create table public.aet_mappings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null, -- 'journal_entry', 'health_record', 'weight_measurement'
  activity_id uuid not null,
  aet_standard_id uuid references public.aet_standards(id) not null,
  completion_level text, -- 'introduced', 'reinforced', 'mastered'
  evidence_notes text,
  verified_by uuid references public.profiles(id),
  mapped_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- FINANCIAL MANAGEMENT
-- ============================================================================

-- Expenses
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  animal_id uuid references public.animals(id) on delete cascade,
  category text not null, -- 'feed', 'veterinary', 'equipment', 'transportation', 'other'
  subcategory text,
  amount numeric(10,2) not null,
  description text not null,
  vendor text,
  receipt_url text,
  tax_deductible boolean default false,
  metadata jsonb default '{}'::jsonb,
  expense_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Income
create table public.income (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  animal_id uuid references public.animals(id) on delete cascade,
  source text not null, -- 'sale', 'show_winnings', 'breeding_fees', 'other'
  amount numeric(10,2) not null,
  description text not null,
  buyer_info text,
  tax_implications text,
  metadata jsonb default '{}'::jsonb,
  income_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Budgets
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  total_budget numeric(10,2) not null,
  period_start date not null,
  period_end date not null,
  categories jsonb default '{}'::jsonb, -- category: amount mapping
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- VETCONNECT PLATFORM
-- ============================================================================

-- Veterinarian profiles
create table public.veterinarian_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  license_number text unique not null,
  license_state text not null,
  specializations text[] default array[]::text[],
  years_experience integer,
  clinic_name text,
  clinic_address text,
  emergency_available boolean default false,
  consultation_rate numeric(10,2),
  bio text,
  credentials jsonb default '{}'::jsonb,
  availability_schedule jsonb default '{}'::jsonb,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Consultations
create table public.consultations (
  id uuid default uuid_generate_v4() primary key,
  patient_animal_id uuid references public.animals(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  veterinarian_id uuid references public.profiles(id),
  status consultation_status default 'requested',
  priority text default 'normal', -- 'low', 'normal', 'high', 'emergency'
  symptoms text not null,
  consultation_type text not null, -- 'general', 'emergency', 'follow_up', 'second_opinion'
  preferred_datetime timestamp with time zone,
  scheduled_datetime timestamp with time zone,
  consultation_fee numeric(10,2),
  payment_status text default 'pending',
  ai_assessment_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Consultation notes
create table public.consultation_notes (
  id uuid default uuid_generate_v4() primary key,
  consultation_id uuid references public.consultations(id) on delete cascade not null,
  author_id uuid references public.profiles(id) not null,
  note_type text not null, -- 'diagnosis', 'treatment', 'prescription', 'follow_up'
  content text not null,
  is_private boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI health assessments
create table public.health_assessments (
  id uuid default uuid_generate_v4() primary key,
  animal_id uuid references public.animals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  symptoms jsonb not null,
  photo_ids uuid[] default array[]::uuid[],
  ai_analysis jsonb,
  confidence_score numeric(3,2),
  recommended_actions text[],
  urgency_level text, -- 'low', 'medium', 'high', 'emergency'
  requires_vet boolean default false,
  consultation_id uuid references public.consultations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- CALENDAR & EVENTS
-- ============================================================================

-- Events
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  event_type text not null, -- 'show', 'vaccination', 'breeding', 'feeding', 'health_check'
  start_datetime timestamp with time zone not null,
  end_datetime timestamp with time zone,
  location text,
  animal_ids uuid[] default array[]::uuid[],
  reminder_settings jsonb default '{}'::jsonb,
  is_recurring boolean default false,
  recurrence_pattern text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- ACCESS CONTROL & NOTIFICATIONS
-- ============================================================================

-- Access tokens (for QR code access)
create table public.access_tokens (
  id uuid default uuid_generate_v4() primary key,
  token text unique not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  access_level text not null, -- 'read_only', 'limited_write'
  allowed_data_types text[] default array[]::text[],
  expires_at timestamp with time zone,
  max_uses integer,
  current_uses integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null, -- 'health_alert', 'consultation_update', 'reminder', 'system'
  priority text default 'normal', -- 'low', 'normal', 'high'
  read boolean default false,
  action_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Audit logs
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- File uploads
create table public.file_uploads (
  id uuid default uuid_generate_v4() primary key,
  uploader_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_size integer not null,
  mime_type text not null,
  bucket_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_organization on public.profiles(organization_id);

-- Animals indexes
create index idx_animals_owner on public.animals(owner_id);
create index idx_animals_species on public.animals(species);
create index idx_animals_health_status on public.animals(health_status);

-- Animal weights indexes
create index idx_animal_weights_animal on public.animal_weights(animal_id);
create index idx_animal_weights_date on public.animal_weights(measured_at);

-- Health records indexes
create index idx_health_records_animal on public.animal_health_records(animal_id);
create index idx_health_records_type on public.animal_health_records(health_event_type);
create index idx_health_records_date on public.animal_health_records(occurred_at);

-- Journal entries indexes
create index idx_journal_entries_author on public.journal_entries(author_id);
create index idx_journal_entries_animal on public.journal_entries(animal_id);
create index idx_journal_entries_date on public.journal_entries(created_at);

-- Financial indexes
create index idx_expenses_user on public.expenses(user_id);
create index idx_expenses_animal on public.expenses(animal_id);
create index idx_expenses_category on public.expenses(category);
create index idx_expenses_date on public.expenses(expense_date);

-- Consultations indexes
create index idx_consultations_animal on public.consultations(patient_animal_id);
create index idx_consultations_owner on public.consultations(owner_id);
create index idx_consultations_vet on public.consultations(veterinarian_id);
create index idx_consultations_status on public.consultations(status);

-- Notifications indexes
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_read on public.notifications(read);
create index idx_notifications_type on public.notifications(type);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers to relevant tables
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.organizations
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.animals
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.journal_entries
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.budgets
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.veterinarian_profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.consultations
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.events
  for each row execute procedure public.handle_updated_at();