// =========================================================================
// Parent Dashboard - FFA Degree Progress Oversight
// =========================================================================
// Parent portal for viewing student's FFA degree progress with evidence submissions
// Provides read-only access with communication features for family engagement
// =========================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ffaDegreeService } from '../../../core/services/FFADegreeService';
import { 
  FFADegreeProgress, 
  FFADegreeLevel,
  ENHANCED_FFA_DEGREE_REQUIREMENTS,
} from '../../../core/models/FFADegreeTracker';
import { ParentOversightService } from '../../../core/services/ParentOversightService';

interface ParentDashboardProps {
  onBack: () => void;
  studentId: string;
}

interface EvidenceSubmission {
  id: string;
  requirement_key: string;
  evidence_type: 'text' | 'photo' | 'video';
  evidence_data: string;
  submission_date: Date;
  student_notes?: string;
  parent_feedback?: string;
  parent_viewed: boolean;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onBack,
  studentId,
}) => {
  const { user } = useAuth();
  const [degreeProgress, setDegreeProgress] = useState<FFADegreeProgress[]>([]);
  const [evidenceSubmissions, setEvidenceSubmissions] = useState<EvidenceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceSubmission | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [parentFeedback, setParentFeedback] = useState('');
  const [studentProfile, setStudentProfile] = useState<any>(null);

  const parentOversightService = new ParentOversightService();

  useEffect(() => {
    if (studentId) {
      loadDashboardData();
    }
  }, [studentId]);

  const loadDashboardData = async () => {
    try {
      const [progress, submissions, profile] = await Promise.all([
        ffaDegreeService.getDegreeProgress(studentId),
        parentOversightService.getStudentEvidenceSubmissions(studentId),
        parentOversightService.getStudentProfile(studentId),
      ]);

      setDegreeProgress(progress);
      setEvidenceSubmissions(submissions);
      setStudentProfile(profile);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load student progress data');
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [studentId]);

  const handleInitialLoad = useCallback(async () => {
    setLoading(true);
    try {
      await handleRefresh();
    } catch (error) {
      console.error('Error during initial load:', error);
    } finally {
      setLoading(false);
    }
  }, [handleRefresh]);

  useEffect(() => {
    handleInitialLoad();
  }, [handleInitialLoad]);

  const handleEvidencePress = (evidence: EvidenceSubmission) => {
    setSelectedEvidence(evidence);
    setParentFeedback(evidence.parent_feedback || '');
    setShowEvidenceModal(true);
    
    // Mark as viewed
    if (!evidence.parent_viewed) {
      parentOversightService.markEvidenceAsViewed(evidence.id);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedEvidence) return;

    try {
      await parentOversightService.submitParentFeedback(
        selectedEvidence.id,
        parentFeedback
      );
      
      setShowEvidenceModal(false);
      setSelectedEvidence(null);
      setParentFeedback('');
      
      // Refresh evidence submissions
      const submissions = await parentOversightService.getStudentEvidenceSubmissions(studentId);
      setEvidenceSubmissions(submissions);
      
      Alert.alert('Success', 'Your feedback has been sent to your student!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  const renderStudentHeader = () => (
    <View style={styles.studentHeader}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {studentProfile?.first_name} {studentProfile?.last_name}
        </Text>
        <Text style={styles.studentDetails}>
          {studentProfile?.chapter_name} • {studentProfile?.school_name}
        </Text>
      </View>
      <View style={styles.overallProgress}>
        <Text style={styles.progressText}>
          Overall Progress
        </Text>
        <Text style={styles.progressPercentage}>
          {Math.round(degreeProgress.reduce((sum, p) => sum + p.completion_percentage, 0) / degreeProgress.length || 0)}%
        </Text>
      </View>
    </View>
  );

  const renderDegreeCard = (progress: FFADegreeProgress) => {
    const requirements = ENHANCED_FFA_DEGREE_REQUIREMENTS[progress.degree_level];
    if (!requirements) return null;

    const requirementKeys = Object.keys(requirements.requirements || {});
    const completedCount = Object.values(progress.requirements_met || {}).filter(Boolean).length;

    return (
      <View key={progress.degree_level} style={styles.degreeCard}>
        <View style={styles.degreeHeader}>
          <Text style={styles.degreeTitle}>
            {progress.degree_level.charAt(0).toUpperCase() + progress.degree_level.slice(1)} Degree
          </Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>
              {Math.round(progress.completion_percentage)}%
            </Text>
          </View>
        </View>

        <Text style={styles.degreeDescription}>
          {requirements.description}
        </Text>

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

        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(progress.status) }
          ]}>
            <Text style={styles.statusText}>
              {progress.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEvidenceSubmissions = () => {
    const recentSubmissions = evidenceSubmissions
      .sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
      .slice(0, 5);

    if (recentSubmissions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Evidence Submissions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your student hasn't submitted any evidence for verification yet.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.evidenceContainer}>
        <Text style={styles.sectionTitle}>📋 Recent Evidence Submissions</Text>
        {recentSubmissions.map((submission) => (
          <TouchableOpacity
            key={submission.id}
            style={[
              styles.evidenceItem,
              !submission.parent_viewed && styles.evidenceItemUnread
            ]}
            onPress={() => handleEvidencePress(submission)}
          >
            <View style={styles.evidenceIcon}>
              <Text style={styles.evidenceIconText}>
                {submission.evidence_type === 'photo' ? '📸' : 
                 submission.evidence_type === 'video' ? '🎥' : '📝'}
              </Text>
            </View>
            <View style={styles.evidenceContent}>
              <Text style={styles.evidenceTitle}>
                {getRequirementTitle(submission.requirement_key)}
              </Text>
              <Text style={styles.evidenceDate}>
                {new Date(submission.submission_date).toLocaleDateString()}
              </Text>
              {submission.student_notes && (
                <Text style={styles.evidenceNotes} numberOfLines={2}>
                  {submission.student_notes}
                </Text>
              )}
            </View>
            {!submission.parent_viewed && (
              <View style={styles.unreadIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEvidenceModal = () => (
    <Modal
      visible={showEvidenceModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowEvidenceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {selectedEvidence && getRequirementTitle(selectedEvidence.requirement_key)}
          </Text>
          
          {selectedEvidence && (
            <>
              <Text style={styles.modalSubtitle}>
                Submitted on {new Date(selectedEvidence.submission_date).toLocaleDateString()}
              </Text>

              {selectedEvidence.evidence_type === 'photo' && (
                <Image 
                  source={{ uri: selectedEvidence.evidence_data }}
                  style={styles.evidenceImage}
                  resizeMode="contain"
                />
              )}

              {selectedEvidence.evidence_type === 'text' && (
                <View style={styles.textEvidenceContainer}>
                  <Text style={styles.textEvidence}>
                    {selectedEvidence.evidence_data}
                  </Text>
                </View>
              )}

              {selectedEvidence.student_notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Student Notes:</Text>
                  <Text style={styles.notesText}>
                    {selectedEvidence.student_notes}
                  </Text>
                </View>
              )}

              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Your Feedback:</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Share your thoughts, encouragement, or questions..."
                  value={parentFeedback}
                  onChangeText={setParentFeedback}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEvidenceModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmitFeedback}
                >
                  <Text style={styles.submitButtonText}>Send Feedback</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'not_started': return '#6c757d';
      case 'in_progress': return '#007bff';
      case 'completed': return '#28a745';
      case 'awarded': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getRequirementTitle = (requirementKey: string): string => {
    // Look through all degree levels to find the requirement
    for (const level of Object.keys(ENHANCED_FFA_DEGREE_REQUIREMENTS)) {
      const requirements = ENHANCED_FFA_DEGREE_REQUIREMENTS[level as FFADegreeLevel].requirements;
      if (requirements[requirementKey]) {
        return requirements[requirementKey].title;
      }
    }
    return 'FFA Requirement';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading student progress...</Text>
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
        <Text style={styles.headerTitle}>Parent Dashboard</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStudentHeader()}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎓 FFA Degree Progress</Text>
          {degreeProgress.length > 0 ? (
            degreeProgress.map(renderDegreeCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Progress Data</Text>
              <Text style={styles.emptySubtitle}>
                Your student's FFA degree progress will appear here once they start tracking.
              </Text>
            </View>
          )}
        </View>

        {renderEvidenceSubmissions()}
      </ScrollView>

      {renderEvidenceModal()}
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
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
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
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
  },
  overallProgress: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  degreeCard: {
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
  degreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  degreeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  degreeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  statusContainer: {
    alignItems: 'flex-start',
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
  evidenceContainer: {
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
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  evidenceItemUnread: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  evidenceIcon: {
    marginRight: 12,
  },
  evidenceIconText: {
    fontSize: 20,
  },
  evidenceContent: {
    flex: 1,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  evidenceDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  evidenceNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  textEvidenceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  textEvidence: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedbackContainer: {
    marginBottom: 20,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
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
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});