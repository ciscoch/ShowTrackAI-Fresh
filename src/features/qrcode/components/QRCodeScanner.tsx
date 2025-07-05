import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { qrCodeService } from '../../../core/services/QRCodeService';
import { ObserverDashboardData } from '../../../core/models/QRCode';

interface QRCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onAccessGranted: (dashboardData: ObserverDashboardData) => void;
}

const { width, height } = Dimensions.get('window');

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  visible,
  onClose,
  onAccessGranted,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      getCameraPermissions();
      setScanned(false);
    }
  }, [visible]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (error) {
        // If it's not JSON, treat as plain access token
        qrData = { accessToken: data };
      }

      if (!qrData.accessToken) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid observer access information.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      // Validate access and get dashboard data
      const dashboardData = await qrCodeService.getObserverDashboardData(qrData.accessToken);

      if (!dashboardData) {
        Alert.alert(
          'Access Denied',
          'This QR code is invalid, expired, or has been revoked. Please contact the student for a new QR code.',
          [
            { text: 'Try Again', onPress: () => setScanned(false) },
            { text: 'Cancel', onPress: onClose }
          ]
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
              onClose();
              onAccessGranted(dashboardData);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Failed to process QR code:', error);
      Alert.alert(
        'Error',
        'Failed to process QR code. Please try again.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionRequest = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionIcon}>📷</Text>
      <Text style={styles.permissionTitle}>Camera Permission Required</Text>
      <Text style={styles.permissionText}>
        We need camera access to scan QR codes for observer access to student projects.
      </Text>
      <TouchableOpacity 
        style={styles.permissionButton}
        onPress={getCameraPermissions}
      >
        <Text style={styles.permissionButtonText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScanner = () => (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View style={styles.overlayTop}>
          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>
        </View>

        {/* Middle section with scanner frame */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayLeft} />
          <View style={styles.scannerFrame}>
            <View style={styles.scannerCorner} />
            <View style={[styles.scannerCorner, styles.scannerCornerTopRight]} />
            <View style={[styles.scannerCorner, styles.scannerCornerBottomLeft]} />
            <View style={[styles.scannerCorner, styles.scannerCornerBottomRight]} />
            
            {loading && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </View>
          <View style={styles.overlayRight} />
        </View>

        {/* Bottom overlay */}
        <View style={styles.overlayBottom}>
          <View style={styles.bottomContent}>
            <Text style={styles.helpText}>
              💡 Scan the QR code shared by the student to get observer access to their FFA project
            </Text>
            
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => {
                Alert.prompt(
                  'Manual Entry',
                  'Enter the access token manually:',
                  async (token) => {
                    if (token) {
                      await handleBarCodeScanned({ data: token });
                    }
                  },
                  'plain-text'
                );
              }}
            >
              <Text style={styles.manualButtonText}>Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return renderPermissionRequest();
    }

    return renderScanner();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Observer QR Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderContent()}
      </View>
    </Modal>
  );
};

const frameSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#007AFF',
    zIndex: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#000',
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: frameSize,
  },
  overlayLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scannerFrame: {
    width: frameSize,
    height: frameSize,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#fff',
    top: -2,
    left: -2,
  },
  scannerCornerTopRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderLeftWidth: 0,
  },
  scannerCornerBottomLeft: {
    bottom: -2,
    top: 'auto',
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
  },
  scannerCornerBottomRight: {
    bottom: -2,
    right: -2,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  bottomContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  helpText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  manualButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  manualButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});