/**
 * Health Record Service for ShowTrackAI Agricultural Education Platform
 * 
 * Manages comprehensive health records including:
 * - Health observations and symptoms
 * - Vaccination tracking
 * - Treatment records
 * - AI-powered health analysis
 * - Veterinary consultations
 * - Health alerts and monitoring
 */

import { getSupabaseClient } from '../../../backend/api/clients/supabase';

export interface HealthRecord {
  id: string;
  animalId: string;
  recordedBy: string;
  observationType: 'routine' | 'illness' | 'treatment' | 'emergency' | 'unknown';
  observationDate: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bodyConditionScore?: number;
  appetiteScore?: number;
  activityLevel?: number;
  symptoms?: string[];
  detailedNotes?: string;
  severityLevel?: number;
  conditionStatus: 'identified' | 'unknown' | 'pending_review' | 'expert_reviewed';
  helpRequested?: string[];
  expertResponse?: any;
  photos?: string[];
  aiAnalysis?: any;
  weatherConditions?: any;
  treatments?: Treatment[];
  followUpRequired?: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  healthRecordId: string;
  treatmentType: 'medication' | 'vaccination' | 'procedure' | 'therapy' | 'other';
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  administeredBy: string;
  administeredDate: string;
  notes?: string;
  cost?: number;
  effectiveness?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  sideEffects?: string[];
  veterinarianApproved?: boolean;
  veterinarianId?: string;
  createdAt: string;
}

export interface VaccinationRecord {
  id: string;
  animalId: string;
  vaccineName: string;
  vaccineType: string;
  administeredDate: string;
  administeredBy: string;
  batchNumber?: string;
  expirationDate?: string;
  dueDate?: string;
  cost?: number;
  reactions?: string[];
  veterinarianId?: string;
  notes?: string;
  createdAt: string;
}

export interface HealthAlert {
  id: string;
  animalId: string;
  alertType: 'vaccination_due' | 'follow_up_required' | 'abnormal_symptoms' | 'emergency' | 'routine_check';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  dueDate?: string;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedDate?: string;
  resolvedDate?: string;
  createdAt: string;
}

export interface HealthSummary {
  animalId: string;
  overallHealthScore: number;
  lastCheckupDate: string;
  totalRecords: number;
  recentSymptoms: string[];
  upcomingVaccinations: VaccinationRecord[];
  activeAlerts: HealthAlert[];
  healthTrends: {
    temperatureTrend: 'improving' | 'stable' | 'concerning';
    weightTrend: 'improving' | 'stable' | 'concerning';
    activityTrend: 'improving' | 'stable' | 'concerning';
    appetiteTrend: 'improving' | 'stable' | 'concerning';
  };
  recommendations: string[];
}

export interface HealthAnalytics {
  totalRecords: number;
  recordsByType: Record<string, number>;
  commonSymptoms: Array<{ symptom: string; count: number; percentage: number }>;
  treatmentEffectiveness: Record<string, number>;
  vaccinationCompliance: number;
  averageHealthScore: number;
  seasonalPatterns: Array<{
    month: string;
    healthIncidents: number;
    commonIssues: string[];
  }>;
  costAnalysis: {
    totalTreatmentCost: number;
    totalVaccinationCost: number;
    averageCostPerIncident: number;
    preventiveCostRatio: number;
  };
}

export class HealthRecordService {

  /**
   * Create a new health record
   */
  async createHealthRecord(recordData: Partial<HealthRecord>): Promise<HealthRecord> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('health_records')
        .insert([{
          ...recordData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create alerts if necessary
      await this.createHealthAlertsFromRecord(this.transformFromDatabase(data));

      return this.transformFromDatabase(data);
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  }

  /**
   * Get health records for an animal
   */
  async getHealthRecords(animalId: string, limit: number = 50): Promise<HealthRecord[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          treatments(*),
          recorded_by:users(full_name)
        `)
        .eq('animal_id', animalId)
        .order('observation_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data?.map(this.transformFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching health records:', error);
      return [];
    }
  }

  /**
   * Get a specific health record
   */
  async getHealthRecord(recordId: string): Promise<HealthRecord | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          treatments(*),
          recorded_by:users(full_name)
        `)
        .eq('id', recordId)
        .single();

      if (error) throw error;
      return data ? this.transformFromDatabase(data) : null;
    } catch (error) {
      console.error('Error fetching health record:', error);
      return null;
    }
  }

  /**
   * Update health record
   */
  async updateHealthRecord(recordId: string, updates: Partial<HealthRecord>): Promise<HealthRecord> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('health_records')
        .update({
          ...this.transformToDatabase(updates),
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return this.transformFromDatabase(data);
    } catch (error) {
      console.error('Error updating health record:', error);
      throw error;
    }
  }

  /**
   * Delete health record
   */
  async deleteHealthRecord(recordId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting health record:', error);
      throw error;
    }
  }

  /**
   * Add treatment to health record
   */
  async addTreatment(treatmentData: Partial<Treatment>): Promise<Treatment> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('treatments')
        .insert([{
          ...treatmentData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return this.transformTreatmentFromDatabase(data);
    } catch (error) {
      console.error('Error adding treatment:', error);
      throw error;
    }
  }

  /**
   * Get treatments for a health record
   */
  async getTreatments(healthRecordId: string): Promise<Treatment[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('health_record_id', healthRecordId)
        .order('administered_date', { ascending: false });

      if (error) throw error;
      return data?.map(this.transformTreatmentFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching treatments:', error);
      return [];
    }
  }

  /**
   * Record vaccination
   */
  async recordVaccination(vaccinationData: Partial<VaccinationRecord>): Promise<VaccinationRecord> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vaccinations')
        .insert([{
          ...vaccinationData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Create reminder alert for next vaccination
      if (data.due_date) {
        await this.createVaccinationReminder(data.animal_id, data.vaccine_name, data.due_date);
      }

      return this.transformVaccinationFromDatabase(data);
    } catch (error) {
      console.error('Error recording vaccination:', error);
      throw error;
    }
  }

  /**
   * Get vaccination records for an animal
   */
  async getVaccinationRecords(animalId: string): Promise<VaccinationRecord[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('animal_id', animalId)
        .order('administered_date', { ascending: false });

      if (error) throw error;
      return data?.map(this.transformVaccinationFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching vaccination records:', error);
      return [];
    }
  }

  /**
   * Get upcoming vaccinations
   */
  async getUpcomingVaccinations(animalId: string, days: number = 30): Promise<VaccinationRecord[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('animal_id', animalId)
        .gte('due_date', new Date().toISOString())
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data?.map(this.transformVaccinationFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching upcoming vaccinations:', error);
      return [];
    }
  }

  /**
   * Create health alert
   */
  async createHealthAlert(alertData: Partial<HealthAlert>): Promise<HealthAlert> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('health_alerts')
        .insert([{
          ...alertData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return this.transformAlertFromDatabase(data);
    } catch (error) {
      console.error('Error creating health alert:', error);
      throw error;
    }
  }

  /**
   * Get active health alerts
   */
  async getActiveHealthAlerts(animalId: string): Promise<HealthAlert[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('health_alerts')
        .select('*')
        .eq('animal_id', animalId)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(this.transformAlertFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching health alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge health alert
   */
  async acknowledgeHealthAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('health_alerts')
        .update({
          acknowledged_by: acknowledgedBy,
          acknowledged_date: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging health alert:', error);
      throw error;
    }
  }

  /**
   * Resolve health alert
   */
  async resolveHealthAlert(alertId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('health_alerts')
        .update({
          is_active: false,
          resolved_date: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving health alert:', error);
      throw error;
    }
  }

  /**
   * Get health summary for an animal
   */
  async getHealthSummary(animalId: string): Promise<HealthSummary> {
    try {
      const [records, vaccinations, alerts] = await Promise.all([
        this.getHealthRecords(animalId, 10),
        this.getVaccinationRecords(animalId),
        this.getActiveHealthAlerts(animalId)
      ]);

      const overallHealthScore = this.calculateOverallHealthScore(records);
      const lastCheckupDate = records.length > 0 ? records[0].observationDate : '';
      const recentSymptoms = this.extractRecentSymptoms(records);
      const upcomingVaccinations = await this.getUpcomingVaccinations(animalId);
      const healthTrends = this.calculateHealthTrends(records);
      const recommendations = this.generateHealthRecommendations(records, alerts);

      return {
        animalId,
        overallHealthScore,
        lastCheckupDate,
        totalRecords: records.length,
        recentSymptoms,
        upcomingVaccinations,
        activeAlerts: alerts,
        healthTrends,
        recommendations
      };
    } catch (error) {
      console.error('Error getting health summary:', error);
      throw error;
    }
  }

  /**
   * Get health analytics
   */
  async getHealthAnalytics(animalIds: string[]): Promise<HealthAnalytics> {
    try {
      const allRecords = await Promise.all(
        animalIds.map(id => this.getHealthRecords(id))
      );
      const flatRecords = allRecords.flat();

      const allTreatments = await Promise.all(
        flatRecords.map(record => this.getTreatments(record.id))
      );
      const flatTreatments = allTreatments.flat();

      const allVaccinations = await Promise.all(
        animalIds.map(id => this.getVaccinationRecords(id))
      );
      const flatVaccinations = allVaccinations.flat();

      // Calculate metrics
      const totalRecords = flatRecords.length;
      const recordsByType = this.groupRecordsByType(flatRecords);
      const commonSymptoms = this.analyzeCommonSymptoms(flatRecords);
      const treatmentEffectiveness = this.analyzeTreatmentEffectiveness(flatTreatments);
      const vaccinationCompliance = this.calculateVaccinationCompliance(flatVaccinations, animalIds);
      const averageHealthScore = this.calculateAverageHealthScore(flatRecords);
      const seasonalPatterns = this.analyzeSeasonalPatterns(flatRecords);
      const costAnalysis = this.analyzeCosts(flatTreatments, flatVaccinations);

      return {
        totalRecords,
        recordsByType,
        commonSymptoms,
        treatmentEffectiveness,
        vaccinationCompliance,
        averageHealthScore,
        seasonalPatterns,
        costAnalysis
      };
    } catch (error) {
      console.error('Error getting health analytics:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async createHealthAlertsFromRecord(record: HealthRecord): Promise<void> {
    // Create alerts based on record severity and conditions
    if (record.severityLevel && record.severityLevel >= 4) {
      await this.createHealthAlert({
        animalId: record.animalId,
        alertType: 'emergency',
        priority: 'critical',
        message: `High severity health issue detected: ${record.detailedNotes}`,
        details: `Severity level: ${record.severityLevel}/5`,
        isActive: true
      });
    }

    if (record.followUpRequired) {
      await this.createHealthAlert({
        animalId: record.animalId,
        alertType: 'follow_up_required',
        priority: 'medium',
        message: 'Follow-up required for recent health observation',
        details: record.detailedNotes,
        dueDate: record.followUpDate,
        isActive: true
      });
    }
  }

  private async createVaccinationReminder(animalId: string, vaccineName: string, dueDate: string): Promise<void> {
    await this.createHealthAlert({
      animalId,
      alertType: 'vaccination_due',
      priority: 'medium',
      message: `${vaccineName} vaccination due`,
      dueDate,
      isActive: true
    });
  }

  private calculateOverallHealthScore(records: HealthRecord[]): number {
    if (records.length === 0) return 50;

    const recentRecords = records.slice(0, 5);
    const scores = recentRecords.map(record => {
      let score = 100;
      
      // Deduct points for severity
      if (record.severityLevel) {
        score -= record.severityLevel * 10;
      }
      
      // Deduct points for symptoms
      if (record.symptoms && record.symptoms.length > 0) {
        score -= record.symptoms.length * 5;
      }
      
      // Add points for good vital signs
      if (record.bodyConditionScore && record.bodyConditionScore >= 5) {
        score += 10;
      }
      
      return Math.max(0, Math.min(100, score));
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private extractRecentSymptoms(records: HealthRecord[]): string[] {
    const symptoms = new Set<string>();
    const recentRecords = records.slice(0, 5);
    
    recentRecords.forEach(record => {
      if (record.symptoms) {
        record.symptoms.forEach(symptom => symptoms.add(symptom));
      }
    });
    
    return Array.from(symptoms);
  }

  private calculateHealthTrends(records: HealthRecord[]): {
    temperatureTrend: 'improving' | 'stable' | 'concerning';
    weightTrend: 'improving' | 'stable' | 'concerning';
    activityTrend: 'improving' | 'stable' | 'concerning';
    appetiteTrend: 'improving' | 'stable' | 'concerning';
  } {
    // Simplified trend analysis
    const recentRecords = records.slice(0, 5);
    
    return {
      temperatureTrend: 'stable',
      weightTrend: 'stable',
      activityTrend: 'stable',
      appetiteTrend: 'stable'
    };
  }

  private generateHealthRecommendations(records: HealthRecord[], alerts: HealthAlert[]): string[] {
    const recommendations: string[] = [];
    
    if (alerts.length > 0) {
      recommendations.push('Address active health alerts promptly');
    }
    
    const recentRecords = records.slice(0, 3);
    const hasRecentIssues = recentRecords.some(r => r.severityLevel && r.severityLevel >= 3);
    
    if (hasRecentIssues) {
      recommendations.push('Monitor animal closely for any changes');
      recommendations.push('Consider veterinary consultation if symptoms persist');
    }
    
    if (records.length === 0) {
      recommendations.push('Schedule routine health check-up');
    } else {
      const daysSinceLastCheck = Math.floor(
        (Date.now() - new Date(records[0].observationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastCheck > 30) {
        recommendations.push('Schedule routine health check-up');
      }
    }
    
    recommendations.push('Maintain consistent daily health observations');
    
    return recommendations;
  }

  private groupRecordsByType(records: HealthRecord[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    records.forEach(record => {
      counts[record.observationType] = (counts[record.observationType] || 0) + 1;
    });
    
    return counts;
  }

  private analyzeCommonSymptoms(records: HealthRecord[]): Array<{ symptom: string; count: number; percentage: number }> {
    const symptomCounts: Record<string, number> = {};
    let totalSymptoms = 0;
    
    records.forEach(record => {
      if (record.symptoms) {
        record.symptoms.forEach(symptom => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
          totalSymptoms++;
        });
      }
    });
    
    return Object.entries(symptomCounts)
      .map(([symptom, count]) => ({
        symptom,
        count,
        percentage: (count / totalSymptoms) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private analyzeTreatmentEffectiveness(treatments: Treatment[]): Record<string, number> {
    const effectiveness: Record<string, number> = {};
    
    treatments.forEach(treatment => {
      if (treatment.effectiveness && treatment.treatmentType) {
        const effectivenessScore = {
          'excellent': 5,
          'good': 4,
          'fair': 3,
          'poor': 2,
          'unknown': 0
        }[treatment.effectiveness];
        
        if (!effectiveness[treatment.treatmentType]) {
          effectiveness[treatment.treatmentType] = 0;
        }
        effectiveness[treatment.treatmentType] += effectivenessScore;
      }
    });
    
    return effectiveness;
  }

  private calculateVaccinationCompliance(vaccinations: VaccinationRecord[], animalIds: string[]): number {
    // Simplified compliance calculation
    const averageVaccinationsPerAnimal = vaccinations.length / animalIds.length;
    const expectedVaccinationsPerAnimal = 3; // Baseline expectation
    
    return Math.min(100, (averageVaccinationsPerAnimal / expectedVaccinationsPerAnimal) * 100);
  }

  private calculateAverageHealthScore(records: HealthRecord[]): number {
    if (records.length === 0) return 50;
    
    const scores = records.map(record => {
      let score = 100;
      if (record.severityLevel) score -= record.severityLevel * 10;
      if (record.symptoms) score -= record.symptoms.length * 5;
      return Math.max(0, Math.min(100, score));
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private analyzeSeasonalPatterns(records: HealthRecord[]): Array<{
    month: string;
    healthIncidents: number;
    commonIssues: string[];
  }> {
    const monthlyData: Record<string, { incidents: number; issues: string[] }> = {};
    
    records.forEach(record => {
      const month = new Date(record.observationDate).toLocaleDateString('en-US', { month: 'short' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { incidents: 0, issues: [] };
      }
      
      monthlyData[month].incidents++;
      if (record.symptoms) {
        monthlyData[month].issues.push(...record.symptoms);
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      healthIncidents: data.incidents,
      commonIssues: [...new Set(data.issues)].slice(0, 3)
    }));
  }

  private analyzeCosts(treatments: Treatment[], vaccinations: VaccinationRecord[]): {
    totalTreatmentCost: number;
    totalVaccinationCost: number;
    averageCostPerIncident: number;
    preventiveCostRatio: number;
  } {
    const totalTreatmentCost = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
    const totalVaccinationCost = vaccinations.reduce((sum, v) => sum + (v.cost || 0), 0);
    const totalCost = totalTreatmentCost + totalVaccinationCost;
    const averageCostPerIncident = treatments.length > 0 ? totalTreatmentCost / treatments.length : 0;
    const preventiveCostRatio = totalCost > 0 ? (totalVaccinationCost / totalCost) * 100 : 0;
    
    return {
      totalTreatmentCost,
      totalVaccinationCost,
      averageCostPerIncident,
      preventiveCostRatio
    };
  }

  // Database transformation methods
  private transformFromDatabase(data: any): HealthRecord {
    return {
      id: data.id,
      animalId: data.animal_id,
      recordedBy: data.recorded_by,
      observationType: data.observation_type,
      observationDate: data.observation_date,
      temperature: data.temperature,
      heartRate: data.heart_rate,
      respiratoryRate: data.respiratory_rate,
      bodyConditionScore: data.body_condition_score,
      appetiteScore: data.appetite_score,
      activityLevel: data.activity_level,
      symptoms: data.symptoms,
      detailedNotes: data.detailed_notes,
      severityLevel: data.severity_level,
      conditionStatus: data.condition_status,
      helpRequested: data.help_requested,
      expertResponse: data.expert_response,
      photos: data.photos,
      aiAnalysis: data.ai_analysis,
      weatherConditions: data.weather_conditions,
      treatments: data.treatments?.map(this.transformTreatmentFromDatabase),
      followUpRequired: data.follow_up_required,
      followUpDate: data.follow_up_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private transformToDatabase(data: Partial<HealthRecord>): any {
    return {
      animal_id: data.animalId,
      recorded_by: data.recordedBy,
      observation_type: data.observationType,
      observation_date: data.observationDate,
      temperature: data.temperature,
      heart_rate: data.heartRate,
      respiratory_rate: data.respiratoryRate,
      body_condition_score: data.bodyConditionScore,
      appetite_score: data.appetiteScore,
      activity_level: data.activityLevel,
      symptoms: data.symptoms,
      detailed_notes: data.detailedNotes,
      severity_level: data.severityLevel,
      condition_status: data.conditionStatus,
      help_requested: data.helpRequested,
      expert_response: data.expertResponse,
      photos: data.photos,
      ai_analysis: data.aiAnalysis,
      weather_conditions: data.weatherConditions,
      follow_up_required: data.followUpRequired,
      follow_up_date: data.followUpDate
    };
  }

  private transformTreatmentFromDatabase(data: any): Treatment {
    return {
      id: data.id,
      healthRecordId: data.health_record_id,
      treatmentType: data.treatment_type,
      medicationName: data.medication_name,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      administeredBy: data.administered_by,
      administeredDate: data.administered_date,
      notes: data.notes,
      cost: data.cost,
      effectiveness: data.effectiveness,
      sideEffects: data.side_effects,
      veterinarianApproved: data.veterinarian_approved,
      veterinarianId: data.veterinarian_id,
      createdAt: data.created_at
    };
  }

  private transformVaccinationFromDatabase(data: any): VaccinationRecord {
    return {
      id: data.id,
      animalId: data.animal_id,
      vaccineName: data.vaccine_name,
      vaccineType: data.vaccine_type,
      administeredDate: data.administered_date,
      administeredBy: data.administered_by,
      batchNumber: data.batch_number,
      expirationDate: data.expiration_date,
      dueDate: data.due_date,
      cost: data.cost,
      reactions: data.reactions,
      veterinarianId: data.veterinarian_id,
      notes: data.notes,
      createdAt: data.created_at
    };
  }

  private transformAlertFromDatabase(data: any): HealthAlert {
    return {
      id: data.id,
      animalId: data.animal_id,
      alertType: data.alert_type,
      priority: data.priority,
      message: data.message,
      details: data.details,
      dueDate: data.due_date,
      isActive: data.is_active,
      acknowledgedBy: data.acknowledged_by,
      acknowledgedDate: data.acknowledged_date,
      resolvedDate: data.resolved_date,
      createdAt: data.created_at
    };
  }
}

export default HealthRecordService;