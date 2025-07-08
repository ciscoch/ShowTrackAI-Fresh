/**
 * Local Health Adapter for ShowTrackAI
 * Placeholder implementation for health management
 */

import { IHealthService } from '../interfaces/ServiceInterfaces';

export class LocalHealthAdapter implements IHealthService {
  async getHealthRecords(animalId: string): Promise<any[]> {
    return [];
  }

  async addHealthRecord(animalId: string, record: any): Promise<any> {
    return record;
  }

  async updateHealthRecord(recordId: string, updates: any): Promise<any> {
    return updates;
  }

  async deleteHealthRecord(recordId: string): Promise<void> {
    // Placeholder
  }

  async getVaccinations(animalId: string): Promise<any[]> {
    return [];
  }

  async addVaccination(animalId: string, vaccination: any): Promise<any> {
    return vaccination;
  }

  async getMedications(animalId: string): Promise<any[]> {
    return [];
  }

  async addMedication(animalId: string, medication: any): Promise<any> {
    return medication;
  }
}