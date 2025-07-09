/**
 * Service Factory for ShowTrackAI
 * Provides a seamless way to switch between local storage and backend services
 * Maintains existing interfaces to prevent code breaks
 */

import { config, useSupabaseBackend } from '../../config/environment';

// Import existing local services
import { StorageService } from '../StorageService';
import { AIWeightPredictionService } from '../AIWeightPredictionService';

// Import new backend adapters
import { SupabaseStorageAdapter } from './SupabaseStorageAdapter';
import { SupabaseAnimalAdapter } from './SupabaseAnimalAdapter';
import { SupabaseProfileAdapter } from './SupabaseProfileAdapter';
import { SupabaseHealthAdapter } from './SupabaseHealthAdapter';
import { SupabaseAuthAdapter } from './SupabaseAuthAdapter';
import { SupabaseJournalAdapter } from './SupabaseJournalAdapter';
import { SupabaseFinancialAdapter } from './SupabaseFinancialAdapter';

// Import local storage adapters
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { LocalAnimalAdapter } from './LocalAnimalAdapter';
import { LocalProfileAdapter } from './LocalProfileAdapter';
import { LocalHealthAdapter } from './LocalHealthAdapter';
import { LocalJournalAdapter } from './LocalJournalAdapter';
import { LocalFinancialAdapter } from './LocalFinancialAdapter';
import { LocalAuthAdapter } from './LocalAuthAdapter';

// Placeholder classes for missing adapters
class SupabaseWeightAdapter { [key: string]: any; }
class LocalWeightAdapter { [key: string]: any; }

// Import service interfaces
import {
  IStorageService,
  IAnimalService,
  IProfileService,
  IHealthService,
  IJournalService,
  IFinancialService,
  IAuthService,
  IWeightService,
} from '../interfaces/ServiceInterfaces';

// Re-export interfaces for backward compatibility
export {
  IStorageService,
  IAnimalService,
  IProfileService,
  IHealthService,
  IJournalService,
  IFinancialService,
  IAuthService,
  IWeightService,
};

/**
 * Service Factory Class
 * Creates appropriate service instances based on configuration
 */
export class ServiceFactory {
  private static instances: Map<string, any> = new Map();
  
  /**
   * Get storage service instance
   */
  static getStorageService(): IStorageService {
    const key = 'storage';
    if (!this.instances.has(key)) {
      const service = useSupabaseBackend() 
        ? new SupabaseStorageAdapter()
        : new LocalStorageAdapter();
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Get animal management service instance
   */
  static getAnimalService(): IAnimalService {
    const key = 'animal';
    if (!this.instances.has(key)) {
      const service = useSupabaseBackend()
        ? new SupabaseAnimalAdapter()
        : new LocalAnimalAdapter();
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Get profile management service instance
   */
  static getProfileService(): IProfileService {
    const key = 'profile';
    if (!this.instances.has(key)) {
      const service = useSupabaseBackend()
        ? new SupabaseProfileAdapter()
        : new LocalProfileAdapter();
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Get health records service instance
   */
  static getHealthService(): IHealthService {
    const key = 'health';
    if (!this.instances.has(key)) {
      const service = useSupabaseBackend()
        ? new SupabaseHealthAdapter()
        : new LocalHealthAdapter();
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Get journal service instance
   */
  static getJournalService(): IJournalService {
    const key = 'journal';
    if (!this.instances.has(key)) {
      const isBackend = useSupabaseBackend();
      console.log('🏭 ServiceFactory: Creating journal service, useSupabaseBackend:', isBackend);
      
      const service = isBackend
        ? new SupabaseJournalAdapter()
        : new LocalJournalAdapter();
        
      console.log('📝 Journal service created:', service.constructor.name);
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Get financial service instance
   */
  static getFinancialService(): IFinancialService {
    const key = 'financial';
    if (!this.instances.has(key)) {
      const isBackend = useSupabaseBackend();
      console.log('🏭 ServiceFactory: Creating financial service, useSupabaseBackend:', isBackend);
      
      const service = isBackend
        ? new SupabaseFinancialAdapter()
        : new LocalFinancialAdapter();
        
      console.log('💰 Financial service created:', service.constructor.name);
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Get authentication service instance
   */
  static getAuthService(): IAuthService {
    const key = 'auth';
    if (!this.instances.has(key)) {
      const service = useSupabaseBackend()
        ? new SupabaseAuthAdapter()
        : new LocalAuthAdapter();
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Get weight management service instance
   */
  static getWeightService(): IWeightService {
    const key = 'weight';
    if (!this.instances.has(key)) {
      // Weight service always uses AI prediction, but storage can vary
      const storageService = this.getStorageService();
      const service = useSupabaseBackend()
        ? new SupabaseWeightAdapter(storageService)
        : new LocalWeightAdapter(storageService);
      this.instances.set(key, service);
    }
    return this.instances.get(key);
  }
  
  /**
   * Clear all service instances (useful for testing or environment changes)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
  
  /**
   * Check if backend services are available
   */
  static isBackendAvailable(): boolean {
    return useSupabaseBackend();
  }
  
  /**
   * Get service status information
   */
  static getServiceStatus(): {
    backend: boolean;
    services: {
      name: string;
      type: 'local' | 'supabase';
      initialized: boolean;
    }[];
  } {
    const isBackend = useSupabaseBackend();
    const serviceNames = ['storage', 'animal', 'profile', 'health', 'journal', 'financial', 'auth', 'weight'];
    
    return {
      backend: isBackend,
      services: serviceNames.map(name => ({
        name,
        type: isBackend ? 'supabase' : 'local',
        initialized: this.instances.has(name),
      })),
    };
  }
  
  /**
   * Initialize all services (useful for preloading)
   */
  static async initializeAllServices(): Promise<void> {
    try {
      // Initialize core services
      this.getStorageService();
      this.getAnimalService();
      this.getProfileService();
      this.getHealthService();
      this.getJournalService();
      this.getFinancialService();
      this.getAuthService();
      this.getWeightService();
      
      if (config.development.enableLogging) {
        console.log('✅ All services initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }
  
  /**
   * Test connectivity to backend services
   */
  static async testConnectivity(): Promise<{
    backend: boolean;
    services: { [key: string]: boolean };
    errors: string[];
  }> {
    const results = {
      backend: useSupabaseBackend(),
      services: {} as { [key: string]: boolean },
      errors: [] as string[],
    };
    
    if (!results.backend) {
      return results; // Skip testing if using local services
    }
    
    try {
      // Test each service
      const services = [
        { name: 'profile', test: () => this.getProfileService().getCurrentProfile() },
        { name: 'animal', test: () => this.getAnimalService().getAnimals() },
        { name: 'health', test: () => this.getHealthService().getHealthRecords('test') },
        { name: 'journal', test: () => this.getJournalService().getJournalEntries() },
        { name: 'financial', test: () => this.getFinancialService().getExpenses() },
      ];
      
      for (const service of services) {
        try {
          await service.test();
          results.services[service.name] = true;
        } catch (error) {
          results.services[service.name] = false;
          results.errors.push(`${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.errors.push(`General connectivity error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return results;
  }
}

// Export individual service getters for convenience
export const getStorageService = () => ServiceFactory.getStorageService();
export const getAnimalService = () => ServiceFactory.getAnimalService();
export const getProfileService = () => ServiceFactory.getProfileService();
export const getHealthService = () => ServiceFactory.getHealthService();
export const getJournalService = () => ServiceFactory.getJournalService();
export const getFinancialService = () => ServiceFactory.getFinancialService();
export const getAuthService = () => ServiceFactory.getAuthService();
export const getWeightService = () => ServiceFactory.getWeightService();

// Development utilities
if (config.development.enableLogging) {
  console.log('🏭 ServiceFactory initialized with backend:', useSupabaseBackend() ? 'Supabase' : 'Local Storage');
}