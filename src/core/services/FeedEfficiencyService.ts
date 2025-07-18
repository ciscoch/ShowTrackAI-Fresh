/**
 * Feed Efficiency Service for ShowTrackAI Agricultural Education Platform
 * 
 * Provides comprehensive feed efficiency analysis including:
 * - Feed Conversion Ratio (FCR) calculations
 * - Cost per pound gain analysis
 * - Performance benchmarking
 * - Optimization recommendations
 * - Trend analysis and forecasting
 */

import { getSupabaseClient } from '../../../backend/api/clients/supabase';

export interface FeedEfficiencyData {
  animalId: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  feedConsumption: {
    totalFeed: number; // lbs
    avgDailyFeed: number; // lbs/day
    feedCost: number; // total cost
    feedTypes: string[];
  };
  weightGain: {
    startWeight: number; // lbs
    endWeight: number; // lbs
    totalGain: number; // lbs
    avgDailyGain: number; // lbs/day
  };
  fcr: number; // Feed Conversion Ratio
  costPerPoundGain: number; // $/lb
  efficiencyScore: number; // 0-100 scale
}

export interface FeedEfficiencyAnalysis {
  current: FeedEfficiencyData;
  historical: FeedEfficiencyData[];
  benchmarks: {
    industryAverage: number;
    speciesAverage: number;
    topPerformers: number;
  };
  trends: {
    fcrTrend: 'improving' | 'stable' | 'declining';
    costTrend: 'improving' | 'stable' | 'declining';
    efficiencyTrend: 'improving' | 'stable' | 'declining';
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  projections: {
    targetFCR: number;
    projectedSavings: number;
    timeToTarget: number; // days
  };
}

export interface FeedOptimizationPlan {
  currentPerformance: FeedEfficiencyData;
  targetPerformance: {
    targetFCR: number;
    targetCost: number;
    expectedSavings: number;
  };
  actionPlan: {
    feedChanges: string[];
    scheduleAdjustments: string[];
    monitoringPoints: string[];
  };
  timeline: {
    phase1: string; // 0-2 weeks
    phase2: string; // 2-6 weeks
    phase3: string; // 6+ weeks
  };
}

export class FeedEfficiencyService {

  /**
   * Calculate Feed Conversion Ratio (FCR) for an animal
   */
  async calculateFCR(animalId: string, periodDays: number = 30): Promise<FeedEfficiencyData> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));

      // Get feed consumption data
      const supabase = getSupabaseClient();
      const { data: feedData, error: feedError } = await supabase
        .from('feed_entries')
        .select('*')
        .eq('animal_id', animalId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (feedError) throw feedError;

      // Get weight data  
      const { data: weightData, error: weightError } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('animal_id', animalId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (weightError) throw weightError;

      if (!feedData || feedData.length === 0 || !weightData || weightData.length === 0) {
        throw new Error('Insufficient data for FCR calculation');
      }

      // Calculate feed consumption
      const totalFeed = feedData.reduce((sum, entry) => sum + entry.amount, 0);
      const totalCost = feedData.reduce((sum, entry) => sum + entry.cost, 0);
      const avgDailyFeed = totalFeed / periodDays;
      const feedTypes = [...new Set(feedData.map(entry => entry.feed_type))];

      // Calculate weight gain
      const startWeight = weightData[0].weight;
      const endWeight = weightData[weightData.length - 1].weight;
      const totalGain = endWeight - startWeight;
      const avgDailyGain = totalGain / periodDays;

      // Calculate FCR and efficiency metrics
      const fcr = totalGain > 0 ? totalFeed / totalGain : 0;
      const costPerPoundGain = totalGain > 0 ? totalCost / totalGain : 0;
      const efficiencyScore = this.calculateEfficiencyScore(fcr, costPerPoundGain);

      return {
        animalId,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: periodDays
        },
        feedConsumption: {
          totalFeed,
          avgDailyFeed,
          feedCost: totalCost,
          feedTypes
        },
        weightGain: {
          startWeight,
          endWeight,
          totalGain,
          avgDailyGain
        },
        fcr,
        costPerPoundGain,
        efficiencyScore
      };
    } catch (error) {
      console.error('Error calculating FCR:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive feed efficiency analysis
   */
  async getFeedEfficiencyAnalysis(animalId: string): Promise<FeedEfficiencyAnalysis> {
    try {
      // Get current efficiency data
      const current = await this.calculateFCR(animalId, 30);
      
      // Get historical data (last 6 months)
      const historical = await this.getHistoricalEfficiency(animalId, 180);
      
      // Get benchmarks
      const benchmarks = await this.getBenchmarks(animalId);
      
      // Analyze trends
      const trends = this.analyzeTrends(historical);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(current, historical, benchmarks);
      
      // Calculate projections
      const projections = this.calculateProjections(current, historical);

      return {
        current,
        historical,
        benchmarks,
        trends,
        recommendations,
        projections
      };
    } catch (error) {
      console.error('Error getting feed efficiency analysis:', error);
      throw error;
    }
  }

  /**
   * Create feed optimization plan
   */
  async createOptimizationPlan(animalId: string, targetFCR: number): Promise<FeedOptimizationPlan> {
    try {
      const currentPerformance = await this.calculateFCR(animalId, 30);
      const analysis = await this.getFeedEfficiencyAnalysis(animalId);
      
      const targetCost = currentPerformance.costPerPoundGain * (targetFCR / currentPerformance.fcr);
      const expectedSavings = (currentPerformance.costPerPoundGain - targetCost) * 
                            currentPerformance.weightGain.totalGain * 12; // Annualized

      const actionPlan = this.generateActionPlan(currentPerformance, targetFCR, analysis);
      const timeline = this.generateOptimizationTimeline(currentPerformance, targetFCR);

      return {
        currentPerformance,
        targetPerformance: {
          targetFCR,
          targetCost,
          expectedSavings
        },
        actionPlan,
        timeline
      };
    } catch (error) {
      console.error('Error creating optimization plan:', error);
      throw error;
    }
  }

  /**
   * Get feed efficiency summary for multiple animals
   */
  async getEfficiencySummary(animalIds: string[]): Promise<{
    totalAnimals: number;
    averageFCR: number;
    totalFeedCost: number;
    totalWeightGain: number;
    efficiencyDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
    topPerformers: Array<{
      animalId: string;
      fcr: number;
      efficiencyScore: number;
    }>;
  }> {
    try {
      const efficiencyData = await Promise.all(
        animalIds.map(id => this.calculateFCR(id, 30))
      );

      const totalAnimals = efficiencyData.length;
      const averageFCR = efficiencyData.reduce((sum, data) => sum + data.fcr, 0) / totalAnimals;
      const totalFeedCost = efficiencyData.reduce((sum, data) => sum + data.feedConsumption.feedCost, 0);
      const totalWeightGain = efficiencyData.reduce((sum, data) => sum + data.weightGain.totalGain, 0);

      // Categorize efficiency
      const efficiencyDistribution = {
        excellent: efficiencyData.filter(d => d.efficiencyScore >= 90).length,
        good: efficiencyData.filter(d => d.efficiencyScore >= 70 && d.efficiencyScore < 90).length,
        average: efficiencyData.filter(d => d.efficiencyScore >= 50 && d.efficiencyScore < 70).length,
        poor: efficiencyData.filter(d => d.efficiencyScore < 50).length
      };

      // Get top performers
      const topPerformers = efficiencyData
        .map(data => ({
          animalId: data.animalId,
          fcr: data.fcr,
          efficiencyScore: data.efficiencyScore
        }))
        .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
        .slice(0, 5);

      return {
        totalAnimals,
        averageFCR,
        totalFeedCost,
        totalWeightGain,
        efficiencyDistribution,
        topPerformers
      };
    } catch (error) {
      console.error('Error getting efficiency summary:', error);
      throw error;
    }
  }

  /**
   * Store feed efficiency analytics
   */
  async storeFeedAnalytics(data: FeedEfficiencyData): Promise<void> {
    try {
      const analyticsData = {
        animal_id: data.animalId,
        calculation_date: new Date().toISOString(),
        period_days: data.period.days,
        total_feed_consumed: data.feedConsumption.totalFeed,
        total_feed_cost: data.feedConsumption.feedCost,
        weight_gain: data.weightGain.totalGain,
        feed_conversion_ratio: data.fcr,
        cost_per_lb_gain: data.costPerPoundGain,
        average_daily_gain: data.weightGain.avgDailyGain,
        efficiency_score: data.efficiencyScore,
        feed_types: data.feedConsumption.feedTypes
      };

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('feed_analytics')
        .insert([analyticsData]);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing feed analytics:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateEfficiencyScore(fcr: number, costPerPoundGain: number): number {
    // Score based on FCR and cost efficiency
    // Lower FCR and cost per pound gain = higher score
    const fcrScore = Math.max(0, 100 - ((fcr - 2) * 10)); // Optimal FCR around 2-3
    const costScore = Math.max(0, 100 - ((costPerPoundGain - 1) * 20)); // Optimal cost around $1/lb
    
    return Math.round((fcrScore + costScore) / 2);
  }

  private async getHistoricalEfficiency(animalId: string, days: number): Promise<FeedEfficiencyData[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('feed_analytics')
        .select('*')
        .eq('animal_id', animalId)
        .gte('calculation_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('calculation_date', { ascending: false });

      if (error) throw error;

      return data?.map(record => ({
        animalId: record.animal_id,
        period: {
          startDate: new Date(new Date(record.calculation_date).getTime() - record.period_days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: record.calculation_date,
          days: record.period_days
        },
        feedConsumption: {
          totalFeed: record.total_feed_consumed,
          avgDailyFeed: record.total_feed_consumed / record.period_days,
          feedCost: record.total_feed_cost,
          feedTypes: record.feed_types || []
        },
        weightGain: {
          startWeight: 0, // Not stored in analytics
          endWeight: 0,
          totalGain: record.weight_gain,
          avgDailyGain: record.average_daily_gain
        },
        fcr: record.feed_conversion_ratio,
        costPerPoundGain: record.cost_per_lb_gain,
        efficiencyScore: record.efficiency_score
      })) || [];
    } catch (error) {
      console.error('Error getting historical efficiency:', error);
      return [];
    }
  }

  private async getBenchmarks(animalId: string): Promise<{
    industryAverage: number;
    speciesAverage: number;
    topPerformers: number;
  }> {
    try {
      // Get animal species
      const supabase = getSupabaseClient();
      const { data: animalData, error: animalError } = await supabase
        .from('animals')
        .select('species')
        .eq('id', animalId)
        .single();

      if (animalError) throw animalError;

      // Get species-specific benchmarks
      const { data: benchmarkData, error: benchmarkError } = await supabase
        .from('feed_analytics')
        .select('feed_conversion_ratio')
        .eq('species', animalData.species)
        .order('calculation_date', { ascending: false })
        .limit(1000);

      if (benchmarkError) throw benchmarkError;

      const fcrValues = benchmarkData?.map(d => d.feed_conversion_ratio) || [];
      const industryAverage = fcrValues.reduce((sum, fcr) => sum + fcr, 0) / fcrValues.length || 6.5;
      const speciesAverage = industryAverage;
      const topPerformers = fcrValues.sort((a, b) => a - b)[Math.floor(fcrValues.length * 0.1)] || 4.5;

      return {
        industryAverage,
        speciesAverage,
        topPerformers
      };
    } catch (error) {
      console.error('Error getting benchmarks:', error);
      return {
        industryAverage: 6.5,
        speciesAverage: 6.5,
        topPerformers: 4.5
      };
    }
  }

  private analyzeTrends(historical: FeedEfficiencyData[]): {
    fcrTrend: 'improving' | 'stable' | 'declining';
    costTrend: 'improving' | 'stable' | 'declining';
    efficiencyTrend: 'improving' | 'stable' | 'declining';
  } {
    if (historical.length < 2) {
      return { fcrTrend: 'stable', costTrend: 'stable', efficiencyTrend: 'stable' };
    }

    const recent = historical.slice(0, 3);
    const older = historical.slice(-3);

    const avgRecentFCR = recent.reduce((sum, d) => sum + d.fcr, 0) / recent.length;
    const avgOlderFCR = older.reduce((sum, d) => sum + d.fcr, 0) / older.length;

    const avgRecentCost = recent.reduce((sum, d) => sum + d.costPerPoundGain, 0) / recent.length;
    const avgOlderCost = older.reduce((sum, d) => sum + d.costPerPoundGain, 0) / older.length;

    const avgRecentEfficiency = recent.reduce((sum, d) => sum + d.efficiencyScore, 0) / recent.length;
    const avgOlderEfficiency = older.reduce((sum, d) => sum + d.efficiencyScore, 0) / older.length;

    return {
      fcrTrend: avgRecentFCR < avgOlderFCR * 0.95 ? 'improving' : 
                avgRecentFCR > avgOlderFCR * 1.05 ? 'declining' : 'stable',
      costTrend: avgRecentCost < avgOlderCost * 0.95 ? 'improving' : 
                 avgRecentCost > avgOlderCost * 1.05 ? 'declining' : 'stable',
      efficiencyTrend: avgRecentEfficiency > avgOlderEfficiency * 1.05 ? 'improving' : 
                       avgRecentEfficiency < avgOlderEfficiency * 0.95 ? 'declining' : 'stable'
    };
  }

  private generateRecommendations(
    current: FeedEfficiencyData,
    historical: FeedEfficiencyData[],
    benchmarks: any
  ): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // FCR analysis
    if (current.fcr > benchmarks.industryAverage * 1.2) {
      immediate.push('Feed conversion ratio is significantly above industry average - review feed quality');
      shortTerm.push('Consider switching to higher quality feed with better protein content');
    }

    // Cost analysis
    if (current.costPerPoundGain > 2.0) {
      immediate.push('Cost per pound gain is high - evaluate feed pricing and alternatives');
      shortTerm.push('Research bulk purchasing options or alternative feed suppliers');
    }

    // Efficiency trends
    if (current.efficiencyScore < 50) {
      immediate.push('Feed efficiency is below optimal - increase monitoring frequency');
      shortTerm.push('Implement daily feed intake and waste monitoring');
      longTerm.push('Develop comprehensive feed management strategy');
    }

    // Daily gain analysis
    if (current.weightGain.avgDailyGain < 1.5) {
      immediate.push('Daily weight gain is below target - assess animal health and nutrition');
      shortTerm.push('Consult with nutritionist for feed formulation review');
    }

    return { immediate, shortTerm, longTerm };
  }

  private calculateProjections(current: FeedEfficiencyData, historical: FeedEfficiencyData[]): {
    targetFCR: number;
    projectedSavings: number;
    timeToTarget: number;
  } {
    const targetFCR = current.fcr * 0.9; // 10% improvement target
    const projectedSavings = (current.costPerPoundGain - (current.costPerPoundGain * 0.9)) * 
                           current.weightGain.totalGain * 12; // Annualized
    const timeToTarget = 60; // 2 months typical improvement timeline

    return {
      targetFCR,
      projectedSavings,
      timeToTarget
    };
  }

  private generateActionPlan(
    current: FeedEfficiencyData,
    targetFCR: number,
    analysis: FeedEfficiencyAnalysis
  ): {
    feedChanges: string[];
    scheduleAdjustments: string[];
    monitoringPoints: string[];
  } {
    const feedChanges: string[] = [];
    const scheduleAdjustments: string[] = [];
    const monitoringPoints: string[] = [];

    // Based on current performance vs target
    const improvementNeeded = (current.fcr - targetFCR) / current.fcr;

    if (improvementNeeded > 0.1) {
      feedChanges.push('Upgrade to higher protein feed (18-20% protein)');
      feedChanges.push('Add digestibility enhancers to current feed');
      scheduleAdjustments.push('Implement smaller, more frequent feeding schedule');
    }

    scheduleAdjustments.push('Monitor feed intake daily at same time');
    scheduleAdjustments.push('Weigh animals weekly for progress tracking');

    monitoringPoints.push('Daily feed consumption tracking');
    monitoringPoints.push('Weekly weight measurements');
    monitoringPoints.push('Monthly FCR calculations');
    monitoringPoints.push('Feed waste assessment');

    return {
      feedChanges,
      scheduleAdjustments,
      monitoringPoints
    };
  }

  private generateOptimizationTimeline(current: FeedEfficiencyData, targetFCR: number): {
    phase1: string;
    phase2: string;
    phase3: string;
  } {
    return {
      phase1: 'Week 1-2: Implement new feeding schedule and begin enhanced monitoring',
      phase2: 'Week 3-6: Transition to optimized feed formulation and assess initial results',
      phase3: 'Week 7+: Fine-tune approach based on performance data and maintain improvements'
    };
  }
}

export default FeedEfficiencyService;