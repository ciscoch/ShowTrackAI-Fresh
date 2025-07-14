// =========================================================================
// FFA Degree Service - Enhanced Degree Progress Tracking
// =========================================================================
// Core service for managing FFA degree progress tracking with database integration
// Extends existing FFAProfileService with new progressive tracking features
// =========================================================================

import { ServiceFactory } from './adapters/ServiceFactory';
import { storageService } from './StorageService';
import { 
  FFADegreeProgress, 
  FFADegreeLevel, 
  FFADegreeStatus, 
  FFADegreeRequirement,
  EnhancedSAEProject,
  ENHANCED_FFA_DEGREE_REQUIREMENTS,
  calculateDegreeCompletionPercentage,
  getDegreeRequirementCount,
  getNextDegreeLevel,
  isFFADegreeLevel,
  isFFADegreeStatus 
} from '../models/FFADegreeTracker';
import { FFAStudentProfile } from '../models/FFAProfiles';

// =========================================================================
// SERVICE INTERFACES
// =========================================================================

export interface DegreeProgressUpdate {
  degree_level: FFADegreeLevel;
  requirement_key: string;
  completed: boolean;
  evidence?: string;
  notes?: string;
}

export interface DegreeAwardRequest {
  student_id: string;
  degree_level: FFADegreeLevel;
  advisor_notes?: string;
  evidence_documents?: string[];
}

export interface DegreeValidationResult {
  isValid: boolean;
  missingRequirements: string[];
  completionPercentage: number;
  nextSteps: string[];
  canApply: boolean;
}

export interface DegreeAnalytics {
  totalStudents: number;
  degreeDistribution: Record<FFADegreeLevel, number>;
  completionRates: Record<FFADegreeLevel, number>;
  averageCompletionTime: Record<FFADegreeLevel, number>;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    degreesEarned: FFADegreeLevel[];
    completionRate: number;
  }>;
}

// =========================================================================
// ENHANCED FFA DEGREE SERVICE
// =========================================================================

class FFADegreeService {
  private supabaseAdapter: any;

  constructor() {
    this.supabaseAdapter = ServiceFactory.getSupabaseAdapter();
  }

  // =========================================================================
  // DEGREE PROGRESS MANAGEMENT
  // =========================================================================

  /**
   * Initialize degree progress for a student
   */
  async initializeDegreeProgress(userId: string): Promise<void> {
    try {
      console.log('🔧 Attempting to initialize degree progress for user:', userId);
      
      // First check if we can even access the database
      if (!this.supabaseAdapter) {
        console.log('📱 No Supabase adapter - using local storage mode');
        await this.initializeLocalProgress(userId);
        return;
      }

      // Try a simple database connection test first
      try {
        // Check if progress already exists
        const existing = await this.getDegreeProgress(userId);
        if (existing.length > 0) {
          console.log('✅ Degree progress already exists, skipping initialization');
          return; // Already initialized
        }
      } catch (error) {
        console.warn('⚠️ Database not accessible, falling back to local storage');
        await this.initializeLocalProgress(userId);
        return;
      }

      // Create progress records for all degree levels
      const degreeProgressRecords: Partial<FFADegreeProgress>[] = Object.keys(ENHANCED_FFA_DEGREE_REQUIREMENTS)
        .map(level => ({
          user_id: userId,
          degree_level: level as FFADegreeLevel,
          status: level === 'discovery' ? 'in_progress' : 'not_started',
          requirements_met: {},
          completion_percentage: 0,
          advisor_approved: false
        }));

      // Insert into database
      if (this.supabaseAdapter) {
        for (const record of degreeProgressRecords) {
          await this.supabaseAdapter.create('ffa_degree_progress', record);
        }
      }

      // Also store locally
      await storageService.saveData(`ffa_degree_progress_${userId}`, degreeProgressRecords);
    } catch (error) {
      console.error('Error initializing degree progress:', error);
      throw error;
    }
  }

  /**
   * Get all degree progress for a student
   */
  async getDegreeProgress(userId: string): Promise<FFADegreeProgress[]> {
    try {
      let progressRecords: FFADegreeProgress[] = [];

      // Try to load from Supabase first
      if (this.supabaseAdapter) {
        try {
          const result = await this.supabaseAdapter.query('ffa_degree_progress', {
            filters: { user_id: userId },
            orderBy: { degree_level: 'asc' }
          });
          progressRecords = result || [];
        } catch (dbError) {
          console.warn('⚠️ Database query failed, trying local storage:', dbError.message);
          // Don't throw here, fall through to local storage
        }
      }

      // Fallback to local storage
      if (progressRecords.length === 0) {
        const localData = await storageService.loadData<FFADegreeProgress[]>(`ffa_degree_progress_${userId}`);
        progressRecords = localData || [];
      }

      // If no progress exists, return empty array instead of initializing (to prevent loops)
      if (progressRecords.length === 0) {
        console.log('📄 No degree progress found, returning empty array (database setup required)');
        return [];
      }

      return progressRecords;
    } catch (error) {
      console.error('Error getting degree progress:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Get progress for a specific degree level
   */
  async getDegreeProgressByLevel(userId: string, degreeLevel: FFADegreeLevel): Promise<FFADegreeProgress | null> {
    const allProgress = await this.getDegreeProgress(userId);
    return allProgress.find(p => p.degree_level === degreeLevel) || null;
  }

  /**
   * Update degree requirement completion
   */
  async updateDegreeRequirement(userId: string, update: DegreeProgressUpdate): Promise<void> {
    try {
      const progress = await this.getDegreeProgressByLevel(userId, update.degree_level);
      if (!progress) {
        throw new Error('Degree progress not found');
      }

      // Update requirements met
      const updatedRequirements = {
        ...progress.requirements_met,
        [update.requirement_key]: update.completed
      };

      // Calculate new completion percentage
      const totalRequirements = getDegreeRequirementCount(update.degree_level);
      const completionPercentage = calculateDegreeCompletionPercentage(updatedRequirements, totalRequirements);

      // Update status based on completion
      let status: FFADegreeStatus = progress.status;
      if (completionPercentage === 100 && status !== 'completed') {
        status = 'completed';
      } else if (completionPercentage > 0 && status === 'not_started') {
        status = 'in_progress';
      }

      const updateData = {
        requirements_met: updatedRequirements,
        completion_percentage: completionPercentage,
        status,
        updated_at: new Date()
      };

      // Update in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('ffa_degree_progress', progress.id, updateData);
      }

      // Update local storage
      const allProgress = await this.getDegreeProgress(userId);
      const index = allProgress.findIndex(p => p.degree_level === update.degree_level);
      if (index !== -1) {
        allProgress[index] = { ...allProgress[index], ...updateData };
        await storageService.saveData(`ffa_degree_progress_${userId}`, allProgress);
      }

      // Track analytics event
      await this.trackDegreeProgressEvent(userId, {
        event_type: 'requirement_updated',
        degree_level: update.degree_level,
        requirement_key: update.requirement_key,
        completed: update.completed,
        completion_percentage: completionPercentage
      });
    } catch (error) {
      console.error('Error updating degree requirement:', error);
      throw error;
    }
  }

  /**
   * Validate degree requirements for application
   */
  async validateDegreeRequirements(userId: string, degreeLevel: FFADegreeLevel): Promise<DegreeValidationResult> {
    try {
      const progress = await this.getDegreeProgressByLevel(userId, degreeLevel);
      if (!progress) {
        return {
          isValid: false,
          missingRequirements: ['Degree progress not initialized'],
          completionPercentage: 0,
          nextSteps: ['Initialize degree progress'],
          canApply: false
        };
      }

      const degreeRequirements = ENHANCED_FFA_DEGREE_REQUIREMENTS[degreeLevel];
      const requirementKeys = Object.keys(degreeRequirements.requirements);
      const missingRequirements: string[] = [];
      const nextSteps: string[] = [];

      // Check each requirement
      for (const reqKey of requirementKeys) {
        const requirement = degreeRequirements.requirements[reqKey];
        const isCompleted = progress.requirements_met[reqKey] || false;

        if (!isCompleted) {
          missingRequirements.push(requirement.title);
          
          // Add specific next steps
          if (requirement.type === 'hour_based') {
            nextSteps.push(`Complete ${requirement.min_hours} hours for ${requirement.title}`);
          } else if (requirement.type === 'project_based') {
            nextSteps.push(`Submit project for ${requirement.title}`);
          } else if (requirement.type === 'activity') {
            nextSteps.push(`Participate in ${requirement.title}`);
          } else {
            nextSteps.push(`Complete ${requirement.title}`);
          }
        }
      }

      const isValid = missingRequirements.length === 0;
      const canApply = isValid && progress.completion_percentage === 100;

      return {
        isValid,
        missingRequirements,
        completionPercentage: progress.completion_percentage,
        nextSteps,
        canApply
      };
    } catch (error) {
      console.error('Error validating degree requirements:', error);
      throw error;
    }
  }

  /**
   * Award degree to student
   */
  async awardDegree(request: DegreeAwardRequest): Promise<boolean> {
    try {
      const validation = await this.validateDegreeRequirements(request.student_id, request.degree_level);
      
      if (!validation.canApply) {
        throw new Error(`Cannot award degree: ${validation.missingRequirements.join(', ')}`);
      }

      const progress = await this.getDegreeProgressByLevel(request.student_id, request.degree_level);
      if (!progress) {
        throw new Error('Degree progress not found');
      }

      const updateData = {
        status: 'awarded' as FFADegreeStatus,
        awarded_date: new Date(),
        advisor_approved: true,
        advisor_notes: request.advisor_notes || '',
        updated_at: new Date()
      };

      // Update in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('ffa_degree_progress', progress.id, updateData);
      }

      // Update local storage
      const allProgress = await this.getDegreeProgress(request.student_id);
      const index = allProgress.findIndex(p => p.degree_level === request.degree_level);
      if (index !== -1) {
        allProgress[index] = { ...allProgress[index], ...updateData };
        await storageService.saveData(`ffa_degree_progress_${request.student_id}`, allProgress);
      }

      // Update legacy FFA profile if exists
      try {
        // Dynamically import to avoid circular dependencies
        const { ffaProfileService } = await import('./FFAProfileService');
        
        const studentProfile = await ffaProfileService.getStudentProfile(request.student_id);
        if (studentProfile) {
          const degreeUpdate = {
            ...studentProfile.degrees,
            [request.degree_level]: { earned: true, dateEarned: new Date() }
          };
          await ffaProfileService.updateStudentProfile(request.student_id, { degrees: degreeUpdate });
        }
      } catch (profileError) {
        console.warn('Could not update legacy profile (service unavailable):', profileError);
      }

      // Track analytics event
      await this.trackDegreeProgressEvent(request.student_id, {
        event_type: 'degree_awarded',
        degree_level: request.degree_level,
        awarded_date: new Date()
      });

      // Initialize next degree level if applicable
      const nextLevel = getNextDegreeLevel(request.degree_level);
      if (nextLevel) {
        const nextProgress = await this.getDegreeProgressByLevel(request.student_id, nextLevel);
        if (nextProgress && nextProgress.status === 'not_started') {
          await this.updateDegreeRequirement(request.student_id, {
            degree_level: nextLevel,
            requirement_key: 'previous_degree',
            completed: true
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error awarding degree:', error);
      throw error;
    }
  }

  // =========================================================================
  // ANALYTICS AND REPORTING
  // =========================================================================

  /**
   * Get degree analytics for organization
   */
  async getDegreeAnalytics(organizationId?: string): Promise<DegreeAnalytics> {
    try {
      let allProgress: FFADegreeProgress[] = [];

      if (this.supabaseAdapter) {
        // Get all progress records
        const result = await this.supabaseAdapter.query('ffa_degree_progress', {
          filters: organizationId ? { organization_id: organizationId } : {},
          orderBy: { created_at: 'desc' }
        });
        allProgress = result || [];
      }

      // Calculate analytics
      const totalStudents = new Set(allProgress.map(p => p.user_id)).size;
      
      const degreeDistribution: Record<FFADegreeLevel, number> = {
        discovery: 0,
        greenhand: 0,
        chapter: 0,
        state: 0,
        american: 0
      };

      const completionRates: Record<FFADegreeLevel, number> = {
        discovery: 0,
        greenhand: 0,
        chapter: 0,
        state: 0,
        american: 0
      };

      // Count degrees by level
      allProgress.forEach(progress => {
        if (progress.status === 'awarded') {
          degreeDistribution[progress.degree_level]++;
        }
      });

      // Calculate completion rates
      Object.keys(degreeDistribution).forEach(level => {
        const degreeLevel = level as FFADegreeLevel;
        const totalAttempting = allProgress.filter(p => p.degree_level === degreeLevel).length;
        completionRates[degreeLevel] = totalAttempting > 0 
          ? (degreeDistribution[degreeLevel] / totalAttempting) * 100 
          : 0;
      });

      // Calculate average completion time (simplified)
      const averageCompletionTime: Record<FFADegreeLevel, number> = {
        discovery: 90,  // days
        greenhand: 180,
        chapter: 365,
        state: 730,
        american: 1095
      };

      // Get top performers
      const topPerformers = await this.getTopPerformers(10);

      return {
        totalStudents,
        degreeDistribution,
        completionRates,
        averageCompletionTime,
        topPerformers
      };
    } catch (error) {
      console.error('Error getting degree analytics:', error);
      throw error;
    }
  }

  /**
   * Get top performing students
   */
  async getTopPerformers(limit: number = 10): Promise<Array<{
    studentId: string;
    studentName: string;
    degreesEarned: FFADegreeLevel[];
    completionRate: number;
  }>> {
    try {
      const allProgress = await this.getAllDegreeProgress();
      const studentStats = new Map<string, {
        degreesEarned: FFADegreeLevel[];
        totalProgress: number;
        completedCount: number;
      }>();

      // Aggregate by student
      allProgress.forEach(progress => {
        const existing = studentStats.get(progress.user_id) || {
          degreesEarned: [],
          totalProgress: 0,
          completedCount: 0
        };

        existing.totalProgress += progress.completion_percentage;
        if (progress.status === 'awarded') {
          existing.degreesEarned.push(progress.degree_level);
          existing.completedCount++;
        }

        studentStats.set(progress.user_id, existing);
      });

      // Convert to array and sort
      const performers = Array.from(studentStats.entries())
        .map(([userId, stats]) => ({
          studentId: userId,
          studentName: `Student ${userId.slice(0, 8)}`, // Would get actual name from profile
          degreesEarned: stats.degreesEarned,
          completionRate: stats.totalProgress / 5 // 5 degree levels
        }))
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, limit);

      return performers;
    } catch (error) {
      console.error('Error getting top performers:', error);
      return [];
    }
  }

  /**
   * Get student progress summary
   */
  async getStudentProgressSummary(userId: string): Promise<{
    currentDegreeLevel: FFADegreeLevel;
    overallProgress: number;
    degreesEarned: FFADegreeLevel[];
    nextMilestone: {
      degree: FFADegreeLevel;
      nextRequirement: string;
      daysEstimated: number;
    } | null;
  }> {
    try {
      const allProgress = await this.getDegreeProgress(userId);
      const degreesEarned = allProgress
        .filter(p => p.status === 'awarded')
        .map(p => p.degree_level);

      const inProgress = allProgress.find(p => p.status === 'in_progress');
      const currentDegreeLevel = inProgress?.degree_level || 'discovery';

      const overallProgress = allProgress.reduce((sum, p) => sum + p.completion_percentage, 0) / allProgress.length;

      // Find next milestone
      const nextMilestone = await this.getNextMilestone(userId, currentDegreeLevel);

      return {
        currentDegreeLevel,
        overallProgress,
        degreesEarned,
        nextMilestone
      };
    } catch (error) {
      console.error('Error getting student progress summary:', error);
      throw error;
    }
  }

  /**
   * Initialize local degree progress when database is not available
   */
  private async initializeLocalProgress(userId: string): Promise<void> {
    try {
      console.log('📱 Initializing local FFA degree progress for user:', userId);
      
      const degreeProgressRecords: FFADegreeProgress[] = Object.keys(ENHANCED_FFA_DEGREE_REQUIREMENTS)
        .map((level, index) => ({
          id: `local_${level}_${userId}`,
          user_id: userId,
          degree_level: level as FFADegreeLevel,
          status: level === 'discovery' ? 'in_progress' : 'not_started',
          requirements_met: {},
          completion_percentage: 0,
          advisor_approved: false,
          created_at: new Date(),
          updated_at: new Date()
        }));

      await storageService.saveData(`ffa_degree_progress_${userId}`, degreeProgressRecords);
      console.log('✅ Local FFA degree progress initialized');
    } catch (error) {
      console.error('❌ Error initializing local progress:', error);
    }
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  private async getAllDegreeProgress(): Promise<FFADegreeProgress[]> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('ffa_degree_progress', {
          orderBy: { created_at: 'desc' }
        });
        return result || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting all degree progress:', error);
      return [];
    }
  }

  private async getNextMilestone(userId: string, currentLevel: FFADegreeLevel): Promise<{
    degree: FFADegreeLevel;
    nextRequirement: string;
    daysEstimated: number;
  } | null> {
    try {
      const progress = await this.getDegreeProgressByLevel(userId, currentLevel);
      if (!progress) return null;

      const requirements = ENHANCED_FFA_DEGREE_REQUIREMENTS[currentLevel].requirements;
      const uncompletedReqs = Object.keys(requirements).filter(key => 
        !progress.requirements_met[key]
      );

      if (uncompletedReqs.length > 0) {
        const nextReq = requirements[uncompletedReqs[0]];
        return {
          degree: currentLevel,
          nextRequirement: nextReq.title,
          daysEstimated: this.estimateCompletionDays(nextReq.type)
        };
      }

      // Current level complete, check next level
      const nextLevel = getNextDegreeLevel(currentLevel);
      if (nextLevel) {
        const nextLevelReqs = ENHANCED_FFA_DEGREE_REQUIREMENTS[nextLevel].requirements;
        const firstReq = Object.values(nextLevelReqs)[0];
        return {
          degree: nextLevel,
          nextRequirement: firstReq.title,
          daysEstimated: this.estimateCompletionDays(firstReq.type)
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting next milestone:', error);
      return null;
    }
  }

  private estimateCompletionDays(requirementType: string): number {
    switch (requirementType) {
      case 'activity': return 30;
      case 'hour_based': return 60;
      case 'project_based': return 90;
      case 'knowledge_based': return 14;
      default: return 30;
    }
  }

  private async trackDegreeProgressEvent(userId: string, eventData: any): Promise<void> {
    try {
      const analyticsEvent = {
        user_id: userId,
        event_type: 'degree_progress',
        event_category: 'ffa_tracking',
        event_action: eventData.event_type,
        event_data: eventData,
        timestamp: new Date(),
        privacy_level: 'private'
      };

      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('ffa_analytics_events', analyticsEvent);
      }
    } catch (error) {
      console.warn('Could not track analytics event:', error);
    }
  }
}

// =========================================================================
// EXPORT SERVICE INSTANCE
// =========================================================================

export const ffaDegreeService = new FFADegreeService();
export type { 
  DegreeProgressUpdate, 
  DegreeAwardRequest, 
  DegreeValidationResult, 
  DegreeAnalytics 
};