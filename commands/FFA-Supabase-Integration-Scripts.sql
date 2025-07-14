-- =========================================================================
-- FFA Degree Progress Tracker - Supabase Integration Scripts
-- =========================================================================
-- Copy-paste ready SQL scripts for database setup and configuration
-- Execute in order for proper database initialization
-- =========================================================================

-- =========================================================================
-- SECTION 1: CORE TABLES
-- =========================================================================

-- 1.1 FFA Degree Progress Tracking Table
-- Tracks student progress through FFA degree levels
CREATE TABLE ffa_degree_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    degree_level TEXT NOT NULL CHECK (degree_level IN ('discovery', 'greenhand', 'chapter', 'state', 'american')),
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'awarded')),
    requirements_met JSONB NOT NULL DEFAULT '{}',
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    awarded_date TIMESTAMP WITH TIME ZONE,
    advisor_approved BOOLEAN NOT NULL DEFAULT false,
    advisor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 FFA SAE Projects Table
-- Manages Supervised Agricultural Experience projects
CREATE TABLE ffa_sae_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    project_type TEXT NOT NULL CHECK (project_type IN ('placement', 'entrepreneurship', 'research', 'exploratory')),
    afnr_pathway TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    target_hours INTEGER NOT NULL DEFAULT 0,
    actual_hours INTEGER NOT NULL DEFAULT 0,
    target_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    sae_score DECIMAL(8,2) GENERATED ALWAYS AS (actual_hours * 3.56 + actual_earnings) STORED,
    project_status TEXT NOT NULL CHECK (project_status IN ('planning', 'active', 'completed', 'suspended')),
    records JSONB NOT NULL DEFAULT '[]',
    business_intelligence JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 FFA SAE Records Table
-- Detailed tracking of SAE project activities
CREATE TABLE ffa_sae_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES ffa_sae_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 FFA Motivational Content Table
-- Stores tips, encouragement, and educational content
CREATE TABLE ffa_motivational_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('tip', 'encouragement', 'reminder', 'feedback', 'challenge')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('student', 'parent', 'educator', 'all')),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 FFA Competition Tracking Table
-- Tracks student participation in FFA competitions
CREATE TABLE ffa_competition_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    competition_type TEXT NOT NULL CHECK (competition_type IN ('speech', 'board_meeting', 'radio_podcast', 'project_presentation', 'livestock_judging', 'career_development')),
    competition_name TEXT NOT NULL,
    competition_level TEXT NOT NULL CHECK (competition_level IN ('local', 'district', 'area', 'state', 'national')),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.6 FFA Analytics Events Table
-- Comprehensive analytics for educational insights and business intelligence
CREATE TABLE ffa_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_action TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    device_info JSONB,
    educational_context JSONB,
    privacy_level TEXT NOT NULL CHECK (privacy_level IN ('public', 'aggregated', 'private')) DEFAULT 'private',
    retention_period INTEGER NOT NULL DEFAULT 2555, -- 7 years in days
    anonymized BOOLEAN NOT NULL DEFAULT false
);

-- 1.7 FFA User Interactions Table
-- Tracks user interactions for engagement analytics
CREATE TABLE ffa_user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    interaction_data JSONB NOT NULL DEFAULT '{}',
    engagement_score INTEGER,
    completion_status TEXT,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- SECTION 2: INDEXES FOR PERFORMANCE
-- =========================================================================

-- 2.1 Primary Performance Indexes
CREATE INDEX idx_ffa_degree_progress_user_id ON ffa_degree_progress(user_id);
CREATE INDEX idx_ffa_degree_progress_degree_level ON ffa_degree_progress(degree_level);
CREATE INDEX idx_ffa_degree_progress_status ON ffa_degree_progress(status);

CREATE INDEX idx_ffa_sae_projects_user_id ON ffa_sae_projects(user_id);
CREATE INDEX idx_ffa_sae_projects_status ON ffa_sae_projects(project_status);
CREATE INDEX idx_ffa_sae_projects_type ON ffa_sae_projects(project_type);

CREATE INDEX idx_ffa_sae_records_project_id ON ffa_sae_records(project_id);
CREATE INDEX idx_ffa_sae_records_user_id ON ffa_sae_records(user_id);
CREATE INDEX idx_ffa_sae_records_date ON ffa_sae_records(record_date);

CREATE INDEX idx_ffa_motivational_content_audience ON ffa_motivational_content(target_audience);
CREATE INDEX idx_ffa_motivational_content_category ON ffa_motivational_content(content_category);
CREATE INDEX idx_ffa_motivational_content_active ON ffa_motivational_content(active);

CREATE INDEX idx_ffa_competition_tracking_user_id ON ffa_competition_tracking(user_id);
CREATE INDEX idx_ffa_competition_tracking_type ON ffa_competition_tracking(competition_type);
CREATE INDEX idx_ffa_competition_tracking_date ON ffa_competition_tracking(participation_date);

CREATE INDEX idx_ffa_analytics_events_user_id ON ffa_analytics_events(user_id);
CREATE INDEX idx_ffa_analytics_events_type ON ffa_analytics_events(event_type);
CREATE INDEX idx_ffa_analytics_events_timestamp ON ffa_analytics_events(timestamp);

-- 2.2 Composite Indexes for Complex Queries
CREATE INDEX idx_ffa_sae_projects_user_status ON ffa_sae_projects(user_id, project_status);
CREATE INDEX idx_ffa_analytics_events_user_category ON ffa_analytics_events(user_id, event_category);
CREATE INDEX idx_ffa_competition_tracking_user_date ON ffa_competition_tracking(user_id, participation_date);

-- =========================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- 3.1 Enable RLS on all tables
ALTER TABLE ffa_degree_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffa_sae_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffa_sae_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffa_motivational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffa_competition_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffa_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffa_user_interactions ENABLE ROW LEVEL SECURITY;

-- 3.2 Student Data Access Policies
-- Students can only access their own data
CREATE POLICY student_own_degree_progress ON ffa_degree_progress
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY student_own_sae_projects ON ffa_sae_projects
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY student_own_sae_records ON ffa_sae_records
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY student_own_competition_tracking ON ffa_competition_tracking
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY student_own_analytics_events ON ffa_analytics_events
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY student_own_user_interactions ON ffa_user_interactions
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- 3.3 Educator Access Policies
-- Educators can access their students' data
CREATE POLICY educator_student_degree_progress ON ffa_degree_progress
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'educator'
    AND up.organization_id = (
      SELECT organization_id FROM user_profiles
      WHERE user_id = ffa_degree_progress.user_id
    )
  )
);

CREATE POLICY educator_student_sae_projects ON ffa_sae_projects
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'educator'
    AND up.organization_id = (
      SELECT organization_id FROM user_profiles
      WHERE user_id = ffa_sae_projects.user_id
    )
  )
);

CREATE POLICY educator_student_sae_records ON ffa_sae_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'educator'
    AND up.organization_id = (
      SELECT organization_id FROM user_profiles
      WHERE user_id = ffa_sae_records.user_id
    )
  )
);

CREATE POLICY educator_student_competition_tracking ON ffa_competition_tracking
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'educator'
    AND up.organization_id = (
      SELECT organization_id FROM user_profiles
      WHERE user_id = ffa_competition_tracking.user_id
    )
  )
);

-- 3.4 Parent Access Policies
-- Parents can view their children's data
CREATE POLICY parent_child_degree_progress ON ffa_degree_progress
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'parent'
    AND up.child_user_ids @> ARRAY[ffa_degree_progress.user_id]
  )
);

CREATE POLICY parent_child_sae_projects ON ffa_sae_projects
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'parent'
    AND up.child_user_ids @> ARRAY[ffa_sae_projects.user_id]
  )
);

CREATE POLICY parent_child_competition_tracking ON ffa_competition_tracking
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role = 'parent'
    AND up.child_user_ids @> ARRAY[ffa_competition_tracking.user_id]
  )
);

-- 3.5 Motivational Content Access Policy
-- Active content available to all authenticated users
CREATE POLICY motivational_content_access ON ffa_motivational_content
FOR SELECT TO authenticated
USING (active = true);

-- =========================================================================
-- SECTION 4: FUNCTIONS AND TRIGGERS
-- =========================================================================

-- 4.1 Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Apply timestamp triggers to all tables
CREATE TRIGGER update_ffa_degree_progress_updated_at
    BEFORE UPDATE ON ffa_degree_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ffa_sae_projects_updated_at
    BEFORE UPDATE ON ffa_sae_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ffa_sae_records_updated_at
    BEFORE UPDATE ON ffa_sae_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ffa_motivational_content_updated_at
    BEFORE UPDATE ON ffa_motivational_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ffa_competition_tracking_updated_at
    BEFORE UPDATE ON ffa_competition_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.3 Function to calculate FFA degree progress
CREATE OR REPLACE FUNCTION calculate_ffa_degree_progress(
    user_id_param UUID,
    degree_level_param TEXT
) RETURNS DECIMAL AS $$
DECLARE
    completion_percentage DECIMAL := 0;
    requirements_met JSONB;
    total_requirements INTEGER := 0;
    met_requirements INTEGER := 0;
BEGIN
    -- Get requirements met for the user and degree level
    SELECT dp.requirements_met INTO requirements_met
    FROM ffa_degree_progress dp
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
    SELECT COUNT(*)::INTEGER INTO met_requirements
    FROM jsonb_each_text(requirements_met)
    WHERE value::BOOLEAN = true;
    
    -- Calculate percentage
    IF total_requirements > 0 THEN
        completion_percentage := (met_requirements::DECIMAL / total_requirements::DECIMAL) * 100;
    END IF;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- 4.4 Function to get SAE project summary
CREATE OR REPLACE FUNCTION get_sae_project_summary(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_projects', COUNT(*),
        'active_projects', COUNT(*) FILTER (WHERE project_status = 'active'),
        'completed_projects', COUNT(*) FILTER (WHERE project_status = 'completed'),
        'total_hours', SUM(actual_hours),
        'total_earnings', SUM(actual_earnings),
        'total_sae_score', SUM(sae_score),
        'average_score', AVG(sae_score)
    ) INTO result
    FROM ffa_sae_projects
    WHERE user_id = user_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- SECTION 5: VIEWS FOR COMMON QUERIES
-- =========================================================================

-- 5.1 Student Progress Overview View
CREATE VIEW ffa_student_progress_overview AS
SELECT 
    dp.user_id,
    dp.degree_level,
    dp.status,
    dp.completion_percentage,
    dp.awarded_date,
    sae_summary.total_projects,
    sae_summary.total_hours,
    sae_summary.total_earnings,
    sae_summary.total_sae_score,
    competition_summary.total_competitions,
    competition_summary.recent_competitions
FROM ffa_degree_progress dp
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as total_projects,
        SUM(actual_hours) as total_hours,
        SUM(actual_earnings) as total_earnings,
        SUM(sae_score) as total_sae_score
    FROM ffa_sae_projects 
    WHERE user_id = dp.user_id
) sae_summary ON true
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as total_competitions,
        COUNT(*) FILTER (WHERE participation_date > NOW() - INTERVAL '30 days') as recent_competitions
    FROM ffa_competition_tracking 
    WHERE user_id = dp.user_id
) competition_summary ON true;

-- 5.2 Educator Dashboard View
CREATE VIEW ffa_educator_dashboard AS
SELECT 
    up.organization_id,
    COUNT(DISTINCT dp.user_id) as total_students,
    COUNT(DISTINCT dp.user_id) FILTER (WHERE dp.status = 'in_progress') as students_in_progress,
    COUNT(DISTINCT dp.user_id) FILTER (WHERE dp.status = 'completed') as students_completed,
    AVG(dp.completion_percentage) as avg_completion_percentage,
    COUNT(DISTINCT sp.id) as total_sae_projects,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.project_status = 'active') as active_sae_projects,
    COUNT(DISTINCT ct.id) as total_competitions,
    COUNT(DISTINCT ct.id) FILTER (WHERE ct.participation_date > NOW() - INTERVAL '30 days') as recent_competitions
FROM user_profiles up
LEFT JOIN ffa_degree_progress dp ON up.user_id = dp.user_id
LEFT JOIN ffa_sae_projects sp ON up.user_id = sp.user_id
LEFT JOIN ffa_competition_tracking ct ON up.user_id = ct.user_id
WHERE up.role = 'student'
GROUP BY up.organization_id;

-- =========================================================================
-- SECTION 6: SAMPLE DATA INSERTION
-- =========================================================================

-- 6.1 Insert sample motivational content
INSERT INTO ffa_motivational_content (
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
);

-- 6.2 Insert sample FFA degree requirements structure
INSERT INTO ffa_degree_progress (user_id, degree_level, status, requirements_met, completion_percentage)
SELECT 
    auth.uid(),
    'discovery',
    'in_progress',
    '{"basic_agriculture": true, "ffa_history": true, "sae_planned": false, "leadership_activity": false, "community_service": false, "agricultural_literacy": false}'::jsonb,
    33.33
WHERE auth.uid() IS NOT NULL;

-- =========================================================================
-- SECTION 7: ANALYTICS FUNCTIONS
-- =========================================================================

-- 7.1 Function to track analytics events
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
    INSERT INTO ffa_analytics_events (
        user_id, event_type, event_category, event_action, 
        event_data, privacy_level
    ) VALUES (
        user_id_param, event_type_param, event_category_param, 
        event_action_param, event_data_param, privacy_level_param
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- 7.2 Function to get engagement metrics
CREATE OR REPLACE FUNCTION get_ffa_engagement_metrics(
    user_id_param UUID,
    days_back INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_events', COUNT(*),
        'unique_event_types', COUNT(DISTINCT event_type),
        'avg_events_per_day', COUNT(*)::DECIMAL / days_back,
        'most_common_category', mode() WITHIN GROUP (ORDER BY event_category),
        'recent_activity', COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days')
    ) INTO result
    FROM ffa_analytics_events
    WHERE user_id = user_id_param 
    AND timestamp > NOW() - INTERVAL '1 day' * days_back;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- SECTION 8: VALIDATION QUERIES
-- =========================================================================

-- 8.1 Validate table creation
SELECT 
    tablename,
    tableowner,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'ffa_%'
ORDER BY tablename;

-- 8.2 Validate indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'ffa_%'
ORDER BY tablename, indexname;

-- 8.3 Validate RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'ffa_%'
ORDER BY tablename, policyname;

-- 8.4 Test data integrity
SELECT 
    'ffa_degree_progress' as table_name,
    COUNT(*) as row_count
FROM ffa_degree_progress
UNION ALL
SELECT 
    'ffa_sae_projects' as table_name,
    COUNT(*) as row_count
FROM ffa_sae_projects
UNION ALL
SELECT 
    'ffa_motivational_content' as table_name,
    COUNT(*) as row_count
FROM ffa_motivational_content;

-- =========================================================================
-- EXECUTION NOTES
-- =========================================================================

/*
COPY-PASTE EXECUTION ORDER:
1. Execute SECTION 1 (Core Tables) - Creates all main tables
2. Execute SECTION 2 (Indexes) - Creates performance indexes  
3. Execute SECTION 3 (RLS Policies) - Sets up security policies
4. Execute SECTION 4 (Functions & Triggers) - Creates utility functions
5. Execute SECTION 5 (Views) - Creates convenient query views
6. Execute SECTION 6 (Sample Data) - Optional: Insert sample data
7. Execute SECTION 7 (Analytics Functions) - Creates analytics utilities
8. Execute SECTION 8 (Validation) - Verify successful setup

PREREQUISITES:
- Supabase project with auth.users table
- user_profiles table with role and organization_id columns
- PostgreSQL version 13+ (for generated columns)

VALIDATION STEPS:
1. Check table creation with Section 8.1 query
2. Verify indexes with Section 8.2 query  
3. Confirm RLS policies with Section 8.3 query
4. Test sample data with Section 8.4 query

TROUBLESHOOTING:
- If foreign key errors occur, ensure auth.users exists
- If RLS policies fail, check user_profiles table structure
- If functions fail, verify PostgreSQL version supports plpgsql
- If sample data fails, check auth.uid() returns valid UUID
*/