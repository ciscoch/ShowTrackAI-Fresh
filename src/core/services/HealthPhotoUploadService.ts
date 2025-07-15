/**
 * Health Photo Upload Service
 * 
 * Handles uploading health photos to Supabase storage with proper privacy controls
 * and organization for ShowTrackAI medical records system.
 */

import { getSupabaseClient, getCurrentUser } from '../../../backend/api/clients/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { HealthPhoto } from '../models/HealthRecord';

interface UploadResult {
  publicUrl: string;
  path: string;
  success: boolean;
  error?: string;
}

interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

export class HealthPhotoUploadService {
  private supabase = getSupabaseClient();
  private bucketName = 'health-photos';

  /**
   * Initialize storage bucket if needed
   */
  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket with privacy controls
        const { error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false, // Private bucket for medical data
          fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic'],
        });

        if (error) {
          console.error('Failed to create health photos bucket:', error);
        } else {
          console.log('✅ Health photos bucket created successfully');
        }
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
    }
  }

  /**
   * Upload a health photo to Supabase storage
   */
  async uploadHealthPhoto(
    photo: HealthPhoto,
    animalId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure bucket exists
      await this.initializeBucket();

      // Create organized file path
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `${photo.photoType}_${Date.now()}.jpg`;
      const filePath = `${user.id}/${animalId}/${timestamp}/${fileName}`;

      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const fileBuffer = decode(fileBase64);

      // Report initial progress
      onProgress?.({
        progress: 0,
        uploaded: 0,
        total: fileBuffer.byteLength,
      });

      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Report completion
      onProgress?.({
        progress: 100,
        uploaded: fileBuffer.byteLength,
        total: fileBuffer.byteLength,
      });

      // Get public URL (even though bucket is private, we get signed URLs later)
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        publicUrl: publicUrlData.publicUrl,
        path: filePath,
        success: true,
      };

    } catch (error) {
      console.error('Health photo upload error:', error);
      return {
        publicUrl: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Get a signed URL for accessing a private health photo
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Failed to create signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  }

  /**
   * Upload multiple health photos with progress tracking
   */
  async uploadMultiplePhotos(
    photos: HealthPhoto[],
    animalId: string,
    onOverallProgress?: (completed: number, total: number) => void,
    onIndividualProgress?: (photoIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      const result = await this.uploadHealthPhoto(
        photo,
        animalId,
        (progress) => onIndividualProgress?.(i, progress)
      );

      results.push(result);
      onOverallProgress?.(i + 1, photos.length);
    }

    return results;
  }

  /**
   * Delete a health photo from storage
   */
  async deleteHealthPhoto(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Failed to delete health photo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting health photo:', error);
      return false;
    }
  }

  /**
   * List health photos for an animal
   */
  async listHealthPhotos(animalId: string): Promise<string[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const folderPath = `${user.id}/${animalId}`;
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('Failed to list health photos:', error);
        return [];
      }

      return data?.map(file => `${folderPath}/${file.name}`) || [];
    } catch (error) {
      console.error('Error listing health photos:', error);
      return [];
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    bucketQuota: number;
  }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(user.id, {
          limit: 1000,
        });

      if (error) {
        console.error('Failed to get storage stats:', error);
        return { totalFiles: 0, totalSize: 0, bucketQuota: 10 * 1024 * 1024 };
      }

      const totalFiles = data?.length || 0;
      const totalSize = data?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
      const bucketQuota = 10 * 1024 * 1024; // 10MB per user

      return { totalFiles, totalSize, bucketQuota };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalFiles: 0, totalSize: 0, bucketQuota: 10 * 1024 * 1024 };
    }
  }
}

// Export singleton instance
export const healthPhotoUploadService = new HealthPhotoUploadService();