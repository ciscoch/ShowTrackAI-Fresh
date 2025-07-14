-- =========================================================================
-- FFA Degree Progress Tracker - Database Extension
-- =========================================================================
-- Extends existing ShowTrackAI database with FFA degree tracking capabilities
-- Execute after main database schema is created
-- =========================================================================

-- Add FFA-specific enums to existing system
DO $$ BEGIN
    CREATE TYPE ffa_degree_level AS ENUM ('discovery', 'greenhand', 'chapter', 'state', 'american');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE ffa_degree_status AS ENUM ('not_started', 'in_progress', 'completed', 'awarded');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE sae_project_type AS ENUM ('placement', 'entrepreneurship', 'research', 'exploratory');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE sae_project_status AS ENUM ('planning', 'active', 'completed', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE competition_type AS ENUM ('speech', 'board_meeting', 'radio_podcast', 'project_presentation', 'livestock_judging', 'career_development');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE competition_level AS ENUM ('local', 'district', 'area', 'state', 'national');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE motivational_content_type AS ENUM ('tip', 'encouragement', 'reminder', 'feedback', 'challenge');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE motivational_audience AS ENUM ('student', 'parent', 'educator', 'all');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================================
-- FFA DEGREE PROGRESS TRACKING
-- =========================================================================

-- FFA Degree Progress Table
CREATE TABLE IF NOT EXISTS public.ffa_degree_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    degree_level ffa_degree_level NOT NULL,
    status ffa_degree_status NOT NULL DEFAULT 'not_started',
    requirements_met JSONB NOT NULL DEFAULT '{}',
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    awarded_date TIMESTAMP WITH TIME ZONE,
    advisor_approved BOOLEAN NOT NULL DEFAULT false,
    advisor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, degree_level)
);

-- FFA SAE Projects Table  
CREATE TABLE IF NOT EXISTS public.ffa_sae_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    project_type sae_project_type NOT NULL,
    afnr_pathway TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    target_hours INTEGER NOT NULL DEFAULT 0,
    actual_hours INTEGER NOT NULL DEFAULT 0,
    target_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    sae_score DECIMAL(8,2) GENERATED ALWAYS AS (actual_hours * 3.56 + actual_earnings) STORED,
    project_status sae_project_status NOT NULL DEFAULT 'planning',
    records JSONB NOT NULL DEFAULT '[]',
    business_intelligence JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FFA SAE Records Table
CREATE TABLE IF NOT EXISTS public.ffa_sae_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.ffa_sae_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('labor', 'expense', 'income', 'learning')),
    description TEXT NOT NULL,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    expense_amount DECIMAL(10,2) DEFAULT 0,
    income_amount DECIMAL(10,2) DEFAULT 0,
    category TEXT,
    supporting_documents TEXT[],
    learning_objectives TEXT[],
    competencies_demonstrated TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- MOTIVATIONAL CONTENT SYSTEM
-- =========================================================================

-- Motivational Content Table
CREATE TABLE IF NOT EXISTS public.ffa_motivational_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type motivational_content_type NOT NULL,
    target_audience motivational_audience NOT NULL,
    content_title TEXT NOT NULL,
    content_text TEXT NOT NULL,
    content_category TEXT NOT NULL,
    context_tags TEXT[] NOT NULL DEFAULT '{}',
    age_appropriate BOOLEAN NOT NULL DEFAULT true,
    grade_level TEXT[] DEFAULT '{}',
    seasonal_relevance TEXT[] DEFAULT '{}',
    educational_value JSONB NOT NULL DEFAULT '{}',
    engagement_metrics JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- COMPETITION TRACKING
-- =========================================================================

-- Competition Tracking Table
CREATE TABLE IF NOT EXISTS public.ffa_competition_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    competition_type competition_type NOT NULL,
    competition_name TEXT NOT NULL,
    competition_level competition_level NOT NULL,
    participation_date DATE NOT NULL,
    placement TEXT,
    score DECIMAL(6,2),
    feedback_received TEXT,
    skills_demonstrated TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    next_steps TEXT,
    advisor_feedback TEXT,
    parent_notified BOOLEAN NOT NULL DEFAULT false,
    analytics_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- ANALYTICS & BUSINESS INTELLIGENCE
-- =========================================================================

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.ffa_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_agent TEXT,
    device_info JSONB,
    educational_context JSONB,
    privacy_level TEXT NOT NULL CHECK (privacy_level IN ('public', 'aggregated', 'private')) DEFAULT 'private',
    retention_period INTEGER NOT NULL DEFAULT 2555, -- 7 years in days
    anonymized BOOLEAN NOT NULL DEFAULT false
);

-- User Interactions Table
CREATE TABLE IF NOT EXISTS public.ffa_user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    interaction_data JSONB NOT NULL DEFAULT '{}',
    engagement_score INTEGER,
    completion_status TEXT,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- PERFORMANCE INDEXES
-- =========================================================================

-- Degree Progress Indexes
CREATE INDEX IF NOT EXISTS idx_ffa_degree_progress_user_id ON public.ffa_degree_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ffa_degree_progress_degree_level ON public.ffa_degree_progress(degree_level);
CREATE INDEX IF NOT EXISTS idx_ffa_degree_progress_status ON public.ffa_degree_progress(status);

-- SAE Projects Indexes
CREATE INDEX IF NOT EXISTS idx_ffa_sae_projects_user_id ON public.ffa_sae_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ffa_sae_projects_status ON public.ffa_sae_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_ffa_sae_projects_type ON public.ffa_sae_projects(project_type);

-- SAE Records Indexes
CREATE INDEX IF NOT EXISTS idx_ffa_sae_records_project_id ON public.ffa_sae_records(project_id);
CREATE INDEX IF NOT EXISTS idx_ffa_sae_records_user_id ON public.ffa_sae_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ffa_sae_records_date ON public.ffa_sae_records(record_date);

-- Motivational Content Indexes
CREATE INDEX IF NOT EXISTS idx_ffa_motivational_content_audience ON public.ffa_motivational_content(target_audience);
CREATE INDEX IF NOT EXISTS idx_ffa_motivational_content_category ON public.ffa_motivational_content(content_category);
CREATE INDEX IF NOT EXISTS idx_ffa_motivational_content_active ON public.ffa_motivational_content(active);

-- Competition Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_ffa_competition_tracking_user_id ON public.ffa_competition_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ffa_competition_tracking_type ON public.ffa_competition_tracking(competition_type);
CREATE INDEX IF NOT EXISTS idx_ffa_competition_tracking_date ON public.ffa_competition_tracking(participation_date);

-- Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_ffa_analytics_events_user_id ON public.ffa_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ffa_analytics_events_type ON public.ffa_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ffa_analytics_events_timestamp ON public.ffa_analytics_events(timestamp);

-- Composite Indexes for Complex Queries
CREATE INDEX IF NOT EXISTS idx_ffa_sae_projects_user_status ON public.ffa_sae_projects(user_id, project_status);
CREATE INDEX IF NOT EXISTS idx_ffa_analytics_events_user_category ON public.ffa_analytics_events(user_id, event_category);
CREATE INDEX IF NOT EXISTS idx_ffa_competition_tracking_user_date ON public.ffa_competition_tracking(user_id, participation_date);

-- =========================================================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================================================

-- Enable RLS on all FFA tables
ALTER TABLE public.ffa_degree_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ffa_sae_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ffa_sae_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ffa_motivational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ffa_competition_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ffa_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ffa_user_interactions ENABLE ROW LEVEL SECURITY;

-- Student Data Access Policies
CREATE POLICY IF NOT EXISTS "student_own_degree_progress" ON public.ffa_degree_progress
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "student_own_sae_projects" ON public.ffa_sae_projects
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "student_own_sae_records" ON public.ffa_sae_records
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "student_own_competition_tracking" ON public.ffa_competition_tracking
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "student_own_analytics_events" ON public.ffa_analytics_events
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "student_own_user_interactions" ON public.ffa_user_interactions
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- Educator Access Policies (can view students in their organization)
CREATE POLICY IF NOT EXISTS "educator_student_degree_progress" ON public.ffa_degree_progress
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'educator'
    AND up.organization_id = (
      SELECT organization_id FROM public.profiles
      WHERE id = ffa_degree_progress.user_id
    )
  )
);

CREATE POLICY IF NOT EXISTS "educator_student_sae_projects" ON public.ffa_sae_projects
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'educator'
    AND up.organization_id = (
      SELECT organization_id FROM public.profiles
      WHERE id = ffa_sae_projects.user_id
    )
  )
);

CREATE POLICY IF NOT EXISTS "educator_student_competition_tracking" ON public.ffa_competition_tracking
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'educator'
    AND up.organization_id = (
      SELECT organization_id FROM public.profiles
      WHERE id = ffa_competition_tracking.user_id
    )
  )
);

-- Motivational Content Access Policy (active content for all authenticated users)
CREATE POLICY IF NOT EXISTS "motivational_content_access" ON public.ffa_motivational_content
FOR SELECT TO authenticated
USING (active = true);

-- =========================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =========================================================================

-- Apply updated_at triggers to FFA tables
CREATE TRIGGER IF NOT EXISTS handle_updated_at_ffa_degree_progress 
BEFORE UPDATE ON public.ffa_degree_progress
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS handle_updated_at_ffa_sae_projects 
BEFORE UPDATE ON public.ffa_sae_projects
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS handle_updated_at_ffa_sae_records 
BEFORE UPDATE ON public.ffa_sae_records
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS handle_updated_at_ffa_motivational_content 
BEFORE UPDATE ON public.ffa_motivational_content
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS handle_updated_at_ffa_competition_tracking 
BEFORE UPDATE ON public.ffa_competition_tracking
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =========================================================================
-- UTILITY FUNCTIONS
-- =========================================================================

-- Function to calculate FFA degree progress
CREATE OR REPLACE FUNCTION calculate_ffa_degree_progress(
    user_id_param UUID,
    degree_level_param ffa_degree_level
) RETURNS DECIMAL AS $$
DECLARE
    completion_percentage DECIMAL := 0;
    requirements_met JSONB;
    total_requirements INTEGER := 0;
    met_requirements INTEGER := 0;
BEGIN
    -- Get requirements met for the user and degree level
    SELECT dp.requirements_met INTO requirements_met
    FROM public.ffa_degree_progress dp
    WHERE dp.user_id = user_id_param AND dp.degree_level = degree_level_param;
    
    -- Calculate based on degree level
    CASE degree_level_param
        WHEN 'discovery' THEN
            total_requirements := 6;
        WHEN 'greenhand' THEN
            total_requirements := 8;
        WHEN 'chapter' THEN
            total_requirements := 10;
        WHEN 'state' THEN
            total_requirements := 12;
        WHEN 'american' THEN
            total_requirements := 15;
    END CASE;
    
    -- Count met requirements
    IF requirements_met IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO met_requirements
        FROM jsonb_each_text(requirements_met)
        WHERE value::BOOLEAN = true;
    END IF;
    
    -- Calculate percentage
    IF total_requirements > 0 THEN
        completion_percentage := (met_requirements::DECIMAL / total_requirements::DECIMAL) * 100;
    END IF;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to get SAE project summary
CREATE OR REPLACE FUNCTION get_sae_project_summary(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_projects', COUNT(*),
        'active_projects', COUNT(*) FILTER (WHERE project_status = 'active'),
        'completed_projects', COUNT(*) FILTER (WHERE project_status = 'completed'),
        'total_hours', COALESCE(SUM(actual_hours), 0),
        'total_earnings', COALESCE(SUM(actual_earnings), 0),
        'total_sae_score', COALESCE(SUM(sae_score), 0),
        'average_score', COALESCE(AVG(sae_score), 0)
    ) INTO result
    FROM public.ffa_sae_projects
    WHERE user_id = user_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to track analytics events
CREATE OR REPLACE FUNCTION track_ffa_analytics_event(
    user_id_param UUID,
    event_type_param TEXT,
    event_category_param TEXT,
    event_action_param TEXT,
    event_data_param JSONB DEFAULT '{}'::jsonb,
    privacy_level_param TEXT DEFAULT 'private'
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.ffa_analytics_events (
        user_id, event_type, event_category, event_action, 
        event_data, privacy_level
    ) VALUES (
        user_id_param, event_type_param, event_category_param, 
        event_action_param, event_data_param, privacy_level_param
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- SAMPLE DATA INSERTION
-- =========================================================================

-- Insert sample motivational content
INSERT INTO public.ffa_motivational_content (
    content_type, target_audience, content_title, content_text, content_category, 
    context_tags, educational_value
) VALUES
-- Student motivational tips
(
    'tip', 'student', 'Setting SMART SAE Goals',
    'Make your SAE goals Specific, Measurable, Achievable, Relevant, and Time-bound. Example: "I will increase my cattle herd by 5 head over the next 6 months to earn $2,000 in profit."',
    'sae_planning',
    ARRAY['goal_setting', 'sae', 'planning', 'smart_goals'],
    '{"competencies": ["goal_setting", "project_planning"], "standards": ["AFNR.1.1", "AFNR.1.2"]}'::jsonb
),
(
    'encouragement', 'student', 'Competition Preparation Mindset',
    'Remember: Every expert was once a beginner. Your first speech or presentation is a step toward mastery. Focus on sharing your passion for agriculture rather than perfection.',
    'competition_prep',
    ARRAY['competition', 'speech', 'confidence', 'mindset'],
    '{"competencies": ["communication", "leadership"], "standards": ["AFNR.2.1", "AFNR.2.3"]}'::jsonb
),
-- Parent accountability reminders
(
    'reminder', 'parent', 'Monthly SAE Check-in',
    'This week, ask your student about their SAE project progress. Review their record book and celebrate their achievements. Your involvement shows you value their agricultural education.',
    'parent_engagement',
    ARRAY['sae', 'parent', 'accountability', 'support'],
    '{"competencies": ["family_support", "accountability"], "standards": ["AFNR.3.1"]}'::jsonb
),
-- Educator feedback guidance
(
    'feedback', 'educator', 'Constructive Competition Feedback',
    'When providing feedback after competitions, use the "Glow and Grow" method: highlight what they did well (glow) and provide specific areas for improvement (grow). This builds confidence while promoting growth.',
    'teaching_strategies',
    ARRAY['feedback', 'competition', 'teaching', 'growth'],
    '{"competencies": ["feedback_delivery", "student_development"], "standards": ["AFNR.4.1", "AFNR.4.2"]}'::jsonb
)
ON CONFLICT DO NOTHING;

-- =========================================================================
-- VALIDATION QUERIES
-- =========================================================================

-- Validate table creation
DO $$
BEGIN
    RAISE NOTICE 'FFA tables created successfully:';
    RAISE NOTICE '- ffa_degree_progress: % rows', (SELECT COUNT(*) FROM public.ffa_degree_progress);
    RAISE NOTICE '- ffa_sae_projects: % rows', (SELECT COUNT(*) FROM public.ffa_sae_projects);
    RAISE NOTICE '- ffa_sae_records: % rows', (SELECT COUNT(*) FROM public.ffa_sae_records);
    RAISE NOTICE '- ffa_motivational_content: % rows', (SELECT COUNT(*) FROM public.ffa_motivational_content);
    RAISE NOTICE '- ffa_competition_tracking: % rows', (SELECT COUNT(*) FROM public.ffa_competition_tracking);
    RAISE NOTICE '- ffa_analytics_events: % rows', (SELECT COUNT(*) FROM public.ffa_analytics_events);
    RAISE NOTICE '- ffa_user_interactions: % rows', (SELECT COUNT(*) FROM public.ffa_user_interactions);
END $$;

-- =========================================================================
-- EXECUTION COMPLETE
-- =========================================================================