/**
 * Supabase Animal Adapter for ShowTrackAI
 * Manages animal data using Supabase backend
 */

import { getSupabaseClient, getCurrentUser, uploadFile, getFileUrl, STORAGE_BUCKETS } from '../../../../backend/api/clients/supabase';
import { IAnimalService } from '../interfaces/ServiceInterfaces';
import { Animal } from '../../models/Animal';

export class SupabaseAnimalAdapter implements IAnimalService {
  private supabase = getSupabaseClient();

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

      return data || [];
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

      return data;
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

      const newAnimal = {
        ...animal,
        owner_id: user.id,
        health_status: animal.health_status || 'healthy',
      };

      const { data, error } = await this.supabase
        .from('animals')
        .insert(newAnimal)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create animal: ${error.message}`);
      }

      return data;
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

      const { data, error } = await this.supabase
        .from('animals')
        .update(updates)
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

      return data;
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
}