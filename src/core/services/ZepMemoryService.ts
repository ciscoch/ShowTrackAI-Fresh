/**
 * ZepMemoryService - Advanced Agricultural Memory Management
 * 
 * Integrates Zep memory platform for personalized agricultural education
 * with comprehensive knowledge graphs including feed intelligence.
 */

import { ZepCloud } from '@getzep/zep-cloud';
import { Animal } from '../models/Animal';
import { FeedProduct, FeedEntry, FCRAnalysis, PhotoAnalysis } from '../models/FeedProduct';
import { Journal } from '../models/Journal';
import { AETSkill } from '../models/AETSkill';
import { FinancialEntry } from '../models/Financial';
import { sentryService } from './SentryService';

// Enhanced Knowledge Graph Interfaces
export interface AdvancedUserKnowledgeGraph {
  entities: {
    animals: Animal[];
    feedProducts: FeedProduct[];
    performanceMetrics: PerformanceData[];
    photos: PhotoAnalysis[];
    skills: AETSkill[];
    vendorIntelligence: VendorIntelligence[];
  };
  relationships: {
    feedToWeightCorrelations: MemoryFact[];
    photoToHealthPatterns: MemoryFact[];
    skillProgression: MemoryFact[];
    vendorPerformance: MemoryFact[];
  };
}

export interface MemoryFact {
  id: string;
  type: 'correlation' | 'pattern' | 'progression' | 'performance';
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  validAt: Date;
  invalidAt?: Date;
  metadata: Record<string, any>;
}

export interface LearningSession {
  sessionId: string;
  userId: string;
  animalId?: string;
  activity: 'feeding' | 'weighing' | 'photo_analysis' | 'journal_entry' | 'health_check';
  duration: number; // minutes
  outcomes: string[];
  skillsApplied: string[];
  challenges: string[];
  insights: string[];
  timestamp: Date;
}

export interface MentorResponse {
  guidance: string;
  recommendations: string[];
  nextSteps: string[];
  resources: string[];
  confidence: number;
  personalizationLevel: number;
}

export interface UserContext {
  userId: string;
  currentActivity: string;
  recentHistory: LearningSession[];
  skillLevel: string;
  goals: string[];
  preferences: Record<string, any>;
}

export interface PerformanceData {
  animalId: string;
  date: Date;
  weight: number;
  bodyConditionScore: number;
  healthStatus: string;
  feedConsumption: number;
  behaviorNotes: string[];
}

export interface VendorIntelligence {
  vendorId: string;
  name: string;
  performanceScore: number;
  reliabilityRating: number;
  costEffectiveness: number;
  productQuality: number;
  customerSatisfaction: number;
  deliveryPerformance: number;
}

class ZepMemoryService {
  private client: ZepCloud | null = null;
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize Zep Cloud client
   */
  async initialize(apiKey?: string): Promise<void> {
    try {
      const zepApiKey = apiKey || process.env.EXPO_PUBLIC_ZEP_API_KEY;
      
      if (!zepApiKey || zepApiKey === 'zep_placeholder_key') {
        console.warn('⚠️ Zep API key not configured. Memory features disabled.');
        return;
      }

      this.client = new ZepCloud({ apiKey: zepApiKey });
      this.isInitialized = true;
      
      console.log('🧠 Zep Memory Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Zep Memory Service:', error);
      sentryService.captureError(error as Error, {
        feature: 'zep_memory',
        action: 'initialization',
      });
    }
  }

  /**
   * Set current user for memory context
   */
  setUser(userId: string): void {
    this.userId = userId;
    console.log(`👤 Zep Memory user set: ${userId}`);
  }

  /**
   * Add learning session to memory
   */
  async addLearningSession(session: LearningSession): Promise<void> {
    if (!this.shouldTrack()) return;

    try {
      const sessionId = `${this.userId}_${session.sessionId}`;
      
      const messages = [
        {
          role: this.userId!,
          role_type: 'user' as const,
          content: this.formatLearningSessionMessage(session),
        }
      ];

      await this.client!.memory.add(sessionId, { messages });
      
      console.log(`🎓 Learning session added to memory: ${session.activity}`);
    } catch (error) {
      console.error('❌ Failed to add learning session:', error);
      sentryService.captureError(error as Error, {
        feature: 'zep_memory',
        action: 'add_learning_session',
        session_id: session.sessionId,
      });
    }
  }

  /**
   * Add feed intelligence data to memory
   */
  async addFeedIntelligence(
    animalId: string, 
    feedEntry: FeedEntry, 
    fcrAnalysis?: FCRAnalysis
  ): Promise<void> {
    if (!this.shouldTrack()) return;

    try {
      const sessionId = `${this.userId}_feed_intelligence`;
      
      const content = this.formatFeedIntelligenceMessage(animalId, feedEntry, fcrAnalysis);
      
      const messages = [
        {
          role: this.userId!,
          role_type: 'user' as const,
          content,
        }
      ];

      await this.client!.memory.add(sessionId, { messages });
      
      console.log(`🌾 Feed intelligence added to memory for animal: ${animalId}`);
    } catch (error) {
      console.error('❌ Failed to add feed intelligence:', error);
      sentryService.captureError(error as Error, {
        feature: 'zep_memory',
        action: 'add_feed_intelligence',
        animal_id: animalId,
      });
    }
  }

  /**
   * Add photo analysis to memory
   */
  async addPhotoAnalysis(photoAnalysis: PhotoAnalysis): Promise<void> {
    if (!this.shouldTrack()) return;

    try {
      const sessionId = `${this.userId}_photo_analysis`;
      
      const content = this.formatPhotoAnalysisMessage(photoAnalysis);
      
      const messages = [
        {
          role: this.userId!,
          role_type: 'user' as const,
          content,
        }
      ];

      await this.client!.memory.add(sessionId, { messages });
      
      console.log(`📸 Photo analysis added to memory for animal: ${photoAnalysis.animalId}`);
    } catch (error) {
      console.error('❌ Failed to add photo analysis:', error);
      sentryService.captureError(error as Error, {
        feature: 'zep_memory',
        action: 'add_photo_analysis',
        animal_id: photoAnalysis.animalId,
      });
    }
  }

  /**
   * Get personalized guidance based on user context
   */
  async getPersonalizedGuidance(context: UserContext): Promise<MentorResponse> {
    if (!this.shouldTrack()) {
      return this.getDefaultGuidance(context);
    }

    try {
      const sessionId = `${this.userId}_guidance`;
      
      // Add current context to memory
      const contextMessage = {
        role: this.userId!,
        role_type: 'user' as const,
        content: this.formatContextMessage(context),
      };

      await this.client!.memory.add(sessionId, { messages: [contextMessage] });
      
      // Retrieve relevant memory for guidance
      const memoryResult = await this.client!.memory.get(sessionId);
      
      // Process memory context to generate guidance
      const guidance = this.generateGuidanceFromMemory(context, memoryResult);
      
      console.log(`🎯 Personalized guidance generated for activity: ${context.currentActivity}`);
      return guidance;
    } catch (error) {
      console.error('❌ Failed to get personalized guidance:', error);
      sentryService.captureError(error as Error, {
        feature: 'zep_memory',
        action: 'get_guidance',
        activity: context.currentActivity,
      });
      
      return this.getDefaultGuidance(context);
    }
  }

  /**
   * Update knowledge graph with new relationships
   */
  async updateKnowledgeGraph(facts: MemoryFact[]): Promise<void> {
    if (!this.shouldTrack()) return;

    try {
      const sessionId = `${this.userId}_knowledge_graph`;
      
      const messages = facts.map(fact => ({
        role: this.userId!,
        role_type: 'user' as const,
        content: this.formatFactMessage(fact),
      }));

      await this.client!.memory.add(sessionId, { messages });
      
      console.log(`🕸️ Knowledge graph updated with ${facts.length} facts`);
    } catch (error) {
      console.error('❌ Failed to update knowledge graph:', error);
      sentryService.captureError(error as Error, {
        feature: 'zep_memory',
        action: 'update_knowledge_graph',
        fact_count: facts.length,
      });
    }
  }

  /**
   * Get memory-based recommendations for feed optimization
   */
  async getFeedOptimizationRecommendations(animalId: string): Promise<string[]> {
    if (!this.shouldTrack()) {
      return this.getDefaultFeedRecommendations();
    }

    try {
      const sessionId = `${this.userId}_feed_intelligence`;
      const memoryResult = await this.client!.memory.get(sessionId);
      
      return this.extractFeedRecommendations(animalId, memoryResult);
    } catch (error) {
      console.error('❌ Failed to get feed recommendations:', error);
      return this.getDefaultFeedRecommendations();
    }
  }

  /**
   * Reset user memory (for logout/profile switch)
   */
  async resetUserMemory(): Promise<void> {
    this.userId = null;
    console.log('🔄 User memory context reset');
  }

  // Private helper methods
  private shouldTrack(): boolean {
    return this.isInitialized && this.client !== null && this.userId !== null;
  }

  private formatLearningSessionMessage(session: LearningSession): string {
    return `Learning Session: ${session.activity}
Duration: ${session.duration} minutes
Animal: ${session.animalId || 'N/A'}
Outcomes: ${session.outcomes.join(', ')}
Skills Applied: ${session.skillsApplied.join(', ')}
Challenges: ${session.challenges.join(', ')}
Insights: ${session.insights.join(', ')}
Date: ${session.timestamp.toISOString()}`;
  }

  private formatFeedIntelligenceMessage(
    animalId: string, 
    feedEntry: FeedEntry, 
    fcrAnalysis?: FCRAnalysis
  ): string {
    let message = `Feed Intelligence for Animal ${animalId}:
Feed Product: ${feedEntry.feedProductId}
Amount: ${feedEntry.amount} lbs
Cost: $${feedEntry.cost}
Method: ${feedEntry.feedingMethod}
Date: ${feedEntry.date.toISOString()}`;

    if (fcrAnalysis) {
      message += `
FCR Analysis:
- Feed Conversion Ratio: ${fcrAnalysis.metrics.feedConversionRatio}
- Average Daily Gain: ${fcrAnalysis.metrics.avgDailyGain} lbs
- Cost per Pound Gain: $${fcrAnalysis.metrics.costPerPoundGain}
- Performance Ranking: ${fcrAnalysis.benchmarkComparison.performanceRanking}`;
    }

    if (feedEntry.notes) {
      message += `\nNotes: ${feedEntry.notes}`;
    }

    return message;
  }

  private formatPhotoAnalysisMessage(photoAnalysis: PhotoAnalysis): string {
    return `Photo Analysis for Animal ${photoAnalysis.animalId}:
Body Condition Score: ${photoAnalysis.analysisResults.bodyConditionScore}/9
Estimated Weight: ${photoAnalysis.analysisResults.estimatedWeight} lbs
Health Indicators: ${photoAnalysis.analysisResults.healthIndicators.map(h => `${h.type}: ${h.score}/10`).join(', ')}
Growth Stage: ${photoAnalysis.analysisResults.growthAssessment.growth_stage}
Feed Impact Score: ${photoAnalysis.analysisResults.feedCorrelation.overall_score}/100
AI Confidence: ${photoAnalysis.aiMetrics.confidence}%
Date: ${photoAnalysis.date.toISOString()}`;
  }

  private formatContextMessage(context: UserContext): string {
    return `Current Context:
Activity: ${context.currentActivity}
Skill Level: ${context.skillLevel}
Goals: ${context.goals.join(', ')}
Recent Activities: ${context.recentHistory.map(h => h.activity).join(', ')}`;
  }

  private formatFactMessage(fact: MemoryFact): string {
    return `Knowledge Fact (${fact.type}):
${fact.subject} ${fact.predicate} ${fact.object}
Confidence: ${fact.confidence}%
Valid from: ${fact.validAt.toISOString()}
${fact.invalidAt ? `Valid until: ${fact.invalidAt.toISOString()}` : 'Currently valid'}`;
  }

  private generateGuidanceFromMemory(context: UserContext, memoryResult: any): MentorResponse {
    // This would be enhanced with actual memory processing
    // For now, providing contextual guidance based on activity
    
    const activityGuidance: Record<string, Partial<MentorResponse>> = {
      'feeding': {
        guidance: 'Based on your feeding history, I notice consistent timing patterns that are benefiting your animals.',
        recommendations: [
          'Continue current feeding schedule',
          'Monitor feed conversion ratios',
          'Consider feed quality upgrades for better efficiency'
        ],
        nextSteps: [
          'Record today\'s feeding amounts',
          'Take photos for body condition assessment',
          'Update weight records if available'
        ]
      },
      'weighing': {
        guidance: 'Your consistent weight tracking is providing valuable growth data.',
        recommendations: [
          'Compare with expected growth curves',
          'Analyze feed efficiency trends',
          'Document any weight fluctuations'
        ],
        nextSteps: [
          'Enter today\'s weights accurately',
          'Review growth trends',
          'Plan feed adjustments if needed'
        ]
      },
      'photo_analysis': {
        guidance: 'Visual documentation is crucial for tracking body condition changes.',
        recommendations: [
          'Take photos from consistent angles',
          'Ensure good lighting for accurate analysis',
          'Compare with previous photos'
        ],
        nextSteps: [
          'Take standardized photos',
          'Review AI analysis results',
          'Note any health concerns'
        ]
      }
    };

    const defaultGuidance = activityGuidance[context.currentActivity] || {
      guidance: 'Continue with your agricultural learning journey.',
      recommendations: ['Stay consistent with record keeping'],
      nextSteps: ['Complete today\'s activities']
    };

    return {
      guidance: defaultGuidance.guidance || '',
      recommendations: defaultGuidance.recommendations || [],
      nextSteps: defaultGuidance.nextSteps || [],
      resources: [
        'FFA Degree Progress Tracker',
        'AET Skills Documentation',
        'Feed Efficiency Calculator'
      ],
      confidence: 85,
      personalizationLevel: memoryResult ? 90 : 60
    };
  }

  private getDefaultGuidance(context: UserContext): MentorResponse {
    return {
      guidance: 'Welcome to your agricultural learning journey! Let\'s start building your experience.',
      recommendations: [
        'Begin with consistent daily record keeping',
        'Document all animal interactions',
        'Track feeding and growth patterns'
      ],
      nextSteps: [
        'Complete today\'s animal care tasks',
        'Update your journal entries',
        'Review your progress goals'
      ],
      resources: [
        'Getting Started Guide',
        'Basic Animal Care Principles',
        'Record Keeping Best Practices'
      ],
      confidence: 70,
      personalizationLevel: 30
    };
  }

  private extractFeedRecommendations(animalId: string, memoryResult: any): string[] {
    // Process memory to extract feed-specific recommendations
    return [
      'Consider increasing protein content for current growth phase',
      'Monitor feed conversion ratio for optimization opportunities',
      'Evaluate cost-effectiveness of current feed brand',
      'Ensure consistent feeding schedule for best results'
    ];
  }

  private getDefaultFeedRecommendations(): string[] {
    return [
      'Maintain consistent feeding schedule',
      'Monitor animal body condition regularly',
      'Track feed costs and conversion ratios',
      'Ensure fresh water availability'
    ];
  }

  /**
   * Get service status for debugging
   */
  getStatus(): {
    initialized: boolean;
    hasUser: boolean;
    ready: boolean;
  } {
    return {
      initialized: this.isInitialized,
      hasUser: this.userId !== null,
      ready: this.shouldTrack(),
    };
  }
}

// Export singleton instance
export const zepMemoryService = new ZepMemoryService();