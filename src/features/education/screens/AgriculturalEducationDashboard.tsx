/**
 * Agricultural Education Dashboard - Main Hub
 * 
 * Central dashboard for the ShowTrackAI Agricultural Education Platform
 * Integrates all educational features including:
 * - Student progress overview
 * - SAE project management  
 * - Feed efficiency monitoring
 * - Health records management
 * - Competency tracking
 * - AI-powered recommendations
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
import { AgriculturalEducationService } from '../../../core/services/AgriculturalEducationService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DashboardData {
  studentProfile: any;
  saeProjects: any[];
  recentActivity: any[];
  progressOverview: {
    totalHours: number;
    totalEarnings: number;
    activeProjects: number;
    competenciesCompleted: number;
    healthRecords: number;
    averageEfficiency: number;
  };
  recommendations: string[];
  alerts: any[];
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface AgriculturalEducationDashboardProps {
  onNavigateToSAE?: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToFeed?: () => void;
  onNavigateToCompetency?: () => void;
  onBack?: () => void;
}

const AgriculturalEducationDashboard: React.FC<AgriculturalEducationDashboardProps> = ({
  onNavigateToSAE,
  onNavigateToHealth,
  onNavigateToFeed,
  onNavigateToCompetency,
  onBack
}) => {
  const profile = useProfileStore((state) => state.profile);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const agriculturalEducationService = new AgriculturalEducationService();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Load comprehensive dashboard data
      const [studentProfile, saeProjects, recentActivity, progressOverview, recommendations, alerts] = await Promise.all([
        agriculturalEducationService.getStudentProfile(profile.id),
        agriculturalEducationService.getSAEProjects(profile.id),
        agriculturalEducationService.getRecentActivity(profile.id, 10),
        agriculturalEducationService.getProgressOverview(profile.id),
        agriculturalEducationService.getLearningRecommendations(profile.id),
        agriculturalEducationService.getActiveAlerts(profile.id)
      ]);

      setDashboardData({
        studentProfile,
        saeProjects,
        recentActivity,
        progressOverview,
        recommendations,
        alerts
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'sae_project',
      title: 'SAE Projects',
      icon: 'business-outline',
      color: '#4CAF50',
      onPress: () => onNavigateToSAE?.()
    },
    {
      id: 'health_records',
      title: 'Health Records',
      icon: 'medical-outline',
      color: '#2196F3',
      onPress: () => onNavigateToHealth?.()
    },
    {
      id: 'feed_efficiency',
      title: 'Feed Analysis',
      icon: 'analytics-outline',
      color: '#FF9800',
      onPress: () => onNavigateToFeed?.()
    },
    {
      id: 'competency',
      title: 'Competencies',
      icon: 'school-outline',
      color: '#9C27B0',
      onPress: () => onNavigateToCompetency?.()
    },
    {
      id: 'journal',
      title: 'Journal',
      icon: 'journal-outline',
      color: '#607D8B',
      onPress: () => () => {}
    },
    {
      id: 'animals',
      title: 'Animals',
      icon: 'paw-outline',
      color: '#795548',
      onPress: () => () => {}
    }
  ];

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionCard, { borderLeftColor: action.color }]}
            onPress={action.onPress}
          >
            <Ionicons name={action.icon as any} size={24} color={action.color} />
            <Text style={styles.quickActionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressOverview = () => {
    if (!dashboardData?.progressOverview) return null;

    const { progressOverview } = dashboardData;

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>Progress Overview</Text>
        <View style={styles.progressGrid}>
          <View style={styles.progressCard}>
            <Text style={styles.progressNumber}>{progressOverview.totalHours}</Text>
            <Text style={styles.progressLabel}>Total Hours</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressNumber}>${progressOverview.totalEarnings}</Text>
            <Text style={styles.progressLabel}>Total Earnings</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressNumber}>{progressOverview.activeProjects}</Text>
            <Text style={styles.progressLabel}>Active Projects</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressNumber}>{progressOverview.competenciesCompleted}</Text>
            <Text style={styles.progressLabel}>Competencies</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressNumber}>{progressOverview.healthRecords}</Text>
            <Text style={styles.progressLabel}>Health Records</Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressNumber}>{progressOverview.averageEfficiency}%</Text>
            <Text style={styles.progressLabel}>Efficiency</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentActivity = () => {
    if (!dashboardData?.recentActivity?.length) return null;

    return (
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons 
                name={getActivityIcon(activity.type)} 
                size={16} 
                color="#666" 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAlerts = () => {
    if (!dashboardData?.alerts?.length) return null;

    return (
      <View style={styles.alertsContainer}>
        <Text style={styles.sectionTitle}>Alerts & Notifications</Text>
        {dashboardData.alerts.map((alert, index) => (
          <View key={index} style={[styles.alertItem, { borderLeftColor: getAlertColor(alert.type) }]}>
            <Ionicons 
              name={getAlertIcon(alert.type)} 
              size={16} 
              color={getAlertColor(alert.type)} 
            />
            <Text style={styles.alertText}>{alert.message}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!dashboardData?.recommendations?.length) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        {dashboardData.recommendations.slice(0, 3).map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Ionicons name="bulb-outline" size={16} color="#FF9800" />
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <>
            {renderProgressOverview()}
            {renderRecentActivity()}
            {renderAlerts()}
            {renderRecommendations()}
          </>
        );
      case 'projects':
        return renderSAEProjects();
      case 'performance':
        return renderPerformanceMetrics();
      default:
        return renderProgressOverview();
    }
  };

  const renderSAEProjects = () => {
    if (!dashboardData?.saeProjects?.length) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No SAE projects yet</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => onNavigateToSAE?.()}
          >
            <Text style={styles.createButtonText}>Create Your First Project</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.projectsContainer}>
        <Text style={styles.sectionTitle}>SAE Projects</Text>
        {dashboardData.saeProjects.map((project, index) => (
          <TouchableOpacity key={index} style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectTitle}>{project.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                <Text style={styles.statusText}>{project.status}</Text>
              </View>
            </View>
            <Text style={styles.projectDescription}>{project.description}</Text>
            <View style={styles.projectStats}>
              <Text style={styles.statText}>Hours: {project.hours}</Text>
              <Text style={styles.statText}>Earnings: ${project.earnings}</Text>
              <Text style={styles.statText}>Progress: {project.progress}%</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPerformanceMetrics = () => (
    <View style={styles.performanceContainer}>
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Overall Performance Score</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreNumber}>85</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
      </View>
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>4.2</Text>
          <Text style={styles.metricLabel}>Avg FCR</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>92%</Text>
          <Text style={styles.metricLabel}>Health Score</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>$2.10</Text>
          <Text style={styles.metricLabel}>Cost/lb</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>78%</Text>
          <Text style={styles.metricLabel}>Efficiency</Text>
        </View>
      </View>
    </View>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sae': return 'business-outline';
      case 'health': return 'medical-outline';
      case 'feed': return 'nutrition-outline';
      case 'competency': return 'school-outline';
      default: return 'document-outline';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent': return 'alert-circle-outline';
      case 'warning': return 'warning-outline';
      case 'info': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'urgent': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'planning': return '#FF9800';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agricultural Education</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

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
          style={[styles.tab, selectedTab === 'projects' && styles.activeTab]}
          onPress={() => setSelectedTab('projects')}
        >
          <Text style={[styles.tabText, selectedTab === 'projects' && styles.activeTabText]}>
            Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'performance' && styles.activeTab]}
          onPress={() => setSelectedTab('performance')}
        >
          <Text style={[styles.tabText, selectedTab === 'performance' && styles.activeTabText]}>
            Performance
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderQuickActions()}
        {renderTabContent()}
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
  quickActionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 64) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  progressCard: {
    width: (width - 64) / 3,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  projectsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  performanceContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default AgriculturalEducationDashboard;