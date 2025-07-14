// =========================================================================
// FFA Degree Progress Tracker - Core Models
// =========================================================================
// Enhanced TypeScript interfaces for FFA degree tracking system
// Extends existing FFAProfiles.ts with new progressive tracking features
// =========================================================================

// =========================================================================
// CORE FFA DEGREE INTERFACES
// =========================================================================

export type FFADegreeLevel = 'discovery' | 'greenhand' | 'chapter' | 'state' | 'american';

export type FFADegreeStatus = 'not_started' | 'in_progress' | 'completed' | 'awarded';

export interface FFADegreeProgress {
  id: string;
  user_id: string;
  degree_level: FFADegreeLevel;
  status: FFADegreeStatus;
  requirements_met: Record<string, boolean>;
  completion_percentage: number;
  awarded_date?: Date;
  advisor_approved: boolean;
  advisor_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FFADegreeRequirement {
  id: string;
  degree_level: FFADegreeLevel;
  requirement_key: string;
  requirement_name: string;
  requirement_description: string;
  requirement_type: 'activity' | 'hour_based' | 'project_based' | 'knowledge_based';
  min_hours?: number;
  min_activities?: number;
  competencies_required: string[];
  order_priority: number;
  validation_method: 'self_report' | 'advisor_verification' | 'document_upload';
}

// =========================================================================
// ENHANCED SAE PROJECT INTERFACES
// =========================================================================

export type SAEProjectType = 'placement' | 'entrepreneurship' | 'research' | 'exploratory';

export type SAEProjectStatus = 'planning' | 'active' | 'completed' | 'suspended';

export interface EnhancedSAEProject {
  id: string;
  user_id: string;
  project_name: string;
  project_type: SAEProjectType;
  afnr_pathway: string;
  start_date: Date;
  end_date?: Date;
  target_hours: number;
  actual_hours: number;
  target_earnings: number;
  actual_earnings: number;
  sae_score: number; // Calculated: actual_hours * 3.56 + actual_earnings
  project_status: SAEProjectStatus;
  records: SAERecord[];
  business_intelligence: SAEBusinessIntelligence;
  created_at: Date;
  updated_at: Date;
}

export type SAERecordType = 'labor' | 'expense' | 'income' | 'learning';

export interface SAERecord {
  id: string;
  project_id: string;
  user_id: string;
  record_date: Date;
  activity_type: SAERecordType;
  description: string;
  hours_worked: number;
  expense_amount: number;
  income_amount: number;
  category?: string;
  supporting_documents: string[];
  learning_objectives: string[];
  competencies_demonstrated: string[];
  created_at: Date;
  updated_at: Date;
}

export interface SAEBusinessIntelligence {
  cost_per_hour?: number;
  profit_margin?: number;
  roi_percentage?: number;
  efficiency_metrics?: {
    time_to_completion?: number;
    resource_utilization?: number;
    goal_achievement_rate?: number;
  };
  market_insights?: {
    regional_benchmarks?: Record<string, number>;
    seasonal_patterns?: Record<string, any>;
    cost_trends?: Record<string, any>;
  };
  educational_value?: {
    competencies_gained?: string[];
    skill_development_score?: number;
    career_readiness_indicators?: Record<string, any>;
  };
}

// =========================================================================
// MOTIVATIONAL CONTENT INTERFACES
// =========================================================================

export type MotivationalContentType = 'tip' | 'encouragement' | 'reminder' | 'feedback' | 'challenge';

export type MotivationalAudience = 'student' | 'parent' | 'educator' | 'all';

export interface MotivationalContent {
  id: string;
  content_type: MotivationalContentType;
  target_audience: MotivationalAudience;
  content_title: string;
  content_text: string;
  content_category: string;
  context_tags: string[];
  age_appropriate: boolean;
  grade_level: string[];
  seasonal_relevance: string[];
  educational_value: MotivationalEducationalValue;
  engagement_metrics: MotivationalEngagementMetrics;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MotivationalEducationalValue {
  competencies: string[];
  standards: string[];
  learning_objectives?: string[];
  career_connections?: string[];
  real_world_applications?: string[];
}

export interface MotivationalEngagementMetrics {
  views: number;
  likes: number;
  shares: number;
  time_spent_average: number;
  completion_rate: number;
  user_feedback_score: number;
  effectiveness_rating: number;
}

// =========================================================================
// COMPETITION TRACKING INTERFACES
// =========================================================================

export type CompetitionType = 'speech' | 'board_meeting' | 'radio_podcast' | 'project_presentation' | 'livestock_judging' | 'career_development';

export type CompetitionLevel = 'local' | 'district' | 'area' | 'state' | 'national';

export interface CompetitionTracking {
  id: string;
  user_id: string;
  competition_type: CompetitionType;
  competition_name: string;
  competition_level: CompetitionLevel;
  participation_date: Date;
  placement?: string;
  score?: number;
  feedback_received?: string;
  skills_demonstrated: string[];
  improvement_areas: string[];
  next_steps?: string;
  advisor_feedback?: string;
  parent_notified: boolean;
  analytics_data: CompetitionAnalytics;
  created_at: Date;
  updated_at: Date;
}

export interface CompetitionAnalytics {
  preparation_time_hours?: number;
  confidence_level_before?: number;
  confidence_level_after?: number;
  peer_comparison?: {
    placement_percentile?: number;
    score_percentile?: number;
  };
  improvement_trajectory?: {
    previous_scores?: number[];
    skill_development_rate?: number;
    consistency_score?: number;
  };
  career_pathway_alignment?: {
    relevant_career_areas?: string[];
    skill_transferability?: Record<string, number>;
  };
}

// =========================================================================
// ANALYTICS AND BUSINESS INTELLIGENCE INTERFACES
// =========================================================================

export interface FFAAnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_category: string;
  event_action: string;
  event_data: Record<string, any>;
  session_id?: string;
  timestamp: Date;
  user_agent?: string;
  device_info?: DeviceInfo;
  educational_context?: EducationalContext;
  privacy_level: 'public' | 'aggregated' | 'private';
  retention_period: number;
  anonymized: boolean;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  device_model?: string;
  os_version?: string;
  app_version: string;
  screen_resolution?: string;
  network_type?: string;
}

export interface EducationalContext {
  school_id?: string;
  class_period?: string;
  assignment_context?: string;
  learning_objective?: string;
  competency_focus?: string[];
  assessment_related?: boolean;
}

export interface UserInteraction {
  id: string;
  user_id: string;
  interaction_type: string;
  target_id?: string;
  target_type?: string;
  interaction_data: Record<string, any>;
  engagement_score?: number;
  completion_status?: string;
  time_spent_seconds?: number;
  created_at: Date;
}

// =========================================================================
// DASHBOARD AND UI INTERFACES
// =========================================================================

export interface FFAStudentDashboard {
  student_profile: FFAStudentProfile;
  current_degree_progress: FFADegreeProgress[];
  active_sae_projects: EnhancedSAEProject[];
  recent_competitions: CompetitionTracking[];
  motivational_content: MotivationalContent[];
  upcoming_deadlines: FFADeadline[];
  achievements: FFAAchievement[];
  engagement_metrics: StudentEngagementMetrics;
}

export interface FFAEducatorDashboard {
  organization_summary: OrganizationSummary;
  student_progress_overview: StudentProgressOverview[];
  urgent_attention_items: UrgentAttentionItem[];
  recent_activities: RecentActivity[];
  performance_metrics: EducatorPerformanceMetrics;
  resource_recommendations: ResourceRecommendation[];
}

export interface FFAParentDashboard {
  child_progress: FFAStudentDashboard[];
  accountability_items: ParentAccountabilityItem[];
  communication_log: ParentCommunicationItem[];
  upcoming_events: ParentNotificationItem[];
  engagement_opportunities: ParentEngagementOpportunity[];
}

// =========================================================================
// SUPPORTING INTERFACES
// =========================================================================

export interface FFADeadline {
  id: string;
  user_id: string;
  deadline_type: 'degree_requirement' | 'sae_milestone' | 'competition_registration' | 'application_due';
  title: string;
  description: string;
  due_date: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completion_status: 'pending' | 'completed' | 'overdue';
  related_entity_id?: string;
  related_entity_type?: string;
}

export interface FFAAchievement {
  id: string;
  user_id: string;
  achievement_type: 'degree_earned' | 'sae_milestone' | 'competition_placement' | 'skill_mastery';
  title: string;
  description: string;
  date_earned: Date;
  icon_url?: string;
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  share_worthy: boolean;
  educational_value: number;
}

export interface StudentEngagementMetrics {
  daily_active_usage: number;
  weekly_goal_completion: number;
  monthly_improvement_rate: number;
  feature_adoption_rates: Record<string, number>;
  peer_comparison_percentile: number;
  educator_interaction_frequency: number;
}

export interface OrganizationSummary {
  organization_id: string;
  total_students: number;
  students_in_progress: number;
  students_completed: number;
  avg_completion_percentage: number;
  total_sae_projects: number;
  active_sae_projects: number;
  total_competitions: number;
  recent_competitions: number;
}

export interface StudentProgressOverview {
  student_id: string;
  student_name: string;
  current_degree_level: FFADegreeLevel;
  completion_percentage: number;
  active_projects: number;
  recent_activity_score: number;
  attention_required: boolean;
  last_interaction: Date;
}

export interface UrgentAttentionItem {
  student_id: string;
  student_name: string;
  issue_type: 'overdue_deadline' | 'low_engagement' | 'failing_requirement' | 'support_needed';
  description: string;
  priority: 'high' | 'urgent';
  action_required: string;
  due_date?: Date;
}

export interface RecentActivity {
  activity_id: string;
  student_id: string;
  student_name: string;
  activity_type: string;
  activity_description: string;
  timestamp: Date;
  requires_review: boolean;
}

export interface EducatorPerformanceMetrics {
  student_success_rate: number;
  avg_degree_completion_time: number;
  student_engagement_score: number;
  parent_satisfaction_rating: number;
  resource_utilization_rate: number;
  professional_development_hours: number;
}

export interface ResourceRecommendation {
  resource_id: string;
  resource_type: 'lesson_plan' | 'activity' | 'assessment' | 'professional_development';
  title: string;
  description: string;
  relevance_score: number;
  estimated_time_investment: number;
  student_impact_potential: number;
}

export interface ParentAccountabilityItem {
  item_id: string;
  child_id: string;
  child_name: string;
  accountability_type: 'sae_check_in' | 'goal_review' | 'celebration' | 'support_needed';
  title: string;
  description: string;
  due_date: Date;
  completion_status: 'pending' | 'completed';
  importance_level: 'routine' | 'important' | 'critical';
}

export interface ParentCommunicationItem {
  communication_id: string;
  child_id: string;
  sender_type: 'educator' | 'system' | 'child';
  sender_name: string;
  message_type: 'achievement' | 'concern' | 'reminder' | 'invitation';
  subject: string;
  message: string;
  timestamp: Date;
  read_status: boolean;
  action_required: boolean;
}

export interface ParentNotificationItem {
  notification_id: string;
  child_id: string;
  event_type: 'deadline' | 'competition' | 'meeting' | 'celebration';
  title: string;
  description: string;
  event_date: Date;
  location?: string;
  participation_expected: boolean;
  rsvp_required: boolean;
  rsvp_deadline?: Date;
}

export interface ParentEngagementOpportunity {
  opportunity_id: string;
  child_id: string;
  opportunity_type: 'volunteer' | 'mentor' | 'judge' | 'support';
  title: string;
  description: string;
  time_commitment: string;
  skills_needed: string[];
  impact_description: string;
  signup_deadline: Date;
}

// =========================================================================
// ENHANCED DEGREE REQUIREMENTS
// =========================================================================

export const ENHANCED_FFA_DEGREE_REQUIREMENTS = {
  discovery: {
    name: 'Discovery FFA Degree',
    description: 'Foundational introduction to agricultural education and FFA',
    total_requirements: 6,
    requirements: {
      basic_agriculture: {
        title: 'Basic Agriculture Knowledge',
        description: 'Complete introduction to agriculture course or equivalent',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      ffa_history: {
        title: 'FFA History and Organization',
        description: 'Learn about FFA history, mission, and organizational structure',
        type: 'knowledge_based',
        validation: 'self_report'
      },
      sae_planned: {
        title: 'SAE Project Planned',
        description: 'Develop a basic plan for a Supervised Agricultural Experience',
        type: 'project_based',
        validation: 'advisor_verification'
      },
      leadership_activity: {
        title: 'Leadership Activity Participation',
        description: 'Participate in at least one FFA chapter activity',
        type: 'activity',
        min_activities: 1,
        validation: 'educator_verification'
      },
      community_service: {
        title: 'Community Service',
        description: 'Complete 5 hours of community service',
        type: 'hour_based',
        min_hours: 5,
        validation: 'document_upload'
      },
      agricultural_literacy: {
        title: 'Agricultural Literacy',
        description: 'Demonstrate basic understanding of agricultural concepts',
        type: 'knowledge_based',
        validation: 'educator_verification'
      }
    }
  },
  greenhand: {
    name: 'Greenhand FFA Degree',
    description: 'First official FFA degree recognizing basic agricultural education',
    total_requirements: 8,
    requirements: {
      agricultural_education: {
        title: 'Agricultural Education Enrollment',
        description: 'Be enrolled in agricultural education course',
        type: 'activity',
        validation: 'educator_verification'
      },
      sae_plan: {
        title: 'SAE Plan Development',
        description: 'Have satisfactory plans for a Supervised Agricultural Experience',
        type: 'project_based',
        validation: 'advisor_verification'
      },
      ffa_creed: {
        title: 'FFA Creed Mastery',
        description: 'Learn and explain the FFA Creed',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      ffa_history: {
        title: 'FFA History Knowledge',
        description: 'Describe FFA history, organization, and purpose',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      ffa_ethics: {
        title: 'FFA Code of Ethics',
        description: 'Know and understand the FFA Code of Ethics',
        type: 'knowledge_based',
        validation: 'self_report'
      },
      agricultural_opportunities: {
        title: 'Agricultural Career Opportunities',
        description: 'Describe opportunities available in agriculture',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      chapter_participation: {
        title: 'Chapter Meeting Participation',
        description: 'Attend chapter meetings and participate in activities',
        type: 'activity',
        min_activities: 3,
        validation: 'educator_verification'
      },
      basic_leadership: {
        title: 'Basic Leadership Skills',
        description: 'Demonstrate basic leadership abilities',
        type: 'activity',
        min_activities: 1,
        validation: 'educator_verification'
      }
    }
  },
  chapter: {
    name: 'Chapter FFA Degree',
    description: 'Recognizes active FFA participation and SAE development',
    total_requirements: 10,
    requirements: {
      greenhand_degree: {
        title: 'Greenhand FFA Degree',
        description: 'Hold the Greenhand FFA Degree',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      agricultural_education_completion: {
        title: 'Agricultural Education Completion',
        description: 'Complete one year of agricultural education',
        type: 'hour_based',
        min_hours: 180,
        validation: 'educator_verification'
      },
      sae_operation: {
        title: 'SAE in Operation',
        description: 'Have satisfactory SAE in operation',
        type: 'project_based',
        validation: 'advisor_verification'
      },
      financial_goal: {
        title: 'Financial/Hour Goal Achievement',
        description: 'Earn and productively invest $150 or work 45 hours in SAE',
        type: 'hour_based',
        min_hours: 45,
        validation: 'document_upload'
      },
      leadership_demonstration: {
        title: 'Leadership Demonstration',
        description: 'Demonstrate leadership abilities by holding office or committee membership',
        type: 'activity',
        min_activities: 1,
        validation: 'educator_verification'
      },
      chapter_activities: {
        title: 'Chapter Activity Participation',
        description: 'Participate in chapter activities and demonstrate progress',
        type: 'activity',
        min_activities: 5,
        validation: 'educator_verification'
      },
      parliamentary_procedure: {
        title: 'Parliamentary Procedure',
        description: 'Demonstrate knowledge of parliamentary procedure',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      public_speaking: {
        title: 'Public Speaking',
        description: 'Give a speech or presentation to chapter',
        type: 'activity',
        min_activities: 1,
        validation: 'educator_verification'
      },
      school_achievement: {
        title: 'Scholastic Achievement',
        description: 'Maintain satisfactory academic record',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      community_involvement: {
        title: 'Community Involvement',
        description: 'Show evidence of community involvement',
        type: 'activity',
        min_activities: 2,
        validation: 'document_upload'
      }
    }
  },
  state: {
    name: 'State FFA Degree',
    description: 'Recognizes outstanding achievement in agricultural education',
    total_requirements: 12,
    requirements: {
      chapter_degree: {
        title: 'Chapter FFA Degree',
        description: 'Hold Chapter FFA Degree for one year',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      agricultural_education_two_years: {
        title: 'Two Years Agricultural Education',
        description: 'Complete two years of agricultural education',
        type: 'hour_based',
        min_hours: 360,
        validation: 'educator_verification'
      },
      community_service_25: {
        title: '25 Hours Community Service',
        description: 'Complete 25 hours of community service',
        type: 'hour_based',
        min_hours: 25,
        validation: 'document_upload'
      },
      financial_goal_state: {
        title: 'Advanced Financial Goal',
        description: 'Earn and productively invest $1,000 or work 300 hours',
        type: 'hour_based',
        min_hours: 300,
        validation: 'document_upload'
      },
      leadership_chapter: {
        title: 'Chapter Leadership',
        description: 'Demonstrate leadership in chapter and community activities',
        type: 'activity',
        min_activities: 3,
        validation: 'educator_verification'
      },
      high_school_graduation: {
        title: 'High School Graduation',
        description: 'Graduate from high school',
        type: 'knowledge_based',
        validation: 'document_upload'
      },
      proficiency_application: {
        title: 'Proficiency Award Application',
        description: 'Submit SAE proficiency award application',
        type: 'project_based',
        validation: 'document_upload'
      },
      advanced_sae: {
        title: 'Advanced SAE Program',
        description: 'Conduct comprehensive SAE program',
        type: 'project_based',
        validation: 'advisor_verification'
      },
      state_convention: {
        title: 'State Convention Participation',
        description: 'Participate in state FFA convention or equivalent',
        type: 'activity',
        min_activities: 1,
        validation: 'educator_verification'
      },
      agricultural_career_plan: {
        title: 'Agricultural Career Plan',
        description: 'Develop and present agricultural career plan',
        type: 'project_based',
        validation: 'educator_verification'
      },
      interview_completion: {
        title: 'Interview Process',
        description: 'Complete satisfactory interview with state degree committee',
        type: 'activity',
        min_activities: 1,
        validation: 'educator_verification'
      },
      record_book: {
        title: 'Complete Record Book',
        description: 'Maintain complete and accurate SAE record book',
        type: 'project_based',
        validation: 'advisor_verification'
      }
    }
  },
  american: {
    name: 'American FFA Degree',
    description: 'Highest degree awarded by the National FFA Organization',
    total_requirements: 15,
    requirements: {
      state_degree: {
        title: 'State FFA Degree',
        description: 'Hold State FFA Degree',
        type: 'knowledge_based',
        validation: 'educator_verification'
      },
      agricultural_education_three_years: {
        title: 'Three Years Agricultural Education',
        description: 'Complete three years of agricultural education',
        type: 'hour_based',
        min_hours: 540,
        validation: 'educator_verification'
      },
      community_service_50: {
        title: '50 Hours Community Service',
        description: 'Complete 50 hours of community service',
        type: 'hour_based',
        min_hours: 50,
        validation: 'document_upload'
      },
      financial_goal_american: {
        title: 'Exceptional Financial Achievement',
        description: 'Earn and productively invest $10,000 or work 2,250 hours',
        type: 'hour_based',
        min_hours: 2250,
        validation: 'document_upload'
      },
      outstanding_leadership: {
        title: 'Outstanding Leadership',
        description: 'Demonstrate outstanding leadership and community involvement',
        type: 'activity',
        min_activities: 5,
        validation: 'educator_verification'
      },
      post_secondary_education: {
        title: 'Post-Secondary Education',
        description: 'Complete associate degree, bachelor degree, or equivalent',
        type: 'knowledge_based',
        validation: 'document_upload'
      },
      national_convention: {
        title: 'National Convention Experience',
        description: 'Attend National FFA Convention or participate in equivalent experience',
        type: 'activity',
        min_activities: 1,
        validation: 'document_upload'
      },
      proficiency_award: {
        title: 'Proficiency Award Recognition',
        description: 'Receive state proficiency award or equivalent recognition',
        type: 'activity',
        min_activities: 1,
        validation: 'document_upload'
      },
      agricultural_advocacy: {
        title: 'Agricultural Advocacy',
        description: 'Demonstrate agricultural advocacy and promotion',
        type: 'activity',
        min_activities: 3,
        validation: 'educator_verification'
      },
      mentorship: {
        title: 'Mentorship and Service',
        description: 'Mentor younger students and serve agricultural community',
        type: 'activity',
        min_activities: 2,
        validation: 'educator_verification'
      },
      comprehensive_portfolio: {
        title: 'Comprehensive Portfolio',
        description: 'Compile comprehensive portfolio of achievements',
        type: 'project_based',
        validation: 'document_upload'
      },
      interview_board: {
        title: 'Interview Board Review',
        description: 'Complete interview with American Degree review board',
        type: 'activity',
        min_activities: 1,
        validation: 'educator_verification'
      },
      sae_excellence: {
        title: 'SAE Program Excellence',
        description: 'Demonstrate exceptional SAE program with national impact',
        type: 'project_based',
        validation: 'advisor_verification'
      },
      agricultural_impact: {
        title: 'Agricultural Industry Impact',
        description: 'Show measurable impact on agricultural industry or community',
        type: 'project_based',
        validation: 'educator_verification'
      },
      career_readiness: {
        title: 'Career Readiness Demonstration',
        description: 'Demonstrate readiness for agricultural career or advanced education',
        type: 'knowledge_based',
        validation: 'educator_verification'
      }
    }
  }
} as const;

// =========================================================================
// UTILITY TYPES AND ENUMS
// =========================================================================

export enum FFADegreeRequirementType {
  ACTIVITY = 'activity',
  HOUR_BASED = 'hour_based',
  PROJECT_BASED = 'project_based',
  KNOWLEDGE_BASED = 'knowledge_based'
}

export enum SAERecordCategory {
  LABOR = 'labor',
  SUPPLIES = 'supplies',
  EQUIPMENT = 'equipment',
  MARKETING = 'marketing',
  INSURANCE = 'insurance',
  UTILITIES = 'utilities',
  FEED = 'feed',
  VETERINARY = 'veterinary',
  OTHER = 'other'
}

export enum CompetitionSkillArea {
  COMMUNICATION = 'communication',
  LEADERSHIP = 'leadership',
  TECHNICAL_KNOWLEDGE = 'technical_knowledge',
  PROBLEM_SOLVING = 'problem_solving',
  TEAMWORK = 'teamwork',
  PRESENTATION = 'presentation',
  CRITICAL_THINKING = 'critical_thinking',
  PROFESSIONALISM = 'professionalism'
}

export enum MotivationalContentTiming {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  WEEKEND = 'weekend',
  BEFORE_COMPETITION = 'before_competition',
  AFTER_ACHIEVEMENT = 'after_achievement',
  DURING_DIFFICULTY = 'during_difficulty'
}

// =========================================================================
// TYPE GUARDS AND VALIDATION FUNCTIONS
// =========================================================================

export function isFFADegreeLevel(value: string): value is FFADegreeLevel {
  return ['discovery', 'greenhand', 'chapter', 'state', 'american'].includes(value);
}

export function isFFADegreeStatus(value: string): value is FFADegreeStatus {
  return ['not_started', 'in_progress', 'completed', 'awarded'].includes(value);
}

export function isSAEProjectType(value: string): value is SAEProjectType {
  return ['placement', 'entrepreneurship', 'research', 'exploratory'].includes(value);
}

export function isCompetitionType(value: string): value is CompetitionType {
  return [
    'speech', 'board_meeting', 'radio_podcast', 'project_presentation',
    'livestock_judging', 'career_development'
  ].includes(value);
}

export function isMotivationalContentType(value: string): value is MotivationalContentType {
  return ['tip', 'encouragement', 'reminder', 'feedback', 'challenge'].includes(value);
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

export function calculateSAEScore(hours: number, earnings: number): number {
  return hours * 3.56 + earnings;
}

export function calculateDegreeCompletionPercentage(
  requirements: Record<string, boolean>,
  totalRequirements: number
): number {
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  return totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 0;
}

export function getDegreeRequirementCount(degreeLevel: FFADegreeLevel): number {
  switch (degreeLevel) {
    case 'discovery': return 6;
    case 'greenhand': return 8;
    case 'chapter': return 10;
    case 'state': return 12;
    case 'american': return 15;
    default: return 0;
  }
}

export function getNextDegreeLevel(currentLevel: FFADegreeLevel): FFADegreeLevel | null {
  const levels: FFADegreeLevel[] = ['discovery', 'greenhand', 'chapter', 'state', 'american'];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
}

export function formatSAEScore(score: number): string {
  return score.toFixed(2);
}

export function isDeadlineUrgent(deadline: Date, urgentThresholdDays: number = 7): boolean {
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  return daysDiff <= urgentThresholdDays && daysDiff >= 0;
}

// =========================================================================
// INTEGRATION WITH EXISTING TYPES
// =========================================================================

// Re-export existing FFA types for convenience
export type { FFAStudentProfile, FFAEducatorProfile, FFAInstitutionProfile, SAEProject } from './FFAProfiles';
export { FFA_DEGREE_REQUIREMENTS, SAE_CATEGORIES } from './FFAProfiles';

// Create compatibility types
export type LegacySAEProject = import('./FFAProfiles').SAEProject;
export type EnhancedFFAStudentProfile = FFAStudentProfile & {
  degree_progress?: FFADegreeProgress[];
  enhanced_sae_projects?: EnhancedSAEProject[];
  competition_tracking?: CompetitionTracking[];
  motivational_preferences?: {
    content_types: MotivationalContentType[];
    delivery_times: MotivationalContentTiming[];
    engagement_level: 'low' | 'medium' | 'high';
  };
};

// =========================================================================
// EXPORT CONSOLIDATED TYPES
// =========================================================================

export type {
  FFADegreeLevel,
  FFADegreeStatus,
  FFADegreeProgress,
  FFADegreeRequirement,
  SAEProjectType,
  SAEProjectStatus,
  EnhancedSAEProject,
  SAERecordType,
  SAERecord,
  SAEBusinessIntelligence,
  MotivationalContentType,
  MotivationalAudience,
  MotivationalContent,
  MotivationalEducationalValue,
  MotivationalEngagementMetrics,
  CompetitionType,
  CompetitionLevel,
  CompetitionTracking,
  CompetitionAnalytics,
  FFAAnalyticsEvent,
  DeviceInfo,
  EducationalContext,
  UserInteraction,
  FFAStudentDashboard,
  FFAEducatorDashboard,
  FFAParentDashboard,
  FFADeadline,
  FFAAchievement,
  StudentEngagementMetrics,
  OrganizationSummary,
  StudentProgressOverview,
  UrgentAttentionItem,
  RecentActivity,
  EducatorPerformanceMetrics,
  ResourceRecommendation,
  ParentAccountabilityItem,
  ParentCommunicationItem,
  ParentNotificationItem,
  ParentEngagementOpportunity,
  EnhancedFFAStudentProfile
};

export {
  FFADegreeRequirementType,
  SAERecordCategory,
  CompetitionSkillArea,
  MotivationalContentTiming,
  ENHANCED_FFA_DEGREE_REQUIREMENTS,
  isFFADegreeLevel,
  isFFADegreeStatus,
  isSAEProjectType,
  isCompetitionType,
  isMotivationalContentType,
  calculateSAEScore,
  calculateDegreeCompletionPercentage,
  getDegreeRequirementCount,
  getNextDegreeLevel,
  formatSAEScore,
  isDeadlineUrgent
};