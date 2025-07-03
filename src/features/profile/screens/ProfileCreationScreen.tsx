import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { UserProfile, PROFILE_TYPES, ProfileCreationData } from '../../../core/models/Profile';
import { FormPicker } from '../../../shared/components/FormPicker';

interface ProfileCreationScreenProps {
  onProfileCreated: (profile: UserProfile) => void;
  onCancel: () => void;
}

export const ProfileCreationScreen: React.FC<ProfileCreationScreenProps> = ({
  onProfileCreated,
  onCancel,
}) => {
  const { createProfile } = useProfileStore();
  
  const [formData, setFormData] = useState<ProfileCreationData>({
    name: '',
    type: 'student',
    school: '',
    grade: '',
    chapter: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedTypeDetails, setSelectedTypeDetails] = useState(PROFILE_TYPES.student);

  const gradeOptions = [
    { label: '9th Grade', value: '9' },
    { label: '10th Grade', value: '10' },
    { label: '11th Grade', value: '11' },
    { label: '12th Grade', value: '12' },
    { label: 'College Freshman', value: 'college-1' },
    { label: 'College Sophomore', value: 'college-2' },
    { label: 'College Junior', value: 'college-3' },
    { label: 'College Senior', value: 'college-4' },
    { label: 'Graduate Student', value: 'graduate' },
    { label: 'Other', value: 'other' },
  ];

  const handleTypeSelect = (type: keyof typeof PROFILE_TYPES) => {
    setFormData(prev => ({ ...prev, type }));
    setSelectedTypeDetails(PROFILE_TYPES[type]);
  };

  const handleCreateProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    if (formData.type === 'student' && !formData.school?.trim()) {
      Alert.alert('School Required', 'Students must specify their school.');
      return;
    }

    setLoading(true);
    try {
      const newProfile = await createProfile(formData);
      onProfileCreated(newProfile);
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👤 Profile Type</Text>
      <Text style={styles.sectionSubtitle}>Choose the option that best describes you</Text>
      
      <View style={styles.typeGrid}>
        {Object.entries(PROFILE_TYPES).map(([key, type]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.typeCard,
              formData.type === key && styles.typeCardSelected,
            ]}
            onPress={() => handleTypeSelect(key as keyof typeof PROFILE_TYPES)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={styles.typeLabel}>{type.label}</Text>
            <Text style={styles.typeDescription}>{type.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>✨ What you'll get:</Text>
        <View style={styles.featuresList}>
          {selectedTypeDetails.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>
              • {feature}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📝 Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your full name"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {(formData.type === 'student' || formData.type === 'educator') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            School {formData.type === 'student' ? '*' : '(Optional)'}
          </Text>
          <TextInput
            style={styles.textInput}
            value={formData.school}
            onChangeText={(text) => setFormData(prev => ({ ...prev, school: text }))}
            placeholder="Enter your school name"
            autoCapitalize="words"
          />
        </View>
      )}

      {formData.type === 'student' && (
        <View style={styles.inputGroup}>
          <FormPicker
            label="Grade Level"
            value={formData.grade || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}
            options={gradeOptions}
            placeholder="Select your grade level"
          />
        </View>
      )}

      {(formData.type === 'student' || formData.type === 'educator') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>FFA Chapter (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.chapter}
            onChangeText={(text) => setFormData(prev => ({ ...prev, chapter: text }))}
            placeholder="Enter your FFA chapter name"
            autoCapitalize="words"
          />
        </View>
      )}
    </View>
  );

  const renderGetStartedInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🚀 Getting Started</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          After creating your profile, you'll be able to:
        </Text>
        <View style={styles.stepsList}>
          <Text style={styles.stepItem}>1. Add and track your animals</Text>
          <Text style={styles.stepItem}>2. Log daily activities and hours</Text>
          <Text style={styles.stepItem}>3. Take and organize project photos</Text>
          <Text style={styles.stepItem}>4. Track expenses and income</Text>
          <Text style={styles.stepItem}>5. Generate reports for competitions</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderProfileTypeSelector()}
        {renderBasicInfo()}
        {renderGetStartedInfo()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateProfile}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  typeGrid: {
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  typeIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featuresList: {
    gap: 4,
  },
  featureItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  stepsList: {
    gap: 6,
  },
  stepItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});