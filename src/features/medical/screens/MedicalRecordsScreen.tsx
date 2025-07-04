import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useHealthRecordStore } from '../../../core/stores/HealthRecordStore';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { HealthRecord, HealthAlert, OBSERVATION_TYPES } from '../../../core/models/HealthRecord';
import { AddHealthRecordModal } from '../components/AddHealthRecordModal';

interface MedicalRecordsScreenProps {
  onBack: () => void;
  onNavigateToAddAnimal?: () => void;
}

export const MedicalRecordsScreen: React.FC<MedicalRecordsScreenProps> = ({ onBack, onNavigateToAddAnimal }) => {
  const {
    healthRecords,
    alerts,
    isLoading,
    loadHealthRecords,
    getHealthRecordsByAnimal,
    getAlertsByAnimal,
    getHealthSummary,
    dismissAlert,
  } = useHealthRecordStore();

  const { animals } = useAnimalStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'alerts' | 'trends'>('overview');
  const [selectedAnimal, setSelectedAnimal] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadHealthRecords();
    if (animals.length > 0 && !selectedAnimal) {
      setSelectedAnimal(animals[0].id);
    }
  }, [loadHealthRecords, animals]);

  const currentAnimal = animals.find(animal => animal.id === selectedAnimal);
  const animalHealthRecords = selectedAnimal ? getHealthRecordsByAnimal(selectedAnimal) : [];
  const animalAlerts = selectedAnimal ? getAlertsByAnimal(selectedAnimal) : [];
  const healthSummary = selectedAnimal ? getHealthSummary(selectedAnimal) : null;

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Medical Records</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonIcon}>+</Text>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAnimalSelector = () => (
    <View style={styles.animalSelector}>
      <Text style={styles.selectorLabel}>Select Animal:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animalScrollView}>
        {animals.map((animal) => (
          <TouchableOpacity
            key={animal.id}
            style={[
              styles.animalChip,
              selectedAnimal === animal.id && styles.animalChipActive
            ]}
            onPress={() => setSelectedAnimal(animal.id)}
          >
            <Text style={[
              styles.animalChipText,
              selectedAnimal === animal.id && styles.animalChipTextActive
            ]}>
              {animal.name}
            </Text>
            <Text style={[
              styles.animalChipSubtext,
              selectedAnimal === animal.id && styles.animalChipSubtextActive
            ]}>
              {animal.species}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'records', name: 'Records', icon: '🏥' },
        { id: 'alerts', name: 'Alerts', icon: '🚨' },
        { id: 'trends', name: 'Trends', icon: '📈' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <Text style={[styles.tabIcon, activeTab === tab.id && styles.activeTabIcon]}>
            {tab.icon}
          </Text>
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.name}
          </Text>
          {tab.id === 'alerts' && animalAlerts.filter(alert => !alert.dismissed).length > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>
                {animalAlerts.filter(alert => !alert.dismissed).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => {
    if (!healthSummary || !currentAnimal) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🐄</Text>
          <Text style={styles.emptyTitle}>Select an animal to view health overview</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Health Score Card */}
        <View style={styles.healthScoreCard}>
          <Text style={styles.cardTitle}>🏥 Current Health Status</Text>
          <View style={styles.healthScoreContainer}>
            <View style={styles.healthScoreCircle}>
              <Text style={styles.healthScoreNumber}>{healthSummary.currentHealthScore}</Text>
              <Text style={styles.healthScoreMax}>/5</Text>
            </View>
            <View style={styles.healthScoreInfo}>
              <Text style={styles.healthScoreLabel}>Health Score</Text>
              <Text style={[
                styles.healthTrend,
                healthSummary.healthTrend === 'improving' ? styles.trendImproving :
                healthSummary.healthTrend === 'declining' ? styles.trendDeclining : styles.trendStable
              ]}>
                {healthSummary.healthTrend === 'improving' ? '📈 Improving' :
                 healthSummary.healthTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
              </Text>
              <Text style={styles.lastCheckDate}>
                Last Check: {healthSummary.lastHealthCheck.toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Active Alerts */}
        {healthSummary.activeAlerts.length > 0 && (
          <View style={styles.alertsCard}>
            <Text style={styles.cardTitle}>🚨 Active Alerts</Text>
            {healthSummary.activeAlerts.slice(0, 3).map((alert) => (
              <View key={alert.id} style={[styles.alertItem, styles[`alert${alert.severity}`]]}>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                  {alert.dueDate && (
                    <Text style={styles.alertDueDate}>
                      Due: {alert.dueDate.toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => dismissAlert(alert.id)}
                >
                  <Text style={styles.dismissButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Recent Issues */}
        {healthSummary.recentIssues.length > 0 && (
          <View style={styles.recentIssuesCard}>
            <Text style={styles.cardTitle}>⚠️ Recent Health Concerns</Text>
            {healthSummary.recentIssues.map((issue, index) => (
              <Text key={index} style={styles.issueItem}>• {issue}</Text>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStatsCard}>
          <Text style={styles.cardTitle}>📊 Quick Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{healthSummary.totalRecords}</Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{healthSummary.upcomingTreatments.length}</Text>
              <Text style={styles.statLabel}>Pending Treatments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{healthSummary.vaccinationStatus.length}</Text>
              <Text style={styles.statLabel}>Vaccinations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>${healthSummary.totalHealthCosts.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Health Costs</Text>
            </View>
          </View>
        </View>

        {/* Common Symptoms */}
        {healthSummary.commonSymptoms.length > 0 && (
          <View style={styles.symptomsCard}>
            <Text style={styles.cardTitle}>🔍 Common Symptoms</Text>
            {healthSummary.commonSymptoms.map((symptom, index) => (
              <View key={index} style={styles.symptomItem}>
                <Text style={styles.symptomName}>{symptom.symptom}</Text>
                <View style={styles.symptomFrequency}>
                  <Text style={styles.symptomCount}>{symptom.frequency}x</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderRecordsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {animalHealthRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No health records yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking {currentAnimal?.name}'s health by adding your first record
          </Text>
        </View>
      ) : (
        animalHealthRecords.map((record) => {
          const observationType = OBSERVATION_TYPES.find(type => type.id === record.observationType);
          return (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordTypeIndicator}>
                  <Text style={styles.recordTypeIcon}>{observationType?.icon || '📋'}</Text>
                  <Text style={styles.recordTypeName}>{observationType?.name || record.observationType}</Text>
                </View>
                <Text style={styles.recordDate}>
                  {record.recordedDate.toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={styles.recordNotes}>{record.notes}</Text>
              
              {/* Vital Signs */}
              {(record.temperature || record.heartRate || record.respiratoryRate) && (
                <View style={styles.vitalSigns}>
                  <Text style={styles.vitalSignsTitle}>Vital Signs:</Text>
                  <View style={styles.vitalSignsRow}>
                    {record.temperature && (
                      <Text style={styles.vitalSign}>🌡️ {record.temperature}°F</Text>
                    )}
                    {record.heartRate && (
                      <Text style={styles.vitalSign}>❤️ {record.heartRate} BPM</Text>
                    )}
                    {record.respiratoryRate && (
                      <Text style={styles.vitalSign}>🫁 {record.respiratoryRate} BPM</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Symptoms */}
              {record.symptoms.length > 0 && (
                <View style={styles.symptomsSection}>
                  <Text style={styles.symptomsSectionTitle}>Symptoms:</Text>
                  <View style={styles.symptomsRow}>
                    {record.symptoms.map((symptom, index) => (
                      <Text key={index} style={styles.symptomTag}>{symptom}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Photos */}
              {record.photos.length > 0 && (
                <View style={styles.photosSection}>
                  <Text style={styles.photosSectionTitle}>📸 {record.photos.length} photo(s) attached</Text>
                </View>
              )}

              {/* Unknown Condition Flag */}
              {record.isUnknownCondition && (
                <View style={styles.unknownConditionFlag}>
                  <Text style={styles.unknownConditionText}>
                    ❓ Unknown condition - Expert review {record.expertReviewStatus || 'pending'}
                  </Text>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderAlertsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {animalAlerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>No active alerts</Text>
          <Text style={styles.emptySubtitle}>
            {currentAnimal?.name} has no pending health alerts
          </Text>
        </View>
      ) : (
        animalAlerts.map((alert) => (
          <View key={alert.id} style={[styles.alertCard, styles[`alert${alert.severity}`]]}>
            <View style={styles.alertCardHeader}>
              <View style={styles.alertCardInfo}>
                <Text style={styles.alertCardTitle}>{alert.title}</Text>
                <Text style={[styles.alertSeverity, styles[`severity${alert.severity}`]]}>
                  {alert.severity.toUpperCase()}
                </Text>
              </View>
              {!alert.dismissed && (
                <TouchableOpacity
                  style={styles.dismissAlertButton}
                  onPress={() => {
                    Alert.alert(
                      'Dismiss Alert',
                      'Are you sure you want to dismiss this alert?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Dismiss', onPress: () => dismissAlert(alert.id) }
                      ]
                    );
                  }}
                >
                  <Text style={styles.dismissAlertButtonText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.alertCardDescription}>{alert.description}</Text>
            
            {alert.dueDate && (
              <Text style={styles.alertCardDueDate}>
                Due: {alert.dueDate.toLocaleDateString()}
              </Text>
            )}
            
            <Text style={styles.alertCardAction}>
              Action Required: {alert.actionRequired}
            </Text>
            
            <Text style={styles.alertCardCreated}>
              Created: {alert.createdAt.toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderTrendsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.trendsPlaceholder}>
        <Text style={styles.trendsIcon}>📈</Text>
        <Text style={styles.trendsTitle}>Health Trends Analysis</Text>
        <Text style={styles.trendsSubtitle}>
          Advanced health trend analysis and predictive insights coming soon.
        </Text>
        <Text style={styles.trendsFeatures}>
          Features will include:
          {'\n'}• Health score trends over time
          {'\n'}• Seasonal pattern analysis
          {'\n'}• Predictive health alerts
          {'\n'}• Correlation with feed and weight data
          {'\n'}• Benchmark comparisons with peer animals
        </Text>
      </View>
    </ScrollView>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading medical records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {animals.length > 0 && renderAnimalSelector()}
      {renderTabBar()}
      
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'records' && renderRecordsTab()}
      {activeTab === 'alerts' && renderAlertsTab()}
      {activeTab === 'trends' && renderTrendsTab()}

      <AddHealthRecordModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedAnimalId={selectedAnimal}
        onNavigateToAddAnimal={onNavigateToAddAnimal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 60,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 0,
    minWidth: 60,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    flex: 0,
    minWidth: 55,
    maxWidth: 65,
    justifyContent: 'center',
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  animalSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  animalScrollView: {
    paddingHorizontal: 12,
  },
  animalChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 80,
    alignItems: 'center',
  },
  animalChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  animalChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  animalChipTextActive: {
    color: '#fff',
  },
  animalChipSubtext: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  animalChipSubtextActive: {
    color: '#e3f2fd',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  alertBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  healthScoreCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
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
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  healthScoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  healthScoreMax: {
    fontSize: 14,
    color: '#666',
  },
  healthScoreInfo: {
    flex: 1,
  },
  healthScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  healthTrend: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  trendImproving: {
    color: '#4caf50',
  },
  trendDeclining: {
    color: '#f44336',
  },
  trendStable: {
    color: '#666',
  },
  lastCheckDate: {
    fontSize: 12,
    color: '#666',
  },
  alertsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  alertlow: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#6c757d',
  },
  alertmedium: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ffc107',
  },
  alerthigh: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#dc3545',
  },
  alertcritical: {
    backgroundColor: '#f5c6cb',
    borderLeftColor: '#721c24',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  alertDueDate: {
    fontSize: 11,
    color: '#888',
  },
  dismissButton: {
    padding: 8,
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 16,
  },
  recentIssuesCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issueItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  quickStatsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  symptomsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  symptomName: {
    fontSize: 14,
    color: '#333',
  },
  symptomFrequency: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  symptomCount: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  recordCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  recordTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recordDate: {
    fontSize: 12,
    color: '#666',
  },
  recordNotes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  vitalSigns: {
    marginBottom: 12,
  },
  vitalSignsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  vitalSignsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalSign: {
    fontSize: 12,
    color: '#333',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  symptomsSection: {
    marginBottom: 12,
  },
  symptomsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomTag: {
    fontSize: 11,
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photosSection: {
    marginBottom: 8,
  },
  photosSectionTitle: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  unknownConditionFlag: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  unknownConditionText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertCardInfo: {
    flex: 1,
  },
  alertCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  alertSeverity: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  severitylow: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  severitymedium: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  severityhigh: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  severitycritical: {
    backgroundColor: '#f5c6cb',
    color: '#491217',
  },
  dismissAlertButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dismissAlertButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  alertCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertCardDueDate: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
    marginBottom: 4,
  },
  alertCardAction: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
  },
  alertCardCreated: {
    fontSize: 11,
    color: '#999',
  },
  trendsPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  trendsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  trendsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  trendsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  trendsFeatures: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'left',
  },
});