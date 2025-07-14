/**
 * AET-FFA Integration Service
 * Connects AET skill tracking with FFA degree progress
 * Maps journal activities to both AET competencies and FFA requirements
 */

import { aetSkillMatcher, ActivityAnalysis } from './AETSkillMatcher';
import { ffaDegreeService, DegreeProgressUpdate } from './FFADegreeService';
import { 
  AETSkill, 
  AET_SKILLS_DATABASE, 
  AETCategory 
} from '../models/AETMapping';
import { 
  FFADegreeLevel, 
  FFADegreeRequirement,
  ENHANCED_FFA_DEGREE_REQUIREMENTS 
} from '../models/FFADegreeTracker';
import { storageService } from './StorageService';

// =========================================================================
// INTERFACES
// =========================================================================

export interface AETFFAMapping {
  aet_skill_id: string;
  ffa_degree_level: FFADegreeLevel;
  ffa_requirement_key: string;
  points_awarded: number;
  skill_category: AETCategory;
  competency_alignment: string[];
}

export interface AETPointsProgress {
  user_id: string;
  degree_level: FFADegreeLevel;
  requirement_key: string;
  aet_points_earned: number;
  aet_points_required: number;
  skills_demonstrated: string[];
  activities_completed: string[];
  completion_percentage: number;
  last_activity_date: Date;
}

export interface JournalActivityAETMapping {
  journal_entry_id: string;
  user_id: string;
  activity_title: string;
  activity_description: string;
  duration_minutes: number;
  aet_skills_identified: string[];
  aet_points_awarded: number;
  ffa_requirements_progressed: Array<{
    degree_level: FFADegreeLevel;
    requirement_key: string;
    points_contributed: number;
  }>;
  sae_standards_alignment: string[];
  career_readiness_practices: string[];
  analysis_confidence: number;
  created_at: Date;
}

export interface AETFFAProgressSummary {
  total_aet_points: number;
  points_by_category: Record<AETCategory, number>;
  ffa_degree_progress: Record<FFADegreeLevel, {
    total_requirements: number;
    aet_contributing_requirements: number;
    aet_points_earned: number;
    completion_percentage: number;
  }>;
  skill_distribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  career_readiness_score: number;
  next_recommendations: string[];
}

// =========================================================================
// AET-FFA SKILL MAPPINGS
// =========================================================================

const AET_FFA_SKILL_MAPPINGS: AETFFAMapping[] = [
  // Animal Health Management -> FFA Health Requirements
  {
    aet_skill_id: 'ah001',
    ffa_degree_level: 'discovery',
    ffa_requirement_key: 'animal_care_basics',
    points_awarded: 5,
    skill_category: 'Animal Health Management',
    competency_alignment: ['as_07_01', 'as_02_01']
  },
  {
    aet_skill_id: 'ah002',
    ffa_degree_level: 'greenhand',
    ffa_requirement_key: 'health_management',
    points_awarded: 10,
    skill_category: 'Animal Health Management',
    competency_alignment: ['as_07_01', 'as_07_02']
  },
  // Feed and Nutrition Management -> FFA Nutrition Requirements
  {
    aet_skill_id: 'fn001',
    ffa_degree_level: 'discovery',
    ffa_requirement_key: 'basic_nutrition',
    points_awarded: 5,
    skill_category: 'Feed and Nutrition Management',
    competency_alignment: ['as_03_01']
  },
  {
    aet_skill_id: 'fn002',
    ffa_degree_level: 'chapter',
    ffa_requirement_key: 'advanced_nutrition',
    points_awarded: 15,
    skill_category: 'Feed and Nutrition Management',
    competency_alignment: ['as_03_01', 'as_03_02']
  },
  // Record Keeping -> FFA Documentation Requirements
  {
    aet_skill_id: 'rb001',
    ffa_degree_level: 'discovery',
    ffa_requirement_key: 'record_keeping_basics',
    points_awarded: 5,
    skill_category: 'Record Keeping and Business Management',
    competency_alignment: ['crp_11']
  },
  {
    aet_skill_id: 'rb002',
    ffa_degree_level: 'greenhand',
    ffa_requirement_key: 'data_analysis',
    points_awarded: 10,
    skill_category: 'Record Keeping and Business Management',
    competency_alignment: ['crp_08', 'crp_11']
  },
  // Leadership -> FFA Leadership Requirements
  {
    aet_skill_id: 'ld001',
    ffa_degree_level: 'chapter',
    ffa_requirement_key: 'leadership_project',
    points_awarded: 20,
    skill_category: 'Leadership and Personal Development',
    competency_alignment: ['crp_09', 'crp_04']
  },
  {
    aet_skill_id: 'ld002',
    ffa_degree_level: 'greenhand',
    ffa_requirement_key: 'communication_skills',
    points_awarded: 10,
    skill_category: 'Leadership and Personal Development',
    competency_alignment: ['crp_04']
  },
  // Agricultural Production Systems
  {
    aet_skill_id: 'ap001',
    ffa_degree_level: 'discovery',
    ffa_requirement_key: 'facility_management',
    points_awarded: 5,
    skill_category: 'Agricultural Production Systems',
    competency_alignment: ['as_05_01', 'as_08_01']
  },
  // Marketing and Sales
  {
    aet_skill_id: 'ms001',
    ffa_degree_level: 'state',
    ffa_requirement_key: 'marketing_analysis',
    points_awarded: 25,
    skill_category: 'Marketing and Sales',
    competency_alignment: ['as_01_01', 'crp_08']
  },
  // Risk Management
  {
    aet_skill_id: 'rm001',
    ffa_degree_level: 'state',
    ffa_requirement_key: 'risk_assessment',
    points_awarded: 20,
    skill_category: 'Risk Management',
    competency_alignment: ['crp_08', 'crp_01']
  }
];

// =========================================================================
// AET POINTS THRESHOLDS FOR FFA REQUIREMENTS
// =========================================================================

const AET_POINTS_THRESHOLDS: Record<FFADegreeLevel, Record<string, number>> = {
  discovery: {
    'animal_care_basics': 25,
    'basic_nutrition': 20,
    'record_keeping_basics': 15,
    'facility_management': 20
  },
  greenhand: {
    'health_management': 50,
    'communication_skills': 40,
    'data_analysis': 35,
    'sae_participation': 60
  },
  chapter: {
    'advanced_nutrition': 75,
    'leadership_project': 100,
    'community_service': 50,
    'parliamentary_procedure': 30
  },
  state: {
    'marketing_analysis': 125,
    'risk_assessment': 100,
    'industry_placement': 150,
    'mentorship_activities': 80
  },
  american: {
    'advanced_leadership': 200,
    'agricultural_advocacy': 150,
    'entrepreneurship': 175,
    'global_agriculture': 125
  }
};

// =========================================================================
// AET-FFA INTEGRATION SERVICE
// =========================================================================

class AETFFAIntegrationService {
  
  // =========================================================================
  // JOURNAL ACTIVITY PROCESSING
  // =========================================================================

  /**
   * Process a journal activity for AET points and FFA progress
   */
  async processJournalActivityForAETFFA(
    userId: string,
    journalEntryId: string,
    activityTitle: string,
    activityDescription: string,
    category: string,
    durationMinutes: number
  ): Promise<JournalActivityAETMapping> {
    try {
      // Analyze activity for AET skills
      const activityAnalysis = aetSkillMatcher.analyzeActivity(
        activityTitle,
        activityDescription,
        category,
        durationMinutes
      );

      // Calculate AET points based on skills and duration
      const aetPointsAwarded = this.calculateAETPoints(activityAnalysis, durationMinutes);
      
      // Identify FFA requirements that benefit from this activity
      const ffaRequirementsProgressed = await this.mapActivityToFFARequirements(
        userId,
        activityAnalysis,
        aetPointsAwarded
      );

      // Create activity mapping record
      const activityMapping: JournalActivityAETMapping = {
        journal_entry_id: journalEntryId,
        user_id: userId,
        activity_title: activityTitle,
        activity_description: activityDescription,
        duration_minutes: durationMinutes,
        aet_skills_identified: activityAnalysis.matchedSkills.map(s => s.skill.id),
        aet_points_awarded: aetPointsAwarded,
        ffa_requirements_progressed: ffaRequirementsProgressed,
        sae_standards_alignment: activityAnalysis.saeStandardsAlignment,
        career_readiness_practices: this.extractCareerReadinessPractices(activityAnalysis),
        analysis_confidence: this.calculateAnalysisConfidence(activityAnalysis),
        created_at: new Date()
      };

      // Save activity mapping
      await this.saveActivityMapping(activityMapping);

      // Update FFA degree progress
      await this.updateFFAProgressFromAET(userId, ffaRequirementsProgressed);

      // Update AET points progress
      await this.updateAETPointsProgress(userId, activityMapping);

      return activityMapping;
    } catch (error) {
      console.error('Error processing journal activity for AET-FFA:', error);
      throw error;
    }
  }

  /**
   * Calculate AET points for an activity
   */
  private calculateAETPoints(analysis: ActivityAnalysis, durationMinutes: number): number {
    let points = 0;

    // Base points from matched skills
    analysis.matchedSkills.forEach(skillMatch => {
      const basePoints = this.getSkillBasePoints(skillMatch.skill);
      const relevanceMultiplier = skillMatch.relevanceScore;
      points += Math.round(basePoints * relevanceMultiplier);
    });

    // Duration bonus (more time = more learning)
    const durationMultiplier = Math.min(2.0, 1 + (durationMinutes / 120)); // Cap at 2x for 2+ hours
    points = Math.round(points * durationMultiplier);

    // Minimum points for any activity
    return Math.max(points, 1);
  }

  /**
   * Map activity to FFA requirements that it contributes to
   */
  private async mapActivityToFFARequirements(
    userId: string,
    analysis: ActivityAnalysis,
    aetPoints: number
  ): Promise<Array<{
    degree_level: FFADegreeLevel;
    requirement_key: string;
    points_contributed: number;
  }>> {
    const contributions: Array<{
      degree_level: FFADegreeLevel;
      requirement_key: string;
      points_contributed: number;
    }> = [];

    // Get user's current FFA progress to know which requirements are active
    const currentProgress = await ffaDegreeService.getDegreeProgress(userId);
    const activeDegreeLevels = currentProgress
      .filter(p => p.status === 'in_progress' || p.status === 'not_started')
      .map(p => p.degree_level);

    // Match AET skills to FFA requirements
    analysis.matchedSkills.forEach(skillMatch => {
      const mappings = AET_FFA_SKILL_MAPPINGS.filter(
        mapping => mapping.aet_skill_id === skillMatch.skill.id &&
                   activeDegreeLevels.includes(mapping.ffa_degree_level)
      );

      mappings.forEach(mapping => {
        const pointsContributed = Math.round(
          mapping.points_awarded * skillMatch.relevanceScore
        );

        if (pointsContributed > 0) {
          contributions.push({
            degree_level: mapping.ffa_degree_level,
            requirement_key: mapping.ffa_requirement_key,
            points_contributed: pointsContributed
          });
        }
      });
    });

    return contributions;
  }

  /**
   * Update FFA degree progress based on AET contributions
   */
  private async updateFFAProgressFromAET(
    userId: string,
    contributions: Array<{
      degree_level: FFADegreeLevel;
      requirement_key: string;
      points_contributed: number;
    }>
  ): Promise<void> {
    for (const contribution of contributions) {
      try {
        // Get current AET points for this requirement
        const currentAETProgress = await this.getAETPointsProgress(
          userId,
          contribution.degree_level,
          contribution.requirement_key
        );

        const newTotalPoints = currentAETProgress.aet_points_earned + contribution.points_contributed;
        const requiredPoints = AET_POINTS_THRESHOLDS[contribution.degree_level]?.[contribution.requirement_key] || 50;

        // Check if requirement is now completed
        const isCompleted = newTotalPoints >= requiredPoints;

        if (isCompleted && !currentAETProgress.completion_percentage === 100) {
          // Update FFA degree requirement as completed
          const degreeUpdate: DegreeProgressUpdate = {
            degree_level: contribution.degree_level,
            requirement_key: contribution.requirement_key,
            completed: true,
            evidence: `Completed through AET skill demonstration (${newTotalPoints}/${requiredPoints} points)`,
            notes: `AET skills: ${currentAETProgress.skills_demonstrated.join(', ')}`
          };

          await ffaDegreeService.updateDegreeRequirement(userId, degreeUpdate);
        }

        // Update AET points progress
        await this.updateAETPointsProgress(userId, {
          user_id: userId,
          degree_level: contribution.degree_level,
          requirement_key: contribution.requirement_key,
          aet_points_earned: newTotalPoints,
          aet_points_required: requiredPoints,
          completion_percentage: Math.min(100, (newTotalPoints / requiredPoints) * 100)
        } as any);

      } catch (error) {
        console.error('Error updating FFA progress from AET:', error);
      }
    }
  }

  // =========================================================================
  // AET POINTS TRACKING
  // =========================================================================

  /**
   * Get AET points progress for a specific requirement
   */
  async getAETPointsProgress(
    userId: string,
    degreeLevel: FFADegreeLevel,
    requirementKey: string
  ): Promise<AETPointsProgress> {
    try {
      const key = `aet_points_${userId}_${degreeLevel}_${requirementKey}`;
      const stored = await storageService.loadData<AETPointsProgress>(key);
      
      if (stored) {
        return stored;
      }

      // Create new progress record
      const requiredPoints = AET_POINTS_THRESHOLDS[degreeLevel]?.[requirementKey] || 50;
      const newProgress: AETPointsProgress = {
        user_id: userId,
        degree_level: degreeLevel,
        requirement_key: requirementKey,
        aet_points_earned: 0,
        aet_points_required: requiredPoints,
        skills_demonstrated: [],
        activities_completed: [],
        completion_percentage: 0,
        last_activity_date: new Date()
      };

      await storageService.saveData(key, newProgress);
      return newProgress;
    } catch (error) {
      console.error('Error getting AET points progress:', error);
      throw error;
    }
  }

  /**
   * Update AET points progress
   */
  async updateAETPointsProgress(
    userId: string,
    activityMapping: JournalActivityAETMapping
  ): Promise<void> {
    try {
      for (const contribution of activityMapping.ffa_requirements_progressed) {
        const progress = await this.getAETPointsProgress(
          userId,
          contribution.degree_level,
          contribution.requirement_key
        );

        // Update progress
        progress.aet_points_earned += contribution.points_contributed;
        progress.skills_demonstrated = [
          ...new Set([...progress.skills_demonstrated, ...activityMapping.aet_skills_identified])
        ];
        progress.activities_completed.push(activityMapping.journal_entry_id);
        progress.completion_percentage = Math.min(
          100,
          (progress.aet_points_earned / progress.aet_points_required) * 100
        );
        progress.last_activity_date = new Date();

        // Save updated progress
        const key = `aet_points_${userId}_${contribution.degree_level}_${contribution.requirement_key}`;
        await storageService.saveData(key, progress);
      }
    } catch (error) {
      console.error('Error updating AET points progress:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive AET-FFA progress summary
   */
  async getAETFFAProgressSummary(userId: string): Promise<AETFFAProgressSummary> {
    try {
      // Get all activity mappings for user
      const allMappings = await this.getUserActivityMappings(userId);
      
      // Calculate total AET points
      const totalAETPoints = allMappings.reduce((sum, mapping) => sum + mapping.aet_points_awarded, 0);

      // Calculate points by category
      const pointsByCategory: Record<AETCategory, number> = {
        'Agricultural Production Systems': 0,
        'Animal Health Management': 0,
        'Feed and Nutrition Management': 0,
        'Agricultural Mechanics and Technology': 0,
        'Record Keeping and Business Management': 0,
        'Marketing and Sales': 0,
        'Leadership and Personal Development': 0,
        'Risk Management': 0
      };

      allMappings.forEach(mapping => {
        mapping.aet_skills_identified.forEach(skillId => {
          const skill = AET_SKILLS_DATABASE.find(s => s.id === skillId);
          if (skill) {
            pointsByCategory[skill.category] += mapping.aet_points_awarded / mapping.aet_skills_identified.length;
          }
        });
      });

      // Get FFA degree progress
      const ffaProgress = await ffaDegreeService.getDegreeProgress(userId);
      const ffaDegreeProgress: Record<FFADegreeLevel, any> = {
        discovery: { total_requirements: 0, aet_contributing_requirements: 0, aet_points_earned: 0, completion_percentage: 0 },
        greenhand: { total_requirements: 0, aet_contributing_requirements: 0, aet_points_earned: 0, completion_percentage: 0 },
        chapter: { total_requirements: 0, aet_contributing_requirements: 0, aet_points_earned: 0, completion_percentage: 0 },
        state: { total_requirements: 0, aet_contributing_requirements: 0, aet_points_earned: 0, completion_percentage: 0 },
        american: { total_requirements: 0, aet_contributing_requirements: 0, aet_points_earned: 0, completion_percentage: 0 }
      };

      // Calculate skill distribution
      const allSkills = allMappings.flatMap(m => m.aet_skills_identified)
        .map(skillId => AET_SKILLS_DATABASE.find(s => s.id === skillId))
        .filter(Boolean) as AETSkill[];

      const skillDistribution = {
        beginner: allSkills.filter(s => s.proficiencyLevel === 'Beginner').length,
        intermediate: allSkills.filter(s => s.proficiencyLevel === 'Intermediate').length,
        advanced: allSkills.filter(s => s.proficiencyLevel === 'Advanced').length,
        expert: allSkills.filter(s => s.proficiencyLevel === 'Expert').length
      };

      // Calculate career readiness score
      const careerReadinessScore = this.calculateCareerReadinessScore(allSkills, totalAETPoints);

      // Generate recommendations
      const nextRecommendations = this.generateProgressRecommendations(
        pointsByCategory,
        skillDistribution,
        totalAETPoints
      );

      return {
        total_aet_points: totalAETPoints,
        points_by_category: pointsByCategory,
        ffa_degree_progress: ffaDegreeProgress,
        skill_distribution: skillDistribution,
        career_readiness_score: careerReadinessScore,
        next_recommendations: nextRecommendations
      };
    } catch (error) {
      console.error('Error getting AET-FFA progress summary:', error);
      throw error;
    }
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private getSkillBasePoints(skill: AETSkill): number {
    const proficiencyPoints = {
      'Beginner': 2,
      'Intermediate': 5,
      'Advanced': 10,
      'Expert': 15
    };
    return proficiencyPoints[skill.proficiencyLevel];
  }

  private extractCareerReadinessPractices(analysis: ActivityAnalysis): string[] {
    const practices: string[] = [];
    
    // Map SAE standards to Career Ready Practices
    analysis.saeStandardsAlignment.forEach(standard => {
      if (standard.startsWith('CRP')) {
        practices.push(standard);
      }
    });

    return [...new Set(practices)];
  }

  private calculateAnalysisConfidence(analysis: ActivityAnalysis): number {
    if (analysis.matchedSkills.length === 0) return 0.3;
    
    const avgRelevanceScore = analysis.matchedSkills.reduce(
      (sum, match) => sum + match.relevanceScore, 0
    ) / analysis.matchedSkills.length;
    
    return Math.min(1.0, avgRelevanceScore + 0.2);
  }

  private async saveActivityMapping(mapping: JournalActivityAETMapping): Promise<void> {
    try {
      const key = `aet_ffa_mapping_${mapping.user_id}`;
      const existing = await storageService.loadData<JournalActivityAETMapping[]>(key) || [];
      existing.push(mapping);
      await storageService.saveData(key, existing);
    } catch (error) {
      console.error('Error saving activity mapping:', error);
    }
  }

  private async getUserActivityMappings(userId: string): Promise<JournalActivityAETMapping[]> {
    try {
      const key = `aet_ffa_mapping_${userId}`;
      return await storageService.loadData<JournalActivityAETMapping[]>(key) || [];
    } catch (error) {
      console.error('Error getting user activity mappings:', error);
      return [];
    }
  }

  private calculateCareerReadinessScore(skills: AETSkill[], totalPoints: number): number {
    const skillScore = Math.min(80, skills.length * 2); // Max 80 from skill variety
    const pointsScore = Math.min(20, totalPoints / 10); // Max 20 from total points
    return Math.round(skillScore + pointsScore);
  }

  private generateProgressRecommendations(
    pointsByCategory: Record<AETCategory, number>,
    skillDistribution: any,
    totalPoints: number
  ): string[] {
    const recommendations: string[] = [];

    // Find weakest categories
    const sortedCategories = Object.entries(pointsByCategory)
      .sort(([,a], [,b]) => a - b);

    if (sortedCategories[0][1] < 10) {
      recommendations.push(`Focus on ${sortedCategories[0][0]} activities to build foundational skills`);
    }

    // Skill level recommendations
    if (skillDistribution.advanced + skillDistribution.expert < 3) {
      recommendations.push('Seek opportunities to develop advanced-level competencies');
    }

    // Total points recommendations
    if (totalPoints < 50) {
      recommendations.push('Increase activity frequency to build comprehensive skill portfolio');
    } else if (totalPoints > 200) {
      recommendations.push('Consider mentoring others or taking on leadership roles');
    }

    // Leadership development
    if (pointsByCategory['Leadership and Personal Development'] < 20) {
      recommendations.push('Participate in leadership activities and communication training');
    }

    return recommendations;
  }
}

// =========================================================================
// EXPORT SERVICE INSTANCE
// =========================================================================

export const aetFFAIntegrationService = new AETFFAIntegrationService();
export type {
  AETFFAMapping,
  AETPointsProgress,
  JournalActivityAETMapping,
  AETFFAProgressSummary
};