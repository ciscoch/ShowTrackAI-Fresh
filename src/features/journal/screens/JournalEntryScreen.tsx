import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Journal } from '../../../core/models/Journal';
import { useJournalStore } from '../../../core/stores/JournalStore';
import { useTimeTrackingStore } from '../../../core/stores/TimeTrackingStore';
import { aetSkillMatcher } from '../../../core/services/AETSkillMatcher';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DatePicker } from '../../../shared/components/DatePicker';
import { TimeTracker } from '../../../shared/components/TimeTracker';

interface JournalEntryScreenProps {
  entry?: Journal;
  onSave: () => void;
  onCancel: () => void;
  onBack: () => void;
}

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({
  entry,
  onSave,
  onCancel,
  onBack,
}) => {
  const { createEntry, updateEntry } = useJournalStore();
  const { activeEntry, startTracking, stopTracking } = useTimeTrackingStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    description: entry?.description || '',
    category: entry?.category || 'General',
    date: entry?.date || new Date(),
    duration: entry?.duration || 0,
    aetSkills: entry?.aetSkills || [],
    notes: entry?.notes || '',
    weather: entry?.weather || '',
    location: entry?.location || '',
    objectives: entry?.objectives || [],
    learningOutcomes: entry?.learningOutcomes || [],
    challenges: entry?.challenges || '',
    improvements: entry?.improvements || '',
  });

  const [isTracking, setIsTracking] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(formData.objectives);

  const categories = [
    { label: 'General', value: 'General' },
    { label: 'Feeding', value: 'Feeding' },
    { label: 'Health Check', value: 'Health Check' },
    { label: 'Training', value: 'Training' },
    { label: 'Grooming', value: 'Grooming' },
    { label: 'Exercise', value: 'Exercise' },
    { label: 'Breeding', value: 'Breeding' },
    { label: 'Record Keeping', value: 'Record Keeping' },
    { label: 'Equipment Maintenance', value: 'Equipment Maintenance' },
    { label: 'Market Research', value: 'Market Research' },
    { label: 'Competition Prep', value: 'Competition Prep' },
    { label: 'Educational Activity', value: 'Educational Activity' },
  ];

  const learningObjectives = [
    'Animal Husbandry Skills',
    'Business Management',
    'Record Keeping',
    'Problem Solving',
    'Communication',
    'Leadership',
    'Financial Literacy',
    'Technology Use',
    'Safety Practices',
    'Quality Assurance',
    'Time Management',
    'Critical Thinking',
  ];

  useEffect(() => {
    // Check if we're currently tracking time for this entry
    if (activeEntry && entry?.id === activeEntry.id) {
      setIsTracking(true);
      const duration = Math.floor((Date.now() - activeEntry.startTime.getTime()) / 60000);
      setFormData(prev => ({ ...prev, duration }));
    }
  }, [activeEntry, entry?.id]);

  useEffect(() => {
    // Get suggested AET skills based on description and category
    if (formData.description.length > 10 || formData.category !== 'General') {
      const suggestions = aetSkillMatcher.suggestSkills(
        formData.description,
        formData.category
      );
      setSuggestedSkills(suggestions);
    }
  }, [formData.description, formData.category]);

  const handleStartTimeTracking = () => {
    const trackingEntry = {
      id: entry?.id || `temp_${Date.now()}`,
      activity: formData.title || 'Journal Activity',
      category: formData.category,
      startTime: new Date(),
    };
    
    startTracking(trackingEntry);
    setIsTracking(true);
  };

  const handleStopTimeTracking = () => {
    if (activeEntry) {
      const duration = Math.floor((Date.now() - activeEntry.startTime.getTime()) / 60000);
      setFormData(prev => ({ ...prev, duration: prev.duration + duration }));
      stopTracking(activeEntry.id);
      setIsTracking(false);
    }
  };

  const handleAddSkill = (skillId: string) => {
    if (!formData.aetSkills.includes(skillId)) {
      setFormData(prev => ({
        ...prev,
        aetSkills: [...prev.aetSkills, skillId]
      }));
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      aetSkills: prev.aetSkills.filter(id => id !== skillId)
    }));
  };

  const handleObjectiveToggle = (objective: string) => {
    const updatedObjectives = selectedObjectives.includes(objective)
      ? selectedObjectives.filter(o => o !== objective)
      : [...selectedObjectives, objective];
    
    setSelectedObjectives(updatedObjectives);
    setFormData(prev => ({ ...prev, objectives: updatedObjectives }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your journal entry.');
      return false;
    }
    
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description of your activity.');
      return false;
    }
    
    if (formData.duration <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid duration or use time tracking.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Stop time tracking if active
    if (isTracking && activeEntry) {
      handleStopTimeTracking();
    }

    setLoading(true);
    try {
      const journalData: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        userId: 'current-user', // Would get from auth context
      };

      if (entry) {
        await updateEntry(entry.id, journalData);
      } else {
        await createEntry(journalData);
      }

      Alert.alert(
        'Success',
        `Journal entry ${entry ? 'updated' : 'created'} successfully!`,
        [{ text: 'OK', onPress: onSave }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTimeTracker = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⏱️ Time Tracking</Text>
      
      <View style={styles.timeTrackerContainer}>
        <TimeTracker
          isActive={isTracking}
          currentDuration={formData.duration}
          onStart={handleStartTimeTracking}
          onStop={handleStopTimeTracking}
          activity={formData.title || 'Current Activity'}
        />
      </View>

      <View style={styles.durationInput}>
        <Text style={styles.inputLabel}>Manual Duration (minutes)</Text>
        <TextInput
          style={styles.smallInput}
          value={formData.duration.toString()}
          onChangeText={(text) => setFormData(prev => ({ 
            ...prev, 
            duration: parseInt(text) || 0 
          }))}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>
    </View>
  );

  const renderAETSkills = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎓 AET Skills Development</Text>
      
      {suggestedSkills.length > 0 && (
        <View style={styles.suggestedSkills}>
          <Text style={styles.subsectionTitle}>Suggested Skills:</Text>
          <View style={styles.skillsGrid}>
            {suggestedSkills.map((skillId, index) => (
              <TouchableOpacity
                key={skillId}
                style={[
                  styles.skillChip,
                  formData.aetSkills.includes(skillId) && styles.skillChipSelected
                ]}
                onPress={() => handleAddSkill(skillId)}
              >
                <Text style={[
                  styles.skillChipText,
                  formData.aetSkills.includes(skillId) && styles.skillChipTextSelected
                ]}>
                  Skill {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {formData.aetSkills.length > 0 && (
        <View style={styles.selectedSkills}>
          <Text style={styles.subsectionTitle}>Selected Skills ({formData.aetSkills.length}):</Text>
          <View style={styles.skillsGrid}>
            {formData.aetSkills.map((skillId, index) => (
              <TouchableOpacity
                key={skillId}
                style={styles.selectedSkillChip}
                onPress={() => handleRemoveSkill(skillId)}
              >
                <Text style={styles.selectedSkillChipText}>
                  Skill {index + 1} ✕
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderLearningObjectives = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Learning Objectives</Text>
      <Text style={styles.sectionSubtitle}>Select objectives you worked on during this activity</Text>
      
      <View style={styles.objectivesGrid}>
        {learningObjectives.map((objective) => (
          <TouchableOpacity
            key={objective}
            style={[
              styles.objectiveChip,
              selectedObjectives.includes(objective) && styles.objectiveChipSelected
            ]}
            onPress={() => handleObjectiveToggle(objective)}
          >
            <Text style={[
              styles.objectiveChipText,
              selectedObjectives.includes(objective) && styles.objectiveChipTextSelected
            ]}>
              {objective}
            </Text>
            {selectedObjectives.includes(objective) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderReflectionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💭 Reflection</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Challenges Faced</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.challenges}
          onChangeText={(text) => setFormData(prev => ({ ...prev, challenges: text }))}
          placeholder="What challenges did you encounter?"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Areas for Improvement</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.improvements}
          onChangeText={(text) => setFormData(prev => ({ ...prev, improvements: text }))}
          placeholder="What could you do better next time?"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {entry ? 'Edit Entry' : 'New Journal Entry'}
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="What activity did you do?"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe what you did in detail..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <FormPicker
                label="Category"
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                options={categories}
                placeholder="Select category"
              />
            </View>
            
            <View style={styles.halfWidth}>
              <DatePicker
                label="Date"
                value={formData.date}
                onDateChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                placeholder="Select date"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weather</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.weather}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, weather: text }))}
                  placeholder="e.g., Sunny, 75°F"
                />
              </View>
            </View>
            
            <View style={styles.halfWidth}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                  placeholder="Where did this take place?"
                />
              </View>
            </View>
          </View>
        </View>

        {renderTimeTracker()}
        {renderLearningObjectives()}
        {renderAETSkills()}
        {renderReflectionSection()}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Additional Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Any additional observations or notes..."
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : entry ? 'Update Entry' : 'Save Entry'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    width: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  timeTrackerContainer: {
    marginBottom: 16,
  },
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestedSkills: {
    marginBottom: 16,
  },
  selectedSkills: {
    marginBottom: 8,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skillChipSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  skillChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  skillChipTextSelected: {
    color: '#007AFF',
  },
  selectedSkillChip: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  selectedSkillChipText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  objectivesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  objectiveChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  objectiveChipSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  objectiveChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  objectiveChipTextSelected: {
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});