import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  adminAnalyticsService,
  ExecutiveSummary,
  UserAnalytics,
  AIPerformanceMetrics,
  RevenueMetrics,
  SystemPerformance
} from '../../../core/services/AdminAnalyticsService';

interface AdminDashboardScreenProps {
  onViewDetailedAnalytics: (section: string) => void;
  onGenerateReport: () => void;
  onManageAlerts: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onViewDetailedAnalytics,
  onGenerateReport,
  onManageAlerts,
}) => {
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [aiMetrics, setAIMetrics] = useState<AIPerformanceMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemPerformance | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadRealTimeMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summary, users, ai, revenue, system] = await Promise.all([
        adminAnalyticsService.getExecutiveSummary(),
        adminAnalyticsService.getUserAnalytics(),
        adminAnalyticsService.getAIPerformanceMetrics(),
        adminAnalyticsService.getRevenueMetrics(),
        adminAnalyticsService.getSystemPerformance(),
      ]);

      setExecutiveSummary(summary);
      setUserAnalytics(users);
      setAIMetrics(ai);
      setRevenueMetrics(revenue);
      setSystemMetrics(system);
      
      await loadRealTimeMetrics();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const metrics = await adminAnalyticsService.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
    } catch (error) {
      console.error('Failed to load real-time metrics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const renderExecutiveSummary = () => {
    if (!executiveSummary) return null;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>🎯 Executive Summary</Text>
        
        <View style={styles.kpiGrid}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{formatNumber(executiveSummary.totalUsers)}</Text>
            <Text style={styles.kpiLabel}>Total Users</Text>
            <Text style={[styles.kpiChange, { color: '#28a745' }]}>
              +{executiveSummary.growthMetrics.userGrowth.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{formatCurrency(executiveSummary.monthlyRevenue)}</Text>
            <Text style={styles.kpiLabel}>Monthly Revenue</Text>
            <Text style={[styles.kpiChange, { color: '#28a745' }]}>
              +{executiveSummary.growthMetrics.revenueGrowth.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{formatPercentage(executiveSummary.aiAccuracy)}</Text>
            <Text style={styles.kpiLabel}>AI Accuracy</Text>
            <Text style={[styles.kpiChange, { color: '#28a745' }]}>
              +2.3%
            </Text>
          </View>
          
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{formatPercentage(executiveSummary.systemUptime)}</Text>
            <Text style={styles.kpiLabel}>System Uptime</Text>
            <Text style={[styles.kpiChange, { color: executiveSummary.systemUptime > 0.995 ? '#28a745' : '#dc3545' }]}>
              {executiveSummary.systemUptime > 0.995 ? '✓' : '⚠️'}
            </Text>
          </View>
        </View>

        {executiveSummary.keyAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsTitle}>🚨 Critical Alerts</Text>
            {executiveSummary.keyAlerts.slice(0, 3).map((alert, index) => (
              <View key={index} style={[styles.alertItem, { borderLeftColor: getAlertColor(alert.type) }]}>
                <Text style={styles.alertText}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {alert.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.alertsButton}
              onPress={onManageAlerts}
            >
              <Text style={styles.alertsButtonText}>View All Alerts</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderRealTimeMetrics = () => {
    if (!realTimeMetrics) return null;

    return (
      <View style={styles.realtimeCard}>
        <Text style={styles.cardTitle}>⚡ Real-Time Metrics</Text>
        
        <View style={styles.realtimeGrid}>
          <View style={styles.realtimeItem}>
            <Text style={styles.realtimeValue}>{realTimeMetrics.activeUsers}</Text>
            <Text style={styles.realtimeLabel}>Active Users</Text>
          </View>
          
          <View style={styles.realtimeItem}>
            <Text style={styles.realtimeValue}>{realTimeMetrics.requestsPerSecond.toFixed(1)}</Text>
            <Text style={styles.realtimeLabel}>Requests/sec</Text>
          </View>
          
          <View style={styles.realtimeItem}>
            <Text style={styles.realtimeValue}>{formatPercentage(realTimeMetrics.systemLoad)}</Text>
            <Text style={styles.realtimeLabel}>System Load</Text>
          </View>
          
          <View style={styles.realtimeItem}>
            <Text style={[
              styles.realtimeValue,
              { color: realTimeMetrics.errorCount > 10 ? '#dc3545' : '#28a745' }
            ]}>
              {realTimeMetrics.errorCount}
            </Text>
            <Text style={styles.realtimeLabel}>Errors</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAnalyticsCards = () => {
    return (
      <View style={styles.analyticsGrid}>
        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={() => onViewDetailedAnalytics('users')}
        >
          <Text style={styles.analyticsIcon}>👥</Text>
          <Text style={styles.analyticsTitle}>User Analytics</Text>
          {userAnalytics && (
            <>
              <Text style={styles.analyticsValue}>
                {formatNumber(userAnalytics.totalUsers)} Users
              </Text>
              <Text style={styles.analyticsSubtext}>
                {userAnalytics.newUsersThisMonth} new this month
              </Text>
              <Text style={styles.analyticsMetric}>
                Retention: {formatPercentage(userAnalytics.userRetention)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={() => onViewDetailedAnalytics('ai')}
        >
          <Text style={styles.analyticsIcon}>🤖</Text>
          <Text style={styles.analyticsTitle}>AI Performance</Text>
          {aiMetrics && (
            <>
              <Text style={styles.analyticsValue}>
                {formatPercentage(aiMetrics.modelAccuracy)} Accuracy
              </Text>
              <Text style={styles.analyticsSubtext}>
                {formatNumber(aiMetrics.totalPredictions)} predictions
              </Text>
              <Text style={styles.analyticsMetric}>
                Confidence: {formatPercentage(aiMetrics.averageConfidence)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={() => onViewDetailedAnalytics('revenue')}
        >
          <Text style={styles.analyticsIcon}>💰</Text>
          <Text style={styles.analyticsTitle}>Revenue</Text>
          {revenueMetrics && (
            <>
              <Text style={styles.analyticsValue}>
                {formatCurrency(revenueMetrics.monthlyRecurringRevenue)}
              </Text>
              <Text style={styles.analyticsSubtext}>
                Monthly Recurring Revenue
              </Text>
              <Text style={styles.analyticsMetric}>
                Churn: {formatPercentage(revenueMetrics.churnRate)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={() => onViewDetailedAnalytics('system')}
        >
          <Text style={styles.analyticsIcon}>⚙️</Text>
          <Text style={styles.analyticsTitle}>System Health</Text>
          {systemMetrics && (
            <>
              <Text style={styles.analyticsValue}>
                {formatPercentage(systemMetrics.uptime)} Uptime
              </Text>
              <Text style={styles.analyticsSubtext}>
                {systemMetrics.averageResponseTime}ms avg response
              </Text>
              <Text style={styles.analyticsMetric}>
                Load: {formatPercentage(systemMetrics.serverLoad)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.cardTitle}>🛠️ Quick Actions</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onGenerateReport}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Generate Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onViewDetailedAnalytics('trends')}
        >
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={styles.actionText}>View Trends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onManageAlerts}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionText}>Manage Alerts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Export', 'Data export feature coming soon')}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Export Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Admin Dashboard</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => onRefresh()}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderExecutiveSummary()}
        {renderRealTimeMetrics()}
        {renderAnalyticsCards()}
        {renderQuickActions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  kpiChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertsSection: {
    marginTop: 8,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  alertItem: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderRadius: 4,
    padding: 8,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  alertTime: {
    fontSize: 10,
    color: '#666',
  },
  alertsButton: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  alertsButtonText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
  },
  realtimeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  realtimeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  realtimeItem: {
    alignItems: 'center',
  },
  realtimeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  realtimeLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  analyticsSubtext: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  analyticsMetric: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
});