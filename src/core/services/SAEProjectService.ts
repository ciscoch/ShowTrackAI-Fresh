// =========================================================================
// SAE Project Service - Enhanced Project Management
// =========================================================================
// Core service for managing Supervised Agricultural Experience projects
// Integrates with existing SAEFramework.ts and adds enhanced tracking
// =========================================================================

import { ServiceFactory } from './adapters/ServiceFactory';
import { storageService } from './StorageService';
import { 
  EnhancedSAEProject, 
  SAEProjectType, 
  SAEProjectStatus, 
  SAERecord, 
  SAERecordType,
  SAEBusinessIntelligence,
  calculateSAEScore,
  formatSAEScore 
} from '../models/FFADegreeTracker';
import { SAEProject } from '../models/FFAProfiles';

// =========================================================================
// SERVICE INTERFACES
// =========================================================================

export interface SAEProjectCreateRequest {
  user_id: string;
  project_name: string;
  project_type: SAEProjectType;
  afnr_pathway: string;
  start_date: Date;
  end_date?: Date;
  target_hours: number;
  target_earnings: number;
  description?: string;
  supervisor_info?: {
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
  };
}

export interface SAERecordCreateRequest {
  project_id: string;
  user_id: string;
  record_date: Date;
  activity_type: SAERecordType;
  description: string;
  hours_worked?: number;
  expense_amount?: number;
  income_amount?: number;
  category?: string;
  learning_objectives?: string[];
  competencies_demonstrated?: string[];
  supporting_documents?: string[];
}

export interface SAEProjectSummary {
  project: EnhancedSAEProject;
  totalRecords: number;
  recentActivity: SAERecord[];
  milestones: {
    hoursProgress: number;
    earningsProgress: number;
    goalAchievement: number;
  };
  insights: {
    costPerHour: number;
    profitMargin: number;
    efficiency: number;
    learningOutcomes: string[];
  };
}

export interface SAEProjectAnalytics {
  totalProjects: number;
  projectsByType: Record<SAEProjectType, number>;
  projectsByStatus: Record<SAEProjectStatus, number>;
  totalHours: number;
  totalEarnings: number;
  averageSAEScore: number;
  topPerformingProjects: Array<{
    project: EnhancedSAEProject;
    score: number;
    efficiency: number;
  }>;
  competencyDevelopment: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    hours: number;
    earnings: number;
    projects: number;
  }>;
}

// =========================================================================
// ENHANCED SAE PROJECT SERVICE
// =========================================================================

class SAEProjectService {
  private supabaseAdapter: any;

  constructor() {
    this.supabaseAdapter = ServiceFactory.getSupabaseAdapter();
  }

  // =========================================================================
  // PROJECT MANAGEMENT
  // =========================================================================

  /**
   * Create a new SAE project
   */
  async createProject(request: SAEProjectCreateRequest): Promise<EnhancedSAEProject> {
    try {
      const projectData: Partial<EnhancedSAEProject> = {
        user_id: request.user_id,
        project_name: request.project_name,
        project_type: request.project_type,
        afnr_pathway: request.afnr_pathway,
        start_date: request.start_date,
        end_date: request.end_date,
        target_hours: request.target_hours,
        target_earnings: request.target_earnings,
        actual_hours: 0,
        actual_earnings: 0,
        sae_score: 0,
        project_status: 'planning',
        records: [],
        business_intelligence: {
          cost_per_hour: 0,
          profit_margin: 0,
          roi_percentage: 0,
          efficiency_metrics: {
            time_to_completion: 0,
            resource_utilization: 0,
            goal_achievement_rate: 0
          },
          educational_value: {
            competencies_gained: [],
            skill_development_score: 0,
            career_readiness_indicators: {}
          }
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      let createdProject: EnhancedSAEProject;

      // Create in database
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.create('ffa_sae_projects', projectData);
        createdProject = result;
      } else {
        // Fallback to local storage
        const allProjects = await this.getAllProjects(request.user_id);
        createdProject = {
          id: Date.now().toString(),
          ...projectData
        } as EnhancedSAEProject;
        allProjects.push(createdProject);
        await storageService.saveData(`sae_projects_${request.user_id}`, allProjects);
      }

      // Update legacy FFA profile if exists
      try {
        await this.updateLegacyProfile(request.user_id, createdProject);
      } catch (error) {
        console.warn('Could not update legacy profile:', error);
      }

      // Track analytics
      await this.trackProjectEvent(request.user_id, {
        event_type: 'project_created',
        project_id: createdProject.id,
        project_type: request.project_type,
        afnr_pathway: request.afnr_pathway
      });

      return createdProject;
    } catch (error) {
      console.error('Error creating SAE project:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  async getAllProjects(userId: string): Promise<EnhancedSAEProject[]> {
    try {
      let projects: EnhancedSAEProject[] = [];

      // Try Supabase first
      if (this.supabaseAdapter) {
        try {
          const result = await this.supabaseAdapter.query('ffa_sae_projects', {
            filters: { user_id: userId },
            orderBy: { created_at: 'desc' }
          });
          projects = result || [];
        } catch (dbError) {
          console.warn('⚠️ SAE projects database query failed, using local storage:', dbError.message);
          // Fall through to local storage
        }
      }

      // Fallback to local storage
      if (projects.length === 0) {
        const localData = await storageService.loadData<EnhancedSAEProject[]>(`sae_projects_${userId}`);
        projects = localData || [];
      }

      return projects;
    } catch (error) {
      console.error('Error getting SAE projects:', error);
      return [];
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<EnhancedSAEProject | null> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.getById('ffa_sae_projects', projectId);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error getting project by ID:', error);
      return null;
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId: string, status: SAEProjectStatus): Promise<void> {
    try {
      const updateData = {
        project_status: status,
        updated_at: new Date()
      };

      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('ffa_sae_projects', projectId, updateData);
      }

      // Track analytics
      const project = await this.getProjectById(projectId);
      if (project) {
        await this.trackProjectEvent(project.user_id, {
          event_type: 'project_status_updated',
          project_id: projectId,
          old_status: project.project_status,
          new_status: status
        });
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }

  /**
   * Calculate and update project metrics
   */
  async updateProjectMetrics(projectId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) return;

      const records = await this.getProjectRecords(projectId);
      
      // Calculate totals
      const actualHours = records.reduce((sum, record) => sum + record.hours_worked, 0);
      const actualEarnings = records.reduce((sum, record) => sum + record.income_amount, 0);
      const totalExpenses = records.reduce((sum, record) => sum + record.expense_amount, 0);
      const saeScore = calculateSAEScore(actualHours, actualEarnings);

      // Calculate business intelligence
      const businessIntelligence: SAEBusinessIntelligence = {
        cost_per_hour: actualHours > 0 ? totalExpenses / actualHours : 0,
        profit_margin: actualEarnings > 0 ? ((actualEarnings - totalExpenses) / actualEarnings) * 100 : 0,
        roi_percentage: totalExpenses > 0 ? ((actualEarnings - totalExpenses) / totalExpenses) * 100 : 0,
        efficiency_metrics: {
          time_to_completion: this.calculateTimeToCompletion(project, records),
          resource_utilization: this.calculateResourceUtilization(project, records),
          goal_achievement_rate: this.calculateGoalAchievement(project, actualHours, actualEarnings)
        },
        educational_value: {
          competencies_gained: this.extractCompetencies(records),
          skill_development_score: this.calculateSkillDevelopment(records),
          career_readiness_indicators: this.calculateCareerReadiness(project, records)
        }
      };

      const updateData = {
        actual_hours: actualHours,
        actual_earnings: actualEarnings,
        sae_score: saeScore,
        business_intelligence: businessIntelligence,
        updated_at: new Date()
      };

      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('ffa_sae_projects', projectId, updateData);
      }
    } catch (error) {
      console.error('Error updating project metrics:', error);
      throw error;
    }
  }

  // =========================================================================
  // RECORD MANAGEMENT
  // =========================================================================

  /**
   * Add a new record to a project
   */
  async addRecord(request: SAERecordCreateRequest): Promise<SAERecord> {
    try {
      const recordData: Partial<SAERecord> = {
        project_id: request.project_id,
        user_id: request.user_id,
        record_date: request.record_date,
        activity_type: request.activity_type,
        description: request.description,
        hours_worked: request.hours_worked || 0,
        expense_amount: request.expense_amount || 0,
        income_amount: request.income_amount || 0,
        category: request.category || '',
        learning_objectives: request.learning_objectives || [],
        competencies_demonstrated: request.competencies_demonstrated || [],
        supporting_documents: request.supporting_documents || [],
        created_at: new Date(),
        updated_at: new Date()
      };

      let createdRecord: SAERecord;

      // Create in database
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.create('ffa_sae_records', recordData);
        createdRecord = result;
      } else {
        createdRecord = {
          id: Date.now().toString(),
          ...recordData
        } as SAERecord;
      }

      // Update project metrics
      await this.updateProjectMetrics(request.project_id);

      // Track analytics
      await this.trackProjectEvent(request.user_id, {
        event_type: 'record_added',
        project_id: request.project_id,
        activity_type: request.activity_type,
        hours_worked: request.hours_worked || 0,
        amount: (request.expense_amount || 0) + (request.income_amount || 0)
      });

      return createdRecord;
    } catch (error) {
      console.error('Error adding SAE record:', error);
      throw error;
    }
  }

  /**
   * Get all records for a project
   */
  async getProjectRecords(projectId: string): Promise<SAERecord[]> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('ffa_sae_records', {
          filters: { project_id: projectId },
          orderBy: { record_date: 'desc' }
        });
        return result || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting project records:', error);
      return [];
    }
  }

  /**
   * Get recent activity for a user
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<SAERecord[]> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('ffa_sae_records', {
          filters: { user_id: userId },
          orderBy: { created_at: 'desc' },
          limit
        });
        return result || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // =========================================================================
  // ANALYTICS AND REPORTING
  // =========================================================================

  /**
   * Get project summary with insights
   */
  async getProjectSummary(projectId: string): Promise<SAEProjectSummary | null> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) return null;

      const records = await this.getProjectRecords(projectId);
      const recentActivity = records.slice(0, 5);

      const milestones = {
        hoursProgress: project.target_hours > 0 ? (project.actual_hours / project.target_hours) * 100 : 0,
        earningsProgress: project.target_earnings > 0 ? (project.actual_earnings / project.target_earnings) * 100 : 0,
        goalAchievement: this.calculateGoalAchievement(project, project.actual_hours, project.actual_earnings)
      };

      const insights = {
        costPerHour: project.business_intelligence.cost_per_hour || 0,
        profitMargin: project.business_intelligence.profit_margin || 0,
        efficiency: project.business_intelligence.efficiency_metrics?.resource_utilization || 0,
        learningOutcomes: project.business_intelligence.educational_value?.competencies_gained || []
      };

      return {
        project,
        totalRecords: records.length,
        recentActivity,
        milestones,
        insights
      };
    } catch (error) {
      console.error('Error getting project summary:', error);
      return null;
    }
  }

  /**
   * Get SAE analytics for a user
   */
  async getUserSAEAnalytics(userId: string): Promise<SAEProjectAnalytics> {
    try {
      const projects = await this.getAllProjects(userId);
      const allRecords = await Promise.all(
        projects.map(p => this.getProjectRecords(p.id))
      );
      const flatRecords = allRecords.flat();

      const totalHours = projects.reduce((sum, p) => sum + p.actual_hours, 0);
      const totalEarnings = projects.reduce((sum, p) => sum + p.actual_earnings, 0);
      const averageSAEScore = projects.length > 0 
        ? projects.reduce((sum, p) => sum + p.sae_score, 0) / projects.length 
        : 0;

      // Project distribution by type
      const projectsByType: Record<SAEProjectType, number> = {
        placement: 0,
        entrepreneurship: 0,
        research: 0,
        exploratory: 0
      };

      // Project distribution by status
      const projectsByStatus: Record<SAEProjectStatus, number> = {
        planning: 0,
        active: 0,
        completed: 0,
        suspended: 0
      };

      projects.forEach(project => {
        projectsByType[project.project_type]++;
        projectsByStatus[project.project_status]++;
      });

      // Top performing projects
      const topPerformingProjects = projects
        .map(project => ({
          project,
          score: project.sae_score,
          efficiency: project.business_intelligence.efficiency_metrics?.resource_utilization || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Competency development
      const competencyDevelopment = this.aggregateCompetencies(flatRecords);

      // Monthly trends (simplified)
      const monthlyTrends = this.calculateMonthlyTrends(flatRecords);

      return {
        totalProjects: projects.length,
        projectsByType,
        projectsByStatus,
        totalHours,
        totalEarnings,
        averageSAEScore,
        topPerformingProjects,
        competencyDevelopment,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error getting SAE analytics:', error);
      throw error;
    }
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  private calculateTimeToCompletion(project: EnhancedSAEProject, records: SAERecord[]): number {
    if (project.project_status !== 'completed' || !project.end_date) return 0;
    
    const startTime = new Date(project.start_date).getTime();
    const endTime = new Date(project.end_date).getTime();
    return (endTime - startTime) / (1000 * 60 * 60 * 24); // days
  }

  private calculateResourceUtilization(project: EnhancedSAEProject, records: SAERecord[]): number {
    const totalExpenses = records.reduce((sum, r) => sum + r.expense_amount, 0);
    const totalEarnings = records.reduce((sum, r) => sum + r.income_amount, 0);
    
    if (totalExpenses === 0) return 0;
    return (totalEarnings / totalExpenses) * 100;
  }

  private calculateGoalAchievement(project: EnhancedSAEProject, actualHours: number, actualEarnings: number): number {
    const hoursGoal = project.target_hours > 0 ? (actualHours / project.target_hours) * 100 : 0;
    const earningsGoal = project.target_earnings > 0 ? (actualEarnings / project.target_earnings) * 100 : 0;
    
    return (hoursGoal + earningsGoal) / 2;
  }

  private extractCompetencies(records: SAERecord[]): string[] {
    const competencies = new Set<string>();
    records.forEach(record => {
      record.competencies_demonstrated.forEach(comp => competencies.add(comp));
    });
    return Array.from(competencies);
  }

  private calculateSkillDevelopment(records: SAERecord[]): number {
    const uniqueCompetencies = this.extractCompetencies(records);
    const totalActivities = records.length;
    
    // Score based on competency diversity and activity frequency
    return totalActivities > 0 ? (uniqueCompetencies.length / totalActivities) * 100 : 0;
  }

  private calculateCareerReadiness(project: EnhancedSAEProject, records: SAERecord[]): Record<string, any> {
    const competencies = this.extractCompetencies(records);
    const practicalExperience = records.filter(r => r.activity_type === 'labor').length;
    const businessExperience = records.filter(r => r.activity_type === 'income' || r.activity_type === 'expense').length;
    
    return {
      technical_skills: competencies.length,
      practical_experience: practicalExperience,
      business_experience: businessExperience,
      leadership_indicators: records.filter(r => r.description.toLowerCase().includes('lead')).length
    };
  }

  private aggregateCompetencies(records: SAERecord[]): Record<string, number> {
    const competencies: Record<string, number> = {};
    
    records.forEach(record => {
      record.competencies_demonstrated.forEach(comp => {
        competencies[comp] = (competencies[comp] || 0) + 1;
      });
    });
    
    return competencies;
  }

  private calculateMonthlyTrends(records: SAERecord[]): Array<{
    month: string;
    hours: number;
    earnings: number;
    projects: number;
  }> {
    const monthlyData: Record<string, { hours: number; earnings: number; projects: Set<string> }> = {};
    
    records.forEach(record => {
      const month = new Date(record.record_date).toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = { hours: 0, earnings: 0, projects: new Set() };
      }
      
      monthlyData[month].hours += record.hours_worked;
      monthlyData[month].earnings += record.income_amount;
      monthlyData[month].projects.add(record.project_id);
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        hours: data.hours,
        earnings: data.earnings,
        projects: data.projects.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async updateLegacyProfile(userId: string, project: EnhancedSAEProject): Promise<void> {
    try {
      // Dynamically import to avoid circular dependencies
      const { ffaProfileService } = await import('./FFAProfileService');
      
      const profile = await ffaProfileService.getStudentProfile(userId);
      if (!profile) return;

      const legacyProject = {
        id: project.id,
        title: project.project_name,
        type: project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1) as 'Entrepreneurship' | 'Placement' | 'Research/Experimentation' | 'Exploratory',
        category: project.afnr_pathway,
        startDate: project.start_date,
        endDate: project.end_date,
        isActive: project.project_status === 'active',
        supervisor: project.business_intelligence.educational_value?.competencies_gained?.[0] || '',
        description: `${project.project_type} project in ${project.afnr_pathway}`,
        goals: [`Target ${project.target_hours} hours`, `Earn $${project.target_earnings}`],
        achievements: [],
        financialSummary: {
          totalInvestment: 0,
          totalRevenue: project.actual_earnings,
          netProfit: project.actual_earnings
        }
      };

      const updatedProjects = profile.saeProjects.filter(p => p.id !== project.id);
      updatedProjects.push(legacyProject);

      await ffaProfileService.updateStudentProfile(userId, {
        saeProjects: updatedProjects
      });
    } catch (error) {
      console.warn('Could not update legacy profile (service unavailable):', error);
    }
  }

  private async trackProjectEvent(userId: string, eventData: any): Promise<void> {
    try {
      const analyticsEvent = {
        user_id: userId,
        event_type: 'sae_project',
        event_category: 'project_management',
        event_action: eventData.event_type,
        event_data: eventData,
        timestamp: new Date(),
        privacy_level: 'private'
      };

      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('ffa_analytics_events', analyticsEvent);
      }
    } catch (error) {
      console.warn('Could not track project event:', error);
    }
  }
}

// =========================================================================
// EXPORT SERVICE INSTANCE
// =========================================================================

export const saeProjectService = new SAEProjectService();
export type {
  SAEProjectCreateRequest,
  SAERecordCreateRequest,
  SAEProjectSummary,
  SAEProjectAnalytics
};