/**
 * PhotoFeedCorrelationService - AI-Powered Visual Analysis & Feed Correlation
 * 
 * Handles computer vision analysis of livestock photos and correlates visual
 * indicators with feed performance data for comprehensive insights.
 */

import { 
  PhotoAnalysis, 
  HealthIndicator, 
  GrowthAssessment, 
  FeedImpactScore,
  FeedEntry 
} from '../models/FeedProduct';
import { Animal } from '../models/Animal';
import { zepMemoryService } from './ZepMemoryService';
import { analyticsService } from './AnalyticsService';
import { sentryService } from './SentryService';

export interface BodyConditionScore {
  score: number; // 1-9 scale
  confidence: number; // Percentage
  indicators: {
    ribCoverage: number;
    spinalCoverage: number;
    shoulderFillness: number;
    rumpFillness: number;
    overall: number;
  };
  recommendations: string[];
}

export interface VisualCorrelation {
  animalId: string;
  correlationStrength: number; // 1-100
  visualTrends: {
    bodyConditionTrend: 'improving' | 'stable' | 'declining';
    healthTrend: 'improving' | 'stable' | 'declining';
    growthTrend: 'above_average' | 'average' | 'below_average';
  };
  feedEffectiveness: {
    visualImpact: number; // 1-100
    healthImpact: number; // 1-100
    growthImpact: number; // 1-100
    overall: number; // 1-100
  };
  insights: string[];
  recommendations: string[];
}

export interface GrowthPrediction {
  animalId: string;
  currentEstimate: {
    weight: number;
    bodyCondition: number;
    frameSize: string;
  };
  predictions: {
    thirtyDays: {
      weight: number;
      bodyCondition: number;
      confidence: number;
    };
    sixtyDays: {
      weight: number;
      bodyCondition: number;
      confidence: number;
    };
    ninetyDays: {
      weight: number;
      bodyCondition: number;
      confidence: number;
    };
  };
  factorsConsidered: string[];
  recommendedFeeds: string[];
}

export interface VisualFeedReport {
  animalId: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  photoProgression: {
    photoCount: number;
    avgBodyCondition: number;
    conditionTrend: string;
    healthTrend: string;
  };
  feedProgression: {
    feedChanges: number;
    avgFeedCost: number;
    feedEffectiveness: number;
  };
  correlationAnalysis: {
    overallCorrelation: number;
    bodyConditionImprovement: number;
    feedEffectivenessScore: number;
    healthTrendScore: number;
    growthConsistency: number;
  };
  insights: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface AIPhotoAnalysisRequest {
  photoUri: string;
  animalId: string;
  animal: Animal;
  previousPhotos?: PhotoAnalysis[];
  recentFeeds?: FeedEntry[];
  metadata?: {
    lighting: 'excellent' | 'good' | 'fair' | 'poor';
    angle: 'side' | 'front' | 'rear' | 'three_quarter';
    distance: 'close' | 'medium' | 'far';
    background: 'clean' | 'cluttered';
  };
}

class PhotoFeedCorrelationService {
  private photoAnalyses: Map<string, PhotoAnalysis[]> = new Map(); // animalId -> analyses
  private bodyConditionHistory: Map<string, BodyConditionScore[]> = new Map();

  /**
   * Analyze body condition from photo using AI
   */
  async analyzeBodyCondition(photo: { uri: string; animalId: string; animal: Animal }): Promise<BodyConditionScore> {
    try {
      // Simulate AI analysis - in production, this would call an ML model
      const simulatedAnalysis = this.simulateBodyConditionAnalysis(photo.animal);
      
      // Store in history
      const animalHistory = this.bodyConditionHistory.get(photo.animalId) || [];
      animalHistory.push(simulatedAnalysis);
      this.bodyConditionHistory.set(photo.animalId, animalHistory);

      // Track analytics
      analyticsService.trackFeatureUsage('photo_analysis', {
        animal_species: photo.animal.species,
        body_condition_score: simulatedAnalysis.score,
        confidence: simulatedAnalysis.confidence,
        ai_model: 'body_condition_v2.1'
      });

      console.log(`📸 Body condition analyzed for ${photo.animalId}: ${simulatedAnalysis.score}/9`);
      return simulatedAnalysis;

    } catch (error) {
      console.error('❌ Failed to analyze body condition:', error);
      sentryService.captureError(error as Error, {
        feature: 'photo_analysis',
        action: 'body_condition',
        animal_id: photo.animalId
      });
      throw error;
    }
  }

  /**
   * Correlate feed history with visual progress
   */
  async correlateFeedToVisualProgress(
    photos: PhotoAnalysis[], 
    feeds: FeedEntry[]
  ): Promise<VisualCorrelation> {
    if (photos.length === 0) {
      throw new Error('No photos available for correlation analysis');
    }

    const animalId = photos[0].animalId;
    
    try {
      // Sort data chronologically
      const sortedPhotos = photos.sort((a, b) => a.date.getTime() - b.date.getTime());
      const sortedFeeds = feeds.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate trends
      const visualTrends = this.calculateVisualTrends(sortedPhotos);
      const feedEffectiveness = this.calculateFeedEffectiveness(sortedPhotos, sortedFeeds);
      const correlationStrength = this.calculateCorrelationStrength(sortedPhotos, sortedFeeds);

      const correlation: VisualCorrelation = {
        animalId,
        correlationStrength,
        visualTrends,
        feedEffectiveness,
        insights: this.generateVisualInsights(sortedPhotos, sortedFeeds),
        recommendations: this.generateCorrelationRecommendations(sortedPhotos, sortedFeeds)
      };

      // Add to Zep memory for learning
      await zepMemoryService.addPhotoAnalysis(sortedPhotos[sortedPhotos.length - 1]);

      console.log(`🔗 Visual-feed correlation completed for ${animalId}: ${correlationStrength}% strength`);
      return correlation;

    } catch (error) {
      console.error('❌ Failed to correlate feed to visual progress:', error);
      sentryService.captureError(error as Error, {
        feature: 'photo_correlation',
        action: 'correlate_feed_visual',
        animal_id: animalId
      });
      throw error;
    }
  }

  /**
   * Predict growth from photo history
   */
  async predictGrowthFromPhotos(photoHistory: PhotoAnalysis[]): Promise<GrowthPrediction> {
    if (photoHistory.length < 2) {
      throw new Error('Insufficient photo history for growth prediction');
    }

    const animalId = photoHistory[0].animalId;
    
    try {
      const sortedPhotos = photoHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
      const latestPhoto = sortedPhotos[sortedPhotos.length - 1];
      
      // Calculate growth rates from visual data
      const growthRate = this.calculateVisualGrowthRate(sortedPhotos);
      const conditionRate = this.calculateBodyConditionRate(sortedPhotos);

      const prediction: GrowthPrediction = {
        animalId,
        currentEstimate: {
          weight: latestPhoto.analysisResults.estimatedWeight,
          bodyCondition: latestPhoto.analysisResults.bodyConditionScore,
          frameSize: latestPhoto.analysisResults.growthAssessment.frame_size
        },
        predictions: {
          thirtyDays: {
            weight: latestPhoto.analysisResults.estimatedWeight + (growthRate * 30),
            bodyCondition: Math.min(9, latestPhoto.analysisResults.bodyConditionScore + (conditionRate * 30)),
            confidence: 85
          },
          sixtyDays: {
            weight: latestPhoto.analysisResults.estimatedWeight + (growthRate * 60),
            bodyCondition: Math.min(9, latestPhoto.analysisResults.bodyConditionScore + (conditionRate * 60)),
            confidence: 75
          },
          ninetyDays: {
            weight: latestPhoto.analysisResults.estimatedWeight + (growthRate * 90),
            bodyCondition: Math.min(9, latestPhoto.analysisResults.bodyConditionScore + (conditionRate * 90)),
            confidence: 65
          }
        },
        factorsConsidered: [
          'Visual growth progression',
          'Body condition trends',
          'Frame size development',
          'Muscle definition changes',
          'Fat distribution patterns'
        ],
        recommendedFeeds: this.getRecommendedFeedsForGrowth(latestPhoto)
      };

      console.log(`📈 Growth prediction completed for ${animalId}`);
      return prediction;

    } catch (error) {
      console.error('❌ Failed to predict growth from photos:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive visual-feed report
   */
  async generateVisualFeedReport(animal: Animal): Promise<VisualFeedReport> {
    const animalId = animal.id;
    const photos = this.photoAnalyses.get(animalId) || [];
    
    if (photos.length === 0) {
      throw new Error(`No photo analysis data available for animal ${animalId}`);
    }

    try {
      const sortedPhotos = photos.sort((a, b) => a.date.getTime() - b.date.getTime());
      const reportPeriod = {
        startDate: sortedPhotos[0].date,
        endDate: sortedPhotos[sortedPhotos.length - 1].date
      };

      // Get feed data (would integrate with FeedIntelligenceService in production)
      const feedData = this.getMockFeedData(animalId);

      const report: VisualFeedReport = {
        animalId,
        reportPeriod,
        photoProgression: {
          photoCount: photos.length,
          avgBodyCondition: this.calculateAverageBodyCondition(sortedPhotos),
          conditionTrend: this.getBodyConditionTrend(sortedPhotos),
          healthTrend: this.getHealthTrend(sortedPhotos)
        },
        feedProgression: {
          feedChanges: feedData.length,
          avgFeedCost: this.calculateAverageFeedCost(feedData),
          feedEffectiveness: this.calculateOverallFeedEffectiveness(sortedPhotos, feedData)
        },
        correlationAnalysis: {
          overallCorrelation: this.calculateOverallCorrelation(sortedPhotos, feedData),
          bodyConditionImprovement: this.calculateBodyConditionImprovement(sortedPhotos),
          feedEffectivenessScore: this.calculateFeedEffectivenessScore(sortedPhotos, feedData),
          healthTrendScore: this.calculateHealthTrendScore(sortedPhotos),
          growthConsistency: this.calculateGrowthConsistency(sortedPhotos)
        },
        insights: this.generateComprehensiveInsights(sortedPhotos, feedData),
        recommendations: this.generateComprehensiveRecommendations(sortedPhotos, feedData),
        nextSteps: this.generateNextSteps(sortedPhotos, feedData)
      };

      console.log(`📋 Visual-feed report generated for ${animal.name}`);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate visual-feed report:', error);
      throw error;
    }
  }

  /**
   * Process comprehensive photo analysis with AI
   */
  async processPhotoAnalysis(request: AIPhotoAnalysisRequest): Promise<PhotoAnalysis> {
    try {
      // Simulate comprehensive AI analysis
      const analysis = this.simulateComprehensivePhotoAnalysis(request);
      
      // Store analysis
      const animalAnalyses = this.photoAnalyses.get(request.animalId) || [];
      animalAnalyses.push(analysis);
      this.photoAnalyses.set(request.animalId, animalAnalyses);

      // Track comprehensive analytics
      analyticsService.trackFeatureUsage('comprehensive_photo_analysis', {
        animal_species: request.animal.species,
        body_condition_score: analysis.analysisResults.bodyConditionScore,
        estimated_weight: analysis.analysisResults.estimatedWeight,
        health_indicators_count: analysis.analysisResults.healthIndicators.length,
        feed_correlation_score: analysis.analysisResults.feedCorrelation.overall_score,
        ai_confidence: analysis.aiMetrics.confidence,
        processing_time: analysis.aiMetrics.processingTime
      });

      console.log(`🤖 Comprehensive photo analysis completed for ${request.animalId}`);
      return analysis;

    } catch (error) {
      console.error('❌ Failed to process photo analysis:', error);
      sentryService.captureError(error as Error, {
        feature: 'photo_analysis',
        action: 'comprehensive_analysis',
        animal_id: request.animalId
      });
      throw error;
    }
  }

  // Private helper methods

  private simulateBodyConditionAnalysis(animal: Animal): BodyConditionScore {
    // Simulate realistic body condition scoring
    const baseScore = 5 + (Math.random() * 2 - 1); // 4-6 range with variation
    const confidence = 85 + Math.random() * 10; // 85-95% confidence

    return {
      score: Math.round(baseScore * 10) / 10,
      confidence: Math.round(confidence),
      indicators: {
        ribCoverage: Math.round((baseScore + Math.random() * 0.5 - 0.25) * 10) / 10,
        spinalCoverage: Math.round((baseScore + Math.random() * 0.5 - 0.25) * 10) / 10,
        shoulderFillness: Math.round((baseScore + Math.random() * 0.5 - 0.25) * 10) / 10,
        rumpFillness: Math.round((baseScore + Math.random() * 0.5 - 0.25) * 10) / 10,
        overall: Math.round(baseScore * 10) / 10
      },
      recommendations: this.generateBCSRecommendations(baseScore)
    };
  }

  private simulateComprehensivePhotoAnalysis(request: AIPhotoAnalysisRequest): PhotoAnalysis {
    const baseWeight = request.animal.weight || 65;
    const bodyConditionScore = 4.5 + Math.random() * 2; // 4.5-6.5 range
    
    return {
      id: `photo_analysis_${Date.now()}`,
      animalId: request.animalId,
      photoUri: request.photoUri,
      analysisResults: {
        bodyConditionScore: Math.round(bodyConditionScore * 10) / 10,
        estimatedWeight: Math.round(baseWeight + (Math.random() * 10 - 5)),
        healthIndicators: this.generateHealthIndicators(),
        growthAssessment: this.generateGrowthAssessment(request.animal),
        feedCorrelation: this.generateFeedImpactScore()
      },
      aiMetrics: {
        confidence: 88 + Math.random() * 8, // 88-96%
        processingTime: 1200 + Math.random() * 800, // 1.2-2.0 seconds
        modelVersion: 'livestock_vision_v2.1.0',
        features_detected: [
          'body_outline',
          'rib_coverage',
          'spine_visibility',
          'muscle_definition',
          'fat_distribution',
          'overall_condition'
        ]
      },
      comparisonData: request.previousPhotos ? this.generateComparisonData(request.previousPhotos) : undefined,
      feedCorrelationData: request.recentFeeds ? this.generateFeedCorrelationData(request.recentFeeds) : undefined,
      date: new Date(),
      createdAt: new Date()
    };
  }

  private generateHealthIndicators(): HealthIndicator[] {
    return [
      {
        type: 'coat_condition',
        score: 7 + Math.random() * 2,
        notes: 'Coat appears healthy with good shine',
        severity: 'normal'
      },
      {
        type: 'eye_brightness',
        score: 8 + Math.random() * 1.5,
        notes: 'Eyes are bright and alert',
        severity: 'normal'
      },
      {
        type: 'posture',
        score: 7.5 + Math.random() * 1.5,
        notes: 'Standing posture is normal',
        severity: 'normal'
      },
      {
        type: 'muscle_definition',
        score: 6 + Math.random() * 2,
        notes: 'Muscle development appropriate for age',
        severity: 'normal'
      }
    ];
  }

  private generateGrowthAssessment(animal: Animal): GrowthAssessment {
    return {
      frame_size: animal.species === 'Goat' ? 'medium' : 'large',
      muscle_development: 6 + Math.random() * 2,
      fat_distribution: 5 + Math.random() * 2,
      overall_conformation: 7 + Math.random() * 1.5,
      growth_stage: 'growing'
    };
  }

  private generateFeedImpactScore(): FeedImpactScore {
    return {
      overall_score: 75 + Math.random() * 20,
      nutrition_adequacy: 80 + Math.random() * 15,
      feed_efficiency_visual: 70 + Math.random() * 25,
      health_impact: 85 + Math.random() * 10,
      growth_progression: 75 + Math.random() * 20
    };
  }

  private generateBCSRecommendations(score: number): string[] {
    if (score < 4) {
      return [
        'Increase feed quantity',
        'Consider higher energy feed',
        'Monitor for health issues',
        'Consult veterinarian if condition persists'
      ];
    } else if (score > 7) {
      return [
        'Reduce feed quantity',
        'Increase exercise',
        'Monitor for metabolic issues',
        'Switch to maintenance feed'
      ];
    } else {
      return [
        'Maintain current feeding program',
        'Continue regular monitoring',
        'Ensure adequate nutrition'
      ];
    }
  }

  private calculateVisualTrends(photos: PhotoAnalysis[]): any {
    if (photos.length < 2) {
      return {
        bodyConditionTrend: 'stable',
        healthTrend: 'stable',
        growthTrend: 'average'
      };
    }

    const first = photos[0];
    const last = photos[photos.length - 1];
    
    const bcsChange = last.analysisResults.bodyConditionScore - first.analysisResults.bodyConditionScore;
    const weightChange = last.analysisResults.estimatedWeight - first.analysisResults.estimatedWeight;
    
    return {
      bodyConditionTrend: bcsChange > 0.3 ? 'improving' : bcsChange < -0.3 ? 'declining' : 'stable',
      healthTrend: 'stable', // Would analyze health indicators over time
      growthTrend: weightChange > 5 ? 'above_average' : weightChange < -2 ? 'below_average' : 'average'
    };
  }

  private calculateFeedEffectiveness(photos: PhotoAnalysis[], feeds: FeedEntry[]): any {
    // Simplified calculation - would be more sophisticated in production
    const avgFeedCorrelation = photos.reduce((sum, photo) => 
      sum + photo.analysisResults.feedCorrelation.overall_score, 0) / photos.length;

    return {
      visualImpact: Math.round(avgFeedCorrelation),
      healthImpact: Math.round(avgFeedCorrelation * 1.1),
      growthImpact: Math.round(avgFeedCorrelation * 0.9),
      overall: Math.round(avgFeedCorrelation)
    };
  }

  private calculateCorrelationStrength(photos: PhotoAnalysis[], feeds: FeedEntry[]): number {
    // Statistical correlation would be calculated here
    return Math.round(75 + Math.random() * 20); // Placeholder
  }

  private generateVisualInsights(photos: PhotoAnalysis[], feeds: FeedEntry[]): string[] {
    return [
      'Body condition has improved consistently over the monitoring period',
      'Feed changes appear to correlate positively with visual health indicators',
      'Growth progression is on track for age and breed',
      'Health indicators remain within normal ranges'
    ];
  }

  private generateCorrelationRecommendations(photos: PhotoAnalysis[], feeds: FeedEntry[]): string[] {
    return [
      'Continue current feeding program as it shows positive results',
      'Monitor body condition weekly for continued improvement',
      'Consider slight feed adjustments if growth slows',
      'Maintain consistent photo documentation for tracking'
    ];
  }

  private calculateVisualGrowthRate(photos: PhotoAnalysis[]): number {
    if (photos.length < 2) return 0;
    
    const weightDiff = photos[photos.length - 1].analysisResults.estimatedWeight - photos[0].analysisResults.estimatedWeight;
    const daysDiff = Math.ceil((photos[photos.length - 1].date.getTime() - photos[0].date.getTime()) / (1000 * 60 * 60 * 24));
    
    return weightDiff / daysDiff; // Pounds per day
  }

  private calculateBodyConditionRate(photos: PhotoAnalysis[]): number {
    if (photos.length < 2) return 0;
    
    const bcsDiff = photos[photos.length - 1].analysisResults.bodyConditionScore - photos[0].analysisResults.bodyConditionScore;
    const daysDiff = Math.ceil((photos[photos.length - 1].date.getTime() - photos[0].date.getTime()) / (1000 * 60 * 60 * 24));
    
    return bcsDiff / daysDiff; // BCS points per day
  }

  private getRecommendedFeedsForGrowth(photo: PhotoAnalysis): string[] {
    const bcs = photo.analysisResults.bodyConditionScore;
    
    if (bcs < 5) {
      return ['high_energy_grower', 'performance_feed', 'supplement_feed'];
    } else if (bcs > 6.5) {
      return ['maintenance_feed', 'lower_energy_feed'];
    } else {
      return ['balanced_grower', 'quality_feed'];
    }
  }

  // Additional helper methods for report generation
  private getMockFeedData(animalId: string): FeedEntry[] {
    // Would integrate with FeedIntelligenceService
    return [];
  }

  private calculateAverageBodyCondition(photos: PhotoAnalysis[]): number {
    return photos.reduce((sum, photo) => sum + photo.analysisResults.bodyConditionScore, 0) / photos.length;
  }

  private getBodyConditionTrend(photos: PhotoAnalysis[]): string {
    const trends = this.calculateVisualTrends(photos);
    return trends.bodyConditionTrend;
  }

  private getHealthTrend(photos: PhotoAnalysis[]): string {
    return 'stable'; // Simplified for demo
  }

  private calculateAverageFeedCost(feeds: FeedEntry[]): number {
    return feeds.reduce((sum, feed) => sum + feed.cost, 0) / Math.max(feeds.length, 1);
  }

  private calculateOverallFeedEffectiveness(photos: PhotoAnalysis[], feeds: FeedEntry[]): number {
    return 82; // Placeholder
  }

  private calculateOverallCorrelation(photos: PhotoAnalysis[], feeds: FeedEntry[]): number {
    return 77; // Placeholder
  }

  private calculateBodyConditionImprovement(photos: PhotoAnalysis[]): number {
    if (photos.length < 2) return 0;
    return ((photos[photos.length - 1].analysisResults.bodyConditionScore - photos[0].analysisResults.bodyConditionScore) / photos[0].analysisResults.bodyConditionScore) * 100;
  }

  private calculateFeedEffectivenessScore(photos: PhotoAnalysis[], feeds: FeedEntry[]): number {
    return 85; // Placeholder
  }

  private calculateHealthTrendScore(photos: PhotoAnalysis[]): number {
    return 90; // Placeholder
  }

  private calculateGrowthConsistency(photos: PhotoAnalysis[]): number {
    return 88; // Placeholder
  }

  private generateComprehensiveInsights(photos: PhotoAnalysis[], feeds: FeedEntry[]): string[] {
    return [
      'Visual analysis shows consistent growth and health improvements',
      'Feed correlation analysis indicates optimal nutrition timing',
      'Body condition progression is within expected parameters',
      'Health indicators remain consistently positive'
    ];
  }

  private generateComprehensiveRecommendations(photos: PhotoAnalysis[], feeds: FeedEntry[]): string[] {
    return [
      'Continue current feeding and monitoring schedule',
      'Consider implementing precision feeding based on body condition',
      'Maintain consistent photo documentation angles and timing',
      'Monitor for seasonal changes in body condition'
    ];
  }

  private generateNextSteps(photos: PhotoAnalysis[], feeds: FeedEntry[]): string[] {
    return [
      'Take next scheduled photo in 7 days',
      'Record feed intake and costs',
      'Monitor weight if scale is available',
      'Update journal with observations'
    ];
  }

  private generateComparisonData(previousPhotos: PhotoAnalysis[]): any {
    const latest = previousPhotos[previousPhotos.length - 1];
    const timeDiff = Math.ceil((new Date().getTime() - latest.date.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      previousPhotoId: latest.id,
      timeDifference: timeDiff,
      weightChange: Math.random() * 4 - 2, // -2 to +2 pounds
      conditionChange: Math.random() * 0.6 - 0.3 // -0.3 to +0.3 BCS
    };
  }

  private generateFeedCorrelationData(recentFeeds: FeedEntry[]): any {
    return {
      recentFeeds: recentFeeds.slice(-3).map(f => f.feedProductId),
      feedImpactScore: 75 + Math.random() * 20,
      visualFeedEffectiveness: 80 + Math.random() * 15
    };
  }
}

// Export singleton instance
export const photoFeedCorrelationService = new PhotoFeedCorrelationService();