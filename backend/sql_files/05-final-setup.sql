-- ============================================================================
-- FINAL SETUP AND CONFIGURATION FOR SHOWTRACK AI
-- Run this as the last SQL script to complete the backend setup
-- ============================================================================

-- ============================================================================
-- VERIFY ALL TABLES EXIST
-- ============================================================================

-- Check that all required tables exist
DO $$
DECLARE
    missing_tables text[] := ARRAY[]::text[];
    current_table text;
BEGIN
    -- List of required tables
    FOR current_table IN SELECT unnest(ARRAY[
        'profiles', 'organizations', 'profile_relationships',
        'animals', 'animal_photos', 'animal_weights', 'animal_health_records',
        'animal_vaccinations', 'animal_medications',
        'journal_entries', 'journal_photos', 'aet_standards', 'aet_mappings',
        'expenses', 'income', 'budgets',
        'veterinarian_profiles', 'consultations', 'consultation_notes', 'health_assessments',
        'events', 'access_tokens', 'notifications', 'audit_logs', 'file_uploads',
        'user_storage', 'subscription_limits'
    ]) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) THEN
            missing_tables := array_append(missing_tables, current_table);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All required tables exist';
    END IF;
END $$;

-- ============================================================================
-- VERIFY ALL STORAGE BUCKETS EXIST
-- ============================================================================

-- Check that all required storage buckets exist
DO $$
DECLARE
    missing_buckets text[] := ARRAY[]::text[];
    bucket_name text;
BEGIN
    -- List of required buckets
    FOR bucket_name IN SELECT unnest(ARRAY[
        'animal-photos', 'journal-photos', 'medical-documents', 
        'profile-pictures', 'receipts'
    ]) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM storage.buckets WHERE id = bucket_name
        ) THEN
            missing_buckets := array_append(missing_buckets, bucket_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_buckets, 1) > 0 THEN
        RAISE WARNING 'Missing storage buckets: %', array_to_string(missing_buckets, ', ');
    ELSE
        RAISE NOTICE '✅ All required storage buckets exist';
    END IF;
END $$;

-- ============================================================================
-- CREATE SYSTEM CONFIGURATION TABLE
-- ============================================================================

-- System configuration for app-wide settings
CREATE TABLE IF NOT EXISTS public.system_config (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on system config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system config
CREATE POLICY "Only admins can manage system config" ON public.system_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Anyone can read system config (for public settings)
CREATE POLICY "Anyone can read public system config" ON public.system_config
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- INSERT DEFAULT SYSTEM CONFIGURATION
-- ============================================================================

-- Insert default system configuration values
INSERT INTO public.system_config (key, value, description) VALUES 
  -- App version and build info
  ('app_version', '"1.0.0"', 'Current application version'),
  ('minimum_app_version', '"1.0.0"', 'Minimum required app version'),
  ('build_number', '1', 'Current build number'),
  
  -- Feature flags
  ('features', '{
    "ai_weight_prediction": true,
    "vet_connect": true,
    "advanced_analytics": true,
    "real_time_sync": true,
    "push_notifications": true,
    "qr_code_access": true,
    "offline_mode": true,
    "data_export": true
  }', 'Global feature flags'),
  
  -- API configuration
  ('api_config', '{
    "rate_limits": {
      "ai_predictions": 100,
      "file_uploads": 50,
      "consultations": 10
    },
    "max_file_size": 52428800,
    "supported_image_types": ["image/jpeg", "image/png", "image/gif", "image/webp"]
  }', 'API configuration settings'),
  
  -- Maintenance settings
  ('maintenance', '{
    "enabled": false,
    "message": "System is currently under maintenance. Please try again later.",
    "estimated_completion": null
  }', 'Maintenance mode settings'),
  
  -- Data retention policies
  ('data_retention', '{
    "audit_logs_months": 6,
    "backup_retention_days": 30,
    "expired_tokens_cleanup_days": 7
  }', 'Data retention and cleanup policies'),
  
  -- Notification settings
  ('notifications', '{
    "email_enabled": true,
    "sms_enabled": false,
    "push_enabled": true,
    "batch_size": 100
  }', 'Notification system configuration'),
  
  -- AI service configuration
  ('ai_config', '{
    "weight_prediction": {
      "enabled": true,
      "confidence_threshold": 0.8,
      "model_version": "v1.0"
    },
    "health_assessment": {
      "enabled": true,
      "auto_analyze": false
    }
  }', 'AI service configuration')
  
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- ============================================================================
-- CREATE SYSTEM MONITORING VIEWS
-- ============================================================================

-- View for system health monitoring
CREATE OR REPLACE VIEW public.system_health AS
SELECT 
  'users' as metric,
  COUNT(*) as value,
  'Total registered users' as description
FROM public.profiles
UNION ALL
SELECT 
  'animals' as metric,
  COUNT(*) as value,
  'Total animals in system' as description
FROM public.animals
UNION ALL
SELECT 
  'consultations' as metric,
  COUNT(*) as value,
  'Total consultations' as description
FROM public.consultations
UNION ALL
SELECT 
  'storage_objects' as metric,
  COUNT(*) as value,
  'Total files stored' as description
FROM storage.objects
UNION ALL
SELECT 
  'active_tokens' as metric,
  COUNT(*) as value,
  'Active access tokens' as description
FROM public.access_tokens
WHERE expires_at IS NULL OR expires_at > now();

-- View for user activity monitoring
CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT 
  p.role,
  COUNT(*) as user_count,
  AVG(EXTRACT(EPOCH FROM (now() - p.created_at))/86400)::integer as avg_days_since_signup,
  COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as users_with_animals,
  COUNT(CASE WHEN j.id IS NOT NULL THEN 1 END) as users_with_journals
FROM public.profiles p
LEFT JOIN public.animals a ON a.owner_id = p.id
LEFT JOIN public.journal_entries j ON j.author_id = p.id
GROUP BY p.role;

-- ============================================================================
-- CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Function to get system configuration
CREATE OR REPLACE FUNCTION public.get_system_config(config_key text)
RETURNS jsonb AS $$
DECLARE
  config_value jsonb;
BEGIN
  SELECT value INTO config_value
  FROM public.system_config
  WHERE key = config_key;
  
  RETURN config_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update system configuration (admin only)
CREATE OR REPLACE FUNCTION public.update_system_config(
  config_key text,
  config_value jsonb,
  config_description text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Check if user is admin
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can update system configuration';
  END IF;
  
  -- Update or insert configuration
  INSERT INTO public.system_config (key, value, description, created_at, updated_at)
  VALUES (config_key, config_value, config_description, now(), now())
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, system_config.description),
    updated_at = now();
    
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if feature is enabled
CREATE OR REPLACE FUNCTION public.is_feature_enabled(feature_name text)
RETURNS boolean AS $$
DECLARE
  features jsonb;
  is_enabled boolean;
BEGIN
  -- Get features configuration
  features := public.get_system_config('features');
  
  -- Check if feature is enabled
  is_enabled := COALESCE((features->>feature_name)::boolean, false);
  
  RETURN is_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check system maintenance status
CREATE OR REPLACE FUNCTION public.is_maintenance_mode()
RETURNS jsonb AS $$
DECLARE
  maintenance_config jsonb;
BEGIN
  maintenance_config := public.get_system_config('maintenance');
  RETURN maintenance_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE SCHEDULED CLEANUP JOBS (commented out - enable if needed)
-- ============================================================================

-- Note: These would typically be set up as cron jobs or scheduled tasks
-- Uncomment and modify as needed for your deployment

/*
-- Schedule cleanup of expired tokens (daily)
SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT public.cleanup_expired_tokens();');

-- Schedule cleanup of old audit logs (weekly)
SELECT cron.schedule('cleanup-audit-logs', '0 3 * * 0', 'SELECT public.cleanup_old_audit_logs();');

-- Schedule cleanup of old user storage backups (daily)
SELECT cron.schedule('cleanup-old-backups', '0 4 * * *', 
  'SELECT public.cleanup_old_backups(id) FROM public.profiles;');
*/

-- ============================================================================
-- FINAL VERIFICATION AND SUMMARY
-- ============================================================================

-- Final system check
DO $$
DECLARE
    table_count integer;
    bucket_count integer;
    policy_count integer;
    function_count integer;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    -- Count storage buckets
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets;
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count custom functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ShowTrackAI Backend Setup Complete!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Database Tables: %', table_count;
    RAISE NOTICE 'Storage Buckets: %', bucket_count;
    RAISE NOTICE 'Security Policies: %', policy_count;
    RAISE NOTICE 'Custom Functions: %', function_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Configure your .env file with Supabase credentials';
    RAISE NOTICE '2. Set EXPO_PUBLIC_USE_BACKEND=true';
    RAISE NOTICE '3. Install dependencies: npm install';
    RAISE NOTICE '4. Start your app: npm start';
    RAISE NOTICE '';
    RAISE NOTICE 'Your backend is ready for ShowTrackAI! 🚀';
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This final setup script:
-- 1. Verifies all required tables and buckets exist
-- 2. Creates system configuration management
-- 3. Sets up monitoring views
-- 4. Creates utility functions for system management
-- 5. Provides framework for scheduled cleanup jobs
-- 6. Performs final system verification

-- After running this script, your Supabase backend should be fully
-- configured and ready to use with the ShowTrackAI application.

-- Remember to:
-- - Configure your environment variables
-- - Test the connection from your app
-- - Monitor the system health views
-- - Set up proper backup procedures
-- - Configure any needed cron jobs for maintenance