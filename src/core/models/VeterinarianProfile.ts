// Veterinarian Profile and Workflow Management System

export interface VeterinarianProfile {
  id: string;
  personalInfo: VetPersonalInfo;
  professionalInfo: VetProfessionalInfo;
  credentials: VetCredentials;
  specializations: VetSpecialization[];
  availability: VetAvailability;
  preferences: VetPreferences;
  performance: VetPerformanceMetrics;
  financials: VetFinancialInfo;
  educationalRole: VetEducationalRole;
  status: VetProfileStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface VetPersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  emergencyContact: EmergencyContact;
  profilePhoto?: string;
  biography: string;
  languages: string[];
  timeZone: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface VetProfessionalInfo {
  clinicInfo: ClinicInfo;
  primaryLicense: VeterinaryLicense;
  additionalLicenses: VeterinaryLicense[];
  professionalHistory: ProfessionalPosition[];
  malpracticeInsurance: InsuranceInfo;
  deaRegistration?: DEARegistration;
}

export interface ClinicInfo {
  name: string;
  address: Address;
  phone: string;
  website?: string;
  type: 'small_animal' | 'large_animal' | 'mixed' | 'equine' | 'exotic' | 'mobile';
  services: string[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface VeterinaryLicense {
  licenseNumber: string;
  state: string;
  issuedDate: Date;
  expirationDate: Date;
  status: 'active' | 'inactive' | 'suspended' | 'revoked';
  boardName: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationDate?: Date;
}

export interface ProfessionalPosition {
  clinicName: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  responsibilities: string[];
  references: Reference[];
}

export interface Reference {
  name: string;
  title: string;
  clinic: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  expirationDate: Date;
  status: 'active' | 'expired' | 'suspended';
  telemedicineIncluded: boolean;
}

export interface DEARegistration {
  number: string;
  expirationDate: Date;
  schedule: string[];
}

export interface VetCredentials {
  education: VeterinaryEducation[];
  certifications: BoardCertification[];
  continuingEducation: CERecord[];
  publications: Publication[];
  awards: Award[];
  memberships: ProfessionalMembership[];
}

export interface VeterinaryEducation {
  institution: string;
  degree: string;
  graduationDate: Date;
  gpa?: number;
  honors?: string[];
  thesis?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface BoardCertification {
  boardName: string;
  certificationName: string;
  dateObtained: Date;
  expirationDate?: Date;
  certificateNumber: string;
  recertificationRequired: boolean;
  nextRecertificationDate?: Date;
  status: 'active' | 'expired' | 'suspended';
}

export interface CERecord {
  title: string;
  provider: string;
  hours: number;
  category: string;
  completionDate: Date;
  certificateNumber?: string;
  accreditationBody: string;
  relevantSpecialties: string[];
}

export interface Publication {
  title: string;
  journal: string;
  publicationDate: Date;
  authors: string[];
  doi?: string;
  pmid?: string;
  abstract: string;
}

export interface Award {
  name: string;
  organization: string;
  dateReceived: Date;
  description: string;
  category: string;
}

export interface ProfessionalMembership {
  organization: string;
  membershipType: string;
  startDate: Date;
  endDate?: Date;
  membershipNumber?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface VetSpecialization {
  specialty: AgricultureSpecialty;
  experienceLevel: 'novice' | 'competent' | 'proficient' | 'expert';
  yearsExperience: number;
  caseVolume: number;
  certifications: string[];
  preferredCaseTypes: string[];
  educationalFocus: string[];
}

export type AgricultureSpecialty = 
  | 'cattle_medicine'
  | 'swine_medicine'
  | 'sheep_goat_medicine'
  | 'poultry_medicine'
  | 'equine_medicine'
  | 'dairy_medicine'
  | 'beef_cattle'
  | 'reproduction'
  | 'nutrition'
  | 'herd_health'
  | 'food_safety'
  | 'animal_welfare'
  | 'emergency_medicine'
  | 'surgery'
  | 'radiology'
  | 'pathology'
  | 'pharmacology'
  | 'public_health';

export interface VetAvailability {
  schedule: WeeklySchedule;
  blackoutDates: BlackoutPeriod[];
  emergencyAvailability: EmergencyAvailability;
  consultationTypes: ConsultationTypePreference[];
  maxCasesPerDay: number;
  maxCasesPerWeek: number;
  responseTimeCommitment: number; // minutes
}

export interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

export interface DailySchedule {
  available: boolean;
  shifts: TimeSlot[];
  breaks: TimeSlot[];
  notes?: string;
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  type?: 'consultation' | 'administrative' | 'break' | 'emergency_only';
}

export interface BlackoutPeriod {
  startDate: Date;
  endDate: Date;
  reason: string;
  recurring: boolean;
  affectedServices: string[];
}

export interface EmergencyAvailability {
  available: boolean;
  responseTime: number; // minutes
  contactMethod: 'platform' | 'phone' | 'pager';
  restrictedHours?: TimeSlot[];
  additionalFee: number;
}

export interface ConsultationTypePreference {
  type: 'video' | 'phone' | 'text' | 'photo_review' | 'document_review';
  available: boolean;
  rate: number;
  minimumDuration?: number;
  maximumDuration?: number;
  setupTime: number; // minutes needed before consultation
}

export interface VetPreferences {
  studentInteraction: StudentInteractionPreferences;
  educationalFocus: EducationalFocusAreas;
  caseComplexity: CaseComplexityPreferences;
  communication: CommunicationPreferences;
  platform: PlatformPreferences;
}

export interface StudentInteractionPreferences {
  maxStudentsPerConsultation: number;
  studentLevelPreferences: ('beginner' | 'intermediate' | 'advanced')[];
  teachingStyle: 'socratic' | 'direct_instruction' | 'demonstration' | 'hands_on' | 'collaborative';
  mentorshipAvailability: boolean;
  followUpSupport: boolean;
  careerGuidanceOffered: boolean;
}

export interface EducationalFocusAreas {
  primaryAreas: AETStandard[];
  secondaryAreas: AETStandard[];
  preferredLearningObjectives: string[];
  assessmentPreferences: AssessmentType[];
  curricularIntegration: CurricularIntegration[];
}

export type AETStandard = 
  | 'AET_001' // Animal Anatomy and Physiology
  | 'AET_002' // Animal Health and Disease
  | 'AET_003' // Animal Nutrition
  | 'AET_004' // Animal Reproduction
  | 'AET_005' // Animal Genetics
  | 'AET_006' // Animal Behavior and Welfare
  | 'AET_007' // Livestock Production Systems
  | 'AET_008' // Animal Products and Processing
  | 'AET_009' // Agricultural Technology
  | 'AET_010' // Agricultural Business Management
  | 'AET_011' // Agricultural Communications
  | 'AET_012' // Agricultural Leadership
  | 'AET_013' // Agricultural Research
  | 'AET_014' // Agricultural Safety
  | 'AET_015'; // Sustainable Agriculture

export type AssessmentType = 
  | 'formative'
  | 'summative'
  | 'peer_assessment'
  | 'self_assessment'
  | 'practical_demonstration'
  | 'case_study_analysis'
  | 'problem_solving'
  | 'portfolio_review';

export type CurricularIntegration = 
  | 'classroom_instruction'
  | 'laboratory_work'
  | 'field_experience'
  | 'research_projects'
  | 'career_development'
  | 'leadership_activities'
  | 'community_service'
  | 'internships';

export interface CaseComplexityPreferences {
  preferredComplexity: ('routine' | 'moderate' | 'complex' | 'emergency')[];
  specialtyCases: boolean;
  multidisciplinaryCases: boolean;
  chronicCaseManagement: boolean;
  preventiveMedicine: boolean;
  diagnosticChallenges: boolean;
}

export interface CommunicationPreferences {
  preferredLanguages: string[];
  communicationStyle: 'formal' | 'conversational' | 'technical' | 'educational';
  documentationDetail: 'minimal' | 'standard' | 'comprehensive';
  followUpPreferences: FollowUpPreference[];
}

export interface FollowUpPreference {
  type: 'immediate' | 'short_term' | 'long_term';
  method: 'platform' | 'email' | 'phone' | 'video';
  frequency: 'as_needed' | 'scheduled' | 'milestone_based';
}

export interface PlatformPreferences {
  notificationSettings: NotificationSettings;
  workflowPreferences: WorkflowPreferences;
  interfacePreferences: InterfacePreferences;
}

export interface NotificationSettings {
  newCaseAlerts: boolean;
  urgentCaseAlerts: boolean;
  scheduleReminders: boolean;
  paymentNotifications: boolean;
  educationalUpdates: boolean;
  studentMessages: boolean;
  preferredNotificationMethods: ('push' | 'email' | 'sms' | 'in_app')[];
}

export interface WorkflowPreferences {
  autoAcceptCriteria: AutoAcceptCriteria;
  caseReviewTime: number; // minutes
  documentationTemplates: string[];
  integrationPreferences: IntegrationPreference[];
}

export interface AutoAcceptCriteria {
  enabled: boolean;
  maxCasesPerDay: number;
  specialtyMatch: boolean;
  complexityLevel: string[];
  studentLevel: string[];
  timeOfDay: TimeSlot[];
}

export interface IntegrationPreference {
  system: string;
  enabled: boolean;
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'manual';
}

export interface InterfacePreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dashboardLayout: 'compact' | 'detailed' | 'custom';
  shortcutKeys: boolean;
}

export interface VetPerformanceMetrics {
  consultationStats: ConsultationStatistics;
  educationalMetrics: EducationalMetrics;
  clientSatisfaction: SatisfactionMetrics;
  platformEngagement: EngagementMetrics;
  qualityMetrics: QualityMetrics;
  financialMetrics: FinancialMetrics;
}

export interface ConsultationStatistics {
  totalConsultations: number;
  consultationsByType: Record<string, number>;
  averageConsultationDuration: number;
  averageResponseTime: number;
  completionRate: number;
  cancelationRate: number;
  noShowRate: number;
  rescheduleRate: number;
  emergencyConsultations: number;
  routineConsultations: number;
}

export interface EducationalMetrics {
  studentsSupported: number;
  learningObjectivesAchieved: number;
  educationalResourcesCreated: number;
  mentorshipHours: number;
  curriculumContributions: number;
  assessmentParticipation: number;
  studentProgressTracked: number;
  educationalOutcomeSuccess: number;
}

export interface SatisfactionMetrics {
  overallRating: number;
  studentRatings: number;
  educatorRatings: number;
  clientRatings: number;
  communicationRating: number;
  technicalSkillRating: number;
  teachingEffectivenessRating: number;
  professionalismRating: number;
  recommendationRate: number;
}

export interface EngagementMetrics {
  loginFrequency: number;
  sessionDuration: number;
  featureUsage: Record<string, number>;
  messageResponseTime: number;
  documentationCompleteness: number;
  continuousImprovementParticipation: number;
  platformFeedbackProvided: number;
}

export interface QualityMetrics {
  diagnosticAccuracy: number;
  treatmentSuccess: number;
  adherenceToProtocols: number;
  documentationQuality: number;
  safetyIncidents: number;
  peerReviewScores: number;
  continuingEducationCompliance: number;
  standardsAdherence: number;
}

export interface FinancialMetrics {
  totalEarnings: number;
  monthlyEarnings: number[];
  averageConsultationFee: number;
  bonusEarnings: number;
  educationalBonuses: number;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  date: Date;
  amount: number;
  consultationId: string;
  type: 'consultation' | 'bonus' | 'educational' | 'emergency';
  status: 'pending' | 'paid' | 'disputed';
}

export interface VetFinancialInfo {
  compensationStructure: CompensationStructure;
  paymentPreferences: PaymentPreferences;
  taxInformation: TaxInformation;
  banking: BankingInformation;
}

export interface CompensationStructure {
  partnershipTier: 'volunteer' | 'professional' | 'chapter_partner' | 'premium_partner';
  baseRate: number;
  bonusStructure: BonusStructure;
  educationalIncentives: EducationalIncentive[];
  performanceIncentives: PerformanceIncentive[];
}

export interface BonusStructure {
  qualityBonus: number; // percentage
  volumeBonus: VolumeBonus[];
  emergencyBonus: number;
  educationalBonus: number;
  retentionBonus: number;
}

export interface VolumeBonus {
  threshold: number; // consultations per month
  bonusPercentage: number;
}

export interface EducationalIncentive {
  activity: string;
  reward: number;
  maxPerMonth: number;
  description: string;
}

export interface PerformanceIncentive {
  metric: string;
  threshold: number;
  reward: number;
  period: 'monthly' | 'quarterly' | 'annually';
}

export interface PaymentPreferences {
  method: 'direct_deposit' | 'check' | 'paypal' | 'wire_transfer';
  frequency: 'weekly' | 'biweekly' | 'monthly';
  minimumThreshold: number;
  currency: string;
}

export interface TaxInformation {
  taxId: string;
  taxClassification: '1099' | 'W2' | 'international';
  businessEntity: 'individual' | 'llc' | 'corporation' | 'partnership';
  businessName?: string;
  businessAddress?: Address;
}

export interface BankingInformation {
  accountHolderName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'business';
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface VetEducationalRole {
  teachingCredentials: TeachingCredential[];
  educationalExperience: EducationalExperience[];
  mentorshipPrograms: MentorshipProgram[];
  curriculumDevelopment: CurriculumContribution[];
  assessmentExpertise: AssessmentExpertise[];
}

export interface TeachingCredential {
  credential: string;
  issuingBody: string;
  dateObtained: Date;
  expirationDate?: Date;
  subjects: string[];
  level: 'secondary' | 'post_secondary' | 'continuing_education';
}

export interface EducationalExperience {
  institution: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  subjects: string[];
  studentLevel: string;
  achievements: string[];
}

export interface MentorshipProgram {
  programName: string;
  organization: string;
  role: 'mentor' | 'coordinator' | 'developer';
  startDate: Date;
  endDate?: Date;
  studentsSupported: number;
  outcomes: string[];
}

export interface CurriculumContribution {
  title: string;
  type: 'course' | 'module' | 'assessment' | 'resource';
  institution: string;
  dateCreated: Date;
  subjects: AETStandard[];
  usage: string;
}

export interface AssessmentExpertise {
  assessmentType: AssessmentType;
  experienceLevel: 'novice' | 'competent' | 'expert';
  standardsAlignment: AETStandard[];
  toolsDeveloped: string[];
}

export type VetProfileStatus = 
  | 'pending_verification'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'under_review'
  | 'deactivated';

// Onboarding and Workflow Types
export interface VetOnboardingProgress {
  veterinarianId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  stepProgress: Record<OnboardingStep, StepProgress>;
  startedAt: Date;
  completedAt?: Date;
  assignedOnboardingCoordinator?: string;
}

export type OnboardingStep = 
  | 'personal_info'
  | 'professional_info'
  | 'license_verification'
  | 'education_verification'
  | 'insurance_verification'
  | 'specialization_assessment'
  | 'platform_training'
  | 'educational_training'
  | 'trial_consultations'
  | 'final_approval';

export interface StepProgress {
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'requires_review';
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  documentsRequired: string[];
  documentsSubmitted: string[];
  reviewerComments?: string[];
}

// Workflow Management Types
export interface VetWorkflowState {
  veterinarianId: string;
  currentCases: ActiveCase[];
  pendingCases: PendingCase[];
  schedule: ScheduleEntry[];
  notifications: VetNotification[];
  tasksToComplete: WorkflowTask[];
  performanceAlerts: PerformanceAlert[];
}

export interface ActiveCase {
  caseId: string;
  studentId: string;
  animalId: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  consultationType: 'video' | 'phone' | 'text' | 'photo_review';
  estimatedDuration: number;
  scheduledTime: Date;
  status: 'scheduled' | 'in_progress' | 'awaiting_documentation' | 'completed';
  educationalObjectives: string[];
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface PendingCase {
  caseId: string;
  submittedAt: Date;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  specialtyRequired: AgricultureSpecialty[];
  estimatedDuration: number;
  educationalContext: string;
  autoAcceptEligible: boolean;
  requiresReview: boolean;
}

export interface ScheduleEntry {
  id: string;
  type: 'consultation' | 'break' | 'administrative' | 'emergency_slot';
  startTime: Date;
  endTime: Date;
  consultationId?: string;
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  notes?: string;
}

export interface VetNotification {
  id: string;
  type: 'new_case' | 'urgent_case' | 'schedule_change' | 'payment' | 'educational_update' | 'system_alert';
  title: string;
  message: string;
  createdAt: Date;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WorkflowTask {
  id: string;
  type: 'documentation' | 'follow_up' | 'review' | 'administrative' | 'educational';
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedCaseId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  estimatedTime: number; // minutes
}

export interface PerformanceAlert {
  id: string;
  type: 'quality' | 'response_time' | 'satisfaction' | 'documentation' | 'engagement';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  actionItems: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

// Factory functions for creating new instances
export const createNewVeterinarianProfile = (
  personalInfo: VetPersonalInfo,
  professionalInfo: VetProfessionalInfo
): VeterinarianProfile => {
  return {
    id: generateId(),
    personalInfo,
    professionalInfo,
    credentials: {
      education: [],
      certifications: [],
      continuingEducation: [],
      publications: [],
      awards: [],
      memberships: []
    },
    specializations: [],
    availability: createDefaultAvailability(),
    preferences: createDefaultPreferences(),
    performance: createInitialPerformanceMetrics(),
    financials: createDefaultFinancialInfo(),
    educationalRole: {
      teachingCredentials: [],
      educationalExperience: [],
      mentorshipPrograms: [],
      curriculumDevelopment: [],
      assessmentExpertise: []
    },
    status: 'pending_verification',
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const createDefaultAvailability = (): VetAvailability => {
  return {
    schedule: {
      monday: { available: true, shifts: [], breaks: [] },
      tuesday: { available: true, shifts: [], breaks: [] },
      wednesday: { available: true, shifts: [], breaks: [] },
      thursday: { available: true, shifts: [], breaks: [] },
      friday: { available: true, shifts: [], breaks: [] },
      saturday: { available: false, shifts: [], breaks: [] },
      sunday: { available: false, shifts: [], breaks: [] }
    },
    blackoutDates: [],
    emergencyAvailability: {
      available: false,
      responseTime: 60,
      contactMethod: 'platform',
      additionalFee: 50
    },
    consultationTypes: [],
    maxCasesPerDay: 8,
    maxCasesPerWeek: 30,
    responseTimeCommitment: 30
  };
};

const createDefaultPreferences = (): VetPreferences => {
  return {
    studentInteraction: {
      maxStudentsPerConsultation: 3,
      studentLevelPreferences: ['beginner', 'intermediate', 'advanced'],
      teachingStyle: 'collaborative',
      mentorshipAvailability: true,
      followUpSupport: true,
      careerGuidanceOffered: true
    },
    educationalFocus: {
      primaryAreas: [],
      secondaryAreas: [],
      preferredLearningObjectives: [],
      assessmentPreferences: ['formative', 'practical_demonstration'],
      curricularIntegration: ['classroom_instruction', 'field_experience']
    },
    caseComplexity: {
      preferredComplexity: ['routine', 'moderate', 'complex'],
      specialtyCases: true,
      multidisciplinaryCases: true,
      chronicCaseManagement: true,
      preventiveMedicine: true,
      diagnosticChallenges: true
    },
    communication: {
      preferredLanguages: ['English'],
      communicationStyle: 'educational',
      documentationDetail: 'comprehensive',
      followUpPreferences: []
    },
    platform: {
      notificationSettings: {
        newCaseAlerts: true,
        urgentCaseAlerts: true,
        scheduleReminders: true,
        paymentNotifications: true,
        educationalUpdates: true,
        studentMessages: true,
        preferredNotificationMethods: ['push', 'email']
      },
      workflowPreferences: {
        autoAcceptCriteria: {
          enabled: false,
          maxCasesPerDay: 5,
          specialtyMatch: true,
          complexityLevel: ['routine', 'moderate'],
          studentLevel: ['beginner', 'intermediate'],
          timeOfDay: []
        },
        caseReviewTime: 15,
        documentationTemplates: [],
        integrationPreferences: []
      },
      interfacePreferences: {
        theme: 'light',
        language: 'English',
        timezone: 'America/New_York',
        dashboardLayout: 'detailed',
        shortcutKeys: true
      }
    }
  };
};

const createInitialPerformanceMetrics = (): VetPerformanceMetrics => {
  return {
    consultationStats: {
      totalConsultations: 0,
      consultationsByType: {},
      averageConsultationDuration: 0,
      averageResponseTime: 0,
      completionRate: 0,
      cancelationRate: 0,
      noShowRate: 0,
      rescheduleRate: 0,
      emergencyConsultations: 0,
      routineConsultations: 0
    },
    educationalMetrics: {
      studentsSupported: 0,
      learningObjectivesAchieved: 0,
      educationalResourcesCreated: 0,
      mentorshipHours: 0,
      curriculumContributions: 0,
      assessmentParticipation: 0,
      studentProgressTracked: 0,
      educationalOutcomeSuccess: 0
    },
    clientSatisfaction: {
      overallRating: 0,
      studentRatings: 0,
      educatorRatings: 0,
      clientRatings: 0,
      communicationRating: 0,
      technicalSkillRating: 0,
      teachingEffectivenessRating: 0,
      professionalismRating: 0,
      recommendationRate: 0
    },
    platformEngagement: {
      loginFrequency: 0,
      sessionDuration: 0,
      featureUsage: {},
      messageResponseTime: 0,
      documentationCompleteness: 0,
      continuousImprovementParticipation: 0,
      platformFeedbackProvided: 0
    },
    qualityMetrics: {
      diagnosticAccuracy: 0,
      treatmentSuccess: 0,
      adherenceToProtocols: 0,
      documentationQuality: 0,
      safetyIncidents: 0,
      peerReviewScores: 0,
      continuingEducationCompliance: 0,
      standardsAdherence: 0
    },
    financialMetrics: {
      totalEarnings: 0,
      monthlyEarnings: [],
      averageConsultationFee: 0,
      bonusEarnings: 0,
      educationalBonuses: 0,
      paymentHistory: []
    }
  };
};

const createDefaultFinancialInfo = (): VetFinancialInfo => {
  return {
    compensationStructure: {
      partnershipTier: 'professional',
      baseRate: 75,
      bonusStructure: {
        qualityBonus: 10,
        volumeBonus: [],
        emergencyBonus: 25,
        educationalBonus: 15,
        retentionBonus: 5
      },
      educationalIncentives: [],
      performanceIncentives: []
    },
    paymentPreferences: {
      method: 'direct_deposit',
      frequency: 'monthly',
      minimumThreshold: 100,
      currency: 'USD'
    },
    taxInformation: {
      taxId: '',
      taxClassification: '1099',
      businessEntity: 'individual'
    },
    banking: {
      accountHolderName: '',
      bankName: '',
      routingNumber: '',
      accountNumber: '',
      accountType: 'checking',
      verificationStatus: 'pending'
    }
  };
};