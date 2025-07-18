/**
 * Navigation Types for ShowTrackAI
 * 
 * Defines the type structure for navigation parameters
 * across all screens in the application
 */

export type RootStackParamList = {
  // Main Dashboard
  Dashboard: undefined;
  
  // Animal Management
  AnimalList: undefined;
  AnimalForm: { animalId?: string };
  AnimalDetails: { animalId: string };
  WeightHistory: { animalId: string };
  AddWeight: { animalId: string };
  PhotoGallery: { animalId: string };
  AIWeightPrediction: { animalId: string };
  
  // Journal System
  JournalList: undefined;
  JournalEntry: { entryId?: string };
  JournalDetail: { entryId: string };
  
  // Financial Tracking
  FinancialTracking: undefined;
  
  // Medical Records
  MedicalRecords: undefined;
  
  // FFA System
  FFADashboard: undefined;
  FFADegreeProgress: undefined;
  FFASAEProjects: undefined;
  FFACompetitions: undefined;
  ParentDashboard: { studentId: string };
  ParentLinking: undefined;
  StudentLinking: undefined;
  EvidenceSubmission: {
    degreeLevel: any;
    requirementKey: string;
    requirement: any;
  };
  
  // Calendar & Events
  Calendar: undefined;
  EventForm: { eventId?: string };
  AttendedEvents: undefined;
  NotificationSettings: undefined;
  
  // Agricultural Education Platform
  AgriculturalEducationDashboard: undefined;
  SAEProjectManagement: undefined;
  HealthRecordManagement: undefined;
  FeedEfficiencyAnalysis: undefined;
  CompetencyTracking: undefined;
};

export default RootStackParamList;