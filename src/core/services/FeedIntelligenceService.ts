/**
 * FeedIntelligenceService - Advanced Feed Analytics & Correlation Engine
 * 
 * Handles feed product analysis, FCR calculations, photo-feed correlations,
 * and research-grade data collection for business intelligence.
 */

import { 
  FeedProduct, 
  FeedEntry, 
  FCRAnalysis, 
  PhotoAnalysis, 
  FeedRecommendation,
  PricePoint 
} from '../models/FeedProduct';
import { Animal } from '../models/Animal';
import { Weight } from '../models/Weight';
import { zepMemoryService } from './ZepMemoryService';
import { analyticsService } from './AnalyticsService';
import { sentryService } from './SentryService';

export interface FeedAnalysis {
  feedProductId: string;
  performanceScore: number; // 1-100
  efficiency: {
    feedConversionRatio: number;
    costEfficiency: number;
    growthRate: number;
    healthImpact: number;
  };
  recommendations: string[];
  comparisonData: {
    industryBenchmark: number;
    userAverage: number;
    improvementOpportunity: number;
  };
}

export interface VisualFeedCorrelation {
  animalId: string;
  photoAnalysis: PhotoAnalysis;
  feedHistory: FeedEntry[];
  correlationScore: number; // 1-100
  insights: {
    bodyConditionTrend: 'improving' | 'stable' | 'declining';
    feedEffectiveness: number; // 1-100
    visualHealthScore: number; // 1-100
    recommendedAdjustments: string[];
  };
}

export interface GrowthPrediction {
  animalId: string;
  currentWeight: number;
  predictedWeights: {
    days30: number;
    days60: number;
    days90: number;
  };
  confidenceLevel: number; // Percentage
  factorsConsidered: string[];
  feedRecommendations: FeedRecommendation[];
}

export interface VisualFeedReport {
  animalId: string;
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  photoProgression: PhotoAnalysis[];
  feedProgression: FeedEntry[];
  correlationAnalysis: {
    overallCorrelation: number;
    bodyConditionImprovement: number;
    feedEffectivenessScore: number;
    healthTrendScore: number;
  };
  insights: string[];
  recommendations: FeedRecommendation[];
}

export interface PerformanceGoals {
  targetWeight: number;
  targetDate: Date;
  maxBudget: number;
  focusAreas: ('growth' | 'efficiency' | 'health' | 'cost')[];
}

export interface FeedReport {
  userId: string;
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalAnimals: number;
    totalFeedCost: number;
    averageFCR: number;
    topPerformingFeeds: string[];
    costSavingsOpportunities: number;
  };
  animalPerformance: Array<{
    animalId: string;
    fcr: number;
    dailyGain: number;
    costPerPound: number;
    recommendations: string[];
  }>;
  brandAnalysis: Array<{
    brand: string;
    performanceScore: number;
    costEffectiveness: number;
    recommendationLevel: 'highly_recommended' | 'recommended' | 'adequate' | 'not_recommended';
  }>;
  marketIntelligence: {
    priceTrends: PricePoint[];
    availabilityAlerts: string[];
    newProductRecommendations: string[];
  };
}

class FeedIntelligenceService {
  private feedDatabase: Map<string, FeedProduct> = new Map();
  private feedEntries: Map<string, FeedEntry[]> = new Map(); // animalId -> entries
  private fcrAnalyses: Map<string, FCRAnalysis[]> = new Map(); // animalId -> analyses
  private photoAnalyses: Map<string, PhotoAnalysis[]> = new Map(); // animalId -> photos

  constructor() {
    this.initializeFeedDatabase();
  }

  /**
   * Initialize with sample feed products for demonstration
   */
  private initializeFeedDatabase(): void {
    const sampleFeeds: FeedProduct[] = [
      {
        id: 'feed_001',
        brand: 'Purina',
        productName: 'Goat Chow Complete',
        category: 'grower',
        species: 'Goat',
        nutritionalProfile: {
          protein: 16.0,
          fat: 3.5,
          fiber: 15.0,
          ash: 8.0,
          moisture: 12.0,
          carbohydrates: 45.5,
          calcium: 1.2,
          phosphorus: 0.8,
          salt: 0.5,
          additives: ['Vitamin A', 'Vitamin D3', 'Vitamin E', 'Copper', 'Zinc'],
          energyDensity: 2800
        },
        performanceMetrics: {
          avgFCR: 6.2,
          avgDailyGain: 0.35,
          costPerPound: 0.42,
          efficiency_score: 78,
          palatability: 8.5,
          digestibility: 82
        },
        researchData: {
          studyCount: 15,
          confidenceLevel: 85,
          sampleSize: 1250,
          significantFindings: [
            'Improved daily gain compared to generic feeds',
            'Better feed conversion in growing goats',
            'Higher palatability scores'
          ],
          lastUpdated: new Date()
        },
        marketData: {
          currentPrice: 18.99,
          priceHistory: [],
          availability: 'high',
          popularityScore: 82,
          regionAvailability: ['US', 'Canada']
        },
        manufacturer: {
          company: 'Purina Animal Nutrition',
          contact: 'support@purina.com',
          website: 'https://www.purina.com',
          certifications: ['Non-GMO', 'Quality Assured']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'feed_002',
        brand: 'Southern States',
        productName: 'All Stock Feed',
        category: 'maintenance',
        species: 'Multi-Species',
        nutritionalProfile: {
          protein: 14.0,
          fat: 3.0,
          fiber: 18.0,
          ash: 7.5,
          moisture: 11.0,
          carbohydrates: 46.5,
          calcium: 1.0,
          phosphorus: 0.7,
          salt: 0.5,
          additives: ['Vitamin A', 'Vitamin D3', 'Salt'],
          energyDensity: 2650
        },
        performanceMetrics: {
          avgFCR: 7.1,
          avgDailyGain: 0.28,
          costPerPound: 0.38,
          efficiency_score: 72,
          palatability: 7.8,
          digestibility: 78
        },
        researchData: {
          studyCount: 8,
          confidenceLevel: 78,
          sampleSize: 890,
          significantFindings: [
            'Cost-effective maintenance nutrition',
            'Suitable for multiple species',
            'Good palatability across species'
          ],
          lastUpdated: new Date()
        },
        marketData: {
          currentPrice: 16.49,
          priceHistory: [],
          availability: 'high',
          popularityScore: 75,
          regionAvailability: ['US Southeast', 'Mid-Atlantic']
        },
        manufacturer: {
          company: 'Southern States Cooperative',
          contact: 'info@southernstates.com',
          website: 'https://www.southernstates.com',
          certifications: ['Quality Assured']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleFeeds.forEach(feed => {
      this.feedDatabase.set(feed.id, feed);
    });

    console.log(`🌾 Feed database initialized with ${sampleFeeds.length} products`);
  }

  /**
   * Analyze feed performance for specific animal
   */
  async analyzeFeedPerformance(animalId: string, feedId: string): Promise<FeedAnalysis> {
    try {
      const feedProduct = this.feedDatabase.get(feedId);
      if (!feedProduct) {
        throw new Error(`Feed product not found: ${feedId}`);
      }

      const animalFeeds = this.feedEntries.get(animalId) || [];
      const feedSpecificEntries = animalFeeds.filter(entry => entry.feedProductId === feedId);
      
      if (feedSpecificEntries.length === 0) {
        throw new Error(`No feed entries found for animal ${animalId} with feed ${feedId}`);
      }

      // Calculate performance metrics
      const totalFeedCost = feedSpecificEntries.reduce((sum, entry) => sum + entry.cost, 0);
      const totalFeedAmount = feedSpecificEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const avgCostPerPound = totalFeedCost / totalFeedAmount;

      // Get FCR data if available
      const fcrAnalyses = this.fcrAnalyses.get(animalId) || [];
      const relevantFCR = fcrAnalyses.find(fcr => fcr.feedProductId === feedId);

      const performanceScore = this.calculatePerformanceScore(feedProduct, relevantFCR, avgCostPerPound);

      const analysis: FeedAnalysis = {
        feedProductId: feedId,
        performanceScore,
        efficiency: {
          feedConversionRatio: relevantFCR?.metrics.feedConversionRatio || feedProduct.performanceMetrics.avgFCR,
          costEfficiency: this.calculateCostEfficiency(avgCostPerPound, feedProduct.marketData.currentPrice),
          growthRate: relevantFCR?.metrics.avgDailyGain || feedProduct.performanceMetrics.avgDailyGain,
          healthImpact: feedProduct.performanceMetrics.efficiency_score
        },
        recommendations: this.generateFeedRecommendations(feedProduct, relevantFCR),
        comparisonData: {
          industryBenchmark: feedProduct.performanceMetrics.avgFCR,
          userAverage: relevantFCR?.metrics.feedConversionRatio || feedProduct.performanceMetrics.avgFCR,
          improvementOpportunity: this.calculateImprovementOpportunity(feedProduct, relevantFCR)
        }
      };

      // Track analytics
      analyticsService.trackFeatureUsage('feed_analysis', {
        feed_product: feedId,
        animal_id: animalId,
        performance_score: performanceScore,
        feed_brand: feedProduct.brand
      });

      console.log(`📊 Feed analysis completed for ${animalId} with ${feedId}`);
      return analysis;

    } catch (error) {
      console.error('❌ Failed to analyze feed performance:', error);
      sentryService.captureError(error as Error, {
        feature: 'feed_intelligence',
        action: 'analyze_performance',
        animal_id: animalId,
        feed_id: feedId
      });
      throw error;
    }
  }

  /**
   * Calculate Feed Conversion Ratio
   */
  async calculateFCR(weightHistory: Weight[], feedHistory: FeedEntry[]): Promise<FCRAnalysis> {
    if (weightHistory.length < 2) {
      throw new Error('Insufficient weight data for FCR calculation');
    }

    if (feedHistory.length === 0) {
      throw new Error('No feed data available for FCR calculation');
    }

    const sortedWeights = weightHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
    const sortedFeeds = feedHistory.sort((a, b) => a.date.getTime() - b.date.getTime());

    const startWeight = sortedWeights[0].weight;
    const endWeight = sortedWeights[sortedWeights.length - 1].weight;
    const totalWeightGained = endWeight - startWeight;

    const startDate = sortedWeights[0].date;
    const endDate = sortedWeights[sortedWeights.length - 1].date;
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const totalFeedConsumed = sortedFeeds.reduce((sum, feed) => sum + feed.amount, 0);
    const totalFeedCost = sortedFeeds.reduce((sum, feed) => sum + feed.cost, 0);

    const feedConversionRatio = totalFeedConsumed / totalWeightGained;
    const avgDailyGain = totalWeightGained / daysDifference;
    const costPerPoundGain = totalFeedCost / totalWeightGained;

    // Get primary feed product for benchmarking
    const primaryFeedId = this.getPrimaryFeedId(feedHistory);
    const primaryFeed = this.feedDatabase.get(primaryFeedId);

    const analysis: FCRAnalysis = {
      id: `fcr_${Date.now()}`,
      animalId: sortedWeights[0].animalId,
      feedProductId: primaryFeedId,
      timeframe: {
        startDate,
        endDate
      },
      metrics: {
        feedConversionRatio,
        avgDailyGain,
        feedEfficiency: totalWeightGained / totalFeedConsumed,
        costPerPoundGain,
        totalFeedConsumed,
        totalWeightGained,
        totalCost: totalFeedCost
      },
      benchmarkComparison: {
        industryAverage: primaryFeed?.performanceMetrics.avgFCR || 6.5,
        speciesAverage: this.getSpeciesAverageFCR(sortedWeights[0].animalId),
        breedAverage: 6.2, // Would be calculated from breed-specific data
        performanceRanking: this.getPerformanceRanking(feedConversionRatio, primaryFeed?.performanceMetrics.avgFCR || 6.5)
      },
      recommendations: [],
      createdAt: new Date()
    };

    // Store FCR analysis
    const animalFCRs = this.fcrAnalyses.get(analysis.animalId) || [];
    animalFCRs.push(analysis);
    this.fcrAnalyses.set(analysis.animalId, animalFCRs);

    // Add to Zep memory
    await zepMemoryService.addFeedIntelligence(analysis.animalId, sortedFeeds[0], analysis);

    console.log(`🧮 FCR calculated: ${feedConversionRatio.toFixed(2)} for animal ${analysis.animalId}`);
    return analysis;
  }

  /**
   * Predict optimal feed for animal based on goals
   */
  async predictOptimalFeed(animal: Animal, goals: PerformanceGoals): Promise<FeedRecommendation> {
    try {
      const availableFeeds = Array.from(this.feedDatabase.values())
        .filter(feed => feed.species === animal.species || feed.species === 'Multi-Species');

      // Score feeds based on goals
      const scoredFeeds = availableFeeds.map(feed => ({
        feed,
        score: this.calculateGoalFitScore(feed, goals, animal)
      })).sort((a, b) => b.score - a.score);

      const bestFeed = scoredFeeds[0].feed;

      const recommendation: FeedRecommendation = {
        id: `rec_${Date.now()}`,
        type: 'feed_change',
        priority: 'high',
        title: `Optimal Feed Recommendation: ${bestFeed.brand} ${bestFeed.productName}`,
        description: `Based on your goals for ${animal.name}, this feed offers the best combination of performance and cost-effectiveness.`,
        expectedImprovement: {
          fcrImprovement: 8.5,
          costSavings: 15.50,
          timeToResult: 21
        },
        recommendedProducts: [bestFeed.id],
        implementation: {
          steps: [
            'Gradually transition over 7-10 days',
            'Monitor feed intake and weight gain',
            'Track cost savings and performance improvements',
            'Adjust amounts based on body condition'
          ],
          timeline: '2-3 weeks for full transition and initial results',
          monitoring: [
            'Daily feed intake',
            'Weekly weight checks',
            'Body condition scoring',
            'Cost tracking'
          ]
        },
        confidence: 85,
        createdAt: new Date()
      };

      console.log(`🎯 Optimal feed predicted for ${animal.name}: ${bestFeed.productName}`);
      return recommendation;

    } catch (error) {
      console.error('❌ Failed to predict optimal feed:', error);
      throw error;
    }
  }

  /**
   * Correlate photo analysis with feed data
   */
  async correlateFeedToVisualProgress(photos: PhotoAnalysis[], feeds: FeedEntry[]): Promise<VisualFeedCorrelation> {
    if (photos.length === 0 || feeds.length === 0) {
      throw new Error('Insufficient data for visual correlation analysis');
    }

    const sortedPhotos = photos.sort((a, b) => a.date.getTime() - b.date.getTime());
    const animalId = sortedPhotos[0].animalId;

    // Calculate trends
    const bodyConditionTrend = this.calculateBodyConditionTrend(sortedPhotos);
    const feedEffectiveness = this.calculateVisualFeedEffectiveness(sortedPhotos, feeds);
    const visualHealthScore = this.calculateVisualHealthScore(sortedPhotos);

    const correlation: VisualFeedCorrelation = {
      animalId,
      photoAnalysis: sortedPhotos[sortedPhotos.length - 1], // Latest photo
      feedHistory: feeds,
      correlationScore: this.calculatePhotoFeedCorrelationScore(sortedPhotos, feeds),
      insights: {
        bodyConditionTrend,
        feedEffectiveness,
        visualHealthScore,
        recommendedAdjustments: this.generateVisualFeedAdjustments(sortedPhotos, feeds)
      }
    };

    // Store photo analysis data
    this.photoAnalyses.set(animalId, sortedPhotos);

    // Add to Zep memory
    await zepMemoryService.addPhotoAnalysis(sortedPhotos[sortedPhotos.length - 1]);

    console.log(`📸 Visual-feed correlation completed for animal ${animalId}`);
    return correlation;
  }

  /**
   * Generate comprehensive feed report
   */
  async generateFeedReport(timeframe: { startDate: Date; endDate: Date }): Promise<FeedReport> {
    // Implementation would aggregate data across all animals
    // For now, providing a sample structure
    
    const report: FeedReport = {
      userId: 'current_user', // Would get from context
      timeframe,
      summary: {
        totalAnimals: this.feedEntries.size,
        totalFeedCost: 0, // Calculate from all entries
        averageFCR: 0, // Calculate from all FCR analyses
        topPerformingFeeds: [],
        costSavingsOpportunities: 0
      },
      animalPerformance: [],
      brandAnalysis: [],
      marketIntelligence: {
        priceTrends: [],
        availabilityAlerts: [],
        newProductRecommendations: []
      }
    };

    console.log('📋 Feed report generated');
    return report;
  }

  // Private helper methods
  private calculatePerformanceScore(feed: FeedProduct, fcr?: FCRAnalysis, avgCost?: number): number {
    let score = feed.performanceMetrics.efficiency_score;
    
    if (fcr) {
      // Adjust score based on actual FCR performance
      const fcrRatio = feed.performanceMetrics.avgFCR / fcr.metrics.feedConversionRatio;
      score = score * Math.min(fcrRatio, 1.5); // Cap improvement at 50%
    }
    
    if (avgCost && avgCost < feed.marketData.currentPrice) {
      score += 5; // Bonus for cost savings
    }
    
    return Math.min(Math.round(score), 100);
  }

  private calculateCostEfficiency(actualCost: number, marketPrice: number): number {
    return Math.max(0, 100 - ((actualCost - marketPrice) / marketPrice * 100));
  }

  private generateFeedRecommendations(feed: FeedProduct, fcr?: FCRAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (fcr && fcr.metrics.feedConversionRatio > feed.performanceMetrics.avgFCR * 1.1) {
      recommendations.push('Consider reducing feed amounts or improving feed quality');
    }
    
    if (feed.performanceMetrics.palatability < 8) {
      recommendations.push('Monitor animal acceptance and consider alternative feeds');
    }
    
    recommendations.push('Continue monitoring for optimal results');
    return recommendations;
  }

  private calculateImprovementOpportunity(feed: FeedProduct, fcr?: FCRAnalysis): number {
    if (!fcr) return 0;
    
    const potentialImprovement = fcr.metrics.feedConversionRatio - feed.performanceMetrics.avgFCR;
    return Math.max(0, (potentialImprovement / fcr.metrics.feedConversionRatio) * 100);
  }

  private getPrimaryFeedId(feedHistory: FeedEntry[]): string {
    // Return the most frequently used feed
    const feedCounts = feedHistory.reduce((acc, feed) => {
      acc[feed.feedProductId] = (acc[feed.feedProductId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(feedCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  private getSpeciesAverageFCR(animalId: string): number {
    // Would calculate from species-specific data
    return 6.3; // Placeholder
  }

  private getPerformanceRanking(fcr: number, benchmark: number): 'excellent' | 'good' | 'average' | 'below_average' | 'poor' {
    const ratio = fcr / benchmark;
    if (ratio <= 0.9) return 'excellent';
    if (ratio <= 1.0) return 'good';
    if (ratio <= 1.1) return 'average';
    if (ratio <= 1.2) return 'below_average';
    return 'poor';
  }

  private calculateGoalFitScore(feed: FeedProduct, goals: PerformanceGoals, animal: Animal): number {
    let score = 0;
    
    // Weight goal consideration
    if (goals.focusAreas.includes('growth')) {
      score += feed.performanceMetrics.avgDailyGain * 100;
    }
    
    // Efficiency consideration
    if (goals.focusAreas.includes('efficiency')) {
      score += (10 - feed.performanceMetrics.avgFCR) * 10;
    }
    
    // Cost consideration
    if (goals.focusAreas.includes('cost')) {
      score += Math.max(0, (1 - feed.performanceMetrics.costPerPound) * 100);
    }
    
    // Health consideration
    if (goals.focusAreas.includes('health')) {
      score += feed.performanceMetrics.efficiency_score;
    }
    
    return score;
  }

  private calculateBodyConditionTrend(photos: PhotoAnalysis[]): 'improving' | 'stable' | 'declining' {
    if (photos.length < 2) return 'stable';
    
    const firstBCS = photos[0].analysisResults.bodyConditionScore;
    const lastBCS = photos[photos.length - 1].analysisResults.bodyConditionScore;
    
    const difference = lastBCS - firstBCS;
    if (difference > 0.3) return 'improving';
    if (difference < -0.3) return 'declining';
    return 'stable';
  }

  private calculateVisualFeedEffectiveness(photos: PhotoAnalysis[], feeds: FeedEntry[]): number {
    // Calculate based on body condition improvement and feed correlation
    const avgCorrelationScore = photos.reduce((sum, photo) => 
      sum + photo.analysisResults.feedCorrelation.overall_score, 0) / photos.length;
    return Math.round(avgCorrelationScore);
  }

  private calculateVisualHealthScore(photos: PhotoAnalysis[]): number {
    const latestPhoto = photos[photos.length - 1];
    const healthIndicators = latestPhoto.analysisResults.healthIndicators;
    
    const avgHealthScore = healthIndicators.reduce((sum, indicator) => 
      sum + indicator.score, 0) / healthIndicators.length;
    
    return Math.round(avgHealthScore * 10); // Convert to 1-100 scale
  }

  private calculatePhotoFeedCorrelationScore(photos: PhotoAnalysis[], feeds: FeedEntry[]): number {
    // Calculate correlation between feed changes and visual improvements
    // This is a simplified version - real implementation would use statistical correlation
    return 75; // Placeholder
  }

  private generateVisualFeedAdjustments(photos: PhotoAnalysis[], feeds: FeedEntry[]): string[] {
    const adjustments: string[] = [];
    const latestPhoto = photos[photos.length - 1];
    
    if (latestPhoto.analysisResults.bodyConditionScore < 5) {
      adjustments.push('Increase feed quantity to improve body condition');
    }
    
    if (latestPhoto.analysisResults.bodyConditionScore > 7) {
      adjustments.push('Reduce feed quantity to prevent over-conditioning');
    }
    
    const healthConcerns = latestPhoto.analysisResults.healthIndicators
      .filter(h => h.severity !== 'normal');
    
    if (healthConcerns.length > 0) {
      adjustments.push('Consider feed changes to address health indicators');
    }
    
    return adjustments;
  }
}

// Export singleton instance
export const feedIntelligenceService = new FeedIntelligenceService();