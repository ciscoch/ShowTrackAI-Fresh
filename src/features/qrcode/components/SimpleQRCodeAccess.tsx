import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { qrCodeService } from '../../../core/services/QRCodeService';
import { ObserverDashboardData } from '../../../core/models/QRCode';
import { DemoAccessGenerator } from '../utils/DemoAccessGenerator';

interface SimpleQRCodeAccessProps {
  visible: boolean;
  onClose: () => void;
  onAccessGranted: (dashboardData: ObserverDashboardData) => void;
}

export const SimpleQRCodeAccess: React.FC<SimpleQRCodeAccessProps> = ({
  visible,
  onClose,
  onAccessGranted,
}) => {
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccessSubmit = async () => {
    if (!accessToken.trim()) {
      Alert.alert('Error', 'Please enter an access token');
      return;
    }

    setLoading(true);

    try {
      // Try to parse as JSON first (from QR code), then fall back to plain token
      let qrData;
      try {
        qrData = JSON.parse(accessToken.trim());
      } catch (error) {
        qrData = { accessToken: accessToken.trim() };
      }

      if (!qrData.accessToken) {
        Alert.alert(
          'Invalid Access Code',
          'This access code is not in the correct format.',
          [{ text: 'Try Again' }]
        );
        return;
      }

      // Validate access and get dashboard data
      const dashboardData = await qrCodeService.getObserverDashboardData(qrData.accessToken);

      if (!dashboardData) {
        Alert.alert(
          'Access Denied',
          'This access code is invalid, expired, or has been revoked. Please contact the student for a new access code.',
          [{ text: 'Try Again' }]
        );
        return;
      }

      // Success! Grant access
      Alert.alert(
        'Access Granted!',
        `Welcome! You now have observer access to ${dashboardData.student.studentName}'s FFA project.`,
        [
          {
            text: 'View Project',
            onPress: () => {
              setAccessToken('');
              onClose();
              onAccessGranted(dashboardData);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Failed to process access token:', error);
      Alert.alert(
        'Error',
        'Failed to process access token. Please try again.',
        [{ text: 'Try Again' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAccessToken('');
    onClose();
  };

  const handleDemoAccess = async () => {
    try {
      // Generate a demo QR code JSON with access token
      const demoQRCode = DemoAccessGenerator.getQuickDemoQRCodeJSON();
      setAccessToken(demoQRCode);
      
      Alert.alert(
        'Demo Access Code',
        'A demo QR code has been filled in. This simulates scanning a QR code from a student. Tap "Submit Access Code" to try it out.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to generate demo access:', error);
      Alert.alert('Error', 'Failed to generate demo access code.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Observer Access</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeIcon}>🔐</Text>
            <Text style={styles.welcomeTitle}>Enter Access Code</Text>
            <Text style={styles.welcomeSubtitle}>
              Enter the access code provided by the student to view their FFA project
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Access Code</Text>
            <TextInput
              style={styles.textInput}
              value={accessToken}
              onChangeText={setAccessToken}
              placeholder="Enter access token or paste QR code data"
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={3}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputHelp}>
              💡 This can be the access token directly or the full QR code data (JSON format)
            </Text>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAccessSubmit}
              disabled={loading || !accessToken.trim()}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Validating...' : 'Submit Access Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoButton} onPress={handleDemoAccess}>
              <Text style={styles.demoButtonText}>🎮 Try Demo Access</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How to get an access code:</Text>
            <Text style={styles.infoItem}>1. Ask the student to generate a QR code for you</Text>
            <Text style={styles.infoItem}>2. Scan the QR code with any QR scanner app</Text>
            <Text style={styles.infoItem}>3. Copy and paste the result here</Text>
            <Text style={styles.infoItem}>4. Or ask for the access token directly</Text>
          </View>

          <View style={styles.securitySection}>
            <Text style={styles.securityTitle}>🔒 Security & Privacy</Text>
            <Text style={styles.securityItem}>• All data is view-only</Text>
            <Text style={styles.securityItem}>• Access can be revoked by the student</Text>
            <Text style={styles.securityItem}>• Codes may have expiration dates</Text>
            <Text style={styles.securityItem}>• Your permissions are set by the student</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
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
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 26,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  inputHelp: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  actionSection: {
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  demoButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoSection: {
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
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  securitySection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  securityItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
});