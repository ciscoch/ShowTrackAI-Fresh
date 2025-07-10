// =========================================================================
// Evidence Submission Screen - FFA Requirement Verification
// =========================================================================
// Screen for students to submit evidence for FFA degree requirements
// Supports photo, video, and text submissions with parent oversight
// =========================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ParentOversightService } from '../../../core/services/ParentOversightService';
import { ffaDegreeService } from '../../../core/services/FFADegreeService';
import { 
  FFADegreeLevel,
  ENHANCED_FFA_DEGREE_REQUIREMENTS,
} from '../../../core/models/FFADegreeTracker';
import { PhotoCapture } from '../../../shared/components/PhotoCapture';

interface EvidenceSubmissionScreenProps {
  onBack: () => void;
  degreeLevel: FFADegreeLevel;
  requirementKey: string;
  requirementTitle: string;
  requirementDescription: string;
}

type EvidenceType = 'text' | 'photo' | 'video';

export const EvidenceSubmissionScreen: React.FC<EvidenceSubmissionScreenProps> = ({
  onBack,
  degreeLevel,
  requirementKey,
  requirementTitle,
  requirementDescription,
}) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<EvidenceType>('text');
  const [textEvidence, setTextEvidence] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  const parentOversightService = new ParentOversightService();
  const userId = user?.id;

  const handleSubmitEvidence = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to submit evidence');
      return;
    }

    // Validate submission
    if (selectedType === 'text' && !textEvidence.trim()) {
      Alert.alert('Error', 'Please enter your evidence text');
      return;
    }

    if (selectedType === 'photo' && !photoUri) {
      Alert.alert('Error', 'Please take a photo for your evidence');
      return;
    }

    if (selectedType === 'video' && !videoUri) {
      Alert.alert('Error', 'Please record a video for your evidence');
      return;
    }

    setIsSubmitting(true);

    try {
      let evidenceData = '';
      let metadata = {};

      // Prepare evidence data based on type
      switch (selectedType) {
        case 'text':
          evidenceData = textEvidence;
          break;
        case 'photo':
          evidenceData = photoUri || '';
          metadata = {
            timestamp: new Date(),
            location: 'Unknown', // Could be enhanced with location services
          };
          break;
        case 'video':
          evidenceData = videoUri || '';
          metadata = {
            timestamp: new Date(),
            location: 'Unknown',
          };
          break;
      }

      // Submit evidence
      await parentOversightService.submitEvidence(
        userId,
        degreeLevel,
        requirementKey,
        selectedType,
        evidenceData,
        studentNotes || undefined,
        metadata
      );

      // Also update the requirement as completed in the degree tracking system
      await ffaDegreeService.updateDegreeRequirement(userId, {
        degree_level: degreeLevel,
        requirement_key: requirementKey,
        completed: true,
        notes: `Evidence submitted: ${selectedType} submission with parent oversight`,
      });

      Alert.alert(
        'Success!',
        'Your evidence has been submitted successfully. Your parent will be notified.',
        [
          {
            text: 'OK',
            onPress: onBack,
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting evidence:', error);
      Alert.alert('Error', 'Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoCapture = (uri: string) => {
    setPhotoUri(uri);
    setShowPhotoCapture(false);
  };

  const renderEvidenceTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={styles.sectionTitle}>Evidence Type</Text>
      <View style={styles.typeButtons}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === 'text' && styles.typeButtonActive
          ]}
          onPress={() => setSelectedType('text')}
        >
          <Text style={styles.typeButtonIcon}>📝</Text>
          <Text style={[
            styles.typeButtonText,
            selectedType === 'text' && styles.typeButtonTextActive
          ]}>
            Text
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === 'photo' && styles.typeButtonActive
          ]}
          onPress={() => setSelectedType('photo')}
        >
          <Text style={styles.typeButtonIcon}>📸</Text>
          <Text style={[
            styles.typeButtonText,
            selectedType === 'photo' && styles.typeButtonTextActive
          ]}>
            Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === 'video' && styles.typeButtonActive
          ]}
          onPress={() => setSelectedType('video')}
        >
          <Text style={styles.typeButtonIcon}>🎥</Text>
          <Text style={[
            styles.typeButtonText,
            selectedType === 'video' && styles.typeButtonTextActive
          ]}>
            Video
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTextSubmission = () => (
    <View style={styles.submissionContainer}>
      <Text style={styles.inputLabel}>Your Evidence Text</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Describe your evidence, what you learned, or provide detailed information..."
        value={textEvidence}
        onChangeText={setTextEvidence}
        multiline={true}
        numberOfLines={6}
        textAlignVertical="top"
      />
      <Text style={styles.helperText}>
        For text evidence, provide detailed information about how you've met this requirement.
      </Text>
    </View>
  );

  const renderPhotoSubmission = () => (
    <View style={styles.submissionContainer}>
      <Text style={styles.inputLabel}>Photo Evidence</Text>
      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => setShowPhotoCapture(true)}
          >
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => setShowPhotoCapture(true)}
        >
          <Text style={styles.captureButtonIcon}>📸</Text>
          <Text style={styles.captureButtonText}>Take Photo</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.helperText}>
        Take a clear photo that demonstrates your completion of this requirement.
      </Text>
    </View>
  );

  const renderVideoSubmission = () => (
    <View style={styles.submissionContainer}>
      <Text style={styles.inputLabel}>Video Evidence</Text>
      {videoUri ? (
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>Video Recorded</Text>
            <Text style={styles.videoFilename}>
              {videoUri.split('/').pop()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => {
              Alert.alert('Video Recording', 'Video recording feature coming soon!');
            }}
          >
            <Text style={styles.retakeButtonText}>Record Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => {
            Alert.alert('Video Recording', 'Video recording feature coming soon!');
          }}
        >
          <Text style={styles.captureButtonIcon}>🎥</Text>
          <Text style={styles.captureButtonText}>Record Video</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.helperText}>
        Record a video demonstrating your completion of this requirement (e.g., reciting the FFA Creed).
      </Text>
    </View>
  );

  const renderNotesSection = () => (
    <View style={styles.notesContainer}>
      <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Add any additional context or notes about your submission..."
        value={studentNotes}
        onChangeText={setStudentNotes}
        multiline={true}
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );

  const renderSubmissionInfo = () => (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>📋 Parent Oversight</Text>
      <Text style={styles.infoText}>
        Your evidence submission will be shared with your parent/guardian for review and feedback. 
        This helps ensure accountability and family engagement in your FFA journey.
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
        <Text style={styles.headerTitle}>Submit Evidence</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.requirementHeader}>
          <Text style={styles.requirementTitle}>{requirementTitle}</Text>
          <Text style={styles.requirementDescription}>
            {requirementDescription}
          </Text>
        </View>

        {renderEvidenceTypeSelector()}

        {selectedType === 'text' && renderTextSubmission()}
        {selectedType === 'photo' && renderPhotoSubmission()}
        {selectedType === 'video' && renderVideoSubmission()}

        {renderNotesSection()}
        {renderSubmissionInfo()}

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitEvidence}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {showPhotoCapture && (
        <PhotoCapture
          onPhotoTaken={handlePhotoCapture}
          onCancel={() => setShowPhotoCapture(false)}
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
  requirementHeader: {
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
  requirementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  typeSelector: {
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
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  typeButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  submissionContainer: {
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
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  captureButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  captureButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  photoContainer: {
    marginBottom: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  retakeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  videoContainer: {
    marginBottom: 8,
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  videoPlaceholderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  videoFilename: {
    fontSize: 12,
    color: '#999',
  },
  notesContainer: {
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
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  infoContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});