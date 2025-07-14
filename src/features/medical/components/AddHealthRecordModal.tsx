import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useHealthRecordStore } from '../../../core/stores/HealthRecordStore';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { DatePicker } from '../../../shared/components/DatePicker';
import { FormPicker } from '../../../shared/components/FormPicker';
import { 
  OBSERVATION_TYPES, 
  COMMON_SYMPTOMS, 
  HealthRecord,
  HealthPhoto
} from '../../../core/models/HealthRecord';
import { HealthPhotoCapture } from './HealthPhotoCapture';

interface AddHealthRecordModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAnimalId?: string;
  onNavigateToAddAnimal?: () => void;
  editingRecord?: HealthRecord | null;
}

export const AddHealthRecordModal: React.FC<AddHealthRecordModalProps> = ({
  visible,
  onClose,
  selectedAnimalId,
  onNavigateToAddAnimal,
  editingRecord,
}) => {
  const { user } = useAuth();
  const { addHealthRecord, updateHealthRecord } = useHealthRecordStore();
  const { animals } = useAnimalStore();

  const [formData, setFormData] = useState({
    animalId: selectedAnimalId || '',
    observationType: 'routine' as 'routine' | 'illness' | 'treatment' | 'emergency',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    bodyConditionScore: 3,
    mobilityScore: 3,
    appetiteScore: 3,
    alertnessScore: 3,
    eyeCondition: 'normal' as any,
    nasalDischarge: 'none' as any,
    manureConsistency: 'normal' as any,
    gaitMobility: 'normal' as any,
    appetite: 'normal' as any,
    symptoms: [] as string[],
    customSymptoms: [] as string[],
    notes: '',
    isUnknownCondition: false,
    unknownConditionPriority: 'monitor' as any,
    followUpRequired: false,
    followUpDate: new Date(),
    recordedDate: new Date(),
    photos: [] as HealthPhoto[],
  });

  const [newCustomSymptom, setNewCustomSymptom] = useState('');

  useEffect(() => {
    if (editingRecord) {
      // Initialize form with editing record data
      setFormData({
        animalId: editingRecord.animalId,
        observationType: editingRecord.observationType,
        temperature: editingRecord.temperature?.toString() || '',
        heartRate: editingRecord.heartRate?.toString() || '',
        respiratoryRate: editingRecord.respiratoryRate?.toString() || '',
        bodyConditionScore: editingRecord.bodyConditionScore || 3,
        mobilityScore: editingRecord.mobilityScore || 3,
        appetiteScore: editingRecord.appetiteScore || 3,
        alertnessScore: editingRecord.alertnessScore || 3,
        eyeCondition: editingRecord.eyeCondition,
        nasalDischarge: editingRecord.nasalDischarge,
        manureConsistency: editingRecord.manureConsistency,
        gaitMobility: editingRecord.gaitMobility,
        appetite: editingRecord.appetite,
        symptoms: editingRecord.symptoms || [],
        customSymptoms: editingRecord.customSymptoms || [],
        notes: editingRecord.notes,
        isUnknownCondition: editingRecord.isUnknownCondition || false,
        unknownConditionPriority: editingRecord.unknownConditionPriority || 'monitor',
        followUpRequired: editingRecord.followUpRequired || false,
        followUpDate: editingRecord.followUpDate || new Date(),
        recordedDate: editingRecord.recordedDate,
        photos: editingRecord.photos || [],
      });
    } else if (selectedAnimalId && selectedAnimalId !== formData.animalId) {
      setFormData(prev => ({ ...prev, animalId: selectedAnimalId }));
    }
  }, [selectedAnimalId, editingRecord]);



  const resetForm = () => {
    setFormData({
      animalId: selectedAnimalId || '',
      observationType: 'routine',
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
      bodyConditionScore: 3,
      mobilityScore: 3,
      appetiteScore: 3,
      alertnessScore: 3,
      eyeCondition: 'normal',
      nasalDischarge: 'none',
      manureConsistency: 'normal',
      gaitMobility: 'normal',
      appetite: 'normal',
      symptoms: [],
      customSymptoms: [],
      notes: '',
      isUnknownCondition: false,
      unknownConditionPriority: 'monitor',
      followUpRequired: false,
      followUpDate: new Date(),
      recordedDate: new Date(),
      photos: [],
    });
    setNewCustomSymptom('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleSymptom = (symptomId: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomId)
        ? prev.symptoms.filter(s => s !== symptomId)
        : [...prev.symptoms, symptomId]
    }));
  };

  const addCustomSymptom = () => {
    if (newCustomSymptom.trim()) {
      setFormData(prev => ({
        ...prev,
        customSymptoms: [...prev.customSymptoms, newCustomSymptom.trim()]
      }));
      setNewCustomSymptom('');
    }
  };

  const removeCustomSymptom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customSymptoms: prev.customSymptoms.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.animalId) {
      Alert.alert('Error', 'Please select an animal');
      return;
    }

    if (!formData.notes.trim()) {
      Alert.alert('Error', 'Please add some notes about the observation');
      return;
    }

    try {
      if (editingRecord) {
        // Update existing record
        const updates = {
          animalId: formData.animalId,
          observationType: formData.observationType,
          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
          heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
          respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
          bodyConditionScore: formData.bodyConditionScore,
          mobilityScore: formData.mobilityScore,
          appetiteScore: formData.appetiteScore,
          alertnessScore: formData.alertnessScore,
          eyeCondition: formData.eyeCondition,
          nasalDischarge: formData.nasalDischarge,
          manureConsistency: formData.manureConsistency,
          gaitMobility: formData.gaitMobility,
          appetite: formData.appetite,
          symptoms: formData.symptoms,
          customSymptoms: formData.customSymptoms,
          notes: formData.notes,
          photos: formData.photos,
          isUnknownCondition: formData.isUnknownCondition,
          unknownConditionPriority: formData.isUnknownCondition ? formData.unknownConditionPriority : undefined,
          expertReviewRequested: formData.isUnknownCondition && 
            (formData.unknownConditionPriority === 'urgent' || formData.unknownConditionPriority === 'emergency'),
          followUpRequired: formData.followUpRequired,
          followUpDate: formData.followUpRequired ? formData.followUpDate : undefined,
          recordedDate: formData.recordedDate,
        };

        await updateHealthRecord(editingRecord.id, updates);
        
        const photoCount = formData.photos.length;
        Alert.alert(
          'Success', 
          `Health record updated successfully${photoCount > 0 ? ` with ${photoCount} medical photo${photoCount > 1 ? 's' : ''}` : ''}`
        );
        handleClose();
      } else {
        // Create new record
        const healthRecord: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        animalId: formData.animalId,
        recordedBy: user?.id || 'unknown-user',
        recordedDate: formData.recordedDate,
        observationType: formData.observationType,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
        bodyConditionScore: formData.bodyConditionScore,
        mobilityScore: formData.mobilityScore,
        appetiteScore: formData.appetiteScore,
        alertnessScore: formData.alertnessScore,
        eyeCondition: formData.eyeCondition,
        nasalDischarge: formData.nasalDischarge,
        manureConsistency: formData.manureConsistency,
        gaitMobility: formData.gaitMobility,
        appetite: formData.appetite,
        symptoms: formData.symptoms,
        customSymptoms: formData.customSymptoms,
        notes: formData.notes,
        photos: formData.photos,
        isUnknownCondition: formData.isUnknownCondition,
        unknownConditionPriority: formData.isUnknownCondition ? formData.unknownConditionPriority : undefined,
        expertReviewRequested: formData.isUnknownCondition && 
          (formData.unknownConditionPriority === 'urgent' || formData.unknownConditionPriority === 'emergency'),
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpRequired ? formData.followUpDate : undefined,
        userId: user?.id || 'unknown-user',
      };

        const savedRecord = await addHealthRecord(healthRecord);
        
        // Update photos with the health record ID
        if (formData.photos.length > 0 && savedRecord?.id) {
          const updatedPhotos = formData.photos.map(photo => ({
            ...photo,
            healthRecordId: savedRecord.id
          }));
          // In a real app, you'd save these to a photo store or update the health record
          console.log('Photos linked to health record:', updatedPhotos);
        }

        const photoCount = formData.photos.length;
        Alert.alert(
          'Success', 
          `Health record added successfully${photoCount > 0 ? ` with ${photoCount} medical photo${photoCount > 1 ? 's' : ''}` : ''}`
        );
        handleClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save health record');
    }
  };

  const ScoreSlider = ({ label, value, onChange }: { label: string, value: number, onChange: (value: number) => void }) => (
    <View style={styles.scoreSlider}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreButtons}>
        {[1, 2, 3, 4, 5].map(score => (
          <TouchableOpacity
            key={score}
            style={[styles.scoreButton, value === score && styles.scoreButtonActive]}
            onPress={() => onChange(score)}
          >
            <Text style={[styles.scoreButtonText, value === score && styles.scoreButtonTextActive]}>
              {score}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              🏥 {editingRecord ? 'Edit Health Record' : 'Add Health Record'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Animal Selection */}
            {animals.length === 0 ? (
              <View style={styles.noAnimalsContainer}>
                <Text style={styles.noAnimalsText}>
                  No animals found. Please add an animal first before creating health records.
                </Text>
                <TouchableOpacity style={styles.addAnimalButton} onPress={() => {
                  handleClose();
                  onNavigateToAddAnimal?.();
                }}>
                  <Text style={styles.addAnimalButtonText}>Add Animal First</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FormPicker
                label="Animal"
                value={formData.animalId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, animalId: value }))}
                options={animals.map(animal => ({ 
                  label: `${animal.name} (${animal.species})`, 
                  value: animal.id 
                }))}
                placeholder="Select animal"
                required
              />
            )}

            {/* Observation Type */}
            <FormPicker
              label="Observation Type"
              value={formData.observationType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, observationType: value as any }))}
              options={OBSERVATION_TYPES.map(type => ({ 
                label: `${type.icon} ${type.name}`, 
                value: type.id 
              }))}
              placeholder="Select observation type"
              required
            />

            {/* Date */}
            <DatePicker
              label="Date & Time"
              value={formData.recordedDate}
              onDateChange={(date) => setFormData(prev => ({ ...prev, recordedDate: date || new Date() }))}
              required
            />

            {/* Vital Signs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌡️ Vital Signs (Optional)</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Temperature (°F)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.temperature}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, temperature: text }))}
                  placeholder="102.5"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Heart Rate (BPM)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.heartRate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, heartRate: text }))}
                  placeholder="70"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Respiratory Rate (BPM)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.respiratoryRate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, respiratoryRate: text }))}
                  placeholder="20"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Body Condition Scores */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Condition Scores (1-5 scale)</Text>
              
              <ScoreSlider
                label="Body Condition"
                value={formData.bodyConditionScore}
                onChange={(value) => setFormData(prev => ({ ...prev, bodyConditionScore: value }))}
              />
              
              <ScoreSlider
                label="Mobility"
                value={formData.mobilityScore}
                onChange={(value) => setFormData(prev => ({ ...prev, mobilityScore: value }))}
              />
              
              <ScoreSlider
                label="Appetite"
                value={formData.appetiteScore}
                onChange={(value) => setFormData(prev => ({ ...prev, appetiteScore: value }))}
              />
              
              <ScoreSlider
                label="Alertness"
                value={formData.alertnessScore}
                onChange={(value) => setFormData(prev => ({ ...prev, alertnessScore: value }))}
              />
            </View>

            {/* Physical Observations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👁️ Physical Observations</Text>
              
              <FormPicker
                label="Eye Condition"
                value={formData.eyeCondition}
                onValueChange={(value) => setFormData(prev => ({ ...prev, eyeCondition: value as any }))}
                options={[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Discharge', value: 'discharge' },
                  { label: 'Swollen', value: 'swollen' },
                  { label: 'Cloudy', value: 'cloudy' },
                  { label: 'Injured', value: 'injured' },
                  { label: 'Other', value: 'other' },
                ]}
                placeholder="Select eye condition"
              />

              <FormPicker
                label="Nasal Discharge"
                value={formData.nasalDischarge}
                onValueChange={(value) => setFormData(prev => ({ ...prev, nasalDischarge: value as any }))}
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Clear', value: 'clear' },
                  { label: 'Thick', value: 'thick' },
                  { label: 'Bloody', value: 'bloody' },
                  { label: 'Purulent', value: 'purulent' },
                  { label: 'Other', value: 'other' },
                ]}
                placeholder="Select nasal discharge"
              />

              <FormPicker
                label="Manure Consistency"
                value={formData.manureConsistency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, manureConsistency: value as any }))}
                options={[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Soft', value: 'soft' },
                  { label: 'Loose', value: 'loose' },
                  { label: 'Watery', value: 'watery' },
                  { label: 'Hard', value: 'hard' },
                  { label: 'Bloody', value: 'bloody' },
                  { label: 'Other', value: 'other' },
                ]}
                placeholder="Select manure consistency"
              />

              <FormPicker
                label="Gait/Mobility"
                value={formData.gaitMobility}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gaitMobility: value as any }))}
                options={[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Slight Limp', value: 'slight_limp' },
                  { label: 'Obvious Limp', value: 'obvious_limp' },
                  { label: 'Reluctant to Move', value: 'reluctant_to_move' },
                  { label: 'Down', value: 'down' },
                  { label: 'Other', value: 'other' },
                ]}
                placeholder="Select gait/mobility"
              />
            </View>

            {/* Symptoms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Symptoms</Text>
              
              <View style={styles.symptomsGrid}>
                {COMMON_SYMPTOMS.map((symptom) => (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[
                      styles.symptomChip,
                      formData.symptoms.includes(symptom.id) && styles.symptomChipActive
                    ]}
                    onPress={() => toggleSymptom(symptom.id)}
                  >
                    <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                    <Text style={[
                      styles.symptomText,
                      formData.symptoms.includes(symptom.id) && styles.symptomTextActive
                    ]}>
                      {symptom.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Symptoms */}
              <View style={styles.customSymptomSection}>
                <Text style={styles.customSymptomLabel}>Custom Symptoms:</Text>
                <View style={styles.customSymptomInput}>
                  <TextInput
                    style={styles.customSymptomTextInput}
                    value={newCustomSymptom}
                    onChangeText={setNewCustomSymptom}
                    placeholder="Add custom symptom..."
                  />
                  <TouchableOpacity style={styles.addCustomSymptomButton} onPress={addCustomSymptom}>
                    <Text style={styles.addCustomSymptomButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
                
                {formData.customSymptoms.map((symptom, index) => (
                  <View key={index} style={styles.customSymptomItem}>
                    <Text style={styles.customSymptomItemText}>{symptom}</Text>
                    <TouchableOpacity onPress={() => removeCustomSymptom(index)}>
                      <Text style={styles.removeCustomSymptomButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Detailed Notes *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Describe observations, behavior, concerns, or other relevant details..."
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Medical Photos */}
            <HealthPhotoCapture
              photos={formData.photos}
              onPhotosChange={(photos) => setFormData(prev => ({ ...prev, photos }))}
              maxPhotos={5}
            />

            {/* Unknown Condition */}
            <View style={styles.section}>
              <View style={styles.unknownConditionToggle}>
                <Text style={styles.unknownConditionLabel}>❓ This is an unknown condition</Text>
                <Switch
                  value={formData.isUnknownCondition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isUnknownCondition: value }))}
                />
              </View>
              
              {formData.isUnknownCondition && (
                <FormPicker
                  label="Priority Level"
                  value={formData.unknownConditionPriority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unknownConditionPriority: value as any }))}
                  options={[
                    { label: '👀 Monitor - No immediate concern', value: 'monitor' },
                    { label: '⚠️ Concern - Should be checked', value: 'concern' },
                    { label: '🚨 Urgent - Needs attention soon', value: 'urgent' },
                    { label: '🆘 Emergency - Immediate attention', value: 'emergency' },
                  ]}
                  placeholder="Select priority level"
                />
              )}
            </View>

            {/* Follow-up */}
            <View style={styles.section}>
              <View style={styles.followUpToggle}>
                <Text style={styles.followUpLabel}>📅 Follow-up required</Text>
                <Switch
                  value={formData.followUpRequired}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, followUpRequired: value }))}
                />
              </View>
              
              {formData.followUpRequired && (
                <DatePicker
                  label="Follow-up Date"
                  value={formData.followUpDate}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, followUpDate: date || new Date() }))}
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>
                {editingRecord ? 'Update Record' : 'Save Record'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  scoreSlider: {
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  scoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scoreButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  scoreButtonTextActive: {
    color: '#fff',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  symptomChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  symptomIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  symptomText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  symptomTextActive: {
    color: '#fff',
  },
  customSymptomSection: {
    marginTop: 16,
  },
  customSymptomLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  customSymptomInput: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  customSymptomTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  addCustomSymptomButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addCustomSymptomButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  customSymptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  customSymptomItemText: {
    fontSize: 14,
    color: '#333',
  },
  removeCustomSymptomButton: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unknownConditionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  unknownConditionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  followUpToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  followUpLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noAnimalsContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noAnimalsText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
    lineHeight: 20,
  },
  addAnimalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addAnimalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});