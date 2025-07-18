/**
 * Feed Efficiency Analysis Screen
 * 
 * Comprehensive feed efficiency analysis interface including:
 * - Feed Conversion Ratio (FCR) calculations
 * - Cost per pound gain analysis
 * - Performance benchmarking
 * - Optimization recommendations
 * - Trend analysis and forecasting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator
} from 'react-native';
// Navigation handled via props
import { FeedEfficiencyService } from '../../../core/services/FeedEfficiencyService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FeedEfficiencyData {
  animalId: string;
  animalName: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  feedConsumption: {
    totalFeed: number;
    avgDailyFeed: number;
    feedCost: number;
    feedTypes: string[];
  };
  weightGain: {
    startWeight: number;
    endWeight: number;
    totalGain: number;
    avgDailyGain: number;
  };
  fcr: number;
  costPerPoundGain: number;
  efficiencyScore: number;
}

interface FeedEfficiencyAnalysis {
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
    timeToTarget: number;
  };
}

interface FeedEfficiencyAnalysisProps { onBack?: () => void; }
const FeedEfficiencyAnalysis: React.FC<FeedEfficiencyAnalysisProps> = ({ onBack }) => {
  // Navigation handled via props
  const profile = useProfileStore((state) => state.profile);
  const [efficiencyData, setEfficiencyData] = useState<FeedEfficiencyData[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FeedEfficiencyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [animals, setAnimals] = useState<any[]>([]);

  const feedEfficiencyService = new FeedEfficiencyService();

  useEffect(() => {
    loadFeedEfficiencyData();
  }, []);

  const loadFeedEfficiencyData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Load animals first
      const animalsData = await loadUserAnimals();
      setAnimals(animalsData);

      // Load efficiency data for all animals
      const efficiencyPromises = animalsData.map(async (animal) => {
        try {
          const data = await feedEfficiencyService.calculateFCR(animal.id, 30);
          return {
            ...data,
            animalName: animal.name
          };
        } catch (error) {
          console.warn(`Error loading efficiency for ${animal.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(efficiencyPromises);
      const validResults = results.filter(result => result !== null) as FeedEfficiencyData[];
      setEfficiencyData(validResults);

      // Set first animal as selected if available
      if (validResults.length > 0) {
        setSelectedAnimal(validResults[0].animalId);
        await loadDetailedAnalysis(validResults[0].animalId);
      }

    } catch (error) {
      console.error('Error loading feed efficiency data:', error);
      Alert.alert('Error', 'Failed to load feed efficiency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAnimals = async () => {
    // This would typically load from your animal service
    // For now, returning mock data
    return [
      { id: '1', name: 'Bessie', species: 'Cattle' },
      { id: '2', name: 'Dolly', species: 'Sheep' },
      { id: '3', name: 'Porky', species: 'Swine' }
    ];
  };

  const loadDetailedAnalysis = async (animalId: string) => {
    try {
      const detailedAnalysis = await feedEfficiencyService.getFeedEfficiencyAnalysis(animalId);
      setAnalysis(detailedAnalysis);
    } catch (error) {
      console.error('Error loading detailed analysis:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeedEfficiencyData();
    setRefreshing(false);
  };

  const handleAnimalSelect = async (animalId: string) => {
    setSelectedAnimal(animalId);
    await loadDetailedAnalysis(animalId);
  };

  const renderAnimalSelector = () => (
    <View style={styles.animalSelector}>
      <Text style={styles.selectorTitle}>Select Animal</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {animals.map((animal) => {
          const animalData = efficiencyData.find(d => d.animalId === animal.id);
          return (
            <TouchableOpacity
              key={animal.id}
              style={[
                styles.animalCard,
                selectedAnimal === animal.id && styles.selectedAnimalCard
              ]}
              onPress={() => handleAnimalSelect(animal.id)}
            >
              <Text style={[
                styles.animalName,
                selectedAnimal === animal.id && styles.selectedAnimalName
              ]}>
                {animal.name}
              </Text>
              {animalData && (
                <>
                  <Text style={styles.animalFCR}>FCR: {animalData.fcr.toFixed(2)}</Text>
                  <Text style={styles.animalScore}>Score: {animalData.efficiencyScore}</Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderOverview = () => {
    const selectedData = efficiencyData.find(d => d.animalId === selectedAnimal);
    if (!selectedData) return null;

    return (
      <View style={styles.overviewContainer}>
        <View style={styles.metricsCard}>
          <Text style={styles.cardTitle}>Current Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedData.fcr.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Feed Conversion Ratio</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>${selectedData.costPerPoundGain.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Cost per Pound Gain</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedData.efficiencyScore}</Text>
              <Text style={styles.metricLabel}>Efficiency Score</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{selectedData.weightGain.avgDailyGain.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Avg Daily Gain (lbs)</Text>
            </View>
          </View>
        </View>

        <View style={styles.feedConsumptionCard}>
          <Text style={styles.cardTitle}>Feed Consumption</Text>
          <View style={styles.consumptionStats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Feed Consumed:</Text>
              <Text style={styles.statValue}>{selectedData.feedConsumption.totalFeed} lbs</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average Daily Feed:</Text>
              <Text style={styles.statValue}>{selectedData.feedConsumption.avgDailyFeed.toFixed(2)} lbs/day</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Feed Cost:</Text>
              <Text style={styles.statValue}>${selectedData.feedConsumption.feedCost.toFixed(2)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Feed Types:</Text>
              <Text style={styles.statValue}>{selectedData.feedConsumption.feedTypes.join(', ')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.weightGainCard}>
          <Text style={styles.cardTitle}>Weight Gain Analysis</Text>
          <View style={styles.weightStats}>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Start Weight</Text>
              <Text style={styles.weightValue}>{selectedData.weightGain.startWeight} lbs</Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Current Weight</Text>
              <Text style={styles.weightValue}>{selectedData.weightGain.endWeight} lbs</Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Total Gain</Text>
              <Text style={styles.weightValue}>{selectedData.weightGain.totalGain} lbs</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((selectedData.weightGain.totalGain / 100) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderBenchmarks = () => {
    if (!analysis?.benchmarks) return null;

    const selectedData = efficiencyData.find(d => d.animalId === selectedAnimal);
    if (!selectedData) return null;

    return (
      <View style={styles.benchmarksContainer}>
        <View style={styles.benchmarksCard}>
          <Text style={styles.cardTitle}>Performance Benchmarks</Text>
          <View style={styles.benchmarksList}>
            <View style={styles.benchmarkItem}>
              <View style={styles.benchmarkInfo}>
                <Text style={styles.benchmarkLabel}>Your FCR</Text>
                <Text style={[styles.benchmarkValue, { color: '#4CAF50' }]}>
                  {selectedData.fcr.toFixed(2)}
                </Text>
              </View>
              <View style={styles.benchmarkBar}>
                <View style={[styles.benchmarkFill, { width: '100%', backgroundColor: '#4CAF50' }]} />
              </View>
            </View>

            <View style={styles.benchmarkItem}>
              <View style={styles.benchmarkInfo}>
                <Text style={styles.benchmarkLabel}>Industry Average</Text>
                <Text style={styles.benchmarkValue}>{analysis.benchmarks.industryAverage.toFixed(2)}</Text>
              </View>
              <View style={styles.benchmarkBar}>
                <View style={[
                  styles.benchmarkFill,
                  {
                    width: `${(analysis.benchmarks.industryAverage / Math.max(selectedData.fcr, analysis.benchmarks.industryAverage)) * 100}%`,
                    backgroundColor: '#FF9800'
                  }
                ]} />
              </View>
            </View>

            <View style={styles.benchmarkItem}>
              <View style={styles.benchmarkInfo}>
                <Text style={styles.benchmarkLabel}>Top Performers</Text>
                <Text style={styles.benchmarkValue}>{analysis.benchmarks.topPerformers.toFixed(2)}</Text>
              </View>
              <View style={styles.benchmarkBar}>
                <View style={[
                  styles.benchmarkFill,
                  {
                    width: `${(analysis.benchmarks.topPerformers / Math.max(selectedData.fcr, analysis.benchmarks.topPerformers)) * 100}%`,
                    backgroundColor: '#2196F3'
                  }
                ]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.trendsCard}>
          <Text style={styles.cardTitle}>Performance Trends</Text>
          <View style={styles.trendsList}>
            <View style={styles.trendItem}>
              <View style={styles.trendIcon}>
                <Ionicons
                  name={getTrendIcon(analysis.trends.fcrTrend)}
                  size={20}
                  color={getTrendColor(analysis.trends.fcrTrend)}
                />
              </View>
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle}>Feed Conversion Ratio</Text>
                <Text style={[styles.trendStatus, { color: getTrendColor(analysis.trends.fcrTrend) }]}>
                  {analysis.trends.fcrTrend.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.trendItem}>
              <View style={styles.trendIcon}>
                <Ionicons
                  name={getTrendIcon(analysis.trends.costTrend)}
                  size={20}
                  color={getTrendColor(analysis.trends.costTrend)}
                />
              </View>
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle}>Cost Efficiency</Text>
                <Text style={[styles.trendStatus, { color: getTrendColor(analysis.trends.costTrend) }]}>
                  {analysis.trends.costTrend.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.trendItem}>
              <View style={styles.trendIcon}>
                <Ionicons
                  name={getTrendIcon(analysis.trends.efficiencyTrend)}
                  size={20}
                  color={getTrendColor(analysis.trends.efficiencyTrend)}
                />
              </View>
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle}>Overall Efficiency</Text>
                <Text style={[styles.trendStatus, { color: getTrendColor(analysis.trends.efficiencyTrend) }]}>
                  {analysis.trends.efficiencyTrend.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!analysis?.recommendations) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <View style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>Immediate Actions</Text>
          {analysis.recommendations.immediate.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="flash-outline" size={16} color="#F44336" />
              </View>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>Short-term Improvements</Text>
          {analysis.recommendations.shortTerm.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="time-outline" size={16} color="#FF9800" />
              </View>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>Long-term Strategy</Text>
          {analysis.recommendations.longTerm.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="trending-up-outline" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>

        <View style={styles.projectionsCard}>
          <Text style={styles.cardTitle}>Performance Projections</Text>
          <View style={styles.projectionsList}>
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>Target FCR</Text>
              <Text style={styles.projectionValue}>{analysis.projections.targetFCR.toFixed(2)}</Text>
            </View>
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>Projected Annual Savings</Text>
              <Text style={styles.projectionValue}>${analysis.projections.projectedSavings.toFixed(2)}</Text>
            </View>
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>Time to Target</Text>
              <Text style={styles.projectionValue}>{analysis.projections.timeToTarget} days</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'benchmarks':
        return renderBenchmarks();
      case 'recommendations':
        return renderRecommendations();
      default:
        return renderOverview();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#4CAF50';
      case 'declining': return '#F44336';
      default: return '#FF9800';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analyzing feed efficiency...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feed Efficiency</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {renderAnimalSelector()}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'benchmarks' && styles.activeTab]}
          onPress={() => setSelectedTab('benchmarks')}
        >
          <Text style={[styles.tabText, selectedTab === 'benchmarks' && styles.activeTabText]}>
            Benchmarks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'recommendations' && styles.activeTab]}
          onPress={() => setSelectedTab('recommendations')}
        >
          <Text style={[styles.tabText, selectedTab === 'recommendations' && styles.activeTabText]}>
            Optimize
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {efficiencyData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No feed efficiency data</Text>
            <Text style={styles.emptySubtext}>Start tracking feed and weight data to see analysis</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  animalSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  animalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedAnimalCard: {
    backgroundColor: '#4CAF50',
  },
  animalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedAnimalName: {
    color: '#fff',
  },
  animalFCR: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  animalScore: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  overviewContainer: {
    padding: 16,
  },
  metricsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: (width - 64) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  feedConsumptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  consumptionStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  weightGainCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weightStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightItem: {
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  benchmarksContainer: {
    padding: 16,
  },
  benchmarksCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  benchmarksList: {
    gap: 16,
  },
  benchmarkItem: {
    gap: 8,
  },
  benchmarkInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benchmarkLabel: {
    fontSize: 14,
    color: '#666',
  },
  benchmarkValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  benchmarkBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  benchmarkFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  trendsList: {
    gap: 16,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContent: {
    flex: 1,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  trendStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationsContainer: {
    padding: 16,
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  projectionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  projectionsList: {
    gap: 12,
  },
  projectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  projectionLabel: {
    fontSize: 14,
    color: '#666',
  },
  projectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default FeedEfficiencyAnalysis;