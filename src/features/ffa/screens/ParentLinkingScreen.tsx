// =========================================================================
// Parent Linking Screen - Connect Parents to Students
// =========================================================================
// Screen for parents to connect to their student's FFA progress using a linking code
// Provides secure family oversight without requiring school mandates
// =========================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ParentOversightService } from '../../../core/services/ParentOversightService';

interface ParentLinkingScreenProps {
  onBack: () => void;
  onLinkingSuccess: (studentId: string) => void;
}

export const ParentLinkingScreen: React.FC<ParentLinkingScreenProps> = ({
  onBack,
  onLinkingSuccess,
}) => {
  const { user } = useAuth();
  const [linkingCode, setLinkingCode] = useState('');
  const [relationship, setRelationship] = useState<'parent' | 'guardian' | 'caregiver'>('parent');
  const [isConnecting, setIsConnecting] = useState(false);

  const parentOversightService = new ParentOversightService();

  const handleConnect = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to connect to your student');
      return;
    }

    if (!linkingCode.trim()) {
      Alert.alert('Error', 'Please enter the linking code from your student');
      return;
    }

    if (linkingCode.length !== 6) {
      Alert.alert('Error', 'Linking code must be 6 digits');
      return;
    }

    setIsConnecting(true);

    try {
      const link = await parentOversightService.connectParentToStudent(
        user.id,
        linkingCode.trim(),
        relationship
      );

      Alert.alert(
        'Success!',
        'You have successfully connected to your student\'s FFA progress. You can now view their degree progress and evidence submissions.',
        [
          {
            text: 'OK',
            onPress: () => onLinkingSuccess(link.student_id),
          },
        ]
      );
    } catch (error) {
      console.error('Error connecting to student:', error);
      
      let errorMessage = 'Failed to connect to your student. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid linking code')) {
          errorMessage = 'Invalid linking code. Please check the code and try again.';
        } else if (error.message.includes('already been used')) {
          errorMessage = 'This linking code has already been used. Please ask your student for a new code.';
        } else if (error.message.includes('expired')) {
          errorMessage = 'This linking code has expired. Please ask your student for a new code.';
        }
      }

      Alert.alert('Connection Failed', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatLinkingCode = (text: string) => {
    // Remove any non-digit characters
    const digits = text.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limitedDigits = digits.slice(0, 6);
    
    // Add spaces for formatting (123 456)
    if (limitedDigits.length > 3) {
      return limitedDigits.slice(0, 3) + ' ' + limitedDigits.slice(3);
    }
    
    return limitedDigits;
  };

  const handleCodeChange = (text: string) => {
    const formatted = formatLinkingCode(text);
    setLinkingCode(formatted);
  };

  const renderRelationshipSelector = () => (
    <View style={styles.relationshipContainer}>
      <Text style={styles.sectionTitle}>Your Relationship to Student</Text>
      <View style={styles.relationshipButtons}>
        <TouchableOpacity
          style={[
            styles.relationshipButton,
            relationship === 'parent' && styles.relationshipButtonActive
          ]}
          onPress={() => setRelationship('parent')}
        >
          <Text style={[
            styles.relationshipButtonText,
            relationship === 'parent' && styles.relationshipButtonTextActive
          ]}>
            Parent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.relationshipButton,
            relationship === 'guardian' && styles.relationshipButtonActive
          ]}
          onPress={() => setRelationship('guardian')}
        >
          <Text style={[
            styles.relationshipButtonText,
            relationship === 'guardian' && styles.relationshipButtonTextActive
          ]}>
            Guardian
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.relationshipButton,
            relationship === 'caregiver' && styles.relationshipButtonActive
          ]}
          onPress={() => setRelationship('caregiver')}
        >
          <Text style={[
            styles.relationshipButtonText,
            relationship === 'caregiver' && styles.relationshipButtonTextActive
          ]}>
            Caregiver
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>🔗 How to Connect</Text>
      <View style={styles.instructionStep}>
        <Text style={styles.stepNumber}>1</Text>
        <Text style={styles.stepText}>
          Ask your student to generate a linking code in their FFA app
        </Text>
      </View>
      <View style={styles.instructionStep}>
        <Text style={styles.stepNumber}>2</Text>
        <Text style={styles.stepText}>
          Enter the 6-digit code they provide in the field below
        </Text>
      </View>
      <View style={styles.instructionStep}>
        <Text style={styles.stepNumber}>3</Text>
        <Text style={styles.stepText}>
          Select your relationship and connect to start viewing their progress
        </Text>
      </View>
    </View>
  );

  const renderPrivacyInfo = () => (
    <View style={styles.privacyContainer}>
      <Text style={styles.privacyTitle}>🔒 Privacy & Access</Text>
      <Text style={styles.privacyText}>
        • You'll have read-only access to your student's FFA degree progress
      </Text>
      <Text style={styles.privacyText}>
        • You can view evidence submissions and provide feedback
      </Text>
      <Text style={styles.privacyText}>
        • Your student maintains control over their data and can revoke access
      </Text>
      <Text style={styles.privacyText}>
        • No school or organizational approval is required
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect to Student</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderInstructions()}

        <View style={styles.codeInputContainer}>
          <Text style={styles.inputLabel}>Student's Linking Code</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="123 456"
            value={linkingCode}
            onChangeText={handleCodeChange}
            keyboardType="numeric"
            maxLength={7} // 6 digits + 1 space
            autoFocus={true}
          />
          <Text style={styles.helperText}>
            Enter the 6-digit code from your student's FFA app
          </Text>
        </View>

        {renderRelationshipSelector()}
        {renderPrivacyInfo()}

        <TouchableOpacity
          style={[
            styles.connectButton,
            isConnecting && styles.connectButtonDisabled
          ]}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? 'Connecting...' : 'Connect to Student'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  codeInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  relationshipContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  relationshipButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  relationshipButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  relationshipButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  relationshipButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  relationshipButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  privacyContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
    marginBottom: 4,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectButtonDisabled: {
    backgroundColor: '#ccc',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});