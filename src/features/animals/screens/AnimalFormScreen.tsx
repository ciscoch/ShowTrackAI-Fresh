import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Animal, SPECIES_OPTIONS, BREED_OPTIONS, PROJECT_TYPES } from '../../../core/models';
import { useAnimalStore } from '../../../core/stores';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DatePicker } from '../../../shared/components/DatePicker';

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
  const { addAnimal, updateAnimal } = useAnimalStore();
  
  const [formData, setFormData] = useState({
    name: animal?.name || '',
    tagNumber: animal?.tagNumber || '',
    penNumber: animal?.penNumber || '',
    species: animal?.species || '',
    breed: animal?.breed || '',
    breeder: animal?.breeder || '',
    birthDate: animal?.birthDate || null,
    pickupDate: animal?.pickupDate || null,
    projectType: animal?.projectType || '',
    acquisitionCost: animal?.acquisitionCost?.toString() || '',
    weight: animal?.weight?.toString() || '',
    notes: animal?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.tagNumber.trim()) newErrors.tagNumber = 'Tag number is required';
    if (!formData.penNumber.trim()) newErrors.penNumber = 'Pen number is required';
    if (!formData.species) newErrors.species = 'Species is required';
    if (!formData.breed) newErrors.breed = 'Breed is required';
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
      return;
    }
    
    try {
      const animalData = {
        name: formData.name,
        tagNumber: formData.tagNumber,
        penNumber: formData.penNumber,
        species: formData.species as 'Cattle' | 'Goat' | 'Pig' | 'Sheep',
        breed: formData.breed,
        breeder: formData.breeder,
        birthDate: formData.birthDate || undefined,
        pickupDate: formData.pickupDate || undefined,
        projectType: formData.projectType as 'Market' | 'Breeding' | 'Show' | 'Dairy',
        acquisitionCost: Number(formData.acquisitionCost) || 0,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {animal ? 'Edit Animal' : 'Add New Animal'}
        </Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter animal name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tag Number *</Text>
          <TextInput
            style={[styles.input, errors.tagNumber && styles.inputError]}
            value={formData.tagNumber}
            onChangeText={(text) => setFormData({ ...formData, tagNumber: text })}
            placeholder="Enter tag number"
          />
          {errors.tagNumber && <Text style={styles.errorText}>{errors.tagNumber}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pen Number *</Text>
          <TextInput
            style={[styles.input, errors.penNumber && styles.inputError]}
            value={formData.penNumber}
            onChangeText={(text) => setFormData({ ...formData, penNumber: text })}
            placeholder="Enter pen number"
          />
          {errors.penNumber && <Text style={styles.errorText}>{errors.penNumber}</Text>}
        </View>

        <FormPicker
          label="Species"
          value={formData.species}
          onValueChange={(value) => setFormData({ ...formData, species: value, breed: '' })}
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
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>
            {animal ? 'Update Animal' : 'Add Animal'}
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#007AFF',
  },
});