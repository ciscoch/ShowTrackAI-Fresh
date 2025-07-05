import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const STORAGE_KEYS = {
  ANIMALS: '@ShowTrackAI:animals',
  EXPENSES: '@ShowTrackAI:expenses',
  INCOME: '@ShowTrackAI:income',
  JOURNAL: '@ShowTrackAI:journal',
  WEIGHTS: '@ShowTrackAI:weights',
  SUBSCRIPTION: '@ShowTrackAI:subscription',
  REWARDS: '@ShowTrackAI:rewards',
  FFA_PROFILES: '@ShowTrackAI:ffaProfiles',
  USER_PREFERENCES: '@ShowTrackAI:preferences',
  HEALTH_RECORDS: '@ShowTrackAI:healthRecords',
  HEALTH_ALERTS: '@ShowTrackAI:healthAlerts',
  FINANCIAL_ENTRIES: '@ShowTrackAI:financialEntries',
  TIME_TRACKING: '@ShowTrackAI:timeTracking',
  // Follow-up system keys
  FOLLOW_UP_TASKS: '@ShowTrackAI:followUpTasks',
  FOLLOW_UP_UPDATES: '@ShowTrackAI:followUpUpdates',
  EDUCATOR_MONITORING: '@ShowTrackAI:educatorMonitoring',
  // Help system keys
  HELP_CONTENT: '@ShowTrackAI:helpContent',
  CONTEXTUAL_HELP: '@ShowTrackAI:contextualHelp',
  // System keys
  DATA_VERSION: '@ShowTrackAI:dataVersion',
  LAST_BACKUP: '@ShowTrackAI:lastBackup',
  APP_METADATA: '@ShowTrackAI:appMetadata',
} as const;

export const CURRENT_DATA_VERSION = '1.0.0';

interface DataMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
  checksum?: string;
}

interface BackupInfo {
  timestamp: Date;
  version: string;
  size: number;
  filename: string;
  checksum: string;
}

class StorageService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Enhanced save with metadata and retry logic
  async saveData<T>(key: string, data: T, retries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const metadata: DataMetadata = {
          version: CURRENT_DATA_VERSION,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: JSON.stringify(data).length,
        };

        const dataWithMetadata = {
          metadata,
          data,
        };

        const jsonData = JSON.stringify(dataWithMetadata, this.dateReplacer);
        await AsyncStorage.setItem(key, jsonData);
        
        // Update cache
        this.cache.set(key, { data: dataWithMetadata, timestamp: Date.now() });
        
        // Update app metadata
        await this.updateAppMetadata();
        
        return true;
      } catch (error) {
        console.error(`Failed to save data for key ${key} (attempt ${attempt}):`, error);
        if (attempt === retries) {
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
    return false;
  }

  // Enhanced load with caching and date parsing
  async loadData<T>(key: string, useCache: boolean = true): Promise<T | null> {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          return cached.data.data as T;
        }
      }

      const jsonData = await AsyncStorage.getItem(key);
      if (jsonData) {
        const parsedData = JSON.parse(jsonData, this.dateReviver);
        
        // Handle legacy data without metadata
        if (parsedData.metadata) {
          // Update cache
          this.cache.set(key, { data: parsedData, timestamp: Date.now() });
          return parsedData.data as T;
        } else {
          // Legacy data - migrate it
          await this.saveData(key, parsedData);
          return parsedData as T;
        }
      }
      return null;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      return null;
    }
  }

  // Get data metadata
  async getDataMetadata(key: string): Promise<DataMetadata | null> {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      if (jsonData) {
        const parsedData = JSON.parse(jsonData, this.dateReviver);
        return parsedData.metadata || null;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get metadata for key ${key}:`, error);
      return null;
    }
  }

  // Batch operations for better performance
  async saveBatch(items: Array<{ key: string; data: any }>): Promise<boolean> {
    try {
      const pairs: Array<[string, string]> = [];
      
      for (const item of items) {
        const metadata: DataMetadata = {
          version: CURRENT_DATA_VERSION,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: JSON.stringify(item.data).length,
        };

        const dataWithMetadata = {
          metadata,
          data: item.data,
        };

        pairs.push([item.key, JSON.stringify(dataWithMetadata, this.dateReplacer)]);
      }

      await AsyncStorage.multiSet(pairs);
      
      // Update cache for all items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const dataWithMetadata = JSON.parse(pairs[i][1], this.dateReviver);
        this.cache.set(item.key, { data: dataWithMetadata, timestamp: Date.now() });
      }

      await this.updateAppMetadata();
      return true;
    } catch (error) {
      console.error('Failed to save batch data:', error);
      return false;
    }
  }

  async loadBatch(keys: string[]): Promise<Record<string, any>> {
    try {
      const result: Record<string, any> = {};
      const keysToLoad: string[] = [];
      
      // Check cache first
      for (const key of keys) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          result[key] = cached.data.data;
        } else {
          keysToLoad.push(key);
        }
      }

      if (keysToLoad.length > 0) {
        const pairs = await AsyncStorage.multiGet(keysToLoad);
        
        for (const [key, value] of pairs) {
          if (value) {
            try {
              const parsedData = JSON.parse(value, this.dateReviver);
              if (parsedData.metadata) {
                result[key] = parsedData.data;
                this.cache.set(key, { data: parsedData, timestamp: Date.now() });
              } else {
                // Legacy data
                result[key] = parsedData;
              }
            } catch (parseError) {
              console.error(`Failed to parse data for key ${key}:`, parseError);
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to load batch data:', error);
      return {};
    }
  }

  async removeData(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      this.cache.delete(key);
      await this.updateAppMetadata();
      return true;
    } catch (error) {
      console.error(`Failed to remove data for key ${key}:`, error);
      return false;
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  // Enhanced export with metadata
  async exportAllData(): Promise<{
    data: Record<string, any>;
    metadata: {
      exportDate: Date;
      version: string;
      totalSize: number;
      itemCount: number;
    };
  }> {
    try {
      const exportData: Record<string, any> = {};
      let totalSize = 0;
      let itemCount = 0;
      
      const dataKeys = Object.values(STORAGE_KEYS).filter(key => 
        !key.includes('dataVersion') && 
        !key.includes('lastBackup') && 
        !key.includes('appMetadata')
      );

      for (const storageKey of dataKeys) {
        const data = await this.loadData(storageKey, false);
        if (data) {
          const keyName = Object.keys(STORAGE_KEYS).find(
            k => STORAGE_KEYS[k as keyof typeof STORAGE_KEYS] === storageKey
          );
          if (keyName) {
            exportData[keyName] = data;
            totalSize += JSON.stringify(data).length;
            itemCount++;
          }
        }
      }
      
      return {
        data: exportData,
        metadata: {
          exportDate: new Date(),
          version: CURRENT_DATA_VERSION,
          totalSize,
          itemCount,
        }
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return {
        data: {},
        metadata: {
          exportDate: new Date(),
          version: CURRENT_DATA_VERSION,
          totalSize: 0,
          itemCount: 0,
        }
      };
    }
  }

  async importData(importData: Record<string, any>, overwrite: boolean = true): Promise<{
    success: boolean;
    imported: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      for (const [keyName, data] of Object.entries(importData)) {
        try {
          const storageKey = STORAGE_KEYS[keyName as keyof typeof STORAGE_KEYS];
          if (storageKey) {
            if (!overwrite) {
              // Check if data exists
              const existing = await this.loadData(storageKey, false);
              if (existing) {
                continue; // Skip if data exists and overwrite is false
              }
            }
            
            const success = await this.saveData(storageKey, data);
            if (success) {
              imported++;
            } else {
              errors.push(`Failed to import ${keyName}`);
            }
          } else {
            errors.push(`Unknown storage key: ${keyName}`);
          }
        } catch (error) {
          errors.push(`Error importing ${keyName}: ${error}`);
        }
      }
      
      return {
        success: errors.length === 0,
        imported,
        errors,
      };
    } catch (error) {
      console.error('Failed to import data:', error);
      return {
        success: false,
        imported,
        errors: [...errors, `General import error: ${error}`],
      };
    }
  }

  // Backup functionality
  async createBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      const exportResult = await this.exportAllData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ShowTrackAI_Backup_${timestamp}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      const backupData = {
        ...exportResult,
        backup_info: {
          app_name: 'ShowTrackAI',
          backup_date: new Date(),
          version: CURRENT_DATA_VERSION,
        }
      };

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(backupData, this.dateReplacer, 2)
      );

      // Save backup info
      const backupInfo: BackupInfo = {
        timestamp: new Date(),
        version: CURRENT_DATA_VERSION,
        size: (await FileSystem.getInfoAsync(fileUri)).size || 0,
        filename,
        checksum: await this.calculateChecksum(JSON.stringify(backupData)),
      };

      await this.saveData(STORAGE_KEYS.LAST_BACKUP, backupInfo);

      return { success: true, filename };
    } catch (error) {
      console.error('Failed to create backup:', error);
      return { success: false, error: String(error) };
    }
  }

  async restoreFromBackup(backupUri: string): Promise<{
    success: boolean;
    imported?: number;
    errors?: string[];
    error?: string;
  }> {
    try {
      const backupContent = await FileSystem.readAsStringAsync(backupUri);
      const backupData = JSON.parse(backupContent, this.dateReviver);
      
      if (!backupData.data) {
        return { success: false, error: 'Invalid backup file format' };
      }

      const result = await this.importData(backupData.data, true);
      return {
        success: result.success,
        imported: result.imported,
        errors: result.errors,
      };
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return { success: false, error: String(error) };
    }
  }

  async shareBackup(): Promise<boolean> {
    try {
      const backupResult = await this.createBackup();
      if (backupResult.success && backupResult.filename) {
        const fileUri = FileSystem.documentDirectory + backupResult.filename;
        await Sharing.shareAsync(fileUri);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to share backup:', error);
      return false;
    }
  }

  // Storage statistics
  async getStorageStats(): Promise<{
    totalKeys: number;
    totalSize: number;
    keyStats: Array<{ key: string; size: number; lastModified?: Date }>;
  }> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      const keyStats: Array<{ key: string; size: number; lastModified?: Date }> = [];
      let totalSize = 0;

      for (const key of keys) {
        try {
          const rawData = await AsyncStorage.getItem(key);
          if (rawData) {
            const size = rawData.length;
            totalSize += size;
            
            try {
              const parsed = JSON.parse(rawData, this.dateReviver);
              const lastModified = parsed.metadata?.updatedAt;
              keyStats.push({ key, size, lastModified });
            } catch {
              keyStats.push({ key, size });
            }
          }
        } catch (error) {
          console.error(`Failed to get stats for key ${key}:`, error);
        }
      }

      return {
        totalKeys: keyStats.length,
        totalSize,
        keyStats: keyStats.sort((a, b) => b.size - a.size),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalKeys: 0, totalSize: 0, keyStats: [] };
    }
  }

  // Data integrity check
  async verifyDataIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const keys = Object.values(STORAGE_KEYS);
      
      for (const key of keys) {
        try {
          const rawData = await AsyncStorage.getItem(key);
          if (rawData) {
            // Try to parse the data
            JSON.parse(rawData, this.dateReviver);
          }
        } catch (error) {
          issues.push(`Corrupted data for key ${key}: ${error}`);
        }
      }

      // Check data version compatibility
      const currentVersion = await this.loadData(STORAGE_KEYS.DATA_VERSION);
      if (currentVersion && currentVersion !== CURRENT_DATA_VERSION) {
        issues.push(`Data version mismatch: stored ${currentVersion}, expected ${CURRENT_DATA_VERSION}`);
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [`General integrity check failed: ${error}`],
      };
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Helper methods
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __date: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__date) {
      return new Date(value.__date);
    }
    return value;
  }

  private async updateAppMetadata(): Promise<void> {
    try {
      const metadata = {
        lastUpdated: new Date(),
        version: CURRENT_DATA_VERSION,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.APP_METADATA, JSON.stringify(metadata, this.dateReplacer));
    } catch (error) {
      console.error('Failed to update app metadata:', error);
    }
  }

  private async calculateChecksum(data: string): Promise<string> {
    // Simple checksum calculation (in production, use a proper hash function)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

export const storageService = new StorageService();