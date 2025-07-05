import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { UserProfile } from '../../../core/models/Profile';
import { QRCodeGenerator } from '../../qrcode/components/QRCodeGenerator';

interface FreemiumDashboardProps {
  onSwitchProfile: () => void;
  onShowSettings: () => void;
  onNavigateToAnimals: () => void;
  onNavigateToCalendar: () => void;
  onUpgrade: () => void;
}

export const FreemiumDashboard: React.FC<FreemiumDashboardProps> = ({
  onSwitchProfile,
  onShowSettings,
  onNavigateToAnimals,
  onNavigateToCalendar,
  onUpgrade,
}) => {
  const { currentProfile, checkLimitations } = useProfileStore();
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  if (!currentProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No profile selected</Text>
      </View>
    );
  }

  const handleFeatureClick = (feature: string) => {
    const limitation = checkLimitations(currentProfile.id, feature);
    
    if (!limitation.allowed) {
      Alert.alert(
        'Upgrade Required',
        limitation.message,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade Now', onPress: onUpgrade }
        ]
      );
      return;
    }

    // Navigate to feature if allowed
    switch (feature) {
      case 'animals':
        onNavigateToAnimals();
        break;
      default:
        console.log(`Navigate to ${feature}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.profileName}>{currentProfile.name}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>🆓 FREEMIUM</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onSwitchProfile}
          >
            <Text style={styles.headerButtonText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onShowSettings}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upgrade Banner */}
        <TouchableOpacity style={styles.upgradeBanner} onPress={onUpgrade}>
          <Text style={styles.upgradeBannerIcon}>⭐</Text>
          <View style={styles.upgradeBannerContent}>
            <Text style={styles.upgradeBannerTitle}>Upgrade to Elite</Text>
            <Text style={styles.upgradeBannerText}>
              Unlock unlimited animals, AI predictions, and advanced analytics
            </Text>
          </View>
          <Text style={styles.upgradeBannerArrow}>→</Text>
        </TouchableOpacity>

        {/* Usage Summary */}
        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>📊 Your Usage</Text>
          <View style={styles.usageStats}>
            <View style={styles.usageStat}>
              <Text style={styles.usageValue}>
                {currentProfile.stats.animalsManaged}/5
              </Text>
              <Text style={styles.usageLabel}>Animals</Text>
              <View style={styles.usageBar}>
                <View 
                  style={[
                    styles.usageBarFill, 
                    { width: `${(currentProfile.stats.animalsManaged / 5) * 100}%` }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.usageStat}>
              <Text style={styles.usageValue}>
                {currentProfile.stats.journalEntries}
              </Text>
              <Text style={styles.usageLabel}>Journal Entries</Text>
            </View>
            
            <View style={styles.usageStat}>
              <Text style={styles.usageValue}>
                {Math.round(currentProfile.stats.totalHoursLogged / 60)}
              </Text>
              <Text style={styles.usageLabel}>Hours Logged</Text>
            </View>
          </View>
        </View>

        {/* Available Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🛠️ Available Features</Text>
          
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => handleFeatureClick('animals')}
            >
              <Text style={styles.featureIcon}>🐄</Text>
              <Text style={styles.featureTitle}>Animal Management</Text>
              <Text style={styles.featureSubtitle}>Up to 5 animals</Text>
              <View style={styles.featureStatus}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => handleFeatureClick('journal')}
            >
              <Text style={styles.featureIcon}>📝</Text>
              <Text style={styles.featureTitle}>Basic Journal</Text>
              <Text style={styles.featureSubtitle}>Log daily activities</Text>
              <View style={styles.featureStatus}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={onNavigateToCalendar}
            >
              <Text style={styles.featureIcon}>📅</Text>
              <Text style={styles.featureTitle}>Event Calendar</Text>
              <Text style={styles.featureSubtitle}>Track upcoming events</Text>
              <View style={styles.featureStatus}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => handleFeatureClick('photos')}
            >
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureTitle}>Photo Capture</Text>
              <Text style={styles.featureSubtitle}>Up to 20 photos</Text>
              <View style={styles.featureStatus}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => handleFeatureClick('export')}
            >
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Basic Reports</Text>
              <Text style={styles.featureSubtitle}>CSV export only</Text>
              <View style={styles.featureStatus}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => setShowQRGenerator(true)}
            >
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureTitle}>Observer Access</Text>
              <Text style={styles.featureSubtitle}>Share with QR codes</Text>
              <View style={styles.featureStatus}>
                <Text style={styles.availableText}>Available</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Locked Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🔒 Upgrade to Unlock</Text>
          
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={[styles.featureCard, styles.lockedCard]}
              onPress={() => handleFeatureClick('ai_prediction')}
            >
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureTitle}>AI Predictions</Text>
              <Text style={styles.featureSubtitle}>Smart weight estimates</Text>
              <View style={[styles.featureStatus, styles.lockedStatus]}>
                <Text style={styles.lockedText}>Elite Only</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.featureCard, styles.lockedCard]}
              onPress={() => handleFeatureClick('advanced_analytics')}
            >
              <Text style={styles.featureIcon}>📈</Text>
              <Text style={styles.featureTitle}>Advanced Analytics</Text>
              <Text style={styles.featureSubtitle}>Detailed insights</Text>
              <View style={[styles.featureStatus, styles.lockedStatus]}>
                <Text style={styles.lockedText}>Elite Only</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.featureCard, styles.lockedCard]}
              onPress={onUpgrade}
            >
              <Text style={styles.featureIcon}>♾️</Text>
              <Text style={styles.featureTitle}>Unlimited Animals</Text>
              <Text style={styles.featureSubtitle}>No limits</Text>
              <View style={[styles.featureStatus, styles.lockedStatus]}>
                <Text style={styles.lockedText}>Elite Only</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.featureCard, styles.lockedCard]}
              onPress={onUpgrade}
            >
              <Text style={styles.featureIcon}>📤</Text>
              <Text style={styles.featureTitle}>All Export Formats</Text>
              <Text style={styles.featureSubtitle}>PDF, Excel, Schedule F</Text>
              <View style={[styles.featureStatus, styles.lockedStatus]}>
                <Text style={styles.lockedText}>Elite Only</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Getting Started Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Getting Started</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>1. Add your first animal to start tracking</Text>
            <Text style={styles.tipItem}>2. Take photos to document growth</Text>
            <Text style={styles.tipItem}>3. Log daily activities in your journal</Text>
            <Text style={styles.tipItem}>4. Export your data for reports</Text>
          </View>
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>⭐ Upgrade for Full Experience</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* QR Code Generator Modal */}
      {currentProfile && (
        <QRCodeGenerator
          studentId={currentProfile.id}
          studentName={currentProfile.name}
          visible={showQRGenerator}
          onClose={() => setShowQRGenerator(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tierText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  upgradeBanner: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeBannerIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  upgradeBannerContent: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  upgradeBannerText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 18,
  },
  upgradeBannerArrow: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageStat: {
    alignItems: 'center',
    flex: 1,
  },
  usageValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  usageBar: {
    width: 60,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#ffc107',
    borderRadius: 2,
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
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
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  lockedCard: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availableText: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '600',
  },
  lockedStatus: {
    backgroundColor: '#dc3545',
  },
  lockedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipsList: {
    marginBottom: 16,
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});