// =========================================================================
// FFA Offline Mode Utility
// =========================================================================
// Provides offline functionality when database tables don't exist yet
// =========================================================================

import { storageService } from '../core/services/StorageService';
import { 
  FFADegreeProgress, 
  FFADegreeLevel, 
  EnhancedSAEProject,
  MotivationalContent,
  ENHANCED_FFA_DEGREE_REQUIREMENTS 
} from '../core/models/FFADegreeTracker';

/**
 * Check if we're in offline mode (database not available)
 */
export const isOfflineMode = async (): Promise<boolean> => {
  try {
    // Check if we have any indicator that database is not available
    const offlineMode = await storageService.loadData<boolean>('ffa_offline_mode');
    return offlineMode || false;
  } catch (error) {
    return false;
  }
};

/**
 * Set offline mode status
 */
export const setOfflineMode = async (offline: boolean): Promise<void> => {
  try {
    await storageService.saveData('ffa_offline_mode', offline);
    console.log(`📱 FFA offline mode ${offline ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error setting offline mode:', error);
  }
};

/**
 * Get sample degree progress for offline mode
 */
export const getSampleDegreeProgress = (userId: string): FFADegreeProgress[] => {
  return Object.keys(ENHANCED_FFA_DEGREE_REQUIREMENTS).map((level, index) => ({
    id: `sample_${level}_${userId}`,
    user_id: userId,
    degree_level: level as FFADegreeLevel,
    status: level === 'discovery' ? 'in_progress' : 'not_started',
    requirements_met: level === 'discovery' ? { 
      basic_agriculture: true, 
      ffa_history: false,
      sae_plan: false 
    } : {},
    completion_percentage: level === 'discovery' ? 33 : 0,
    advisor_approved: false,
    created_at: new Date(),
    updated_at: new Date()
  }));
};

/**
 * Get sample SAE projects for offline mode
 */
export const getSampleSAEProjects = (userId: string): EnhancedSAEProject[] => {
  return [
    {
      id: `sample_sae_1_${userId}`,
      user_id: userId,
      project_name: 'Sample Vegetable Garden',
      project_type: 'entrepreneurship',
      afnr_pathway: 'Plant Systems',
      start_date: new Date('2024-01-01'),
      target_hours: 100,
      actual_hours: 25,
      target_earnings: 500,
      actual_earnings: 125,
      sae_score: 214, // (25 * 3.56) + 125
      project_status: 'active',
      records: [],
      business_intelligence: {
        cost_per_hour: 5.0,
        profit_margin: 85.0,
        roi_percentage: 25.0,
        efficiency_metrics: {
          time_to_completion: 25,
          resource_utilization: 80,
          goal_achievement_rate: 25
        },
        educational_value: {
          competencies_gained: ['plant_science', 'business_management'],
          skill_development_score: 75,
          career_readiness_indicators: {
            problem_solving: 80,
            communication: 70,
            leadership: 60
          }
        }
      },
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    }
  ];
};

/**
 * Get sample motivational content for offline mode
 */
export const getSampleMotivationalContent = (): MotivationalContent => {
  return {
    id: 'sample_tip_1',
    content_type: 'tip',
    target_audience: 'student',
    content_title: 'Welcome to FFA!',
    content: 'Your FFA journey starts with the Discovery Degree. Focus on learning about agriculture and developing your SAE project plan. Every small step counts toward your agricultural future!',
    content_category: 'getting_started',
    context_tags: ['discovery', 'sae', 'motivation'],
    age_appropriate: true,
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
};

/**
 * Clear all offline data
 */
export const clearOfflineData = async (userId: string): Promise<void> => {
  try {
    await storageService.removeData(`ffa_degree_progress_${userId}`);
    await storageService.removeData(`sae_projects_${userId}`);
    await storageService.removeData('ffa_offline_mode');
    console.log('🧹 Cleared all FFA offline data');
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
};

/**
 * Initialize offline data for a user
 */
export const initializeOfflineData = async (userId: string): Promise<void> => {
  try {
    console.log('📱 Initializing FFA offline data for user:', userId);
    
    // Save sample data
    await storageService.saveData(`ffa_degree_progress_${userId}`, getSampleDegreeProgress(userId));
    await storageService.saveData(`sae_projects_${userId}`, getSampleSAEProjects(userId));
    await setOfflineMode(true);
    
    console.log('✅ FFA offline data initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing offline data:', error);
  }
};