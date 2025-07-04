export interface HealthRecord {
  id: string;
  animalId: string;
  recordedBy: string;
  recordedDate: Date;
  observationType: 'routine' | 'illness' | 'treatment' | 'emergency';
  
  // Vital Signs
  temperature?: number; // Fahrenheit
  heartRate?: number; // BPM
  respiratoryRate?: number; // BPM
  
  // Physical Condition Scores (1-5 scale)
  bodyConditionScore?: number;
  mobilityScore?: number;
  appetiteScore?: number;
  alertnessScore?: number;
  
  // Specific Observations
  eyeCondition: 'normal' | 'discharge' | 'swollen' | 'cloudy' | 'injured' | 'other';
  nasalDischarge: 'none' | 'clear' | 'thick' | 'bloody' | 'purulent' | 'other';
  manureConsistency: 'normal' | 'soft' | 'loose' | 'watery' | 'hard' | 'bloody' | 'other';
  gaitMobility: 'normal' | 'slight_limp' | 'obvious_limp' | 'reluctant_to_move' | 'down' | 'other';
  appetite: 'normal' | 'reduced' | 'absent' | 'increased' | 'other';
  
  // Symptoms
  symptoms: string[]; // Array of symptom IDs
  customSymptoms?: string[];
  
  // Detailed Notes
  notes: string;
  
  // Photos and Documentation
  photos: HealthPhoto[];
  
  // Unknown Condition Tracking
  isUnknownCondition?: boolean;
  unknownConditionPriority?: 'monitor' | 'concern' | 'urgent' | 'emergency';
  expertReviewRequested?: boolean;
  expertReviewStatus?: 'pending' | 'in_review' | 'completed';
  expertReviewId?: string;
  
  // Treatment Related
  treatmentId?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  
  // Environmental Correlation
  weather?: {
    temperature: number;
    humidity: number;
    conditions: string;
  };
  
  // AET Integration
  aetJournalEntryId?: string;
  aetSkillsUsed?: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface HealthPhoto {
  id: string;
  healthRecordId: string;
  filename: string;
  uri: string;
  photoType: 'eye' | 'nasal' | 'manure' | 'gait' | 'skin' | 'general' | 'comparison' | 'unknown';
  description?: string;
  qualityScore?: number; // 0-1 scale from AI analysis
  aiAnalysis?: {
    detected_conditions: string[];
    confidence_scores: Record<string, number>;
    recommendations: string[];
    requires_expert_review: boolean;
  };
  capturedAt: Date;
  userId: string;
}

export interface Treatment {
  id: string;
  healthRecordId: string;
  animalId: string;
  treatmentType: 'medication' | 'vaccination' | 'procedure' | 'supportive_care' | 'other';
  
  // Treatment Details
  name: string;
  description: string;
  medication?: {
    name: string;
    dosage: string;
    route: 'oral' | 'injection' | 'topical' | 'intravenous' | 'other';
    frequency: string;
    duration: string;
    withdrawalPeriod?: number; // days
    batchNumber?: string;
    expirationDate?: Date;
  };
  
  // Administration
  administeredBy: string;
  administeredDate: Date;
  nextDoseDate?: Date;
  
  // Costs
  cost?: number;
  supplier?: string;
  
  // Documentation
  photos: string[]; // Photo URIs
  notes: string;
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  treatmentComplete: boolean;
  
  // Veterinary
  veterinarianId?: string;
  prescription?: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface DiseaseReference {
  id: string;
  name: string;
  commonNames: string[];
  category: 'digestive' | 'respiratory' | 'reproductive' | 'musculoskeletal' | 'skin' | 'neurological' | 'other';
  species: string[]; // ['cattle', 'sheep', 'swine', 'goat', 'poultry']
  
  // Clinical Information
  severity: 1 | 2 | 3 | 4 | 5; // 1 = mild, 5 = severe
  contagious: boolean;
  zoonotic: boolean;
  
  // Symptoms and Signs
  primarySymptoms: string[];
  secondarySymptoms: string[];
  
  // Epidemiology
  causes: string[];
  riskFactors: string[];
  ageGroupsAffected: string[];
  seasonalPattern?: 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
  
  // Management
  treatmentOptions: string[];
  preventionMethods: string[];
  whenToCallVet: string[];
  
  // Educational Content
  educationalNotes: string;
  learningObjectives: string[];
  aetStandards: string[];
  
  // Media
  photos: string[];
  videos: string[];
  
  // Regional Data
  prevalenceByRegion: Record<string, number>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface UnknownConditionReview {
  id: string;
  healthRecordId: string;
  studentId: string;
  expertId?: string;
  
  // Student Submission
  observationDescription: string;
  whenFirstNoticed: 'today' | 'yesterday' | '2-3_days' | 'week_ago' | 'longer';
  whatMadeConcerned: string[];
  priorityLevel: 'monitor' | 'concern' | 'urgent' | 'emergency';
  
  // Expert Assignment
  assignedDate?: Date;
  expertSpecialty?: string;
  estimatedReviewTime?: number; // hours
  
  // Expert Review
  expertDiagnosis?: string;
  recommendedActions: string[];
  educationalNotes?: string;
  similarCases?: string[]; // Reference to other cases
  
  // Status Tracking
  status: 'submitted' | 'assigned' | 'in_review' | 'completed' | 'escalated';
  urgencyScore: number; // 1-10 scale
  
  // Learning Outcomes
  studentFeedback?: string;
  teacherNotes?: string;
  skillsLearned: string[];
  
  // Metadata
  submittedAt: Date;
  reviewedAt?: Date;
  completedAt?: Date;
  userId: string;
}

export interface HealthSummary {
  animalId: string;
  totalRecords: number;
  lastHealthCheck: Date;
  currentHealthScore: number; // 1-5 scale
  
  // Recent Activity
  recentIssues: string[];
  activeAlerts: HealthAlert[];
  upcomingTreatments: Treatment[];
  
  // Health Trends
  healthTrend: 'improving' | 'stable' | 'declining';
  weightCorrelation: number; // -1 to 1
  
  // Statistics
  commonSymptoms: Array<{
    symptom: string;
    frequency: number;
  }>;
  
  // Vaccination Status
  vaccinationStatus: VaccinationRecord[];
  
  // Cost Analysis
  totalHealthCosts: number;
  costByCategory: Record<string, number>;
}

export interface VaccinationRecord {
  id: string;
  animalId: string;
  vaccineName: string;
  vaccineType: string;
  manufacturer: string;
  batchNumber: string;
  administeredDate: Date;
  expirationDate: Date;
  nextDueDate?: Date;
  administeredBy: string;
  cost?: number;
  notes?: string;
  userId: string;
}

export interface HealthAlert {
  id: string;
  animalId: string;
  alertType: 'treatment_due' | 'vaccination_due' | 'follow_up_required' | 'health_decline' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  dueDate?: Date;
  actionRequired: string;
  dismissed: boolean;
  createdAt: Date;
  userId: string;
}

// Predefined Symptoms List
export const COMMON_SYMPTOMS = [
  { id: 'scours', name: 'Scours/Diarrhea', category: 'digestive', icon: '💩' },
  { id: 'respiratory', name: 'Respiratory Issues', category: 'respiratory', icon: '🫁' },
  { id: 'lameness', name: 'Lameness', category: 'mobility', icon: '🦶' },
  { id: 'fever', name: 'Fever', category: 'systemic', icon: '🔥' },
  { id: 'lethargy', name: 'Lethargy', category: 'behavior', icon: '🥱' },
  { id: 'eye_issues', name: 'Eye Issues', category: 'sensory', icon: '👁️' },
  { id: 'nasal_discharge', name: 'Nasal Discharge', category: 'respiratory', icon: '👃' },
  { id: 'coughing', name: 'Coughing', category: 'respiratory', icon: '😷' },
  { id: 'swelling', name: 'Swelling', category: 'inflammatory', icon: '🎈' },
  { id: 'skin_lesions', name: 'Skin Lesions', category: 'dermatological', icon: '🩹' },
  { id: 'appetite_loss', name: 'Loss of Appetite', category: 'digestive', icon: '🚫' },
  { id: 'weight_loss', name: 'Weight Loss', category: 'systemic', icon: '📉' },
  { id: 'bloat', name: 'Bloat', category: 'digestive', icon: '🎈' },
  { id: 'excessive_salivation', name: 'Excessive Salivation', category: 'oral', icon: '💧' },
  { id: 'abnormal_behavior', name: 'Abnormal Behavior', category: 'neurological', icon: '🤪' },
];

export const OBSERVATION_TYPES = [
  { id: 'routine', name: 'Routine Check', icon: '📋', color: '#4CAF50' },
  { id: 'illness', name: 'Illness/Concern', icon: '🏥', color: '#FF9800' },
  { id: 'treatment', name: 'Treatment/Medication', icon: '💉', color: '#2196F3' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', color: '#F44336' },
];