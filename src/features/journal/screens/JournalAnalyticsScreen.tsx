import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useJournalStore } from '../../../core/stores/JournalStore';
import { journalAnalyticsService, JournalAnalyticsData, TimeRangeFilter } from '../../../core/services/JournalAnalyticsService';

interface JournalAnalyticsScreenProps {
  onBack: () => void;
}

const screenWidth = Dimensions.get('window').width;

export const JournalAnalyticsScreen: React.FC<JournalAnalyticsScreenProps> = ({ onBack }) => {
  const { entries, loadEntries } = useJournalStore();
  const [analytics, setAnalytics] = useState<JournalAnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (entries.length > 0) {
      calculateAnalytics();
    } else {
      setIsLoading(false);
    }
  }, [entries, selectedTimeRange]);

  const calculateAnalytics = () => {
    setIsLoading(true);
    
    let timeRange: TimeRangeFilter | undefined;
    if (selectedTimeRange !== 'all') {
      const presets = journalAnalyticsService.getTimeRangePresets();
      timeRange = presets[selectedTimeRange];
    }
    
    const analyticsData = journalAnalyticsService.calculateAnalytics(entries, timeRange);
    setAnalytics(analyticsData);
    setIsLoading(false);
  };

  const renderTimeRangeSelector = () => {
    const ranges = [
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: '3months', label: '3 Months' },
      { key: '6months', label: '6 Months' },
      { key: 'year', label: 'Year' },
      { key: 'all', label: 'All Time' },
    ];

    return (
      <View style={styles.timeRangeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ranges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range.key && styles.timeRangeButtonActive,
              ]}
              onPress={() => setSelectedTimeRange(range.key)}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  selectedTimeRange === range.key && styles.timeRangeButtonTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderOverviewCards = () => {
    if (!analytics) return null;

    const { overview } = analytics;

    const cards = [
      {
        title: 'Total Entries',
        value: overview.totalEntries.toString(),
        subtitle: `${overview.totalDays} days`,
        icon: '📝',
        color: '#4ECDC4',
      },
      {
        title: 'Total Time',
        value: `${overview.totalHours}h`,
        subtitle: `${overview.averageEntryDuration}m avg`,
        icon: '⏱️',
        color: '#45B7D1',
      },
      {
        title: 'This Week',
        value: overview.entriesThisWeek.toString(),
        subtitle: `${overview.entriesThisMonth} this month`,
        icon: '📊',
        color: '#96CEB4',
      },
      {
        title: 'Current Streak',
        value: `${overview.currentStreak} days`,
        subtitle: `${overview.longestStreak} longest`,
        icon: '🔥',
        color: '#FFB74D',
      },
    ];

    return (
      <View style={styles.cardsContainer}>
        {cards.map((card, index) => (
          <View key={index} style={[styles.overviewCard, { borderLeftColor: card.color }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!analytics) return null;

    const { categoryBreakdown } = analytics;
    const topCategories = categoryBreakdown.slice(0, 5);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Category Breakdown</Text>
        <View style={styles.categoryContainer}>
          {topCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLabelContainer}>
                  <View style={[styles.categoryIndicator, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryLabel}>{category.category}</Text>
                </View>
                <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
              </View>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryStatText}>
                  {category.count} entries • {Math.round(category.totalTime / 60)}h total • {category.averageTime}m avg
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAETSkillProgress = () => {
    if (!analytics) return null;

    const { aetSkillProgress } = analytics;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎓 AET Skill Development</Text>
        <View style={styles.aetOverviewContainer}>
          <View style={styles.aetOverviewCard}>
            <Text style={styles.aetOverviewValue}>{aetSkillProgress.totalSkills}</Text>
            <Text style={styles.aetOverviewLabel}>Total Skills</Text>
          </View>
          <View style={styles.aetOverviewCard}>
            <Text style={styles.aetOverviewValue}>{aetSkillProgress.uniqueSkills}</Text>
            <Text style={styles.aetOverviewLabel}>Unique Skills</Text>
          </View>
          <View style={styles.aetOverviewCard}>
            <Text style={styles.aetOverviewValue}>{aetSkillProgress.careerReadiness}%</Text>
            <Text style={styles.aetOverviewLabel}>Career Ready</Text>
          </View>
        </View>

        <View style={styles.skillCategoriesContainer}>
          <Text style={styles.subsectionTitle}>Skills by Category</Text>
          {Object.entries(aetSkillProgress.skillsByCategory).map(([category, count]) => (
            <View key={category} style={styles.skillCategoryItem}>
              <Text style={styles.skillCategoryName}>{category}</Text>
              <View style={styles.skillCategoryBar}>
                <View 
                  style={[
                    styles.skillCategoryProgress, 
                    { width: `${(count / aetSkillProgress.totalSkills) * 100}%` }
                  ]} 
                />
                <Text style={styles.skillCategoryCount}>{count}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.topSkillsContainer}>
          <Text style={styles.subsectionTitle}>Top Skills</Text>
          {aetSkillProgress.topSkills.slice(0, 5).map((skill, index) => (
            <View key={index} style={styles.topSkillItem}>
              <View style={styles.topSkillRank}>
                <Text style={styles.topSkillRankText}>{index + 1}</Text>
              </View>
              <View style={styles.topSkillInfo}>
                <Text style={styles.topSkillName}>{skill.name}</Text>
                <Text style={styles.topSkillCategory}>{skill.category}</Text>
              </View>
              <Text style={styles.topSkillCount}>{skill.count}x</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFeedAnalytics = () => {
    if (!analytics) return null;

    const { feedAnalytics } = analytics;

    if (feedAnalytics.totalFeedEntries === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌾 Feed Analytics</Text>
          <Text style={styles.noDataText}>No feed data available</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌾 Feed Analytics</Text>
        <View style={styles.feedOverviewContainer}>
          <View style={styles.feedOverviewCard}>
            <Text style={styles.feedOverviewValue}>{feedAnalytics.totalFeedEntries}</Text>
            <Text style={styles.feedOverviewLabel}>Feed Entries</Text>
          </View>
          <View style={styles.feedOverviewCard}>
            <Text style={styles.feedOverviewValue}>${feedAnalytics.totalFeedCost}</Text>
            <Text style={styles.feedOverviewLabel}>Total Cost</Text>
          </View>
          <View style={styles.feedOverviewCard}>
            <Text style={styles.feedOverviewValue}>${feedAnalytics.averageFeedCost}</Text>
            <Text style={styles.feedOverviewLabel}>Average Cost</Text>
          </View>
          <View style={styles.feedOverviewCard}>
            <Text style={styles.feedOverviewValue}>${feedAnalytics.feedEfficiency}/h</Text>
            <Text style={styles.feedOverviewLabel}>Cost/Hour</Text>
          </View>
        </View>

        {feedAnalytics.topFeedBrands.length > 0 && (
          <View style={styles.topBrandsContainer}>
            <Text style={styles.subsectionTitle}>Top Feed Brands</Text>
            {feedAnalytics.topFeedBrands.slice(0, 5).map((brand, index) => (
              <View key={index} style={styles.topBrandItem}>
                <Text style={styles.topBrandName}>{brand.brand}</Text>
                <Text style={styles.topBrandStats}>
                  {brand.count} uses • ${brand.totalCost.toFixed(2)} total
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderProductivityMetrics = () => {
    if (!analytics) return null;

    const { productivityMetrics } = analytics;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Productivity Metrics</Text>
        <View style={styles.productivityContainer}>
          <View style={styles.productivityCard}>
            <Text style={styles.productivityValue}>{productivityMetrics.entriesPerWeek}</Text>
            <Text style={styles.productivityLabel}>Entries/Week</Text>
          </View>
          <View style={styles.productivityCard}>
            <Text style={styles.productivityValue}>{productivityMetrics.goalsAchieved}</Text>
            <Text style={styles.productivityLabel}>Goals Achieved</Text>
          </View>
          <View style={styles.productivityCard}>
            <Text style={styles.productivityValue}>{productivityMetrics.challengesSolved}</Text>
            <Text style={styles.productivityLabel}>Challenges Solved</Text>
          </View>
          <View style={styles.productivityCard}>
            <Text style={styles.productivityValue}>{productivityMetrics.learningOutcomes.length}</Text>
            <Text style={styles.productivityLabel}>Learning Outcomes</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!analytics) return null;

    const { recommendations } = analytics;

    if (recommendations.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Recommendations</Text>
        {recommendations.map((rec, index) => (
          <View key={index} style={[styles.recommendationCard, styles[`recommendation${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}`]]}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationIcon}>
                {rec.type === 'achievement' ? '🏆' : rec.type === 'improvement' ? '⚡' : '💡'}
              </Text>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <View style={[styles.recommendationPriority, styles[`priority${rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}`]]}>
                <Text style={styles.recommendationPriorityText}>{rec.priority}</Text>
              </View>
            </View>
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📊</Text>
      <Text style={styles.emptyStateTitle}>No Analytics Available</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start logging your journal entries to see detailed analytics about your agricultural activities and skill development.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.headerRight} />
      </View>

      {entries.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderTimeRangeSelector()}
          {renderOverviewCards()}
          {renderCategoryBreakdown()}
          {renderAETSkillProgress()}
          {renderFeedAnalytics()}
          {renderProductivityMetrics()}
          {renderRecommendations()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  timeRangeContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeButtonTextActive: {
    color: '#fff',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (screenWidth - 44) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoryContainer: {
    gap: 12,
  },
  categoryItem: {
    paddingVertical: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  categoryStats: {
    marginLeft: 20,
  },
  categoryStatText: {
    fontSize: 12,
    color: '#666',
  },
  aetOverviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  aetOverviewCard: {
    alignItems: 'center',
  },
  aetOverviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  aetOverviewLabel: {
    fontSize: 12,
    color: '#666',
  },
  skillCategoriesContainer: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  skillCategoryItem: {
    marginBottom: 12,
  },
  skillCategoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  skillCategoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    height: 20,
    position: 'relative',
  },
  skillCategoryProgress: {
    backgroundColor: '#007AFF',
    height: '100%',
    borderRadius: 4,
  },
  skillCategoryCount: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  topSkillsContainer: {
    marginBottom: 20,
  },
  topSkillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topSkillRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topSkillRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  topSkillInfo: {
    flex: 1,
  },
  topSkillName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  topSkillCategory: {
    fontSize: 12,
    color: '#666',
  },
  topSkillCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  feedOverviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  feedOverviewCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  feedOverviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  feedOverviewLabel: {
    fontSize: 12,
    color: '#666',
  },
  topBrandsContainer: {
    marginBottom: 20,
  },
  topBrandItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topBrandName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  topBrandStats: {
    fontSize: 12,
    color: '#666',
  },
  productivityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productivityCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  productivityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productivityLabel: {
    fontSize: 12,
    color: '#666',
  },
  recommendationCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  recommendationAchievement: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#28a745',
  },
  recommendationImprovement: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ffc107',
  },
  recommendationSuggestion: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recommendationPriority: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: '#ffebee',
  },
  priorityMedium: {
    backgroundColor: '#fff3e0',
  },
  priorityLow: {
    backgroundColor: '#f3e5f5',
  },
  recommendationPriorityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});