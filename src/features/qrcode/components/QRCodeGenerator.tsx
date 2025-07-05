import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { qrCodeService } from '../../../core/services/QRCodeService';
import { ObserverAccess, ObserverPermissions, QRCodeData } from '../../../core/models/QRCode';

interface QRCodeGeneratorProps {
  studentId: string;
  studentName: string;
  visible: boolean;
  onClose: () => void;
}

type ObserverType = 'parent' | 'teacher' | 'organization' | 'mentor';

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  studentId,
  studentName,
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<QRCodeData | null>(null);
  const [selectedObserverType, setSelectedObserverType] = useState<ObserverType>('parent');
  const [observerName, setObserverName] = useState('');
  const [customPermissions, setCustomPermissions] = useState<Partial<ObserverPermissions>>({});
  const [expirationDays, setExpirationDays] = useState<number | undefined>(30);

  const observerTypes: Array<{type: ObserverType, label: string, icon: string}> = [
    { type: 'parent', label: 'Parent/Guardian', icon: '👨‍👩‍👧‍👦' },
    { type: 'teacher', label: 'Teacher/Educator', icon: '👨‍🏫' },
    { type: 'organization', label: 'Organization', icon: '🏢' },
    { type: 'mentor', label: 'Mentor/Coach', icon: '🎯' },
  ];

  const expirationOptions = [
    { days: 7, label: '1 Week' },
    { days: 30, label: '1 Month' },
    { days: 90, label: '3 Months' },
    { days: 365, label: '1 Year' },
    { days: undefined, label: 'Never Expires' },
  ];

  const generateQRCode = async () => {
    if (!observerName.trim()) {
      Alert.alert('Error', 'Please enter the observer name');
      return;
    }

    try {
      setLoading(true);
      
      // Generate observer access
      const observerAccess = await qrCodeService.generateObserverAccess(
        studentId,
        selectedObserverType,
        observerName.trim(),
        undefined,
        customPermissions,
        expirationDays
      );

      // Generate QR code data
      const qrCodeData = await qrCodeService.generateQRCodeData(studentId, observerAccess, studentName);
      setGeneratedQRCode(qrCodeData);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareQRCode = async () => {
    if (!generatedQRCode) return;

    try {
      const shareMessage = `
🐄 FFA Project Observer Access

Student: ${generatedQRCode.studentName}
Project: ${generatedQRCode.projectName}

Scan this QR code with the ShowTrackAI app to observe ${generatedQRCode.studentName}'s FFA project progress.

Access Token: ${generatedQRCode.accessToken}
${generatedQRCode.expiresAt ? `Expires: ${generatedQRCode.expiresAt.toLocaleDateString()}` : 'No Expiration'}

Download ShowTrackAI: [App Store/Play Store Link]
      `.trim();

      await Share.share({
        message: shareMessage,
        title: `${generatedQRCode.studentName}'s FFA Project Access`,
      });
    } catch (error) {
      console.error('Failed to share QR code:', error);
    }
  };

  const resetForm = () => {
    setGeneratedQRCode(null);
    setObserverName('');
    setCustomPermissions({});
    setExpirationDays(30);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const togglePermission = (permission: keyof ObserverPermissions) => {
    setCustomPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const getDefaultPermissions = (type: ObserverType): ObserverPermissions => {
    return {
      viewAnimals: true,
      viewJournal: type === 'parent' || type === 'teacher',
      viewFinancials: type === 'parent',
      viewHealthRecords: true,
      viewProgress: true,
      receiveNotifications: type === 'parent' || type === 'teacher',
      viewCompetencies: type === 'teacher',
    };
  };

  const getCurrentPermissions = (): ObserverPermissions => {
    const defaults = getDefaultPermissions(selectedObserverType);
    return { ...defaults, ...customPermissions };
  };

  const renderPermissionToggle = (permission: keyof ObserverPermissions, label: string, description: string) => {
    const currentPermissions = getCurrentPermissions();
    const isEnabled = currentPermissions[permission];

    return (
      <TouchableOpacity
        key={permission}
        style={styles.permissionItem}
        onPress={() => togglePermission(permission)}
      >
        <View style={styles.permissionContent}>
          <Text style={styles.permissionLabel}>{label}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
        <View style={[styles.permissionToggle, isEnabled && styles.permissionToggleActive]}>
          <Text style={[styles.permissionToggleText, isEnabled && styles.permissionToggleTextActive]}>
            {isEnabled ? '✓' : '✕'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSetupStep = () => (
    <ScrollView style={styles.setupContainer}>
      <Text style={styles.title}>Generate Observer QR Code</Text>
      <Text style={styles.subtitle}>
        Create a QR code for others to observe {studentName}'s FFA project
      </Text>

      {/* Observer Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observer Type</Text>
        <View style={styles.observerTypeGrid}>
          {observerTypes.map((type) => (
            <TouchableOpacity
              key={type.type}
              style={[
                styles.observerTypeCard,
                selectedObserverType === type.type && styles.observerTypeCardActive
              ]}
              onPress={() => setSelectedObserverType(type.type)}
            >
              <Text style={styles.observerTypeIcon}>{type.icon}</Text>
              <Text style={styles.observerTypeLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Observer Name Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observer Name</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.textInputWrapper}>
            <Text 
              style={[styles.textInput, !observerName && styles.textInputPlaceholder]}
              onPress={() => {
                // In a real app, you'd use TextInput here
                Alert.prompt(
                  'Enter Observer Name',
                  'Please enter the full name of the person who will observe the project:',
                  (text) => setObserverName(text || ''),
                  'plain-text',
                  observerName
                );
              }}
            >
              {observerName || 'Tap to enter name...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Permissions</Text>
        <Text style={styles.sectionDescription}>
          Customize what the observer can view. Default permissions are set based on observer type.
        </Text>
        
        {renderPermissionToggle('viewAnimals', 'View Animals', 'See animal details and photos')}
        {renderPermissionToggle('viewJournal', 'View Journal Entries', 'Read daily work logs and activities')}
        {renderPermissionToggle('viewFinancials', 'View Financial Records', 'See project expenses and revenue')}
        {renderPermissionToggle('viewHealthRecords', 'View Health Records', 'Access animal health information')}
        {renderPermissionToggle('viewProgress', 'View Progress Reports', 'See project milestones and achievements')}
        {renderPermissionToggle('viewCompetencies', 'View Competencies', 'See skill development progress')}
        {renderPermissionToggle('receiveNotifications', 'Receive Notifications', 'Get updates on project milestones')}
      </View>

      {/* Expiration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Duration</Text>
        <View style={styles.expirationGrid}>
          {expirationOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.expirationCard,
                expirationDays === option.days && styles.expirationCardActive
              ]}
              onPress={() => setExpirationDays(option.days)}
            >
              <Text style={styles.expirationLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, (!observerName.trim() || loading) && styles.generateButtonDisabled]}
        onPress={generateQRCode}
        disabled={!observerName.trim() || loading}
      >
        <Text style={styles.generateButtonText}>
          {loading ? 'Generating...' : 'Generate QR Code'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderQRCodeResult = () => (
    <ScrollView style={styles.resultContainer}>
      <Text style={styles.title}>QR Code Generated!</Text>
      <Text style={styles.subtitle}>
        Share this QR code with {observerName} to grant access to {studentName}'s project
      </Text>

      {/* QR Code Display */}
      <View style={styles.qrCodeContainer}>
        <QRCode
          value={JSON.stringify({
            accessToken: generatedQRCode!.accessToken,
            studentName: generatedQRCode!.studentName,
            projectName: generatedQRCode!.projectName,
          })}
          size={200}
          backgroundColor="white"
          color="black"
        />
      </View>

      {/* Access Details */}
      <View style={styles.accessDetails}>
        <View style={styles.accessDetailRow}>
          <Text style={styles.accessDetailLabel}>Observer:</Text>
          <Text style={styles.accessDetailValue}>{observerName}</Text>
        </View>
        <View style={styles.accessDetailRow}>
          <Text style={styles.accessDetailLabel}>Type:</Text>
          <Text style={styles.accessDetailValue}>
            {observerTypes.find(t => t.type === selectedObserverType)?.label}
          </Text>
        </View>
        <View style={styles.accessDetailRow}>
          <Text style={styles.accessDetailLabel}>Generated:</Text>
          <Text style={styles.accessDetailValue}>
            {generatedQRCode!.generatedAt.toLocaleString()}
          </Text>
        </View>
        {generatedQRCode!.expiresAt && (
          <View style={styles.accessDetailRow}>
            <Text style={styles.accessDetailLabel}>Expires:</Text>
            <Text style={styles.accessDetailValue}>
              {generatedQRCode!.expiresAt.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.shareButton} onPress={shareQRCode}>
          <Text style={styles.shareButtonText}>📤 Share QR Code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.newQRButton} onPress={resetForm}>
          <Text style={styles.newQRButtonText}>Create Another</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Observer Access</Text>
          <View style={styles.headerSpacer} />
        </View>

        {generatedQRCode ? renderQRCodeResult() : renderSetupStep()}
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
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 26,
  },
  setupContainer: {
    flex: 1,
    padding: 20,
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  observerTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  observerTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  observerTypeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  observerTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  observerTypeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
  },
  textInputPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  permissionContent: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
  },
  permissionToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionToggleActive: {
    backgroundColor: '#28a745',
  },
  permissionToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  permissionToggleTextActive: {
    color: '#fff',
  },
  expirationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expirationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: '30%',
    alignItems: 'center',
  },
  expirationCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  expirationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  qrCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accessDetails: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  accessDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accessDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  accessDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  newQRButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  newQRButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});