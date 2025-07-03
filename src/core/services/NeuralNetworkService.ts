interface TrainingContribution {
  id: string;
  userId: string;
  photoUri: string;
  actualWeight: number;
  species: 'cattle' | 'sheep' | 'swine' | 'goat';
  angle: 'side_profile' | 'rear_view' | 'front_view' | 'three_quarter';
  photoQuality: number;
  metadata: {
    lighting: 'excellent' | 'good' | 'poor';
    background: 'clean' | 'cluttered';
    animalPosition: 'perfect' | 'good' | 'acceptable';
    imageResolution: number;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  pointsAwarded: number;
  contributedAt: Date;
}

interface NetworkStats {
  totalContributions: number;
  verifiedContributions: number;
  activeContributors: number;
  modelVersion: string;
  lastTrainingRun: Date;
  accuracyImprovement: number;
  datasetSize: {
    cattle: number;
    sheep: number;
    swine: number;
    goat: number;
  };
}

class NeuralNetworkService {
  private contributions: TrainingContribution[] = [];

  async submitTrainingData(
    photoUri: string,
    actualWeight: number,
    species: 'cattle' | 'sheep' | 'swine' | 'goat',
    angle: 'side_profile' | 'rear_view' | 'front_view' | 'three_quarter',
    metadata: TrainingContribution['metadata']
  ): Promise<{ contributionId: string; pointsEarned: number; estimatedValue: number }> {
    
    // Analyze photo quality for training value
    const qualityScore = this.calculatePhotoQuality(metadata);
    
    // Calculate points based on quality and data needs
    const pointsEarned = this.calculateRewardPoints(species, angle, qualityScore);
    
    const contribution: TrainingContribution = {
      id: `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'current_user', // Would be actual user ID
      photoUri,
      actualWeight,
      species,
      angle,
      photoQuality: qualityScore,
      metadata,
      verificationStatus: 'pending',
      pointsAwarded: pointsEarned,
      contributedAt: new Date()
    };

    this.contributions.push(contribution);
    
    // Simulate data validation and value estimation
    const estimatedValue = this.estimateDataValue(contribution);

    console.log(`🤖 Neural Network Contribution: ${pointsEarned} points earned for ${species} ${angle} photo`);

    return {
      contributionId: contribution.id,
      pointsEarned,
      estimatedValue
    };
  }

  private calculatePhotoQuality(metadata: TrainingContribution['metadata']): number {
    let score = 0.4; // Base score

    // Lighting quality (40% of score)
    switch (metadata.lighting) {
      case 'excellent': score += 0.4; break;
      case 'good': score += 0.25; break;
      case 'poor': score += 0.1; break;
    }

    // Background quality (20% of score)
    if (metadata.background === 'clean') score += 0.2;
    else score += 0.05;

    // Animal position (25% of score)
    switch (metadata.animalPosition) {
      case 'perfect': score += 0.25; break;
      case 'good': score += 0.15; break;
      case 'acceptable': score += 0.05; break;
    }

    // Image resolution (15% of score)
    if (metadata.imageResolution >= 1920) score += 0.15;
    else if (metadata.imageResolution >= 1280) score += 0.1;
    else score += 0.05;

    return Math.min(1.0, score);
  }

  private calculateRewardPoints(
    species: string,
    angle: string,
    qualityScore: number
  ): number {
    let basePoints = 50;

    // Angle multipliers (side profile is most valuable)
    const angleMultipliers = {
      side_profile: 1.5,
      three_quarter: 1.2,
      rear_view: 1.0,
      front_view: 0.8
    };

    // Species demand multipliers (based on dataset needs)
    const speciesMultipliers = {
      cattle: 1.0,
      sheep: 1.3, // Higher demand
      swine: 1.1,
      goat: 1.4  // Highest demand
    };

    const angleMultiplier = angleMultipliers[angle as keyof typeof angleMultipliers] || 1.0;
    const speciesMultiplier = speciesMultipliers[species as keyof typeof speciesMultipliers] || 1.0;

    return Math.round(basePoints * angleMultiplier * speciesMultiplier * qualityScore);
  }

  private estimateDataValue(contribution: TrainingContribution): number {
    // Estimate monetary value of the training data
    const baseValue = 2.50; // $2.50 base value per quality contribution
    const qualityMultiplier = contribution.photoQuality;
    const rarityMultiplier = this.getSpeciesRarityMultiplier(contribution.species);
    
    return Number((baseValue * qualityMultiplier * rarityMultiplier).toFixed(2));
  }

  private getSpeciesRarityMultiplier(species: string): number {
    // Based on dataset representation
    const rarityMultipliers = {
      cattle: 1.0,
      sheep: 1.5,
      swine: 1.2,
      goat: 2.0
    };
    return rarityMultipliers[species as keyof typeof rarityMultipliers] || 1.0;
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const now = new Date();
    
    return {
      totalContributions: 15234,
      verifiedContributions: 12891,
      activeContributors: 1247,
      modelVersion: 'v2.3.1',
      lastTrainingRun: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      accuracyImprovement: 0.023, // 2.3% improvement
      datasetSize: {
        cattle: 8921,
        sheep: 2134,
        swine: 3456,
        goat: 1723
      }
    };
  }

  async getUserContributions(userId: string): Promise<TrainingContribution[]> {
    return this.contributions.filter(c => c.userId === userId);
  }

  async getTopContributors(limit: number = 10) {
    // Simulate leaderboard data
    return Array.from({ length: limit }, (_, i) => ({
      rank: i + 1,
      userId: `user_${i + 1}`,
      username: `Contributor${i + 1}`,
      totalContributions: Math.floor(Math.random() * 500) + 50,
      totalPoints: Math.floor(Math.random() * 50000) + 5000,
      accuracy: 0.85 + Math.random() * 0.1,
      joinedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
    }));
  }

  async validateContribution(contributionId: string, isValid: boolean): Promise<void> {
    const contribution = this.contributions.find(c => c.id === contributionId);
    if (contribution) {
      contribution.verificationStatus = isValid ? 'verified' : 'rejected';
      if (!isValid) {
        contribution.pointsAwarded = 0; // Revoke points for invalid data
      }
    }
  }

  // Federated learning simulation
  async downloadModelUpdate(): Promise<{ modelVersion: string; updateSize: number; improvements: string[] }> {
    return {
      modelVersion: 'v2.3.2',
      updateSize: 15.7, // MB
      improvements: [
        'Improved sheep weight accuracy by 3.2%',
        'Better handling of poor lighting conditions',
        'Enhanced body condition scoring',
        'Reduced prediction variance by 12%'
      ]
    };
  }

  async uploadLocalModelUpdates(trainingData: any[]): Promise<{ uploaded: boolean; nextTrainingRun: Date }> {
    // Simulate uploading local model improvements
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 3); // Next training in 3 days

    return {
      uploaded: true,
      nextTrainingRun: nextRun
    };
  }
}

export const neuralNetworkService = new NeuralNetworkService();
export type { TrainingContribution, NetworkStats };