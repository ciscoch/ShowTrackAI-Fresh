import AsyncStorage from '@react-native-async-storage/async-storage';

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
} as const;

class StorageService {
  async saveData<T>(key: string, data: T): Promise<boolean> {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
      return true;
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      return false;
    }
  }

  async loadData<T>(key: string): Promise<T | null> {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      if (jsonData) {
        return JSON.parse(jsonData) as T;
      }
      return null;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      return null;
    }
  }

  async removeData(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
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
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  async exportAllData(): Promise<Record<string, any>> {
    try {
      const exportData: Record<string, any> = {};
      
      for (const [keyName, storageKey] of Object.entries(STORAGE_KEYS)) {
        const data = await this.loadData(storageKey);
        if (data) {
          exportData[keyName] = data;
        }
      }
      
      return exportData;
    } catch (error) {
      console.error('Failed to export data:', error);
      return {};
    }
  }

  async importData(importData: Record<string, any>): Promise<boolean> {
    try {
      for (const [keyName, data] of Object.entries(importData)) {
        const storageKey = STORAGE_KEYS[keyName as keyof typeof STORAGE_KEYS];
        if (storageKey) {
          await this.saveData(storageKey, data);
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();