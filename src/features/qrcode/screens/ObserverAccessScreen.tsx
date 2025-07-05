import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { SimpleQRCodeAccess } from '../components/SimpleQRCodeAccess';
import { ObserverDashboard } from './ObserverDashboard';
import { ObserverDashboardData } from '../../../core/models/QRCode';

interface ObserverAccessScreenProps {
  onBack: () => void;
}

type ScreenState = 'welcome' | 'access' | 'dashboard';

export const ObserverAccessScreen: React.FC<ObserverAccessScreenProps> = ({
  onBack,
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [dashboardData, setDashboardData] = useState<ObserverDashboardData | null>(null);

  const handleAccessCode = () => {
    setCurrentScreen('access');
  };

  const handleAccessClose = () => {
    setCurrentScreen('welcome');
  };

  const handleAccessGranted = (data: ObserverDashboardData) => {
    setDashboardData(data);
    setCurrentScreen('dashboard');
  };

  const handleDashboardBack = () => {
    setCurrentScreen('welcome');
    setDashboardData(null);
  };


  const renderWelcomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Observer Access</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeIcon}>👥</Text>
          <Text style={styles.welcomeTitle}>FFA Project Observer</Text>
          <Text style={styles.welcomeSubtitle}>
            Get real-time access to student FFA project progress with a QR code or access token
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What You Can View:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🐄</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Animal Management</Text>
                <Text style={styles.featureDescription}>
                  View animal details, health status, and growth progress
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📝</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Journal Activities</Text>
                <Text style={styles.featureDescription}>
                  See daily work logs and skill development activities
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Financial Tracking</Text>
                <Text style={styles.featureDescription}>
                  Monitor project expenses, revenue, and profit/loss
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏥</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Health Records</Text>
                <Text style={styles.featureDescription}>
                  Access animal health information and alerts
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Progress Reports</Text>
                <Text style={styles.featureDescription}>
                  View milestones, achievements, and competency development
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.accessSection}>
          <Text style={styles.accessTitle}>Get Access:</Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleAccessCode}>
            <Text style={styles.primaryButtonIcon}>🔐</Text>
            <Text style={styles.primaryButtonText}>Enter Access Code</Text>
            <Text style={styles.primaryButtonSubtext}>Enter the code provided by the student</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🔒 Privacy & Security</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• All data is view-only - you cannot edit student information</Text>
            <Text style={styles.infoItem}>• Access can be revoked by the student at any time</Text>
            <Text style={styles.infoItem}>• QR codes may have expiration dates set by the student</Text>
            <Text style={styles.infoItem}>• Your access permissions are customized by the student</Text>
            <Text style={styles.infoItem}>• Data is updated in real-time from the student's project</Text>
          </View>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you're having trouble accessing a project, contact the student to:
          </Text>
          <Text style={styles.helpItem}>• Verify the access code hasn't expired</Text>
          <Text style={styles.helpItem}>• Generate a new access code with proper permissions</Text>
          <Text style={styles.helpItem}>• Share the access token from their QR code</Text>
          <Text style={styles.helpItem}>• Check that observer access is still active</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (currentScreen === 'access') {
    return (
      <SimpleQRCodeAccess
        visible={true}
        onClose={handleAccessClose}
        onAccessGranted={handleAccessGranted}
      />
    );
  }

  if (currentScreen === 'dashboard' && dashboardData) {
    return (
      <ObserverDashboard
        dashboardData={dashboardData}
        onBack={handleDashboardBack}
      />
    );
  }

  return renderWelcomeScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  accessSection: {
    marginBottom: 32,
  },
  accessTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  helpSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  helpItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});