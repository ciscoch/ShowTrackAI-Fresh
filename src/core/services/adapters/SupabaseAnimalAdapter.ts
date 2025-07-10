/**
 * Supabase Animal Adapter for ShowTrackAI
 * Manages animal data using Supabase backend
 */

import { getSupabaseClient, getCurrentUser, uploadFile, getFileUrl, STORAGE_BUCKETS } from '../../../../backend/api/clients/supabase';
import { IAnimalService } from '../interfaces/ServiceInterfaces';
import { Animal } from '../../models/Animal';

export class SupabaseAnimalAdapter implements IAnimalService {
  private supabase = getSupabaseClient();

  // Map database fields to frontend model
  private mapDbToAnimal(dbAnimal: any): Animal {
    return {
      id: dbAnimal.id,
      name: dbAnimal.name,
      earTag: dbAnimal.ear_tag || '',
      penNumber: dbAnimal.pen_number || 'Pen-1',
      species: this.mapSpecies(dbAnimal.species),
      breed: dbAnimal.breed || '',
      breeder: dbAnimal.breeder || '',
      sex: this.mapSex(dbAnimal.sex),
      birthDate: dbAnimal.birth_date ? new Date(dbAnimal.birth_date) : undefined,
      pickupDate: dbAnimal.pickup_date ? new Date(dbAnimal.pickup_date) : undefined,
      projectType: dbAnimal.project_type || 'Market',
      acquisitionCost: dbAnimal.acquisition_cost || 0,
      predictedSaleCost: dbAnimal.predicted_sale_cost,
      weight: dbAnimal.current_weight,
      healthStatus: this.mapHealthStatus(dbAnimal.health_status),
      notes: dbAnimal.notes,
      createdAt: new Date(dbAnimal.created_at),
      updatedAt: new Date(dbAnimal.updated_at),
      owner_id: dbAnimal.owner_id,
    };
  }

  // Map frontend model to database fields
  private mapAnimalToDb(animal: Partial<Animal>): any {
    const dbAnimal: any = {};
    
    if (animal.name !== undefined) dbAnimal.name = animal.name;
    if (animal.earTag !== undefined) dbAnimal.ear_tag = animal.earTag;
    if (animal.penNumber !== undefined) dbAnimal.pen_number = animal.penNumber;
    if (animal.species !== undefined) dbAnimal.species = this.mapSpeciesToDb(animal.species);
    if (animal.breed !== undefined) dbAnimal.breed = animal.breed;
    if (animal.breeder !== undefined) dbAnimal.breeder = animal.breeder;
    if (animal.sex !== undefined) dbAnimal.sex = this.mapSexToDb(animal.sex);
    if (animal.birthDate !== undefined) dbAnimal.birth_date = animal.birthDate;
    if (animal.pickupDate !== undefined) dbAnimal.pickup_date = animal.pickupDate;
    if (animal.projectType !== undefined) dbAnimal.project_type = animal.projectType;
    if (animal.acquisitionCost !== undefined) dbAnimal.acquisition_cost = animal.acquisitionCost;
    if (animal.predictedSaleCost !== undefined) dbAnimal.predicted_sale_cost = animal.predictedSaleCost;
    if (animal.weight !== undefined) dbAnimal.current_weight = animal.weight;
    if (animal.healthStatus !== undefined) dbAnimal.health_status = this.mapHealthStatusToDb(animal.healthStatus);
    if (animal.notes !== undefined) dbAnimal.notes = animal.notes;
    
    return dbAnimal;
  }

  private mapSpecies(dbSpecies: string): Animal['species'] {
    const speciesMap: { [key: string]: Animal['species'] } = {
      'cattle': 'Cattle',
      'sheep': 'Sheep', 
      'swine': 'Pig',
      'goats': 'Goat',
      'poultry': 'Poultry',
      'other': 'Cattle', // Map other to Cattle as default
      // Legacy mappings for safety
      'pig': 'Pig',
      'goat': 'Goat',
    };
    return speciesMap[dbSpecies?.toLowerCase()] || 'Cattle';
  }

  private mapSpeciesToDb(species: Animal['species']): string {
    const speciesMap: { [key: string]: string } = {
      'Cattle': 'cattle',
      'Sheep': 'sheep',
      'Pig': 'swine',
      'Goat': 'goats', // Database expects 'goats' (plural) not 'goat'
      'Poultry': 'poultry',
    };
    return speciesMap[species] || 'cattle';
  }

  private mapHealthStatus(dbStatus: string): Animal['healthStatus'] {
    const statusMap: { [key: string]: Animal['healthStatus'] } = {
      'healthy': 'Healthy',
      'minor_concern': 'Under Treatment',
      'needs_attention': 'Sick',
      'critical': 'Injured',
    };
    return statusMap[dbStatus] || 'Healthy';
  }

  private mapHealthStatusToDb(status: Animal['healthStatus']): string {
    const statusMap: { [key: string]: string } = {
      'Healthy': 'healthy',
      'Sick': 'needs_attention',
      'Injured': 'critical',
      'Under Treatment': 'minor_concern',
    };
    return statusMap[status] || 'healthy';
  }

  private mapSex(dbSex: string): Animal['sex'] {
    const sexMap: { [key: string]: Animal['sex'] } = {
      'male': 'Male',
      'female': 'Female',
      'M': 'Male',
      'F': 'Female',
    };
    return sexMap[dbSex] || 'Male';
  }

  private mapSexToDb(sex: Animal['sex']): string {
    const sexMap: { [key: string]: string } = {
      'Male': 'male',
      'Female': 'female',
    };
    return sexMap[sex] || 'male';
  }

  async getAnimals(): Promise<Animal[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('animals')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch animals: ${error.message}`);
      }

      return (data || []).map(dbAnimal => this.mapDbToAnimal(dbAnimal));
    } catch (error) {
      console.error('SupabaseAnimalAdapter.getAnimals error:', error);
      throw error;
    }
  }

  async getAnimal(id: string): Promise<Animal | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('animals')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Animal not found
        }
        throw new Error(`Failed to fetch animal: ${error.message}`);
      }

      return this.mapDbToAnimal(data);
    } catch (error) {
      console.error('SupabaseAnimalAdapter.getAnimal error:', error);
      throw error;
    }
  }

  async createAnimal(animal: Animal): Promise<Animal> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbAnimal = this.mapAnimalToDb(animal);
      dbAnimal.owner_id = user.id;

      const { data, error } = await this.supabase
        .from('animals')
        .insert(dbAnimal)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create animal: ${error.message}`);
      }

      return this.mapDbToAnimal(data);
    } catch (error) {
      console.error('SupabaseAnimalAdapter.createAnimal error:', error);
      throw error;
    }
  }

  async updateAnimal(id: string, updates: Partial<Animal>): Promise<Animal> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbUpdates = this.mapAnimalToDb(updates);
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('animals')
        .update(dbUpdates)
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update animal: ${error.message}`);
      }

      if (!data) {
        throw new Error('Animal not found or access denied');
      }

      return this.mapDbToAnimal(data);
    } catch (error) {
      console.error('SupabaseAnimalAdapter.updateAnimal error:', error);
      throw error;
    }
  }

  async deleteAnimal(id: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('animals')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) {
        throw new Error(`Failed to delete animal: ${error.message}`);
      }
    } catch (error) {
      console.error('SupabaseAnimalAdapter.deleteAnimal error:', error);
      throw error;
    }
  }

  async uploadPhoto(animalId: string, photo: any): Promise<string> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify animal ownership
      const animal = await this.getAnimal(animalId);
      if (!animal) {
        throw new Error('Animal not found or access denied');
      }

      // Create file path
      const fileExtension = photo.uri?.split('.').pop() || 'jpg';
      const fileName = `${animalId}/${Date.now()}.${fileExtension}`;

      // Convert photo to blob if needed
      let photoBlob;
      if (photo.uri) {
        const response = await fetch(photo.uri);
        photoBlob = await response.blob();
      } else {
        photoBlob = photo;
      }

      // Upload to Supabase Storage
      const uploadResult = await uploadFile('ANIMAL_PHOTOS', fileName, photoBlob, {
        contentType: photo.type || 'image/jpeg',
      });

      // Save photo metadata to database
      const { data: photoData, error: photoError } = await this.supabase
        .from('animal_photos')
        .insert({
          animal_id: animalId,
          file_path: uploadResult.path,
          file_size: photoBlob.size,
          mime_type: photo.type || 'image/jpeg',
          width: photo.width,
          height: photo.height,
        })
        .select()
        .single();

      if (photoError) {
        throw new Error(`Failed to save photo metadata: ${photoError.message}`);
      }

      return photoData.id;
    } catch (error) {
      console.error('SupabaseAnimalAdapter.uploadPhoto error:', error);
      throw error;
    }
  }

  async getPhotos(animalId: string): Promise<any[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify animal ownership
      const animal = await this.getAnimal(animalId);
      if (!animal) {
        throw new Error('Animal not found or access denied');
      }

      const { data, error } = await this.supabase
        .from('animal_photos')
        .select('*')
        .eq('animal_id', animalId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch photos: ${error.message}`);
      }

      // Add public URLs to photos
      const photosWithUrls = (data || []).map(photo => ({
        ...photo,
        url: getFileUrl('ANIMAL_PHOTOS', photo.file_path),
      }));

      return photosWithUrls;
    } catch (error) {
      console.error('SupabaseAnimalAdapter.getPhotos error:', error);
      throw error;
    }
  }

  // =========================================================================
  // GENERIC CRUD METHODS FOR FFA SERVICES
  // =========================================================================

  /**
   * Generic create method for any table
   */
  async create(tableName: string, data: any): Promise<any> {
    try {
      const user = await getCurrentUser();
      if (user && tableName !== 'ffa_motivational_content') {
        // Add user_id for user-specific tables
        data.user_id = user.id;
      }

      // Handle special timestamp columns for different tables
      if (tableName === 'ffa_analytics_events') {
        // Analytics events table uses 'timestamp' instead of 'created_at'
        if (!data.timestamp) {
          data.timestamp = new Date().toISOString();
        }
      } else {
        // Most tables use created_at/updated_at
        data.created_at = new Date().toISOString();
        data.updated_at = new Date().toISOString();
      }

      const { data: result, error } = await this.supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create record in ${tableName}: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error(`SupabaseAnimalAdapter.create error for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic query method for any table
   */
  async query(tableName: string, options: {
    filters?: any;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      let query = this.supabase.from(tableName).select('*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        Object.entries(options.orderBy).forEach(([column, direction]) => {
          query = query.order(column, { ascending: direction === 'asc' });
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to query ${tableName}: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(`SupabaseAnimalAdapter.query error for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic update method for any table
   */
  async update(tableName: string, id: string, updates: any): Promise<any> {
    try {
      updates.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update record in ${tableName}: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`SupabaseAnimalAdapter.update error for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic get by ID method for any table
   */
  async getById(tableName: string, id: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Record not found
        }
        throw new Error(`Failed to get record from ${tableName}: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`SupabaseAnimalAdapter.getById error for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Generic delete method for any table
   */
  async delete(tableName: string, id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete record from ${tableName}: ${error.message}`);
      }
    } catch (error) {
      console.error(`SupabaseAnimalAdapter.delete error for ${tableName}:`, error);
      throw error;
    }
  }
}