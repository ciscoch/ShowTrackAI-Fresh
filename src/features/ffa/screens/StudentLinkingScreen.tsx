// =========================================================================
// Student Linking Screen - Generate Codes for Parent Connection
// =========================================================================
// Screen for students to generate linking codes for parent oversight
// Enables family engagement without requiring school mandates
// =========================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
  Share,
  Clipboard,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ParentOversightService } from '../../../core/services/ParentOversightService';

interface StudentLinkingScreenProps {
  onBack: () => void;
}

export const StudentLinkingScreen: React.FC<StudentLinkingScreenProps> = ({
  onBack,
}) => {
  const { user } = useAuth();
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkedParents, setLinkedParents] = useState<any[]>([]);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);

  const parentOversightService = new ParentOversightService();

  useEffect(() => {
    if (user?.id) {
      loadLinkedParents();
    }
  }, [user?.id]);

  const loadLinkedParents = async () => {
    if (!user?.id) return;

    try {
      // This would typically be a method to get parents linked to this student
      // For now, we'll use a placeholder
      const parents = await parentOversightService.getLinkedStudents(user.id);
      setLinkedParents(parents);
    } catch (error) {
      console.error('Error loading linked parents:', error);
    }
  };

  const handleGenerateCode = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to generate a linking code');
      return;
    }

    setIsGenerating(true);

    try {
      const code = await parentOversightService.generateLinkingCode(user.id);
      setLinkingCode(code);
      setCodeExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours from now
    } catch (error) {
      console.error('Error generating linking code:', error);
      Alert.alert('Error', 'Failed to generate linking code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareCode = async () => {
    if (!linkingCode) return;

    const message = `Hi! I'd like to share my FFA degree progress with you. Please download the ShowTrackAI app and use this linking code to connect to my account: ${linkingCode}

This code expires in 24 hours. You'll be able to view my progress and evidence submissions for FFA degree requirements.

Thanks for supporting my agricultural education journey!`;

    try {
      await Share.share({
        message,
        title: 'FFA Progress Sharing',
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const handleCopyCode = () => {
    if (!linkingCode) return;

    Clipboard.setString(linkingCode);
    Alert.alert('Copied!', 'Linking code copied to clipboard');
  };

  const formatCode = (code: string) => {
    // Format as 123 456
    if (code.length === 6) {
      return code.slice(0, 3) + ' ' + code.slice(3);
    }
    return code;
  };

  const renderInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>👨‍👩‍👧‍👦 Share Your Progress</Text>
      <Text style={styles.instructionsText}>
        Generate a linking code to share your FFA degree progress with your parents or guardians. 
        They'll be able to view your progress and provide feedback on your evidence submissions.
      </Text>
      <View style={styles.benefitsList}>
        <Text style={styles.benefitItem}>• Parents can view your degree progress</Text>
        <Text style={styles.benefitItem}>• Share evidence submissions for verification</Text>
        <Text style={styles.benefitItem}>• Receive feedback and encouragement</Text>
        <Text style={styles.benefitItem}>• Build family engagement in your FFA journey</Text>
      </View>
    </View>
  );

  const renderCodeSection = () => {
    if (!linkingCode) {
      return (
        <View style={styles.codeContainer}>
          <Text style={styles.codeTitle}>Generate Linking Code</Text>
          <Text style={styles.codeSubtitle}>
            Create a 6-digit code to share with your parents
          </Text>
          <TouchableOpacity
            style={[
              styles.generateButton,
              isGenerating && styles.generateButtonDisabled
            ]}
            onPress={handleGenerateCode}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate Code'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.codeContainer}>
        <Text style={styles.codeTitle}>Your Linking Code</Text>
        <View style={styles.codeDisplay}>
          <Text style={styles.codeText}>{formatCode(linkingCode)}</Text>
        </View>
        
        {codeExpiry && (
          <Text style={styles.expiryText}>
            Expires: {codeExpiry.toLocaleDateString()} at {codeExpiry.toLocaleTimeString()}
          </Text>
        )}

        <View style={styles.codeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyCode}
          >
            <Text style={styles.actionButtonText}>📋 Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShareCode}
          >
            <Text style={styles.shareButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newCodeButton}
          onPress={handleGenerateCode}
        >
          <Text style={styles.newCodeButtonText}>Generate New Code</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLinkedParents = () => {
    if (linkedParents.length === 0) {
      return (
        <View style={styles.linkedParentsContainer}>
          <Text style={styles.linkedParentsTitle}>👥 Connected Parents</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No parents connected yet. Share your linking code to get started!
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.linkedParentsContainer}>
        <Text style={styles.linkedParentsTitle}>👥 Connected Parents</Text>
        {linkedParents.map((parent, index) => (
          <View key={index} style={styles.parentItem}>
            <Text style={styles.parentName}>{parent.parent_name}</Text>
            <Text style={styles.parentRelationship}>{parent.relationship}</Text>
            <Text style={styles.parentDate}>
              Connected: {new Date(parent.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPrivacyInfo = () => (
    <View style={styles.privacyContainer}>
      <Text style={styles.privacyTitle}>🔒 Privacy & Control</Text>
      <Text style={styles.privacyText}>
        • You maintain full control over your data and progress
      </Text>
      <Text style={styles.privacyText}>
        • Parents have read-only access to your FFA progress
      </Text>
      <Text style={styles.privacyText}>
        • You can revoke access at any time
      </Text>
      <Text style={styles.privacyText}>
        • No school approval required for family sharing
      </Text>
      <Text style={styles.privacyText}>
        • Linking codes expire after 24 hours for security
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Connection</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderInstructions()}
        {renderCodeSection()}
        {renderLinkedParents()}
        {renderPrivacyInfo()}
      </ScrollView>
    </View>
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
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  codeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 150,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  codeDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shareButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  shareButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  newCodeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  newCodeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  linkedParentsContainer: {
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
  linkedParentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  parentItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  parentRelationship: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  parentDate: {
    fontSize: 12,
    color: '#666',
  },
  privacyContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
});