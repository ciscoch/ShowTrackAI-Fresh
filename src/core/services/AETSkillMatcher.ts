import { AETSkill, AET_SKILLS_DATABASE, getSkillsByActivity } from '../models/AETMapping';

interface SkillMatchResult {
  skill: AETSkill;
  relevanceScore: number;
  reasoning: string;
}

interface ActivityAnalysis {
  matchedSkills: SkillMatchResult[];
  careerClusters: string[];
  proficiencyDistribution: Record<string, number>;
  recommendedNextSteps: string[];
}

class AETSkillMatcherService {
  
  analyzeActivity(
    activity: string,
    description: string,
    category: string,
    duration: number
  ): ActivityAnalysis {
    // Get base skills for the activity category
    const baseSkills = getSkillsByActivity(category);
    
    // Analyze description for additional skill matches
    const descriptionSkills = this.matchSkillsFromDescription(description);
    
    // Combine and score skills
    const allSkills = [...baseSkills, ...descriptionSkills];
    const uniqueSkills = this.deduplicateSkills(allSkills);
    
    const matchedSkills = uniqueSkills.map(skill => ({
      skill,
      relevanceScore: this.calculateRelevanceScore(skill, activity, description, duration),
      reasoning: this.generateReasoning(skill, activity, description)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Extract career clusters
    const careerClusters = [...new Set(matchedSkills.map(m => m.skill.careerCluster))];
    
    // Calculate proficiency distribution
    const proficiencyDistribution = this.calculateProficiencyDistribution(matchedSkills);
    
    // Generate recommendations
    const recommendedNextSteps = this.generateRecommendations(matchedSkills, duration);

    return {
      matchedSkills,
      careerClusters,
      proficiencyDistribution,
      recommendedNextSteps
    };
  }

  private matchSkillsFromDescription(description: string): AETSkill[] {
    const keywords = description.toLowerCase().split(/\s+/);
    const matchedSkills: AETSkill[] = [];

    // Keyword mapping to skills
    const keywordMappings: Record<string, string[]> = {
      'vaccin': ['ah002'],
      'feed': ['fn001', 'fn002'],
      'nutrition': ['fn001', 'fn002'],
      'record': ['rb001', 'rb002'],
      'finance': ['rb001'],
      'data': ['rb002'],
      'equipment': ['am001'],
      'maintenance': ['am001', 'ap001'],
      'market': ['ms001', 'ms002'],
      'sell': ['ms001', 'ms002'],
      'customer': ['ms002'],
      'lead': ['ld001', 'ld002'],
      'project': ['ld001'],
      'communication': ['ld002'],
      'insurance': ['rm001'],
      'risk': ['rm001'],
      'health': ['ah001', 'ah002'],
      'disease': ['ah001'],
      'facility': ['ap001'],
      'barn': ['ap001'],
    };

    keywords.forEach(keyword => {
      Object.entries(keywordMappings).forEach(([key, skillIds]) => {
        if (keyword.includes(key)) {
          skillIds.forEach(skillId => {
            const skill = AET_SKILLS_DATABASE.find(s => s.id === skillId);
            if (skill && !matchedSkills.find(ms => ms.id === skill.id)) {
              matchedSkills.push(skill);
            }
          });
        }
      });
    });

    return matchedSkills;
  }

  private deduplicateSkills(skills: AETSkill[]): AETSkill[] {
    const uniqueSkills: AETSkill[] = [];
    const seenIds = new Set<string>();

    skills.forEach(skill => {
      if (!seenIds.has(skill.id)) {
        uniqueSkills.push(skill);
        seenIds.add(skill.id);
      }
    });

    return uniqueSkills;
  }

  private calculateRelevanceScore(
    skill: AETSkill,
    activity: string,
    description: string,
    duration: number
  ): number {
    let score = 0.5; // Base score

    // Activity type relevance
    const activitySkills = getSkillsByActivity(activity);
    if (activitySkills.find(s => s.id === skill.id)) {
      score += 0.3;
    }

    // Description keyword match
    const descriptionLower = description.toLowerCase();
    const skillNameLower = skill.name.toLowerCase();
    
    if (descriptionLower.includes(skillNameLower)) {
      score += 0.2;
    }

    // Duration factor (longer activities show more skill development)
    if (duration > 60) score += 0.1; // Over 1 hour
    if (duration > 180) score += 0.1; // Over 3 hours

    // Proficiency level factor
    const proficiencyScores = {
      'Beginner': 0.1,
      'Intermediate': 0.05,
      'Advanced': 0.0,
      'Expert': -0.05
    };
    score += proficiencyScores[skill.proficiencyLevel];

    return Math.min(1.0, Math.max(0.0, score));
  }

  private generateReasoning(skill: AETSkill, activity: string, description: string): string {
    const reasons: string[] = [];

    // Check direct activity match
    if (getSkillsByActivity(activity).find(s => s.id === skill.id)) {
      reasons.push(`Directly applies to ${activity.toLowerCase()} activities`);
    }

    // Check description keywords
    const descriptionLower = description.toLowerCase();
    if (descriptionLower.includes(skill.name.toLowerCase())) {
      reasons.push('Mentioned in activity description');
    }

    // Add skill-specific reasoning
    if (skill.category === 'Record Keeping and Business Management') {
      reasons.push('Essential for tracking project progress and outcomes');
    }
    
    if (skill.category === 'Animal Health Management') {
      reasons.push('Critical for livestock care and welfare');
    }

    if (reasons.length === 0) {
      reasons.push('Related to overall agricultural education standards');
    }

    return reasons.join('; ');
  }

  private calculateProficiencyDistribution(matchedSkills: SkillMatchResult[]): Record<string, number> {
    const distribution = {
      'Beginner': 0,
      'Intermediate': 0,
      'Advanced': 0,
      'Expert': 0
    };

    matchedSkills.forEach(match => {
      distribution[match.skill.proficiencyLevel]++;
    });

    return distribution;
  }

  private generateRecommendations(matchedSkills: SkillMatchResult[], duration: number): string[] {
    const recommendations: string[] = [];

    // Based on skill levels
    const hasAdvanced = matchedSkills.some(m => m.skill.proficiencyLevel === 'Advanced');
    const hasExpert = matchedSkills.some(m => m.skill.proficiencyLevel === 'Expert');

    if (hasExpert) {
      recommendations.push('Consider mentoring others in these advanced skills');
      recommendations.push('Document best practices for future reference');
    } else if (hasAdvanced) {
      recommendations.push('Explore expert-level applications of these skills');
      recommendations.push('Seek additional training or certification opportunities');
    } else {
      recommendations.push('Continue practicing to advance skill proficiency');
      recommendations.push('Consider additional learning resources');
    }

    // Based on duration
    if (duration < 30) {
      recommendations.push('Consider extending activity time for deeper skill development');
    } else if (duration > 240) {
      recommendations.push('Excellent time investment for comprehensive skill building');
    }

    // Career cluster recommendations
    const careerClusters = [...new Set(matchedSkills.map(m => m.skill.careerCluster))];
    if (careerClusters.length > 1) {
      recommendations.push('This activity demonstrates interdisciplinary skills valuable for diverse career paths');
    }

    return recommendations;
  }

  getSkillProgressSummary(skillIds: string[]): {
    totalSkills: number;
    categorySummary: Record<string, number>;
    proficiencyProgress: Record<string, number>;
    careerReadiness: number;
  } {
    const skills = skillIds.map(id => AET_SKILLS_DATABASE.find(s => s.id === id)).filter(Boolean) as AETSkill[];
    
    const categorySummary: Record<string, number> = {};
    const proficiencyProgress: Record<string, number> = {};

    skills.forEach(skill => {
      categorySummary[skill.category] = (categorySummary[skill.category] || 0) + 1;
      proficiencyProgress[skill.proficiencyLevel] = (proficiencyProgress[skill.proficiencyLevel] || 0) + 1;
    });

    // Calculate career readiness score (0-100)
    const proficiencyWeights = {
      'Beginner': 1,
      'Intermediate': 2,
      'Advanced': 3,
      'Expert': 4
    };

    const totalWeightedSkills = skills.reduce((sum, skill) => {
      return sum + proficiencyWeights[skill.proficiencyLevel];
    }, 0);

    const maxPossibleScore = skills.length * 4; // All expert level
    const careerReadiness = maxPossibleScore > 0 ? Math.round((totalWeightedSkills / maxPossibleScore) * 100) : 0;

    return {
      totalSkills: skills.length,
      categorySummary,
      proficiencyProgress,
      careerReadiness
    };
  }
}

export const aetSkillMatcher = new AETSkillMatcherService();
export type { SkillMatchResult, ActivityAnalysis };