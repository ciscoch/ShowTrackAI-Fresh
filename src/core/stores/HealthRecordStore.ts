import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  HealthRecord, 
  Treatment, 
  HealthSummary, 
  HealthAlert, 
  VaccinationRecord,
  UnknownConditionReview,
  DiseaseReference,
  HealthPhoto 
} from '../models/HealthRecord';

interface HealthRecordStore {
  // State
  healthRecords: HealthRecord[];
  treatments: Treatment[];
  vaccinations: VaccinationRecord[];
  alerts: HealthAlert[];
  unknownConditionReviews: UnknownConditionReview[];
  diseaseReferences: DiseaseReference[];
  isLoading: boolean;
  error: string | null;
  
  // Health Record Actions
  loadHealthRecords: () => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHealthRecord: (id: string, updates: Partial<HealthRecord>) => Promise<void>;
  deleteHealthRecord: (id: string) => Promise<void>;
  getHealthRecordsByAnimal: (animalId: string) => HealthRecord[];
  
  // Treatment Actions
  addTreatment: (treatment: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTreatment: (id: string, updates: Partial<Treatment>) => Promise<void>;
  getTreatmentsByAnimal: (animalId: string) => Treatment[];
  getActiveTreatments: (animalId: string) => Treatment[];
  
  // Vaccination Actions
  addVaccination: (vaccination: Omit<VaccinationRecord, 'id'>) => Promise<void>;
  updateVaccination: (id: string, updates: Partial<VaccinationRecord>) => Promise<void>;
  getVaccinationsByAnimal: (animalId: string) => VaccinationRecord[];
  getUpcomingVaccinations: (animalId: string) => VaccinationRecord[];
  
  // Health Analysis
  getHealthSummary: (animalId: string) => HealthSummary;
  getHealthTrends: (animalId: string, days: number) => any;
  
  // Alert Management
  getAlertsByAnimal: (animalId: string) => HealthAlert[];
  dismissAlert: (alertId: string) => Promise<void>;
  createAlert: (alert: Omit<HealthAlert, 'id' | 'createdAt'>) => Promise<void>;
  
  // Unknown Condition Reviews
  submitUnknownCondition: (review: Omit<UnknownConditionReview, 'id' | 'submittedAt'>) => Promise<void>;
  getUnknownConditionReviews: (studentId: string) => UnknownConditionReview[];
  
  // Disease Reference
  searchDiseases: (query: string, species?: string) => DiseaseReference[];
  getDiseasesBySymptoms: (symptoms: string[], species: string) => DiseaseReference[];
  
  // Photo Management
  addHealthPhoto: (photo: Omit<HealthPhoto, 'id' | 'capturedAt'>) => Promise<void>;
  analyzePhoto: (photoUri: string, photoType: string) => Promise<any>;
}

const STORAGE_KEYS = {
  HEALTH_RECORDS: '@health_records',
  TREATMENTS: '@treatments',
  VACCINATIONS: '@vaccinations',
  ALERTS: '@health_alerts',
  UNKNOWN_REVIEWS: '@unknown_condition_reviews',
};

export const useHealthRecordStore = create<HealthRecordStore>((set, get) => ({
  // Initial State
  healthRecords: [],
  treatments: [],
  vaccinations: [],
  alerts: [],
  unknownConditionReviews: [],
  diseaseReferences: [],
  isLoading: false,
  error: null,

  // Load Health Records
  loadHealthRecords: async () => {
    set({ isLoading: true, error: null });
    try {
      const [recordsData, treatmentsData, vaccinationsData, alertsData, reviewsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS),
        AsyncStorage.getItem(STORAGE_KEYS.TREATMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.VACCINATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.ALERTS),
        AsyncStorage.getItem(STORAGE_KEYS.UNKNOWN_REVIEWS),
      ]);

      const healthRecords = recordsData ? JSON.parse(recordsData) : [];
      const treatments = treatmentsData ? JSON.parse(treatmentsData) : [];
      const vaccinations = vaccinationsData ? JSON.parse(vaccinationsData) : [];
      const alerts = alertsData ? JSON.parse(alertsData) : [];
      const unknownConditionReviews = reviewsData ? JSON.parse(reviewsData) : [];

      // Convert date strings back to Date objects
      healthRecords.forEach((record: any) => {
        record.recordedDate = new Date(record.recordedDate);
        record.createdAt = new Date(record.createdAt);
        record.updatedAt = new Date(record.updatedAt);
        if (record.followUpDate) record.followUpDate = new Date(record.followUpDate);
        record.photos.forEach((photo: any) => {
          photo.capturedAt = new Date(photo.capturedAt);
        });
      });

      treatments.forEach((treatment: any) => {
        treatment.administeredDate = new Date(treatment.administeredDate);
        treatment.createdAt = new Date(treatment.createdAt);
        treatment.updatedAt = new Date(treatment.updatedAt);
        if (treatment.nextDoseDate) treatment.nextDoseDate = new Date(treatment.nextDoseDate);
        if (treatment.followUpDate) treatment.followUpDate = new Date(treatment.followUpDate);
        if (treatment.medication?.expirationDate) {
          treatment.medication.expirationDate = new Date(treatment.medication.expirationDate);
        }
      });

      vaccinations.forEach((vaccination: any) => {
        vaccination.administeredDate = new Date(vaccination.administeredDate);
        vaccination.expirationDate = new Date(vaccination.expirationDate);
        if (vaccination.nextDueDate) vaccination.nextDueDate = new Date(vaccination.nextDueDate);
      });

      alerts.forEach((alert: any) => {
        alert.createdAt = new Date(alert.createdAt);
        if (alert.dueDate) alert.dueDate = new Date(alert.dueDate);
      });

      unknownConditionReviews.forEach((review: any) => {
        review.submittedAt = new Date(review.submittedAt);
        if (review.assignedDate) review.assignedDate = new Date(review.assignedDate);
        if (review.reviewedAt) review.reviewedAt = new Date(review.reviewedAt);
        if (review.completedAt) review.completedAt = new Date(review.completedAt);
      });

      set({ 
        healthRecords, 
        treatments, 
        vaccinations, 
        alerts, 
        unknownConditionReviews,
        diseaseReferences: get().diseaseReferences.length === 0 ? generateSampleDiseaseReferences() : get().diseaseReferences
      });
    } catch (error) {
      set({ error: 'Failed to load health records' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Add Health Record
  addHealthRecord: async (recordData) => {
    const { healthRecords } = get();
    const newRecord: HealthRecord = {
      ...recordData,
      id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedRecords = [...healthRecords, newRecord];
    set({ healthRecords: updatedRecords });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(updatedRecords));
      
      // Create follow-up alert if needed
      if (newRecord.followUpRequired && newRecord.followUpDate) {
        get().createAlert({
          animalId: newRecord.animalId,
          alertType: 'follow_up_required',
          severity: 'medium',
          title: 'Follow-up Required',
          description: `Follow-up needed for health observation from ${newRecord.recordedDate.toLocaleDateString()}`,
          dueDate: newRecord.followUpDate,
          actionRequired: 'Conduct follow-up health check',
          dismissed: false,
          userId: newRecord.userId
        });
      }
    } catch (error) {
      set({ error: 'Failed to save health record', healthRecords });
    }
  },

  // Update Health Record
  updateHealthRecord: async (id, updates) => {
    const { healthRecords } = get();
    const updatedRecords = healthRecords.map(record =>
      record.id === id ? { ...record, ...updates, updatedAt: new Date() } : record
    );

    set({ healthRecords: updatedRecords });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(updatedRecords));
    } catch (error) {
      set({ error: 'Failed to update health record', healthRecords });
    }
  },

  // Delete Health Record
  deleteHealthRecord: async (id) => {
    const { healthRecords } = get();
    const updatedRecords = healthRecords.filter(record => record.id !== id);

    set({ healthRecords: updatedRecords });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(updatedRecords));
    } catch (error) {
      set({ error: 'Failed to delete health record', healthRecords });
    }
  },

  // Get Health Records by Animal
  getHealthRecordsByAnimal: (animalId) => {
    return get().healthRecords
      .filter(record => record.animalId === animalId)
      .sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime());
  },

  // Add Treatment
  addTreatment: async (treatmentData) => {
    const { treatments } = get();
    const newTreatment: Treatment = {
      ...treatmentData,
      id: `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTreatments = [...treatments, newTreatment];
    set({ treatments: updatedTreatments });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TREATMENTS, JSON.stringify(updatedTreatments));
      
      // Create alert for next dose if needed
      if (newTreatment.nextDoseDate) {
        get().createAlert({
          animalId: newTreatment.animalId,
          alertType: 'treatment_due',
          severity: 'high',
          title: 'Treatment Due',
          description: `Next dose of ${newTreatment.name} is due`,
          dueDate: newTreatment.nextDoseDate,
          actionRequired: 'Administer treatment',
          dismissed: false,
          userId: newTreatment.userId
        });
      }
    } catch (error) {
      set({ error: 'Failed to save treatment', treatments });
    }
  },

  // Update Treatment
  updateTreatment: async (id, updates) => {
    const { treatments } = get();
    const updatedTreatments = treatments.map(treatment =>
      treatment.id === id ? { ...treatment, ...updates, updatedAt: new Date() } : treatment
    );

    set({ treatments: updatedTreatments });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TREATMENTS, JSON.stringify(updatedTreatments));
    } catch (error) {
      set({ error: 'Failed to update treatment', treatments });
    }
  },

  // Get Treatments by Animal
  getTreatmentsByAnimal: (animalId) => {
    return get().treatments
      .filter(treatment => treatment.animalId === animalId)
      .sort((a, b) => b.administeredDate.getTime() - a.administeredDate.getTime());
  },

  // Get Active Treatments
  getActiveTreatments: (animalId) => {
    return get().treatments.filter(treatment => 
      treatment.animalId === animalId && !treatment.treatmentComplete
    );
  },

  // Add Vaccination
  addVaccination: async (vaccinationData) => {
    const { vaccinations } = get();
    const newVaccination: VaccinationRecord = {
      ...vaccinationData,
      id: `vaccination_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedVaccinations = [...vaccinations, newVaccination];
    set({ vaccinations: updatedVaccinations });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(updatedVaccinations));
      
      // Create alert for next vaccination if due date exists
      if (newVaccination.nextDueDate) {
        const alertDate = new Date(newVaccination.nextDueDate);
        alertDate.setDate(alertDate.getDate() - 7); // Alert 1 week before
        
        get().createAlert({
          animalId: newVaccination.animalId,
          alertType: 'vaccination_due',
          severity: 'medium',
          title: 'Vaccination Due Soon',
          description: `${newVaccination.vaccineName} vaccination due on ${newVaccination.nextDueDate.toLocaleDateString()}`,
          dueDate: alertDate,
          actionRequired: 'Schedule vaccination',
          dismissed: false,
          userId: newVaccination.userId
        });
      }
    } catch (error) {
      set({ error: 'Failed to save vaccination', vaccinations });
    }
  },

  // Update Vaccination
  updateVaccination: async (id, updates) => {
    const { vaccinations } = get();
    const updatedVaccinations = vaccinations.map(vaccination =>
      vaccination.id === id ? { ...vaccination, ...updates } : vaccination
    );

    set({ vaccinations: updatedVaccinations });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VACCINATIONS, JSON.stringify(updatedVaccinations));
    } catch (error) {
      set({ error: 'Failed to update vaccination', vaccinations });
    }
  },

  // Get Vaccinations by Animal
  getVaccinationsByAnimal: (animalId) => {
    return get().vaccinations
      .filter(vaccination => vaccination.animalId === animalId)
      .sort((a, b) => b.administeredDate.getTime() - a.administeredDate.getTime());
  },

  // Get Upcoming Vaccinations
  getUpcomingVaccinations: (animalId) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return get().vaccinations.filter(vaccination => 
      vaccination.animalId === animalId && 
      vaccination.nextDueDate &&
      vaccination.nextDueDate >= now &&
      vaccination.nextDueDate <= thirtyDaysFromNow
    );
  },

  // Get Health Summary
  getHealthSummary: (animalId): HealthSummary => {
    const records = get().getHealthRecordsByAnimal(animalId);
    const treatments = get().getTreatmentsByAnimal(animalId);
    const vaccinations = get().getVaccinationsByAnimal(animalId);
    const alerts = get().getAlertsByAnimal(animalId);

    // Calculate health score based on recent records
    const recentRecords = records.slice(0, 5);
    const avgScore = recentRecords.length > 0 
      ? recentRecords.reduce((sum, record) => {
          const scores = [
            record.bodyConditionScore || 3,
            record.mobilityScore || 3,
            record.appetiteScore || 3,
            record.alertnessScore || 3
          ];
          return sum + scores.reduce((s, score) => s + score, 0) / scores.length;
        }, 0) / recentRecords.length
      : 3;

    // Analyze symptoms frequency
    const symptomCount: Record<string, number> = {};
    records.forEach(record => {
      record.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    });

    const commonSymptoms = Object.entries(symptomCount)
      .map(([symptom, frequency]) => ({ symptom, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Determine health trend
    let healthTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentRecords.length >= 3) {
      const recent = recentRecords.slice(0, 2);
      const older = recentRecords.slice(2, 4);
      
      const recentAvg = recent.reduce((sum, r) => sum + (r.bodyConditionScore || 3), 0) / recent.length;
      const olderAvg = older.reduce((sum, r) => sum + (r.bodyConditionScore || 3), 0) / older.length;
      
      if (recentAvg > olderAvg + 0.5) healthTrend = 'improving';
      else if (recentAvg < olderAvg - 0.5) healthTrend = 'declining';
    }

    return {
      animalId,
      totalRecords: records.length,
      lastHealthCheck: records[0]?.recordedDate || new Date(),
      currentHealthScore: Math.round(avgScore * 10) / 10,
      recentIssues: records.slice(0, 3)
        .filter(r => r.observationType === 'illness' || r.symptoms.length > 0)
        .map(r => r.notes || 'Health concern noted'),
      activeAlerts: alerts.filter(alert => !alert.dismissed),
      upcomingTreatments: treatments.filter(t => !t.treatmentComplete && t.nextDoseDate),
      healthTrend,
      weightCorrelation: 0, // Would need weight data integration
      commonSymptoms,
      vaccinationStatus: vaccinations,
      totalHealthCosts: treatments.reduce((sum, t) => sum + (t.cost || 0), 0),
      costByCategory: {}
    };
  },

  // Get Health Trends
  getHealthTrends: (animalId, days) => {
    const records = get().getHealthRecordsByAnimal(animalId);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return records
      .filter(record => record.recordedDate >= cutoffDate)
      .map(record => ({
        date: record.recordedDate,
        healthScore: [
          record.bodyConditionScore || 3,
          record.mobilityScore || 3,
          record.appetiteScore || 3,
          record.alertnessScore || 3
        ].reduce((sum, score) => sum + score, 0) / 4,
        symptoms: record.symptoms.length,
        observationType: record.observationType
      }));
  },

  // Get Alerts by Animal
  getAlertsByAnimal: (animalId) => {
    return get().alerts
      .filter(alert => alert.animalId === animalId)
      .sort((a, b) => {
        if (a.severity !== b.severity) {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  },

  // Dismiss Alert
  dismissAlert: async (alertId) => {
    const { alerts } = get();
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    );

    set({ alerts: updatedAlerts });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updatedAlerts));
    } catch (error) {
      set({ error: 'Failed to dismiss alert', alerts });
    }
  },

  // Create Alert
  createAlert: async (alertData) => {
    const { alerts } = get();
    const newAlert: HealthAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    const updatedAlerts = [...alerts, newAlert];
    set({ alerts: updatedAlerts });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updatedAlerts));
    } catch (error) {
      set({ error: 'Failed to create alert', alerts });
    }
  },

  // Submit Unknown Condition
  submitUnknownCondition: async (reviewData) => {
    const { unknownConditionReviews } = get();
    const newReview: UnknownConditionReview = {
      ...reviewData,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date(),
      status: 'submitted',
      urgencyScore: reviewData.priorityLevel === 'emergency' ? 10 : 
                   reviewData.priorityLevel === 'urgent' ? 7 :
                   reviewData.priorityLevel === 'concern' ? 4 : 1,
      skillsLearned: [],
      recommendedActions: []
    };

    const updatedReviews = [...unknownConditionReviews, newReview];
    set({ unknownConditionReviews: updatedReviews });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.UNKNOWN_REVIEWS, JSON.stringify(updatedReviews));
    } catch (error) {
      set({ error: 'Failed to submit unknown condition review', unknownConditionReviews });
    }
  },

  // Get Unknown Condition Reviews
  getUnknownConditionReviews: (studentId) => {
    return get().unknownConditionReviews
      .filter(review => review.studentId === studentId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  },

  // Search Diseases
  searchDiseases: (query, species) => {
    const { diseaseReferences } = get();
    const queryLower = query.toLowerCase();
    
    return diseaseReferences.filter(disease => {
      const matchesQuery = disease.name.toLowerCase().includes(queryLower) ||
                          disease.commonNames.some(name => name.toLowerCase().includes(queryLower)) ||
                          disease.primarySymptoms.some(symptom => symptom.toLowerCase().includes(queryLower));
      
      const matchesSpecies = !species || disease.species.includes(species);
      
      return matchesQuery && matchesSpecies;
    });
  },

  // Get Diseases by Symptoms
  getDiseasesBySymptoms: (symptoms, species) => {
    const { diseaseReferences } = get();
    
    return diseaseReferences
      .filter(disease => {
        const matchesSpecies = disease.species.includes(species);
        const symptomMatches = symptoms.filter(symptom => 
          disease.primarySymptoms.includes(symptom) || disease.secondarySymptoms.includes(symptom)
        ).length;
        
        return matchesSpecies && symptomMatches > 0;
      })
      .sort((a, b) => {
        const aMatches = symptoms.filter(symptom => 
          a.primarySymptoms.includes(symptom) || a.secondarySymptoms.includes(symptom)
        ).length;
        const bMatches = symptoms.filter(symptom => 
          b.primarySymptoms.includes(symptom) || b.secondarySymptoms.includes(symptom)
        ).length;
        
        return bMatches - aMatches;
      });
  },

  // Add Health Photo
  addHealthPhoto: async (photoData) => {
    // This would typically upload the photo and get back a URL
    // For now, we'll just store the local URI
    const photo: HealthPhoto = {
      ...photoData,
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      capturedAt: new Date()
    };

    // Add to the health record's photos array
    const { healthRecords } = get();
    const updatedRecords = healthRecords.map(record => {
      if (record.id === photo.healthRecordId) {
        return {
          ...record,
          photos: [...record.photos, photo]
        };
      }
      return record;
    });

    set({ healthRecords: updatedRecords });

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(updatedRecords));
    } catch (error) {
      set({ error: 'Failed to save photo' });
    }
  },

  // Analyze Photo (Mock AI Analysis)
  analyzePhoto: async (photoUri, photoType) => {
    // Mock AI analysis - in real app this would call an AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockAnalysis = {
          detected_conditions: [],
          confidence_scores: {},
          recommendations: ['Photo quality is good for analysis'],
          requires_expert_review: false
        };

        // Add mock detections based on photo type
        if (photoType === 'eye') {
          mockAnalysis.detected_conditions = ['normal_eye'];
          mockAnalysis.confidence_scores = { 'normal_eye': 0.85 };
        } else if (photoType === 'manure') {
          mockAnalysis.detected_conditions = ['normal_consistency'];
          mockAnalysis.confidence_scores = { 'normal_consistency': 0.78 };
        }

        resolve(mockAnalysis);
      }, 1500);
    });
  },
}));

// Generate sample disease references for demonstration
function generateSampleDiseaseReferences(): DiseaseReference[] {
  return [
    {
      id: 'bvd_cattle',
      name: 'Bovine Viral Diarrhea (BVD)',
      commonNames: ['BVD', 'Mucosal Disease'],
      category: 'digestive',
      species: ['cattle'],
      severity: 4,
      contagious: true,
      zoonotic: false,
      primarySymptoms: ['scours', 'fever', 'lethargy', 'appetite_loss'],
      secondarySymptoms: ['respiratory', 'eye_issues', 'weight_loss'],
      causes: ['Viral infection', 'Stress', 'Poor sanitation'],
      riskFactors: ['Young animals', 'Overcrowding', 'Poor ventilation'],
      ageGroupsAffected: ['Calves', 'Young adults'],
      seasonalPattern: 'year_round',
      treatmentOptions: ['Supportive care', 'Fluid therapy', 'Antibiotics for secondary infections'],
      preventionMethods: ['Vaccination', 'Biosecurity', 'Quarantine new animals'],
      whenToCallVet: ['Persistent diarrhea', 'High fever', 'Multiple animals affected'],
      educationalNotes: 'BVD is a serious viral disease that can cause reproductive problems and immune suppression.',
      learningObjectives: ['Identify clinical signs', 'Understand prevention strategies', 'Practice biosecurity'],
      aetStandards: ['AS.02.01', 'AS.02.02'],
      photos: [],
      videos: [],
      prevalenceByRegion: { 'midwest': 0.15, 'southwest': 0.12 },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'pneumonia_cattle',
      name: 'Shipping Fever (Pneumonia)',
      commonNames: ['Shipping Fever', 'Pneumonia', 'Respiratory Disease'],
      category: 'respiratory',
      species: ['cattle'],
      severity: 3,
      contagious: true,
      zoonotic: false,
      primarySymptoms: ['respiratory', 'fever', 'coughing', 'lethargy'],
      secondarySymptoms: ['nasal_discharge', 'appetite_loss', 'eye_issues'],
      causes: ['Bacterial infection', 'Stress', 'Weather changes', 'Transportation'],
      riskFactors: ['Recent transport', 'Weather stress', 'Poor ventilation', 'Overcrowding'],
      ageGroupsAffected: ['Calves', 'Young adults'],
      seasonalPattern: 'fall',
      treatmentOptions: ['Antibiotics', 'Anti-inflammatory drugs', 'Supportive care'],
      preventionMethods: ['Reduce stress', 'Proper ventilation', 'Vaccination', 'Gradual feed changes'],
      whenToCallVet: ['High fever', 'Labored breathing', 'Not responding to treatment'],
      educationalNotes: 'Most common disease in newly received cattle. Early detection and treatment are crucial.',
      learningObjectives: ['Recognize respiratory distress', 'Understand stress factors', 'Learn treatment protocols'],
      aetStandards: ['AS.02.01', 'AS.02.02'],
      photos: [],
      videos: [],
      prevalenceByRegion: { 'midwest': 0.25, 'southwest': 0.30 },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'coccidiosis_cattle',
      name: 'Coccidiosis',
      commonNames: ['Cocci', 'Bloody Scours'],
      category: 'digestive',
      species: ['cattle', 'sheep', 'goat'],
      severity: 3,
      contagious: true,
      zoonotic: false,
      primarySymptoms: ['scours', 'bloody_manure', 'weight_loss', 'lethargy'],
      secondarySymptoms: ['appetite_loss', 'dehydration'],
      causes: ['Parasitic infection', 'Wet conditions', 'Overcrowding'],
      riskFactors: ['Young animals', 'Wet/muddy conditions', 'Stress', 'Poor sanitation'],
      ageGroupsAffected: ['Calves', 'Lambs', 'Kids'],
      seasonalPattern: 'spring',
      treatmentOptions: ['Coccidiostats', 'Fluid therapy', 'Supportive care'],
      preventionMethods: ['Clean water', 'Dry bedding', 'Proper stocking density', 'Coccidiostat feed'],
      whenToCallVet: ['Bloody diarrhea', 'Dehydration signs', 'Multiple animals affected'],
      educationalNotes: 'Most severe in young animals. Prevention through management is key.',
      learningObjectives: ['Identify parasitic diseases', 'Understand life cycles', 'Practice prevention'],
      aetStandards: ['AS.02.01', 'AS.03.01'],
      photos: [],
      videos: [],
      prevalenceByRegion: { 'midwest': 0.20, 'southwest': 0.18 },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}