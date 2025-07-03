interface PhotoAnalysis {
  weightEstimate: number;
  confidence: number;
  bodyConditionScore: number;
  angle: 'side_profile' | 'rear_view' | 'front_view' | 'three_quarter';
  quality: number;
  timestamp: Date;
}

interface WeightPredictionResult {
  predictedWeight: number;
  confidence: number;
  accuracyRange: [number, number];
  bodyConditionScore: number;
  growthProjection: {
    averageDailyGain: number;
    projectedWeight30Days: number;
    projectedWeight60Days: number;
  };
  competitionReadiness: {
    targetWeightClass: string;
    daysToTarget: number;
    recommendedFeeding: string;
  };
}

class AIWeightPredictionService {
  private modelAccuracy = 0.916; // 91.6% accuracy as mentioned in requirements

  async analyzePhoto(
    photoUri: string,
    animalSpecies: 'cattle' | 'sheep' | 'swine' | 'goat',
    angle: PhotoAnalysis['angle'],
    currentWeight?: number
  ): Promise<PhotoAnalysis> {
    // Simulate AI analysis with realistic weight predictions
    const baseWeights = {
      cattle: { min: 800, max: 1400 },
      sheep: { min: 80, max: 180 },
      swine: { min: 180, max: 280 },
      goat: { min: 60, max: 120 }
    };

    const base = baseWeights[animalSpecies];
    const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
    const weightEstimate = Math.round(
      (base.min + base.max) / 2 + (base.max - base.min) * variation
    );

    // Side profile gives best accuracy
    const angleAccuracy = {
      side_profile: 0.95,
      three_quarter: 0.85,
      rear_view: 0.75,
      front_view: 0.65
    };

    const confidence = angleAccuracy[angle] * this.modelAccuracy * (0.9 + Math.random() * 0.1);
    
    // Body condition score (1-9 scale)
    const bodyConditionScore = Math.round(4 + Math.random() * 4); // 4-8 range

    return {
      weightEstimate,
      confidence,
      bodyConditionScore,
      angle,
      quality: 0.8 + Math.random() * 0.2, // 80-100% quality
      timestamp: new Date()
    };
  }

  async predictWeightWithGrowthAnalysis(
    photos: PhotoAnalysis[],
    animalData: {
      species: string;
      birthDate?: Date;
      currentWeight?: number;
      targetWeight?: number;
    }
  ): Promise<WeightPredictionResult> {
    // Find best photo (side profile with highest confidence)
    const bestPhoto = photos
      .filter(p => p.angle === 'side_profile')
      .sort((a, b) => b.confidence - a.confidence)[0] || photos[0];

    const predictedWeight = bestPhoto.weightEstimate;
    const confidence = bestPhoto.confidence;

    // Calculate accuracy range based on confidence
    const range = predictedWeight * (1 - confidence) * 0.5;
    const accuracyRange: [number, number] = [
      Math.round(predictedWeight - range),
      Math.round(predictedWeight + range)
    ];

    // Calculate age in days
    const ageInDays = animalData.birthDate 
      ? Math.floor((Date.now() - animalData.birthDate.getTime()) / (1000 * 60 * 60 * 24))
      : 180; // Default 6 months

    // Simulate growth calculations
    const averageDailyGain = this.calculateADG(animalData.species, ageInDays, predictedWeight);
    
    return {
      predictedWeight,
      confidence,
      accuracyRange,
      bodyConditionScore: bestPhoto.bodyConditionScore,
      growthProjection: {
        averageDailyGain,
        projectedWeight30Days: Math.round(predictedWeight + (averageDailyGain * 30)),
        projectedWeight60Days: Math.round(predictedWeight + (averageDailyGain * 60))
      },
      competitionReadiness: this.calculateCompetitionReadiness(
        predictedWeight,
        animalData.species,
        averageDailyGain
      )
    };
  }

  private calculateADG(species: string, ageInDays: number, currentWeight: number): number {
    // Species-specific ADG calculations
    const adgRanges = {
      cattle: { min: 2.5, max: 4.0 },
      sheep: { min: 0.4, max: 0.8 },
      swine: { min: 1.8, max: 2.2 },
      goat: { min: 0.3, max: 0.6 }
    };

    const range = adgRanges[species as keyof typeof adgRanges] || adgRanges.cattle;
    return Number((range.min + Math.random() * (range.max - range.min)).toFixed(2));
  }

  private calculateCompetitionReadiness(
    currentWeight: number,
    species: string,
    adg: number
  ) {
    const targetWeights = {
      cattle: [1200, 1300, 1400],
      sheep: [120, 140, 160],
      swine: [220, 240, 260],
      goat: [80, 90, 100]
    };

    const targets = targetWeights[species as keyof typeof targetWeights] || targetWeights.cattle;
    const targetWeight = targets.find(w => w > currentWeight) || targets[targets.length - 1];
    const daysToTarget = Math.ceil((targetWeight - currentWeight) / adg);

    let recommendedFeeding = "Maintain current feeding program";
    if (daysToTarget < 30) {
      recommendedFeeding = "Reduce feed to slow growth";
    } else if (daysToTarget > 90) {
      recommendedFeeding = "Increase feed for faster growth";
    }

    return {
      targetWeightClass: `${targetWeight} lbs`,
      daysToTarget: Math.max(0, daysToTarget),
      recommendedFeeding
    };
  }

  async getModelPerformanceMetrics() {
    return {
      accuracy: this.modelAccuracy,
      totalPredictions: 15234,
      averageConfidence: 0.87,
      userContributions: 8901,
      lastModelUpdate: new Date('2024-12-15'),
      speciesAccuracy: {
        cattle: 0.92,
        sheep: 0.89,
        swine: 0.94,
        goat: 0.88
      }
    };
  }

  // Neural network training data contribution
  async contributeToTraining(
    photoUri: string,
    actualWeight: number,
    animalSpecies: string,
    metadata: any
  ): Promise<{ pointsEarned: number; trainingId: string }> {
    // Simulate contributing to neural network training
    const qualityScore = 0.7 + Math.random() * 0.3;
    const pointsEarned = Math.round(qualityScore * 100);
    
    return {
      pointsEarned,
      trainingId: `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

export const aiWeightPredictionService = new AIWeightPredictionService();
export type { PhotoAnalysis, WeightPredictionResult };