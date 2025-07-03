import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { UserProfile, PROFILE_TYPES } from '../../../core/models/Profile';

interface DemoProfileChooserScreenProps {
  onProfileSelected: (profile: UserProfile) => void;
  onCreateCustomProfile: () => void;
  onShowSettings?: () => void;
}

export const DemoProfileChooserScreen: React.FC<DemoProfileChooserScreenProps> = ({
  onProfileSelected,
  onCreateCustomProfile,
  onShowSettings,
}) => {
  const { 
    profiles, 
    createDemoProfiles, 
    switchProfile,
    isFirstLaunch 
  } = useProfileStore();
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-create demo profiles on first launch
    const initializeDemoProfiles = async () => {
      setLoading(true);
      try {
        await createDemoProfiles();
      } catch (error) {
        console.error('Failed to create demo profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDemoProfiles();
  }, []);

  const handleDemoProfileSelect = async (profile: UserProfile) => {
    try {
      setLoading(true);
      await switchProfile(profile.id);
      
      // Auto-login - no confirmation needed for demo profiles
      console.log(`🚀 Auto-login to ${profile.name}`);
      onProfileSelected(profile);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch profile');
    } finally {
      setLoading(false);
    }
  };

  const getDemoProfiles = () => {
    return profiles.filter(p => p.isDemo);
  };

  const renderWelcomeHeader = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeTitle}>Welcome to ShowTrackAI</Text>
      <Text style={styles.welcomeSubtitle}>
        Choose a demo profile to explore features, or create your own
      </Text>
      <Text style={styles.welcomeNote}>
        💡 Demo profiles show you different subscription tiers
      </Text>
    </View>
  );

  const renderDemoProfileCard = (profile: UserProfile) => {
    const profileType = PROFILE_TYPES[profile.type];
    const isFreemium = profile.type === 'freemium_student';
    const isElite = profile.type === 'elite_student';

    return (
      <TouchableOpacity
        key={profile.id}
        style={[
          styles.demoCard,
          isElite && styles.eliteCard,
        ]}
        onPress={() => handleDemoProfileSelect(profile)}
        disabled={loading}
      >
        {isElite && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>{profileType.icon}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={[
              styles.profileTier,
              isElite && styles.eliteTier,
              isFreemium && styles.freemiumTier
            ]}>
              {profileType.label}
            </Text>
            <Text style={styles.profileDescription}>
              {profileType.description}
            </Text>
          </View>
        </View>

        <View style={styles.statsPreview}>
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

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>✨ What's included:</Text>
          <View style={styles.featuresList}>
            {profileType.features.slice(0, 4).map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                • {feature}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[
              styles.tryButton,
              isElite && styles.eliteButton,
              loading && styles.tryButtonDisabled
            ]}
            onPress={() => handleDemoProfileSelect(profile)}
            disabled={loading}
          >
            <Text style={[
              styles.tryButtonText,
              isElite && styles.eliteButtonText
            ]}>
              {loading ? 'Loading...' : `Try ${isFreemium ? 'Freemium' : 'Elite'}`}
            </Text>
          </TouchableOpacity>
        </View>

        {isFreemium && (
          <View style={styles.limitationBadge}>
            <Text style={styles.limitationText}>Limited Features</Text>
          </View>
        )}

        {isElite && (
          <View style={styles.unlimitedBadge}>
            <Text style={styles.unlimitedText}>All Features Unlocked</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionSection}>
      <TouchableOpacity
        style={styles.customProfileButton}
        onPress={onCreateCustomProfile}
      >
        <Text style={styles.customProfileIcon}>👤</Text>
        <Text style={styles.customProfileText}>Create Your Own Profile</Text>
        <Text style={styles.customProfileSubtext}>
          Personalize your ShowTrackAI experience
        </Text>
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

  if (loading && profiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Setting up demo profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const demoProfiles = getDemoProfiles();

  return (
    <SafeAreaView style={styles.container}>
      {renderWelcomeHeader()}
      
      <ScrollView 
        contentContainerStyle={styles.profilesContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.demoSection}>
          <Text style={styles.demoSectionTitle}>🎮 Try ShowTrackAI</Text>
          <Text style={styles.demoSectionSubtitle}>
            Experience different subscription tiers with pre-loaded demo data
          </Text>
          
          <View style={styles.demoGrid}>
            {demoProfiles.map(renderDemoProfileCard)}
          </View>
        </View>

        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>🔍 Feature Comparison</Text>
          
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Animal Limit</Text>
              <Text style={styles.freemiumValue}>5 animals</Text>
              <Text style={styles.eliteValue}>Unlimited</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>AI Predictions</Text>
              <Text style={styles.comparisonX}>✗</Text>
              <Text style={styles.comparisonCheck}>✓</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Advanced Analytics</Text>
              <Text style={styles.comparisonX}>✗</Text>
              <Text style={styles.comparisonCheck}>✓</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Export Formats</Text>
              <Text style={styles.freemiumValue}>CSV only</Text>
              <Text style={styles.eliteValue}>All formats</Text>
            </View>
          </View>
          
          <View style={styles.comparisonLabels}>
            <Text style={styles.freemiumLabel}>Freemium</Text>
            <Text style={styles.eliteLabel}>Elite</Text>
          </View>
        </View>
      </ScrollView>

      {renderActionButtons()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  welcomeSection: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 8,
  },
  welcomeNote: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  profilesContainer: {
    padding: 20,
    paddingBottom: 140,
  },
  demoSection: {
    marginBottom: 32,
  },
  demoSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  demoGrid: {
    gap: 20,
  },
  demoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  eliteCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f8fbff',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    backgroundColor: '#ff6b6b',
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
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
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  profileTier: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  eliteTier: {
    color: '#007AFF',
  },
  freemiumTier: {
    color: '#666',
  },
  profileDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  statsPreview: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  featuresSection: {
    marginBottom: 16,
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
  cardFooter: {
    alignItems: 'center',
  },
  tryButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
  },
  eliteButton: {
    backgroundColor: '#007AFF',
  },
  tryButtonDisabled: {
    opacity: 0.6,
  },
  tryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  eliteButtonText: {
    color: '#fff',
  },
  limitationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  limitationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  unlimitedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unlimitedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  comparisonSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonTable: {
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  comparisonCheck: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
  },
  comparisonX: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  freemiumValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  eliteValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  comparisonLabels: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  freemiumLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginLeft: '16.67%',
  },
  eliteLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
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
  customProfileButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  customProfileIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  customProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  customProfileSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});