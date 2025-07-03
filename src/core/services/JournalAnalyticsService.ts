import { Journal } from '../models/Journal';
import { TimeTracking } from '../models/TimeTracking';
import { aetSkillMatcher } from './AETSkillMatcher';
import { AET_SKILLS_DATABASE } from '../models/AETMapping';

export interface JournalAnalyticsData {
  overview: {
    totalEntries: number;
    totalHours: number;
    totalDays: number;
    averageEntryDuration: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
    currentStreak: number;
    longestStreak: number;
  };
  
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
    totalTime: number;
    averageTime: number;
    color: string;
  }[];
  
  timeAnalytics: {
    dailyAverage: number;
    weeklyTrend: { date: string; count: number; duration: number }[];
    monthlyTrend: { month: string; count: number; duration: number }[];
    timeDistribution: { hour: number; count: number }[];
    mostActiveDay: string;
    mostActiveHour: number;
  };
  
  aetSkillProgress: {
    totalSkills: number;
    uniqueSkills: number;
    skillsByCategory: Record<string, number>;
    proficiencyDistribution: Record<string, number>;
    careerReadiness: number;
    topSkills: { skillId: string; name: string; count: number; category: string }[];
    skillGrowthTrend: { month: string; totalSkills: number; uniqueSkills: number }[];
  };
  
  feedAnalytics: {
    totalFeedEntries: number;
    totalFeedCost: number;
    averageFeedCost: number;
    feedTypeDistribution: Record<string, number>;
    topFeedBrands: { brand: string; count: number; totalCost: number }[];
    monthlyFeedCosts: { month: string; cost: number }[];
    feedEfficiency: number; // cost per hour of activity
  };
  
  productivityMetrics: {
    entriesPerWeek: number;
    goalsAchieved: number;
    improvementAreas: string[];
    challengesSolved: number;
    learningOutcomes: string[];
  };
  
  recommendations: {
    type: 'improvement' | 'achievement' | 'suggestion';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface TimeRangeFilter {
  start: Date;
  end: Date;
  preset?: 'week' | 'month' | '3months' | '6months' | 'year' | 'all';
}

class JournalAnalyticsService {
  
  calculateAnalytics(entries: Journal[], timeRange?: TimeRangeFilter): JournalAnalyticsData {
    // Filter entries by time range if provided
    const filteredEntries = timeRange 
      ? entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= timeRange.start && entryDate <= timeRange.end;
        })
      : entries;
    
    return {
      overview: this.calculateOverview(filteredEntries),
      categoryBreakdown: this.calculateCategoryBreakdown(filteredEntries),
      timeAnalytics: this.calculateTimeAnalytics(filteredEntries),
      aetSkillProgress: this.calculateAETSkillProgress(filteredEntries),
      feedAnalytics: this.calculateFeedAnalytics(filteredEntries),
      productivityMetrics: this.calculateProductivityMetrics(filteredEntries),
      recommendations: this.generateRecommendations(filteredEntries)
    };
  }
  
  private calculateOverview(entries: Journal[]): JournalAnalyticsData['overview'] {
    const totalEntries = entries.length;
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = Math.round(totalMinutes / 60 * 100) / 100;
    
    // Calculate unique days
    const uniqueDays = new Set(entries.map(entry => 
      new Date(entry.date).toDateString()
    )).size;
    
    const averageEntryDuration = totalEntries > 0 ? Math.round(totalMinutes / totalEntries) : 0;
    
    // Calculate entries this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const entriesThisWeek = entries.filter(entry => 
      new Date(entry.date) >= oneWeekAgo
    ).length;
    
    // Calculate entries this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const entriesThisMonth = entries.filter(entry => 
      new Date(entry.date) >= oneMonthAgo
    ).length;
    
    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(entries);
    
    return {
      totalEntries,
      totalHours,
      totalDays: uniqueDays,
      averageEntryDuration,
      entriesThisWeek,
      entriesThisMonth,
      currentStreak,
      longestStreak
    };
  }
  
  private calculateCategoryBreakdown(entries: Journal[]): JournalAnalyticsData['categoryBreakdown'] {
    const categoryStats: Record<string, { count: number; totalTime: number }> = {};
    
    entries.forEach(entry => {
      if (!categoryStats[entry.category]) {
        categoryStats[entry.category] = { count: 0, totalTime: 0 };
      }
      categoryStats[entry.category].count++;
      categoryStats[entry.category].totalTime += entry.duration;
    });
    
    const totalEntries = entries.length;
    const categoryColors = {
      'Feeding': '#4ECDC4',
      'Health Care': '#FF6B6B',
      'Exercise': '#45B7D1',
      'Training': '#96CEB4',
      'Grooming': '#FFEAA7',
      'Record Keeping': '#DDA0DD',
      'Equipment Maintenance': '#F4A460',
      'Show Preparation': '#FFB6C1',
      'Marketing': '#98FB98',
      'Other': '#D3D3D3'
    };
    
    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      percentage: Math.round((stats.count / totalEntries) * 100),
      totalTime: stats.totalTime,
      averageTime: Math.round(stats.totalTime / stats.count),
      color: categoryColors[category as keyof typeof categoryColors] || '#D3D3D3'
    })).sort((a, b) => b.count - a.count);
  }
  
  private calculateTimeAnalytics(entries: Journal[]): JournalAnalyticsData['timeAnalytics'] {
    if (entries.length === 0) {
      return {
        dailyAverage: 0,
        weeklyTrend: [],
        monthlyTrend: [],
        timeDistribution: [],
        mostActiveDay: 'No data',
        mostActiveHour: 0
      };
    }
    
    // Daily average
    const uniqueDays = new Set(entries.map(entry => 
      new Date(entry.date).toDateString()
    )).size;
    const dailyAverage = Math.round(entries.length / Math.max(uniqueDays, 1) * 100) / 100;
    
    // Weekly trend (last 4 weeks)
    const weeklyTrend = this.calculateWeeklyTrend(entries);
    
    // Monthly trend (last 6 months)
    const monthlyTrend = this.calculateMonthlyTrend(entries);
    
    // Time distribution by hour
    const timeDistribution = this.calculateTimeDistribution(entries);
    
    // Most active day and hour
    const { mostActiveDay, mostActiveHour } = this.calculateMostActiveTimeSlots(entries);
    
    return {
      dailyAverage,
      weeklyTrend,
      monthlyTrend,
      timeDistribution,
      mostActiveDay,
      mostActiveHour
    };
  }
  
  private calculateAETSkillProgress(entries: Journal[]): JournalAnalyticsData['aetSkillProgress'] {
    const allSkills = entries.flatMap(entry => entry.aetSkills);
    const uniqueSkills = [...new Set(allSkills)];
    
    const skillProgress = aetSkillMatcher.getSkillProgressSummary(allSkills);
    
    // Calculate top skills
    const skillCounts: Record<string, number> = {};
    allSkills.forEach(skillId => {
      skillCounts[skillId] = (skillCounts[skillId] || 0) + 1;
    });
    
    const topSkills = Object.entries(skillCounts)
      .map(([skillId, count]) => {
        const skill = AET_SKILLS_DATABASE.find(s => s.id === skillId);
        return {
          skillId,
          name: skill?.name || 'Unknown Skill',
          count,
          category: skill?.category || 'Unknown'
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate skill growth trend
    const skillGrowthTrend = this.calculateSkillGrowthTrend(entries);
    
    return {
      totalSkills: allSkills.length,
      uniqueSkills: uniqueSkills.length,
      skillsByCategory: skillProgress.categorySummary,
      proficiencyDistribution: skillProgress.proficiencyProgress,
      careerReadiness: skillProgress.careerReadiness,
      topSkills,
      skillGrowthTrend
    };
  }
  
  private calculateFeedAnalytics(entries: Journal[]): JournalAnalyticsData['feedAnalytics'] {
    const feedEntries = entries.filter(entry => entry.feedData && entry.feedData.feeds.length > 0);
    const totalFeedEntries = feedEntries.length;
    
    if (totalFeedEntries === 0) {
      return {
        totalFeedEntries: 0,
        totalFeedCost: 0,
        averageFeedCost: 0,
        feedTypeDistribution: {},
        topFeedBrands: [],
        monthlyFeedCosts: [],
        feedEfficiency: 0
      };
    }
    
    let totalFeedCost = 0;
    const feedTypeDistribution: Record<string, number> = {};
    const brandCounts: Record<string, { count: number; totalCost: number }> = {};
    
    feedEntries.forEach(entry => {
      const feedData = entry.feedData;
      const entryCost = feedData.totalCost || 0;
      totalFeedCost += entryCost;
      
      feedData.feeds.forEach(feed => {
        // Feed type distribution
        const category = feed.category || 'other';
        feedTypeDistribution[category] = (feedTypeDistribution[category] || 0) + 1;
        
        // Brand tracking
        if (!brandCounts[feed.brand]) {
          brandCounts[feed.brand] = { count: 0, totalCost: 0 };
        }
        brandCounts[feed.brand].count++;
        brandCounts[feed.brand].totalCost += (feed.cost || 0);
      });
    });
    
    const averageFeedCost = totalFeedCost / totalFeedEntries;
    
    // Top feed brands
    const topFeedBrands = Object.entries(brandCounts)
      .map(([brand, data]) => ({ brand, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Monthly feed costs
    const monthlyFeedCosts = this.calculateMonthlyFeedCosts(feedEntries);
    
    // Feed efficiency (cost per hour)
    const totalHours = feedEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;
    const feedEfficiency = totalHours > 0 ? Math.round((totalFeedCost / totalHours) * 100) / 100 : 0;
    
    return {
      totalFeedEntries,
      totalFeedCost: Math.round(totalFeedCost * 100) / 100,
      averageFeedCost: Math.round(averageFeedCost * 100) / 100,
      feedTypeDistribution,
      topFeedBrands,
      monthlyFeedCosts,
      feedEfficiency
    };
  }
  
  private calculateProductivityMetrics(entries: Journal[]): JournalAnalyticsData['productivityMetrics'] {
    const entriesPerWeek = this.calculateEntriesPerWeek(entries);
    
    // Goals achieved (entries with learning outcomes)
    const goalsAchieved = entries.filter(entry => 
      entry.learningOutcomes && entry.learningOutcomes.length > 0
    ).length;
    
    // Improvement areas (entries with improvements noted)
    const improvementAreas = entries
      .filter(entry => entry.improvements)
      .map(entry => entry.improvements!)
      .filter(improvement => improvement.length > 0);
    
    // Challenges solved
    const challengesSolved = entries.filter(entry => 
      entry.challenges && entry.challenges.length > 0
    ).length;
    
    // Learning outcomes
    const learningOutcomes = entries
      .flatMap(entry => entry.learningOutcomes || [])
      .filter(outcome => outcome.length > 0);
    
    return {
      entriesPerWeek,
      goalsAchieved,
      improvementAreas,
      challengesSolved,
      learningOutcomes
    };
  }
  
  private generateRecommendations(entries: Journal[]): JournalAnalyticsData['recommendations'] {
    const recommendations: JournalAnalyticsData['recommendations'] = [];
    
    if (entries.length === 0) {
      recommendations.push({
        type: 'suggestion',
        title: 'Start Your Journey',
        description: 'Begin documenting your agricultural activities to track your progress and skill development.',
        priority: 'high'
      });
      return recommendations;
    }
    
    // Check for consistency
    const recentEntries = entries.filter(entry => {
      const daysSinceEntry = (Date.now() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceEntry <= 7;
    });
    
    if (recentEntries.length === 0) {
      recommendations.push({
        type: 'improvement',
        title: 'Maintain Consistency',
        description: 'Try to log activities regularly to maintain momentum and track progress effectively.',
        priority: 'medium'
      });
    }
    
    // Check for skill diversity
    const uniqueSkills = new Set(entries.flatMap(entry => entry.aetSkills));
    if (uniqueSkills.size < 5) {
      recommendations.push({
        type: 'suggestion',
        title: 'Expand Skill Development',
        description: 'Consider exploring activities that develop different AET skills to broaden your agricultural knowledge.',
        priority: 'medium'
      });
    }
    
    // Check for documentation quality
    const entriesWithDetails = entries.filter(entry => 
      entry.objectives && entry.objectives.length > 0 ||
      entry.learningOutcomes && entry.learningOutcomes.length > 0
    );
    
    if (entriesWithDetails.length / entries.length < 0.5) {
      recommendations.push({
        type: 'improvement',
        title: 'Enhance Documentation',
        description: 'Adding learning objectives and outcomes to your entries will improve tracking of your educational progress.',
        priority: 'low'
      });
    }
    
    // Achievement recognition
    if (entries.length >= 10) {
      recommendations.push({
        type: 'achievement',
        title: 'Dedicated Logger',
        description: `Great job! You've logged ${entries.length} activities. Your commitment to documentation is impressive.`,
        priority: 'low'
      });
    }
    
    // Check for high-quality entries
    const detailedEntries = entries.filter(entry => entry.description.length > 100);
    if (detailedEntries.length / entries.length > 0.7) {
      recommendations.push({
        type: 'achievement',
        title: 'Detailed Documenter',
        description: 'Your entries are well-detailed and comprehensive. This quality documentation will be valuable for future reference.',
        priority: 'low'
      });
    }
    
    return recommendations;
  }
  
  // Helper methods
  private calculateStreaks(entries: Journal[]): { currentStreak: number; longestStreak: number } {
    if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const uniqueDays = [...new Set(sortedEntries.map(entry => 
      new Date(entry.date).toDateString()
    ))].sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    for (let i = 1; i < uniqueDays.length; i++) {
      const currentDate = new Date(uniqueDays[i]);
      const prevDate = new Date(uniqueDays[i - 1]);
      const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Calculate current streak
    const today = new Date();
    const lastEntryDate = new Date(uniqueDays[uniqueDays.length - 1]);
    const daysSinceLastEntry = Math.floor((today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastEntry <= 1) {
      // Count backwards from the last entry
      for (let i = uniqueDays.length - 2; i >= 0; i--) {
        const currentDate = new Date(uniqueDays[i + 1]);
        const prevDate = new Date(uniqueDays[i]);
        const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      currentStreak++; // Add the last entry day
    }
    
    return { currentStreak, longestStreak };
  }
  
  private calculateWeeklyTrend(entries: Journal[]): { date: string; count: number; duration: number }[] {
    const weeks: { date: string; count: number; duration: number }[] = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
      
      weeks.push({
        date: weekStart.toISOString().split('T')[0],
        count: weekEntries.length,
        duration: weekEntries.reduce((sum, entry) => sum + entry.duration, 0)
      });
    }
    
    return weeks;
  }
  
  private calculateMonthlyTrend(entries: Journal[]): { month: string; count: number; duration: number }[] {
    const months: { month: string; count: number; duration: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });
      
      months.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: monthEntries.length,
        duration: monthEntries.reduce((sum, entry) => sum + entry.duration, 0)
      });
    }
    
    return months;
  }
  
  private calculateTimeDistribution(entries: Journal[]): { hour: number; count: number }[] {
    const hourCounts: Record<number, number> = {};
    
    entries.forEach(entry => {
      const hour = new Date(entry.date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const distribution: { hour: number; count: number }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      distribution.push({ hour, count: hourCounts[hour] || 0 });
    }
    
    return distribution;
  }
  
  private calculateMostActiveTimeSlots(entries: Journal[]): { mostActiveDay: string; mostActiveHour: number } {
    const dayCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const day = dayNames[date.getDay()];
      const hour = date.getHours();
      
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => 
      dayCounts[a[0]] > dayCounts[b[0]] ? a : b
    )[0] || 'No data';
    
    const mostActiveHour = Object.entries(hourCounts).reduce((a, b) => 
      hourCounts[Number(a[0])] > hourCounts[Number(b[0])] ? a : b
    )[0] || 0;
    
    return { mostActiveDay, mostActiveHour: Number(mostActiveHour) };
  }
  
  private calculateSkillGrowthTrend(entries: Journal[]): { month: string; totalSkills: number; uniqueSkills: number }[] {
    const trend: { month: string; totalSkills: number; uniqueSkills: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });
      
      const allSkills = monthEntries.flatMap(entry => entry.aetSkills);
      const uniqueSkills = new Set(allSkills);
      
      trend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalSkills: allSkills.length,
        uniqueSkills: uniqueSkills.size
      });
    }
    
    return trend;
  }
  
  private calculateMonthlyFeedCosts(entries: Journal[]): { month: string; cost: number }[] {
    const costs: { month: string; cost: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });
      
      const totalCost = monthEntries.reduce((sum, entry) => 
        sum + (entry.feedData?.totalCost || 0), 0
      );
      
      costs.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        cost: Math.round(totalCost * 100) / 100
      });
    }
    
    return costs;
  }
  
  private calculateEntriesPerWeek(entries: Journal[]): number {
    if (entries.length === 0) return 0;
    
    const uniqueDays = new Set(entries.map(entry => 
      new Date(entry.date).toDateString()
    )).size;
    
    const weeks = Math.max(1, Math.ceil(uniqueDays / 7));
    return Math.round((entries.length / weeks) * 100) / 100;
  }
  
  // Time range presets
  getTimeRangePresets(): Record<string, TimeRangeFilter> {
    const now = new Date();
    
    return {
      'week': {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
        preset: 'week'
      },
      'month': {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
        preset: 'month'
      },
      '3months': {
        start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        end: now,
        preset: '3months'
      },
      '6months': {
        start: new Date(now.getFullYear(), now.getMonth() - 6, 1),
        end: now,
        preset: '6months'
      },
      'year': {
        start: new Date(now.getFullYear(), 0, 1),
        end: now,
        preset: 'year'
      }
    };
  }
}

export const journalAnalyticsService = new JournalAnalyticsService();