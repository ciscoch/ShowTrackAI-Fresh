import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { UserProfile, PROFILE_TYPES } from '../../../core/models/Profile';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DataManager } from '../../../shared/components/DataManager';

interface ProfileSettingsScreenProps {
  onClose: () => void;
  onDeleteProfile?: () => void;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  onClose,
  onDeleteProfile,
}) => {
  const { currentProfile, updateProfile, deleteProfile, profiles } = useProfileStore();
  
  const [formData, setFormData] = useState({
    name: currentProfile?.name || '',
    school: currentProfile?.school || '',
    grade: currentProfile?.grade || '',
    chapter: currentProfile?.chapter || '',
    settings: {
      defaultSpecies: currentProfile?.settings.defaultSpecies || 'Cattle',
      measurements: currentProfile?.settings.measurements || 'imperial',
      notifications: currentProfile?.settings.notifications || true,
      dataSharing: currentProfile?.settings.dataSharing || false,
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);

  const speciesOptions = [
    { label: 'Cattle', value: 'Cattle' },
    { label: 'Sheep', value: 'Sheep' },
    { label: 'Swine', value: 'Swine' },
    { label: 'Goats', value: 'Goats' },
    { label: 'Poultry', value: 'Poultry' },
    { label: 'Other', value: 'Other' },
  ];

  const measurementOptions = [
    { label: 'Imperial (lb, ft, °F)', value: 'imperial' },
    { label: 'Metric (kg, m, °C)', value: 'metric' },
  ];

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

  if (!currentProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No profile selected</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(currentProfile.id, {
        name: formData.name,
        school: formData.school,
        grade: formData.grade,
        chapter: formData.chapter,
        settings: formData.settings,
      });
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    if (profiles.length === 1) {
      Alert.alert('Cannot Delete', 'You must have at least one profile.');
      return;
    }

    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${currentProfile.name}"? This action cannot be undone and will remove all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(currentProfile.id);
              onDeleteProfile?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  const profileType = PROFILE_TYPES[currentProfile.type];

  const renderProfileInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👤 Profile Information</Text>
      
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{profileType.icon}</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={styles.profileType}>{profileType.label}</Text>
          <Text style={styles.profileDate}>
            Created {currentProfile.createdAt.toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your full name"
          autoCapitalize="words"
        />
      </View>

      {(currentProfile.type === 'student' || currentProfile.type === 'educator') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>School</Text>
          <TextInput
            style={styles.textInput}
            value={formData.school}
            onChangeText={(text) => setFormData(prev => ({ ...prev, school: text }))}
            placeholder="Enter your school name"
            autoCapitalize="words"
          />
        </View>
      )}

      {currentProfile.type === 'student' && (
        <View style={styles.inputGroup}>
          <FormPicker
            label="Grade Level"
            value={formData.grade}
            onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}
            options={gradeOptions}
            placeholder="Select your grade level"
          />
        </View>
      )}

      {(currentProfile.type === 'student' || currentProfile.type === 'educator') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>FFA Chapter</Text>
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

  const renderAppSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ App Settings</Text>
      
      <View style={styles.inputGroup}>
        <FormPicker
          label="Default Species"
          value={formData.settings.defaultSpecies}
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            settings: { ...prev.settings, defaultSpecies: value }
          }))}
          options={speciesOptions}
          placeholder="Select default species"
        />
      </View>

      <View style={styles.inputGroup}>
        <FormPicker
          label="Measurement System"
          value={formData.settings.measurements}
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            settings: { ...prev.settings, measurements: value as 'metric' | 'imperial' }
          }))}
          options={measurementOptions}
          placeholder="Select measurement system"
        />
      </View>

      <View style={styles.switchGroup}>
        <View style={styles.switchItem}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Text style={styles.switchDescription}>
              Get reminders for feeding, medication, and important tasks
            </Text>
          </View>
          <Switch
            value={formData.settings.notifications}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              settings: { ...prev.settings, notifications: value }
            }))}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={formData.settings.notifications ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchItem}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Data Sharing</Text>
            <Text style={styles.switchDescription}>
              Help improve AI predictions by sharing anonymous data
            </Text>
          </View>
          <Switch
            value={formData.settings.dataSharing}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              settings: { ...prev.settings, dataSharing: value }
            }))}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={formData.settings.dataSharing ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  const renderProfileStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Profile Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentProfile.stats.animalsManaged}</Text>
          <Text style={styles.statLabel}>Animals Managed</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentProfile.stats.journalEntries}</Text>
          <Text style={styles.statLabel}>Journal Entries</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(currentProfile.stats.totalHoursLogged / 60)}</Text>
          <Text style={styles.statLabel}>Hours Logged</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentProfile.stats.achievementsEarned}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>
    </View>
  );

  const renderDataManagement = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🗄️ Data Management</Text>
      
      <TouchableOpacity 
        style={styles.dataButton}
        onPress={() => setShowDataManager(true)}
      >
        <View style={styles.dataButtonContent}>
          <Text style={styles.dataButtonIcon}>💾</Text>
          <View style={styles.dataButtonInfo}>
            <Text style={styles.dataButtonTitle}>Backup & Restore</Text>
            <Text style={styles.dataButtonSubtext}>
              Manage your data, create backups, and restore from files
            </Text>
          </View>
          <Text style={styles.dataButtonArrow}>→</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderDangerZone = () => (
    <View style={styles.section}>
      <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
      
      <TouchableOpacity 
        style={styles.dangerButton}
        onPress={handleDeleteProfile}
      >
        <Text style={styles.dangerButtonText}>Delete Profile</Text>
        <Text style={styles.dangerButtonSubtext}>
          This action cannot be undone
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile Settings</Text>
        <TouchableOpacity 
          style={[styles.headerButton, loading && styles.headerButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.headerButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileInfo()}
        {renderAppSettings()}
        {renderDataManagement()}
        {renderProfileStats()}
        {renderDangerZone()}
      </ScrollView>

      <DataManager
        visible={showDataManager}
        onClose={() => setShowDataManager(false)}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  profileDetails: {
    flex: 1,
  },
  profileType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  profileDate: {
    fontSize: 12,
    color: '#666',
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
  switchGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dataButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dataButtonInfo: {
    flex: 1,
  },
  dataButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  dataButtonSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  dataButtonArrow: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dc3545',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 2,
  },
  dangerButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});