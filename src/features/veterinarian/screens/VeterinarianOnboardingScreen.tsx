import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { veterinarianService } from '../../../core/services/VeterinarianService';
import { 
  OnboardingStep, 
  VetOnboardingProgress, 
  StepProgress,
  VetPersonalInfo,
  VetProfessionalInfo,
  Address,
  EmergencyContact,
  ClinicInfo,
  VeterinaryLicense,
  InsuranceInfo
} from '../../../core/models/VeterinarianProfile';

interface VeterinarianOnboardingScreenProps {
  onComplete: (veterinarianId: string) => void;
  onBack: () => void;
}

export const VeterinarianOnboardingScreen: React.FC<VeterinarianOnboardingScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal_info');
  const [onboardingProgress, setOnboardingProgress] = useState<VetOnboardingProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Form data states
  const [personalInfo, setPersonalInfo] = useState<VetPersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    biography: '',
    languages: ['English'],
    timeZone: 'America/New_York',
  });

  const [professionalInfo, setProfessionalInfo] = useState<VetProfessionalInfo>({
    clinicInfo: {
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      phone: '',
      type: 'mixed',
      services: [],
    },
    primaryLicense: {
      licenseNumber: '',
      state: '',
      issuedDate: new Date(),
      expirationDate: new Date(),
      status: 'active',
      boardName: '',
      verificationStatus: 'pending',
    },
    additionalLicenses: [],
    professionalHistory: [],
    malpracticeInsurance: {
      provider: '',
      policyNumber: '',
      coverageAmount: 0,
      expirationDate: new Date(),
      status: 'active',
      telemedicineIncluded: false,
    },
  });

  const [veterinarianId, setVeterinarianId] = useState<string>('');

  useEffect(() => {
    if (veterinarianId) {
      loadOnboardingProgress();
    }
  }, [veterinarianId]);

  const loadOnboardingProgress = async () => {
    try {
      const progress = await veterinarianService.getOnboardingProgress(veterinarianId);
      if (progress) {
        setOnboardingProgress(progress);
        setCurrentStep(progress.currentStep);
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    }
  };

  const handleCreateProfile = async () => {
    if (!validatePersonalInfo()) return;
    
    try {
      setLoading(true);
      const profile = await veterinarianService.createVeterinarianProfile(
        personalInfo,
        professionalInfo
      );
      setVeterinarianId(profile.id);
      
      // Move to next step
      await handleStepComplete('personal_info');
    } catch (error) {
      console.error('Failed to create profile:', error);
      Alert.alert('Error', 'Failed to create veterinarian profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (step: OnboardingStep) => {
    try {
      setLoading(true);
      const progress = await veterinarianService.updateOnboardingStep(
        veterinarianId,
        step,
        { status: 'completed' }
      );
      setOnboardingProgress(progress);
      setCurrentStep(progress.currentStep);
      
      if (progress.completedAt) {
        // Onboarding complete
        onComplete(veterinarianId);
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      Alert.alert('Error', 'Failed to complete onboarding step');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (documents: string[]) => {
    setSelectedDocuments(documents);
    setShowDocumentModal(false);
    // In a real app, this would handle actual document upload
    Alert.alert('Documents', `${documents.length} documents selected for upload`);
  };

  const validatePersonalInfo = (): boolean => {
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.email || !personalInfo.phone) {
      Alert.alert('Validation Error', 'Please fill in all required personal information fields');
      return false;
    }
    if (!personalInfo.emergencyContact.name || !personalInfo.emergencyContact.phone) {
      Alert.alert('Validation Error', 'Please provide emergency contact information');
      return false;
    }
    return true;
  };

  const validateProfessionalInfo = (): boolean => {
    if (!professionalInfo.clinicInfo.name || !professionalInfo.primaryLicense.licenseNumber) {
      Alert.alert('Validation Error', 'Please fill in clinic and license information');
      return false;
    }
    return true;
  };

  const renderStepIndicator = () => {
    const steps: OnboardingStep[] = [
      'personal_info',
      'professional_info',
      'license_verification',
      'education_verification',
      'insurance_verification',
      'specialization_assessment',
      'platform_training',
      'educational_training',
      'trial_consultations',
      'final_approval'
    ];

    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.stepIndicator}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                index <= currentIndex ? styles.stepActiveCircle : styles.stepInactiveCircle
              ]}>
                <Text style={[
                  styles.stepNumber,
                  index <= currentIndex ? styles.stepActiveNumber : styles.stepInactiveNumber
                ]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.stepLabel}>
                {step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPersonalInfoForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="First Name *"
        value={personalInfo.firstName}
        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, firstName: text }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Last Name *"
        value={personalInfo.lastName}
        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, lastName: text }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email Address *"
        value={personalInfo.email}
        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, email: text }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Phone Number *"
        value={personalInfo.phone}
        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phone: text }))}
        keyboardType="phone-pad"
      />
      
      <Text style={styles.subsectionTitle}>Emergency Contact</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Emergency Contact Name *"
        value={personalInfo.emergencyContact.name}
        onChangeText={(text) => setPersonalInfo(prev => ({
          ...prev,
          emergencyContact: { ...prev.emergencyContact, name: text }
        }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Relationship *"
        value={personalInfo.emergencyContact.relationship}
        onChangeText={(text) => setPersonalInfo(prev => ({
          ...prev,
          emergencyContact: { ...prev.emergencyContact, relationship: text }
        }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Emergency Contact Phone *"
        value={personalInfo.emergencyContact.phone}
        onChangeText={(text) => setPersonalInfo(prev => ({
          ...prev,
          emergencyContact: { ...prev.emergencyContact, phone: text }
        }))}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Professional Biography"
        value={personalInfo.biography}
        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, biography: text }))}
        multiline
        numberOfLines={4}
      />
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleCreateProfile}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'Creating Profile...' : 'Create Profile & Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfessionalInfoForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Professional Information</Text>
      
      <Text style={styles.subsectionTitle}>Clinic Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Clinic Name *"
        value={professionalInfo.clinicInfo.name}
        onChangeText={(text) => setProfessionalInfo(prev => ({
          ...prev,
          clinicInfo: { ...prev.clinicInfo, name: text }
        }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Clinic Phone"
        value={professionalInfo.clinicInfo.phone}
        onChangeText={(text) => setProfessionalInfo(prev => ({
          ...prev,
          clinicInfo: { ...prev.clinicInfo, phone: text }
        }))}
        keyboardType="phone-pad"
      />
      
      <Text style={styles.subsectionTitle}>Primary License</Text>
      
      <TextInput
        style={styles.input}
        placeholder="License Number *"
        value={professionalInfo.primaryLicense.licenseNumber}
        onChangeText={(text) => setProfessionalInfo(prev => ({
          ...prev,
          primaryLicense: { ...prev.primaryLicense, licenseNumber: text }
        }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Issuing State *"
        value={professionalInfo.primaryLicense.state}
        onChangeText={(text) => setProfessionalInfo(prev => ({
          ...prev,
          primaryLicense: { ...prev.primaryLicense, state: text }
        }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Board Name *"
        value={professionalInfo.primaryLicense.boardName}
        onChangeText={(text) => setProfessionalInfo(prev => ({
          ...prev,
          primaryLicense: { ...prev.primaryLicense, boardName: text }
        }))}
      />
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => handleStepComplete('professional_info')}
        disabled={loading || !validateProfessionalInfo()}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? 'Saving...' : 'Continue to Verification'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerificationStep = (step: OnboardingStep, title: string, description: string) => {
    const stepProgress = onboardingProgress?.stepProgress[step];
    const isCompleted = stepProgress?.status === 'completed';
    const isFailed = stepProgress?.status === 'failed';
    
    return (
      <View style={styles.verificationSection}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            isCompleted ? styles.statusSuccess : 
            isFailed ? styles.statusError : styles.statusPending
          ]}>
            <Text style={styles.statusText}>
              {isCompleted ? 'Verified' : isFailed ? 'Failed' : 'Pending'}
            </Text>
          </View>
        </View>
        
        {stepProgress?.documentsRequired && stepProgress.documentsRequired.length > 0 && (
          <View style={styles.documentsSection}>
            <Text style={styles.subsectionTitle}>Required Documents:</Text>
            {stepProgress.documentsRequired.map((doc, index) => (
              <Text key={index} style={styles.documentItem}>
                • {doc.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            ))}
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowDocumentModal(true)}
            >
              <Text style={styles.secondaryButtonText}>Upload Documents</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {stepProgress?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.subsectionTitle}>Notes:</Text>
            <Text style={styles.notesText}>{stepProgress.notes}</Text>
          </View>
        )}
        
        {!isCompleted && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleStepComplete(step)}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Processing...' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderDocumentModal = () => (
    <Modal
      visible={showDocumentModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Upload Documents</Text>
          <TouchableOpacity onPress={() => setShowDocumentModal(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            In a production app, this would integrate with a document upload service.
            For demo purposes, select which documents you have available.
          </Text>
          
          {onboardingProgress?.stepProgress[currentStep]?.documentsRequired.map((doc, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.documentOption,
                selectedDocuments.includes(doc) && styles.documentSelected
              ]}
              onPress={() => {
                if (selectedDocuments.includes(doc)) {
                  setSelectedDocuments(prev => prev.filter(d => d !== doc));
                } else {
                  setSelectedDocuments(prev => [...prev, doc]);
                }
              }}
            >
              <Text style={styles.documentOptionText}>
                {doc.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleDocumentUpload(selectedDocuments)}
          >
            <Text style={styles.primaryButtonText}>
              Upload {selectedDocuments.length} Documents
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'personal_info':
        return renderPersonalInfoForm();
      
      case 'professional_info':
        return renderProfessionalInfoForm();
      
      case 'license_verification':
        return renderVerificationStep(
          'license_verification',
          'License Verification',
          'We need to verify your veterinary license to ensure compliance with state regulations.'
        );
      
      case 'education_verification':
        return renderVerificationStep(
          'education_verification',
          'Education Verification',
          'Please provide your veterinary education credentials for verification.'
        );
      
      case 'insurance_verification':
        return renderVerificationStep(
          'insurance_verification',
          'Insurance Verification',
          'Malpractice insurance verification is required for telemedicine consultations.'
        );
      
      case 'specialization_assessment':
        return renderVerificationStep(
          'specialization_assessment',
          'Specialization Assessment',
          'Help us understand your areas of expertise in agricultural veterinary medicine.'
        );
      
      case 'platform_training':
        return renderVerificationStep(
          'platform_training',
          'Platform Training',
          'Complete our platform training to learn how to use VetConnect effectively.'
        );
      
      case 'educational_training':
        return renderVerificationStep(
          'educational_training',
          'Educational Methodology Training',
          'Learn best practices for educational consultations with students.'
        );
      
      case 'trial_consultations':
        return renderVerificationStep(
          'trial_consultations',
          'Trial Consultations',
          'Complete supervised trial consultations to demonstrate your skills.'
        );
      
      case 'final_approval':
        return renderVerificationStep(
          'final_approval',
          'Final Approval',
          'Final review and approval by our medical team.'
        );
      
      default:
        return (
          <View style={styles.completedSection}>
            <Text style={styles.completedTitle}>Onboarding Complete!</Text>
            <Text style={styles.completedDescription}>
              Congratulations! You have successfully completed the onboarding process.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onComplete(veterinarianId)}
            >
              <Text style={styles.primaryButtonText}>Continue to Dashboard</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinarian Onboarding</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {renderDocumentModal()}
    </SafeAreaView>
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
    padding: 16,
    backgroundColor: '#007AFF',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepIndicator: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stepItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 80,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepActiveCircle: {
    backgroundColor: '#007AFF',
  },
  stepInactiveCircle: {
    backgroundColor: '#e0e0e0',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepActiveNumber: {
    color: '#fff',
  },
  stepInactiveNumber: {
    color: '#666',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  content: {
    flex: 1,
  },
  formSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusSuccess: {
    backgroundColor: '#d4edda',
  },
  statusError: {
    backgroundColor: '#f8d7da',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  documentsSection: {
    marginBottom: 16,
  },
  documentItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  completedSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 16,
  },
  completedDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  documentOption: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  documentSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  documentOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});