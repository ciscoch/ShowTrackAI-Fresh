import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useTimeTrackingStore } from '../../core/stores/TimeTrackingStore';
import { useJournalStore } from '../../core/stores/JournalStore';
import { TimeCategory } from '../../core/models/TimeTracking';
import { aetSkillMatcher } from '../../core/services/AETSkillMatcher';
import { FormPicker } from './FormPicker';

interface TimeTrackerProps {
  animalId?: string;
  onActivityComplete?: (entry: any) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  animalId,
  onActivityComplete,
}) => {
  const { activeEntry, startTracking, stopTracking } = useTimeTrackingStore();
  const { addEntry: addJournalEntry } = useJournalStore();
  
  const [isSetupModalVisible, setIsSetupModalVisible] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activityData, setActivityData] = useState({
    activity: '',
    description: '',
    category: '' as TimeCategory,
    notes: '',
  });

  const categories: Array<{ label: string; value: TimeCategory }> = [
    { label: 'Feeding', value: 'Feeding' },
    { label: 'Health Care', value: 'Health Care' },
    { label: 'Exercise', value: 'Exercise' },
    { label: 'Training', value: 'Training' },
    { label: 'Grooming', value: 'Grooming' },
    { label: 'Record Keeping', value: 'Record Keeping' },
    { label: 'Equipment Maintenance', value: 'Equipment Maintenance' },
    { label: 'Show Preparation', value: 'Show Preparation' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Other', value: 'Other' },
  ];

  // Update elapsed time for active tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeEntry) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - activeEntry.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeEntry]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTracking = () => {
    if (activeEntry) {
      Alert.alert(
        'Active Session',
        'You already have an active tracking session. Stop the current session to start a new one.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSetupModalVisible(true);
  };

  const handleConfirmStart = async () => {
    if (!activityData.activity.trim() || !activityData.category) {
      Alert.alert('Required Fields', 'Please fill in activity name and category');
      return;
    }

    try {
      await startTracking({
        animalId,
        activity: activityData.activity,
        description: activityData.description,
        category: activityData.category,
        aetSkills: [], // Will be populated when stopped
        isActive: true,
        notes: activityData.notes,
      });

      setIsSetupModalVisible(false);
      setElapsedTime(0);
      
      // Reset form
      setActivityData({
        activity: '',
        description: '',
        category: '' as TimeCategory,
        notes: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start time tracking');
    }
  };

  const handleStopTracking = async () => {
    if (!activeEntry) return;

    try {
      // Calculate final duration
      const finalDuration = Math.floor((Date.now() - activeEntry.startTime.getTime()) / 60000);
      
      // Analyze activity for AET skills
      const skillAnalysis = aetSkillMatcher.analyzeActivity(
        activeEntry.activity,
        activeEntry.description || '',
        activeEntry.category,
        finalDuration
      );

      // Stop time tracking
      await stopTracking(activeEntry.id);

      // Create journal entry
      const journalEntry = {
        title: activeEntry.activity,
        description: activeEntry.description || '',
        date: new Date(),
        duration: finalDuration,
        category: activeEntry.category as any, // Type conversion needed
        animalId: activeEntry.animalId,
        aetSkills: skillAnalysis.matchedSkills.map(skill => skill.skill.id),
        notes: activeEntry.notes,
      };

      await addJournalEntry(journalEntry);

      // Show completion summary
      Alert.alert(
        '✅ Activity Completed!',
        `Duration: ${Math.floor(finalDuration / 60)}h ${finalDuration % 60}m\n` +
        `Skills Developed: ${skillAnalysis.matchedSkills.length}\n` +
        `Career Clusters: ${skillAnalysis.careerClusters.join(', ')}`,
        [
          { 
            text: 'View Details', 
            onPress: () => onActivityComplete?.(journalEntry)
          },
          { text: 'OK', style: 'default' }
        ]
      );

      setElapsedTime(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop time tracking');
    }
  };

  const renderSetupModal = () => (
    <Modal
      visible={isSetupModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsSetupModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>⏱️ Start Time Tracking</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsSetupModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity Name *</Text>
            <TextInput
              style={styles.textInput}
              value={activityData.activity}
              onChangeText={(text) => setActivityData(prev => ({ ...prev, activity: text }))}
              placeholder="e.g., Morning feeding, Vaccine administration"
            />
          </View>

          <FormPicker
            label="Category"
            value={activityData.category}
            onValueChange={(value) => setActivityData(prev => ({ ...prev, category: value as TimeCategory }))}
            options={categories}
            placeholder="Select activity category"
            required
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={activityData.description}
              onChangeText={(text) => setActivityData(prev => ({ ...prev, description: text }))}
              placeholder="Describe what you'll be doing..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={styles.textInput}
              value={activityData.notes}
              onChangeText={(text) => setActivityData(prev => ({ ...prev, notes: text }))}
              placeholder="Any additional notes"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsSetupModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleConfirmStart}
            >
              <Text style={styles.modalButtonText}>⏱️ Start Tracking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (activeEntry) {
    return (
      <View style={styles.activeTracker}>
        <View style={styles.activeHeader}>
          <Text style={styles.activeTitle}>⏱️ {activeEntry.activity}</Text>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopTracking}
          >
            <Text style={styles.stopButtonText}>⏹️ Stop</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.activeCategory}>{activeEntry.category}</Text>
        
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.timerLabel}>Elapsed Time</Text>
        </View>
        
        {activeEntry.description && (
          <Text style={styles.activeDescription}>{activeEntry.description}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartTracking}
      >
        <Text style={styles.startButtonIcon}>⏱️</Text>
        <Text style={styles.startButtonText}>Start Time Tracking</Text>
        <Text style={styles.startButtonSubtext}>Track activities and develop AET skills</Text>
      </TouchableOpacity>
      
      {renderSetupModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  startButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  startButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  startButtonSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeTracker: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    flex: 1,
  },
  stopButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#856404',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeDescription: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginTop: 8,
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
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#007AFF',
  },
});