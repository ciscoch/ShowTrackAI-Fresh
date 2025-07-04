import { FeedPurchase, AnimalPerformanceData, FeedEfficiencyMetrics, RegionalPriceData } from '../models/FeedAnalytics';

export class FeedCostCalculator {
  private regionalPricingData: Record<string, RegionalPriceData> = {};
  private marketPrices: Record<string, number> = {
    'cattle': 4.14,
    'pig': 3.85,
    'sheep': 4.25,
    'goat': 4.50,
  };

  constructor() {
    this.initializeRegionalData();
  }

  private initializeRegionalData() {
    // Sample regional pricing data
    this.regionalPricingData = {
      'midwest': {
        region: 'Midwest',
        feedTypeId: 'cattle_sweet_feed',
        averagePrice: 0.54,
        lowestPrice: 0.52,
        highestPrice: 0.58,
        bestStore: 'Feed Store Plus',
        priceHistory: []
      },
      'southwest': {
        region: 'Southwest',
        feedTypeId: 'cattle_sweet_feed',
        averagePrice: 0.57,
        lowestPrice: 0.55,
        highestPrice: 0.61,
        bestStore: 'Ag Supply Co',
        priceHistory: []
      }
    };
  }

  calculateFeedEconomics(purchaseData: FeedPurchase, animalData: AnimalPerformanceData): FeedEfficiencyMetrics {
    // Basic cost calculations
    const costPerPound = purchaseData.totalCost / purchaseData.weightPounds;
    const dailyFeedAmount = animalData.dailyFeedConsumption;
    const dailyFeedCost = costPerPound * dailyFeedAmount;

    // Weight gain calculations
    const weightGain = animalData.currentWeight - animalData.previousWeight;
    const daysBetweenWeights = Math.abs(
      (animalData.currentDate.getTime() - animalData.previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyWeightGain = daysBetweenWeights > 0 ? weightGain / daysBetweenWeights : 0;

    // Feed conversion ratio (key metric!)
    const totalFeedConsumed = dailyFeedAmount * daysBetweenWeights;
    const feedConversionRatio = weightGain > 0 ? totalFeedConsumed / weightGain : 0;

    // Cost per pound of gain (THE most important number)
    const costPerLbGain = feedConversionRatio > 0 ? costPerPound * feedConversionRatio : 0;

    // Profitability (if market data available)
    const currentMarketPrice = this.getCurrentMarketPrice(animalData.species, animalData.grade);
    const profitPerLb = currentMarketPrice - costPerLbGain;

    return {
      costPerPoundFeed: Math.round(costPerPound * 1000) / 1000,
      dailyFeedCost: Math.round(dailyFeedCost * 100) / 100,
      dailyWeightGain: Math.round(dailyWeightGain * 100) / 100,
      feedConversionRatio: Math.round(feedConversionRatio * 100) / 100,
      costPerLbGain: Math.round(costPerLbGain * 100) / 100,
      profitPerLb: Math.round(profitPerLb * 100) / 100,
      efficiencyGrade: this.calculateEfficiencyGrade(feedConversionRatio),
      recommendations: this.generateRecommendations(purchaseData, animalData, costPerPound)
    };
  }

  private calculateEfficiencyGrade(fcr: number): string {
    if (fcr <= 6.0) return "A+ (Excellent!)";
    if (fcr <= 7.0) return "A (Very Good)";
    if (fcr <= 8.0) return "B+ (Good)";
    if (fcr <= 9.0) return "B (Average)";
    if (fcr <= 10.0) return "C (Needs Improvement)";
    return "D (Talk to Your Teacher)";
  }

  private getCurrentMarketPrice(species: string, grade: string): number {
    const basePrice = this.marketPrices[species.toLowerCase()] || 4.0;
    
    // Grade adjustments
    const gradeMultipliers: Record<string, number> = {
      'prime': 1.15,
      'choice': 1.05,
      'select': 1.0,
      'standard': 0.95,
      'commercial': 0.85
    };

    return basePrice * (gradeMultipliers[grade.toLowerCase()] || 1.0);
  }

  private generateRecommendations(
    purchaseData: FeedPurchase, 
    animalData: AnimalPerformanceData,
    costPerPound: number
  ): string[] {
    const recommendations: string[] = [];

    // Price comparison recommendations
    const betterPrices = this.findBetterLocalPrices(purchaseData);
    if (betterPrices) {
      recommendations.push(`Save $${betterPrices.savings.toFixed(2)}/bag at ${betterPrices.store}`);
    }

    // Bulk buying recommendations
    if (purchaseData.weightPounds < 100) {
      const potentialSavings = this.calculateBulkSavings(purchaseData);
      recommendations.push(`Buy 100+ lbs at once to save ${(potentialSavings * 100).toFixed(1)}%`);
    }

    // Feed type recommendations
    const betterFeeds = this.analyzeFeedAlternatives(purchaseData, animalData);
    if (betterFeeds) {
      recommendations.push(`Try ${betterFeeds.name} - could improve FCR by ${betterFeeds.improvement.toFixed(1)}`);
    }

    // Seasonal timing recommendations
    if (this.isSeasonalPurchaseOptimal(purchaseData.purchaseDate)) {
      recommendations.push("Great timing! Feed prices are typically lower this month");
    } else {
      recommendations.push("Consider bulk buying - prices usually drop in fall months");
    }

    return recommendations;
  }

  private findBetterLocalPrices(purchaseData: FeedPurchase): { savings: number; store: string } | null {
    const regional = this.regionalPricingData['midwest']; // Default to midwest
    if (regional && purchaseData.costPerPound > regional.lowestPrice) {
      return {
        savings: (purchaseData.costPerPound - regional.lowestPrice) * purchaseData.weightPounds,
        store: regional.bestStore
      };
    }
    return null;
  }

  private calculateBulkSavings(purchaseData: FeedPurchase): number {
    // Typical bulk savings of 5-8%
    return 0.08;
  }

  private analyzeFeedAlternatives(
    purchaseData: FeedPurchase, 
    animalData: AnimalPerformanceData
  ): { name: string; improvement: number } | null {
    // Sample alternative feed analysis
    const alternatives = [
      { name: "Premium Cattle Feed", fcrImprovement: 0.5, costIncrease: 0.05 },
      { name: "High Protein Mix", fcrImprovement: 0.8, costIncrease: 0.12 },
      { name: "Organic Complete Feed", fcrImprovement: 0.3, costIncrease: 0.25 }
    ];

    // Find the best alternative based on cost-benefit analysis
    for (const alt of alternatives) {
      const newCostPerPound = purchaseData.costPerPound * (1 + alt.costIncrease);
      const savings = alt.fcrImprovement * 0.1; // Rough calculation
      
      if (savings > alt.costIncrease) {
        return {
          name: alt.name,
          improvement: alt.fcrImprovement
        };
      }
    }

    return null;
  }

  private isSeasonalPurchaseOptimal(purchaseDate: Date): boolean {
    const month = purchaseDate.getMonth();
    // Fall months (September-November) typically have better prices
    return month >= 8 && month <= 10;
  }

  // Kid-friendly efficiency scale
  efficiencyEmojiScale(fcr: number): string {
    if (fcr <= 6.0) return "🔥🔥🔥 AMAZING! You're a feed efficiency superstar!";
    if (fcr <= 7.0) return "⭐⭐⭐ Excellent! Your animal is growing efficiently!";
    if (fcr <= 8.0) return "👍👍 Good job! Room for small improvements.";
    if (fcr <= 9.0) return "👌 Not bad, but let's work on efficiency together.";
    return "🤔 Let's chat with your teacher about improving this.";
  }

  // Simple profit indicator
  profitSimpleIndicator(profitPerLb: number): {
    status: 'profitable' | 'learning';
    message: string;
    emoji: string;
    color: string;
  } {
    if (profitPerLb > 0) {
      return {
        status: 'profitable',
        message: `🎉 You're making $${profitPerLb.toFixed(2)} per pound!`,
        emoji: '💰',
        color: 'green'
      };
    } else {
      return {
        status: 'learning',
        message: `📚 Learning experience! Let's improve together.`,
        emoji: '📖',
        color: 'blue'
      };
    }
  }

  // Calculate report card grades
  calculateReportCard(metrics: FeedEfficiencyMetrics): {
    feedEfficiency: string;
    costManagement: string;
    weightGain: string;
  } {
    const fcr = metrics.feedConversionRatio;
    const cost = metrics.costPerLbGain;
    const gain = metrics.dailyWeightGain;

    return {
      feedEfficiency: this.getStarRating(fcr, [6, 7, 8, 9]),
      costManagement: this.getStarRating(cost, [3, 3.5, 4, 4.5]),
      weightGain: this.getStarRating(gain, [2.5, 2, 1.5, 1])
    };
  }

  private getStarRating(value: number, thresholds: number[]): string {
    const stars = ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐☆', '⭐⭐⭐☆☆', '⭐⭐☆☆☆', '⭐☆☆☆☆'];
    
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) {
        return stars[i];
      }
    }
    return stars[stars.length - 1];
  }
}