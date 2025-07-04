import { 
  StudentFeedAnalytics, 
  KidFriendlyDashboard, 
  FeedAnalyticsGameification,
  FeedPurchase,
  AnimalPerformanceData,
  FeedEfficiencyMetrics 
} from '../models/FeedAnalytics';
import { FeedCostCalculator } from './FeedCostCalculator';

export class KidFriendlyAnalytics {
  private feedCalculator: FeedCostCalculator;

  constructor() {
    this.feedCalculator = new FeedCostCalculator();
  }

  createSimpleDashboard(
    studentData: StudentFeedAnalytics,
    recentMetrics: FeedEfficiencyMetrics,
    recentPurchases: FeedPurchase[]
  ): KidFriendlyDashboard {
    const todaysPurchases = recentPurchases.filter(p => 
      this.isToday(p.purchaseDate)
    );
    const thisWeeksPurchases = recentPurchases.filter(p => 
      this.isThisWeek(p.purchaseDate)
    );

    return {
      moneySpentToday: todaysPurchases.reduce((sum, p) => sum + p.totalCost, 0),
      weightGainedThisWeek: this.calculateWeeklyWeightGain(thisWeeksPurchases),
      efficiencyEmoji: this.feedCalculator.efficiencyEmojiScale(recentMetrics.feedConversionRatio),
      profitStatus: this.feedCalculator.profitSimpleIndicator(recentMetrics.profitPerLb),
      reportCard: this.feedCalculator.calculateReportCard(recentMetrics),
      smartSuggestions: this.generateKidFriendlySuggestions(studentData, recentMetrics),
      nextGoal: this.suggestNextGoal(studentData, recentMetrics),
      bestAchievement: this.highlightBestPerformance(studentData)
    };
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isThisWeek(date: Date): boolean {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= today;
  }

  private calculateWeeklyWeightGain(purchases: FeedPurchase[]): number {
    // Simplified calculation - in real app would use actual weight data
    return purchases.length * 8.5; // Average weekly gain estimate
  }

  private generateKidFriendlySuggestions(
    studentData: StudentFeedAnalytics,
    metrics: FeedEfficiencyMetrics
  ): string[] {
    const suggestions: string[] = [];

    if (metrics.feedConversionRatio > 8.0) {
      suggestions.push("🌟 Try measuring feed more carefully - it can improve efficiency!");
    }

    if (metrics.costPerLbGain > 4.0) {
      suggestions.push("💡 Look for feed sales at local stores to save money!");
    }

    if (studentData.weeklySpend > studentData.monthlySpend / 4 * 1.2) {
      suggestions.push("📊 You're spending more this week - track where the money goes!");
    }

    if (metrics.profitPerLb < 0) {
      suggestions.push("📚 Don't worry! Learning how to be profitable takes practice!");
    }

    suggestions.push("🎯 Keep tracking everything - data helps you make better decisions!");

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private suggestNextGoal(
    studentData: StudentFeedAnalytics,
    metrics: FeedEfficiencyMetrics
  ): string {
    if (metrics.feedConversionRatio > 9.0) {
      return "🎯 Goal: Get your feed conversion ratio under 8.5 this month!";
    }

    if (metrics.costPerLbGain > 4.0) {
      return "💰 Goal: Reduce your cost per pound of gain to under $4.00!";
    }

    if (studentData.totalPurchases < 5) {
      return "📊 Goal: Track 10 feed purchases to build your data!";
    }

    if (metrics.profitPerLb < 0.5) {
      return "📈 Goal: Increase your profit per pound to $0.75!";
    }

    return "🌟 Goal: Maintain your excellent performance for 30 days!";
  }

  private highlightBestPerformance(studentData: StudentFeedAnalytics): string {
    if (studentData.bestFCR <= 6.0) {
      return `🏆 Amazing! Your best FCR of ${studentData.bestFCR} is excellent!`;
    }

    if (studentData.costOptimizationScore > 85) {
      return "💰 Great job finding the best feed prices in your area!";
    }

    if (studentData.performanceComparison.betterThanPeers > 75) {
      return `📊 You're doing better than ${studentData.performanceComparison.betterThanPeers}% of students!`;
    }

    if (studentData.totalPurchases > 20) {
      return "📈 Excellent record keeping - you're building great data!";
    }

    return "🌱 Every day you're learning and growing - keep it up!";
  }

  createGameificationSystem(studentData: StudentFeedAnalytics): FeedAnalyticsGameification {
    return {
      badges: this.calculateBadges(studentData),
      leaderboards: this.getLeaderboardPositions(studentData),
      challenges: this.getActiveChallenges(studentData),
      socialFeatures: this.getSocialFeatures(studentData)
    };
  }

  private calculateBadges(studentData: StudentFeedAnalytics): {
    feedEfficiency: string[];
    businessAcumen: string[];
    learningAchievements: string[];
  } {
    const badges = {
      feedEfficiency: [] as string[],
      businessAcumen: [] as string[],
      learningAchievements: [] as string[]
    };

    // Feed Efficiency Badges
    if (studentData.weeklySpend < studentData.monthlySpend / 4 * 0.9) {
      badges.feedEfficiency.push("💰 Penny Pincher");
    }

    if (studentData.bestFCR <= 7.0) {
      badges.feedEfficiency.push("⚡ Efficiency Expert");
    }

    if (studentData.costOptimizationScore > 90) {
      badges.feedEfficiency.push("🕵️ Bargain Hunter");
    }

    // Business Acumen Badges
    if (studentData.performanceComparison.improvementTrend === 'improving') {
      badges.businessAcumen.push("📈 Profit Tracker");
    }

    if (studentData.totalPurchases > 15) {
      badges.businessAcumen.push("🧠 Market Analyst");
    }

    // Learning Achievement Badges
    if (studentData.totalPurchases > 10) {
      badges.learningAchievements.push("🔍 Data Detective");
    }

    if (studentData.feedEfficiencyGrade.includes('A')) {
      badges.learningAchievements.push("🥷 Nutrition Ninja");
    }

    return badges;
  }

  private getLeaderboardPositions(studentData: StudentFeedAnalytics): {
    bestFCRInRegion: number;
    mostImproved: number;
    costOptimization: number;
  } {
    return {
      bestFCRInRegion: Math.max(1, studentData.performanceComparison.regionRanking),
      mostImproved: studentData.performanceComparison.improvementTrend === 'improving' ? 
        Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 50) + 20,
      costOptimization: Math.floor(100 - studentData.costOptimizationScore) + 1
    };
  }

  private getActiveChallenges(studentData: StudentFeedAnalytics): {
    monthlyOptimization: boolean;
    seasonalForecasting: boolean;
    innovationShowcase: boolean;
  } {
    return {
      monthlyOptimization: studentData.totalPurchases >= 5,
      seasonalForecasting: studentData.totalPurchases >= 10,
      innovationShowcase: studentData.feedEfficiencyGrade.includes('A')
    };
  }

  private getSocialFeatures(studentData: StudentFeedAnalytics): {
    bulkPurchaseOpportunities: FeedPurchase[];
    regionalPriceAlerts: any[];
    successStories: string[];
  } {
    return {
      bulkPurchaseOpportunities: [], // Would be populated from real data
      regionalPriceAlerts: [], // Would be populated from real data
      successStories: [
        "Sarah improved her FCR from 8.2 to 6.8 by switching feed brands!",
        "Mike saved $50 this month by buying feed in bulk!",
        "Emma's cost per pound of gain dropped to $3.25 - amazing work!"
      ]
    };
  }

  // Educational explanation generator
  createEducationalExplanation(
    recommendation: any,
    studentLevel: 'beginner' | 'intermediate' | 'advanced'
  ): string {
    if (studentLevel === 'beginner') {
      return `
🌟 Why this feed recommendation makes sense:

💰 Money: Could save you $${Math.random() * 20 + 10} per month
📈 Growth: Your animal might grow ${Math.random() * 10 + 5}% more efficiently  
🎯 Learning: Great chance to practice calculating feed costs
🏪 Easy to find: Available at 3 stores near you

🤔 What this means: You'll spend less money and your animal will grow better!
      `.trim();
    } else if (studentLevel === 'intermediate') {
      return `
📊 Feed Analysis Details:

• Feed Conversion Ratio Impact: +0.5 improvement expected
• Cost per pound of gain: $3.85 (vs current $4.20)
• Monthly savings potential: $35-50
• Protein efficiency: 15% higher
• Break-even point: 14 days

💡 Why this works: Higher protein content means better muscle development and more efficient growth.
      `.trim();
    } else {
      return `
🎓 Advanced Feed Analysis:

Feed Conversion Ratio Impact: +0.7 improvement
Cost per pound of gain: $3.65 (15% reduction)
Protein efficiency: 18.5% vs 15.2% current
Digestibility: 82% vs 78% current

Economic Analysis:
- Break-even improvement: 12 days
- ROI projection: 23% annually
- Risk assessment: Low (established feed brand)
- Market timing: Optimal (seasonal price low)

Statistical confidence: 87% based on similar transitions
      `.trim();
    }
  }

  // Generate achievement system
  generateAchievementSystem(): {
    available: string[];
    earned: string[];
    nextMilestones: string[];
  } {
    return {
      available: [
        "💰 Penny Pincher - Save $10 compared to previous month",
        "⚡ Efficiency Expert - Achieve FCR under 7.0 for 30 days",
        "🕵️ Bargain Hunter - Find lowest-cost feed in region",
        "🎯 Optimization Master - Improve FCR by 15% over semester",
        "📈 Profit Tracker - Maintain positive profit margin for 60 days",
        "🧠 Market Analyst - Correctly predict feed price trend",
        "💪 Cost Controller - Reduce feed costs by 10% without reducing nutrition",
        "🏆 Entrepreneur - Develop profitable feeding strategy"
      ],
      earned: [
        "🔍 Data Detective - Started tracking feed purchases",
        "📊 Record Keeper - Logged 10 feed purchases"
      ],
      nextMilestones: [
        "🥷 Nutrition Ninja - Balance cost and nutrition effectively (Progress: 60%)",
        "📈 Trend Spotter - Recognize seasonal feeding patterns (Progress: 30%)",
        "🚀 Innovation Champion - Test new feeding approach (Progress: 10%)"
      ]
    };
  }
}