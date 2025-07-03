import { AETSkill, AET_SKILLS_DATABASE, getSkillsByActivity } from '../models/AETMapping';
import { FeedTrackingData } from '../models/Journal';
import { saeFramework } from './SAEFramework';

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
  saeStandardsAlignment: string[];
  saeCompetencies: string[];
}

export interface AIActivitySuggestion {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedAETSkills: string[];
  suggestedObjectives: string[];
  suggestedSAEStandards: string[];
  confidenceScore: number;
  reasoning: string;
}

interface DetailedAETCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  skills: string[];
  careerPathways: string[];
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  saeStandards?: string[];
}

class AETSkillMatcherService {
  
  // Detailed AET Categories with descriptions and pathways - Updated to match livestock focus
  private readonly DETAILED_AET_CATEGORIES: DetailedAETCategory[] = [
    {
      id: 'feeding_nutrition',
      name: 'Feeding & Nutrition',
      description: 'Track feeding schedules, nutrition planning, and dietary management',
      icon: '🌾',
      color: '#4ECDC4',
      skills: ['fn001', 'fn002', 'fn003'],
      careerPathways: ['Animal Nutritionist', 'Feed Mill Manager', 'Livestock Producer'],
      difficultyLevel: 'Intermediate',
      saeStandards: ['AS.03'] // Animal Nutrition
    },
    {
      id: 'animal_care',
      name: 'Animal Care & Management',
      description: 'Daily care activities, health monitoring, and general animal management',
      icon: '🐄',
      color: '#FF6B6B',
      skills: ['ac001', 'ac002', 'ac003'],
      careerPathways: ['Livestock Manager', 'Ranch Hand', 'Animal Caretaker'],
      difficultyLevel: 'Beginner',
      saeStandards: ['AS.02', 'AS.05'] // Animal Behavior & Environmental Factors
    },
    {
      id: 'breeding_genetics',
      name: 'Breeding & Genetics',
      description: 'Breeding programs, genetic selection, and reproduction management',
      icon: '🧬',
      color: '#9B59B6',
      skills: ['bg001', 'bg002', 'bg003'],
      careerPathways: ['Animal Breeding Specialist', 'Genetics Technician', 'Reproductive Specialist'],
      difficultyLevel: 'Advanced',
      saeStandards: ['AS.04', 'AS.06'] // Animal Reproduction & Selection
    },
    {
      id: 'health_veterinary',
      name: 'Health & Veterinary Care',
      description: 'Health treatments, veterinary procedures, and medical record keeping',
      icon: '🏥',
      color: '#E74C3C',
      skills: ['hv001', 'hv002', 'hv003'],
      careerPathways: ['Veterinarian', 'Vet Technician', 'Animal Health Inspector'],
      difficultyLevel: 'Advanced',
      saeStandards: ['AS.07'] // Animal Health Care
    },
    {
      id: 'facilities_equipment',
      name: 'Facilities & Equipment',
      description: 'Facility maintenance, equipment operation, and infrastructure management',
      icon: '🏗️',
      color: '#34495E',
      skills: ['fe001', 'fe002', 'fe003'],
      careerPathways: ['Farm Manager', 'Equipment Technician', 'Facilities Coordinator'],
      difficultyLevel: 'Intermediate',
      saeStandards: ['AS.05', 'AS.08'] // Environmental Factors & Production Environment
    },
    {
      id: 'record_keeping',
      name: 'Record Keeping & Documentation',
      description: 'Maintain detailed records, data collection, and documentation practices',
      icon: '📋',
      color: '#3498DB',
      skills: ['rk001', 'rk002', 'rk003'],
      careerPathways: ['Farm Accountant', 'Data Analyst', 'Compliance Officer'],
      difficultyLevel: 'Intermediate',
      saeStandards: ['AS.01', 'CRP.11'] // Industry Trends & Technology
    },
    {
      id: 'business_management',
      name: 'Business & Financial Management',
      description: 'Cost analysis, budgeting, marketing, and business planning',
      icon: '💼',
      color: '#F39C12',
      skills: ['bm001', 'bm002', 'bm003'],
      careerPathways: ['Agricultural Business Manager', 'Farm Financial Advisor', 'Marketing Specialist'],
      difficultyLevel: 'Advanced',
      saeStandards: ['AS.01', 'CRP.08', 'CRP.09'] // Industry Trends, Critical Thinking, Leadership
    },
    {
      id: 'safety_compliance',
      name: 'Safety & Compliance',
      description: 'Safety protocols, regulatory compliance, and risk management',
      icon: '🛡️',
      color: '#E67E22',
      skills: ['sc001', 'sc002', 'sc003'],
      careerPathways: ['Safety Coordinator', 'Compliance Officer', 'Risk Manager'],
      difficultyLevel: 'Advanced',
      saeStandards: ['AS.02', 'AS.08', 'CRP.01'] // Animal Behavior, Environment, Responsibility
    }
  ];
  
  // AI-powered activity suggestion based on context
  generateAIActivitySuggestion(
    context: {
      previousActivities?: string[];
      currentSeason?: string;
      animalTypes?: string[];
      feedData?: FeedTrackingData;
      timeOfDay?: string;
      weatherConditions?: string;
      location?: string;
    }
  ): AIActivitySuggestion {
    const { previousActivities = [], currentSeason = 'spring', animalTypes = [], feedData, timeOfDay = 'morning', weatherConditions = 'clear', location = 'barn' } = context;
    
    // AI logic to suggest activities based on context
    let suggestedTitle = '';
    let suggestedDescription = '';
    let suggestedAETSkills: string[] = [];
    let suggestedObjectives: string[] = [];
    let suggestedSAEStandards: string[] = [];
    let confidenceScore = 0.7;
    let reasoning = '';
    
    // Feed-based suggestions
    if (feedData) {
      if (feedData.feeds && feedData.feeds.length > 0) {
        const feedItems = feedData.feeds.map(f => `${f.amount} ${f.unit} of ${f.brand} ${f.product}`).join(', ');
        suggestedTitle = `Multi-Feed Nutrition Management and Distribution`;
        suggestedDescription = `Prepared and distributed ${feedItems} to ${animalTypes.join(', ') || 'livestock'}. Monitored animal intake, behavior, and nutritional balance. Total feed cost: $${feedData.totalCost || 0}.`;
        suggestedAETSkills = ['fn001', 'fn002', 'rb001'];
        suggestedObjectives = ['Feed Management', 'Nutritional Planning', 'Cost Analysis', 'Animal Observation'];
        suggestedSAEStandards = ['AS.03', 'AS.02'];
        reasoning = 'Activity involves comprehensive feed management and animal nutrition';
        confidenceScore = 0.95;
      } else {
        suggestedTitle = `Feed Quality Assessment and Distribution`;
        suggestedDescription = `Evaluated feed quality for nutritional content and distributed to ${animalTypes.join(', ') || 'livestock'}. Monitored animal intake and behavior during feeding.`;
        suggestedAETSkills = ['fn001', 'ah001', 'rb002'];
        suggestedObjectives = ['Feed Quality Assessment', 'Nutritional Management', 'Animal Observation'];
        suggestedSAEStandards = ['AS.03'];
        reasoning = 'Activity focuses on feed quality and nutritional management';
        confidenceScore = 0.85;
      }
    }
    
    // Time and weather-based suggestions
    else if (timeOfDay === 'morning' && weatherConditions === 'clear') {
      suggestedTitle = 'Morning Animal Health and Welfare Check';
      suggestedDescription = `Conducted comprehensive morning health assessment of ${animalTypes.join(', ') || 'livestock'} in ${location}. Evaluated body condition, behavior patterns, and environmental conditions. Weather conditions were favorable (${weatherConditions}).`;
      suggestedAETSkills = ['ah001', 'ah002', 'ap001'];
      suggestedObjectives = ['Animal Health Assessment', 'Preventive Care', 'Environmental Management'];
      suggestedSAEStandards = ['AS.07', 'AS.02', 'AS.05'];
      reasoning = 'Morning routine with favorable weather conditions for thorough health checks';
      confidenceScore = 0.8;
    }
    
    // Seasonal suggestions
    else if (currentSeason === 'winter') {
      suggestedTitle = 'Winter Facility and Equipment Maintenance';
      suggestedDescription = `Performed winter maintenance tasks including facility winterization, equipment servicing, and cold weather preparation for ${animalTypes.join(', ') || 'livestock'}. Ensured adequate shelter, heating systems, and water access.`;
      suggestedAETSkills = ['ap001', 'am001', 'rm001'];
      suggestedObjectives = ['Facility Management', 'Equipment Maintenance', 'Seasonal Planning'];
      suggestedSAEStandards = ['AS.05', 'AS.08'];
      reasoning = 'Winter season requires specialized facility and equipment maintenance';
      confidenceScore = 0.75;
    }
    
    // Default general suggestion
    else {
      suggestedTitle = 'Daily Livestock Management Activities';
      suggestedDescription = `Completed routine livestock management tasks including animal observation, facility checks, and basic maintenance. Monitored ${animalTypes.join(', ') || 'animals'} for health and behavior changes.`;
      suggestedAETSkills = ['ah001', 'ap001', 'rb002'];
      suggestedObjectives = ['Animal Husbandry', 'Facility Management', 'Record Keeping'];
      suggestedSAEStandards = ['AS.02', 'AS.05', 'AS.01'];
      reasoning = 'General livestock management activity';
      confidenceScore = 0.6;
    }
    
    return {
      suggestedTitle,
      suggestedDescription,
      suggestedAETSkills,
      suggestedObjectives,
      suggestedSAEStandards,
      confidenceScore,
      reasoning
    };
  }
  
  // Get detailed AET categories with descriptions
  getDetailedAETCategories(): DetailedAETCategory[] {
    return this.DETAILED_AET_CATEGORIES;
  }
  
  // Get AET category by ID with full details
  getAETCategoryDetails(categoryId: string): DetailedAETCategory | null {
    return this.DETAILED_AET_CATEGORIES.find(cat => cat.id === categoryId) || null;
  }
  
  // Match learning objectives to AET categories
  matchObjectivesToAETCategories(objectives: string[]): { objective: string; matchedCategories: DetailedAETCategory[]; confidence: number }[] {
    return objectives.map(objective => {
      const objectiveLower = objective.toLowerCase();
      const matchedCategories: DetailedAETCategory[] = [];
      let confidence = 0;
      
      // Keyword matching for each category
      this.DETAILED_AET_CATEGORIES.forEach(category => {
        const categoryKeywords = [
          ...category.name.toLowerCase().split(' '),
          ...category.description.toLowerCase().split(' '),
          ...category.careerPathways.join(' ').toLowerCase().split(' ')
        ];
        
        const matches = categoryKeywords.filter(keyword => 
          keyword.length > 3 && objectiveLower.includes(keyword)
        );
        
        if (matches.length > 0) {
          matchedCategories.push(category);
          confidence += matches.length * 0.2;
        }
      });
      
      return {
        objective,
        matchedCategories,
        confidence: Math.min(1.0, confidence)
      };
    });
  }

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

    // Map to SAE standards based on activity
    const saeAlignment = this.mapActivityToSAEStandards(activity, description, category);

    return {
      matchedSkills,
      careerClusters,
      proficiencyDistribution,
      recommendedNextSteps,
      saeStandardsAlignment: saeAlignment.standards,
      saeCompetencies: saeAlignment.competencies
    };
  }

  private mapActivityToSAEStandards(activity: string, description: string, category: string): {
    standards: string[];
    competencies: string[];
  } {
    const standards: string[] = [];
    const competencies: string[] = [];
    const descLower = description.toLowerCase();
    const activityLower = activity.toLowerCase();
    
    // Feeding and nutrition activities
    if (descLower.includes('feed') || descLower.includes('nutrition') || category.includes('Feeding')) {
      standards.push('AS.03');
      competencies.push('as_03_01');
    }
    
    // Health and veterinary activities
    if (descLower.includes('health') || descLower.includes('veterinary') || descLower.includes('vaccine')) {
      standards.push('AS.07');
      competencies.push('as_07_01');
    }
    
    // Animal behavior and welfare
    if (descLower.includes('behavior') || descLower.includes('handling') || descLower.includes('welfare')) {
      standards.push('AS.02');
      competencies.push('as_02_01', 'as_02_02');
    }
    
    // Breeding and genetics
    if (descLower.includes('breeding') || descLower.includes('genetics') || descLower.includes('reproduction')) {
      standards.push('AS.04');
      competencies.push('as_04_01');
    }
    
    // Facility and environmental management
    if (descLower.includes('facility') || descLower.includes('environment') || descLower.includes('maintenance')) {
      standards.push('AS.05');
      competencies.push('as_05_01');
    }
    
    // Animal selection and evaluation
    if (descLower.includes('select') || descLower.includes('evaluate') || descLower.includes('judging')) {
      standards.push('AS.06');
      competencies.push('as_06_01');
    }
    
    // Production systems and sustainability
    if (descLower.includes('production') || descLower.includes('sustainability') || descLower.includes('waste')) {
      standards.push('AS.08');
      competencies.push('as_08_01');
    }
    
    // Industry trends and analysis
    if (descLower.includes('market') || descLower.includes('trends') || descLower.includes('economics')) {
      standards.push('AS.01');
      competencies.push('as_01_01');
    }
    
    // Career Ready Practices
    if (descLower.includes('communication') || descLower.includes('leadership')) {
      standards.push('CRP.04', 'CRP.09');
    }
    
    if (descLower.includes('technology') || descLower.includes('record') || descLower.includes('data')) {
      standards.push('CRP.11');
    }
    
    if (descLower.includes('problem') || descLower.includes('critical') || descLower.includes('analysis')) {
      standards.push('CRP.08');
    }
    
    return {
      standards: [...new Set(standards)],
      competencies: [...new Set(competencies)]
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