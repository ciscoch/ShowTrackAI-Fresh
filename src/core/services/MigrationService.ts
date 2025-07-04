import { storageService, STORAGE_KEYS, CURRENT_DATA_VERSION } from './StorageService';

interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (data: any) => Promise<any>;
}

interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migratedKeys: string[];
  errors: string[];
}

class MigrationService {
  private migrationSteps: MigrationStep[] = [
    // Example migration from 0.9.0 to 1.0.0
    {
      fromVersion: '0.9.0',
      toVersion: '1.0.0',
      description: 'Add health records and enhanced data structure',
      migrate: async (data: any) => {
        // Migration logic for adding health records structure
        if (data.animals && Array.isArray(data.animals)) {
          data.animals = data.animals.map((animal: any) => ({
            ...animal,
            healthStatus: animal.healthStatus || 'Healthy',
            lastHealthCheck: animal.lastHealthCheck || new Date(),
          }));
        }
        
        // Initialize health records if not present
        if (!data.HEALTH_RECORDS) {
          data.HEALTH_RECORDS = [];
        }
        
        // Initialize health alerts if not present
        if (!data.HEALTH_ALERTS) {
          data.HEALTH_ALERTS = [];
        }

        return data;
      }
    },
    // Add more migration steps as needed
  ];

  async checkAndMigrate(): Promise<MigrationResult> {
    console.log('🔄 Checking for data migrations...');
    
    const result: MigrationResult = {
      success: true,
      fromVersion: '',
      toVersion: CURRENT_DATA_VERSION,
      migratedKeys: [],
      errors: [],
    };

    try {
      // Get current stored version
      const storedVersion = await storageService.loadData(STORAGE_KEYS.DATA_VERSION);
      const currentVersion = storedVersion || '0.9.0'; // Default to 0.9.0 for legacy data
      
      result.fromVersion = currentVersion;

      if (currentVersion === CURRENT_DATA_VERSION) {
        console.log('✅ Data is up to date, no migration needed');
        return result;
      }

      console.log(`🔄 Migrating data from ${currentVersion} to ${CURRENT_DATA_VERSION}`);

      // Find applicable migration steps
      const applicableMigrations = this.findMigrationPath(currentVersion, CURRENT_DATA_VERSION);
      
      if (applicableMigrations.length === 0) {
        throw new Error(`No migration path found from ${currentVersion} to ${CURRENT_DATA_VERSION}`);
      }

      // Create backup before migration
      const backupResult = await storageService.createBackup();
      if (!backupResult.success) {
        console.warn('⚠️ Failed to create backup before migration:', backupResult.error);
      } else {
        console.log('✅ Created backup before migration:', backupResult.filename);
      }

      // Export all current data
      const exportResult = await storageService.exportAllData();
      let currentData = exportResult.data;

      // Apply each migration step
      for (const migration of applicableMigrations) {
        try {
          console.log(`🔄 Applying migration: ${migration.description}`);
          currentData = await migration.migrate(currentData);
          console.log(`✅ Migration completed: ${migration.fromVersion} → ${migration.toVersion}`);
        } catch (error) {
          result.errors.push(`Migration ${migration.fromVersion} → ${migration.toVersion} failed: ${error}`);
          console.error('❌ Migration failed:', error);
        }
      }

      // Import the migrated data back
      if (result.errors.length === 0) {
        const importResult = await storageService.importData(currentData, true);
        
        if (importResult.success) {
          // Update the data version
          await storageService.saveData(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
          
          result.migratedKeys = Object.keys(currentData);
          console.log(`✅ Migration completed successfully. Updated ${importResult.imported} data categories.`);
        } else {
          result.success = false;
          result.errors.push(...importResult.errors);
          console.error('❌ Failed to import migrated data:', importResult.errors);
        }
      } else {
        result.success = false;
        console.error('❌ Migration failed due to errors:', result.errors);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`General migration error: ${error}`);
      console.error('❌ Migration service error:', error);
    }

    return result;
  }

  private findMigrationPath(fromVersion: string, toVersion: string): MigrationStep[] {
    const path: MigrationStep[] = [];
    let currentVersion = fromVersion;

    // Simple sequential migration finder
    while (currentVersion !== toVersion) {
      const nextMigration = this.migrationSteps.find(
        step => step.fromVersion === currentVersion
      );

      if (!nextMigration) {
        console.warn(`⚠️ No migration found from version ${currentVersion}`);
        break;
      }

      path.push(nextMigration);
      currentVersion = nextMigration.toVersion;

      // Prevent infinite loops
      if (path.length > 10) {
        console.error('❌ Migration path too long, possible circular dependency');
        break;
      }
    }

    return path;
  }

  async getCurrentVersion(): Promise<string> {
    const storedVersion = await storageService.loadData(STORAGE_KEYS.DATA_VERSION);
    return storedVersion || '0.9.0';
  }

  async isUpToDate(): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    return currentVersion === CURRENT_DATA_VERSION;
  }

  // Method to manually trigger migration for testing
  async forceMigration(fromVersion: string): Promise<MigrationResult> {
    // Temporarily set the version to test migration
    await storageService.saveData(STORAGE_KEYS.DATA_VERSION, fromVersion);
    return this.checkAndMigrate();
  }

  // Get migration history and status
  async getMigrationInfo(): Promise<{
    currentVersion: string;
    targetVersion: string;
    isUpToDate: boolean;
    availableMigrations: Array<{
      fromVersion: string;
      toVersion: string;
      description: string;
    }>;
  }> {
    const currentVersion = await this.getCurrentVersion();
    const isUpToDate = currentVersion === CURRENT_DATA_VERSION;
    
    return {
      currentVersion,
      targetVersion: CURRENT_DATA_VERSION,
      isUpToDate,
      availableMigrations: this.migrationSteps.map(step => ({
        fromVersion: step.fromVersion,
        toVersion: step.toVersion,
        description: step.description,
      })),
    };
  }

  // Validate data structure after migration
  async validateDataStructure(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check animals structure
      const animals = await storageService.loadData(STORAGE_KEYS.ANIMALS);
      if (animals && Array.isArray(animals)) {
        for (const animal of animals) {
          if (!animal.id || !animal.name || !animal.species) {
            issues.push(`Invalid animal structure: missing required fields`);
          }
          if (!animal.healthStatus) {
            issues.push(`Animal ${animal.name || 'unknown'} missing healthStatus`);
          }
        }
      }

      // Check health records structure
      const healthRecords = await storageService.loadData(STORAGE_KEYS.HEALTH_RECORDS);
      if (healthRecords && Array.isArray(healthRecords)) {
        for (const record of healthRecords) {
          if (!record.id || !record.animalId || !record.recordedDate) {
            issues.push(`Invalid health record structure: missing required fields`);
          }
        }
      }

      // Check data version
      const version = await storageService.loadData(STORAGE_KEYS.DATA_VERSION);
      if (!version) {
        issues.push('Data version not set');
      } else if (version !== CURRENT_DATA_VERSION) {
        issues.push(`Data version mismatch: expected ${CURRENT_DATA_VERSION}, got ${version}`);
      }

    } catch (error) {
      issues.push(`Validation error: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

export const migrationService = new MigrationService();