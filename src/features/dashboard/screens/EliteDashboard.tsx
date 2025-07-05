import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { QRCodeGenerator } from '../../qrcode/components/QRCodeGenerator';

interface EliteDashboardProps {
  onSwitchProfile: () => void;
  onShowSettings: () => void;
  onNavigateToAnimals: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToAI: () => void;
  onNavigateToExport: () => void;
  onNavigateToJournal: () => void;
  onNavigateToFinancial: () => void;
  onNavigateToMedical: () => void;
}

export const EliteDashboard: React.FC<EliteDashboardProps> = ({
  onSwitchProfile,
  onShowSettings,
  onNavigateToAnimals,
  onNavigateToAnalytics,
  onNavigateToAI,
  onNavigateToExport,
  onNavigateToJournal,
  onNavigateToFinancial,
  onNavigateToMedical,
}) => {
  const { currentProfile } = useProfileStore();
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  if (!currentProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No profile selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.profileName}>{currentProfile.name}</Text>
          <Text style={styles.profileType}>Elite Student • {currentProfile.school}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>⭐ ELITE</Text>
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
        {/* Elite Benefits Banner */}
        <View style={styles.eliteBanner}>
          <Text style={styles.eliteBannerIcon}>🎉</Text>
          <View style={styles.eliteBannerContent}>
            <Text style={styles.eliteBannerTitle}>Elite Features Unlocked!</Text>
            <Text style={styles.eliteBannerText}>
              Enjoy unlimited animals, AI predictions, and advanced analytics
            </Text>
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📈 Your Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentProfile.stats.animalsManaged}</Text>
              <Text style={styles.statLabel}>Animals Managed</Text>
              <Text style={styles.statNote}>Unlimited ♾️</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentProfile.stats.journalEntries}</Text>
              <Text style={styles.statLabel}>Journal Entries</Text>
              <Text style={styles.statNote}>Advanced logging</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(currentProfile.stats.totalHoursLogged / 60)}</Text>
              <Text style={styles.statLabel}>Hours Logged</Text>
              <Text style={styles.statNote}>AI insights</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentProfile.stats.achievementsEarned}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
              <Text style={styles.statNote}>Elite rewards</Text>
            </View>
          </View>
        </View>

        {/* Premium Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🎓 Elite Student Features</Text>
          
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={styles.premiumFeatureCard}
              onPress={onNavigateToAnimals}
            >
              <Text style={styles.featureIcon}>🐄</Text>
              <Text style={styles.featureTitle}>Unlimited Animals</Text>
              <Text style={styles.featureSubtitle}>No limits on your herd</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>ELITE</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.premiumFeatureCard}
              onPress={onNavigateToAI}
            >
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureTitle}>AI Predictions</Text>
              <Text style={styles.featureSubtitle}>91.6% accuracy rate</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>ELITE</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.premiumFeatureCard}
              onPress={onNavigateToAnalytics}
            >
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Advanced Analytics</Text>
              <Text style={styles.featureSubtitle}>Deep insights & trends</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>ELITE</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.premiumFeatureCard}
              onPress={onNavigateToExport}
            >
              <Text style={styles.featureIcon}>📤</Text>
              <Text style={styles.featureTitle}>All Export Formats</Text>
              <Text style={styles.featureSubtitle}>PDF, Excel, Schedule F</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>ELITE</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Standard Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>📚 Student Project Management</Text>
          
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={onNavigateToJournal}
            >
              <Text style={styles.featureIcon}>📝</Text>
              <Text style={styles.featureTitle}>Advanced Journal</Text>
              <Text style={styles.featureSubtitle}>AET skill tracking</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureTitle}>Unlimited Photos</Text>
              <Text style={styles.featureSubtitle}>Smart organization</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎓</Text>
              <Text style={styles.featureTitle}>FFA Integration</Text>
              <Text style={styles.featureSubtitle}>SAE project tracking</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={onNavigateToFinancial}
            >
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureTitle}>Financial Tracking</Text>
              <Text style={styles.featureSubtitle}>Expenses & income</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard}
              onPress={onNavigateToMedical}
            >
              <Text style={styles.featureIcon}>🏥</Text>
              <Text style={styles.featureTitle}>Medical Records</Text>
              <Text style={styles.featureSubtitle}>Health tracking & vet records</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Insights Card */}
        <View style={styles.aiInsightsCard}>
          <Text style={styles.aiInsightsTitle}>🤖 AI Insights</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiInsightIcon}>📈</Text>
            <View style={styles.aiInsightContent}>
              <Text style={styles.aiInsightText}>
                Your animals are showing optimal growth patterns. Consider increasing feed by 5% for maximum efficiency.
              </Text>
              <Text style={styles.aiInsightConfidence}>Confidence: 94%</Text>
            </View>
          </View>
          
          <View style={styles.aiInsight}>
            <Text style={styles.aiInsightIcon}>⚠️</Text>
            <View style={styles.aiInsightContent}>
              <Text style={styles.aiInsightText}>
                Animal #A001 weight variance detected. Recommend health check within 3 days.
              </Text>
              <Text style={styles.aiInsightConfidence}>Confidence: 87%</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>View All AI Recommendations</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsList}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text style={styles.quickActionText}>Add Animal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={onNavigateToJournal}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionText}>Log Activity</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>📸</Text>
              <Text style={styles.quickActionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Generate Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => setShowQRGenerator(true)}
            >
              <Text style={styles.quickActionIcon}>📱</Text>
              <Text style={styles.quickActionText}>Share QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Banner */}
        <View style={styles.supportBanner}>
          <Text style={styles.supportIcon}>🎧</Text>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Elite Priority Support</Text>
            <Text style={styles.supportText}>
              Need help? Elite members get priority support with faster response times.
            </Text>
          </View>
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact</Text>
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
    backgroundColor: '#007AFF',
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
  profileType: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
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
  eliteBanner: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  eliteBannerIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  eliteBannerContent: {
    flex: 1,
  },
  eliteBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  eliteBannerText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 18,
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    padding: 12,
    borderRadius: 8,
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
    marginBottom: 2,
  },
  statNote: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
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
  premiumFeatureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#007AFF',
    position: 'relative',
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
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  aiInsightsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  aiInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  aiInsightIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  aiInsightContent: {
    flex: 1,
  },
  aiInsightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  aiInsightConfidence: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '500',
  },
  aiButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsCard: {
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
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  supportBanner: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  supportIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 2,
  },
  supportText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  supportButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});