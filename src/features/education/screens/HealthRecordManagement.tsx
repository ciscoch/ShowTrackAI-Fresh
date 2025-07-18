/**
 * Health Record Management Screen
 * 
 * Comprehensive health record management interface including:
 * - Health record creation and tracking
 * - AI-powered health analysis
 * - Vaccination management
 * - Treatment tracking
 * - Health analytics and trends
 * - Veterinary consultation integration
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
  ActivityIndicator,
  Image
} from 'react-native';
// Navigation handled via props
import { HealthRecordService } from '../../../core/services/HealthRecordService';
import { AiAnalysisService } from '../../../core/services/AiAnalysisService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HealthRecord {
  id: string;
  animalId: string;
  animalName: string;
  observationType: 'routine' | 'illness' | 'treatment' | 'emergency';
  observationDate: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bodyConditionScore?: number;
  appetiteScore?: number;
  activityLevel?: number;
  symptoms?: string[];
  detailedNotes?: string;
  severityLevel?: number;
  conditionStatus: 'identified' | 'unknown' | 'pending_review' | 'expert_reviewed';
  photos?: string[];
  aiAnalysis?: any;
  treatments?: any[];
  followUpRequired?: boolean;
  followUpDate?: string;
}

interface HealthAlert {
  id: string;
  type: 'vaccination_due' | 'follow_up_required' | 'abnormal_symptoms' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  animalName: string;
  dueDate?: string;
}

interface HealthRecordManagementProps {
  onBack?: () => void;
}

const HealthRecordManagement: React.FC<HealthRecordManagementProps> = ({ onBack }) => {
  const profile = useProfileStore((state) => state.profile);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('records');

  const healthRecordService = new HealthRecordService();
  const aiAnalysisService = new AiAnalysisService();

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Load animals first
      const animalsData = await loadUserAnimals();
      setAnimals(animalsData);

      // Load health records for all animals
      const allRecords = await Promise.all(
        animalsData.map(async (animal) => {
          const records = await healthRecordService.getHealthRecords(animal.id);
          return records.map(record => ({
            ...record,
            animalName: animal.name
          }));
        })
      );
      
      const flatRecords = allRecords.flat().sort((a, b) => 
        new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime()
      );
      setHealthRecords(flatRecords);

      // Load health alerts
      const allAlerts = await Promise.all(
        animalsData.map(async (animal) => {
          const alerts = await healthRecordService.getActiveHealthAlerts(animal.id);
          return alerts.map(alert => ({
            ...alert,
            animalName: animal.name
          }));
        })
      );
      
      const flatAlerts = allAlerts.flat().sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      setHealthAlerts(flatAlerts);

    } catch (error) {
      console.error('Error loading health data:', error);
      Alert.alert('Error', 'Failed to load health data. Please try again.');
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHealthData();
    setRefreshing(false);
  };

  const handleCreateRecord = () => {
    setShowCreateModal(true);
  };

  const handleRecordPress = (record: HealthRecord) => {
    setSelectedRecord(record);
  };

  const handleAIAnalysis = async (photos: string[]) => {
    try {
      const analysis = await aiAnalysisService.analyzeHealthPhoto(photos[0]);
      return analysis;
    } catch (error) {
      console.error('Error analyzing health photo:', error);
      return null;
    }
  };

  const renderHealthRecordCard = (record: HealthRecord) => (
    <TouchableOpacity
      key={record.id}
      style={styles.recordCard}
      onPress={() => handleRecordPress(record)}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleContainer}>
          <Text style={styles.recordTitle}>{record.animalName}</Text>
          <Text style={styles.recordDate}>{formatDate(record.observationDate)}</Text>
        </View>
        <View style={styles.recordBadges}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(record.observationType) }]}>
            <Text style={styles.typeBadgeText}>{record.observationType.toUpperCase()}</Text>
          </View>
          {record.severityLevel && record.severityLevel >= 3 && (
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(record.severityLevel) }]}>
              <Text style={styles.severityBadgeText}>Level {record.severityLevel}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.recordContent}>
        {record.symptoms && record.symptoms.length > 0 && (
          <View style={styles.symptomsContainer}>
            <Text style={styles.symptomsLabel}>Symptoms:</Text>
            <Text style={styles.symptomsText}>{record.symptoms.join(', ')}</Text>
          </View>
        )}
        
        {record.detailedNotes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {record.detailedNotes}
          </Text>
        )}

        <View style={styles.recordStats}>
          {record.temperature && (
            <View style={styles.statItem}>
              <Ionicons name="thermometer-outline" size={16} color="#666" />
              <Text style={styles.statText}>{record.temperature}°F</Text>
            </View>
          )}
          {record.bodyConditionScore && (
            <View style={styles.statItem}>
              <Ionicons name="body-outline" size={16} color="#666" />
              <Text style={styles.statText}>BCS: {record.bodyConditionScore}/9</Text>
            </View>
          )}
          {record.treatments && record.treatments.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="medical-outline" size={16} color="#666" />
              <Text style={styles.statText}>{record.treatments.length} treatments</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.recordFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(record.conditionStatus) }]} />
          <Text style={styles.statusText}>{record.conditionStatus.replace('_', ' ')}</Text>
        </View>
        {record.followUpRequired && (
          <View style={styles.followUpContainer}>
            <Ionicons name="calendar-outline" size={16} color="#FF9800" />
            <Text style={styles.followUpText}>Follow-up required</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHealthAlertCard = (alert: HealthAlert) => (
    <TouchableOpacity
      key={alert.id}
      style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.priority) }]}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <Ionicons
            name={getAlertIcon(alert.type)}
            size={20}
            color={getAlertColor(alert.priority)}
          />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{alert.message}</Text>
          <Text style={styles.alertAnimal}>{alert.animalName}</Text>
          {alert.dueDate && (
            <Text style={styles.alertDate}>Due: {formatDate(alert.dueDate)}</Text>
          )}
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getAlertColor(alert.priority) }]}>
          <Text style={styles.priorityText}>{alert.priority.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecordsList = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.recordsContainer}>
        {healthRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No health records yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your animals' health</Text>
          </View>
        ) : (
          healthRecords.map(renderHealthRecordCard)
        )}
      </View>
    </ScrollView>
  );

  const renderAlertsList = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.alertsContainer}>
        {healthAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No active alerts</Text>
            <Text style={styles.emptySubtext}>Your animals are healthy!</Text>
          </View>
        ) : (
          healthAlerts.map(renderHealthAlertCard)
        )}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.scrollView}>
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>Health Overview</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsNumber}>{healthRecords.length}</Text>
              <Text style={styles.analyticsLabel}>Total Records</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsNumber}>{healthAlerts.length}</Text>
              <Text style={styles.analyticsLabel}>Active Alerts</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsNumber}>{animals.length}</Text>
              <Text style={styles.analyticsLabel}>Animals Tracked</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsNumber}>92%</Text>
              <Text style={styles.analyticsLabel}>Health Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>Recent Trends</Text>
          <View style={styles.trendsList}>
            <View style={styles.trendItem}>
              <View style={styles.trendIcon}>
                <Ionicons name="trending-up" size={16} color="#4CAF50" />
              </View>
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle}>Overall Health Improving</Text>
                <Text style={styles.trendDescription}>Health scores up 5% this month</Text>
              </View>
            </View>
            <View style={styles.trendItem}>
              <View style={styles.trendIcon}>
                <Ionicons name="shield-checkmark" size={16} color="#2196F3" />
              </View>
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle}>Vaccination Compliance</Text>
                <Text style={styles.trendDescription}>All animals up to date</Text>
              </View>
            </View>
            <View style={styles.trendItem}>
              <View style={styles.trendIcon}>
                <Ionicons name="warning" size={16} color="#FF9800" />
              </View>
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle}>Watch for Seasonal Issues</Text>
                <Text style={styles.trendDescription}>Monitor for respiratory symptoms</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'records':
        return renderRecordsList();
      case 'alerts':
        return renderAlertsList();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderRecordsList();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'routine': return '#4CAF50';
      case 'illness': return '#FF9800';
      case 'treatment': return '#2196F3';
      case 'emergency': return '#F44336';
      default: return '#666';
    }
  };

  const getSeverityColor = (level: number) => {
    if (level >= 4) return '#F44336';
    if (level >= 3) return '#FF9800';
    if (level >= 2) return '#FFC107';
    return '#4CAF50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified': return '#4CAF50';
      case 'unknown': return '#FF9800';
      case 'pending_review': return '#FFC107';
      case 'expert_reviewed': return '#2196F3';
      default: return '#666';
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'vaccination_due': return 'medical-outline';
      case 'follow_up_required': return 'calendar-outline';
      case 'abnormal_symptoms': return 'warning-outline';
      case 'emergency': return 'alert-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading health records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Records</Text>
        <TouchableOpacity onPress={handleCreateRecord}>
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'records' && styles.activeTab]}
          onPress={() => setSelectedTab('records')}
        >
          <Text style={[styles.tabText, selectedTab === 'records' && styles.activeTabText]}>
            Records
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'alerts' && styles.activeTab]}
          onPress={() => setSelectedTab('alerts')}
        >
          <Text style={[styles.tabText, selectedTab === 'alerts' && styles.activeTabText]}>
            Alerts
          </Text>
          {healthAlerts.length > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{healthAlerts.length}</Text>
            </View>
          )}
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

      {renderTabContent()}
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  alertBadge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  recordsContainer: {
    padding: 16,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordTitleContainer: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  recordBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  recordContent: {
    marginBottom: 12,
  },
  symptomsContainer: {
    marginBottom: 8,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: '#666',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recordStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  followUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followUpText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  alertsContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  alertAnimal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  alertDate: {
    fontSize: 12,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  trendsList: {
    gap: 12,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  trendDescription: {
    fontSize: 12,
    color: '#666',
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

export default HealthRecordManagement;