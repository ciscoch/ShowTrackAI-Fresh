// =========================================================================
// FFA Degree Progress Screen - Enhanced Progress Tracking
// =========================================================================
// Comprehensive degree progress tracking screen with modern UI
// Integrates with enhanced FFADegreeService for real-time progress
// =========================================================================

import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ffaDegreeService } from '../../../core/services/FFADegreeService';
import { motivationalContentService } from '../../../core/services/MotivationalContentService';
import { 
  FFADegreeProgress, 
  FFADegreeLevel, 
  FFADegreeStatus,
  ENHANCED_FFA_DEGREE_REQUIREMENTS,
  calculateDegreeCompletionPercentage,
  getNextDegreeLevel,
  MotivationalContent
} from '../../../core/models/FFADegreeTracker';
import type { 
  DegreeProgressUpdate, 
  DegreeValidationResult 
} from '../../../core/services/FFADegreeService';

interface FFADegreeProgressScreenProps {
  onBack: () => void;
  onNavigateToSAE: () => void;
  onNavigateToCompetitions: () => void;
  onNavigateToEvidenceSubmission?: (degreeLevel: FFADegreeLevel, requirementKey: string, requirement: any) => void;
  onNavigateToParentLinking?: () => void;
}

export const FFADegreeProgressScreen: React.FC<FFADegreeProgressScreenProps> = ({
  onBack,
  onNavigateToSAE,
  onNavigateToCompetitions,
  onNavigateToEvidenceSubmission,
  onNavigateToParentLinking,
}) => {
  const { user } = useAuth();
  const [degreeProgress, setDegreeProgress] = useState<FFADegreeProgress[]>([]);
  const [motivationalContent, setMotivationalContent] = useState<MotivationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState<FFADegreeLevel | null>(null);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<{
    degreeLevel: FFADegreeLevel;
    requirementKey: string;
    requirement: any;
  } | null>(null);
  const [requirementNotes, setRequirementNotes] = useState('');
  const [requirementCompleted, setRequirementCompleted] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      loadDegreeProgress();
      loadMotivationalContent();
    }
  }, [userId]);

  const loadDegreeProgress = async () => {
    if (!userId) return;
    
    try {
      console.log('🎓 [DegreeProgress] Loading degree progress for user:', userId);
      const progress = await ffaDegreeService.getDegreeProgress(userId);
      console.log('🎓 [DegreeProgress] Loaded progress:', progress.length, 'records');
      setDegreeProgress(progress);
    } catch (error) {
      console.error('❌ [DegreeProgress] Error loading degree progress:', error);
      // Set empty array instead of showing error to prevent freeze
      setDegreeProgress([]);
      Alert.alert('Setup Required', 'FFA database tables need to be set up. Please run the SQL scripts in your Supabase dashboard.');
    }
  };

  const loadMotivationalContent = async () => {
    if (!userId) return;
    
    try {
      const feed = await motivationalContentService.getPersonalizedFeed(userId);
      setMotivationalContent(feed.daily_tip);
    } catch (error) {
      console.error('Error loading motivational content:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadDegreeProgress(),
      loadMotivationalContent(),
    ]);
    setRefreshing(false);
  }, [userId]);

  const handleInitialLoad = useCallback(async () => {
    console.log('🎓 [DegreeProgress] Starting initial load...');
    setLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⏰ [DegreeProgress] Loading timeout - forcing completion');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      await handleRefresh();
    } catch (error) {
      console.error('❌ [DegreeProgress] Error during initial load:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log('🎓 [DegreeProgress] Initial load completed');
    }
  }, [handleRefresh]);

  useEffect(() => {
    handleInitialLoad();
  }, [handleInitialLoad]);

  const handleRequirementPress = (
    degreeLevel: FFADegreeLevel,
    requirementKey: string,
    requirement: any,
    currentStatus: boolean
  ) => {
    setSelectedRequirement({ degreeLevel, requirementKey, requirement });
    setRequirementCompleted(currentStatus);
    setRequirementNotes('');
    setShowRequirementModal(true);
  };

  const handleUpdateRequirement = async () => {
    if (!selectedRequirement || !userId) return;

    try {
      const update: DegreeProgressUpdate = {
        degree_level: selectedRequirement.degreeLevel,
        requirement_key: selectedRequirement.requirementKey,
        completed: requirementCompleted,
        notes: requirementNotes || undefined,
      };

      await ffaDegreeService.updateDegreeRequirement(userId, update);
      await loadDegreeProgress();
      setShowRequirementModal(false);
      setSelectedRequirement(null);
      
      Alert.alert(
        'Success',
        `Requirement ${requirementCompleted ? 'completed' : 'marked as incomplete'} successfully!`
      );
    } catch (error) {
      console.error('Error updating requirement:', error);
      Alert.alert('Error', 'Failed to update requirement');
    }
  };

  const handleApplyForDegree = async (degreeLevel: FFADegreeLevel) => {
    if (!userId) return;

    try {
      const validation = await ffaDegreeService.validateDegreeRequirements(userId, degreeLevel);
      
      if (!validation.canApply) {
        Alert.alert(
          'Requirements Not Met',
          `You need to complete the following requirements:\n\n${validation.missingRequirements.join('\n')}`
        );
        return;
      }

      Alert.alert(
        'Apply for Degree',
        `Are you ready to apply for the ${degreeLevel.charAt(0).toUpperCase() + degreeLevel.slice(1)} Degree?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply',
            onPress: async () => {
              try {
                await ffaDegreeService.awardDegree({
                  student_id: userId,
                  degree_level: degreeLevel,
                  advisor_notes: 'Application submitted through mobile app',
                });
                
                await loadDegreeProgress();
                Alert.alert('Success', 'Degree application submitted successfully!');
              } catch (error) {
                console.error('Error applying for degree:', error);
                Alert.alert('Error', 'Failed to submit degree application');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error validating degree:', error);
      Alert.alert('Error', 'Failed to validate degree requirements');
    }
  };

  const renderMotivationalContent = () => {
    if (!motivationalContent) return null;

    return (
      <View style={styles.motivationalCard}>
        <Text style={styles.motivationalTitle}>💡 Daily Tip</Text>
        <Text style={styles.motivationalContent}>{motivationalContent.content}</Text>
        <Text style={styles.motivationalCategory}>
          {motivationalContent.content_category.replace('_', ' ').toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderDegreeCard = (progress: FFADegreeProgress) => {
    try {
      console.log('🎓 [DegreeProgress] Rendering degree card for:', progress.degree_level);
      
      const requirements = ENHANCED_FFA_DEGREE_REQUIREMENTS[progress.degree_level];
      if (!requirements) {
        console.warn('⚠️ [DegreeProgress] No requirements found for level:', progress.degree_level);
        return null;
      }
      
      const requirementKeys = Object.keys(requirements.requirements || {});
      const completedCount = Object.values(progress.requirements_met || {}).filter(Boolean).length;
      const nextLevel = getNextDegreeLevel(progress.degree_level);
      
      console.log('🎓 [DegreeProgress] Degree card data:', {
        level: progress.degree_level,
        requirementCount: requirementKeys.length,
        completedCount,
        status: progress.status
      });

    return (
      <View key={progress.degree_level} style={styles.degreeCard}>
        <View style={styles.degreeHeader}>
          <View style={styles.degreeInfo}>
            <Text style={styles.degreeTitle}>
              {progress.degree_level.charAt(0).toUpperCase() + progress.degree_level.slice(1)} Degree
            </Text>
            <Text style={styles.degreeDescription}>
              {requirements.description}
            </Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>
              {Math.round(progress.completion_percentage)}%
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progress.completion_percentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressLabel}>
            {completedCount} of {requirementKeys.length} requirements completed
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(progress.status) }
          ]}>
            <Text style={styles.statusText}>
              {progress.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          
          {progress.status === 'completed' && !progress.advisor_approved && (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => handleApplyForDegree(progress.degree_level)}
            >
              <Text style={styles.applyButtonText}>🎓 Apply for Degree</Text>
            </TouchableOpacity>
          )}
        </View>

        {progress.status === 'in_progress' && requirementKeys.length > 0 && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>📋 Requirements</Text>
            {requirementKeys.slice(0, 6).map((key, index) => { // Limit to first 6 to prevent performance issues
              const requirement = requirements.requirements[key];
              if (!requirement) return null;
              
              const isCompleted = progress.requirements_met[key] || false;
              
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.requirementItem,
                    { backgroundColor: isCompleted ? '#d4edda' : '#fff3cd' }
                  ]}
                  onPress={() => handleRequirementPress(progress.degree_level, key, requirement, isCompleted)}
                >
                  <View style={styles.requirementContent}>
                    <Text style={styles.requirementIcon}>
                      {isCompleted ? '✅' : '⏳'}
                    </Text>
                    <View style={styles.requirementDetails}>
                      <Text style={styles.requirementTitle}>{requirement.title || 'Requirement'}</Text>
                      <Text style={styles.requirementDescription}>
                        {requirement.description || 'No description available'}
                      </Text>
                      {requirement.min_hours && (
                        <Text style={styles.requirementHours}>
                          {requirement.min_hours} hours required
                        </Text>
                      )}
                    </View>
                    {!isCompleted && onNavigateToEvidenceSubmission && (
                      <TouchableOpacity
                        style={styles.evidenceButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          onNavigateToEvidenceSubmission(progress.degree_level, key, requirement);
                        }}
                      >
                        <Text style={styles.evidenceButtonText}>📤</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {requirementKeys.length > 6 && (
              <Text style={styles.moreRequirementsText}>
                +{requirementKeys.length - 6} more requirements
              </Text>
            )}
          </View>
        )}

        {progress.awarded_date && (
          <View style={styles.awardedContainer}>
            <Text style={styles.awardedText}>
              🏆 Awarded on {new Date(progress.awarded_date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
    } catch (error) {
      console.error('❌ [DegreeProgress] Error rendering degree card:', error);
      return (
        <View key={progress.degree_level} style={styles.degreeCard}>
          <Text style={styles.errorText}>
            Error loading {progress.degree_level} degree details
          </Text>
        </View>
      );
    }
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsCard}>
      <Text style={styles.quickActionsTitle}>⚡ Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onNavigateToSAE}
        >
          <Text style={styles.quickActionIcon}>🚜</Text>
          <Text style={styles.quickActionText}>SAE Projects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={onNavigateToCompetitions}
        >
          <Text style={styles.quickActionIcon}>🏆</Text>
          <Text style={styles.quickActionText}>Competitions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => Alert.alert('Coming Soon', 'Leadership activities tracking coming soon!')}
        >
          <Text style={styles.quickActionIcon}>👥</Text>
          <Text style={styles.quickActionText}>Leadership</Text>
        </TouchableOpacity>
        
        {onNavigateToParentLinking && (
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onNavigateToParentLinking}
          >
            <Text style={styles.quickActionIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.quickActionText}>Share Progress</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderRequirementModal = () => (
    <Modal
      visible={showRequirementModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRequirementModal(false)}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRequirementModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
          <Text style={styles.modalTitle}>
            {selectedRequirement?.requirement.title}
          </Text>
          
          <Text style={styles.modalDescription}>
            {selectedRequirement?.requirement.description}
          </Text>

          <View style={styles.modalSwitchContainer}>
            <Text style={styles.modalSwitchLabel}>Mark as completed:</Text>
            <Switch
              value={requirementCompleted}
              onValueChange={setRequirementCompleted}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={requirementCompleted ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <TextInput
            style={styles.modalTextInput}
            placeholder="Add notes (optional)"
            value={requirementNotes}
            onChangeText={setRequirementNotes}
            multiline={true}
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowRequirementModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={handleUpdateRequirement}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  const getStatusColor = (status: FFADegreeStatus): string => {
    switch (status) {
      case 'not_started': return '#6c757d';
      case 'in_progress': return '#007bff';
      case 'completed': return '#28a745';
      case 'awarded': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading your FFA degree progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FFA Degree Progress</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderMotivationalContent()}
        
        {degreeProgress.length > 0 ? (
          degreeProgress.map(renderDegreeCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Getting Started with FFA</Text>
            <Text style={styles.emptySubtitle}>
              Your FFA degree progress will appear here once the database is set up. Please follow the setup guide to create the necessary tables.
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {renderQuickActions()}
      </ScrollView>

      {renderRequirementModal()}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20, // Safe area padding for status bar
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  motivationalCard: {
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
  motivationalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  motivationalContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  motivationalCategory: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '600',
  },
  degreeCard: {
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
  degreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  degreeInfo: {
    flex: 1,
  },
  degreeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  degreeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsContainer: {
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  requirementItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  requirementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requirementIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  requirementDetails: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requirementDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  requirementHours: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  evidenceButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  evidenceButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  awardedContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  awardedText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  quickActionsCard: {
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
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    marginVertical: 'auto',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSwitchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  modalCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  moreRequirementsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});