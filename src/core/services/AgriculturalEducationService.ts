/**
 * Agricultural Education Service
 * Comprehensive platform integration for ShowTrackAI-Fresh
 * 
 * Features:
 * - Zep Memory integration for personalized learning
 * - N8N workflow automation
 * - AI-powered health and weight analysis
 * - SAE project management
 * - Educational progress tracking
 * - Feed efficiency analytics
 */

import { ZepMemoryService } from './ZepMemoryService';
import { N8nWorkflowService } from './N8nWorkflowService';
import { AiAnalysisService } from './AiAnalysisService';
import { SAEProjectService } from './SAEProjectService';
import { EducatorDashboardService } from './EducatorDashboardService';
import { FeedEfficiencyService } from './FeedEfficiencyService';
import { HealthRecordService } from './HealthRecordService';
import { CompetencyTrackingService } from './CompetencyTrackingService';
import { getSupabaseClient } from '../../../backend/api/clients/supabase';

export interface AgriculturalEducationConfig {
  zepApiKey: string;
  zepBaseUrl: string;
  n8nWebhookUrl: string;
  openaiApiKey: string;
  enableRealTimeSync: boolean;
  enableOfflineMode: boolean;
  enableAiAnalysis: boolean;
  enableEducatorDashboard: boolean;
}

export interface StudentProfile {
  id: string;
  userId: string;
  organizationId?: string;
  role: 'student' | 'teacher' | 'veterinarian' | 'admin' | 'parent';
  fullName: string;
  age?: number;
  gradeLevel?: number;
  privacyLevel: 'minimal' | 'standard' | 'enhanced';
  ffaChapter?: string;
  ffaMemberId?: string;
  ffaProgramActive: boolean;
  parentalConsentStatus?: string;
  profileData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SAEProject {
  id: string;
  userId: string;
  projectName: string;
  projectType: 'entrepreneurship' | 'placement' | 'research' | 'school_based' | 'service_learning';
  category: 'animal_systems' | 'plant_systems' | 'power_systems' | 'natural_resources' | 'food_systems';
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  totalHoursGoal: number;
  completedHours: number;
  investmentAmount: number;
  revenueAmount: number;
  standardsAlignment: string[];
  supervisorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  recordedBy: string;
  observationType: 'routine' | 'illness' | 'treatment' | 'emergency' | 'unknown';
  observationDate: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bodyConditionScore?: number;
  appetiteScore?: number;
  activityLevel?: number;
  symptoms?: string[];
  detailedNotes?: string;
  severityLevel?: number;
  conditionStatus: 'identified' | 'unknown' | 'pending_review' | 'expert_reviewed';
  helpRequested?: string[];
  expertResponse?: any;
  photos?: string[];
  aiAnalysis?: any;
  weatherConditions?: any;
  createdAt: string;
  updatedAt: string;
}

export interface FeedAnalytics {
  id: string;
  animalId: string;
  calculationDate: string;
  periodDays: number;
  totalFeedConsumed: number;
  totalFeedCost: number;
  weightGain: number;
  feedConversionRatio: number;
  costPerLbGain: number;
  averageDailyGain: number;
  efficiencyScore: number;
  recommendations?: string[];
  trends?: any;
  createdAt: string;
}

export interface CompetencyAssessment {
  id: string;
  userId: string;
  standardCode: string;
  standardDescription: string;
  assessmentDate: string;
  proficiencyLevel: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  evidenceUrls?: string[];
  assessorId?: string;
  assessmentNotes?: string;
  createdAt: string;
}

export interface KnowledgeGraphEntity {
  id: string;
  userId: string;
  entityType: 'concept' | 'skill' | 'standard' | 'achievement';
  entityName: string;
  description?: string;
  metadata?: any;
  createdAt: string;
}

export interface KnowledgeGraphRelationship {
  id: string;
  userId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  strength: number;
  validFrom: string;
  validUntil?: string;
  metadata?: any;
  createdAt: string;
}

export class AgriculturalEducationService {
  private zepMemoryService: ZepMemoryService;
  private n8nWorkflowService: N8nWorkflowService;
  private aiAnalysisService: AiAnalysisService;
  private saeProjectService: SAEProjectService;
  private educatorDashboardService: EducatorDashboardService;
  private feedEfficiencyService: FeedEfficiencyService;
  private healthRecordService: HealthRecordService;
  private competencyTrackingService: CompetencyTrackingService;
  private config: AgriculturalEducationConfig;

  constructor(config: AgriculturalEducationConfig) {
    this.config = config;
    this.initializeServices();
  }

  private initializeServices(): void {
    this.zepMemoryService = new ZepMemoryService(this.config.zepApiKey, this.config.zepBaseUrl);
    this.n8nWorkflowService = new N8nWorkflowService(this.config.n8nWebhookUrl);
    this.aiAnalysisService = new AiAnalysisService(this.config.openaiApiKey);
    this.saeProjectService = new SAEProjectService();
    this.educatorDashboardService = new EducatorDashboardService();
    this.feedEfficiencyService = new FeedEfficiencyService();
    this.healthRecordService = new HealthRecordService();
    this.competencyTrackingService = new CompetencyTrackingService();
  }

  // ===== STUDENT MANAGEMENT =====
  async createStudentProfile(profileData: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;

      // Initialize user in Zep memory system
      await this.zepMemoryService.initializeUserMemory(data.id, {
        fullName: data.full_name,
        role: data.role,
        gradeLevel: data.grade_level,
        ffaChapter: data.ffa_chapter,
        learningStyle: 'visual', // Default, will be updated based on activity
        interests: [],
        strengths: [],
        areasForImprovement: []
      });

      // Trigger N8N workflow for new student onboarding
      await this.n8nWorkflowService.triggerStudentOnboarding({
        studentId: data.id,
        studentName: data.full_name,
        organizationId: data.organization_id,
        gradeLevel: data.grade_level,
        ffaChapter: data.ffa_chapter
      });
      
      // Trigger knowledge graph analysis for new student
      setTimeout(async () => {
        await this.n8nWorkflowService.triggerKnowledgeGraphAnalysis(data.id, {
          force_analysis: true,
          include_recommendations: true
        });
      }, 5000); // Delay to allow initial setup

      return data;
    } catch (error) {
      console.error('Error creating student profile:', error);
      throw error;
    }
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      return null;
    }
  }

  async updateStudentProfile(userId: string, updates: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update Zep memory with new profile data
      await this.zepMemoryService.updateUserContext(userId, updates);

      return data;
    } catch (error) {
      console.error('Error updating student profile:', error);
      throw error;
    }
  }

  // ===== SAE PROJECT MANAGEMENT =====
  async createSAEProject(projectData: Partial<SAEProject>): Promise<SAEProject> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('sae_projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      // Add to Zep memory as a significant learning context
      await this.zepMemoryService.addMemoryFact(projectData.userId!, {
        fact: `Started SAE project: ${projectData.projectName}`,
        category: 'sae_project',
        importance: 0.9,
        metadata: {
          projectType: projectData.projectType,
          category: projectData.category,
          startDate: projectData.startDate
        }
      });

      // Trigger N8N workflow for SAE project creation
      await this.n8nWorkflowService.triggerSAEProjectCreated({
        projectId: data.id,
        studentId: data.user_id,
        projectType: data.project_type,
        category: data.category,
        supervisorId: projectData.supervisorId
      });
      
      // Generate initial recommendations for the new project
      await this.n8nWorkflowService.generateRecommendations({
        student_id: data.user_id,
        trigger: 'completion_milestone',
        context: {
          sae_project_id: data.id,
          recent_activities: ['project_creation'],
          learning_goals: [`Complete ${data.project_type} SAE project in ${data.category}`]
        }
      });

      return data;
    } catch (error) {
      console.error('Error creating SAE project:', error);
      throw error;
    }
  }

  async logSAEActivity(activityData: {
    projectId: string;
    activityDate: string;
    startTime?: string;
    endTime?: string;
    durationHours: number;
    activityType: string;
    description: string;
    learningObjectives?: string[];
    skillsDemonstrated?: string[];
    standardsMet?: string[];
    reflection?: string;
    evidenceUrls?: string[];
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('sae_activities')
        .insert([activityData])
        .select()
        .single();

      if (error) throw error;

      // Get project info for context
      const { data: project } = await supabase
        .from('sae_projects')
        .select('user_id, project_name')
        .eq('id', activityData.projectId)
        .single();

      if (project) {
        // Add to Zep memory for learning progression
        await this.zepMemoryService.addMemoryFact(project.user_id, {
          fact: `Completed SAE activity: ${activityData.activityType}`,
          category: 'sae_activity',
          importance: 0.7,
          metadata: {
            projectName: project.project_name,
            duration: activityData.durationHours,
            skills: activityData.skillsDemonstrated,
            standards: activityData.standardsMet,
            reflection: activityData.reflection
          }
        });

        // Update competency tracking
        if (activityData.standardsMet) {
          await this.competencyTrackingService.updateCompetencies(
            project.user_id,
            activityData.standardsMet,
            activityData.evidenceUrls || []
          );
        }

        // Trigger N8N learning event processor for SAE activity
        await this.n8nWorkflowService.processSAEActivity(
          project.user_id,
          activityData.detailedDescription || `SAE Activity: ${activityData.activityType}`,
          {
            sae_project_id: project.id,
            competency: this.mapActivityToCompetency(activityData.activityType),
            supervisor: activityData.supervisorId
          }
        );
        
        // Also trigger legacy workflow
        await this.n8nWorkflowService.triggerWorkflow('sae-activity-logged', {
          activityId: data.id,
          studentId: project.user_id,
          activityType: activityData.activityType,
          duration: activityData.durationHours,
          skillsDemonstrated: activityData.skillsDemonstrated
        });
      }

      return data;
    } catch (error) {
      console.error('Error logging SAE activity:', error);
      throw error;
    }
  }

  async getSAEProjects(userId: string): Promise<SAEProject[]> {
    try {
      const { data, error } = await supabase
        .from('sae_projects')
        .select(`
          *,
          sae_activities(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching SAE projects:', error);
      return [];
    }
  }

  // ===== HEALTH RECORD MANAGEMENT =====
  async createHealthRecord(recordData: Partial<HealthRecord>): Promise<HealthRecord> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .insert([recordData])
        .select()
        .single();

      if (error) throw error;

      // AI Analysis if photos are provided
      if (this.config.enableAiAnalysis && recordData.photos && recordData.photos.length > 0) {
        const aiAnalysis = await this.aiAnalysisService.analyzeHealthPhoto(
          recordData.photos[0],
          recordData.symptoms || [],
          recordData.detailedNotes || ''
        );

        // Update record with AI analysis
        await supabase
          .from('health_records')
          .update({ ai_analysis: aiAnalysis })
          .eq('id', data.id);

        data.aiAnalysis = aiAnalysis;
      }

      // Add to Zep memory for health pattern tracking
      await this.zepMemoryService.addMemoryFact(recordData.recordedBy!, {
        fact: `Recorded health observation: ${recordData.observationType}`,
        category: 'health_record',
        importance: recordData.severityLevel ? recordData.severityLevel * 0.2 : 0.5,
        metadata: {
          animalId: recordData.animalId,
          observationType: recordData.observationType,
          symptoms: recordData.symptoms,
          severityLevel: recordData.severityLevel,
          conditionStatus: recordData.conditionStatus
        }
      });

      // Trigger N8N workflow for health monitoring using cloud workflow
      await this.n8nWorkflowService.processHealthCheckEvent(
        recordData.recordedBy || 'unknown_user',
        recordData.detailedNotes || `Health observation: ${data.observation_type}`,
        {
          animal_id: data.animal_id,
          competency: 'AS.07.01', // Health management practices
          supervisor: recordData.supervisorId
        }
      );
      
      // Also trigger legacy workflow for backward compatibility
      await this.n8nWorkflowService.triggerWorkflow('health-record-created', {
        recordId: data.id,
        animalId: data.animal_id,
        observationType: data.observation_type,
        severityLevel: data.severity_level,
        conditionStatus: data.condition_status,
        symptoms: data.symptoms
      });

      return data;
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  }

  async getHealthRecords(animalId: string, limit: number = 10): Promise<HealthRecord[]> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          recorded_by:users(full_name),
          treatments(*)
        `)
        .eq('animal_id', animalId)
        .order('observation_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching health records:', error);
      return [];
    }
  }

  // ===== FEED EFFICIENCY ANALYTICS =====
  async calculateFeedEfficiency(animalId: string): Promise<FeedAnalytics> {
    try {
      const analytics = await this.feedEfficiencyService.calculateFCR(animalId);
      
      // Save to database
      const { data, error } = await supabase
        .from('feed_analytics')
        .insert([analytics])
        .select()
        .single();

      if (error) throw error;

      // Get animal owner for memory context
      const { data: animal } = await supabase
        .from('animals')
        .select('user_id, name')
        .eq('id', animalId)
        .single();

      if (animal) {
        // Add to Zep memory for feed management learning
        await this.zepMemoryService.addMemoryFact(animal.user_id, {
          fact: `Feed efficiency calculated: FCR ${analytics.feedConversionRatio}`,
          category: 'feed_efficiency',
          importance: 0.8,
          metadata: {
            animalId: animalId,
            animalName: animal.name,
            fcr: analytics.feedConversionRatio,
            efficiencyScore: analytics.efficiencyScore,
            averageDailyGain: analytics.averageDailyGain,
            costPerLbGain: analytics.costPerLbGain
          }
        });

        // Trigger N8N learning event for feed efficiency analysis
        await this.n8nWorkflowService.processLearningEvent({
          student_id: animal.user_id,
          event_type: 'feeding_record',
          content: `Feed efficiency analysis: FCR ${analytics.feedConversionRatio.toFixed(2)}, Efficiency Score: ${analytics.efficiencyScore}%. Cost per lb gain: $${analytics.costPerLbGain.toFixed(2)}`,
          animal_id: animalId,
          competency: 'AS.06.01' // Animal nutrition and feed management
        });
        
        // Also trigger legacy workflow
        await this.n8nWorkflowService.triggerFeedEfficiencyCalculated({
          animalId: animalId,
          fcr: analytics.feedConversionRatio,
          efficiencyScore: analytics.efficiencyScore,
          studentId: animal.user_id
        });
      }

      return data;
    } catch (error) {
      console.error('Error calculating feed efficiency:', error);
      throw error;
    }
  }

  async getFeedAnalytics(animalId: string, limit: number = 30): Promise<FeedAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('feed_analytics')
        .select('*')
        .eq('animal_id', animalId)
        .order('calculation_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feed analytics:', error);
      return [];
    }
  }

  // ===== COMPETENCY TRACKING =====
  async assessCompetency(assessmentData: Partial<CompetencyAssessment>): Promise<CompetencyAssessment> {
    try {
      const { data, error } = await supabase
        .from('competency_assessments')
        .insert([assessmentData])
        .select()
        .single();

      if (error) throw error;

      // Add to Zep memory for skill progression tracking
      await this.zepMemoryService.addMemoryFact(assessmentData.userId!, {
        fact: `Competency assessed: ${assessmentData.standardCode} - ${assessmentData.proficiencyLevel}`,
        category: 'competency_assessment',
        importance: 0.9,
        metadata: {
          standardCode: assessmentData.standardCode,
          proficiencyLevel: assessmentData.proficiencyLevel,
          assessmentDate: assessmentData.assessmentDate,
          evidenceUrls: assessmentData.evidenceUrls
        }
      });

      // Trigger N8N learning event processor for competency assessment
      await this.n8nWorkflowService.processLearningEvent({
        student_id: data.user_id,
        event_type: 'competency_assessment',
        content: `Competency Assessment: ${data.standard_code} - ${data.proficiency_level}. ${data.notes || ''}`,
        competency: data.standard_code,
        supervisor: assessmentData.assessorId
      });
      
      // Also trigger legacy workflow
      await this.n8nWorkflowService.triggerWorkflow('competency-assessed', {
        assessmentId: data.id,
        studentId: data.user_id,
        standardCode: data.standard_code,
        proficiencyLevel: data.proficiency_level
      });

      return data;
    } catch (error) {
      console.error('Error assessing competency:', error);
      throw error;
    }
  }

  async getCompetencyProgress(userId: string): Promise<CompetencyAssessment[]> {
    try {
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching competency progress:', error);
      return [];
    }
  }

  // ===== KNOWLEDGE GRAPH MANAGEMENT =====
  async createKnowledgeGraphEntity(entityData: Partial<KnowledgeGraphEntity>): Promise<KnowledgeGraphEntity> {
    try {
      const { data, error } = await supabase
        .from('knowledge_graph_entities')
        .insert([entityData])
        .select()
        .single();

      if (error) throw error;

      // Add to Zep memory for knowledge graph building
      await this.zepMemoryService.addMemoryFact(entityData.userId!, {
        fact: `Knowledge entity created: ${entityData.entityName}`,
        category: 'knowledge_graph',
        importance: 0.7,
        metadata: {
          entityType: entityData.entityType,
          entityName: entityData.entityName,
          description: entityData.description
        }
      });

      return data;
    } catch (error) {
      console.error('Error creating knowledge graph entity:', error);
      throw error;
    }
  }

  async createKnowledgeGraphRelationship(relationshipData: Partial<KnowledgeGraphRelationship>): Promise<KnowledgeGraphRelationship> {
    try {
      const { data, error } = await supabase
        .from('knowledge_graph_relationships')
        .insert([relationshipData])
        .select()
        .single();

      if (error) throw error;

      // Add to Zep memory for relationship tracking
      await this.zepMemoryService.addMemoryFact(relationshipData.userId!, {
        fact: `Knowledge relationship created: ${relationshipData.relationshipType}`,
        category: 'knowledge_relationship',
        importance: relationshipData.strength || 0.5,
        metadata: {
          relationshipType: relationshipData.relationshipType,
          strength: relationshipData.strength,
          sourceEntityId: relationshipData.sourceEntityId,
          targetEntityId: relationshipData.targetEntityId
        }
      });

      return data;
    } catch (error) {
      console.error('Error creating knowledge graph relationship:', error);
      throw error;
    }
  }

  async getKnowledgeGraph(userId: string): Promise<{
    entities: KnowledgeGraphEntity[];
    relationships: KnowledgeGraphRelationship[];
  }> {
    try {
      const [entitiesResult, relationshipsResult] = await Promise.all([
        supabase
          .from('knowledge_graph_entities')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('knowledge_graph_relationships')
          .select('*')
          .eq('user_id', userId)
      ]);

      if (entitiesResult.error) throw entitiesResult.error;
      if (relationshipsResult.error) throw relationshipsResult.error;

      return {
        entities: entitiesResult.data || [],
        relationships: relationshipsResult.data || []
      };
    } catch (error) {
      console.error('Error fetching knowledge graph:', error);
      return { entities: [], relationships: [] };
    }
  }

  // ===== PERSONALIZED LEARNING =====
  async generatePersonalizedRecommendations(userId: string): Promise<any> {
    try {
      // Get user's learning history from Zep
      const memoryContext = await this.zepMemoryService.getUserContext(userId);
      
      // Get recent activities and competencies
      const [activities, competencies] = await Promise.all([
        this.getSAEProjects(userId),
        this.getCompetencyProgress(userId)
      ]);

      // Generate AI-powered recommendations
      const recommendations = await this.aiAnalysisService.generateLearningRecommendations(
        userId,
        memoryContext,
        activities,
        competencies
      );

      // Store recommendations in Zep memory
      await this.zepMemoryService.addMemoryFact(userId, {
        fact: 'Generated personalized learning recommendations',
        category: 'learning_recommendations',
        importance: 0.8,
        metadata: {
          recommendationCount: recommendations.length,
          generatedAt: new Date().toISOString(),
          basedOnActivities: activities.length,
          basedOnCompetencies: competencies.length
        }
      });

      return recommendations;
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  // ===== ANALYTICS & REPORTING =====
  async getStudentProgressReport(userId: string, timeframe: { start: string; end: string }): Promise<any> {
    try {
      const [profile, projects, activities, competencies, healthRecords, feedAnalytics] = await Promise.all([
        this.getStudentProfile(userId),
        this.getSAEProjects(userId),
        supabase
          .from('sae_activities')
          .select('*')
          .gte('activity_date', timeframe.start)
          .lte('activity_date', timeframe.end),
        this.getCompetencyProgress(userId),
        supabase
          .from('health_records')
          .select('*')
          .eq('recorded_by', userId)
          .gte('observation_date', timeframe.start)
          .lte('observation_date', timeframe.end),
        supabase
          .from('feed_analytics')
          .select('*')
          .gte('calculation_date', timeframe.start)
          .lte('calculation_date', timeframe.end)
      ]);

      const report = {
        profile: profile,
        summary: {
          totalProjects: projects.length,
          totalActivities: activities.data?.length || 0,
          totalHoursLogged: activities.data?.reduce((sum, activity) => sum + activity.duration_hours, 0) || 0,
          competenciesAssessed: competencies.length,
          healthRecordsCreated: healthRecords.data?.length || 0,
          feedAnalyticsGenerated: feedAnalytics.data?.length || 0
        },
        projects: projects,
        activities: activities.data || [],
        competencies: competencies,
        healthRecords: healthRecords.data || [],
        feedAnalytics: feedAnalytics.data || [],
        generatedAt: new Date().toISOString(),
        timeframe: timeframe
      };

      // Add report generation to Zep memory
      await this.zepMemoryService.addMemoryFact(userId, {
        fact: 'Progress report generated',
        category: 'progress_report',
        importance: 0.6,
        metadata: {
          timeframe: timeframe,
          totalActivities: report.summary.totalActivities,
          totalHours: report.summary.totalHoursLogged,
          competenciesAssessed: report.summary.competenciesAssessed
        }
      });

      return report;
    } catch (error) {
      console.error('Error generating student progress report:', error);
      throw error;
    }
  }

  // ===== WORKFLOW AUTOMATION =====
  async setupDailyProgressTracking(userId: string): Promise<void> {
    try {
      await this.n8nWorkflowService.setupDailyProgressTracking({
        studentId: userId,
        enableReminders: true,
        reminderTime: '08:00',
        reminderFrequency: 'daily'
      });
      
      // Trigger initial knowledge graph analysis
      await this.n8nWorkflowService.triggerKnowledgeGraphAnalysis(userId, {
        force_analysis: false,
        include_recommendations: true
      });
    } catch (error) {
      console.error('Error setting up daily progress tracking:', error);
      throw error;
    }
  }

  async setupFeedEfficiencyMonitoring(animalId: string): Promise<void> {
    try {
      await this.n8nWorkflowService.setupFeedEfficiencyMonitoring({
        animalId: animalId,
        enableAlerts: true,
        alertThreshold: 7.0, // FCR threshold
        monitoringFrequency: 'weekly'
      });
    } catch (error) {
      console.error('Error setting up feed efficiency monitoring:', error);
      throw error;
    }
  }

  async setupHealthAlerts(animalId: string): Promise<void> {
    try {
      await this.n8nWorkflowService.setupHealthAlerts({
        animalId: animalId,
        enableEmergencyAlerts: true,
        enableReminderAlerts: true,
        severityThreshold: 3
      });
    } catch (error) {
      console.error('Error setting up health alerts:', error);
      throw error;
    }
  }

  // ===== INTEGRATION UTILITIES =====
  async syncWithZepMemory(userId: string): Promise<void> {
    try {
      // Sync all user data with Zep memory system
      const [profile, projects, competencies] = await Promise.all([
        this.getStudentProfile(userId),
        this.getSAEProjects(userId),
        this.getCompetencyProgress(userId)
      ]);

      await this.zepMemoryService.syncUserData(userId, {
        profile,
        projects,
        competencies
      });
    } catch (error) {
      console.error('Error syncing with Zep memory:', error);
      throw error;
    }
  }

  async getServiceStatus(): Promise<{
    zepMemory: boolean;
    n8nWorkflow: boolean;
    aiAnalysis: boolean;
    database: boolean;
  }> {
    try {
      const [zepStatus, n8nStatus, aiStatus, dbStatus] = await Promise.all([
        this.zepMemoryService.getStatus(),
        this.n8nWorkflowService.getStatus(),
        this.aiAnalysisService.getStatus(),
        this.checkDatabaseConnection()
      ]);

      return {
        zepMemory: zepStatus,
        n8nWorkflow: n8nStatus,
        aiAnalysis: aiStatus,
        database: dbStatus
      };
    } catch (error) {
      console.error('Error checking service status:', error);
      return {
        zepMemory: false,
        n8nWorkflow: false,
        aiAnalysis: false,
        database: false
      };
    }
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Maps SAE activity types to FFA Agricultural Education competency standards
   */
  private mapActivityToCompetency(activityType: string): string {
    const competencyMapping: { [key: string]: string } = {
      'animal_health_check': 'AS.07.01', // Health management practices
      'feeding': 'AS.06.01', // Animal nutrition and feeding
      'breeding': 'AS.05.01', // Animal reproduction
      'record_keeping': 'AS.01.01', // Record keeping and management
      'facility_maintenance': 'AS.08.01', // Housing and facilities
      'treatment_administration': 'AS.07.03', // Treatment protocols
      'vaccination': 'AS.07.02', // Disease prevention
      'weight_measurement': 'AS.03.01', // Animal growth and development
      'financial_planning': 'AS.02.01', // Business management
      'marketing': 'AS.02.02', // Marketing and sales
      'equipment_maintenance': 'AS.08.02', // Equipment operation
      'safety_procedures': 'AS.09.01' // Safety practices
    };
    
    return competencyMapping[activityType] || 'AS.01.01'; // Default to record keeping
  }
}

export default AgriculturalEducationService;