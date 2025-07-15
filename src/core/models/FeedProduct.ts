export interface FeedProduct {
  id: string;
  brand: string;
  productName: string;
  category: 'starter' | 'grower' | 'finisher' | 'maintenance' | 'performance' | 'supplement';
  species: 'Cattle' | 'Goat' | 'Pig' | 'Sheep' | 'Poultry' | 'Multi-Species';
  nutritionalProfile: {
    protein: number; // Percentage
    fat: number; // Percentage
    fiber: number; // Percentage
    ash: number; // Percentage
    moisture: number; // Percentage
    carbohydrates: number; // Percentage
    calcium: number; // Percentage
    phosphorus: number; // Percentage
    salt: number; // Percentage
    additives: string[]; // Vitamins, minerals, medications
    energyDensity: number; // kcal/kg
  };
  performanceMetrics: {
    avgFCR: number; // Feed Conversion Ratio
    avgDailyGain: number; // Pounds per day
    costPerPound: number; // USD per pound of feed
    efficiency_score: number; // 1-100 scale
    palatability: number; // 1-10 scale
    digestibility: number; // Percentage
  };
  researchData: {
    studyCount: number;
    confidenceLevel: number; // Percentage
    sampleSize: number;
    significantFindings: string[];
    lastUpdated: Date;
  };
  marketData: {
    currentPrice: number; // USD per unit
    priceHistory: PricePoint[];
    availability: 'high' | 'medium' | 'low';
    popularityScore: number; // 1-100
    regionAvailability: string[]; // Geographic regions
  };
  manufacturer: {
    company: string;
    contact: string;
    website: string;
    certifications: string[]; // Organic, Non-GMO, etc.
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PricePoint {
  date: Date;
  price: number;
  region: string;
  source: string;
}

export interface FeedEntry {
  id: string;
  animalId: string;
  feedProductId: string;
  amount: number; // Pounds
  cost: number; // Total cost for this feeding
  date: Date;
  notes: string;
  feedingMethod: 'free-choice' | 'measured' | 'timed' | 'restricted';
  nutritionalData?: {
    proteinContent: number;
    energyContent: number;
    fiberContent: number;
  };
  brandIntelligence?: {
    brandPerformanceScore: number;
    previousUseCount: number;
    userSatisfactionRating: number;
  };
  performanceImpact?: {
    expectedWeightGain: number;
    actualWeightGain?: number;
    healthImpact: 'positive' | 'neutral' | 'negative';
    behaviorChanges: string[];
  };
  weather?: {
    temperature: number;
    humidity: number;
    conditions: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FCRAnalysis {
  id: string;
  animalId: string;
  feedProductId: string;
  timeframe: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    feedConversionRatio: number; // Feed consumed / Weight gained
    avgDailyGain: number; // Pounds per day
    feedEfficiency: number; // Weight gained / Feed consumed
    costPerPoundGain: number; // Cost per pound of weight gained
    totalFeedConsumed: number; // Pounds
    totalWeightGained: number; // Pounds
    totalCost: number; // USD
  };
  benchmarkComparison: {
    industryAverage: number;
    speciesAverage: number;
    breedAverage: number;
    performanceRanking: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  };
  recommendations: FeedRecommendation[];
  createdAt: Date;
}

export interface FeedRecommendation {
  id: string;
  type: 'feed_change' | 'amount_adjustment' | 'timing_modification' | 'supplement_addition';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImprovement: {
    fcrImprovement: number; // Percentage
    costSavings: number; // USD per month
    timeToResult: number; // Days
  };
  recommendedProducts?: string[]; // Feed product IDs
  implementation: {
    steps: string[];
    timeline: string;
    monitoring: string[];
  };
  confidence: number; // Percentage
  createdAt: Date;
}

export interface PhotoAnalysis {
  id: string;
  animalId: string;
  photoUri: string;
  analysisResults: {
    bodyConditionScore: number; // 1-9 scale
    estimatedWeight: number; // Pounds
    healthIndicators: HealthIndicator[];
    growthAssessment: GrowthAssessment;
    feedCorrelation: FeedImpactScore;
  };
  aiMetrics: {
    confidence: number; // Percentage
    processingTime: number; // Milliseconds
    modelVersion: string;
    features_detected: string[];
  };
  comparisonData?: {
    previousPhotoId?: string;
    timeDifference?: number; // Days
    weightChange?: number; // Pounds
    conditionChange?: number; // BCS change
  };
  feedCorrelationData?: {
    recentFeeds: string[]; // Feed product IDs from last 30 days
    feedImpactScore: number; // 1-100
    visualFeedEffectiveness: number; // 1-100
  };
  date: Date;
  createdAt: Date;
}

export interface HealthIndicator {
  type: 'coat_condition' | 'eye_brightness' | 'posture' | 'muscle_definition' | 'fat_coverage';
  score: number; // 1-10
  notes: string;
  severity: 'normal' | 'mild_concern' | 'moderate_concern' | 'severe_concern';
}

export interface GrowthAssessment {
  frame_size: 'small' | 'medium' | 'large';
  muscle_development: number; // 1-10
  fat_distribution: number; // 1-10
  overall_conformation: number; // 1-10
  growth_stage: 'young' | 'growing' | 'mature' | 'over_conditioned';
}

export interface FeedImpactScore {
  overall_score: number; // 1-100
  nutrition_adequacy: number; // 1-100
  feed_efficiency_visual: number; // 1-100
  health_impact: number; // 1-100
  growth_progression: number; // 1-100
}

export const FEED_CATEGORIES = [
  'starter',
  'grower', 
  'finisher',
  'maintenance',
  'performance',
  'supplement'
] as const;

export const FEEDING_METHODS = [
  'free-choice',
  'measured',
  'timed',
  'restricted'
] as const;

export const PERFORMANCE_RANKINGS = [
  'excellent',
  'good',
  'average',
  'below_average',
  'poor'
] as const;