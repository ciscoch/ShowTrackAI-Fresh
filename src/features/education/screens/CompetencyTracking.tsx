/**
 * Competency Tracking Screen
 * 
 * Comprehensive competency tracking interface including:
 * - AET (Agricultural Education Technology) standards
 * - FFA competency assessments
 * - Skill development tracking
 * - Proficiency level progression
 * - Evidence collection and validation
 * - Career readiness alignment
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
// Navigation handled via props
import { CompetencyTrackingService } from '../../../core/services/CompetencyTrackingService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CompetencyStandard {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisite?: string[];
  learningOutcomes: string[];
  assessmentCriteria: string[];
  careerPathways: string[];
  isActive: boolean;
}

interface CompetencyAssessment {
  id: string;
  standardCode: string;
  standardDescription: string;
  assessmentDate: string;
  proficiencyLevel: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  score?: number;
  maxScore?: number;
  evidenceUrls?: string[];
  assessmentNotes?: string;
  validationStatus: 'pending' | 'validated' | 'rejected';
  validatedBy?: string;
  validatedDate?: string;
}

interface CompetencyProgress {
  totalStandards: number;
  assessedStandards: number;
  completedStandards: number;
  inProgressStandards: number;
  proficiencyDistribution: Record<string, number>;
  categoryProgress: Record<string, {
    total: number;
    assessed: number;
    completed: number;
    averageScore: number;
  }>;
  careerReadinessScore: number;
  recommendedNextSteps: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

interface CompetencyTrackingProps { onBack?: () => void; }
const CompetencyTracking: React.FC<CompetencyTrackingProps> = ({ onBack }) => {
  // Navigation handled via props
  const profile = useProfileStore((state) => state.profile);
  const [standards, setStandards] = useState<CompetencyStandard[]>([]);
  const [assessments, setAssessments] = useState<CompetencyAssessment[]>([]);
  const [progress, setProgress] = useState<CompetencyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<CompetencyStandard | null>(null);

  const competencyService = new CompetencyTrackingService();

  useEffect(() => {
    loadCompetencyData();
  }, []);

  const loadCompetencyData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const [standardsData, assessmentsData, progressData] = await Promise.all([
        competencyService.getCompetencyStandards(),
        competencyService.getUserAssessments(profile.id),
        competencyService.getCompetencyProgress(profile.id)
      ]);

      setStandards(standardsData);
      setAssessments(assessmentsData);
      setProgress(progressData);

    } catch (error) {
      console.error('Error loading competency data:', error);
      Alert.alert('Error', 'Failed to load competency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompetencyData();
    setRefreshing(false);
  };

  const handleStandardPress = (standard: CompetencyStandard) => {
    setSelectedStandard(standard);
    setShowAssessmentModal(true);
  };

  const handleCreateAssessment = async (standardCode: string, proficiencyLevel: string) => {
    try {
      await competencyService.createAssessment({
        userId: profile?.id,
        standardCode,
        standardDescription: selectedStandard?.title || '',
        assessmentDate: new Date().toISOString(),
        proficiencyLevel: proficiencyLevel as any,
        validationStatus: 'pending'
      });
      
      setShowAssessmentModal(false);
      await loadCompetencyData();
      Alert.alert('Success', 'Assessment created successfully!');
    } catch (error) {
      console.error('Error creating assessment:', error);
      Alert.alert('Error', 'Failed to create assessment. Please try again.');
    }
  };

  const getCategories = () => {
    const categories = ['all', ...new Set(standards.map(s => s.category))];
    return categories;
  };

  const getFilteredStandards = () => {
    if (selectedCategory === 'all') return standards;
    return standards.filter(s => s.category === selectedCategory);
  };

  const getAssessmentForStandard = (standardCode: string) => {
    return assessments.find(a => a.standardCode === standardCode);
  };

  const renderCategorySelector = () => (
    <View style={styles.categorySelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {getCategories().map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.selectedCategoryChipText
            ]}>
              {category === 'all' ? 'All Categories' : category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOverview = () => {
    if (!progress) return null;

    return (
      <View style={styles.overviewContainer}>
        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Overall Progress</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progress.totalStandards}</Text>
              <Text style={styles.progressLabel}>Total Standards</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progress.assessedStandards}</Text>
              <Text style={styles.progressLabel}>Assessed</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progress.completedStandards}</Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progress.careerReadinessScore}%</Text>
              <Text style={styles.progressLabel}>Career Ready</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(progress.completedStandards / progress.totalStandards) * 100}%`
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {((progress.completedStandards / progress.totalStandards) * 100).toFixed(1)}% Complete
          </Text>
        </View>

        <View style={styles.proficiencyCard}>
          <Text style={styles.cardTitle}>Proficiency Distribution</Text>
          <View style={styles.proficiencyChart}>
            {Object.entries(progress.proficiencyDistribution).map(([level, count]) => (
              <View key={level} style={styles.proficiencyItem}>
                <View style={[styles.proficiencyBar, { backgroundColor: getProficiencyColor(level) }]}>
                  <Text style={styles.proficiencyCount}>{count}</Text>
                </View>
                <Text style={styles.proficiencyLabel}>{level}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.categoryProgressCard}>
          <Text style={styles.cardTitle}>Category Progress</Text>
          {Object.entries(progress.categoryProgress).map(([category, data]) => (
            <View key={category} style={styles.categoryProgressItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryStats}>{data.completed}/{data.total}</Text>
              </View>
              <View style={styles.categoryProgressBar}>
                <View
                  style={[
                    styles.categoryProgressFill,
                    { width: `${(data.completed / data.total) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.categoryScore}>Avg Score: {data.averageScore.toFixed(1)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.cardTitle}>Recommended Next Steps</Text>
          {progress.recommendedNextSteps.map((step, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
              <Text style={styles.recommendationText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStandardsList = () => {
    const filteredStandards = getFilteredStandards();

    return (
      <View style={styles.standardsContainer}>
        {filteredStandards.map((standard) => {
          const assessment = getAssessmentForStandard(standard.code);
          return (
            <TouchableOpacity
              key={standard.id}
              style={styles.standardCard}
              onPress={() => handleStandardPress(standard)}
            >
              <View style={styles.standardHeader}>
                <View style={styles.standardInfo}>
                  <Text style={styles.standardCode}>{standard.code}</Text>
                  <Text style={styles.standardTitle}>{standard.title}</Text>
                  <Text style={styles.standardCategory}>{standard.category}</Text>
                </View>
                <View style={styles.standardStatus}>
                  {assessment ? (
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getProficiencyColor(assessment.proficiencyLevel) }
                    ]}>
                      <Text style={styles.statusText}>{assessment.proficiencyLevel.toUpperCase()}</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: '#ccc' }]}>
                      <Text style={styles.statusText}>NOT ASSESSED</Text>
                    </View>
                  )}
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(standard.level) }]}>
                    <Text style={styles.levelText}>{standard.level.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.standardDescription} numberOfLines={2}>
                {standard.description}
              </Text>

              <View style={styles.standardFooter}>
                <View style={styles.learningOutcomes}>
                  <Text style={styles.footerLabel}>Outcomes: {standard.learningOutcomes.length}</Text>
                </View>
                <View style={styles.careerPathways}>
                  <Text style={styles.footerLabel}>Pathways: {standard.careerPathways.length}</Text>
                </View>
                {assessment && (
                  <View style={styles.assessmentDate}>
                    <Text style={styles.footerLabel}>
                      Assessed: {new Date(assessment.assessmentDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderAssessments = () => (
    <View style={styles.assessmentsContainer}>
      <View style={styles.assessmentsHeader}>
        <Text style={styles.assessmentsTitle}>Recent Assessments</Text>
        <Text style={styles.assessmentsCount}>{assessments.length} total</Text>
      </View>

      {assessments.map((assessment) => (
        <View key={assessment.id} style={styles.assessmentCard}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentInfo}>
              <Text style={styles.assessmentCode}>{assessment.standardCode}</Text>
              <Text style={styles.assessmentTitle}>{assessment.standardDescription}</Text>
            </View>
            <View style={styles.assessmentBadges}>
              <View style={[
                styles.proficiencyBadge,
                { backgroundColor: getProficiencyColor(assessment.proficiencyLevel) }
              ]}>
                <Text style={styles.proficiencyBadgeText}>{assessment.proficiencyLevel.toUpperCase()}</Text>
              </View>
              <View style={[
                styles.validationBadge,
                { backgroundColor: getValidationColor(assessment.validationStatus) }
              ]}>
                <Text style={styles.validationBadgeText}>{assessment.validationStatus.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {assessment.score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score:</Text>
              <Text style={styles.scoreValue}>{assessment.score}/{assessment.maxScore}</Text>
            </View>
          )}

          <View style={styles.assessmentFooter}>
            <Text style={styles.assessmentDate}>
              {new Date(assessment.assessmentDate).toLocaleDateString()}
            </Text>
            {assessment.evidenceUrls && assessment.evidenceUrls.length > 0 && (
              <Text style={styles.evidenceCount}>
                {assessment.evidenceUrls.length} evidence files
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'standards':
        return renderStandardsList();
      case 'assessments':
        return renderAssessments();
      default:
        return renderOverview();
    }
  };

  const renderAssessmentModal = () => (
    <Modal
      visible={showAssessmentModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAssessmentModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Assessment</Text>
          <TouchableOpacity onPress={() => handleCreateAssessment(selectedStandard?.code || '', 'developing')}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedStandard && (
            <>
              <View style={styles.standardDetails}>
                <Text style={styles.modalStandardCode}>{selectedStandard.code}</Text>
                <Text style={styles.modalStandardTitle}>{selectedStandard.title}</Text>
                <Text style={styles.modalStandardDescription}>{selectedStandard.description}</Text>
              </View>

              <View style={styles.proficiencySelection}>
                <Text style={styles.selectionTitle}>Select Proficiency Level</Text>
                {['novice', 'developing', 'proficient', 'advanced', 'expert'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.proficiencyOption}
                  >
                    <Text style={styles.proficiencyOptionText}>{level.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.learningOutcomesSection}>
                <Text style={styles.selectionTitle}>Learning Outcomes</Text>
                {selectedStandard.learningOutcomes.map((outcome, index) => (
                  <View key={index} style={styles.outcomeItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                    <Text style={styles.outcomeText}>{outcome}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return '#4CAF50';
      case 'advanced': return '#8BC34A';
      case 'proficient': return '#FFC107';
      case 'developing': return '#FF9800';
      case 'novice': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return '#673AB7';
      case 'advanced': return '#3F51B5';
      case 'intermediate': return '#2196F3';
      case 'beginner': return '#00BCD4';
      default: return '#9E9E9E';
    }
  };

  const getValidationColor = (status: string) => {
    switch (status) {
      case 'validated': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading competency data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Competency Tracking</Text>
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
          style={[styles.tab, selectedTab === 'standards' && styles.activeTab]}
          onPress={() => setSelectedTab('standards')}
        >
          <Text style={[styles.tabText, selectedTab === 'standards' && styles.activeTabText]}>
            Standards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'assessments' && styles.activeTab]}
          onPress={() => setSelectedTab('assessments')}
        >
          <Text style={[styles.tabText, selectedTab === 'assessments' && styles.activeTabText]}>
            Assessments
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'standards' && renderCategorySelector()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {renderAssessmentModal()}
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
  categorySelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  overviewContainer: {
    padding: 16,
  },
  progressCard: {
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
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  proficiencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  proficiencyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  proficiencyItem: {
    alignItems: 'center',
    flex: 1,
  },
  proficiencyBar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  proficiencyCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  proficiencyLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  categoryProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryProgressItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  categoryStats: {
    fontSize: 14,
    color: '#666',
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 4,
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  categoryScore: {
    fontSize: 12,
    color: '#666',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  standardsContainer: {
    padding: 16,
  },
  standardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  standardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  standardInfo: {
    flex: 1,
  },
  standardCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  standardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  standardCategory: {
    fontSize: 12,
    color: '#666',
  },
  standardStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  standardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  standardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  learningOutcomes: {},
  careerPathways: {},
  assessmentDate: {},
  footerLabel: {
    fontSize: 12,
    color: '#666',
  },
  assessmentsContainer: {
    padding: 16,
  },
  assessmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assessmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  assessmentsCount: {
    fontSize: 14,
    color: '#666',
  },
  assessmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  assessmentTitle: {
    fontSize: 14,
    color: '#333',
  },
  assessmentBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  proficiencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  proficiencyBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  validationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  validationBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  assessmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentDate: {
    fontSize: 12,
    color: '#666',
  },
  evidenceCount: {
    fontSize: 12,
    color: '#666',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSave: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  standardDetails: {
    marginBottom: 24,
  },
  modalStandardCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  modalStandardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalStandardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  proficiencySelection: {
    marginBottom: 24,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  proficiencyOption: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  proficiencyOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  learningOutcomesSection: {
    marginBottom: 24,
  },
  outcomeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  outcomeText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default CompetencyTracking;