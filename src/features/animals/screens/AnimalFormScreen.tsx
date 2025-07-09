import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Animal, SPECIES_OPTIONS, BREED_OPTIONS, PROJECT_TYPES, SEX_OPTIONS } from '../../../core/models';
import { useAnimalStore } from '../../../core/stores';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DatePicker } from '../../../shared/components/DatePicker';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';

interface AnimalFormScreenProps {
  animal?: Animal;
  onSave: () => void;
  onCancel: () => void;
}

export const AnimalFormScreen: React.FC<AnimalFormScreenProps> = ({
  animal,
  onSave,
  onCancel,
}) => {
  const { addAnimal, updateAnimal, isLoading } = useAnimalStore();
  const { user } = useAuth();
  const { isEnabled: useBackend } = useSupabaseBackend();
  
  const [formData, setFormData] = useState({
    name: animal?.name || '',
    earTag: animal?.earTag || '',
    penNumber: animal?.penNumber || '',
    species: animal?.species || '',
    breed: animal?.breed || '',
    breeder: animal?.breeder || '',
    sex: animal?.sex || '',
    birthDate: animal?.birthDate || null,
    pickupDate: animal?.pickupDate || null,
    projectType: animal?.projectType || '',
    acquisitionCost: animal?.acquisitionCost?.toString() || '',
    predictedSaleCost: animal?.predictedSaleCost?.toString() || '',
    weight: animal?.weight?.toString() || '',
    notes: animal?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.earTag.trim()) newErrors.earTag = 'Ear tag is required';
    if (!formData.penNumber.trim()) newErrors.penNumber = 'Pen number is required';
    if (!formData.species) newErrors.species = 'Species is required';
    if (!formData.breed) newErrors.breed = 'Breed is required';
    if (!formData.sex) newErrors.sex = 'Sex is required';
    if (!formData.breeder.trim()) newErrors.breeder = 'Breeder is required';
    if (!formData.birthDate) newErrors.birthDate = 'Birth date is required';
    if (!formData.pickupDate) newErrors.pickupDate = 'Pick-up date is required';
    if (!formData.projectType) newErrors.projectType = 'Project type is required';
    if (!formData.acquisitionCost.trim()) {
      newErrors.acquisitionCost = 'Acquisition cost is required';
    } else if (isNaN(Number(formData.acquisitionCost)) || Number(formData.acquisitionCost) < 0) {
      newErrors.acquisitionCost = 'Please enter a valid cost';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setShowErrorSummary(true);
      // Scroll to top to show error summary
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      
      // Show error alert
      const errorCount = Object.keys(errors).length;
      Alert.alert(
        '❌ Validation Error',
        `Please fix ${errorCount} ${errorCount === 1 ? 'error' : 'errors'} before saving. Check the red highlighted fields above.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      const animalData = {
        name: formData.name,
        earTag: formData.earTag,
        penNumber: formData.penNumber,
        species: formData.species as 'Cattle' | 'Goat' | 'Pig' | 'Sheep',
        breed: formData.breed,
        breeder: formData.breeder,
        sex: formData.sex as 'Male' | 'Female',
        birthDate: formData.birthDate || undefined,
        pickupDate: formData.pickupDate || undefined,
        projectType: formData.projectType as 'Market' | 'Breeding' | 'Show' | 'Dairy',
        acquisitionCost: Number(formData.acquisitionCost) || 0,
        predictedSaleCost: formData.predictedSaleCost ? Number(formData.predictedSaleCost) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        notes: formData.notes || undefined,
      };

      if (animal) {
        await updateAnimal(animal.id, animalData);
        Alert.alert('Success', 'Animal updated successfully!', [
          { text: 'OK', onPress: onSave }
        ]);
      } else {
        await addAnimal(animalData);
        Alert.alert('Success', 'Animal saved successfully!', [
          { text: 'OK', onPress: onSave }
        ]);
      }
    } catch (error) {
      console.error('Error saving animal:', error);
      Alert.alert('Error', 'Failed to save animal. Please try again.');
    }
  };

  const speciesOptions = SPECIES_OPTIONS.map(species => ({
    label: species,
    value: species,
  }));

  const breedOptions = formData.species 
    ? BREED_OPTIONS[formData.species as keyof typeof BREED_OPTIONS].map(breed => ({
        label: breed,
        value: breed,
      }))
    : [];

  const projectTypeOptions = PROJECT_TYPES.map(type => ({
    label: type,
    value: type,
  }));

  // Clear errors and error summary when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      // Hide error summary if no errors remain
      if (Object.keys(errors).length <= 1) {
        setShowErrorSummary(false);
      }
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {animal ? 'Edit Animal' : 'New Animal'}
        </Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.form} contentContainerStyle={styles.formContent}>
        {/* Error Summary */}
        {showErrorSummary && Object.keys(errors).length > 0 && (
          <View style={styles.errorSummary}>
            <Text style={styles.errorSummaryTitle}>
              ⚠️ Please fix the following {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'error' : 'errors'}:
            </Text>
            {Object.entries(errors).map(([field, message]) => (
              <Text key={field} style={styles.errorSummaryItem}>
                • {message}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text });
              clearFieldError('name');
            }}
            placeholder="Enter animal name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ear Tag *</Text>
          <TextInput
            style={[styles.input, errors.earTag && styles.inputError]}
            value={formData.earTag}
            onChangeText={(text) => {
              setFormData({ ...formData, earTag: text });
              clearFieldError('earTag');
            }}
            placeholder="Enter ear tag"
          />
          {errors.earTag && <Text style={styles.errorText}>{errors.earTag}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pen Number *</Text>
          <TextInput
            style={[styles.input, errors.penNumber && styles.inputError]}
            value={formData.penNumber}
            onChangeText={(text) => {
              setFormData({ ...formData, penNumber: text });
              clearFieldError('penNumber');
            }}
            placeholder="Enter pen number"
          />
          {errors.penNumber && <Text style={styles.errorText}>{errors.penNumber}</Text>}
        </View>

        <FormPicker
          label="Species"
          value={formData.species}
          onValueChange={(value) => {
            setFormData({ ...formData, species: value, breed: '' });
            clearFieldError('species');
          }}
          options={speciesOptions}
          placeholder="Select species"
          error={errors.species}
          required
        />

        <FormPicker
          label="Breed"
          value={formData.breed}
          onValueChange={(value) => setFormData({ ...formData, breed: value })}
          options={breedOptions}
          placeholder={formData.species ? "Select breed" : "Select species first"}
          error={errors.breed}
          required
        />

        <FormPicker
          label="Sex"
          value={formData.sex}
          onValueChange={(value) => setFormData({ ...formData, sex: value })}
          options={SEX_OPTIONS.map(sex => ({ label: sex, value: sex }))}
          placeholder="Select sex"
          error={errors.sex}
          required
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Breeder *</Text>
          <TextInput
            style={[styles.input, errors.breeder && styles.inputError]}
            value={formData.breeder}
            onChangeText={(text) => setFormData({ ...formData, breeder: text })}
            placeholder="Enter breeder name"
          />
          {errors.breeder && <Text style={styles.errorText}>{errors.breeder}</Text>}
        </View>

        <DatePicker
          label="Birth Date"
          value={formData.birthDate}
          onDateChange={(date) => setFormData({ ...formData, birthDate: date })}
          placeholder="Select birth date"
          error={errors.birthDate}
          required
        />

        <DatePicker
          label="Pick-up Date"
          value={formData.pickupDate}
          onDateChange={(date) => setFormData({ ...formData, pickupDate: date })}
          placeholder="Select pick-up date"
          error={errors.pickupDate}
          required
        />

        <FormPicker
          label="Project Type"
          value={formData.projectType}
          onValueChange={(value) => setFormData({ ...formData, projectType: value })}
          options={projectTypeOptions}
          placeholder="Select project type"
          error={errors.projectType}
          required
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Acquisition Cost *</Text>
          <TextInput
            style={[styles.input, errors.acquisitionCost && styles.inputError]}
            value={formData.acquisitionCost}
            onChangeText={(text) => setFormData({ ...formData, acquisitionCost: text })}
            placeholder="0.00"
            keyboardType="numeric"
          />
          {errors.acquisitionCost && <Text style={styles.errorText}>{errors.acquisitionCost}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Predicted Sale Cost 📊</Text>
          <TextInput
            style={[styles.input, errors.predictedSaleCost && styles.inputError]}
            value={formData.predictedSaleCost}
            onChangeText={(text) => setFormData({ ...formData, predictedSaleCost: text })}
            placeholder="0.00"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            💡 Used for break-even analysis and SAE financial planning
          </Text>
          {errors.predictedSaleCost && <Text style={styles.errorText}>{errors.predictedSaleCost}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight}
            onChangeText={(text) => setFormData({ ...formData, weight: text })}
            placeholder="Enter current weight"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Additional notes about this animal"
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.button, 
            (isLoading || (hasErrors && showErrorSummary)) && styles.disabledButton
          ]} 
          onPress={handleSave}
          disabled={isLoading || (hasErrors && showErrorSummary)}
        >
          <Text style={styles.buttonText}>
            {isLoading 
              ? 'Saving...' 
              : (hasErrors && showErrorSummary)
                ? `Fix ${Object.keys(errors).length} Error${Object.keys(errors).length === 1 ? '' : 's'}`
                : (animal ? 'Update Animal' : 'Add Animal')
            }
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60, // Safe area padding for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  optionalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#9CA3AF',
    borderColor: '#E5E7EB',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorSummary: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  errorSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorSummaryItem: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 4,
    paddingLeft: 8,
  },
});