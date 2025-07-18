/**
 * Competency Tracking Service for ShowTrackAI Agricultural Education Platform
 * 
 * Manages agricultural education competency tracking including:
 * - AET (Agricultural Education Technology) standards
 * - FFA competency assessments
 * - Skill development tracking
 * - Proficiency level progression
 * - Evidence collection and validation
 * - Career readiness alignment
 */

import { getSupabaseClient } from '../../../backend/api/clients/supabase';

export interface CompetencyStandard {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisite?: string[];
  learningOutcomes: string[];
  assessmentCriteria: string[];
  careerPathways: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyAssessment {
  id: string;
  userId: string;
  standardCode: string;
  standardDescription: string;
  assessmentDate: string;
  proficiencyLevel: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  score?: number;
  maxScore?: number;
  evidenceUrls?: string[];
  assessorId?: string;
  assessmentNotes?: string;
  validationStatus: 'pending' | 'validated' | 'rejected';
  validatedBy?: string;
  validatedDate?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillDevelopmentPlan {
  id: string;
  userId: string;
  standardCode: string;
  currentLevel: string;
  targetLevel: string;
  targetDate: string;
  learningActivities: string[];
  resources: string[];
  milestones: Array<{
    description: string;
    dueDate: string;
    completed: boolean;
    completedDate?: string;
  }>;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyProgress {
  userId: string;
  totalStandards: number;
  assessedStandards: number;
  completedStandards: number;
  inProgressStandards: number;
  proficiencyDistribution: Record<string, number>;
  categoryProgress: Record<string, {
    total: number;
    assessed: number;
    completed: number;
    averageScore: number;
  }>;
  careerReadinessScore: number;
  recommendedNextSteps: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface CompetencyAnalytics {
  overallProgress: number;
  completionRate: number;
  averageProficiencyLevel: number;
  strongestCategories: string[];
  weakestCategories: string[];
  recentAchievements: CompetencyAssessment[];
  upcomingAssessments: SkillDevelopmentPlan[];
  competencyTrends: Array<{
    month: string;
    assessments: number;
    averageScore: number;
    completions: number;
  }>;
  peerComparison: {
    userRank: number;
    totalUsers: number;
    percentile: number;
    averageCompletion: number;
  };
}

export class CompetencyTrackingService {

  /**
   * Get all competency standards
   */
  async getCompetencyStandards(): Promise<CompetencyStandard[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('competency_standards')
        .select('*')
        .eq('is_active', true)
        .order('code', { ascending: true });

      if (error) throw error;
      return data?.map(this.transformStandardFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching competency standards:', error);
      return [];
    }
  }

  /**
   * Get competency standards by category
   */
  async getStandardsByCategory(category: string): Promise<CompetencyStandard[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('competency_standards')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('code', { ascending: true });

      if (error) throw error;
      return data?.map(this.transformStandardFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching standards by category:', error);
      return [];
    }
  }

  /**
   * Create competency assessment
   */
  async createAssessment(assessmentData: Partial<CompetencyAssessment>): Promise<CompetencyAssessment> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('competency_assessments')
        .insert([{
          ...assessmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update skill development plan if exists
      await this.updateSkillDevelopmentProgress(assessmentData.userId!, assessmentData.standardCode!);

      return this.transformAssessmentFromDatabase(data);
    } catch (error) {
      console.error('Error creating competency assessment:', error);
      throw error;
    }
  }

  /**
   * Update competency assessment
   */
  async updateAssessment(assessmentId: string, updates: Partial<CompetencyAssessment>): Promise<CompetencyAssessment> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('competency_assessments')
        .update({
          ...this.transformAssessmentToDatabase(updates),
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return this.transformAssessmentFromDatabase(data);
    } catch (error) {
      console.error('Error updating competency assessment:', error);
      throw error;
    }
  }

  /**
   * Get assessments for a user
   */
  async getUserAssessments(userId: string): Promise<CompetencyAssessment[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      return data?.map(this.transformAssessmentFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching user assessments:', error);
      return [];
    }
  }

  /**
   * Get assessment by standard code
   */
  async getUserAssessmentByStandard(userId: string, standardCode: string): Promise<CompetencyAssessment | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('standard_code', standardCode)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data ? this.transformAssessmentFromDatabase(data) : null;
    } catch (error) {
      console.error('Error fetching assessment by standard:', error);
      return null;
    }
  }

  /**
   * Update competencies based on activity
   */
  async updateCompetencies(userId: string, standardCodes: string[], evidenceUrls: string[]): Promise<void> {
    try {
      for (const standardCode of standardCodes) {
        const existingAssessment = await this.getUserAssessmentByStandard(userId, standardCode);
        
        if (existingAssessment) {
          // Update existing assessment
          await this.updateAssessment(existingAssessment.id, {
            evidenceUrls: [...(existingAssessment.evidenceUrls || []), ...evidenceUrls],
            assessmentDate: new Date().toISOString()
          });
        } else {
          // Create new assessment
          await this.createAssessment({
            userId,
            standardCode,
            standardDescription: `Competency: ${standardCode}`,
            assessmentDate: new Date().toISOString(),
            proficiencyLevel: 'developing',
            evidenceUrls,
            validationStatus: 'pending'
          });
        }
      }
    } catch (error) {
      console.error('Error updating competencies:', error);
      throw error;
    }
  }

  /**
   * Create skill development plan
   */
  async createSkillDevelopmentPlan(planData: Partial<SkillDevelopmentPlan>): Promise<SkillDevelopmentPlan> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('skill_development_plans')
        .insert([{
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return this.transformPlanFromDatabase(data);
    } catch (error) {
      console.error('Error creating skill development plan:', error);
      throw error;
    }
  }

  /**
   * Get skill development plans for a user
   */
  async getUserSkillDevelopmentPlans(userId: string): Promise<SkillDevelopmentPlan[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('skill_development_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(this.transformPlanFromDatabase) || [];
    } catch (error) {
      console.error('Error fetching skill development plans:', error);
      return [];
    }
  }

  /**
   * Update skill development plan progress
   */
  async updateSkillDevelopmentProgress(userId: string, standardCode: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('skill_development_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('standard_code', standardCode)
        .single();

      if (error) return; // Plan doesn't exist

      // Update progress based on latest assessment
      const assessment = await this.getUserAssessmentByStandard(userId, standardCode);
      if (assessment) {
        const progress = this.calculatePlanProgress(assessment.proficiencyLevel);
        
        const supabase = getSupabaseClient();
      await supabase
          .from('skill_development_plans')
          .update({
            progress,
            status: progress >= 100 ? 'completed' : 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Error updating skill development progress:', error);
    }
  }

  /**
   * Get competency progress for a user
   */
  async getCompetencyProgress(userId: string): Promise<CompetencyProgress> {
    try {
      const [standards, assessments] = await Promise.all([
        this.getCompetencyStandards(),
        this.getUserAssessments(userId)
      ]);

      const totalStandards = standards.length;
      const assessedStandards = assessments.length;
      const completedStandards = assessments.filter(a => 
        a.proficiencyLevel === 'proficient' || 
        a.proficiencyLevel === 'advanced' || 
        a.proficiencyLevel === 'expert'
      ).length;
      const inProgressStandards = assessments.filter(a => 
        a.proficiencyLevel === 'developing' || 
        a.proficiencyLevel === 'novice'
      ).length;

      // Proficiency distribution
      const proficiencyDistribution: Record<string, number> = {};
      assessments.forEach(assessment => {
        proficiencyDistribution[assessment.proficiencyLevel] = 
          (proficiencyDistribution[assessment.proficiencyLevel] || 0) + 1;
      });

      // Category progress
      const categoryProgress: Record<string, any> = {};
      const standardsByCategory = this.groupStandardsByCategory(standards);
      
      Object.entries(standardsByCategory).forEach(([category, categoryStandards]) => {
        const categoryAssessments = assessments.filter(a => 
          categoryStandards.some(s => s.code === a.standardCode)
        );
        
        categoryProgress[category] = {
          total: categoryStandards.length,
          assessed: categoryAssessments.length,
          completed: categoryAssessments.filter(a => 
            a.proficiencyLevel === 'proficient' || 
            a.proficiencyLevel === 'advanced' || 
            a.proficiencyLevel === 'expert'
          ).length,
          averageScore: this.calculateAverageScore(categoryAssessments)
        };
      });

      // Career readiness score
      const careerReadinessScore = this.calculateCareerReadinessScore(assessments, standards);

      // Recommendations and analysis
      const recommendedNextSteps = this.generateRecommendations(assessments, standards);
      const strengthAreas = this.identifyStrengthAreas(categoryProgress);
      const improvementAreas = this.identifyImprovementAreas(categoryProgress);

      return {
        userId,
        totalStandards,
        assessedStandards,
        completedStandards,
        inProgressStandards,
        proficiencyDistribution,
        categoryProgress,
        careerReadinessScore,
        recommendedNextSteps,
        strengthAreas,
        improvementAreas
      };
    } catch (error) {
      console.error('Error getting competency progress:', error);
      throw error;
    }
  }

  /**
   * Get competency analytics for a user
   */
  async getCompetencyAnalytics(userId: string): Promise<CompetencyAnalytics> {
    try {
      const [progress, assessments, plans] = await Promise.all([
        this.getCompetencyProgress(userId),
        this.getUserAssessments(userId),
        this.getUserSkillDevelopmentPlans(userId)
      ]);

      const overallProgress = (progress.completedStandards / progress.totalStandards) * 100;
      const completionRate = (progress.assessedStandards / progress.totalStandards) * 100;
      const averageProficiencyLevel = this.calculateAverageProficiencyLevel(assessments);

      const strongestCategories = progress.strengthAreas;
      const weakestCategories = progress.improvementAreas;
      const recentAchievements = assessments.slice(0, 5);
      const upcomingAssessments = plans.filter(p => p.status === 'active').slice(0, 5);

      const competencyTrends = this.calculateCompetencyTrends(assessments);
      const peerComparison = await this.calculatePeerComparison(userId, progress);

      return {
        overallProgress,
        completionRate,
        averageProficiencyLevel,
        strongestCategories,
        weakestCategories,
        recentAchievements,
        upcomingAssessments,
        competencyTrends,
        peerComparison
      };
    } catch (error) {
      console.error('Error getting competency analytics:', error);
      throw error;
    }
  }

  /**
   * Validate competency assessment
   */
  async validateAssessment(assessmentId: string, validatedBy: string, approved: boolean): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('competency_assessments')
        .update({
          validation_status: approved ? 'validated' : 'rejected',
          validated_by: validatedBy,
          validated_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error validating assessment:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculatePlanProgress(proficiencyLevel: string): number {
    const progressMap = {
      'novice': 20,
      'developing': 40,
      'proficient': 70,
      'advanced': 90,
      'expert': 100
    };
    return progressMap[proficiencyLevel] || 0;
  }

  private groupStandardsByCategory(standards: CompetencyStandard[]): Record<string, CompetencyStandard[]> {
    const grouped: Record<string, CompetencyStandard[]> = {};
    
    standards.forEach(standard => {
      if (!grouped[standard.category]) {
        grouped[standard.category] = [];
      }
      grouped[standard.category].push(standard);
    });
    
    return grouped;
  }

  private calculateAverageScore(assessments: CompetencyAssessment[]): number {
    if (assessments.length === 0) return 0;
    
    const scores = assessments.filter(a => a.score !== undefined).map(a => a.score!);
    if (scores.length === 0) return 0;
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateCareerReadinessScore(assessments: CompetencyAssessment[], standards: CompetencyStandard[]): number {
    // Calculate based on completion of core competencies
    const coreCompetencies = standards.filter(s => s.level === 'beginner' || s.level === 'intermediate');
    const completedCore = assessments.filter(a => 
      coreCompetencies.some(c => c.code === a.standardCode) &&
      (a.proficiencyLevel === 'proficient' || a.proficiencyLevel === 'advanced' || a.proficiencyLevel === 'expert')
    );
    
    return coreCompetencies.length > 0 ? (completedCore.length / coreCompetencies.length) * 100 : 0;
  }

  private generateRecommendations(assessments: CompetencyAssessment[], standards: CompetencyStandard[]): string[] {
    const recommendations: string[] = [];
    
    // Find unassessed standards
    const assessedCodes = new Set(assessments.map(a => a.standardCode));
    const unassessed = standards.filter(s => !assessedCodes.has(s.code));
    
    if (unassessed.length > 0) {
      recommendations.push(`Complete assessments for ${unassessed.length} remaining standards`);
    }
    
    // Find standards needing improvement
    const needingImprovement = assessments.filter(a => 
      a.proficiencyLevel === 'novice' || a.proficiencyLevel === 'developing'
    );
    
    if (needingImprovement.length > 0) {
      recommendations.push(`Focus on improving ${needingImprovement.length} developing competencies`);
    }
    
    // Category-specific recommendations
    const categoryProgress = this.groupStandardsByCategory(standards);
    const weakCategories = Object.entries(categoryProgress)
      .filter(([_, standards]) => {
        const categoryAssessments = assessments.filter(a => 
          standards.some(s => s.code === a.standardCode)
        );
        return categoryAssessments.length < standards.length * 0.5;
      })
      .map(([category, _]) => category);
    
    if (weakCategories.length > 0) {
      recommendations.push(`Strengthen skills in: ${weakCategories.join(', ')}`);
    }
    
    return recommendations;
  }

  private identifyStrengthAreas(categoryProgress: Record<string, any>): string[] {
    return Object.entries(categoryProgress)
      .filter(([_, progress]) => progress.averageScore > 80 && progress.completed > progress.total * 0.7)
      .map(([category, _]) => category);
  }

  private identifyImprovementAreas(categoryProgress: Record<string, any>): string[] {
    return Object.entries(categoryProgress)
      .filter(([_, progress]) => progress.averageScore < 60 || progress.completed < progress.total * 0.3)
      .map(([category, _]) => category);
  }

  private calculateAverageProficiencyLevel(assessments: CompetencyAssessment[]): number {
    if (assessments.length === 0) return 0;
    
    const levelScores = {
      'novice': 1,
      'developing': 2,
      'proficient': 3,
      'advanced': 4,
      'expert': 5
    };
    
    const totalScore = assessments.reduce((sum, assessment) => 
      sum + (levelScores[assessment.proficiencyLevel] || 0), 0);
    
    return totalScore / assessments.length;
  }

  private calculateCompetencyTrends(assessments: CompetencyAssessment[]): Array<{
    month: string;
    assessments: number;
    averageScore: number;
    completions: number;
  }> {
    const monthlyData: Record<string, {
      assessments: number;
      scores: number[];
      completions: number;
    }> = {};
    
    assessments.forEach(assessment => {
      const month = new Date(assessment.assessmentDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { assessments: 0, scores: [], completions: 0 };
      }
      
      monthlyData[month].assessments++;
      if (assessment.score) {
        monthlyData[month].scores.push(assessment.score);
      }
      if (assessment.proficiencyLevel === 'proficient' || 
          assessment.proficiencyLevel === 'advanced' || 
          assessment.proficiencyLevel === 'expert') {
        monthlyData[month].completions++;
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        assessments: data.assessments,
        averageScore: data.scores.length > 0 ? 
          data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length : 0,
        completions: data.completions
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  private async calculatePeerComparison(userId: string, progress: CompetencyProgress): Promise<{
    userRank: number;
    totalUsers: number;
    percentile: number;
    averageCompletion: number;
  }> {
    try {
      // Get all users' completion rates
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('user_id')
        .eq('validation_status', 'validated');

      if (error) throw error;

      const userCompletions: Record<string, number> = {};
      data?.forEach(assessment => {
        userCompletions[assessment.user_id] = (userCompletions[assessment.user_id] || 0) + 1;
      });

      const completionRates = Object.values(userCompletions);
      const userCompletion = progress.completedStandards;
      const totalUsers = completionRates.length;
      const averageCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / totalUsers;
      
      const usersWithLowerCompletion = completionRates.filter(rate => rate < userCompletion).length;
      const userRank = totalUsers - usersWithLowerCompletion;
      const percentile = (usersWithLowerCompletion / totalUsers) * 100;

      return {
        userRank,
        totalUsers,
        percentile,
        averageCompletion
      };
    } catch (error) {
      console.error('Error calculating peer comparison:', error);
      return {
        userRank: 1,
        totalUsers: 1,
        percentile: 50,
        averageCompletion: 0
      };
    }
  }

  // Database transformation methods
  private transformStandardFromDatabase(data: any): CompetencyStandard {
    return {
      id: data.id,
      code: data.code,
      title: data.title,
      description: data.description,
      category: data.category,
      level: data.level,
      prerequisite: data.prerequisite,
      learningOutcomes: data.learning_outcomes,
      assessmentCriteria: data.assessment_criteria,
      careerPathways: data.career_pathways,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private transformAssessmentFromDatabase(data: any): CompetencyAssessment {
    return {
      id: data.id,
      userId: data.user_id,
      standardCode: data.standard_code,
      standardDescription: data.standard_description,
      assessmentDate: data.assessment_date,
      proficiencyLevel: data.proficiency_level,
      score: data.score,
      maxScore: data.max_score,
      evidenceUrls: data.evidence_urls,
      assessorId: data.assessor_id,
      assessmentNotes: data.assessment_notes,
      validationStatus: data.validation_status,
      validatedBy: data.validated_by,
      validatedDate: data.validated_date,
      expirationDate: data.expiration_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private transformAssessmentToDatabase(data: Partial<CompetencyAssessment>): any {
    return {
      user_id: data.userId,
      standard_code: data.standardCode,
      standard_description: data.standardDescription,
      assessment_date: data.assessmentDate,
      proficiency_level: data.proficiencyLevel,
      score: data.score,
      max_score: data.maxScore,
      evidence_urls: data.evidenceUrls,
      assessor_id: data.assessorId,
      assessment_notes: data.assessmentNotes,
      validation_status: data.validationStatus,
      validated_by: data.validatedBy,
      validated_date: data.validatedDate,
      expiration_date: data.expirationDate
    };
  }

  private transformPlanFromDatabase(data: any): SkillDevelopmentPlan {
    return {
      id: data.id,
      userId: data.user_id,
      standardCode: data.standard_code,
      currentLevel: data.current_level,
      targetLevel: data.target_level,
      targetDate: data.target_date,
      learningActivities: data.learning_activities,
      resources: data.resources,
      milestones: data.milestones,
      progress: data.progress,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export default CompetencyTrackingService;