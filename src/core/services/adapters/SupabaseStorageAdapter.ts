/**
 * Supabase Storage Adapter for ShowTrackAI
 * Provides cloud-based storage using Supabase as backend
 */

import { getSupabaseClient, getCurrentUser } from '../../../../backend/api/clients/supabase';
import { IStorageService } from '../interfaces/ServiceInterfaces';

export class SupabaseStorageAdapter implements IStorageService {
  private supabase = getSupabaseClient();
  private tableName = 'user_storage';

  async get<T>(key: string): Promise<T | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('value')
        .eq('user_id', user.id)
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        throw new Error(`Failed to get data: ${error.message}`);
      }

      return data?.value || null;
    } catch (error) {
      console.error('SupabaseStorageAdapter.get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from(this.tableName)
        .upsert({
          user_id: user.id,
          key,
          value,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to store data: ${error.message}`);
      }
    } catch (error) {
      console.error('SupabaseStorageAdapter.set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', user.id)
        .eq('key', key);

      if (error) {
        throw new Error(`Failed to remove data: ${error.message}`);
      }
    } catch (error) {
      console.error('SupabaseStorageAdapter.remove error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to clear data: ${error.message}`);
      }
    } catch (error) {
      console.error('SupabaseStorageAdapter.clear error:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('key')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to get keys: ${error.message}`);
      }

      return data?.map(item => item.key) || [];
    } catch (error) {
      console.error('SupabaseStorageAdapter.getAllKeys error:', error);
      return [];
    }
  }

  async backup(): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all user data
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to create backup: ${error.message}`);
      }

      // Store backup with timestamp
      const backupKey = `backup_${new Date().toISOString()}`;
      await this.set(backupKey, {
        timestamp: new Date().toISOString(),
        data: data || [],
      });
    } catch (error) {
      console.error('SupabaseStorageAdapter.backup error:', error);
      throw error;
    }
  }

  async restore(backupData: any): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Clear existing data first
      await this.clear();

      // Restore data
      if (backupData && Array.isArray(backupData.data)) {
        for (const item of backupData.data) {
          if (item.key && !item.key.startsWith('backup_')) {
            await this.set(item.key, item.value);
          }
        }
      }
    } catch (error) {
      console.error('SupabaseStorageAdapter.restore error:', error);
      throw error;
    }
  }
}