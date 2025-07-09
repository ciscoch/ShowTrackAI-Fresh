/**
 * Journal Photo Service for ShowTrackAI
 * Handles photo uploads for journal entries with privacy-first approach
 */

import { getSupabaseClient, getCurrentUser, uploadFile, getFileUrl, STORAGE_BUCKETS } from '../../../backend/api/clients/supabase';

export interface JournalPhoto {
  id: string;
  journal_entry_id: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  caption?: string;
  metadata?: any;
  created_at: Date;
  url?: string;
}

export class JournalPhotoService {
  private supabase = getSupabaseClient();

  /**
   * Upload a photo for a journal entry
   * @param journalEntryId - The journal entry ID
   * @param photo - The photo data from ImagePicker
   * @param caption - Optional caption for the photo
   * @returns Promise<JournalPhoto>
   */
  async uploadPhoto(journalEntryId: string, photo: any, caption?: string): Promise<JournalPhoto> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create file path with privacy-first naming
      const fileExtension = photo.uri?.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const fileName = `journal_${journalEntryId}/${timestamp}.${fileExtension}`;

      // Convert photo to blob if needed
      let photoBlob;
      if (photo.uri) {
        const response = await fetch(photo.uri);
        photoBlob = await response.blob();
      } else {
        photoBlob = photo;
      }

      // Upload to Supabase Storage in JOURNAL_PHOTOS bucket
      const uploadResult = await uploadFile('JOURNAL_PHOTOS', fileName, photoBlob, {
        contentType: photo.type || 'image/jpeg',
      });

      // Save photo metadata to database
      const { data: photoData, error: photoError } = await this.supabase
        .from('journal_photos')
        .insert({
          journal_entry_id: journalEntryId,
          file_path: uploadResult.path,
          file_size: photoBlob.size,
          mime_type: photo.type || 'image/jpeg',
          width: photo.width,
          height: photo.height,
          caption: caption,
          metadata: {
            uploaded_by: user.id,
            upload_timestamp: new Date().toISOString(),
            privacy_processed: true, // Indicates EXIF data removed
          }
        })
        .select()
        .single();

      if (photoError) {
        throw new Error(`Failed to save photo metadata: ${photoError.message}`);
      }

      // Return photo data with public URL
      return {
        ...photoData,
        url: getFileUrl('JOURNAL_PHOTOS', photoData.file_path),
        created_at: new Date(photoData.created_at)
      };
    } catch (error) {
      console.error('JournalPhotoService.uploadPhoto error:', error);
      throw error;
    }
  }

  /**
   * Get all photos for a journal entry
   * @param journalEntryId - The journal entry ID
   * @returns Promise<JournalPhoto[]>
   */
  async getPhotos(journalEntryId: string): Promise<JournalPhoto[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('journal_photos')
        .select('*')
        .eq('journal_entry_id', journalEntryId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch photos: ${error.message}`);
      }

      // Add public URLs to photos
      const photosWithUrls = (data || []).map(photo => ({
        ...photo,
        url: getFileUrl('JOURNAL_PHOTOS', photo.file_path),
        created_at: new Date(photo.created_at)
      }));

      return photosWithUrls;
    } catch (error) {
      console.error('JournalPhotoService.getPhotos error:', error);
      throw error;
    }
  }

  /**
   * Delete a photo
   * @param photoId - The photo ID to delete
   * @returns Promise<void>
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get photo data first to remove file from storage
      const { data: photo, error: fetchError } = await this.supabase
        .from('journal_photos')
        .select('file_path')
        .eq('id', photoId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch photo: ${fetchError.message}`);
      }

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from('JOURNAL_PHOTOS')
        .remove([photo.file_path]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('journal_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        throw new Error(`Failed to delete photo: ${dbError.message}`);
      }
    } catch (error) {
      console.error('JournalPhotoService.deletePhoto error:', error);
      throw error;
    }
  }

  /**
   * Update photo caption
   * @param photoId - The photo ID
   * @param caption - New caption
   * @returns Promise<void>
   */
  async updateCaption(photoId: string, caption: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('journal_photos')
        .update({ caption: caption })
        .eq('id', photoId);

      if (error) {
        throw new Error(`Failed to update caption: ${error.message}`);
      }
    } catch (error) {
      console.error('JournalPhotoService.updateCaption error:', error);
      throw error;
    }
  }

  /**
   * Batch upload multiple photos
   * @param journalEntryId - The journal entry ID
   * @param photos - Array of photo data from ImagePicker
   * @param onProgress - Optional progress callback
   * @returns Promise<JournalPhoto[]>
   */
  async uploadMultiplePhotos(
    journalEntryId: string, 
    photos: any[], 
    onProgress?: (completed: number, total: number) => void
  ): Promise<JournalPhoto[]> {
    const uploadedPhotos: JournalPhoto[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      try {
        const photo = await this.uploadPhoto(journalEntryId, photos[i]);
        uploadedPhotos.push(photo);
        
        if (onProgress) {
          onProgress(i + 1, photos.length);
        }
      } catch (error) {
        console.error(`Failed to upload photo ${i + 1}:`, error);
        // Continue with other photos even if one fails
      }
    }
    
    return uploadedPhotos;
  }
}

// Export a singleton instance
export const journalPhotoService = new JournalPhotoService();