import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { UserProfile, PROFILE_TYPES } from '../../../core/models/Profile';
import { ProfileCreationScreen } from './ProfileCreationScreen';

interface ProfileChooserScreenProps {
  onProfileSelected: (profile: UserProfile) => void;
  onShowSettings?: () => void;
}

export const ProfileChooserScreen: React.FC<ProfileChooserScreenProps> = ({
  onProfileSelected,
  onShowSettings,
}) => {
  const { 
    profiles, 
    currentProfile, 
    switchProfile, 
    deleteProfile,
    isFirstLaunch 
  } = useProfileStore();
  
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    currentProfile?.id || null
  );

  useEffect(() => {
    // Auto-show creation screen if no profiles exist
    if (profiles.length === 0 && isFirstLaunch) {
      setShowCreateProfile(true);
    }
  }, [profiles.length, isFirstLaunch]);

  const handleProfileSelect = async (profile: UserProfile) => {
    try {
      await switchProfile(profile.id);
      setSelectedProfileId(profile.id);
      onProfileSelected(profile);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch profile');
    }
  };

  const handleDeleteProfile = (profile: UserProfile) => {
    if (profiles.length === 1) {
      Alert.alert('Cannot Delete', 'You must have at least one profile.');
      return;
    }

    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profile.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(profile.id);
              if (selectedProfileId === profile.id) {
                const remainingProfile = profiles.find(p => p.id !== profile.id);
                if (remainingProfile) {
                  setSelectedProfileId(remainingProfile.id);
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderWelcomeHeader = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeTitle}>Welcome to ShowTrackAI</Text>
      <Text style={styles.welcomeSubtitle}>
        {profiles.length === 0 
          ? 'Create your first profile to get started' 
          : 'Choose a profile to continue'}
      </Text>
    </View>
  );

  const renderProfileCard = (profile: UserProfile) => {
    const isSelected = selectedProfileId === profile.id;
    const profileType = PROFILE_TYPES[profile.type];

    return (
      <TouchableOpacity
        key={profile.id}
        style={[
          styles.profileCard,
          isSelected && styles.profileCardSelected,
        ]}
        onPress={() => handleProfileSelect(profile)}
        onLongPress={() => handleDeleteProfile(profile)}
      >
        <View style={styles.profileCardContent}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{profileType.icon}</Text>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileType}>{profileType.label}</Text>
              {profile.school && (
                <Text style={styles.profileSchool}>{profile.school}</Text>
              )}
            </View>

            {isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.stats.animalsManaged}</Text>
              <Text style={styles.statLabel}>Animals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.stats.journalEntries}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(profile.stats.totalHoursLogged / 60)}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.stats.achievementsEarned}</Text>
              <Text style={styles.statLabel}>Awards</Text>
            </View>
          </View>

          <View style={styles.profileFooter}>
            <Text style={styles.lastActive}>
              Last active: {formatLastActive(profile.lastActive)}
            </Text>
            {profile.chapter && (
              <Text style={styles.chapterInfo}>
                {profile.chapter} Chapter
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionSection}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowCreateProfile(true)}
      >
        <Text style={styles.actionButtonIcon}>➕</Text>
        <Text style={styles.actionButtonText}>Add New Profile</Text>
      </TouchableOpacity>

      {onShowSettings && (
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onShowSettings}
        >
          <Text style={styles.actionButtonIcon}>⚙️</Text>
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderWelcomeHeader()}
      
      <ScrollView 
        contentContainerStyle={styles.profilesContainer}
        showsVerticalScrollIndicator={false}
      >
        {profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👋</Text>
            <Text style={styles.emptyStateTitle}>No Profiles Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first profile to start tracking your agricultural projects
            </Text>
          </View>
        ) : (
          profiles
            .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
            .map(renderProfileCard)
        )}
      </ScrollView>

      {renderActionButtons()}

      <Modal
        visible={showCreateProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ProfileCreationScreen
          onProfileCreated={(profile) => {
            setShowCreateProfile(false);
            handleProfileSelect(profile);
          }}
          onCancel={() => {
            if (profiles.length > 0) {
              setShowCreateProfile(false);
            } else {
              Alert.alert(
                'Profile Required',
                'You need at least one profile to use ShowTrackAI.'
              );
            }
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  profilesContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileCardSelected: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  profileCardContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  profileType: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  profileSchool: {
    fontSize: 12,
    color: '#666',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  profileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastActive: {
    fontSize: 12,
    color: '#666',
  },
  chapterInfo: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionSection: {
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
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonIcon: {
    fontSize: 16,
    color: '#fff',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});