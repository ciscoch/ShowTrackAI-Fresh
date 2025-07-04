import { storageService, STORAGE_KEYS } from './StorageService';
import { migrationService } from './MigrationService';

interface SyncConfig {
  autoSaveInterval: number; // milliseconds
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

interface PendingSave {
  key: string;
  data: any;
  timestamp: number;
  attempts: number;
}

interface SyncStats {
  lastSync: Date | null;
  totalSaves: number;
  failedSaves: number;
  pendingOperations: number;
  isActive: boolean;
}

class AutoSyncService {
  private config: SyncConfig = {
    autoSaveInterval: 30000, // 30 seconds
    batchSize: 5,
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  };

  private pendingSaves = new Map<string, PendingSave>();
  private syncInterval: NodeJS.Timeout | null = null;
  private isActive = false;
  private stats: SyncStats = {
    lastSync: null,
    totalSaves: 0,
    failedSaves: 0,
    pendingOperations: 0,
    isActive: false,
  };

  private listeners = new Set<(stats: SyncStats) => void>();

  async initialize(): Promise<void> {
    console.log('🔄 Initializing AutoSync Service...');
    
    try {
      // Check and run migrations first
      const migrationResult = await migrationService.checkAndMigrate();
      if (!migrationResult.success) {
        console.warn('⚠️ Migration issues detected:', migrationResult.errors);
      }

      // Load any pending saves from storage
      await this.loadPendingSaves();
      
      // Start the auto-sync process
      this.start();
      
      console.log('✅ AutoSync Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AutoSync Service:', error);
    }
  }

  start(): void {
    if (this.isActive) {
      console.log('⚠️ AutoSync already active');
      return;
    }

    this.isActive = true;
    this.stats.isActive = true;
    
    // Process pending saves immediately
    this.processPendingSaves();
    
    // Set up recurring sync
    this.syncInterval = setInterval(() => {
      this.processPendingSaves();
    }, this.config.autoSaveInterval);

    console.log('✅ AutoSync Service started');
    this.notifyListeners();
  }

  stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.stats.isActive = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Save pending operations to storage for later
    this.savePendingSaves();

    console.log('🛑 AutoSync Service stopped');
    this.notifyListeners();
  }

  // Queue a save operation
  async queueSave(key: string, data: any): Promise<void> {
    const pendingSave: PendingSave = {
      key,
      data,
      timestamp: Date.now(),
      attempts: 0,
    };

    this.pendingSaves.set(key, pendingSave);
    this.stats.pendingOperations = this.pendingSaves.size;
    this.notifyListeners();

    // If there are too many pending saves, process them immediately
    if (this.pendingSaves.size >= this.config.batchSize) {
      await this.processPendingSaves();
    }
  }

  // Immediate save (bypasses queue)
  async saveImmediately(key: string, data: any): Promise<boolean> {
    try {
      const success = await storageService.saveData(key, data);
      if (success) {
        this.stats.totalSaves++;
        this.stats.lastSync = new Date();
      } else {
        this.stats.failedSaves++;
      }
      this.notifyListeners();
      return success;
    } catch (error) {
      console.error(`❌ Immediate save failed for ${key}:`, error);
      this.stats.failedSaves++;
      this.notifyListeners();
      return false;
    }
  }

  // Process all pending save operations
  private async processPendingSaves(): Promise<void> {
    if (this.pendingSaves.size === 0) {
      return;
    }

    console.log(`🔄 Processing ${this.pendingSaves.size} pending saves...`);

    const savesToProcess = Array.from(this.pendingSaves.values())
      .sort((a, b) => a.timestamp - b.timestamp) // Oldest first
      .slice(0, this.config.batchSize);

    const batchItems = savesToProcess.map(save => ({
      key: save.key,
      data: save.data,
    }));

    try {
      // Try batch save first
      const success = await storageService.saveBatch(batchItems);
      
      if (success) {
        // Remove successful saves from pending
        for (const save of savesToProcess) {
          this.pendingSaves.delete(save.key);
        }
        this.stats.totalSaves += savesToProcess.length;
        this.stats.lastSync = new Date();
        console.log(`✅ Batch saved ${savesToProcess.length} items`);
      } else {
        // Batch failed, try individual saves
        await this.processIndividualSaves(savesToProcess);
      }
    } catch (error) {
      console.error('❌ Batch save failed, trying individual saves:', error);
      await this.processIndividualSaves(savesToProcess);
    }

    this.stats.pendingOperations = this.pendingSaves.size;
    this.notifyListeners();
  }

  private async processIndividualSaves(saves: PendingSave[]): Promise<void> {
    for (const save of saves) {
      try {
        const success = await storageService.saveData(save.key, save.data);
        
        if (success) {
          this.pendingSaves.delete(save.key);
          this.stats.totalSaves++;
          console.log(`✅ Individual save successful: ${save.key}`);
        } else {
          // Increment attempt count
          save.attempts++;
          
          if (save.attempts >= this.config.retryAttempts) {
            console.error(`❌ Save failed after ${this.config.retryAttempts} attempts: ${save.key}`);
            this.pendingSaves.delete(save.key);
            this.stats.failedSaves++;
          } else {
            console.warn(`⚠️ Save failed, will retry (attempt ${save.attempts}/${this.config.retryAttempts}): ${save.key}`);
            // Update the save with new attempt count
            this.pendingSaves.set(save.key, save);
          }
        }
      } catch (error) {
        console.error(`❌ Save error for ${save.key}:`, error);
        save.attempts++;
        
        if (save.attempts >= this.config.retryAttempts) {
          this.pendingSaves.delete(save.key);
          this.stats.failedSaves++;
        } else {
          this.pendingSaves.set(save.key, save);
        }
      }
    }
  }

  // Load pending saves from storage (for app restart)
  private async loadPendingSaves(): Promise<void> {
    try {
      const pendingData = await storageService.loadData('@ShowTrackAI:pendingSaves');
      if (pendingData && Array.isArray(pendingData)) {
        for (const save of pendingData) {
          this.pendingSaves.set(save.key, save);
        }
        console.log(`📥 Loaded ${pendingData.length} pending saves from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load pending saves:', error);
    }
  }

  // Save pending operations to storage (for app shutdown)
  private async savePendingSaves(): Promise<void> {
    try {
      const pendingArray = Array.from(this.pendingSaves.values());
      if (pendingArray.length > 0) {
        await storageService.saveData('@ShowTrackAI:pendingSaves', pendingArray);
        console.log(`💾 Saved ${pendingArray.length} pending operations to storage`);
      }
    } catch (error) {
      console.error('❌ Failed to save pending operations:', error);
    }
  }

  // Force sync all pending operations
  async forcSync(): Promise<void> {
    console.log('🔄 Force sync requested...');
    await this.processPendingSaves();
    
    // Process any remaining saves
    while (this.pendingSaves.size > 0) {
      await this.processPendingSaves();
      
      // Small delay to prevent infinite loop
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Force sync completed');
  }

  // Create a full backup
  async createBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
    console.log('💾 Creating backup...');
    
    // Force sync before backup
    await this.forcSync();
    
    const result = await storageService.createBackup();
    
    if (result.success) {
      console.log(`✅ Backup created: ${result.filename}`);
    } else {
      console.error('❌ Backup failed:', result.error);
    }
    
    return result;
  }

  // Auto-backup functionality
  async enableAutoBackup(intervalHours: number = 24): Promise<void> {
    // Implementation for automatic backups at intervals
    setInterval(async () => {
      const lastBackup = await storageService.loadData(STORAGE_KEYS.LAST_BACKUP);
      const now = new Date();
      
      if (!lastBackup || (now.getTime() - new Date(lastBackup.timestamp).getTime()) > (intervalHours * 60 * 60 * 1000)) {
        console.log('⏰ Creating automatic backup...');
        await this.createBackup();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  // Performance optimization: cache frequently accessed data
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getCachedData<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }

    const data = await storageService.loadData<T>(key);
    if (data) {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
    
    return data;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    storageService.clearCache();
  }

  // Get sync statistics
  getStats(): SyncStats {
    return { ...this.stats };
  }

  // Update config
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ AutoSync config updated:', this.config);
  }

  // Add listener for stats updates
  addStatsListener(callback: (stats: SyncStats) => void): void {
    this.listeners.add(callback);
  }

  // Remove listener
  removeStatsListener(callback: (stats: SyncStats) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.stats);
      } catch (error) {
        console.error('❌ Error in stats listener:', error);
      }
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up AutoSync Service...');
    this.stop();
    await this.savePendingSaves();
    this.clearCache();
    this.listeners.clear();
    console.log('✅ AutoSync Service cleanup completed');
  }
}

export const autoSyncService = new AutoSyncService();