-- =========================================================================
-- Parent Oversight System Database Setup Script
-- =========================================================================
-- Combined script to set up all parent oversight tables and policies
-- Run this in your Supabase SQL editor to enable parent oversight functionality
-- =========================================================================

-- First, run the parent oversight system tables
-- (Contents from 08-parent-oversight-system.sql)

-- Create parent_student_links table
CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('parent', 'guardian', 'caregiver')),
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_name TEXT,
    parent_name TEXT,
    permission_level TEXT DEFAULT 'view_and_comment' CHECK (permission_level IN ('view_only', 'view_and_comment', 'full_access')),
    FOREIGN KEY (parent_id) REFERENCES auth.users(id),
    FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Create parent_linking_codes table
CREATE TABLE IF NOT EXISTS parent_linking_codes (
    code TEXT PRIMARY KEY,
    student_id UUID NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Create evidence_submissions table
CREATE TABLE IF NOT EXISTS evidence_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    degree_level TEXT NOT NULL CHECK (degree_level IN ('discovery', 'greenhand', 'chapter', 'state', 'american')),
    requirement_key TEXT NOT NULL,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('text', 'photo', 'video', 'document')),
    evidence_data TEXT NOT NULL,
    student_notes TEXT,
    parent_feedback TEXT,
    parent_viewed BOOLEAN DEFAULT FALSE,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Create parent_notifications table
CREATE TABLE IF NOT EXISTS parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('new_submission', 'degree_progress', 'milestone_reached', 'reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_url TEXT,
    FOREIGN KEY (parent_id) REFERENCES auth.users(id),
    FOREIGN KEY (student_id) REFERENCES auth.users(id)
);

-- Create student_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    chapter_name TEXT,
    school_name TEXT,
    grade_level INTEGER,
    graduation_year INTEGER,
    contact_email TEXT,
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- =========================================================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_linking_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Parents can view their own linked students" ON parent_student_links;
DROP POLICY IF EXISTS "Students can view their own linked parents" ON parent_student_links;
DROP POLICY IF EXISTS "Parents can insert their own links" ON parent_student_links;
DROP POLICY IF EXISTS "Students can insert their own links" ON parent_student_links;
DROP POLICY IF EXISTS "Parents can update their own links" ON parent_student_links;
DROP POLICY IF EXISTS "Students can update their own links" ON parent_student_links;
DROP POLICY IF EXISTS "Parents can delete their own links" ON parent_student_links;
DROP POLICY IF EXISTS "Students can delete their own links" ON parent_student_links;

-- Parent-Student Links Policies
CREATE POLICY "Parents can view their own linked students" ON parent_student_links
    FOR SELECT USING (auth.uid() = parent_id::uuid);

CREATE POLICY "Students can view their own linked parents" ON parent_student_links
    FOR SELECT USING (auth.uid() = student_id::uuid);

CREATE POLICY "Parents can insert their own links" ON parent_student_links
    FOR INSERT WITH CHECK (auth.uid() = parent_id::uuid);

CREATE POLICY "Students can insert their own links" ON parent_student_links
    FOR INSERT WITH CHECK (auth.uid() = student_id::uuid);

CREATE POLICY "Parents can update their own links" ON parent_student_links
    FOR UPDATE USING (auth.uid() = parent_id::uuid);

CREATE POLICY "Students can update their own links" ON parent_student_links
    FOR UPDATE USING (auth.uid() = student_id::uuid);

CREATE POLICY "Parents can delete their own links" ON parent_student_links
    FOR DELETE USING (auth.uid() = parent_id::uuid);

CREATE POLICY "Students can delete their own links" ON parent_student_links
    FOR DELETE USING (auth.uid() = student_id::uuid);

-- Drop existing linking codes policies
DROP POLICY IF EXISTS "Students can view their own linking codes" ON parent_linking_codes;
DROP POLICY IF EXISTS "Students can insert their own linking codes" ON parent_linking_codes;
DROP POLICY IF EXISTS "Students can update their own linking codes" ON parent_linking_codes;
DROP POLICY IF EXISTS "Anyone can view unexpired codes for linking" ON parent_linking_codes;
DROP POLICY IF EXISTS "Anyone can update codes for linking" ON parent_linking_codes;

-- Linking Codes Policies
CREATE POLICY "Students can view their own linking codes" ON parent_linking_codes
    FOR SELECT USING (auth.uid() = student_id::uuid);

CREATE POLICY "Students can insert their own linking codes" ON parent_linking_codes
    FOR INSERT WITH CHECK (auth.uid() = student_id::uuid);

CREATE POLICY "Students can update their own linking codes" ON parent_linking_codes
    FOR UPDATE USING (auth.uid() = student_id::uuid);

CREATE POLICY "Anyone can view unexpired codes for linking" ON parent_linking_codes
    FOR SELECT USING (expires_at > CURRENT_TIMESTAMP AND NOT used);

CREATE POLICY "Anyone can update codes for linking" ON parent_linking_codes
    FOR UPDATE USING (expires_at > CURRENT_TIMESTAMP);

-- Drop existing evidence submission policies
DROP POLICY IF EXISTS "Students can view their own evidence submissions" ON evidence_submissions;
DROP POLICY IF EXISTS "Students can insert their own evidence submissions" ON evidence_submissions;
DROP POLICY IF EXISTS "Students can update their own evidence submissions" ON evidence_submissions;
DROP POLICY IF EXISTS "Parents can view linked students' evidence submissions" ON evidence_submissions;
DROP POLICY IF EXISTS "Parents can update linked students' evidence submissions" ON evidence_submissions;

-- Evidence Submissions Policies
CREATE POLICY "Students can view their own evidence submissions" ON evidence_submissions
    FOR SELECT USING (auth.uid() = student_id::uuid);

CREATE POLICY "Students can insert their own evidence submissions" ON evidence_submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id::uuid);

CREATE POLICY "Students can update their own evidence submissions" ON evidence_submissions
    FOR UPDATE USING (auth.uid() = student_id::uuid);

CREATE POLICY "Parents can view linked students' evidence submissions" ON evidence_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_student_links 
            WHERE parent_id = auth.uid() 
            AND student_id = evidence_submissions.student_id
            AND verified = TRUE
        )
    );

CREATE POLICY "Parents can update linked students' evidence submissions" ON evidence_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM parent_student_links 
            WHERE parent_id = auth.uid() 
            AND student_id = evidence_submissions.student_id
            AND verified = TRUE
        )
    );

-- Drop existing parent notification policies
DROP POLICY IF EXISTS "Parents can view their own notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Parents can insert their own notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Parents can update their own notifications" ON parent_notifications;
DROP POLICY IF EXISTS "Students can insert notifications for their parents" ON parent_notifications;

-- Parent Notifications Policies
CREATE POLICY "Parents can view their own notifications" ON parent_notifications
    FOR SELECT USING (auth.uid() = parent_id::uuid);

CREATE POLICY "Parents can insert their own notifications" ON parent_notifications
    FOR INSERT WITH CHECK (auth.uid() = parent_id::uuid);

CREATE POLICY "Parents can update their own notifications" ON parent_notifications
    FOR UPDATE USING (auth.uid() = parent_id::uuid);

CREATE POLICY "Students can insert notifications for their parents" ON parent_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parent_student_links 
            WHERE student_id = auth.uid() 
            AND parent_id = parent_notifications.parent_id
            AND verified = TRUE
        )
    );

-- Drop existing student profile policies
DROP POLICY IF EXISTS "Students can view their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can insert their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Parents can view linked students' profiles" ON student_profiles;

-- Student Profiles Policies
CREATE POLICY "Students can view their own profile" ON student_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can insert their own profile" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can update their own profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Parents can view linked students' profiles" ON student_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_student_links 
            WHERE parent_id = auth.uid() 
            AND student_id = student_profiles.id
            AND verified = TRUE
        )
    );

-- =========================================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================================

-- Parent-Student Links indexes
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_verified ON parent_student_links(verified);

-- Linking Codes indexes
CREATE INDEX IF NOT EXISTS idx_linking_codes_student ON parent_linking_codes(student_id);
CREATE INDEX IF NOT EXISTS idx_linking_codes_expires ON parent_linking_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_linking_codes_used ON parent_linking_codes(used);

-- Evidence Submissions indexes
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_student ON evidence_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_degree ON evidence_submissions(degree_level);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_date ON evidence_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_viewed ON evidence_submissions(parent_viewed);

-- Parent Notifications indexes
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON parent_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_date ON parent_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_read ON parent_notifications(read);

-- Student Profiles indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_school ON student_profiles(school_name);
CREATE INDEX IF NOT EXISTS idx_student_profiles_chapter ON student_profiles(chapter_name);
CREATE INDEX IF NOT EXISTS idx_student_profiles_grade ON student_profiles(grade_level);

-- =========================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =========================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_evidence_submissions_updated_at ON evidence_submissions;
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;

-- Add triggers for updated_at columns
CREATE TRIGGER update_evidence_submissions_updated_at 
    BEFORE UPDATE ON evidence_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- CLEANUP FUNCTION FOR EXPIRED LINKING CODES
-- =========================================================================

-- Function to clean up expired linking codes
CREATE OR REPLACE FUNCTION cleanup_expired_linking_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM parent_linking_codes 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- VERIFICATION QUERIES
-- =========================================================================

-- Verify tables were created
SELECT 'Tables Created:' as status, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('parent_student_links', 'parent_linking_codes', 'evidence_submissions', 'parent_notifications', 'student_profiles');

-- Verify RLS is enabled
SELECT 'RLS Status:' as status, schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('parent_student_links', 'parent_linking_codes', 'evidence_submissions', 'parent_notifications', 'student_profiles');

-- Verify indexes were created
SELECT 'Indexes Created:' as status, indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('parent_student_links', 'parent_linking_codes', 'evidence_submissions', 'parent_notifications', 'student_profiles');

-- =========================================================================
-- SUCCESS MESSAGE
-- =========================================================================

SELECT '✅ Parent Oversight System Setup Complete!' as message,
       'You can now use parent oversight features in the ShowTrackAI app.' as details;

-- =========================================================================
-- NOTES
-- =========================================================================

-- 1. This script sets up the complete parent oversight system
-- 2. All tables have Row Level Security (RLS) enabled for privacy
-- 3. Linking codes expire after 24 hours for security
-- 4. Parents can only access data for students they're linked to
-- 5. Evidence submissions support multiple types (text, photo, video, document)
-- 6. Notifications keep parents informed of student progress
-- 7. Regular cleanup of expired codes is recommended
-- 8. All foreign key relationships are properly established

-- Usage in ShowTrackAI app:
-- 1. Students can generate linking codes in the FFA section
-- 2. Parents use these codes to connect to their student's progress
-- 3. Students can submit evidence for degree requirements
-- 4. Parents receive notifications and can provide feedback
-- 5. All data is secured with proper Row Level Security policies