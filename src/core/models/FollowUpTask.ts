import { Animal } from './Animal';
import { HealthRecord } from './HealthRecord';

export interface FollowUpTask {
  id: string;
  healthRecordId: string;
  animalId: string;
  studentId: string;
  assignedBy?: string; // Instructor ID
  
  // Task details
  taskType: 'monitoring' | 'treatment' | 'assessment' | 'vaccination' | 'follow_up';
  taskTitle: string;
  taskDescription: string;
  detailedInstructions: string;
  
  // Scheduling
  createdDate: Date;
  dueDate: Date;
  frequency: 'once' | 'daily' | 'twice_daily' | 'weekly' | 'custom';
  durationDays: number;
  
  // Progress tracking
  completionStatus: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  progressPercentage: number;
  lastUpdate?: Date;
  
  // Priority and escalation
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  escalationTriggered: boolean;
  escalationDate?: Date;
  
  // Educational integration
  learningObjectives: string[];
  competencyStandards: string[]; // ['AS.07.01.02.a', 'AS.07.02.01.b']
  reflectionRequired: boolean;
  
  // Completion and resolution
  completedDate?: Date;
  resolutionNotes?: string;
  outcomeStatus?: 'resolved' | 'improved' | 'referred' | 'ongoing';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowUpUpdate {
  id: string;
  followUpTaskId: string;
  studentId: string;
  
  // Update content
  updateDate: Date;
  observations: string;
  measurements: HealthMeasurements;
  photos: HealthPhoto[];
  
  // Assessment data
  conditionAssessment: 'improved' | 'same' | 'worse' | 'resolved';
  concernLevel: number; // 1-5 scale
  actionTaken: string;
  
  // Student reflection
  studentNotes: string;
  questionsForExpert: string;
  confidenceLevel: number; // 1-5 scale
  
  // Quality indicators
  updateCompletenessScore: number; // 0.00-1.00
  photoQualityScore: number;
  documentationQuality: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Educator review
  reviewedBy?: string;
  reviewStatus: 'pending' | 'reviewed' | 'flagged';
  educatorFeedback?: string;
  competencyDemonstrated: boolean;
  
  createdAt: Date;
}

export interface HealthMeasurements {
  temperature?: {
    value: number;
    unit: 'F' | 'C';
    time: Date;
  };
  weight?: {
    value: number;
    unit: 'lbs' | 'kg';
  };
  heartRate?: number;
  respiratoryRate?: number;
  behaviorScore?: number; // 1-5 scale
  appetiteScore?: number; // 1-5 scale
  mobilityScore?: number; // 1-5 scale
  customMeasurements?: Record<string, any>;
}

export interface HealthPhoto {
  id: string;
  uri: string;
  caption: string;
  photoType: 'condition' | 'treatment' | 'progress' | 'medication' | 'general';
  analysisResults?: {
    qualityScore: number;
    suggestedImprovements: string[];
    detectedIssues: string[];
  };
  metadata: {
    timestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
    };
    cameraSettings?: Record<string, any>;
  };
}

export interface HealthAlert {
  id: string;
  alertType: 'overdue_update' | 'escalation_needed' | 'completion_reminder' | 'condition_change';
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  
  // Target information
  studentId?: string;
  educatorId?: string;
  followUpTaskId?: string;
  
  // Alert content
  title: string;
  message: string;
  alertData: Record<string, any>;
  
  // Delivery tracking
  createdDate: Date;
  scheduledDelivery?: Date;
  deliveredDate?: Date;
  acknowledgedDate?: Date;
  
  // Response tracking
  actionTaken: boolean;
  actionDescription?: string;
  resolvedDate?: Date;
  
  // Delivery channels
  emailSent: boolean;
  pushNotificationSent: boolean;
  dashboardNotification: boolean;
  
  createdAt: Date;
}

export interface EducatorMonitoring {
  id: string;
  educatorId: string;
  studentId: string;
  followUpTaskId?: string;
  
  // Monitoring settings
  notificationPreferences: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    priorityThreshold: 'medium' | 'high' | 'urgent';
  };
  priorityThresholds: {
    overdueHours: number;
    escalationTriggers: string[];
    interventionRules: string[];
  };
  reviewFrequency: 'daily' | 'weekly' | 'as_needed';
  
  // Intervention tracking
  interventionDate?: Date;
  interventionType?: 'reminder' | 'guidance' | 'direct_contact' | 'escalation';
  interventionNotes?: string;
  interventionOutcome?: string;
  
  // Educational assessment
  studentProgressNotes?: string;
  competencyAssessment?: 'needs_improvement' | 'developing' | 'proficient' | 'advanced';
  additionalSupportNeeded: boolean;
  recommendedActions: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Utility types for dashboard views
export interface StudentHealthOverview {
  studentId: string;
  activeTasks: FollowUpTask[];
  recentCompleted: FollowUpTask[];
  currentIssues: HealthRecord[];
  performanceMetrics: {
    responseRate: number;
    averageUpdateQuality: number;
    competencyProgress: Record<string, number>;
    timelyCompletionRate: number;
  };
  upcomingDeadlines: Array<{
    taskId: string;
    title: string;
    dueDate: Date;
    priority: string;
  }>;
  recommendations: string[];
  alertSummary: {
    urgent: number;
    overdue: number;
    pending: number;
  };
}

export interface ChapterHealthMetrics {
  chapterId: string;
  totalStudents: number;
  activeHealthCases: number;
  urgentAttentionNeeded: number;
  overdueTasks: number;
  completedThisMonth: number;
  averageResolutionTime: number;
  studentEngagementRate: number;
  competencyProgress: Record<string, number>;
  trendAnalysis: {
    commonIssues: Array<{ issue: string; count: number }>;
    resolutionTrends: Array<{ period: string; avgDays: number }>;
    engagementTrends: Array<{ period: string; rate: number }>;
  };
}