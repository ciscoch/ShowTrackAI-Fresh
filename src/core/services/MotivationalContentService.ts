// =========================================================================
// Motivational Content Service - Student Engagement System
// =========================================================================
// Service for delivering personalized motivational content to students
// Supports tips, encouragement, reminders, and competition preparation
// =========================================================================

import { ServiceFactory } from './adapters/ServiceFactory';
import { storageService } from './StorageService';
import { 
  MotivationalContent, 
  MotivationalContentType, 
  MotivationalAudience,
  MotivationalEducationalValue,
  MotivationalEngagementMetrics,
  MotivationalContentTiming
} from '../models/FFADegreeTracker';

// =========================================================================
// SERVICE INTERFACES
// =========================================================================

export interface MotivationalContentRequest {
  target_audience: MotivationalAudience;
  content_category: string;
  context_tags?: string[];
  grade_level?: string[];
  seasonal_relevance?: string[];
  user_context?: {
    current_degree_level?: string;
    active_sae_projects?: number;
    recent_competitions?: string[];
    learning_preferences?: string[];
  };
}

export interface ContentEngagementEvent {
  content_id: string;
  user_id: string;
  event_type: 'view' | 'like' | 'share' | 'save' | 'dismiss' | 'helpful' | 'not_helpful';
  time_spent_seconds?: number;
  feedback_text?: string;
  timestamp: Date;
}

export interface PersonalizedContentFeed {
  daily_tip: MotivationalContent | null;
  encouragement: MotivationalContent | null;
  reminders: MotivationalContent[];
  competition_prep: MotivationalContent[];
  seasonal_content: MotivationalContent[];
}

export interface ContentPerformanceMetrics {
  content_id: string;
  total_views: number;
  engagement_rate: number;
  average_time_spent: number;
  like_rate: number;
  share_rate: number;
  effectiveness_score: number;
  user_feedback_average: number;
}

// =========================================================================
// MOTIVATIONAL CONTENT SERVICE
// =========================================================================

class MotivationalContentService {
  private supabaseAdapter: any;
  private contentCache: Map<string, MotivationalContent[]> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.supabaseAdapter = ServiceFactory.getSupabaseAdapter();
    this.loadContentCache();
  }

  // =========================================================================
  // CONTENT RETRIEVAL
  // =========================================================================

  /**
   * Get personalized content feed for a user
   */
  async getPersonalizedFeed(userId: string, preferences?: {
    content_types?: MotivationalContentType[];
    categories?: string[];
    timing?: MotivationalContentTiming;
  }): Promise<PersonalizedContentFeed> {
    try {
      await this.refreshCacheIfNeeded();

      const userContext = await this.getUserContext(userId);
      const currentTime = new Date();
      const timeOfDay = this.getTimeOfDay(currentTime);

      // Get content based on preferences and context
      const dailyTip = await this.getDailyTip(userId, userContext);
      const encouragement = await this.getEncouragementContent(userId, userContext);
      const reminders = await this.getReminders(userId, userContext);
      const competitionPrep = await this.getCompetitionPrep(userId, userContext);
      const seasonalContent = await this.getSeasonalContent(userId, currentTime);

      return {
        daily_tip: dailyTip,
        encouragement: encouragement,
        reminders: reminders,
        competition_prep: competitionPrep,
        seasonal_content: seasonalContent
      };
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      return {
        daily_tip: null,
        encouragement: null,
        reminders: [],
        competition_prep: [],
        seasonal_content: []
      };
    }
  }

  /**
   * Get content by specific criteria
   */
  async getContentByCriteria(request: MotivationalContentRequest): Promise<MotivationalContent[]> {
    try {
      await this.refreshCacheIfNeeded();

      let content: MotivationalContent[] = [];

      // Try database first
      if (this.supabaseAdapter) {
        const filters: any = {
          target_audience: request.target_audience,
          content_category: request.content_category,
          active: true
        };

        const result = await this.supabaseAdapter.query('ffa_motivational_content', {
          filters,
          orderBy: { created_at: 'desc' },
          limit: 10
        });
        content = result || [];
      }

      // Filter by additional criteria
      if (request.context_tags && request.context_tags.length > 0) {
        content = content.filter(c => 
          request.context_tags!.some(tag => c.context_tags.includes(tag))
        );
      }

      if (request.grade_level && request.grade_level.length > 0) {
        content = content.filter(c => 
          c.grade_level.length === 0 || 
          request.grade_level!.some(grade => c.grade_level.includes(grade))
        );
      }

      if (request.seasonal_relevance && request.seasonal_relevance.length > 0) {
        content = content.filter(c => 
          c.seasonal_relevance.length === 0 || 
          request.seasonal_relevance!.some(season => c.seasonal_relevance.includes(season))
        );
      }

      // Sort by engagement metrics
      content.sort((a, b) => {
        const aScore = a.engagement_metrics.effectiveness_rating || 0;
        const bScore = b.engagement_metrics.effectiveness_rating || 0;
        return bScore - aScore;
      });

      return content;
    } catch (error) {
      console.error('Error getting content by criteria:', error);
      return [];
    }
  }

  /**
   * Get content for specific competition type
   */
  async getCompetitionContent(competitionType: string, preparationStage: 'planning' | 'practicing' | 'pre_competition' | 'post_competition'): Promise<MotivationalContent[]> {
    const contextTags = [competitionType, preparationStage];
    
    return await this.getContentByCriteria({
      target_audience: 'student',
      content_category: 'competition_prep',
      context_tags: contextTags
    });
  }

  /**
   * Get parent accountability content
   */
  async getParentAccountabilityContent(childGradeLevel: string, activityType: 'sae_check_in' | 'goal_review' | 'celebration'): Promise<MotivationalContent[]> {
    return await this.getContentByCriteria({
      target_audience: 'parent',
      content_category: 'parent_engagement',
      context_tags: [activityType],
      grade_level: [childGradeLevel]
    });
  }

  /**
   * Get educator support content
   */
  async getEducatorContent(contentType: 'teaching_strategies' | 'student_support' | 'professional_development'): Promise<MotivationalContent[]> {
    return await this.getContentByCriteria({
      target_audience: 'educator',
      content_category: contentType
    });
  }

  // =========================================================================
  // CONTENT ENGAGEMENT TRACKING
  // =========================================================================

  /**
   * Track content engagement event
   */
  async trackEngagement(event: ContentEngagementEvent): Promise<void> {
    try {
      // Store engagement event
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('ffa_user_interactions', {
          user_id: event.user_id,
          interaction_type: 'motivational_content',
          target_id: event.content_id,
          target_type: 'motivational_content',
          interaction_data: {
            event_type: event.event_type,
            time_spent_seconds: event.time_spent_seconds,
            feedback_text: event.feedback_text
          },
          engagement_score: this.calculateEngagementScore(event),
          time_spent_seconds: event.time_spent_seconds,
          created_at: event.timestamp
        });
      }

      // Update content metrics
      await this.updateContentMetrics(event.content_id, event);

      // Track analytics
      await this.trackAnalyticsEvent(event.user_id, {
        event_type: 'content_engagement',
        content_id: event.content_id,
        engagement_type: event.event_type,
        time_spent: event.time_spent_seconds
      });
    } catch (error) {
      console.error('Error tracking content engagement:', error);
    }
  }

  /**
   * Get content performance metrics
   */
  async getContentPerformance(contentId: string): Promise<ContentPerformanceMetrics> {
    try {
      const defaultMetrics: ContentPerformanceMetrics = {
        content_id: contentId,
        total_views: 0,
        engagement_rate: 0,
        average_time_spent: 0,
        like_rate: 0,
        share_rate: 0,
        effectiveness_score: 0,
        user_feedback_average: 0
      };

      if (!this.supabaseAdapter) return defaultMetrics;

      // Get all interactions for this content
      const interactions = await this.supabaseAdapter.query('ffa_user_interactions', {
        filters: {
          target_id: contentId,
          target_type: 'motivational_content'
        }
      });

      if (!interactions || interactions.length === 0) return defaultMetrics;

      // Calculate metrics
      const totalViews = interactions.filter(i => i.interaction_data.event_type === 'view').length;
      const totalLikes = interactions.filter(i => i.interaction_data.event_type === 'like').length;
      const totalShares = interactions.filter(i => i.interaction_data.event_type === 'share').length;
      const totalEngagements = interactions.filter(i => 
        ['like', 'share', 'save', 'helpful'].includes(i.interaction_data.event_type)
      ).length;

      const averageTimeSpent = interactions.length > 0 
        ? interactions.reduce((sum, i) => sum + (i.time_spent_seconds || 0), 0) / interactions.length 
        : 0;

      const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
      const likeRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
      const shareRate = totalViews > 0 ? (totalShares / totalViews) * 100 : 0;

      // Calculate effectiveness score
      const effectivenessScore = this.calculateEffectivenessScore({
        engagement_rate: engagementRate,
        average_time_spent: averageTimeSpent,
        like_rate: likeRate,
        share_rate: shareRate
      });

      return {
        content_id: contentId,
        total_views: totalViews,
        engagement_rate: engagementRate,
        average_time_spent: averageTimeSpent,
        like_rate: likeRate,
        share_rate: shareRate,
        effectiveness_score: effectivenessScore,
        user_feedback_average: 0 // Would calculate from feedback data
      };
    } catch (error) {
      console.error('Error getting content performance:', error);
      return {
        content_id: contentId,
        total_views: 0,
        engagement_rate: 0,
        average_time_spent: 0,
        like_rate: 0,
        share_rate: 0,
        effectiveness_score: 0,
        user_feedback_average: 0
      };
    }
  }

  // =========================================================================
  // CONTENT MANAGEMENT
  // =========================================================================

  /**
   * Create new motivational content
   */
  async createContent(content: Omit<MotivationalContent, 'id' | 'created_at' | 'updated_at'>): Promise<MotivationalContent> {
    try {
      const newContent: Partial<MotivationalContent> = {
        ...content,
        engagement_metrics: {
          views: 0,
          likes: 0,
          shares: 0,
          time_spent_average: 0,
          completion_rate: 0,
          user_feedback_score: 0,
          effectiveness_rating: 0
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.create('ffa_motivational_content', newContent);
        this.invalidateCache();
        return result;
      }

      throw new Error('Database adapter not available');
    } catch (error) {
      console.error('Error creating content:', error);
      throw error;
    }
  }

  /**
   * Update content engagement metrics
   */
  async updateContentMetrics(contentId: string, event: ContentEngagementEvent): Promise<void> {
    try {
      if (!this.supabaseAdapter) return;

      const content = await this.supabaseAdapter.getById('ffa_motivational_content', contentId);
      if (!content) return;

      const metrics = content.engagement_metrics;
      
      // Update metrics based on event type
      if (event.event_type === 'view') {
        metrics.views = (metrics.views || 0) + 1;
      } else if (event.event_type === 'like') {
        metrics.likes = (metrics.likes || 0) + 1;
      } else if (event.event_type === 'share') {
        metrics.shares = (metrics.shares || 0) + 1;
      }

      // Update average time spent
      if (event.time_spent_seconds) {
        const currentAverage = metrics.time_spent_average || 0;
        const currentCount = metrics.views || 1;
        metrics.time_spent_average = ((currentAverage * (currentCount - 1)) + event.time_spent_seconds) / currentCount;
      }

      // Recalculate effectiveness rating
      metrics.effectiveness_rating = this.calculateEffectivenessScore(metrics);

      await this.supabaseAdapter.update('ffa_motivational_content', contentId, {
        engagement_metrics: metrics,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating content metrics:', error);
    }
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  private async loadContentCache(): Promise<void> {
    try {
      if (this.supabaseAdapter) {
        const content = await this.supabaseAdapter.query('ffa_motivational_content', {
          filters: { active: true },
          orderBy: { created_at: 'desc' }
        });

        // Group by category
        const contentByCategory = new Map<string, MotivationalContent[]>();
        content.forEach((c: MotivationalContent) => {
          const category = c.content_category;
          if (!contentByCategory.has(category)) {
            contentByCategory.set(category, []);
          }
          contentByCategory.get(category)!.push(c);
        });

        this.contentCache = contentByCategory;
        this.lastCacheUpdate = new Date();
      }
    } catch (error) {
      console.error('Error loading content cache:', error);
    }
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastCacheUpdate.getTime() > this.CACHE_DURATION) {
      await this.loadContentCache();
    }
  }

  private invalidateCache(): void {
    this.contentCache.clear();
    this.lastCacheUpdate = new Date(0);
  }

  private async getUserContext(userId: string): Promise<any> {
    // In a real implementation, this would fetch user's current degree level,
    // SAE projects, recent competitions, etc.
    return {
      degree_level: 'greenhand',
      active_sae_projects: 1,
      recent_competitions: ['speech'],
      learning_preferences: ['visual', 'practical']
    };
  }

  private getTimeOfDay(date: Date): MotivationalContentTiming {
    const hour = date.getHours();
    if (hour < 12) return MotivationalContentTiming.MORNING;
    if (hour < 17) return MotivationalContentTiming.AFTERNOON;
    return MotivationalContentTiming.EVENING;
  }

  private async getDailyTip(userId: string, userContext: any): Promise<MotivationalContent | null> {
    const tips = await this.getContentByCriteria({
      target_audience: 'student',
      content_category: 'daily_tips',
      context_tags: [userContext.degree_level]
    });

    return tips.length > 0 ? tips[0] : null;
  }

  private async getEncouragementContent(userId: string, userContext: any): Promise<MotivationalContent | null> {
    const encouragement = await this.getContentByCriteria({
      target_audience: 'student',
      content_category: 'encouragement'
    });

    return encouragement.length > 0 ? encouragement[0] : null;
  }

  private async getReminders(userId: string, userContext: any): Promise<MotivationalContent[]> {
    return await this.getContentByCriteria({
      target_audience: 'student',
      content_category: 'reminders',
      context_tags: ['sae', 'competition', 'deadlines']
    });
  }

  private async getCompetitionPrep(userId: string, userContext: any): Promise<MotivationalContent[]> {
    if (!userContext.recent_competitions || userContext.recent_competitions.length === 0) {
      return [];
    }

    return await this.getContentByCriteria({
      target_audience: 'student',
      content_category: 'competition_prep',
      context_tags: userContext.recent_competitions
    });
  }

  private async getSeasonalContent(userId: string, currentTime: Date): Promise<MotivationalContent[]> {
    const month = currentTime.getMonth();
    let season = 'spring';
    
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    return await this.getContentByCriteria({
      target_audience: 'student',
      content_category: 'seasonal',
      seasonal_relevance: [season]
    });
  }

  private calculateEngagementScore(event: ContentEngagementEvent): number {
    let score = 0;
    
    switch (event.event_type) {
      case 'view': score = 1; break;
      case 'like': score = 3; break;
      case 'share': score = 5; break;
      case 'save': score = 4; break;
      case 'helpful': score = 5; break;
      case 'not_helpful': score = -2; break;
      case 'dismiss': score = -1; break;
    }

    // Bonus for time spent
    if (event.time_spent_seconds) {
      score += Math.min(event.time_spent_seconds / 30, 2); // Max 2 points for time
    }

    return score;
  }

  private calculateEffectivenessScore(metrics: any): number {
    const engagementWeight = 0.4;
    const timeWeight = 0.3;
    const socialWeight = 0.3;

    const engagementScore = Math.min(metrics.engagement_rate || 0, 100) / 100;
    const timeScore = Math.min((metrics.average_time_spent || 0) / 60, 1); // Normalize to 60 seconds
    const socialScore = Math.min(((metrics.like_rate || 0) + (metrics.share_rate || 0)) / 2, 100) / 100;

    return (engagementScore * engagementWeight + timeScore * timeWeight + socialScore * socialWeight) * 100;
  }

  private async trackAnalyticsEvent(userId: string, eventData: any): Promise<void> {
    try {
      const analyticsEvent = {
        user_id: userId,
        event_type: 'motivational_content',
        event_category: 'engagement',
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

export const motivationalContentService = new MotivationalContentService();
export type {
  MotivationalContentRequest,
  ContentEngagementEvent,
  PersonalizedContentFeed,
  ContentPerformanceMetrics
};