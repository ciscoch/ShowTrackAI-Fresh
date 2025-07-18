/**
 * SAE Project Management Screen
 * 
 * Comprehensive SAE project management interface including:
 * - Project creation and management
 * - Record keeping and activity tracking
 * - Business intelligence analytics
 * - Feed efficiency integration
 * - Financial tracking and reporting
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
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { AgriculturalEducationService } from '../../../core/services/AgriculturalEducationService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SAEProject {
  id: string;
  projectName: string;
  projectType: string;
  afnrPathway: string;
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed' | 'suspended';
  targetHours: number;
  actualHours: number;
  targetEarnings: number;
  actualEarnings: number;
  saeScore: number;
  businessIntelligence: {
    costPerHour: number;
    profitMargin: number;
    roiPercentage: number;
    efficiencyMetrics: {
      timeToCompletion: number;
      resourceUtilization: number;
      goalAchievementRate: number;
    };
  };
  recentRecords: any[];
}

interface SAEProjectManagementProps {
  onBack?: () => void;
}

const SAEProjectManagement: React.FC<SAEProjectManagementProps> = ({ onBack }) => {
  const profile = useProfileStore((state) => state.profile);
  const [projects, setProjects] = useState<SAEProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SAEProject | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  const agriculturalEducationService = new AgriculturalEducationService();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const projectsData = await agriculturalEducationService.getSAEProjects(profile.id);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading SAE projects:', error);
      Alert.alert('Error', 'Failed to load SAE projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleProjectPress = (project: SAEProject) => {
    setSelectedProject(project);
    setSelectedTab('overview');
  };

  const renderProjectCard = (project: SAEProject) => (
    <TouchableOpacity
      key={project.id}
      style={styles.projectCard}
      onPress={() => handleProjectPress(project)}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectTitleContainer}>
          <Text style={styles.projectTitle}>{project.projectName}</Text>
          <Text style={styles.projectType}>{project.projectType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
          <Text style={styles.statusText}>{project.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.projectStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Hours</Text>
          <Text style={styles.statValue}>{project.actualHours}/{project.targetHours}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (project.actualHours / project.targetHours) * 100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Earnings</Text>
          <Text style={styles.statValue}>${project.actualEarnings}/${project.targetEarnings}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (project.actualEarnings / project.targetEarnings) * 100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.projectFooter}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SAE Score</Text>
          <Text style={styles.scoreValue}>{project.saeScore}</Text>
        </View>
        <View style={styles.businessMetrics}>
          <Text style={styles.metricText}>ROI: {project.businessIntelligence.roiPercentage}%</Text>
          <Text style={styles.metricText}>Efficiency: {project.businessIntelligence.efficiencyMetrics.goalAchievementRate}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProjectsList = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.projectsContainer}>
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No SAE projects yet</Text>
            <Text style={styles.emptySubtext}>Create your first project to get started</Text>
          </View>
        ) : (
          projects.map(renderProjectCard)
        )}
      </View>
    </ScrollView>
  );

  const renderProjectDetails = () => {
    if (!selectedProject) return null;

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedProject(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.detailsTitle}>{selectedProject.projectName}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="#4CAF50" />
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
            style={[styles.tab, selectedTab === 'records' && styles.activeTab]}
            onPress={() => setSelectedTab('records')}
          >
            <Text style={[styles.tabText, selectedTab === 'records' && styles.activeTabText]}>
              Records
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'analytics' && styles.activeTab]}
            onPress={() => setSelectedTab('analytics')}
          >
            <Text style={[styles.tabText, selectedTab === 'analytics' && styles.activeTabText]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailsContent}>
          {selectedTab === 'overview' && renderProjectOverview()}
          {selectedTab === 'records' && renderProjectRecords()}
          {selectedTab === 'analytics' && renderProjectAnalytics()}
        </ScrollView>
      </View>
    );
  };

  const renderProjectOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>Project Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{selectedProject?.projectType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pathway:</Text>
          <Text style={styles.infoValue}>{selectedProject?.afnrPathway}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Start Date:</Text>
          <Text style={styles.infoValue}>{formatDate(selectedProject?.startDate || '')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: getStatusColor(selectedProject?.status || 'planning') }]}>
            {selectedProject?.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>Progress Summary</Text>
        <View style={styles.progressSummary}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Hours Completed</Text>
            <Text style={styles.progressValue}>{selectedProject?.actualHours} / {selectedProject?.targetHours}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      ((selectedProject?.actualHours || 0) / (selectedProject?.targetHours || 1)) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Earnings</Text>
            <Text style={styles.progressValue}>${selectedProject?.actualEarnings} / ${selectedProject?.targetEarnings}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      ((selectedProject?.actualEarnings || 0) / (selectedProject?.targetEarnings || 1)) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.overviewCard}>
        <Text style={styles.cardTitle}>Business Intelligence</Text>
        <View style={styles.businessMetricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Cost per Hour</Text>
            <Text style={styles.metricValue}>${selectedProject?.businessIntelligence.costPerHour.toFixed(2)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Profit Margin</Text>
            <Text style={styles.metricValue}>{selectedProject?.businessIntelligence.profitMargin.toFixed(1)}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ROI</Text>
            <Text style={styles.metricValue}>{selectedProject?.businessIntelligence.roiPercentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Efficiency</Text>
            <Text style={styles.metricValue}>{selectedProject?.businessIntelligence.efficiencyMetrics.goalAchievementRate}%</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderProjectRecords = () => (
    <View style={styles.recordsContainer}>
      <View style={styles.recordsHeader}>
        <Text style={styles.recordsTitle}>Activity Records</Text>
        <TouchableOpacity style={styles.addRecordButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addRecordText}>Add Record</Text>
        </TouchableOpacity>
      </View>

      {selectedProject?.recentRecords?.length === 0 ? (
        <View style={styles.emptyRecords}>
          <Ionicons name="document-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No records yet</Text>
          <Text style={styles.emptySubtext}>Start adding activities to track your progress</Text>
        </View>
      ) : (
        <View style={styles.recordsList}>
          {selectedProject?.recentRecords?.map((record, index) => (
            <View key={index} style={styles.recordItem}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>{record.title}</Text>
                <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
              </View>
              <Text style={styles.recordDescription}>{record.description}</Text>
              <View style={styles.recordStats}>
                <Text style={styles.recordStat}>Hours: {record.hours}</Text>
                <Text style={styles.recordStat}>Amount: ${record.amount}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderProjectAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <View style={styles.analyticsCard}>
        <Text style={styles.cardTitle}>Performance Metrics</Text>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>SAE Score</Text>
            <Text style={styles.analyticsValue}>{selectedProject?.saeScore}</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>Time Efficiency</Text>
            <Text style={styles.analyticsValue}>{selectedProject?.businessIntelligence.efficiencyMetrics.timeToCompletion}%</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>Resource Usage</Text>
            <Text style={styles.analyticsValue}>{selectedProject?.businessIntelligence.efficiencyMetrics.resourceUtilization}%</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>Goal Achievement</Text>
            <Text style={styles.analyticsValue}>{selectedProject?.businessIntelligence.efficiencyMetrics.goalAchievementRate}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.cardTitle}>Financial Analysis</Text>
        <View style={styles.financialMetrics}>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Total Investment</Text>
            <Text style={styles.financialValue}>$0.00</Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Current Earnings</Text>
            <Text style={styles.financialValue}>${selectedProject?.actualEarnings}</Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Net Profit</Text>
            <Text style={styles.financialValue}>${selectedProject?.actualEarnings}</Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Projected Total</Text>
            <Text style={styles.financialValue}>${selectedProject?.targetEarnings}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'planning': return '#FF9800';
      case 'suspended': return '#F44336';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading SAE projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SAE Projects</Text>
        <TouchableOpacity onPress={handleCreateProject}>
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {selectedProject ? renderProjectDetails() : renderProjectsList()}
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
  scrollView: {
    flex: 1,
  },
  projectsContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectTitleContainer: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectType: {
    fontSize: 14,
    color: '#666',
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
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  businessMetrics: {
    flexDirection: 'row',
  },
  metricText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
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
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
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
  detailsContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  overviewContainer: {
    padding: 16,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  progressSummary: {
    gap: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  businessMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 64) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recordsContainer: {
    padding: 16,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addRecordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyRecords: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  recordsList: {
    gap: 12,
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  recordDate: {
    fontSize: 12,
    color: '#666',
  },
  recordDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recordStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordStat: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  analyticsContainer: {
    padding: 16,
  },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: (width - 64) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  financialMetrics: {
    gap: 12,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  financialLabel: {
    fontSize: 14,
    color: '#666',
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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

export default SAEProjectManagement;