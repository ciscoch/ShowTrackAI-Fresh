import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { FollowUpTask, FollowUpUpdate, HealthMeasurements } from '../../../core/models/FollowUpTask';
import { followUpTaskService } from '../../../core/services/FollowUpTaskService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { storageService, STORAGE_KEYS } from '../../../core/services/StorageService';
import { Animal } from '../../../core/models/Animal';
import * as ImagePicker from 'expo-image-picker';

interface FollowUpTaskModalProps {
  visible: boolean;
  task: FollowUpTask;
  onClose: () => void;
  onUpdate: () => void;
}

export const FollowUpTaskModal: React.FC<FollowUpTaskModalProps> = ({
  visible,
  task,
  onClose,
  onUpdate,
}) => {
  const { currentProfile } = useProfileStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'update' | 'history' | 'complete'>('overview');
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [updates, setUpdates] = useState<FollowUpUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  // Update form state
  const [observations, setObservations] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [questionsForExpert, setQuestionsForExpert] = useState('');
  const [concernLevel, setConcernLevel] = useState(3);
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [conditionAssessment, setConditionAssessment] = useState<'improved' | 'same' | 'worse' | 'resolved'>('same');
  const [measurements, setMeasurements] = useState<HealthMeasurements>({});
  const [photos, setPhotos] = useState<string[]>([]);

  // Completion form state
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [outcomeStatus, setOutcomeStatus] = useState<'resolved' | 'improved' | 'referred' | 'ongoing'>('resolved');
  const [learningReflection, setLearningReflection] = useState('');

  useEffect(() => {
    if (visible && task) {
      loadTaskData();
    }
  }, [visible, task]);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      
      // Load animal data
      const animals = await storageService.loadData<Animal[]>(STORAGE_KEYS.ANIMALS) || [];
      const taskAnimal = animals.find(a => a.id === task.animalId);
      setAnimal(taskAnimal || null);

      // Load task updates
      const taskUpdates = await followUpTaskService.getUpdatesForTask(task.id);
      setUpdates(taskUpdates);
    } catch (error) {
      console.error('Failed to load task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleSubmitUpdate = async () => {
    if (!currentProfile || !observations.trim()) {
      Alert.alert('Error', 'Please provide observations before submitting');
      return;
    }

    try {
      setLoading(true);

      const updateData: Omit<FollowUpUpdate, 'id' | 'createdAt'> = {
        followUpTaskId: task.id,
        studentId: currentProfile.id,
        updateDate: new Date(),
        observations: observations.trim(),
        measurements,
        photos: photos.map((uri, index) => ({
          id: `photo_${Date.now()}_${index}`,
          uri,
          caption: `Update photo ${index + 1}`,
          photoType: 'progress' as const,
          metadata: {
            timestamp: new Date(),
          }
        })),
        conditionAssessment,
        concernLevel,
        actionTaken: actionTaken.trim(),
        studentNotes: studentNotes.trim(),
        questionsForExpert: questionsForExpert.trim(),
        confidenceLevel,
        updateCompletenessScore: calculateCompletenessScore(),
        photoQualityScore: photos.length > 0 ? 0.8 : 0,
        documentationQuality: getDocumentationQuality(),
        competencyDemonstrated: false,
        reviewStatus: 'pending'
      };

      await followUpTaskService.addTaskUpdate(updateData);
      
      Alert.alert('Success', 'Update submitted successfully!');
      onUpdate();
      resetUpdateForm();
      setActiveTab('overview');
    } catch (error) {
      console.error('Failed to submit update:', error);
      Alert.alert('Error', 'Failed to submit update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!resolutionNotes.trim() || !learningReflection.trim()) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      
      await followUpTaskService.completeTask(
        task.id,
        resolutionNotes.trim(),
        outcomeStatus,
        learningReflection.trim()
      );

      Alert.alert('Success', 'Task completed successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to complete task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletenessScore = (): number => {
    let score = 0;
    if (observations.trim()) score += 0.3;
    if (actionTaken.trim()) score += 0.2;
    if (Object.keys(measurements).length > 0) score += 0.2;
    if (photos.length > 0) score += 0.2;
    if (studentNotes.trim()) score += 0.1;
    return Math.min(score, 1.0);
  };

  const getDocumentationQuality = (): 'poor' | 'fair' | 'good' | 'excellent' => {
    const score = calculateCompletenessScore();
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'fair';
    return 'poor';
  };

  const resetUpdateForm = () => {
    setObservations('');
    setActionTaken('');
    setStudentNotes('');
    setQuestionsForExpert('');
    setConcernLevel(3);
    setConfidenceLevel(3);
    setConditionAssessment('same');
    setMeasurements({});
    setPhotos([]);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString() + ' at ' + 
           new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysFromStart = (): number => {
    const start = new Date(task.createdDate);
    const now = new Date();
    return Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysRemaining = (): number => {
    const due = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'overview', name: 'Overview', icon: '📋' },
        { id: 'update', name: 'Add Update', icon: '📝' },
        { id: 'history', name: 'History', icon: '📊' },
        { id: 'complete', name: 'Complete', icon: '✅' }
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
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Task Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Progress Tracker</Text>
        <View style={styles.progressTracker}>
          {Array.from({ length: task.durationDays }, (_, index) => {
            const day = index + 1;
            const currentDay = getDaysFromStart();
            let status = '⭕'; // Future
            if (day < currentDay) status = '✅'; // Past
            if (day === currentDay) status = '⏳'; // Today
            
            return (
              <View key={day} style={styles.progressDay}>
                <Text style={styles.progressDayIcon}>{status}</Text>
                <Text style={styles.progressDayText}>Day {day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Animal Information */}
      {animal && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🐄 Animal Information</Text>
          <View style={styles.animalInfo}>
            <Text style={styles.animalName}>{animal.name} (#{animal.tagNumber})</Text>
            <Text style={styles.animalDetails}>
              {animal.species} • {animal.breed} • {animal.age} months old
            </Text>
            <Text style={styles.animalStatus}>
              Health Status: {animal.healthStatus}
            </Text>
          </View>
        </View>
      )}

      {/* Task Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Task Details</Text>
        <View style={styles.taskDetails}>
          <Text style={styles.taskProperty}>
            <Text style={styles.propertyLabel}>Priority:</Text> {task.priorityLevel.toUpperCase()}
          </Text>
          <Text style={styles.taskProperty}>
            <Text style={styles.propertyLabel}>Frequency:</Text> {task.frequency.replace('_', ' ')}
          </Text>
          <Text style={styles.taskProperty}>
            <Text style={styles.propertyLabel}>Duration:</Text> {task.durationDays} days
          </Text>
          <Text style={styles.taskProperty}>
            <Text style={styles.propertyLabel}>Days Remaining:</Text> {getDaysRemaining()}
          </Text>
        </View>
        <Text style={styles.taskDescription}>{task.taskDescription}</Text>
        {task.detailedInstructions && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Detailed Instructions:</Text>
            <Text style={styles.instructionsText}>{task.detailedInstructions}</Text>
          </View>
        )}
      </View>

      {/* Today's Required Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Today's Required Actions</Text>
        <View style={styles.actionsList}>
          {task.frequency === 'twice_daily' ? (
            <>
              <Text style={styles.actionItem}>☐ Morning observation and measurements</Text>
              <Text style={styles.actionItem}>☐ Evening observation and measurements</Text>
            </>
          ) : (
            <Text style={styles.actionItem}>☐ Daily observation and measurements</Text>
          )}
          <Text style={styles.actionItem}>☐ Take progress photos if needed</Text>
          <Text style={styles.actionItem}>☐ Record any changes or concerns</Text>
          <Text style={styles.actionItem}>☐ Update monitoring log</Text>
        </View>
      </View>

      {/* Learning Objectives */}
      {task.learningObjectives.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎓 Learning Objectives</Text>
          {task.learningObjectives.map((objective, index) => (
            <Text key={index} style={styles.learningObjective}>
              • {objective}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderUpdateTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Entry Forms */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📝 Quick Update Entry</Text>
        
        {/* Condition Assessment */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Condition Assessment</Text>
          <View style={styles.assessmentButtons}>
            {(['improved', 'same', 'worse', 'resolved'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.assessmentButton,
                  conditionAssessment === status && styles.assessmentButtonActive
                ]}
                onPress={() => setConditionAssessment(status)}
              >
                <Text style={[
                  styles.assessmentButtonText,
                  conditionAssessment === status && styles.assessmentButtonTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Temperature Entry */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Temperature (°F)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="101.5"
            keyboardType="numeric"
            value={measurements.temperature?.value?.toString() || ''}
            onChangeText={(text) => {
              const value = parseFloat(text);
              if (!isNaN(value)) {
                setMeasurements({
                  ...measurements,
                  temperature: { value, unit: 'F', time: new Date() }
                });
              }
            }}
          />
        </View>

        {/* Concern Level */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Concern Level (1-5)</Text>
          <View style={styles.scaleButtons}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.scaleButton,
                  concernLevel === level && styles.scaleButtonActive
                ]}
                onPress={() => setConcernLevel(level)}
              >
                <Text style={[
                  styles.scaleButtonText,
                  concernLevel === level && styles.scaleButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Observations */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Observations *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe what you observed about the animal's condition, behavior, appetite, etc."
            multiline
            numberOfLines={4}
            value={observations}
            onChangeText={setObservations}
          />
        </View>

        {/* Action Taken */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Action Taken</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe any actions you took (medication given, treatment applied, etc.)"
            multiline
            numberOfLines={3}
            value={actionTaken}
            onChangeText={setActionTaken}
          />
        </View>

        {/* Photos */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Photos</Text>
          <TouchableOpacity style={styles.photoButton} onPress={handleAddPhoto}>
            <Text style={styles.photoButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>
          {photos.length > 0 && (
            <ScrollView horizontal style={styles.photoPreview}>
              {photos.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.photoThumbnail} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Student Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Personal Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Your thoughts, concerns, or questions about this case"
            multiline
            numberOfLines={3}
            value={studentNotes}
            onChangeText={setStudentNotes}
          />
        </View>

        {/* Questions for Expert */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Questions for Veterinarian/Instructor</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Any questions you'd like to ask about this case"
            multiline
            numberOfLines={2}
            value={questionsForExpert}
            onChangeText={setQuestionsForExpert}
          />
        </View>

        {/* Confidence Level */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Confidence Level (1-5)</Text>
          <View style={styles.scaleButtons}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.scaleButton,
                  confidenceLevel === level && styles.scaleButtonActive
                ]}
                onPress={() => setConfidenceLevel(level)}
              >
                <Text style={[
                  styles.scaleButtonText,
                  confidenceLevel === level && styles.scaleButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>💾 Save Update</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Update History</Text>
        {updates.length === 0 ? (
          <Text style={styles.noHistoryText}>No updates recorded yet</Text>
        ) : (
          updates.map((update, index) => (
            <View key={update.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {formatDate(update.updateDate)}
                </Text>
                <View style={[
                  styles.assessmentBadge,
                  { backgroundColor: getAssessmentColor(update.conditionAssessment) }
                ]}>
                  <Text style={styles.assessmentBadgeText}>
                    {update.conditionAssessment}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyObservations}>{update.observations}</Text>
              {update.actionTaken && (
                <Text style={styles.historyAction}>
                  Action: {update.actionTaken}
                </Text>
              )}
              {update.measurements.temperature && (
                <Text style={styles.historyMeasurement}>
                  Temperature: {update.measurements.temperature.value}°{update.measurements.temperature.unit}
                </Text>
              )}
              {update.photos.length > 0 && (
                <Text style={styles.historyPhotos}>
                  📸 {update.photos.length} photo(s) attached
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderCompleteTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>✅ Complete Task</Text>
        
        {/* Case Summary */}
        <View style={styles.caseSummary}>
          <Text style={styles.summaryTitle}>📊 Case Summary</Text>
          <Text style={styles.summaryItem}>• Duration: {getDaysFromStart()} days</Text>
          <Text style={styles.summaryItem}>• Total Updates: {updates.length}</Text>
          <Text style={styles.summaryItem}>• Progress: {task.progressPercentage}%</Text>
        </View>

        {/* Resolution Status */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Resolution Status *</Text>
          <View style={styles.resolutionButtons}>
            {(['resolved', 'improved', 'referred', 'ongoing'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.resolutionButton,
                  outcomeStatus === status && styles.resolutionButtonActive
                ]}
                onPress={() => setOutcomeStatus(status)}
              >
                <Text style={[
                  styles.resolutionButtonText,
                  outcomeStatus === status && styles.resolutionButtonTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Final Assessment */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Final Assessment *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="What was the final outcome? Describe the animal's current condition and any ongoing recommendations."
            multiline
            numberOfLines={4}
            value={resolutionNotes}
            onChangeText={setResolutionNotes}
          />
        </View>

        {/* Learning Reflection */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Learning Reflection *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="What did you learn from this experience? How will this knowledge help you in future situations?"
            multiline
            numberOfLines={4}
            value={learningReflection}
            onChangeText={setLearningReflection}
          />
        </View>

        {/* Competency Achievements */}
        {task.competencyStandards.length > 0 && (
          <View style={styles.competencySection}>
            <Text style={styles.competencyTitle}>🏆 Competency Achievements</Text>
            {task.competencyStandards.map((standard, index) => (
              <View key={index} style={styles.competencyItem}>
                <Text style={styles.competencyCheck}>✅</Text>
                <Text style={styles.competencyText}>{standard}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Complete Button */}
        <TouchableOpacity
          style={[styles.completeButton, loading && styles.completeButtonDisabled]}
          onPress={handleCompleteTask}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>📋 Complete Task</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const getAssessmentColor = (assessment: string): string => {
    switch (assessment) {
      case 'improved': return '#28a745';
      case 'resolved': return '#007bff';
      case 'worse': return '#dc3545';
      default: return '#ffc107';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{task.taskTitle}</Text>
          <View style={styles.placeholder} />
        </View>

        {renderTabBar()}

        {loading && activeTab !== 'overview' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'update' && renderUpdateTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'complete' && renderCompleteTab()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    backgroundColor: '#fff',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressTracker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  progressDay: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressDayIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  progressDayText: {
    fontSize: 12,
    color: '#666',
  },
  animalInfo: {
    marginBottom: 8,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  animalStatus: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  taskDetails: {
    marginBottom: 12,
  },
  taskProperty: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  propertyLabel: {
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsList: {
    marginLeft: 8,
  },
  actionItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  learningObjective: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  assessmentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assessmentButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  assessmentButtonActive: {
    backgroundColor: '#007AFF',
  },
  assessmentButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  assessmentButtonTextActive: {
    color: '#fff',
  },
  scaleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  scaleButtonActive: {
    backgroundColor: '#007AFF',
  },
  scaleButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  scaleButtonTextActive: {
    color: '#fff',
  },
  photoButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  photoPreview: {
    marginTop: 8,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  assessmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  assessmentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  historyObservations: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  historyAction: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  historyMeasurement: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  historyPhotos: {
    fontSize: 12,
    color: '#28a745',
  },
  caseSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  resolutionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resolutionButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  resolutionButtonActive: {
    backgroundColor: '#007AFF',
  },
  resolutionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  resolutionButtonTextActive: {
    color: '#fff',
  },
  competencySection: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  competencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  competencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  competencyCheck: {
    fontSize: 12,
    marginRight: 8,
  },
  competencyText: {
    fontSize: 12,
    color: '#1976d2',
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});