-- ============================================================================
-- USER STORAGE TABLE FOR SUPABASE STORAGE ADAPTER
-- This table enables the SupabaseStorageAdapter to work properly
-- ============================================================================

-- Create user storage table for key-value pairs
-- This replaces AsyncStorage functionality when using Supabase backend
CREATE TABLE IF NOT EXISTS public.user_storage (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  value jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure each user can only have one record per key
  UNIQUE(user_id, key)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup index for user + key combinations
CREATE INDEX IF NOT EXISTS idx_user_storage_user_key ON public.user_storage(user_id, key);

-- Index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON public.user_storage(user_id);

-- Index for key-based searches
CREATE INDEX IF NOT EXISTS idx_user_storage_key ON public.user_storage(key);

-- Index for created_at for backup/sync operations
CREATE INDEX IF NOT EXISTS idx_user_storage_created_at ON public.user_storage(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on user_storage table
ALTER TABLE public.user_storage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own storage data
CREATE POLICY "Users can manage their own storage" ON public.user_storage
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to read their own storage
CREATE POLICY "Users can read their own storage" ON public.user_storage
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow users to insert their own storage
CREATE POLICY "Users can insert their own storage" ON public.user_storage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own storage
CREATE POLICY "Users can update their own storage" ON public.user_storage
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own storage
CREATE POLICY "Users can delete their own storage" ON public.user_storage
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER handle_updated_at_user_storage 
  BEFORE UPDATE ON public.user_storage
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================================================
-- STORAGE KEY CONSTANTS (for reference)
-- ============================================================================

-- These are the storage keys that the app uses:
-- '@ShowTrackAI:animals'
-- '@ShowTrackAI:expenses'
-- '@ShowTrackAI:income'
-- '@ShowTrackAI:journal'
-- '@ShowTrackAI:weights'
-- '@ShowTrackAI:subscription'
-- '@ShowTrackAI:rewards'
-- '@ShowTrackAI:ffaProfiles'
-- '@ShowTrackAI:preferences'
-- '@ShowTrackAI:healthRecords'
-- '@ShowTrackAI:healthAlerts'
-- '@ShowTrackAI:financialEntries'
-- '@ShowTrackAI:timeTracking'
-- '@ShowTrackAI:followUpTasks'
-- '@ShowTrackAI:followUpUpdates'
-- '@ShowTrackAI:educatorMonitoring'
-- '@ShowTrackAI:helpContent'
-- '@ShowTrackAI:contextualHelp'
-- '@ShowTrackAI:dataVersion'
-- '@ShowTrackAI:lastBackup'
-- '@ShowTrackAI:appMetadata'

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to migrate data from local storage format
CREATE OR REPLACE FUNCTION public.migrate_local_storage_data(
  p_user_id uuid,
  p_storage_data jsonb
)
RETURNS void AS $$
DECLARE
  key_name text;
  key_value jsonb;
BEGIN
  -- Iterate through each key-value pair in the storage data
  FOR key_name, key_value IN SELECT * FROM jsonb_each(p_storage_data) LOOP
    -- Insert or update the storage record
    INSERT INTO public.user_storage (user_id, key, value, created_at, updated_at)
    VALUES (p_user_id, key_name, key_value, now(), now())
    ON CONFLICT (user_id, key)
    DO UPDATE SET 
      value = EXCLUDED.value,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user storage data
CREATE OR REPLACE FUNCTION public.export_user_storage_data(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}';
  storage_record RECORD;
BEGIN
  -- Build a JSON object with all user storage data
  FOR storage_record IN 
    SELECT key, value FROM public.user_storage 
    WHERE user_id = p_user_id 
    ORDER BY key
  LOOP
    result := result || jsonb_build_object(storage_record.key, storage_record.value);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to backup user storage data with timestamp
CREATE OR REPLACE FUNCTION public.backup_user_storage(p_user_id uuid)
RETURNS text AS $$
DECLARE
  backup_key text;
  storage_data jsonb;
BEGIN
  -- Generate backup key with timestamp
  backup_key := 'backup_' || extract(epoch from now())::text;
  
  -- Get all user storage data
  storage_data := public.export_user_storage_data(p_user_id);
  
  -- Store the backup
  INSERT INTO public.user_storage (user_id, key, value, created_at, updated_at)
  VALUES (
    p_user_id, 
    backup_key, 
    jsonb_build_object(
      'timestamp', now(),
      'data', storage_data
    ),
    now(),
    now()
  );
  
  RETURN backup_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore from backup
CREATE OR REPLACE FUNCTION public.restore_user_storage(p_user_id uuid, p_backup_key text)
RETURNS boolean AS $$
DECLARE
  backup_data jsonb;
  restore_data jsonb;
BEGIN
  -- Get the backup data
  SELECT value INTO backup_data 
  FROM public.user_storage 
  WHERE user_id = p_user_id AND key = p_backup_key;
  
  IF backup_data IS NULL THEN
    RETURN false;
  END IF;
  
  -- Extract the actual data from the backup
  restore_data := backup_data->'data';
  
  IF restore_data IS NOT NULL THEN
    -- Clear existing data (except backups)
    DELETE FROM public.user_storage 
    WHERE user_id = p_user_id AND key NOT LIKE 'backup_%';
    
    -- Restore the data
    PERFORM public.migrate_local_storage_data(p_user_id, restore_data);
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up old backups (keep only last 5)
CREATE OR REPLACE FUNCTION public.cleanup_old_backups(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH old_backups AS (
    SELECT id
    FROM public.user_storage
    WHERE user_id = p_user_id 
    AND key LIKE 'backup_%'
    ORDER BY created_at DESC
    OFFSET 5  -- Keep the 5 most recent
  )
  DELETE FROM public.user_storage
  WHERE id IN (SELECT id FROM old_backups);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This table serves as a cloud-based replacement for AsyncStorage
-- Key features:
-- 1. Stores key-value pairs per user
-- 2. Uses JSONB for flexible value storage
-- 3. Maintains backward compatibility with existing storage keys
-- 4. Includes backup/restore functionality
-- 5. Automatic cleanup of old backups
-- 6. Full RLS security
-- 7. Performance indexes for fast lookups

-- Usage by SupabaseStorageAdapter:
-- - get(key) -> SELECT value FROM user_storage WHERE user_id = ? AND key = ?
-- - set(key, value) -> INSERT/UPDATE user_storage
-- - remove(key) -> DELETE FROM user_storage WHERE user_id = ? AND key = ?
-- - getAllKeys() -> SELECT key FROM user_storage WHERE user_id = ?
-- - backup() -> Call backup_user_storage function
-- - restore(data) -> Call restore_user_storage function