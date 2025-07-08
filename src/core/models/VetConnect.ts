// VetConnect Platform Models for Veterinary Integration

export interface VeterinaryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  clinicName: string;
  licenseNumber: string;
  specializations: string[];
  partnershipTier: 'volunteer' | 'professional' | 'chapter_partner';
  isActive: boolean;
  availability: VetAvailability;
  credentials: VetCredentials;
  performance: VetPerformance;
  compensation: CompensationDetails;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface VetAvailability {
  timeZone: string;
  weeklyHours: WeeklySchedule;
  blackoutDates: Date[];
  preferredCaseTypes: string[];
  maxCasesPerDay: number;
  emergencyAvailable: boolean;
}

export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface VetCredentials {
  degree: string;
  institution: string;
  graduationYear: number;
  boardCertifications: string[];
  continuingEducationHours: number;
  publications: string[];
  awards: string[];
}

export interface VetPerformance {
  totalConsultations: number;
  averageRating: number;
  responseTimeMinutes: number;
  resolutionRate: number;
  studentSatisfaction: number;
  educatorFeedback: number;
  lastMonthConsultations: number;
  totalEarnings: number;
}

export interface CompensationDetails {
  baseRate: number;
  bonusMultiplier: number;
  paymentMethod: 'direct_deposit' | 'check' | 'paypal';
  taxId: string;
  preferredCurrency: string;
  minimumPayoutThreshold: number;
}

export interface HealthAssessment {
  id: string;
  animalId: string;
  studentId: string;
  assessmentType: 'routine' | 'concern' | 'emergency' | 'follow_up';
  symptoms: SymptomData[];
  aiAnalysis: AIAnalysisResult;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendedAction: 'monitor' | 'home_care' | 'vet_consultation' | 'emergency_care';
  confidenceScore: number;
  photos: AssessmentPhoto[];
  vitals: VitalSigns;
  environmentalFactors: EnvironmentalData;
  createdAt: Date;
  updatedAt: Date;
}

export interface SymptomData {
  category: 'behavioral' | 'physical' | 'appetite' | 'mobility' | 'respiratory' | 'digestive' | 'other';
  symptom: string;
  severity: 1 | 2 | 3 | 4 | 5;
  duration: string;
  frequency: 'constant' | 'intermittent' | 'occasional' | 'rare';
  notes: string;
}

export interface AIAnalysisResult {
  possibleConditions: DiagnosticSuggestion[];
  riskFactors: string[];
  recommendedTests: string[];
  treatmentSuggestions: string[];
  preventiveMeasures: string[];
  educationalResources: string[];
  confidenceLevel: number;
  analysisTimestamp: Date;
}

export interface DiagnosticSuggestion {
  condition: string;
  probability: number;
  description: string;
  commonIn: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  requiredAction: string;
}

export interface AssessmentPhoto {
  id: string;
  uri: string;
  caption: string;
  bodyPart: string;
  timestamp: Date;
  analysisResults?: ImageAnalysisResult;
}

export interface ImageAnalysisResult {
  detectedAbnormalities: string[];
  confidenceScores: number[];
  recommendedViews: string[];
  qualityScore: number;
}

export interface VitalSigns {
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  weight?: number;
  bodyConditionScore?: number;
  alertness: 'normal' | 'depressed' | 'hyperalert' | 'unresponsive';
  appetite: 'normal' | 'increased' | 'decreased' | 'absent';
  hydrationStatus: 'normal' | 'mild_dehydration' | 'moderate_dehydration' | 'severe_dehydration';
}

export interface EnvironmentalData {
  housingType: string;
  groupSize: number;
  recentChanges: string[];
  feedType: string;
  waterSource: string;
  weatherConditions: string;
  stressFactors: string[];
}

export interface VetConsultation {
  id: string;
  assessmentId: string;
  veterinarianId: string;
  studentId: string;
  animalId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'follow_up_needed';
  consultationType: 'video' | 'phone' | 'text' | 'photo_review';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  
  // Consultation Data
  veterinaryDiagnosis: VetDiagnosis;
  treatmentPlan: TreatmentPlan;
  followUpRequired: boolean;
  followUpDate?: Date;
  
  // Educational Components
  learningObjectives: string[];
  educationalResources: EducationalResource[];
  skillsAssessed: string[];
  
  // Communication
  consultationNotes: string;
  studentQuestions: string[];
  educatorNotifications: boolean;
  
  // Billing
  consultationFee: number;
  veterinarianEarnings: number;
  platformFee: number;
  paymentStatus: 'pending' | 'paid' | 'disputed';
  
  // Quality Metrics
  studentRating?: number;
  studentFeedback?: string;
  educatorRating?: number;
  educatorFeedback?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface VetDiagnosis {
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  diagnosticConfidence: number;
  recommendedTests: DiagnosticTest[];
  prognosisAssessment: 'excellent' | 'good' | 'fair' | 'guarded' | 'poor';
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
}

export interface DiagnosticTest {
  testName: string;
  priority: 'essential' | 'recommended' | 'optional';
  estimatedCost: number;
  expectedResults: string;
  educationalValue: string;
}

export interface TreatmentPlan {
  immediateActions: TreatmentAction[];
  medications: Medication[];
  managementChanges: string[];
  monitoringInstructions: string[];
  preventiveMeasures: string[];
  expectedOutcome: string;
  timeToResolution: string;
  warningSignsToWatch: string[];
}

export interface TreatmentAction {
  action: string;
  priority: 'immediate' | 'within_24h' | 'within_week' | 'ongoing';
  frequency: string;
  duration: string;
  instructions: string;
  studentCanPerform: boolean;
  supervisionRequired: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  administration: string;
  sideEffects: string[];
  contraindications: string[];
  cost: number;
  prescriptionRequired: boolean;
  educationalNotes: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'interactive' | 'assessment' | 'case_study';
  url: string;
  description: string;
  estimatedTime: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  aetStandards: string[];
}

export interface ConsultationRequest {
  assessmentId: string;
  preferredTime?: Date;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  consultationType: 'video' | 'phone' | 'text' | 'photo_review';
  specialistRequired?: string;
  additionalNotes?: string;
  educatorApproval: boolean;
  budgetApproved: boolean;
  studentQuestions: string[];
}

export interface SmartRoutingCriteria {
  animalSpecies: string;
  symptomCategories: string[];
  urgencyLevel: string;
  requiredSpecializations: string[];
  timeZone: string;
  budgetConstraints: number;
  educationalGoals: string[];
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface RoutingResult {
  recommendedVeterinarians: VeterinaryPartner[];
  matchingScores: number[];
  estimatedResponseTimes: number[];
  alternativeOptions: VeterinaryPartner[];
  emergencyContacts: VeterinaryPartner[];
}

export interface ConsultationOutcome {
  consultationId: string;
  educationalValue: number;
  diagnosticAccuracy: number;
  treatmentEffectiveness: number;
  studentEngagement: number;
  costEffectiveness: number;
  followUpCompliance: number;
  overallSatisfaction: number;
  improvementAreas: string[];
  successMetrics: string[];
}

export interface VetConnectAnalytics {
  totalConsultations: number;
  averageResponseTime: number;
  resolutionRate: number;
  studentSatisfaction: number;
  educatorSatisfaction: number;
  veterinarianRetention: number;
  revenueGenerated: number;
  educationalOutcomes: number;
  emergencyResponseTime: number;
  platformGrowth: number;
}

// Type definitions for creating new records
export type CreateHealthAssessmentRequest = Omit<HealthAssessment, 'id' | 'createdAt' | 'updatedAt' | 'aiAnalysis'>;
export type CreateConsultationRequest = Omit<VetConsultation, 'id' | 'createdAt' | 'updatedAt' | 'veterinaryDiagnosis' | 'treatmentPlan'>;
export type CreateVeterinaryPartnerRequest = Omit<VeterinaryPartner, 'id' | 'createdAt' | 'lastActiveAt' | 'performance'>;

// Enums for consistent typing
export const ASSESSMENT_TYPES = ['routine', 'concern', 'emergency', 'follow_up'] as const;
export const URGENCY_LEVELS = ['low', 'medium', 'high', 'emergency'] as const;
export const CONSULTATION_TYPES = ['video', 'phone', 'text', 'photo_review'] as const;
export const PARTNERSHIP_TIERS = ['volunteer', 'professional', 'chapter_partner'] as const;
export const CONSULTATION_STATUS = ['pending', 'in_progress', 'completed', 'cancelled', 'follow_up_needed'] as const;

export const SYMPTOM_CATEGORIES = [
  'behavioral',
  'physical', 
  'appetite',
  'mobility',
  'respiratory',
  'digestive',
  'other'
] as const;

export const SPECIALIZATIONS = [
  'Large Animal Medicine',
  'Small Ruminants',
  'Swine Medicine',
  'Poultry Medicine',
  'Equine Medicine',
  'Food Animal Medicine',
  'Emergency Medicine',
  'Surgery',
  'Reproduction',
  'Nutrition',
  'Parasitology',
  'Infectious Disease'
] as const;