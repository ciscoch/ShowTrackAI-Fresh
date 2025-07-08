import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Animal } from '../../../core/models/Animal';
import { 
  HealthAssessment, 
  SymptomData, 
  VitalSigns, 
  EnvironmentalData, 
  AssessmentPhoto,
  SYMPTOM_CATEGORIES,
  URGENCY_LEVELS
} from '../../../core/models/VetConnect';
import { vetConnectService } from '../../../core/services/VetConnectService';
import { useProfileStore } from '../../../core/stores/ProfileStore';

interface HealthAssessmentScreenProps {
  animal: Animal;
  onBack: () => void;
  onAssessmentComplete: (assessment: HealthAssessment) => void;
}

export const HealthAssessmentScreen: React.FC<HealthAssessmentScreenProps> = ({
  animal,
  onBack,
  onAssessmentComplete,
}) => {
  const { currentProfile } = useProfileStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [vitals, setVitals] = useState<Partial<VitalSigns>>({});
  const [environmentalFactors, setEnvironmentalFactors] = useState<Partial<EnvironmentalData>>({
    recentChanges: [],
    stressFactors: []
  });
  const [photos, setPhotos] = useState<AssessmentPhoto[]>([]);
  const [assessmentType, setAssessmentType] = useState<'routine' | 'concern' | 'emergency' | 'follow_up'>('concern');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');

  const totalSteps = 5;

  const handleAddSymptom = () => {
    const newSymptom: SymptomData = {
      category: 'physical',
      symptom: '',
      severity: 1,
      duration: '',
      frequency: 'intermittent',
      notes: ''
    };
    setSymptoms([...symptoms, newSymptom]);
  };

  const updateSymptom = (index: number, updates: Partial<SymptomData>) => {
    const updatedSymptoms = symptoms.map((symptom, i) => 
      i === index ? { ...symptom, ...updates } : symptom
    );
    setSymptoms(updatedSymptoms);
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleTakePhoto = () => {
    Alert.alert(
      'Add Health Photo',
      'Choose how to add a photo:',
      [
        { text: 'Camera', onPress: () => simulatePhotoCapture('camera') },
        { text: 'Photo Library', onPress: () => simulatePhotoCapture('library') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const simulatePhotoCapture = (source: string) => {
    const newPhoto: AssessmentPhoto = {
      id: Date.now().toString(),
      uri: `demo://health_photo_${Date.now()}.jpg`,
      caption: 'Health assessment photo',
      bodyPart: 'general',
      timestamp: new Date()
    };
    setPhotos([...photos, newPhoto]);
  };

  const handleSubmitAssessment = async () => {
    if (!currentProfile) {
      Alert.alert('Error', 'No profile selected');
      return;
    }

    if (symptoms.length === 0) {
      Alert.alert('Required Information', 'Please add at least one symptom or observation');
      return;
    }

    try {
      setLoading(true);

      const assessmentData = {
        animalId: animal.id,
        studentId: currentProfile.id,
        assessmentType,
        symptoms: symptoms.filter(s => s.symptom.trim() !== ''),
        urgencyLevel,
        recommendedAction: urgencyLevel === 'emergency' ? 'emergency_care' : 'vet_consultation' as const,
        confidenceScore: 0,
        photos,
        vitals: {
          alertness: 'normal' as const,
          appetite: 'normal' as const,
          hydrationStatus: 'normal' as const,
          ...vitals
        },
        environmentalFactors: {
          housingType: 'barn',
          groupSize: 1,
          recentChanges: [],
          feedType: 'mixed',
          waterSource: 'automatic',
          weatherConditions: 'normal',
          stressFactors: [],
          ...environmentalFactors
        }
      };

      const assessment = await vetConnectService.createHealthAssessment(assessmentData);
      
      Alert.alert(
        'Assessment Complete',
        `Health assessment completed with ${assessment.aiAnalysis.confidenceLevel}% AI confidence. ${
          assessment.recommendedAction === 'vet_consultation' ? 'Veterinary consultation recommended.' :
          assessment.recommendedAction === 'emergency_care' ? 'Emergency veterinary care required!' :
          'Continue monitoring your animal.'
        }`,
        [
          { text: 'View Results', onPress: () => onAssessmentComplete(assessment) }
        ]
      );

    } catch (error) {
      console.error('Failed to create assessment:', error);
      Alert.alert('Error', 'Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i + 1 <= currentStep && styles.stepDotActive,
            i + 1 === currentStep && styles.stepDotCurrent
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Assessment Type & Urgency</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assessment Type</Text>
        <View style={styles.buttonGroup}>
          {(['routine', 'concern', 'emergency', 'follow_up'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.optionButton, assessmentType === type && styles.optionButtonActive]}
              onPress={() => setAssessmentType(type)}
            >
              <Text style={[styles.optionText, assessmentType === type && styles.optionTextActive]}>
                {type.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Urgency Level</Text>
        <View style={styles.buttonGroup}>
          {URGENCY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.urgencyButton, 
                urgencyLevel === level && styles.urgencyButtonActive,
                level === 'emergency' && styles.emergencyButton
              ]}
              onPress={() => setUrgencyLevel(level)}
            >
              <Text style={[
                styles.urgencyText, 
                urgencyLevel === level && styles.urgencyTextActive,
                level === 'emergency' && styles.emergencyText
              ]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Symptoms & Observations</Text>
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddSymptom}>
        <Text style={styles.addButtonText}>+ Add Symptom</Text>
      </TouchableOpacity>

      {symptoms.map((symptom, index) => (
        <View key={index} style={styles.symptomCard}>
          <View style={styles.symptomHeader}>
            <Text style={styles.symptomTitle}>Symptom {index + 1}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeSymptom(index)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryButtons}>
              {SYMPTOM_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    symptom.category === category && styles.categoryButtonActive
                  ]}
                  onPress={() => updateSymptom(index, { category })}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    symptom.category === category && styles.categoryButtonTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe the symptom..."
              value={symptom.symptom}
              onChangeText={(text) => updateSymptom(index, { symptom: text })}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Severity (1-5): {symptom.severity}</Text>
            <View style={styles.severitySlider}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    symptom.severity >= level && styles.severityButtonActive
                  ]}
                  onPress={() => updateSymptom(index, { severity: level as 1 | 2 | 3 | 4 | 5 })}
                >
                  <Text style={styles.severityText}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2 days, 1 week"
              value={symptom.duration}
              onChangeText={(text) => updateSymptom(index, { duration: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any additional observations..."
              value={symptom.notes}
              onChangeText={(text) => updateSymptom(index, { notes: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Vital Signs & Physical Condition</Text>
      
      <View style={styles.vitalsGrid}>
        <View style={styles.vitalInput}>
          <Text style={styles.label}>Temperature (°F)</Text>
          <TextInput
            style={styles.input}
            placeholder="101.5"
            value={vitals.temperature?.toString()}
            onChangeText={(text) => setVitals({...vitals, temperature: parseFloat(text) || undefined})}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.vitalInput}>
          <Text style={styles.label}>Heart Rate (bpm)</Text>
          <TextInput
            style={styles.input}
            placeholder="72"
            value={vitals.heartRate?.toString()}
            onChangeText={(text) => setVitals({...vitals, heartRate: parseInt(text) || undefined})}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.vitalInput}>
          <Text style={styles.label}>Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            placeholder="485"
            value={vitals.weight?.toString()}
            onChangeText={(text) => setVitals({...vitals, weight: parseFloat(text) || undefined})}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.vitalInput}>
          <Text style={styles.label}>Body Condition (1-9)</Text>
          <TextInput
            style={styles.input}
            placeholder="6"
            value={vitals.bodyConditionScore?.toString()}
            onChangeText={(text) => setVitals({...vitals, bodyConditionScore: parseInt(text) || undefined})}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Condition</Text>
        
        <View style={styles.conditionGroup}>
          <Text style={styles.label}>Alertness</Text>
          <View style={styles.buttonGroup}>
            {(['normal', 'depressed', 'hyperalert', 'unresponsive'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.conditionButton, vitals.alertness === level && styles.conditionButtonActive]}
                onPress={() => setVitals({...vitals, alertness: level})}
              >
                <Text style={[styles.conditionText, vitals.alertness === level && styles.conditionTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.conditionGroup}>
          <Text style={styles.label}>Appetite</Text>
          <View style={styles.buttonGroup}>
            {(['normal', 'increased', 'decreased', 'absent'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.conditionButton, vitals.appetite === level && styles.conditionButtonActive]}
                onPress={() => setVitals({...vitals, appetite: level})}
              >
                <Text style={[styles.conditionText, vitals.appetite === level && styles.conditionTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Photos & Documentation</Text>
      
      <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
        <Text style={styles.photoButtonIcon}>📸</Text>
        <Text style={styles.photoButtonText}>Add Health Photo</Text>
      </TouchableOpacity>

      {photos.length > 0 && (
        <View style={styles.photoList}>
          <Text style={styles.sectionTitle}>Captured Photos ({photos.length})</Text>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoItem}>
              <Text style={styles.photoIcon}>🖼️</Text>
              <View style={styles.photoInfo}>
                <Text style={styles.photoCaption}>{photo.caption}</Text>
                <Text style={styles.photoTimestamp}>
                  {photo.timestamp.toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environmental Factors</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Housing Type</Text>
          <TextInput
            style={styles.input}
            placeholder="barn stall, pasture, pen"
            value={environmentalFactors.housingType}
            onChangeText={(text) => setEnvironmentalFactors({...environmentalFactors, housingType: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recent Changes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="New feed, moved to different pen, weather changes..."
            value={environmentalFactors.recentChanges?.join(', ')}
            onChangeText={(text) => setEnvironmentalFactors({
              ...environmentalFactors, 
              recentChanges: text.split(',').map(s => s.trim()).filter(s => s)
            })}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      
      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Assessment Summary</Text>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Animal:</Text>
          <Text style={styles.reviewValue}>{animal.name} ({animal.species})</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Type:</Text>
          <Text style={styles.reviewValue}>{assessmentType.replace('_', ' ')}</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Urgency:</Text>
          <Text style={[styles.reviewValue, urgencyLevel === 'emergency' && styles.emergencyText]}>
            {urgencyLevel}
          </Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Symptoms:</Text>
          <Text style={styles.reviewValue}>{symptoms.length} recorded</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Photos:</Text>
          <Text style={styles.reviewValue}>{photos.length} attached</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Vitals:</Text>
          <Text style={styles.reviewValue}>
            {Object.keys(vitals).length} measurements
          </Text>
        </View>
      </View>

      <View style={styles.aiNote}>
        <Text style={styles.aiNoteIcon}>🤖</Text>
        <Text style={styles.aiNoteText}>
          Our AI will analyze this assessment and provide diagnostic suggestions and recommendations.
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Assessment</Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.animalInfo}>
          <Text style={styles.animalName}>{animal.name}</Text>
          <Text style={styles.animalDetails}>
            {animal.species} • Tag: {animal.tagNumber}
          </Text>
        </View>

        {renderStepContent()}
      </ScrollView>

      <View style={styles.navigation}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={() => setCurrentStep(currentStep + 1)}
            disabled={currentStep === 2 && symptoms.length === 0}
          >
            <Text style={styles.navButtonPrimaryText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.submitButton]}
            onPress={handleSubmitAssessment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Assessment</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 60,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
  },
  stepDotActive: {
    backgroundColor: '#007AFF',
  },
  stepDotCurrent: {
    backgroundColor: '#28a745',
    transform: [{ scale: 1.2 }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  animalInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
  },
  stepContent: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  urgencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  urgencyButtonActive: {
    backgroundColor: '#ffc107',
    borderColor: '#ffc107',
  },
  emergencyButton: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  urgencyText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  urgencyTextActive: {
    color: '#333',
  },
  emergencyText: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  symptomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  symptomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  severitySlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
  },
  severityButtonActive: {
    backgroundColor: '#ffc107',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  vitalInput: {
    flex: 1,
    minWidth: '45%',
  },
  conditionGroup: {
    marginBottom: 16,
  },
  conditionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    marginBottom: 8,
  },
  conditionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  conditionText: {
    fontSize: 12,
    color: '#666',
  },
  conditionTextActive: {
    color: '#fff',
  },
  photoButton: {
    backgroundColor: '#17a2b8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoList: {
    marginBottom: 16,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  photoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  photoInfo: {
    flex: 1,
  },
  photoCaption: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  photoTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  reviewCard: {
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
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  aiNote: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiNoteIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  aiNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  navButtonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  navButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  navButtonPrimaryText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});