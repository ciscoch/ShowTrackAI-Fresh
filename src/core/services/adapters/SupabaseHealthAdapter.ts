/**
 * Supabase Health Adapter for ShowTrackAI
 * Complete implementation for health records management with Supabase
 */

import { getSupabaseClient, getCurrentUser } from '../../../../backend/api/clients/supabase';
import { IHealthService } from '../interfaces/ServiceInterfaces';
import { HealthRecord, VaccinationRecord, Treatment } from '../../models/HealthRecord';

interface DatabaseHealthRecord {
  id: string;
  animal_id: string;
  recorded_by: string;
  health_event_type: string;
  description: string;
  severity?: string;
  treatment?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  veterinarian_id?: string;
  cost?: number;
  notes?: string;
  metadata?: any;
  occurred_at: string;
  created_at: string;
}

interface DatabaseVaccination {
  id: string;
  animal_id: string;
  vaccine_name: string;
  manufacturer?: string;
  lot_number?: string;
  dosage?: string;
  administration_route?: string;
  veterinarian_id?: string;
  next_due_date?: string;
  cost?: number;
  notes?: string;
  administered_at: string;
  created_at: string;
}

interface DatabaseMedication {
  id: string;
  animal_id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  prescribed_by?: string;
  reason?: string;
  cost?: number;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}

export class SupabaseHealthAdapter implements IHealthService {
  
  // =========================================================================
  // HEALTH RECORDS
  // =========================================================================

  async getHealthRecords(animalId: string): Promise<HealthRecord[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('animal_health_records')
        .select(`
          *,
          recorded_by_profile:profiles!animal_health_records_recorded_by_fkey(full_name),
          veterinarian_profile:profiles!animal_health_records_veterinarian_id_fkey(full_name)
        `)
        .eq('animal_id', animalId)
        .order('occurred_at', { ascending: false });

      if (error) {
        console.error('Error fetching health records:', error);
        throw new Error(`Failed to fetch health records: ${error.message}`);
      }

      return data.map(this.mapDatabaseToHealthRecord);
    } catch (error) {
      console.error('SupabaseHealthAdapter.getHealthRecords error:', error);
      throw error;
    }
  }

  async addHealthRecord(animalId: string, record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthRecord> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to add health records');
      }

      const dbRecord: Omit<DatabaseHealthRecord, 'id' | 'created_at'> = {
        animal_id: animalId,
        recorded_by: user.id,
        health_event_type: record.observationType,
        description: record.notes,
        severity: this.mapSeverityToDatabase(record.severity),
        treatment: record.treatment || null,
        follow_up_required: record.followUpRequired || false,
        follow_up_date: record.followUpDate?.toISOString().split('T')[0] || null,
        veterinarian_id: record.veterinarianId || null,
        cost: record.cost || null,
        notes: record.notes || null,
        metadata: {
          symptoms: record.symptoms || [],
          vitalSigns: {
            temperature: record.temperature,
            heartRate: record.heartRate,
            respiratoryRate: record.respiratoryRate
          },
          physicalCondition: {
            bodyConditionScore: record.bodyConditionScore,
            mobilityScore: record.mobilityScore,
            appetiteScore: record.appetiteScore,
            alertnessScore: record.alertnessScore
          },
          observations: {
            eyeCondition: record.eyeCondition,
            nasalDischarge: record.nasalDischarge,
            manureConsistency: record.manureConsistency,
            gaitMobility: record.gaitMobility,
            appetite: record.appetite
          },
          unknownCondition: {
            isUnknownCondition: record.isUnknownCondition,
            priority: record.unknownConditionPriority,
            expertReviewRequested: record.expertReviewRequested,
            expertReviewStatus: record.expertReviewStatus
          }
        },
        occurred_at: record.recordedDate.toISOString()
      };

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('animal_health_records')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        console.error('Error adding health record:', error);
        throw new Error(`Failed to add health record: ${error.message}`);
      }

      return this.mapDatabaseToHealthRecord(data);
    } catch (error) {
      console.error('SupabaseHealthAdapter.addHealthRecord error:', error);
      throw error;
    }
  }

  async updateHealthRecord(recordId: string, updates: Partial<HealthRecord>): Promise<HealthRecord> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to update health records');
      }

      const dbUpdates: Partial<DatabaseHealthRecord> = {};

      if (updates.notes !== undefined) dbUpdates.description = updates.notes;
      if (updates.observationType !== undefined) dbUpdates.health_event_type = updates.observationType;
      if (updates.severity !== undefined) dbUpdates.severity = this.mapSeverityToDatabase(updates.severity);
      if (updates.treatment !== undefined) dbUpdates.treatment = updates.treatment;
      if (updates.followUpRequired !== undefined) dbUpdates.follow_up_required = updates.followUpRequired;
      if (updates.followUpDate !== undefined) dbUpdates.follow_up_date = updates.followUpDate?.toISOString().split('T')[0];
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;

      // Update metadata with new values
      if (updates.symptoms || updates.temperature || updates.bodyConditionScore) {
        const supabase = getSupabaseClient();
        const { data: currentRecord } = await supabase
          .from('animal_health_records')
          .select('metadata')
          .eq('id', recordId)
          .single();

        const currentMetadata = currentRecord?.metadata || {};
        
        dbUpdates.metadata = {
          ...currentMetadata,
          symptoms: updates.symptoms || currentMetadata.symptoms,
          vitalSigns: {
            ...currentMetadata.vitalSigns,
            temperature: updates.temperature !== undefined ? updates.temperature : currentMetadata.vitalSigns?.temperature,
            heartRate: updates.heartRate !== undefined ? updates.heartRate : currentMetadata.vitalSigns?.heartRate,
            respiratoryRate: updates.respiratoryRate !== undefined ? updates.respiratoryRate : currentMetadata.vitalSigns?.respiratoryRate
          },
          physicalCondition: {
            ...currentMetadata.physicalCondition,
            bodyConditionScore: updates.bodyConditionScore !== undefined ? updates.bodyConditionScore : currentMetadata.physicalCondition?.bodyConditionScore,
            mobilityScore: updates.mobilityScore !== undefined ? updates.mobilityScore : currentMetadata.physicalCondition?.mobilityScore,
            appetiteScore: updates.appetiteScore !== undefined ? updates.appetiteScore : currentMetadata.physicalCondition?.appetiteScore,
            alertnessScore: updates.alertnessScore !== undefined ? updates.alertnessScore : currentMetadata.physicalCondition?.alertnessScore
          }
        };
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('animal_health_records')
        .update(dbUpdates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Error updating health record:', error);
        throw new Error(`Failed to update health record: ${error.message}`);
      }

      return this.mapDatabaseToHealthRecord(data);
    } catch (error) {
      console.error('SupabaseHealthAdapter.updateHealthRecord error:', error);
      throw error;
    }
  }

  async deleteHealthRecord(recordId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to delete health records');
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('animal_health_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting health record:', error);
        throw new Error(`Failed to delete health record: ${error.message}`);
      }
    } catch (error) {
      console.error('SupabaseHealthAdapter.deleteHealthRecord error:', error);
      throw error;
    }
  }

  // =========================================================================
  // VACCINATIONS
  // =========================================================================

  async getVaccinations(animalId: string): Promise<VaccinationRecord[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('animal_vaccinations')
        .select(`
          *,
          veterinarian_profile:profiles!animal_vaccinations_veterinarian_id_fkey(full_name)
        `)
        .eq('animal_id', animalId)
        .order('administered_at', { ascending: false });

      if (error) {
        console.error('Error fetching vaccinations:', error);
        throw new Error(`Failed to fetch vaccinations: ${error.message}`);
      }

      return data.map(this.mapDatabaseToVaccination);
    } catch (error) {
      console.error('SupabaseHealthAdapter.getVaccinations error:', error);
      throw error;
    }
  }

  async addVaccination(animalId: string, vaccination: Omit<VaccinationRecord, 'id'>): Promise<VaccinationRecord> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to add vaccinations');
      }

      const dbVaccination: Omit<DatabaseVaccination, 'id' | 'created_at'> = {
        animal_id: animalId,
        vaccine_name: vaccination.vaccineName,
        manufacturer: vaccination.manufacturer || null,
        lot_number: vaccination.lotNumber || null,
        dosage: vaccination.dosage || null,
        administration_route: vaccination.administrationRoute || null,
        veterinarian_id: vaccination.veterinarianId || null,
        next_due_date: vaccination.nextDueDate?.toISOString().split('T')[0] || null,
        cost: vaccination.cost || null,
        notes: vaccination.notes || null,
        administered_at: vaccination.administeredDate.toISOString()
      };

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('animal_vaccinations')
        .insert(dbVaccination)
        .select()
        .single();

      if (error) {
        console.error('Error adding vaccination:', error);
        throw new Error(`Failed to add vaccination: ${error.message}`);
      }

      return this.mapDatabaseToVaccination(data);
    } catch (error) {
      console.error('SupabaseHealthAdapter.addVaccination error:', error);
      throw error;
    }
  }

  // =========================================================================
  // MEDICATIONS
  // =========================================================================

  async getMedications(animalId: string): Promise<Treatment[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('animal_medications')
        .select(`
          *,
          prescribed_by_profile:profiles!animal_medications_prescribed_by_fkey(full_name)
        `)
        .eq('animal_id', animalId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching medications:', error);
        throw new Error(`Failed to fetch medications: ${error.message}`);
      }

      return data.map(this.mapDatabaseToTreatment);
    } catch (error) {
      console.error('SupabaseHealthAdapter.getMedications error:', error);
      throw error;
    }
  }

  async addMedication(animalId: string, medication: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Treatment> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to add medications');
      }

      const dbMedication: Omit<DatabaseMedication, 'id' | 'created_at'> = {
        animal_id: animalId,
        medication_name: medication.medicationName,
        dosage: medication.dosage || null,
        frequency: medication.frequency || null,
        duration: medication.duration || null,
        prescribed_by: medication.prescribedBy || user.id,
        reason: medication.reason || null,
        cost: medication.cost || null,
        start_date: medication.startDate.toISOString().split('T')[0],
        end_date: medication.endDate?.toISOString().split('T')[0] || null,
        notes: medication.notes || null
      };

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('animal_medications')
        .insert(dbMedication)
        .select()
        .single();

      if (error) {
        console.error('Error adding medication:', error);
        throw new Error(`Failed to add medication: ${error.message}`);
      }

      return this.mapDatabaseToTreatment(data);
    } catch (error) {
      console.error('SupabaseHealthAdapter.addMedication error:', error);
      throw error;
    }
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private async getCurrentUser() {
    return await getCurrentUser();
  }

  private mapDatabaseToHealthRecord(dbRecord: any): HealthRecord {
    const metadata = dbRecord.metadata || {};
    const vitalSigns = metadata.vitalSigns || {};
    const physicalCondition = metadata.physicalCondition || {};
    const observations = metadata.observations || {};
    const unknownCondition = metadata.unknownCondition || {};

    return {
      id: dbRecord.id,
      animalId: dbRecord.animal_id,
      recordedBy: dbRecord.recorded_by,
      recordedDate: new Date(dbRecord.occurred_at),
      observationType: dbRecord.health_event_type as any,
      
      // Vital Signs
      temperature: vitalSigns.temperature,
      heartRate: vitalSigns.heartRate,
      respiratoryRate: vitalSigns.respiratoryRate,
      
      // Physical Condition Scores
      bodyConditionScore: physicalCondition.bodyConditionScore,
      mobilityScore: physicalCondition.mobilityScore,
      appetiteScore: physicalCondition.appetiteScore,
      alertnessScore: physicalCondition.alertnessScore,
      
      // Observations
      eyeCondition: observations.eyeCondition || 'normal',
      nasalDischarge: observations.nasalDischarge || 'none',
      manureConsistency: observations.manureConsistency || 'normal',
      gaitMobility: observations.gaitMobility || 'normal',
      appetite: observations.appetite || 'normal',
      
      // Symptoms and notes
      symptoms: metadata.symptoms || [],
      customSymptoms: [],
      notes: dbRecord.description || '',
      
      // Photos (will be handled separately)
      photos: [],
      
      // Unknown condition tracking
      isUnknownCondition: unknownCondition.isUnknownCondition || false,
      unknownConditionPriority: unknownCondition.priority,
      expertReviewRequested: unknownCondition.expertReviewRequested || false,
      expertReviewStatus: unknownCondition.expertReviewStatus,
      
      // Treatment related
      treatment: dbRecord.treatment,
      followUpRequired: dbRecord.follow_up_required || false,
      followUpDate: dbRecord.follow_up_date ? new Date(dbRecord.follow_up_date) : undefined,
      
      // Cost and metadata
      cost: dbRecord.cost,
      veterinarianId: dbRecord.veterinarian_id,
      severity: this.mapDatabaseToSeverity(dbRecord.severity),
      
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.created_at)
    };
  }

  private mapDatabaseToVaccination(dbVaccination: any): VaccinationRecord {
    return {
      id: dbVaccination.id,
      animalId: dbVaccination.animal_id,
      vaccineName: dbVaccination.vaccine_name,
      manufacturer: dbVaccination.manufacturer,
      lotNumber: dbVaccination.lot_number,
      dosage: dbVaccination.dosage,
      administrationRoute: dbVaccination.administration_route,
      administeredDate: new Date(dbVaccination.administered_at),
      veterinarianId: dbVaccination.veterinarian_id,
      nextDueDate: dbVaccination.next_due_date ? new Date(dbVaccination.next_due_date) : undefined,
      cost: dbVaccination.cost,
      notes: dbVaccination.notes,
      veterinarianName: dbVaccination.veterinarian_profile?.full_name
    };
  }

  private mapDatabaseToTreatment(dbMedication: any): Treatment {
    return {
      id: dbMedication.id,
      animalId: dbMedication.animal_id,
      medicationName: dbMedication.medication_name,
      dosage: dbMedication.dosage,
      frequency: dbMedication.frequency,
      duration: dbMedication.duration,
      startDate: new Date(dbMedication.start_date),
      endDate: dbMedication.end_date ? new Date(dbMedication.end_date) : undefined,
      prescribedBy: dbMedication.prescribed_by,
      reason: dbMedication.reason,
      cost: dbMedication.cost,
      notes: dbMedication.notes,
      status: this.calculateTreatmentStatus(dbMedication.start_date, dbMedication.end_date),
      prescribedByName: dbMedication.prescribed_by_profile?.full_name,
      createdAt: new Date(dbMedication.created_at),
      updatedAt: new Date(dbMedication.created_at)
    };
  }

  private mapSeverityToDatabase(severity?: string): string | null {
    if (!severity) return null;
    
    const severityMap: Record<string, string> = {
      'low': 'low',
      'medium': 'medium', 
      'high': 'high',
      'critical': 'critical'
    };
    
    return severityMap[severity] || 'medium';
  }

  private mapDatabaseToSeverity(dbSeverity?: string): string | undefined {
    if (!dbSeverity) return undefined;
    
    const severityMap: Record<string, string> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high', 
      'critical': 'critical'
    };
    
    return severityMap[dbSeverity];
  }

  private calculateTreatmentStatus(startDate: string, endDate?: string): string {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (now < start) return 'scheduled';
    if (end && now > end) return 'completed';
    return 'active';
  }
}