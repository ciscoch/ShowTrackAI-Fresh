// =========================================================================
// FFA Degree Progress Tracker - TypeScript Interface Definitions
// =========================================================================
// Complete type definitions for FFA degree tracking system
// Copy these interfaces into your TypeScript project for type safety
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
// SAE PROJECT INTERFACES
// =========================================================================

export type SAEProjectType = 'placement' | 'entrepreneurship' | 'research' | 'exploratory';

export type SAEProjectStatus = 'planning' | 'active' | 'completed' | 'suspended';

export interface SAEProject {
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
  active_sae_projects: SAEProject[];
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
// BUSINESS INTELLIGENCE INTERFACES
// =========================================================================

export interface FFABusinessIntelligence {
  user_engagement: UserEngagementBI;
  educational_outcomes: EducationalOutcomesBI;
  competitive_analytics: CompetitiveAnalyticsBI;
  monetization_metrics: MonetizationMetricsBI;
  predictive_insights: PredictiveInsightsBI;
}

export interface UserEngagementBI {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  session_duration_avg: number;
  feature_adoption_rates: Record<string, number>;
  user_retention_rates: Record<string, number>;
  engagement_trend_analysis: TrendAnalysis;
}

export interface EducationalOutcomesBI {
  degree_completion_rates: Record<FFADegreeLevel, number>;
  sae_project_success_rates: Record<SAEProjectType, number>;
  competition_participation_rates: Record<CompetitionType, number>;
  skill_development_metrics: Record<string, number>;
  career_readiness_indicators: Record<string, number>;
  learning_outcome_correlations: Record<string, any>;
}

export interface CompetitiveAnalyticsBI {
  market_position_analysis: MarketPositionAnalysis;
  user_acquisition_metrics: UserAcquisitionMetrics;
  feature_comparison_analysis: FeatureComparisonAnalysis;
  pricing_optimization_data: PricingOptimizationData;
  competitive_advantage_metrics: CompetitiveAdvantageMetrics;
}

export interface MonetizationMetricsBI {
  revenue_streams: Record<string, number>;
  user_lifetime_value: number;
  customer_acquisition_cost: number;
  subscription_metrics: SubscriptionMetrics;
  data_asset_valuation: DataAssetValuation;
  partnership_revenue: PartnershipRevenue;
}

export interface PredictiveInsightsBI {
  user_churn_prediction: ChurnPrediction;
  success_probability_modeling: SuccessProbabilityModeling;
  resource_demand_forecasting: ResourceDemandForecasting;
  market_opportunity_analysis: MarketOpportunityAnalysis;
  risk_assessment_metrics: RiskAssessmentMetrics;
}

// =========================================================================
// SUPPORTING BUSINESS INTELLIGENCE TYPES
// =========================================================================

export interface TrendAnalysis {
  trend_direction: 'up' | 'down' | 'stable';
  trend_strength: number;
  confidence_interval: number;
  seasonal_patterns: Record<string, number>;
  growth_rate: number;
  forecasted_values: number[];
}

export interface MarketPositionAnalysis {
  market_share_estimate: number;
  competitive_ranking: number;
  unique_value_propositions: string[];
  market_penetration_rate: number;
  brand_recognition_score: number;
}

export interface UserAcquisitionMetrics {
  acquisition_channels: Record<string, number>;
  conversion_rates: Record<string, number>;
  acquisition_cost_by_channel: Record<string, number>;
  viral_coefficients: Record<string, number>;
  retention_by_acquisition_channel: Record<string, number>;
}

export interface FeatureComparisonAnalysis {
  feature_gap_analysis: Record<string, boolean>;
  feature_importance_scores: Record<string, number>;
  competitive_differentiation: Record<string, string>;
  user_preference_data: Record<string, number>;
}

export interface PricingOptimizationData {
  price_elasticity_analysis: Record<string, number>;
  willingness_to_pay_distribution: Record<string, number>;
  competitor_pricing_analysis: Record<string, number>;
  value_perception_metrics: Record<string, number>;
}

export interface CompetitiveAdvantageMetrics {
  technological_moats: Record<string, number>;
  network_effects_strength: number;
  switching_costs: Record<string, number>;
  brand_loyalty_metrics: Record<string, number>;
  intellectual_property_value: Record<string, number>;
}

export interface SubscriptionMetrics {
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  churn_rate: number;
  upgrade_rate: number;
  downgrade_rate: number;
  net_revenue_retention: number;
}

export interface DataAssetValuation {
  total_data_points: number;
  data_quality_score: number;
  monetization_potential: Record<string, number>;
  market_value_estimates: Record<string, number>;
  licensing_revenue_potential: Record<string, number>;
}

export interface PartnershipRevenue {
  partnership_type_revenue: Record<string, number>;
  revenue_sharing_agreements: Record<string, number>;
  cross_promotion_value: Record<string, number>;
  integration_partnership_value: Record<string, number>;
}

export interface ChurnPrediction {
  churn_probability_scores: Record<string, number>;
  churn_risk_factors: Record<string, number>;
  retention_intervention_effectiveness: Record<string, number>;
  predicted_churn_timeline: Record<string, number>;
}

export interface SuccessProbabilityModeling {
  degree_completion_probability: Record<string, number>;
  sae_success_probability: Record<string, number>;
  competition_success_probability: Record<string, number>;
  career_readiness_probability: Record<string, number>;
}

export interface ResourceDemandForecasting {
  server_capacity_requirements: Record<string, number>;
  support_staff_requirements: Record<string, number>;
  content_creation_needs: Record<string, number>;
  feature_development_priorities: Record<string, number>;
}

export interface MarketOpportunityAnalysis {
  addressable_market_size: Record<string, number>;
  market_growth_projections: Record<string, number>;
  opportunity_scoring: Record<string, number>;
  competitive_landscape_evolution: Record<string, any>;
}

export interface RiskAssessmentMetrics {
  technical_risks: Record<string, number>;
  market_risks: Record<string, number>;
  regulatory_risks: Record<string, number>;
  operational_risks: Record<string, number>;
  financial_risks: Record<string, number>;
}

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
// EXPORT STATEMENT
// =========================================================================

export type {
  FFADegreeLevel,
  FFADegreeStatus,
  FFADegreeProgress,
  FFADegreeRequirement,
  SAEProjectType,
  SAEProjectStatus,
  SAEProject,
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
  FFABusinessIntelligence,
  UserEngagementBI,
  EducationalOutcomesBI,
  CompetitiveAnalyticsBI,
  MonetizationMetricsBI,
  PredictiveInsightsBI
};

/*
USAGE NOTES:
1. Import specific interfaces as needed: import { FFADegreeProgress, SAEProject } from './FFA-TypeScript-Interfaces';
2. Use type guards for runtime validation: if (isFFADegreeLevel(userInput)) { ... }
3. Helper functions provide common calculations: calculateSAEScore(hours, earnings)
4. All interfaces include created_at and updated_at for audit trails
5. Business intelligence interfaces support comprehensive analytics
6. Privacy levels are built into analytics events for FERPA compliance
7. All monetary values use number type - consider using decimal libraries for precision
8. JSONB fields allow flexible data storage while maintaining type safety
9. Arrays use proper TypeScript array typing for better IDE support
10. Optional fields are marked with ? for proper null/undefined handling
*/