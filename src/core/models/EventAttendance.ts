/**
 * Event Attendance Models for ShowTrackAI
 * 
 * Comprehensive event attendance tracking system that automatically
 * awards FFA SAE/AET points and tracks degree progress.
 */

export interface AttendedEvent {
  id: string;
  user_id: string;
  event_id: string;
  event_title: string;
  event_type: EventAttendanceType;
  event_category: FFAEventCategory;
  
  // Check-in/Check-out tracking
  checked_in_at: string;
  checked_out_at?: string;
  attendance_duration_minutes?: number;
  attendance_status: AttendanceStatus;
  
  // Location and verification
  check_in_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  verification_method: VerificationMethod;
  verification_code?: string;
  
  // Points and progress
  aet_points_awarded: number;
  sae_points_awarded: number;
  ffa_degree_credits: FFADegreeCredit[];
  
  // Event details
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  event_location: string;
  event_description?: string;
  
  // Educational value
  learning_objectives?: string[];
  skills_demonstrated?: string[];
  career_cluster_alignment?: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export type EventAttendanceType = 
  | 'ffa_meeting'
  | 'ffa_competition'
  | 'ffa_conference'
  | 'livestock_show'
  | 'county_fair'
  | 'state_fair'
  | 'career_development_event'
  | 'leadership_training'
  | 'community_service'
  | 'industry_tour'
  | 'guest_speaker'
  | 'skills_workshop'
  | 'agriculture_expo'
  | 'volunteer_activity'
  | 'internship'
  | 'job_shadow'
  | 'college_visit'
  | 'scholarship_event'
  | 'awards_banquet'
  | 'other';

export type FFAEventCategory = 
  | 'chapter_activities'
  | 'career_development'
  | 'leadership_development'
  | 'community_engagement'
  | 'agricultural_education'
  | 'sae_related'
  | 'competition'
  | 'recognition'
  | 'networking'
  | 'skill_building';

export type AttendanceStatus = 
  | 'checked_in'
  | 'checked_out'
  | 'missed_checkout'
  | 'incomplete'
  | 'verified'
  | 'pending_verification';

export type VerificationMethod = 
  | 'qr_code'
  | 'location_based'
  | 'instructor_code'
  | 'self_reported'
  | 'photo_verification'
  | 'peer_verification';

export interface FFADegreeCredit {
  degree_level: 'discovery' | 'greenhand' | 'chapter' | 'state' | 'american';
  requirement_category: string;
  requirement_description: string;
  points_earned: number;
  completion_percentage: number;
}

export interface EventCheckInData {
  event_id: string;
  verification_code?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface EventCheckOutData {
  attended_event_id: string;
  reflection_notes?: string;
  skills_learned?: string[];
  networking_contacts?: number;
  overall_rating?: number; // 1-5 scale
}

export interface AttendanceStreakData {
  current_streak: number;
  longest_streak: number;
  total_events_attended: number;
  this_month_count: number;
  this_semester_count: number;
  this_year_count: number;
}

export interface AttendanceMotivation {
  id: string;
  title: string;
  message: string;
  icon: string;
  points_threshold?: number;
  streak_threshold?: number;
  event_type_focus?: EventAttendanceType[];
  urgency_level: 'low' | 'medium' | 'high';
  expiration_date?: string;
}

export interface UpcomingEventAlert {
  event_id: string;
  event_title: string;
  event_date: string;
  event_time: string;
  potential_points: number;
  degree_progress_impact: string;
  attendance_encouragement: string;
  days_until_event: number;
}

// Points calculation matrices
export const AET_POINTS_MATRIX: Record<EventAttendanceType, number> = {
  ffa_meeting: 5,
  ffa_competition: 15,
  ffa_conference: 20,
  livestock_show: 25,
  county_fair: 20,
  state_fair: 30,
  career_development_event: 20,
  leadership_training: 15,
  community_service: 10,
  industry_tour: 12,
  guest_speaker: 8,
  skills_workshop: 15,
  agriculture_expo: 18,
  volunteer_activity: 8,
  internship: 50,
  job_shadow: 25,
  college_visit: 15,
  scholarship_event: 10,
  awards_banquet: 12,
  other: 5,
};

export const SAE_POINTS_MATRIX: Record<EventAttendanceType, number> = {
  ffa_meeting: 3,
  ffa_competition: 10,
  ffa_conference: 15,
  livestock_show: 30,
  county_fair: 25,
  state_fair: 40,
  career_development_event: 15,
  leadership_training: 8,
  community_service: 5,
  industry_tour: 20,
  guest_speaker: 5,
  skills_workshop: 12,
  agriculture_expo: 20,
  volunteer_activity: 3,
  internship: 75,
  job_shadow: 35,
  college_visit: 10,
  scholarship_event: 5,
  awards_banquet: 8,
  other: 2,
};

// FFA Degree requirement mappings
export const FFA_DEGREE_REQUIREMENTS: Record<EventAttendanceType, FFADegreeCredit[]> = {
  ffa_meeting: [
    {
      degree_level: 'greenhand',
      requirement_category: 'chapter_participation',
      requirement_description: 'Attend chapter meetings',
      points_earned: 1,
      completion_percentage: 10, // Each meeting = 10% toward requirement
    },
    {
      degree_level: 'chapter',
      requirement_category: 'chapter_participation',
      requirement_description: 'Active chapter member',
      points_earned: 1,
      completion_percentage: 5,
    },
  ],
  ffa_competition: [
    {
      degree_level: 'chapter',
      requirement_category: 'leadership_development',
      requirement_description: 'Participate in FFA activities',
      points_earned: 3,
      completion_percentage: 25,
    },
    {
      degree_level: 'state',
      requirement_category: 'competition_participation',
      requirement_description: 'Compete in CDE/LDE events',
      points_earned: 5,
      completion_percentage: 50,
    },
  ],
  community_service: [
    {
      degree_level: 'greenhand',
      requirement_category: 'community_service',
      requirement_description: 'Complete community service hours',
      points_earned: 2,
      completion_percentage: 20,
    },
    {
      degree_level: 'chapter',
      requirement_category: 'community_service',
      requirement_description: 'Leadership through service',
      points_earned: 3,
      completion_percentage: 15,
    },
  ],
  livestock_show: [
    {
      degree_level: 'chapter',
      requirement_category: 'sae_advancement',
      requirement_description: 'SAE project participation',
      points_earned: 4,
      completion_percentage: 40,
    },
    {
      degree_level: 'state',
      requirement_category: 'sae_excellence',
      requirement_description: 'Advanced SAE demonstration',
      points_earned: 6,
      completion_percentage: 30,
    },
  ],
  // Additional mappings would continue...
  other: [
    {
      degree_level: 'discovery',
      requirement_category: 'exploration',
      requirement_description: 'Agricultural exploration activities',
      points_earned: 1,
      completion_percentage: 5,
    },
  ],
};

// Motivational messages for attendance encouragement
export const ATTENDANCE_MOTIVATION_MESSAGES = {
  streak_building: [
    "🔥 You're on fire! Keep that attendance streak alive!",
    "💪 Consistency builds champions - one event at a time!",
    "⭐ Your dedication is showing! Keep attending events!",
  ],
  points_close: [
    "🎯 You're so close to your next AET milestone!",
    "🏆 Just a few more points to unlock your next achievement!",
    "📈 Your progress is accelerating - keep it up!",
  ],
  degree_progress: [
    "🎓 This event will boost your FFA degree progress significantly!",
    "📜 Every event attended brings you closer to your FFA goals!",
    "🌟 Your FFA journey is building momentum!",
  ],
  skill_development: [
    "🧠 New skills await at this event!",
    "💡 Expand your agricultural knowledge and network!",
    "🚀 Transform learning into leadership opportunities!",
  ],
};

export default AttendedEvent;