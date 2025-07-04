export interface FeedPurchase {
  id: string;
  animalId: string;
  animalName: string;
  purchaseDate: Date;
  store: string;
  feedType: string;
  feedBrand: string;
  weightPounds: number;
  totalCost: number;
  costPerPound: number;
  receiptPhoto?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedStore {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  averageRating: number;
  priceCompetitiveness: 'low' | 'medium' | 'high';
}

export interface FeedType {
  id: string;
  name: string;
  category: 'grain' | 'hay' | 'supplement' | 'complete' | 'specialty';
  species: string[];
  proteinContent: number;
  fatContent: number;
  fiberContent: number;
  averageFCR: number;
  estimatedCostPerPound: number;
  nutritionalBenefits: string[];
  icon: string;
}

export interface AnimalPerformanceData {
  animalId: string;
  currentWeight: number;
  previousWeight: number;
  currentDate: Date;
  previousDate: Date;
  dailyFeedConsumption: number;
  species: string;
  grade: string;
}

export interface FeedEfficiencyMetrics {
  costPerPoundFeed: number;
  dailyFeedCost: number;
  dailyWeightGain: number;
  feedConversionRatio: number;
  costPerLbGain: number;
  profitPerLb: number;
  efficiencyGrade: string;
  recommendations: string[];
}

export interface RegionalPriceData {
  region: string;
  feedTypeId: string;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  bestStore: string;
  priceHistory: Array<{
    date: Date;
    price: number;
    store: string;
  }>;
}

export interface FeedRecommendation {
  feedType: FeedType;
  totalScore: number;
  educationalBenefits: string[];
  costAnalysis: {
    monthlySavings: number;
    costPerLbGain: number;
    breakEvenDays: number;
    roiProjection: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  expectedFCRImprovement: number;
  availability: FeedStore[];
  explanation: string;
}

export interface StudentFeedAnalytics {
  studentId: string;
  totalPurchases: number;
  totalSpent: number;
  averageFCR: number;
  bestFCR: number;
  costOptimizationScore: number;
  feedEfficiencyGrade: string;
  achievements: string[];
  weeklySpend: number;
  monthlySpend: number;
  savingsOpportunities: string[];
  performanceComparison: {
    betterThanPeers: number; // percentage
    regionRanking: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
}

export interface KidFriendlyDashboard {
  moneySpentToday: number;
  weightGainedThisWeek: number;
  efficiencyEmoji: string;
  profitStatus: {
    status: 'profitable' | 'learning';
    message: string;
    emoji: string;
    color: string;
  };
  reportCard: {
    feedEfficiency: string;
    costManagement: string;
    weightGain: string;
  };
  smartSuggestions: string[];
  nextGoal: string;
  bestAchievement: string;
}

export interface FeedAnalyticsGameification {
  badges: {
    feedEfficiency: string[];
    businessAcumen: string[];
    learningAchievements: string[];
  };
  leaderboards: {
    bestFCRInRegion: number;
    mostImproved: number;
    costOptimization: number;
  };
  challenges: {
    monthlyOptimization: boolean;
    seasonalForecasting: boolean;
    innovationShowcase: boolean;
  };
  socialFeatures: {
    bulkPurchaseOpportunities: FeedPurchase[];
    localPriceAlerts: RegionalPriceData[];
    successStories: string[];
  };
}

// Educational Assessment Models
export interface AETFeedAssessment {
  studentId: string;
  feedCostCalculation: 'novice' | 'developing' | 'proficient' | 'advanced';
  feedConversionAnalysis: 'novice' | 'developing' | 'proficient' | 'advanced';
  businessDecisionMaking: 'novice' | 'developing' | 'proficient' | 'advanced';
  assessmentDate: Date;
  teacherNotes: string;
  improvementPlan: string[];
}

// Business Intelligence Models
export interface FeedIndustryInsights {
  regionalPreferences: Record<string, number>;
  priceSensitivityData: {
    elasticity: number;
    pricePoints: Array<{ price: number; demandChange: number }>;
  };
  seasonalTrends: Array<{
    month: string;
    averagePrice: number;
    volumeSold: number;
    popularBrands: string[];
  }>;
  emergingTrends: string[];
  marketPenetration: Record<string, number>;
}