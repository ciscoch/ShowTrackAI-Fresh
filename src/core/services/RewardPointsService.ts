interface RewardTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus';
  points: number;
  description: string;
  category: 'photo_contribution' | 'data_quality' | 'milestone' | 'referral' | 'redemption';
  metadata?: {
    photoQuality?: number;
    speciesContributed?: string;
    milestoneType?: string;
    redeemedItem?: string;
  };
  timestamp: Date;
}

interface RewardBalance {
  totalPoints: number;
  availablePoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  currentTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  pointsToNextTier: number;
}

interface RewardTier {
  name: string;
  minPoints: number;
  benefits: string[];
  badgeIcon: string;
}

interface RedeemableReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'merchandise' | 'features' | 'services' | 'donations';
  availability: number;
  imageUrl?: string;
}

class RewardPointsService {
  private transactions: RewardTransaction[] = [];
  private balance: RewardBalance = {
    totalPoints: 0,
    availablePoints: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    currentTier: 'Bronze',
    pointsToNextTier: 500
  };

  private tiers: RewardTier[] = [
    {
      name: 'Bronze',
      minPoints: 0,
      benefits: ['Basic AI analysis', 'Photo contributions'],
      badgeIcon: '🥉'
    },
    {
      name: 'Silver',
      minPoints: 500,
      benefits: ['Enhanced AI insights', 'Priority support', 'Monthly reports'],
      badgeIcon: '🥈'
    },
    {
      name: 'Gold',
      minPoints: 2000,
      benefits: ['Advanced analytics', 'Custom exports', 'Beta features'],
      badgeIcon: '🥇'
    },
    {
      name: 'Platinum',
      minPoints: 5000,
      benefits: ['Premium AI models', 'API access', 'White-label options'],
      badgeIcon: '🏆'
    },
    {
      name: 'Diamond',
      minPoints: 10000,
      benefits: ['All features', 'Custom integrations', 'Personal consultant'],
      badgeIcon: '💎'
    }
  ];

  async earnPoints(
    points: number,
    category: RewardTransaction['category'],
    description: string,
    metadata?: RewardTransaction['metadata']
  ): Promise<{ newBalance: number; tierAdvancement?: string; bonusEarned?: number }> {
    
    const transaction: RewardTransaction = {
      id: `earn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'earned',
      points,
      description,
      category,
      metadata,
      timestamp: new Date()
    };

    this.transactions.push(transaction);
    
    // Update balance
    this.balance.totalPoints += points;
    this.balance.availablePoints += points;
    this.balance.lifetimeEarned += points;

    // Check for tier advancement
    const previousTier = this.balance.currentTier;
    this.updateTier();
    const tierAdvancement = previousTier !== this.balance.currentTier ? this.balance.currentTier : undefined;

    // Apply bonuses
    let bonusEarned = 0;
    
    // Quality bonus for high-quality contributions
    if (category === 'photo_contribution' && metadata?.photoQuality && metadata.photoQuality > 0.9) {
      bonusEarned = Math.round(points * 0.2); // 20% bonus for excellent photos
      await this.earnPoints(bonusEarned, 'bonus', '🌟 Quality bonus for excellent photo');
    }

    // Streak bonus (simulated)
    if (category === 'photo_contribution') {
      const recentContributions = this.getRecentContributions(7); // Last 7 days
      if (recentContributions.length >= 3) {
        bonusEarned += 25; // Streak bonus
        await this.earnPoints(25, 'bonus', '🔥 Weekly contribution streak bonus');
      }
    }

    console.log(`🏆 Earned ${points} points: ${description}`);
    if (tierAdvancement) {
      console.log(`🎉 Tier advancement: ${previousTier} → ${tierAdvancement}`);
    }

    return {
      newBalance: this.balance.availablePoints,
      tierAdvancement,
      bonusEarned: bonusEarned > 0 ? bonusEarned : undefined
    };
  }

  async redeemPoints(rewardId: string): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const reward = this.getAvailableRewards().find(r => r.id === rewardId);
    
    if (!reward) {
      return { success: false, newBalance: this.balance.availablePoints, error: 'Reward not found' };
    }

    if (this.balance.availablePoints < reward.pointsCost) {
      return { 
        success: false, 
        newBalance: this.balance.availablePoints, 
        error: 'Insufficient points' 
      };
    }

    // Process redemption
    const transaction: RewardTransaction = {
      id: `redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'redeemed',
      points: -reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
      category: 'redemption',
      metadata: { redeemedItem: reward.name },
      timestamp: new Date()
    };

    this.transactions.push(transaction);
    
    this.balance.availablePoints -= reward.pointsCost;
    this.balance.lifetimeRedeemed += reward.pointsCost;

    console.log(`🎁 Redeemed ${reward.name} for ${reward.pointsCost} points`);

    return {
      success: true,
      newBalance: this.balance.availablePoints
    };
  }

  async getBalance(): Promise<RewardBalance> {
    // Load from storage if needed
    return { ...this.balance };
  }

  async getTransactionHistory(limit?: number): Promise<RewardTransaction[]> {
    const sorted = [...this.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  getAvailableRewards(): RedeemableReward[] {
    return [
      {
        id: 'feed_analysis',
        name: 'Premium Feed Analysis Report',
        description: 'Detailed nutritional analysis and recommendations',
        pointsCost: 250,
        category: 'services',
        availability: 100
      },
      {
        id: 'custom_chart',
        name: 'Custom Growth Chart',
        description: 'Personalized growth tracking chart for your animal',
        pointsCost: 150,
        category: 'services',
        availability: 100
      },
      {
        id: 'tshirt',
        name: 'ShowTrackAI T-Shirt',
        description: 'Official ShowTrackAI branded merchandise',
        pointsCost: 500,
        category: 'merchandise',
        availability: 25
      },
      {
        id: 'api_credits',
        name: '1000 API Credits',
        description: 'Access to ShowTrackAI API for developers',
        pointsCost: 750,
        category: 'features',
        availability: 50
      },
      {
        id: 'charity_donation',
        name: '4-H Foundation Donation',
        description: '$10 donation to 4-H youth development programs',
        pointsCost: 400,
        category: 'donations',
        availability: 1000
      },
      {
        id: 'premium_month',
        name: '1 Month Premium Features',
        description: 'Access to all premium AI features for 30 days',
        pointsCost: 1000,
        category: 'features',
        availability: 100
      }
    ];
  }

  getTiers(): RewardTier[] {
    return [...this.tiers];
  }

  private updateTier(): void {
    const currentPoints = this.balance.lifetimeEarned;
    
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (currentPoints >= this.tiers[i].minPoints) {
        this.balance.currentTier = this.tiers[i].name as RewardBalance['currentTier'];
        
        // Calculate points to next tier
        if (i < this.tiers.length - 1) {
          this.balance.pointsToNextTier = this.tiers[i + 1].minPoints - currentPoints;
        } else {
          this.balance.pointsToNextTier = 0; // Max tier reached
        }
        break;
      }
    }
  }

  private getRecentContributions(days: number): RewardTransaction[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.transactions.filter(t => 
      t.category === 'photo_contribution' && 
      t.timestamp >= cutoff
    );
  }

  // Analytics for gamification
  async getPointsAnalytics() {
    const last30Days = this.transactions.filter(t => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return t.timestamp >= cutoff;
    });

    const earnedLast30 = last30Days
      .filter(t => t.type === 'earned')
      .reduce((sum, t) => sum + t.points, 0);

    return {
      pointsLast30Days: earnedLast30,
      averagePerDay: Math.round(earnedLast30 / 30),
      contributionStreak: this.getContributionStreak(),
      topCategory: this.getTopCategory(),
      rank: this.getUserRank()
    };
  }

  private getContributionStreak(): number {
    // Calculate consecutive days with contributions
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasContribution = this.transactions.some(t => 
        t.category === 'photo_contribution' &&
        t.timestamp.toDateString() === checkDate.toDateString()
      );
      
      if (hasContribution) {
        streak++;
      } else if (i > 0) {
        break; // Streak broken
      }
    }
    
    return streak;
  }

  private getTopCategory(): string {
    const categoryPoints: Record<string, number> = {};
    
    this.transactions
      .filter(t => t.type === 'earned')
      .forEach(t => {
        categoryPoints[t.category] = (categoryPoints[t.category] || 0) + t.points;
      });

    return Object.entries(categoryPoints)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'photo_contribution';
  }

  private getUserRank(): number {
    // Simulated rank among all users
    return Math.floor(Math.random() * 1000) + 1;
  }

  // Initialize with some sample data for demo
  async initializeDemoData(): Promise<void> {
    await this.earnPoints(150, 'photo_contribution', 'Side profile photo of cattle', { photoQuality: 0.92, speciesContributed: 'cattle' });
    await this.earnPoints(75, 'photo_contribution', 'Three-quarter view of sheep', { photoQuality: 0.78, speciesContributed: 'sheep' });
    await this.earnPoints(200, 'milestone', 'First week milestone reached', { milestoneType: 'weekly_goal' });
    await this.earnPoints(100, 'data_quality', 'High accuracy weight estimate', { photoQuality: 0.95 });
  }
}

export const rewardPointsService = new RewardPointsService();
export type { RewardTransaction, RewardBalance, RewardTier, RedeemableReward };