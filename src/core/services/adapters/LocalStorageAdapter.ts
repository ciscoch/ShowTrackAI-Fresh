/**
 * Local Storage Adapter for ShowTrackAI
 * Wraps the existing StorageService to match the IStorageService interface
 */

import { StorageService } from '../StorageService';
import { IStorageService } from '../interfaces/ServiceInterfaces';

export class LocalStorageAdapter implements IStorageService {
  private storageService: typeof StorageService;

  constructor() {
    this.storageService = StorageService;
  }

  async get<T>(key: string): Promise<T | null> {
    return await this.storageService.getData(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.storageService.storeData(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.storageService.removeData(key);
  }

  async clear(): Promise<void> {
    await this.storageService.clearAllData();
  }

  async getAllKeys(): Promise<string[]> {
    return await this.storageService.getAllKeys();
  }

  async backup(): Promise<void> {
    await this.storageService.createBackup();
  }

  async restore(data: any): Promise<void> {
    await this.storageService.restoreFromBackup(data);
  }
}