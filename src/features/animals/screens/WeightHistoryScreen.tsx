import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Animal, Weight } from '../../../core/models';
import { useWeightStore } from '../../../core/stores/WeightStore';
import { useAnalytics } from '../../../core/hooks/useAnalytics';
// Chart component will be created inline for now

interface WeightHistoryScreenProps {
  animal: Animal;
  onBack: () => void;
  onAddWeight: () => void;
}

export const WeightHistoryScreen: React.FC<WeightHistoryScreenProps> = ({
  animal,
  onBack,
  onAddWeight,
}) => {
  const { weights, getWeightsByAnimal, loadWeights, deleteWeight } = useWeightStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState<'chart' | 'data'>('chart');

  // Analytics
  const { trackWeightEvent, trackFeatureUsage, trackError } = useAnalytics({
    autoTrackScreenView: true,
    screenName: 'WeightHistoryScreen',
  });

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadWeights();
  }, []);

  const animalWeights = useMemo(() => {
    return getWeightsByAnimal(animal.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weights, animal.id]);

  const filteredWeights = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return animalWeights.filter(weight => new Date(weight.date) >= cutoffDate);
  }, [animalWeights, selectedPeriod]);

  const chartData = useMemo(() => {
    if (filteredWeights.length === 0) {
      return { weights: [], labels: [], minWeight: 0, maxWeight: 100 };
    }

    const weights = filteredWeights.map(weight => weight.weight);
    const labels = filteredWeights.map(weight => {
      const date = new Date(weight.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const minWeight = Math.min(...weights) * 0.95; // Add 5% padding
    const maxWeight = Math.max(...weights) * 1.05; // Add 5% padding

    return { weights, labels, minWeight, maxWeight };
  }, [filteredWeights]);

  const weightStats = useMemo(() => {
    if (animalWeights.length === 0) {
      return {
        currentWeight: animal.weight || 0,
        startWeight: 0,
        totalGain: 0,
        avgDailyGain: 0,
        lastWeekGain: 0,
        daysTracked: 0,
      };
    }

    const currentWeight = animalWeights[animalWeights.length - 1]?.weight || animal.weight || 0;
    const startWeight = animalWeights[0]?.weight || 0;
    const totalGain = currentWeight - startWeight;
    
    const firstDate = new Date(animalWeights[0].date);
    const lastDate = new Date(animalWeights[animalWeights.length - 1].date);
    const daysTracked = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgDailyGain = daysTracked > 0 ? totalGain / daysTracked : 0;

    // Calculate last week gain
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentWeights = animalWeights.filter(w => new Date(w.date) >= oneWeekAgo);
    const lastWeekGain = recentWeights.length >= 2 
      ? recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight 
      : 0;

    return {
      currentWeight,
      startWeight,
      totalGain,
      avgDailyGain,
      lastWeekGain,
      daysTracked,
    };
  }, [animalWeights, animal.weight]);

  const getGrowthTrend = (): { trend: string; color: string; icon: string } => {
    if (animalWeights.length < 2) {
      return { trend: 'Insufficient Data', color: '#666', icon: '📊' };
    }

    const recent = animalWeights.slice(-3);
    if (recent.length < 2) {
      return { trend: 'Need More Data', color: '#666', icon: '📈' };
    }

    const avgGain = recent.reduce((sum, weight, index) => {
      if (index === 0) return 0;
      return sum + (weight.weight - recent[index - 1].weight);
    }, 0) / (recent.length - 1);

    if (avgGain > 2) {
      return { trend: 'Excellent Growth', color: '#28a745', icon: '🚀' };
    } else if (avgGain > 1) {
      return { trend: 'Good Growth', color: '#28a745', icon: '📈' };
    } else if (avgGain > 0) {
      return { trend: 'Slow Growth', color: '#ffc107', icon: '📊' };
    } else if (avgGain > -1) {
      return { trend: 'Stable', color: '#6c757d', icon: '📉' };
    } else {
      return { trend: 'Weight Loss', color: '#dc3545', icon: '⚠️' };
    }
  };

  // Analytics wrapper functions
  const handleAddWeight = () => {
    trackWeightEvent('add_weight_initiated', {
      measurement_type: 'various',
      weight_value: 'pending',
      has_bcs: false,
    });
    onAddWeight();
  };

  const handleTabChange = (tab: 'chart' | 'data') => {
    trackFeatureUsage('weight_tracking', {
      action: 'tab_changed',
      tab_selected: tab,
      records_count: animalWeights.length,
    });
    setSelectedTab(tab);
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter' | 'year') => {
    trackFeatureUsage('weight_tracking', {
      action: 'period_filter_changed',
      period_selected: period,
      records_in_period: filteredWeights.length,
    });
    setSelectedPeriod(period);
  };

  const handleDeleteWeight = (weightId: string) => {
    const weightToDelete = animalWeights.find(w => w.id === weightId);
    
    Alert.alert(
      'Delete Weight Record',
      'Are you sure you want to delete this weight record?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => trackWeightEvent('delete_cancelled', {
            measurement_type: weightToDelete?.measurementType || 'unknown',
            weight_value: 'recorded',
            has_bcs: !!weightToDelete?.bodyConditionScore,
          })
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWeight(weightId);
              trackWeightEvent('delete_completed', {
                measurement_type: weightToDelete?.measurementType || 'unknown',
                weight_value: 'recorded',
                has_bcs: !!weightToDelete?.bodyConditionScore,
              });
            } catch (error) {
              trackError(error as Error, {
                feature: 'weight_tracking',
                userAction: 'delete_weight',
                weightId,
              });
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const SimpleChart: React.FC<{ data: typeof chartData }> = ({ data }) => {
    if (data.weights.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataIcon}>📊</Text>
          <Text style={styles.noDataTitle}>No Weight Data</Text>
          <Text style={styles.noDataSubtitle}>
            Start tracking {animal.name}'s weight to see growth trends
          </Text>
        </View>
      );
    }

    const chartHeight = 180;
    const chartWidth = screenWidth - 80;
    const range = data.maxWeight - data.minWeight;

    return (
      <View style={styles.simpleChart}>
        <View style={styles.chartArea}>
          {data.weights.map((weight, index) => {
            const x = (index / (data.weights.length - 1)) * chartWidth;
            const y = chartHeight - ((weight - data.minWeight) / range) * chartHeight;
            
            return (
              <View key={index}>
                {/* Data point */}
                <View
                  style={[
                    styles.dataPoint,
                    {
                      left: x - 4,
                      top: y - 4,
                    },
                  ]}
                />
                {/* Line to next point */}
                {index < data.weights.length - 1 && (
                  <View
                    style={[
                      styles.chartLine,
                      {
                        left: x,
                        top: y,
                        width: Math.sqrt(
                          Math.pow((chartWidth / (data.weights.length - 1)), 2) +
                          Math.pow(
                            ((data.weights[index + 1] - data.minWeight) / range * chartHeight) -
                            ((weight - data.minWeight) / range * chartHeight),
                            2
                          )
                        ),
                        transform: [
                          {
                            rotate: `${Math.atan2(
                              ((data.weights[index + 1] - data.minWeight) / range * chartHeight) -
                              ((weight - data.minWeight) / range * chartHeight),
                              chartWidth / (data.weights.length - 1)
                            )}rad`,
                          },
                        ],
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
        
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{data.maxWeight.toFixed(0)}</Text>
          <Text style={styles.axisLabel}>{((data.maxWeight + data.minWeight) / 2).toFixed(0)}</Text>
          <Text style={styles.axisLabel}>{data.minWeight.toFixed(0)}</Text>
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {data.labels.map((label, index) => (
            <Text key={index} style={styles.axisLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const growthTrend = getGrowthTrend();

  const StatCard: React.FC<{ icon: string; label: string; value: string; color?: string }> = ({
    icon,
    label,
    value,
    color = '#333',
  }) => (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Weight History</Text>
          <Text style={styles.subtitle}>{animal.name}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddWeight}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="⚖️"
            label="Current Weight"
            value={`${weightStats.currentWeight.toFixed(1)} lbs`}
            color="#007AFF"
          />
          <StatCard
            icon="📈"
            label="Total Gain"
            value={`${weightStats.totalGain >= 0 ? '+' : ''}${weightStats.totalGain.toFixed(1)} lbs`}
            color={weightStats.totalGain >= 0 ? '#28a745' : '#dc3545'}
          />
          <StatCard
            icon="📊"
            label="Daily Avg"
            value={`${weightStats.avgDailyGain >= 0 ? '+' : ''}${weightStats.avgDailyGain.toFixed(2)} lbs`}
            color={weightStats.avgDailyGain >= 0 ? '#28a745' : '#dc3545'}
          />
          <StatCard
            icon="🗓️"
            label="Days Tracked"
            value={`${weightStats.daysTracked}`}
          />
        </View>

        {/* Growth Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendIcon}>{growthTrend.icon}</Text>
            <View style={styles.trendInfo}>
              <Text style={styles.trendTitle}>Growth Trend</Text>
              <Text style={[styles.trendValue, { color: growthTrend.color }]}>
                {growthTrend.trend}
              </Text>
            </View>
          </View>
          <Text style={styles.trendDescription}>
            Last 7 days: {weightStats.lastWeekGain >= 0 ? '+' : ''}{weightStats.lastWeekGain.toFixed(1)} lbs
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'chart' && styles.activeTab]}
            onPress={() => handleTabChange('chart')}
          >
            <Text style={[styles.tabText, selectedTab === 'chart' && styles.activeTabText]}>
              Chart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'data' && styles.activeTab]}
            onPress={() => handleTabChange('data')}
          >
            <Text style={[styles.tabText, selectedTab === 'data' && styles.activeTabText]}>
              Data
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'chart' && (
          <>
            {/* Period Selector */}
            <View style={styles.periodContainer}>
              {['week', 'month', 'quarter', 'year'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.activePeriod,
                  ]}
                  onPress={() => handlePeriodChange(period as any)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selectedPeriod === period && styles.activePeriodText,
                    ]}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
              <SimpleChart data={chartData} />
            </View>
          </>
        )}

        {selectedTab === 'data' && (
          <View style={styles.dataContainer}>
            {animalWeights.length > 0 ? (
              animalWeights.slice().reverse().map((weight) => (
                <View key={weight.id} style={styles.weightCard}>
                  <View style={styles.weightInfo}>
                    <View style={styles.weightHeader}>
                      <Text style={styles.weightValue}>{weight.weight.toFixed(1)} lbs</Text>
                      <Text style={styles.weightDate}>{formatDate(weight.date)}</Text>
                    </View>
                    <View style={styles.weightDetails}>
                      <Text style={styles.weightType}>📏 {weight.measurementType}</Text>
                      {weight.bodyConditionScore && (
                        <Text style={styles.weightBCS}>
                          🎯 BCS: {weight.bodyConditionScore}/9
                        </Text>
                      )}
                    </View>
                    {weight.notes && (
                      <Text style={styles.weightNotes}>{weight.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWeight(weight.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataIcon}>📋</Text>
                <Text style={styles.noDataTitle}>No Weight Records</Text>
                <Text style={styles.noDataSubtitle}>
                  Add your first weight measurement to start tracking
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  trendInfo: {
    flex: 1,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendDescription: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  periodContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activePeriod: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activePeriodText: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    borderRadius: 12,
  },
  simpleChart: {
    height: 220,
    position: 'relative',
    paddingLeft: 40,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#007AFF',
    transformOrigin: '0 50%',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 20,
    height: 140,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: 35,
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 30,
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dataContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  weightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weightInfo: {
    flex: 1,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  weightDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  weightDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  weightType: {
    fontSize: 12,
    color: '#666',
  },
  weightBCS: {
    fontSize: 12,
    color: '#666',
  },
  weightNotes: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffe6e6',
  },
  deleteButtonText: {
    fontSize: 16,
  },
});