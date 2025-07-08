import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Animal, CreateWeightRequest } from '../../../core/models';
import { useWeightStore } from '../../../core/stores/WeightStore';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DatePicker } from '../../../shared/components/DatePicker';

interface AddWeightScreenProps {
  animal: Animal;
  onSave: () => void;
  onCancel: () => void;
}

const MEASUREMENT_TYPES = [
  { label: 'Scale', value: 'Scale' },
  { label: 'AI Estimate', value: 'AI Estimate' },
  { label: 'Visual Estimate', value: 'Visual Estimate' },
  { label: 'Tape Measure', value: 'Tape Measure' },
];

const BODY_CONDITION_SCORES = [
  { label: '1 - Emaciated', value: 1 },
  { label: '2 - Very Thin', value: 2 },
  { label: '3 - Thin', value: 3 },
  { label: '4 - Borderline', value: 4 },
  { label: '5 - Moderate', value: 5 },
  { label: '6 - Good', value: 6 },
  { label: '7 - Very Good', value: 7 },
  { label: '8 - Fat', value: 8 },
  { label: '9 - Extremely Fat', value: 9 },
];

export const AddWeightScreen: React.FC<AddWeightScreenProps> = ({
  animal,
  onSave,
  onCancel,
}) => {
  const { addWeight } = useWeightStore();
  
  const [formData, setFormData] = useState({
    weight: '',
    date: new Date(),
    measurementType: 'Scale' as 'Scale' | 'AI Estimate' | 'Visual Estimate' | 'Tape Measure',
    bodyConditionScore: '',
    confidence: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.weight.trim()) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.measurementType) {
      newErrors.measurementType = 'Measurement type is required';
    }

    if (formData.bodyConditionScore && 
        (isNaN(Number(formData.bodyConditionScore)) || 
         Number(formData.bodyConditionScore) < 1 || 
         Number(formData.bodyConditionScore) > 9)) {
      newErrors.bodyConditionScore = 'Body condition score must be between 1-9';
    }

    if (formData.confidence && 
        (isNaN(Number(formData.confidence)) || 
         Number(formData.confidence) < 0 || 
         Number(formData.confidence) > 100)) {
      newErrors.confidence = 'Confidence must be between 0-100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const weightData: CreateWeightRequest = {
        animalId: animal.id,
        weight: Number(formData.weight),
        date: formData.date,
        measurementType: formData.measurementType,
        bodyConditionScore: formData.bodyConditionScore ? Number(formData.bodyConditionScore) : undefined,
        confidence: formData.confidence ? Number(formData.confidence) : undefined,
        notes: formData.notes || undefined,
      };

      await addWeight(weightData);
      
      Alert.alert('Success', 'Weight record added successfully!', [
        { text: 'OK', onPress: onSave }
      ]);
    } catch (error) {
      console.error('Error saving weight:', error);
      Alert.alert('Error', 'Failed to save weight record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getWeightUnit = (): string => {
    // Could be configurable in the future
    return 'lbs';
  };

  const getConfidencePlaceholder = (): string => {
    switch (formData.measurementType) {
      case 'AI Estimate':
        return 'AI confidence (0-100%)';
      case 'Visual Estimate':
        return 'Your confidence (0-100%)';
      case 'Tape Measure':
        return 'Measurement confidence (0-100%)';
      default:
        return 'Confidence (0-100%)';
    }
  };

  const showConfidenceField = (): boolean => {
    return formData.measurementType !== 'Scale';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Add Weight</Text>
          <Text style={styles.subtitle}>{animal.name}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {/* Weight Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight ({getWeightUnit()}) *</Text>
          <TextInput
            style={[styles.input, errors.weight && styles.inputError]}
            value={formData.weight}
            onChangeText={(text) => setFormData({ ...formData, weight: text })}
            placeholder={`Enter weight in ${getWeightUnit()}`}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
          {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
        </View>

        {/* Date Picker */}
        <DatePicker
          label="Measurement Date"
          value={formData.date}
          onDateChange={(date) => setFormData({ ...formData, date: date || new Date() })}
          placeholder="Select measurement date"
          error={errors.date}
          required
        />

        {/* Measurement Type */}
        <FormPicker
          label="Measurement Type"
          value={formData.measurementType}
          onValueChange={(value) => setFormData({ 
            ...formData, 
            measurementType: value as any,
            confidence: value === 'Scale' ? '' : formData.confidence 
          })}
          options={MEASUREMENT_TYPES}
          placeholder="Select measurement type"
          error={errors.measurementType}
          required
        />

        {/* Body Condition Score */}
        <FormPicker
          label="Body Condition Score (Optional)"
          value={formData.bodyConditionScore}
          onValueChange={(value) => setFormData({ ...formData, bodyConditionScore: value })}
          options={BODY_CONDITION_SCORES}
          placeholder="Select body condition score"
          error={errors.bodyConditionScore}
        />

        {/* Confidence (for non-scale measurements) */}
        {showConfidenceField() && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{getConfidencePlaceholder()}</Text>
            <TextInput
              style={[styles.input, errors.confidence && styles.inputError]}
              value={formData.confidence}
              onChangeText={(text) => setFormData({ ...formData, confidence: text })}
              placeholder="0-100"
              keyboardType="numeric"
              returnKeyType="next"
            />
            {errors.confidence && <Text style={styles.errorText}>{errors.confidence}</Text>}
            <Text style={styles.helpText}>
              How confident are you in this measurement?
            </Text>
          </View>
        )}

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Add any additional notes about this measurement"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="done"
          />
        </View>

        {/* Measurement Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Measurement Tips</Text>
          
          {formData.measurementType === 'Scale' && (
            <View style={styles.tip}>
              <Text style={styles.tipText}>
                • Weigh at the same time of day for consistency{'\n'}
                • Ensure the animal is calm and still{'\n'}
                • Record weight to the nearest 0.1 lbs if possible
              </Text>
            </View>
          )}

          {formData.measurementType === 'Tape Measure' && (
            <View style={styles.tip}>
              <Text style={styles.tipText}>
                • Measure heart girth just behind the front legs{'\n'}
                • Keep tape level and snug but not tight{'\n'}
                • Use species-specific weight tape for accuracy
              </Text>
            </View>
          )}

          {formData.measurementType === 'Visual Estimate' && (
            <View style={styles.tip}>
              <Text style={styles.tipText}>
                • Compare to animals of known weight{'\n'}
                • Consider body condition score{'\n'}
                • Factor in breed and age characteristics
              </Text>
            </View>
          )}

          {formData.measurementType === 'AI Estimate' && (
            <View style={styles.tip}>
              <Text style={styles.tipText}>
                • Ensure good lighting for photo analysis{'\n'}
                • Include reference objects for scale{'\n'}
                • Take photos from multiple angles
              </Text>
            </View>
          )}
        </View>

        {/* Current Weight Display */}
        {animal.weight && (
          <View style={styles.currentWeightContainer}>
            <Text style={styles.currentWeightLabel}>Previous Weight</Text>
            <Text style={styles.currentWeightValue}>
              {animal.weight.toFixed(1)} {getWeightUnit()}
            </Text>
            {formData.weight && !isNaN(Number(formData.weight)) && (
              <Text style={styles.weightChange}>
                Change: {Number(formData.weight) - animal.weight >= 0 ? '+' : ''}
                {(Number(formData.weight) - animal.weight).toFixed(1)} {getWeightUnit()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 4,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tipsContainer: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  tip: {
    marginTop: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  currentWeightContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentWeightLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  currentWeightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  weightChange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
});