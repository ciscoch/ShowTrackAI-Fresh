/**
 * Supabase Journal Adapter for ShowTrackAI
 * Manages journal data using Supabase backend
 */

import { getSupabaseClient, getCurrentUser, uploadFile, getFileUrl, STORAGE_BUCKETS } from '../../../../backend/api/clients/supabase';
import { IJournalService } from '../interfaces/ServiceInterfaces';
import { Journal, CreateJournalRequest } from '../../models/Journal';

export class SupabaseJournalAdapter implements IJournalService {
  private supabase = getSupabaseClient();

  // Map database fields to frontend model
  private mapDbToJournal(dbJournal: any): Journal {
    return {
      id: dbJournal.id,
      title: dbJournal.title,
      description: dbJournal.content,
      date: new Date(dbJournal.created_at),
      duration: dbJournal.metadata?.duration || 0,
      category: dbJournal.metadata?.category || 'Other',
      subcategory: dbJournal.metadata?.subcategory,
      animalId: dbJournal.animal_id,
      aetSkills: dbJournal.metadata?.aetSkills || [],
      photos: dbJournal.metadata?.photos || [],
      location: dbJournal.metadata?.location,
      weather: dbJournal.metadata?.weather,
      notes: dbJournal.metadata?.notes,
      feedData: dbJournal.metadata?.feedData || { feeds: [] },
      objectives: dbJournal.metadata?.objectives || [],
      learningOutcomes: dbJournal.metadata?.learningOutcomes || [],
      challenges: dbJournal.metadata?.challenges,
      improvements: dbJournal.metadata?.improvements,
      userId: dbJournal.author_id,
      createdAt: new Date(dbJournal.created_at),
      updatedAt: new Date(dbJournal.updated_at),
    };
  }

  // Map frontend model to database fields
  private mapJournalToDb(journal: Partial<Journal>): any {
    const dbJournal: any = {};
    
    if (journal.title !== undefined) dbJournal.title = journal.title;
    if (journal.description !== undefined) dbJournal.content = journal.description;
    if (journal.animalId !== undefined) dbJournal.animal_id = journal.animalId;
    if (journal.userId !== undefined) dbJournal.author_id = journal.userId;
    if (journal.category !== undefined) dbJournal.entry_type = journal.category.toLowerCase();
    
    // Store all other journal data in metadata JSONB field
    const metadata: any = {};
    if (journal.duration !== undefined) metadata.duration = journal.duration;
    if (journal.category !== undefined) metadata.category = journal.category;
    if (journal.subcategory !== undefined) metadata.subcategory = journal.subcategory;
    if (journal.aetSkills !== undefined) metadata.aetSkills = journal.aetSkills;
    if (journal.photos !== undefined) metadata.photos = journal.photos;
    if (journal.location !== undefined) metadata.location = journal.location;
    if (journal.weather !== undefined) metadata.weather = journal.weather;
    if (journal.notes !== undefined) metadata.notes = journal.notes;
    if (journal.feedData !== undefined) metadata.feedData = journal.feedData;
    if (journal.objectives !== undefined) metadata.objectives = journal.objectives;
    if (journal.learningOutcomes !== undefined) metadata.learningOutcomes = journal.learningOutcomes;
    if (journal.challenges !== undefined) metadata.challenges = journal.challenges;
    if (journal.improvements !== undefined) metadata.improvements = journal.improvements;
    
    if (Object.keys(metadata).length > 0) {
      dbJournal.metadata = metadata;
    }
    
    return dbJournal;
  }

  async getJournalEntries(filters?: any): Promise<Journal[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = this.supabase
        .from('journal_entries')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters?.animalId) {
        query = query.eq('animal_id', filters.animalId);
      }
      if (filters?.category) {
        query = query.eq('metadata->>category', filters.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching journal entries:', error);
        throw error;
      }

      return data?.map(entry => this.mapDbToJournal(entry)) || [];
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      throw error;
    }
  }

  async getJournalEntry(id: string): Promise<Journal | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('author_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching journal entry:', error);
        throw error;
      }

      return data ? this.mapDbToJournal(data) : null;
    } catch (error) {
      console.error('Failed to get journal entry:', error);
      throw error;
    }
  }

  async createJournalEntry(entry: CreateJournalRequest): Promise<Journal> {
    try {
      console.log('🔍 SupabaseJournalAdapter: Starting createJournalEntry');
      
      const user = await getCurrentUser();
      if (!user) {
        console.error('❌ No authenticated user found');
        throw new Error('User not authenticated');
      }
      
      console.log('✅ User authenticated:', user.id);

      const dbEntry = this.mapJournalToDb({
        ...entry,
        userId: user.id,
      });

      console.log('📝 Mapped journal data for database:', JSON.stringify(dbEntry, null, 2));

      const { data, error } = await this.supabase
        .from('journal_entries')
        .insert([dbEntry])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Journal entry created successfully in Supabase:', data);
      return this.mapDbToJournal(data);
    } catch (error) {
      console.error('❌ Failed to create journal entry:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  async updateJournalEntry(id: string, updates: Partial<Journal>): Promise<Journal> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbUpdates = this.mapJournalToDb(updates);
      
      console.log('Updating journal entry with data:', dbUpdates);

      const { data, error } = await this.supabase
        .from('journal_entries')
        .update(dbUpdates)
        .eq('id', id)
        .eq('author_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating journal entry:', error);
        throw error;
      }

      console.log('Journal entry updated successfully:', data);
      return this.mapDbToJournal(data);
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      throw error;
    }
  }

  async deleteJournalEntry(id: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Deleting journal entry:', id);

      const { error } = await this.supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id);

      if (error) {
        console.error('Error deleting journal entry:', error);
        throw error;
      }

      console.log('Journal entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      throw error;
    }
  }

  async addPhotoToEntry(entryId: string, photo: any): Promise<string> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload photo to Supabase storage
      const photoUrl = await uploadFile(photo, STORAGE_BUCKETS.JOURNAL_PHOTOS);
      
      // Update journal entry to include photo URL
      const entry = await this.getJournalEntry(entryId);
      if (!entry) {
        throw new Error('Journal entry not found');
      }

      const updatedPhotos = [...(entry.photos || []), photoUrl];
      await this.updateJournalEntry(entryId, { photos: updatedPhotos });

      return photoUrl;
    } catch (error) {
      console.error('Failed to add photo to journal entry:', error);
      throw error;
    }
  }
}