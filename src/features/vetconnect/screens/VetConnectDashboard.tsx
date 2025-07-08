import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { HealthAssessment, VetConsultation, VetConnectAnalytics } from '../../../core/models/VetConnect';
import { Animal } from '../../../core/models/Animal';
import { vetConnectService } from '../../../core/services/VetConnectService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { useAnimalStore } from '../../../core/stores/AnimalStore';

interface VetConnectDashboardProps {
  onBack: () => void;
  onStartHealthAssessment: (animal: Animal) => void;
  onViewAssessment: (assessment: HealthAssessment) => void;
  onViewConsultation: (consultation: VetConsultation) => void;
}

export const VetConnectDashboard: React.FC<VetConnectDashboardProps> = ({
  onBack,
  onStartHealthAssessment,
  onViewAssessment,
  onViewConsultation,
}) => {
  const { currentProfile } = useProfileStore();
  const { animals } = useAnimalStore();
  const [assessments, setAssessments] = useState<HealthAssessment[]>([]);
  const [consultations, setConsultations] = useState<VetConsultation[]>([]);
  const [analytics, setAnalytics] = useState<VetConnectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVetConnectData();
  }, []);

  const loadVetConnectData = async () => {
    try {
      setLoading(true);
      
      // Create demo data if needed
      await vetConnectService.createDemoVetConnectData();
      
      // Load all data
      const [allAssessments, allConsultations, analyticsData] = await Promise.all([
        vetConnectService.getHealthAssessments(),
        vetConnectService.getConsultations(),
        vetConnectService.getVetConnectAnalytics()
      ]);

      setAssessments(allAssessments);
      setConsultations(allConsultations);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load VetConnect data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVetConnectData();
    setRefreshing(false);
  };

  const getRecentAssessments = () => {
    return assessments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
  };

  const getPendingConsultations = () => {
    return consultations.filter(c => c.status === 'pending' || c.status === 'in_progress');
  };

  const getUrgentCases = () => {
    return assessments.filter(a => a.urgencyLevel === 'high' || a.urgencyLevel === 'emergency');
  };

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statIcon}>🔍</Text>
        <Text style={styles.statValue}>{assessments.length}</Text>
        <Text style={styles.statLabel}>Assessments</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>👨‍⚕️</Text>
        <Text style={styles.statValue}>{consultations.length}</Text>
        <Text style={styles.statLabel}>Consultations</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>⚠️</Text>
        <Text style={styles.statValue}>{getUrgentCases().length}</Text>
        <Text style={styles.statLabel}>Urgent Cases</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statIcon}>⭐</Text>
        <Text style={styles.statValue}>{analytics?.studentSatisfaction.toFixed(1) || '4.8'}</Text>
        <Text style={styles.statLabel}>Satisfaction</Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => {
            if (animals.length > 0) {
              onStartHealthAssessment(animals[0]);
            }
          }}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionTitle}>Health Assessment</Text>
          <Text style={styles.actionSubtitle}>AI-powered evaluation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>🚨</Text>
          <Text style={styles.actionTitle}>Emergency Call</Text>
          <Text style={styles.actionSubtitle}>24/7 veterinary help</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionTitle}>Schedule Consultation</Text>
          <Text style={styles.actionSubtitle}>Book with a vet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📚</Text>
          <Text style={styles.actionTitle}>Learning Resources</Text>
          <Text style={styles.actionSubtitle}>Educational content</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentAssessments = () => {
    const recentAssessments = getRecentAssessments();
    
    if (recentAssessments.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recent Assessments</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No assessments yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your first AI health assessment to monitor your animals' wellbeing
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Recent Assessments</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentAssessments.map((assessment) => (
          <TouchableOpacity 
            key={assessment.id}
            style={styles.assessmentCard}
            onPress={() => onViewAssessment(assessment)}
          >
            <View style={styles.assessmentHeader}>
              <Text style={styles.assessmentAnimal}>
                Animal: {assessment.animalId}
              </Text>
              <View style={[
                styles.urgencyBadge,
                { backgroundColor: getUrgencyColor(assessment.urgencyLevel) }
              ]}>
                <Text style={styles.urgencyText}>
                  {assessment.urgencyLevel.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.assessmentType}>
              {assessment.assessmentType.replace('_', ' ')} Assessment
            </Text>
            
            <View style={styles.assessmentFooter}>
              <Text style={styles.assessmentDate}>
                {assessment.createdAt.toLocaleDateString()}
              </Text>
              <Text style={styles.assessmentConfidence}>
                AI Confidence: {Math.round(assessment.confidenceScore * 100)}%
              </Text>
            </View>
            
            <View style={styles.assessmentProgress}>
              <Text style={styles.progressText}>
                {assessment.recommendedAction === 'vet_consultation' 
                  ? '👨‍⚕️ Consultation recommended'
                  : assessment.recommendedAction === 'emergency_care'
                  ? '🚨 Emergency care needed'
                  : '✅ Continue monitoring'
                }
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderActiveConsultations = () => {
    const activeConsultations = getPendingConsultations();
    
    if (activeConsultations.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍⚕️ Active Consultations</Text>
        
        {activeConsultations.map((consultation) => (
          <TouchableOpacity 
            key={consultation.id}
            style={styles.consultationCard}
            onPress={() => onViewConsultation(consultation)}
          >
            <View style={styles.consultationHeader}>
              <Text style={styles.consultationTitle}>
                Consultation #{consultation.id.slice(-6)}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(consultation.status) }
              ]}>
                <Text style={styles.statusText}>
                  {consultation.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.consultationAnimal}>
              Animal: {consultation.animalId}
            </Text>
            
            <Text style={styles.consultationType}>
              {consultation.consultationType} consultation
            </Text>
            
            <View style={styles.consultationFooter}>
              <Text style={styles.consultationDate}>
                Scheduled: {consultation.scheduledAt.toLocaleString()}
              </Text>
              <Text style={styles.consultationFee}>
                ${consultation.consultationFee}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPlatformInsights = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Platform Insights</Text>
      
      <View style={styles.insightsCard}>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Average Response Time</Text>
          <Text style={styles.insightValue}>
            {analytics?.averageResponseTime.toFixed(0) || '12'} minutes
          </Text>
        </View>
        
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Resolution Rate</Text>
          <Text style={styles.insightValue}>
            {Math.round((analytics?.resolutionRate || 0.92) * 100)}%
          </Text>
        </View>
        
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Student Satisfaction</Text>
          <Text style={styles.insightValue}>
            ⭐ {analytics?.studentSatisfaction.toFixed(1) || '4.8'}
          </Text>
        </View>
        
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Educational Value</Text>
          <Text style={styles.insightValue}>
            🎓 {analytics?.educationalOutcomes.toFixed(1) || '4.1'}
          </Text>
        </View>
      </View>
    </View>
  );

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'emergency': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'in_progress': return '#007AFF';
      case 'completed': return '#28a745';
      case 'cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading VetConnect...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VetConnect</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        
        {/* Platform Introduction */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeIcon}>🤖👨‍⚕️</Text>
          <Text style={styles.welcomeTitle}>AI-Powered Veterinary Platform</Text>
          <Text style={styles.welcomeText}>
            Get instant AI health assessments and connect with licensed veterinarians 
            for your animal health needs. Educational and professional support combined.
          </Text>
        </View>

        {renderQuickStats()}
        {renderQuickActions()}
        {renderActiveConsultations()}
        {renderRecentAssessments()}
        {renderPlatformInsights()}

        {/* Educational Banner */}
        <View style={styles.educationBanner}>
          <Text style={styles.educationIcon}>🎓</Text>
          <View style={styles.educationContent}>
            <Text style={styles.educationTitle}>Learning-Focused Platform</Text>
            <Text style={styles.educationText}>
              Every consultation includes educational components designed to enhance 
              your understanding of animal health and veterinary science.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
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
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
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
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  assessmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentAnimal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  assessmentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  assessmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentDate: {
    fontSize: 12,
    color: '#666',
  },
  assessmentConfidence: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  assessmentProgress: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  consultationAnimal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  consultationType: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  consultationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consultationDate: {
    fontSize: 12,
    color: '#666',
  },
  consultationFee: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
  },
  insightValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  educationBanner: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbdefb',
    marginBottom: 20,
  },
  educationIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  educationContent: {
    flex: 1,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  educationText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});