-- =========================================================================
-- User Roles and Notifications System Database Schema
-- =========================================================================
-- SQL script to create tables for user role management and notification system
-- Supports role-based access control and parent engagement notifications
-- =========================================================================

-- Create user_profiles table for role management
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'educator', 'administrator', 'observer')),
    permissions TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    display_name TEXT NOT NULL,
    contact_email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id),
    UNIQUE(user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL,
    sender_id TEXT,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'evidence_submission', 'degree_progress', 'milestone_reached', 
        'parent_feedback', 'reminder', 'system_update', 'achievement_earned',
        'competition_update', 'sae_milestone'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    delivery_methods TEXT[] DEFAULT '{"in_app"}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    action_url TEXT,
    category TEXT DEFAULT 'system' CHECK (category IN ('engagement', 'progress', 'system', 'social', 'reminder')),
    FOREIGN KEY (recipient_id) REFERENCES auth.users(id),
    FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    enabled_types TEXT[] DEFAULT '{}',
    delivery_methods TEXT[] DEFAULT '{"in_app"}',
    quiet_hours JSONB DEFAULT '{"start": "22:00", "end": "07:00", "timezone": "UTC"}',
    frequency_limits JSONB DEFAULT '{"daily_max": 10, "weekly_max": 50, "batch_similar": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id),
    UNIQUE(user_id)
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    verification_type TEXT NOT NULL,
    evidence JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewer_id TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES auth.users(id),
    FOREIGN KEY (reviewer_id) REFERENCES auth.users(id)
);

-- Create notification_delivery_log table for tracking
CREATE TABLE IF NOT EXISTS notification_delivery_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id TEXT NOT NULL,
    delivery_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

-- =========================================================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Administrators can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid()::text 
            AND up.role = 'administrator'
            AND 'access_all_data' = ANY(up.permissions)
        )
    );

CREATE POLICY "Educators can view profiles in their organization" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid()::text 
            AND up.role = 'educator'
            AND up.metadata->>'organization_id' = user_profiles.metadata->>'organization_id'
        )
    );

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id::uuid);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id::uuid);

CREATE POLICY "Users can insert notifications they send" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = sender_id::uuid OR sender_id IS NULL);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (sender_id IS NULL);

-- Notification Preferences Policies
CREATE POLICY "Users can manage their own preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id::uuid);

-- Verification Requests Policies
CREATE POLICY "Users can view their own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert their own verification requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Administrators can view all verification requests" ON verification_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid()::text 
            AND up.role = 'administrator'
        )
    );

CREATE POLICY "Administrators can update verification requests" ON verification_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid()::text 
            AND up.role = 'administrator'
        )
    );

-- Notification Delivery Log Policies (read-only for users, full access for admins)
CREATE POLICY "Users can view delivery logs for their notifications" ON notification_delivery_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.id = notification_id 
            AND n.recipient_id = auth.uid()::text
        )
    );

CREATE POLICY "System can insert delivery logs" ON notification_delivery_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update delivery logs" ON notification_delivery_log
    FOR UPDATE USING (true);

-- =========================================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================================

-- User Profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON user_profiles USING GIN((metadata->>'organization_id'));

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Notification Preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Verification Requests indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_type ON verification_requests(verification_type);

-- Notification Delivery Log indexes
CREATE INDEX IF NOT EXISTS idx_delivery_log_notification_id ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON notification_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_delivery_log_method ON notification_delivery_log(delivery_method);

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

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- =========================================================================

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification counts by type
CREATE OR REPLACE FUNCTION get_notification_stats(user_id_param TEXT)
RETURNS TABLE(
    total_count BIGINT,
    unread_count BIGINT,
    priority_counts JSONB,
    category_counts JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE read = false) as unread_count,
        jsonb_object_agg(priority, priority_count) as priority_counts,
        jsonb_object_agg(category, category_count) as category_counts
    FROM (
        SELECT 
            priority,
            category,
            COUNT(*) OVER (PARTITION BY priority) as priority_count,
            COUNT(*) OVER (PARTITION BY category) as category_count
        FROM notifications 
        WHERE recipient_id = user_id_param
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ) subquery;
END;
$$ LANGUAGE plpgsql;

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (
        user_id,
        enabled_types,
        delivery_methods,
        quiet_hours,
        frequency_limits
    ) VALUES (
        NEW.id,
        ARRAY['evidence_submission', 'milestone_reached', 'parent_feedback', 'achievement_earned'],
        ARRAY['in_app', 'push'],
        '{"start": "22:00", "end": "07:00", "timezone": "UTC"}',
        '{"daily_max": 10, "weekly_max": 50, "batch_similar": true}'
    ) ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when user is created
CREATE TRIGGER create_user_notification_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- =========================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =========================================================================

-- Insert sample user profiles
INSERT INTO user_profiles (id, user_id, role, permissions, display_name, metadata)
VALUES 
    ('profile_student_1', 'student-123', 'student', 
     ARRAY['view_own_progress', 'submit_evidence', 'generate_linking_codes'], 
     'Sarah Johnson', 
     '{"student_grade": 11, "chapter_affiliation": "Lincoln FFA", "verification_status": "verified"}'),
    ('profile_parent_1', 'parent-456', 'parent', 
     ARRAY['view_linked_student_progress', 'provide_feedback'], 
     'Mary Johnson', 
     '{"verification_status": "verified"}')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample notification preferences
INSERT INTO notification_preferences (user_id, enabled_types, delivery_methods)
VALUES 
    ('student-123', ARRAY['parent_feedback', 'milestone_reached', 'achievement_earned'], ARRAY['in_app', 'push']),
    ('parent-456', ARRAY['evidence_submission', 'degree_progress', 'milestone_reached'], ARRAY['in_app', 'push', 'email'])
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================================
-- VIEWS FOR COMMON QUERIES
-- =========================================================================

-- View for user notification summary
CREATE OR REPLACE VIEW user_notification_summary AS
SELECT 
    n.recipient_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE read = false) as unread_count,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
    MAX(n.created_at) as latest_notification,
    up.display_name as user_name,
    up.role as user_role
FROM notifications n
JOIN user_profiles up ON n.recipient_id = up.user_id
WHERE n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP
GROUP BY n.recipient_id, up.display_name, up.role;

-- View for notification delivery status
CREATE OR REPLACE VIEW notification_delivery_status AS
SELECT 
    n.id as notification_id,
    n.title,
    n.notification_type,
    n.priority,
    n.created_at,
    ndl.delivery_method,
    ndl.status as delivery_status,
    ndl.attempted_at,
    ndl.delivered_at,
    ndl.error_message
FROM notifications n
LEFT JOIN notification_delivery_log ndl ON n.id = ndl.notification_id
ORDER BY n.created_at DESC;

-- =========================================================================
-- VERIFICATION QUERIES
-- =========================================================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'notifications', 'notification_preferences', 'verification_requests', 'notification_delivery_log');

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'notifications', 'notification_preferences', 'verification_requests', 'notification_delivery_log');

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('user_profiles', 'notifications', 'notification_preferences', 'verification_requests', 'notification_delivery_log');

-- Verify functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('cleanup_expired_notifications', 'get_notification_stats', 'create_default_notification_preferences');

-- =========================================================================
-- NOTES
-- =========================================================================

-- 1. This schema supports comprehensive user role management and notifications
-- 2. All tables have Row Level Security (RLS) enabled for proper access control
-- 3. Notification system supports multiple delivery methods and user preferences
-- 4. Verification system allows for role-based access control with approval workflows
-- 5. Automatic cleanup functions help maintain database performance
-- 6. Views provide easy access to common notification analytics
-- 7. Triggers ensure data consistency and automatic preference creation

-- Usage:
-- 1. Run this script in your Supabase SQL editor after running the parent oversight schema
-- 2. Verify all tables, policies, and functions are created
-- 3. Test the notification system with sample data
-- 4. Set up periodic cleanup jobs for expired notifications
-- 5. Monitor notification delivery logs for system health