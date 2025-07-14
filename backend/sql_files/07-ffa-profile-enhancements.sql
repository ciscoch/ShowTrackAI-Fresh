-- =========================================================================
-- FFA Profile Enhancements - Extend User Profiles for FFA Features
-- =========================================================================
-- Enhances existing profiles table with FFA-specific fields
-- Safe to run multiple times - uses IF NOT EXISTS
-- =========================================================================

-- Add FFA-specific columns to profiles table if they don't exist
DO $$
BEGIN
    -- Add FFA member ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'ffa_member_id') THEN
        ALTER TABLE public.profiles ADD COLUMN ffa_member_id TEXT;
    END IF;

    -- Add FFA chapter information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'ffa_chapter') THEN
        ALTER TABLE public.profiles ADD COLUMN ffa_chapter TEXT;
    END IF;

    -- Add graduation year
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'graduation_year') THEN
        ALTER TABLE public.profiles ADD COLUMN graduation_year INTEGER;
    END IF;

    -- Add agricultural interests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'agricultural_interests') THEN
        ALTER TABLE public.profiles ADD COLUMN agricultural_interests TEXT[];
    END IF;

    -- Add child user IDs for parent roles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'child_user_ids') THEN
        ALTER TABLE public.profiles ADD COLUMN child_user_ids UUID[];
    END IF;

    -- Add FFA program participation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'ffa_program_active') THEN
        ALTER TABLE public.profiles ADD COLUMN ffa_program_active BOOLEAN DEFAULT false;
    END IF;

    -- Add preferred notification settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'notification_preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
            "email": true,
            "push": true,
            "sms": false,
            "weekly_summary": true,
            "achievement_alerts": true,
            "deadline_reminders": true,
            "motivational_content": true
        }'::jsonb;
    END IF;

    -- Add privacy settings for FFA features
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'privacy_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN privacy_settings JSONB DEFAULT '{
            "share_with_educators": true,
            "share_with_parents": true,
            "share_with_peers": false,
            "research_participation": false,
            "data_analytics": true,
            "public_achievements": false
        }'::jsonb;
    END IF;

    -- Add emergency contact information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'emergency_contact') THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_contact JSONB DEFAULT '{}'::jsonb;
    END IF;

    RAISE NOTICE 'FFA profile enhancements applied successfully';
END
$$;