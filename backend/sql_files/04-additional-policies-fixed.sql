-- ============================================================================
-- ADDITIONAL RLS POLICIES FOR SHOWTRACK AI (FIXED VERSION)
-- Run this after the main policies.sql file for enhanced security
-- ============================================================================

-- ============================================================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS
-- ============================================================================

DO $$ 
BEGIN
    -- Drop policies if they exist to avoid conflicts
    DROP POLICY IF EXISTS "Admins can view all profiles for management" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
    DROP POLICY IF EXISTS "Parents can view children profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Parents can view children animals" ON public.animals;
    DROP POLICY IF EXISTS "Parents can view children journal entries" ON public.journal_entries;
    DROP POLICY IF EXISTS "QR code enhanced access for animals" ON public.animals;
    DROP POLICY IF EXISTS "QR code access for animal weights" ON public.animal_weights;
    DROP POLICY IF EXISTS "QR code access for animal photos" ON public.animal_photos;
    DROP POLICY IF EXISTS "Veterinarians can view consultation animal details" ON public.animals;
    DROP POLICY IF EXISTS "Veterinarians can add consultation health records" ON public.animal_health_records;
    DROP POLICY IF EXISTS "Educators can create educational journal entries" ON public.journal_entries;
    DROP POLICY IF EXISTS "Educators can view student financial data" ON public.expenses;
    DROP POLICY IF EXISTS "Educators can view student income data" ON public.income;
    DROP POLICY IF EXISTS "Enforce animal limits by subscription" ON public.animals;
    DROP POLICY IF EXISTS "Elite users can export data" ON public.animals;
    DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- ============================================================================
-- ENHANCED ADMIN POLICIES
-- ============================================================================

-- Allow admins to view all profiles for management purposes
CREATE POLICY "Admins can view all profiles for management" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Allow admins to update any profile (for support purposes)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================================
-- PARENT ACCESS POLICIES
-- ============================================================================

-- Allow parents to view their children's profiles
CREATE POLICY "Parents can view children profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    profiles.role = 'student' AND
    EXISTS (
      SELECT 1 FROM public.profile_relationships pr
      WHERE pr.student_id = profiles.id  -- Fixed: explicitly reference profiles.id
      AND pr.educator_id = auth.uid()
      AND pr.relationship_type = 'parent_child'
    )
  );

-- Allow parents to view their children's animals
CREATE POLICY "Parents can view children animals" ON public.animals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_relationships pr
      WHERE pr.student_id = animals.owner_id  -- Fixed: explicitly reference animals.owner_id
      AND pr.educator_id = auth.uid()
      AND pr.relationship_type = 'parent_child'
    )
  );

-- Allow parents to view their children's journal entries (non-private only)
CREATE POLICY "Parents can view children journal entries" ON public.journal_entries
  FOR SELECT TO authenticated
  USING (
    journal_entries.is_private = false AND
    EXISTS (
      SELECT 1 FROM public.profile_relationships pr
      WHERE pr.student_id = journal_entries.author_id  -- Fixed: explicitly reference journal_entries.author_id
      AND pr.educator_id = auth.uid()
      AND pr.relationship_type = 'parent_child'
    )
  );

-- ============================================================================
-- QR CODE ACCESS ENHANCEMENTS
-- ============================================================================

-- Enhanced QR code access for animals
CREATE POLICY "QR code enhanced access for animals" ON public.animals
  FOR SELECT TO anon, authenticated
  USING (
    -- Check if there's a valid access token
    EXISTS (
      SELECT 1 FROM public.access_tokens at
      WHERE at.owner_id = animals.owner_id  -- Fixed: explicitly reference animals.owner_id
      AND (at.expires_at IS NULL OR at.expires_at > now())
      AND (at.max_uses IS NULL OR at.current_uses < at.max_uses)
      AND ('animals' = ANY(at.allowed_data_types) OR 'all' = ANY(at.allowed_data_types))
    )
  );

-- QR code access for animal weights
CREATE POLICY "QR code access for animal weights" ON public.animal_weights
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.animals a
      JOIN public.access_tokens at ON at.owner_id = a.owner_id
      WHERE a.id = animal_weights.animal_id  -- Fixed: explicitly reference animal_weights.animal_id
      AND (at.expires_at IS NULL OR at.expires_at > now())
      AND (at.max_uses IS NULL OR at.current_uses < at.max_uses)
      AND ('weights' = ANY(at.allowed_data_types) OR 'all' = ANY(at.allowed_data_types))
    )
  );

-- QR code access for animal photos
CREATE POLICY "QR code access for animal photos" ON public.animal_photos
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.animals a
      JOIN public.access_tokens at ON at.owner_id = a.owner_id
      WHERE a.id = animal_photos.animal_id  -- Fixed: explicitly reference animal_photos.animal_id
      AND (at.expires_at IS NULL OR at.expires_at > now())
      AND (at.max_uses IS NULL OR at.current_uses < at.max_uses)
      AND ('photos' = ANY(at.allowed_data_types) OR 'all' = ANY(at.allowed_data_types))
    )
  );

-- ============================================================================
-- VETERINARIAN ENHANCED POLICIES
-- ============================================================================

-- Allow veterinarians to view consultation animal details
CREATE POLICY "Veterinarians can view consultation animal details" ON public.animals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.consultations c ON c.veterinarian_id = p.id
      WHERE p.id = auth.uid() 
      AND p.role = 'veterinarian'
      AND c.patient_animal_id = animals.id  -- Fixed: explicitly reference animals.id
      AND c.status IN ('assigned', 'in_progress', 'completed')
    )
  );

-- Allow veterinarians to add health records for consultation animals
CREATE POLICY "Veterinarians can add consultation health records" ON public.animal_health_records
  FOR INSERT TO authenticated
  WITH CHECK (
    animal_health_records.recorded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.consultations c ON c.veterinarian_id = p.id
      WHERE p.id = auth.uid() 
      AND p.role = 'veterinarian'
      AND c.patient_animal_id = animal_health_records.animal_id
      AND c.status IN ('assigned', 'in_progress', 'completed')
    )
  );

-- ============================================================================
-- EDUCATOR ENHANCED POLICIES
-- ============================================================================

-- Allow educators to create journal entries for educational purposes
CREATE POLICY "Educators can create educational journal entries" ON public.journal_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    journal_entries.author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'educator'
    )
  );

-- Allow educators to view financial data for educational oversight
CREATE POLICY "Educators can view student financial data" ON public.expenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_relationships pr
      WHERE pr.student_id = expenses.user_id  -- Fixed: explicitly reference expenses.user_id
      AND pr.educator_id = auth.uid()
      AND pr.active = true
    )
  );

CREATE POLICY "Educators can view student income data" ON public.income
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_relationships pr
      WHERE pr.student_id = income.user_id  -- Fixed: explicitly reference income.user_id
      AND pr.educator_id = auth.uid()
      AND pr.active = true
    )
  );

-- ============================================================================
-- SUBSCRIPTION TIER POLICIES
-- ============================================================================

-- Create subscription limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_limits (
  tier subscription_tier PRIMARY KEY,
  max_animals integer,
  max_storage_gb integer,
  ai_predictions_per_month integer,
  advanced_analytics boolean DEFAULT false,
  vet_consultations boolean DEFAULT false,
  real_time_sync boolean DEFAULT false,
  export_data boolean DEFAULT false
);

-- Insert default subscription limits
INSERT INTO public.subscription_limits (tier, max_animals, max_storage_gb, ai_predictions_per_month, advanced_analytics, vet_consultations, real_time_sync, export_data) VALUES
  ('freemium', 5, 1, 10, false, false, false, false),
  ('elite', 100, 50, 1000, true, true, true, true)
ON CONFLICT (tier) DO UPDATE SET
  max_animals = EXCLUDED.max_animals,
  max_storage_gb = EXCLUDED.max_storage_gb,
  ai_predictions_per_month = EXCLUDED.ai_predictions_per_month,
  advanced_analytics = EXCLUDED.advanced_analytics,
  vet_consultations = EXCLUDED.vet_consultations,
  real_time_sync = EXCLUDED.real_time_sync,
  export_data = EXCLUDED.export_data;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION public.check_subscription_limit(
  p_user_id uuid,
  p_limit_type text
)
RETURNS boolean AS $$
DECLARE
  user_tier subscription_tier;
  current_count integer;
  max_allowed integer;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF user_tier IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check specific limits
  CASE p_limit_type
    WHEN 'animals' THEN
      SELECT COUNT(*) INTO current_count
      FROM public.animals
      WHERE owner_id = p_user_id;
      
      SELECT max_animals INTO max_allowed
      FROM public.subscription_limits
      WHERE tier = user_tier;
      
    WHEN 'vet_consultations' THEN
      SELECT vet_consultations INTO max_allowed
      FROM public.subscription_limits
      WHERE tier = user_tier;
      
      RETURN max_allowed;
      
    ELSE
      RETURN true;
  END CASE;
  
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to enforce animal limits based on subscription
CREATE POLICY "Enforce animal limits by subscription" ON public.animals
  FOR INSERT TO authenticated
  WITH CHECK (
    animals.owner_id = auth.uid() AND
    public.check_subscription_limit(auth.uid(), 'animals')
  );

-- ============================================================================
-- DATA EXPORT POLICIES
-- ============================================================================

-- Allow elite users to export their data
CREATE POLICY "Elite users can export data" ON public.animals
  FOR SELECT TO authenticated
  USING (
    animals.owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.subscription_limits sl ON sl.tier = p.subscription_tier
      WHERE p.id = auth.uid() AND sl.export_data = true
    )
  );

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Allow users to view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (audit_logs.user_id = auth.uid());

-- Allow admins to view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- System can always insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if user has real-time access
CREATE OR REPLACE FUNCTION public.has_realtime_access(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT sl.real_time_sync INTO has_access
  FROM public.profiles p
  JOIN public.subscription_limits sl ON sl.tier = p.subscription_tier
  WHERE p.id = p_user_id;
  
  RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired access tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.access_tokens 
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs (keep last 6 months)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - interval '6 months';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Additional Policies Setup Complete!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Admin Policies: Enhanced management capabilities';
  RAISE NOTICE 'Parent Access: Children data visibility controls';
  RAISE NOTICE 'QR Code Access: Enhanced sharing capabilities';
  RAISE NOTICE 'Veterinarian: Consultation workflow policies';
  RAISE NOTICE 'Educator: Educational oversight policies';
  RAISE NOTICE 'Subscriptions: Tier-based access controls';
  RAISE NOTICE 'Audit Logs: Comprehensive logging policies';
  RAISE NOTICE '';
  RAISE NOTICE 'All ambiguous column references fixed! ✅';
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This fixed file resolves column ambiguity by:
-- 1. Explicitly referencing table names (e.g., profiles.id, animals.owner_id)
-- 2. Adding proper DROP POLICY statements to avoid conflicts
-- 3. Including verification and success messages
-- 4. Maintaining all original functionality with clear column references

-- These policies provide:
-- - Admin management capabilities
-- - Parent access to children's data  
-- - Enhanced QR code access controls
-- - Veterinarian workflow improvements
-- - Educator oversight capabilities
-- - Subscription tier enforcement
-- - Data export controls
-- - Comprehensive audit logging