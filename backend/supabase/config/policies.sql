-- Row Level Security Policies for ShowTrackAI
-- These policies ensure users can only access their own data and appropriate shared data

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.profile_relationships enable row level security;
alter table public.animals enable row level security;
alter table public.animal_photos enable row level security;
alter table public.animal_weights enable row level security;
alter table public.animal_health_records enable row level security;
alter table public.animal_vaccinations enable row level security;
alter table public.animal_medications enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_photos enable row level security;
alter table public.aet_standards enable row level security;
alter table public.aet_mappings enable row level security;
alter table public.expenses enable row level security;
alter table public.income enable row level security;
alter table public.budgets enable row level security;
alter table public.veterinarian_profiles enable row level security;
alter table public.consultations enable row level security;
alter table public.consultation_notes enable row level security;
alter table public.health_assessments enable row level security;
alter table public.events enable row level security;
alter table public.access_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.file_uploads enable row level security;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is an educator for a student
create or replace function public.is_educator_for_student(student_user_id uuid, educator_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profile_relationships
    where student_id = student_user_id
    and educator_id = educator_user_id
    and active = true
  );
end;
$$ language plpgsql security definer;

-- Function to check if user has access via QR token
create or replace function public.has_token_access(token_value text, data_type text)
returns boolean as $$
declare
  token_record public.access_tokens%rowtype;
begin
  select * into token_record from public.access_tokens
  where token = token_value
  and (expires_at is null or expires_at > now())
  and (max_uses is null or current_uses < max_uses)
  and (data_type = any(allowed_data_types) or 'all' = any(allowed_data_types));
  
  return found;
end;
$$ language plpgsql security definer;

-- Function to get user role
create or replace function public.get_user_role(user_id uuid)
returns user_role as $$
declare
  user_role_value user_role;
begin
  select role into user_role_value from public.profiles where id = user_id;
  return user_role_value;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Educators can view their students' profiles
create policy "Educators can view student profiles" on public.profiles
  for select using (
    auth.uid() != id and
    is_educator_for_student(id, auth.uid())
  );

-- Veterinarians can view profiles of animals they're consulting on
create policy "Veterinarians can view consultation profiles" on public.profiles
  for select using (
    get_user_role(auth.uid()) = 'veterinarian' and
    exists (
      select 1 from public.consultations c
      where c.owner_id = id and c.veterinarian_id = auth.uid()
    )
  );

-- Admins can view all profiles
create policy "Admins can view all profiles" on public.profiles
  for all using (get_user_role(auth.uid()) = 'admin');

-- New users can insert their profile
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

-- Users can view their organization
create policy "Users can view own organization" on public.organizations
  for select using (
    id in (select organization_id from public.profiles where id = auth.uid())
  );

-- Admins can manage all organizations
create policy "Admins can manage organizations" on public.organizations
  for all using (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- PROFILE RELATIONSHIPS POLICIES
-- ============================================================================

-- Students can view their educator relationships
create policy "Students can view own relationships" on public.profile_relationships
  for select using (student_id = auth.uid());

-- Educators can view their student relationships
create policy "Educators can view student relationships" on public.profile_relationships
  for select using (educator_id = auth.uid());

-- Educators can create relationships with students
create policy "Educators can create relationships" on public.profile_relationships
  for insert with check (
    educator_id = auth.uid() and
    get_user_role(auth.uid()) = 'educator'
  );

-- Users can update their own relationships
create policy "Users can update own relationships" on public.profile_relationships
  for update using (student_id = auth.uid() or educator_id = auth.uid());

-- ============================================================================
-- ANIMALS POLICIES
-- ============================================================================

-- Users can manage their own animals
create policy "Users can manage own animals" on public.animals
  for all using (owner_id = auth.uid());

-- Educators can view their students' animals
create policy "Educators can view student animals" on public.animals
  for select using (is_educator_for_student(owner_id, auth.uid()));

-- Veterinarians can view animals they're consulting on
create policy "Veterinarians can view consultation animals" on public.animals
  for select using (
    get_user_role(auth.uid()) = 'veterinarian' and
    exists (
      select 1 from public.consultations c
      where c.patient_animal_id = id and c.veterinarian_id = auth.uid()
    )
  );

-- QR code access for animals
create policy "QR code access for animals" on public.animals
  for select using (
    exists (
      select 1 from public.access_tokens at
      where has_token_access(at.token, 'animals')
      and at.owner_id = owner_id
    )
  );

-- ============================================================================
-- ANIMAL PHOTOS POLICIES
-- ============================================================================

-- Users can manage photos of their animals
create policy "Users can manage own animal photos" on public.animal_photos
  for all using (
    animal_id in (select id from public.animals where owner_id = auth.uid())
  );

-- Educators can view student animal photos
create policy "Educators can view student animal photos" on public.animal_photos
  for select using (
    animal_id in (
      select a.id from public.animals a
      where is_educator_for_student(a.owner_id, auth.uid())
    )
  );

-- Veterinarians can view consultation animal photos
create policy "Veterinarians can view consultation photos" on public.animal_photos
  for select using (
    get_user_role(auth.uid()) = 'veterinarian' and
    animal_id in (
      select c.patient_animal_id from public.consultations c
      where c.veterinarian_id = auth.uid()
    )
  );

-- ============================================================================
-- ANIMAL WEIGHTS POLICIES
-- ============================================================================

-- Users can manage weights of their animals
create policy "Users can manage own animal weights" on public.animal_weights
  for all using (
    animal_id in (select id from public.animals where owner_id = auth.uid())
  );

-- Educators can view student animal weights
create policy "Educators can view student animal weights" on public.animal_weights
  for select using (
    animal_id in (
      select a.id from public.animals a
      where is_educator_for_student(a.owner_id, auth.uid())
    )
  );

-- ============================================================================
-- HEALTH RECORDS POLICIES
-- ============================================================================

-- Users can manage health records of their animals
create policy "Users can manage own animal health records" on public.animal_health_records
  for all using (
    animal_id in (select id from public.animals where owner_id = auth.uid())
  );

-- Educators can view student animal health records
create policy "Educators can view student health records" on public.animal_health_records
  for select using (
    animal_id in (
      select a.id from public.animals a
      where is_educator_for_student(a.owner_id, auth.uid())
    )
  );

-- Veterinarians can view and add health records for consultation animals
create policy "Veterinarians can manage consultation health records" on public.animal_health_records
  for all using (
    get_user_role(auth.uid()) = 'veterinarian' and
    (
      recorded_by = auth.uid() or
      veterinarian_id = auth.uid() or
      animal_id in (
        select c.patient_animal_id from public.consultations c
        where c.veterinarian_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- VACCINATIONS POLICIES
-- ============================================================================

-- Users can manage vaccinations of their animals
create policy "Users can manage own animal vaccinations" on public.animal_vaccinations
  for all using (
    animal_id in (select id from public.animals where owner_id = auth.uid())
  );

-- Educators can view student animal vaccinations
create policy "Educators can view student vaccinations" on public.animal_vaccinations
  for select using (
    animal_id in (
      select a.id from public.animals a
      where is_educator_for_student(a.owner_id, auth.uid())
    )
  );

-- Veterinarians can manage vaccinations for consultation animals
create policy "Veterinarians can manage consultation vaccinations" on public.animal_vaccinations
  for all using (
    get_user_role(auth.uid()) = 'veterinarian' and
    (
      veterinarian_id = auth.uid() or
      animal_id in (
        select c.patient_animal_id from public.consultations c
        where c.veterinarian_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- MEDICATIONS POLICIES
-- ============================================================================

-- Users can manage medications of their animals
create policy "Users can manage own animal medications" on public.animal_medications
  for all using (
    animal_id in (select id from public.animals where owner_id = auth.uid())
  );

-- Educators can view student animal medications
create policy "Educators can view student medications" on public.animal_medications
  for select using (
    animal_id in (
      select a.id from public.animals a
      where is_educator_for_student(a.owner_id, auth.uid())
    )
  );

-- Veterinarians can manage medications for consultation animals
create policy "Veterinarians can manage consultation medications" on public.animal_medications
  for all using (
    get_user_role(auth.uid()) = 'veterinarian' and
    (
      prescribed_by = auth.uid() or
      animal_id in (
        select c.patient_animal_id from public.consultations c
        where c.veterinarian_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- JOURNAL ENTRIES POLICIES
-- ============================================================================

-- Users can manage their own journal entries
create policy "Users can manage own journal entries" on public.journal_entries
  for all using (author_id = auth.uid());

-- Educators can view non-private student journal entries
create policy "Educators can view student journal entries" on public.journal_entries
  for select using (
    is_educator_for_student(author_id, auth.uid()) and
    is_private = false
  );

-- ============================================================================
-- JOURNAL PHOTOS POLICIES
-- ============================================================================

-- Users can manage photos of their journal entries
create policy "Users can manage own journal photos" on public.journal_photos
  for all using (
    journal_entry_id in (
      select id from public.journal_entries where author_id = auth.uid()
    )
  );

-- Educators can view student journal photos (non-private entries)
create policy "Educators can view student journal photos" on public.journal_photos
  for select using (
    journal_entry_id in (
      select je.id from public.journal_entries je
      where is_educator_for_student(je.author_id, auth.uid())
      and je.is_private = false
    )
  );

-- ============================================================================
-- AET STANDARDS POLICIES
-- ============================================================================

-- All authenticated users can view AET standards
create policy "All users can view AET standards" on public.aet_standards
  for select using (auth.uid() is not null);

-- Admins can manage AET standards
create policy "Admins can manage AET standards" on public.aet_standards
  for all using (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- AET MAPPINGS POLICIES
-- ============================================================================

-- Users can manage their own AET mappings
create policy "Users can manage own AET mappings" on public.aet_mappings
  for all using (user_id = auth.uid());

-- Educators can view and verify student AET mappings
create policy "Educators can manage student AET mappings" on public.aet_mappings
  for all using (
    is_educator_for_student(user_id, auth.uid()) or
    verified_by = auth.uid()
  );

-- ============================================================================
-- FINANCIAL POLICIES
-- ============================================================================

-- Users can manage their own expenses
create policy "Users can manage own expenses" on public.expenses
  for all using (user_id = auth.uid());

-- Educators can view student expenses
create policy "Educators can view student expenses" on public.expenses
  for select using (is_educator_for_student(user_id, auth.uid()));

-- Users can manage their own income
create policy "Users can manage own income" on public.income
  for all using (user_id = auth.uid());

-- Educators can view student income
create policy "Educators can view student income" on public.income
  for select using (is_educator_for_student(user_id, auth.uid()));

-- Users can manage their own budgets
create policy "Users can manage own budgets" on public.budgets
  for all using (user_id = auth.uid());

-- Educators can view student budgets
create policy "Educators can view student budgets" on public.budgets
  for select using (is_educator_for_student(user_id, auth.uid()));

-- ============================================================================
-- VETERINARIAN PROFILES POLICIES
-- ============================================================================

-- Veterinarians can manage their own profile
create policy "Veterinarians can manage own profile" on public.veterinarian_profiles
  for all using (id = auth.uid());

-- All users can view verified veterinarian profiles
create policy "Users can view verified vet profiles" on public.veterinarian_profiles
  for select using (verified_at is not null);

-- Admins can manage all veterinarian profiles
create policy "Admins can manage vet profiles" on public.veterinarian_profiles
  for all using (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- CONSULTATIONS POLICIES
-- ============================================================================

-- Animal owners can manage consultations for their animals
create policy "Owners can manage own consultations" on public.consultations
  for all using (owner_id = auth.uid());

-- Veterinarians can view and update assigned consultations
create policy "Veterinarians can manage assigned consultations" on public.consultations
  for all using (
    get_user_role(auth.uid()) = 'veterinarian' and
    (veterinarian_id = auth.uid() or veterinarian_id is null)
  );

-- Educators can view student consultations
create policy "Educators can view student consultations" on public.consultations
  for select using (is_educator_for_student(owner_id, auth.uid()));

-- ============================================================================
-- CONSULTATION NOTES POLICIES
-- ============================================================================

-- Consultation participants can manage notes
create policy "Consultation participants can manage notes" on public.consultation_notes
  for all using (
    author_id = auth.uid() or
    consultation_id in (
      select id from public.consultations
      where owner_id = auth.uid() or veterinarian_id = auth.uid()
    )
  );

-- ============================================================================
-- HEALTH ASSESSMENTS POLICIES
-- ============================================================================

-- Users can manage health assessments for their animals
create policy "Users can manage own health assessments" on public.health_assessments
  for all using (user_id = auth.uid());

-- Educators can view student health assessments
create policy "Educators can view student health assessments" on public.health_assessments
  for select using (is_educator_for_student(user_id, auth.uid()));

-- Veterinarians can view health assessments for consultation animals
create policy "Veterinarians can view consultation assessments" on public.health_assessments
  for select using (
    get_user_role(auth.uid()) = 'veterinarian' and
    animal_id in (
      select c.patient_animal_id from public.consultations c
      where c.veterinarian_id = auth.uid()
    )
  );

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Users can manage their own events
create policy "Users can manage own events" on public.events
  for all using (creator_id = auth.uid());

-- Educators can view student events
create policy "Educators can view student events" on public.events
  for select using (is_educator_for_student(creator_id, auth.uid()));

-- ============================================================================
-- ACCESS TOKENS POLICIES
-- ============================================================================

-- Users can manage their own access tokens
create policy "Users can manage own access tokens" on public.access_tokens
  for all using (owner_id = auth.uid());

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can manage their own notifications
create policy "Users can manage own notifications" on public.notifications
  for all using (user_id = auth.uid());

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Users can view audit logs for their own actions
create policy "Users can view own audit logs" on public.audit_logs
  for select using (user_id = auth.uid());

-- Admins can view all audit logs
create policy "Admins can view all audit logs" on public.audit_logs
  for select using (get_user_role(auth.uid()) = 'admin');

-- System can insert audit logs
create policy "System can insert audit logs" on public.audit_logs
  for insert with check (true);

-- ============================================================================
-- FILE UPLOADS POLICIES
-- ============================================================================

-- Users can manage their own file uploads
create policy "Users can manage own file uploads" on public.file_uploads
  for all using (uploader_id = auth.uid());

-- Educators can view student file uploads
create policy "Educators can view student file uploads" on public.file_uploads
  for select using (is_educator_for_student(uploader_id, auth.uid()));