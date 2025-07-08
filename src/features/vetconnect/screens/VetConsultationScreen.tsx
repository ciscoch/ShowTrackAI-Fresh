import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { VetConsultation, VeterinaryPartner } from '../../../core/models/VetConnect';
import { vetConnectService } from '../../../core/services/VetConnectService';

interface VetConsultationScreenProps {
  consultation: VetConsultation;
  onBack: () => void;
  onConsultationComplete: (consultation: VetConsultation) => void;
}

export const VetConsultationScreen: React.FC<VetConsultationScreenProps> = ({
  consultation,
  onBack,
  onConsultationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(consultation.status);
  const [veterinarian, setVeterinarian] = useState<VeterinaryPartner | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

  useEffect(() => {
    initializeConsultation();
  }, []);

  const initializeConsultation = async () => {
    try {
      setLoading(true);
      
      // Simulate finding and connecting to veterinarian
      await simulateVeterinarianMatching();
      
      // Update consultation status to in_progress
      const updatedConsultation = await vetConnectService.updateConsultation(consultation.id, {
        status: 'in_progress',
        startedAt: new Date()
      });
      
      setCurrentStatus('in_progress');
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('Failed to initialize consultation:', error);
      setConnectionStatus('failed');
      Alert.alert('Connection Error', 'Failed to connect to veterinarian. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const simulateVeterinarianMatching = async (): Promise<void> => {
    // Simulate the smart routing process
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock veterinarian data
        const mockVet: VeterinaryPartner = {
          id: 'vet-001',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@vetconnect.com',
          phone: '(555) 123-4567',
          clinicName: 'Prairie Animal Health Clinic',
          licenseNumber: 'VET-2019-001',
          specializations: ['Large Animal Medicine', 'Cattle Health', 'Emergency Medicine'],
          partnershipTier: 'professional',
          isActive: true,
          availability: {
            timeZone: 'America/Chicago',
            weeklyHours: {
              monday: [{startTime: '08:00', endTime: '17:00', available: true}],
              tuesday: [{startTime: '08:00', endTime: '17:00', available: true}],
              wednesday: [{startTime: '08:00', endTime: '17:00', available: true}],
              thursday: [{startTime: '08:00', endTime: '17:00', available: true}],
              friday: [{startTime: '08:00', endTime: '17:00', available: true}],
              saturday: [{startTime: '09:00', endTime: '14:00', available: true}],
              sunday: [{startTime: '10:00', endTime: '16:00', available: false}]
            },
            blackoutDates: [],
            preferredCaseTypes: ['cattle', 'sheep', 'emergency'],
            maxCasesPerDay: 8,
            emergencyAvailable: true
          },
          credentials: {
            degree: 'Doctor of Veterinary Medicine',
            institution: 'Iowa State University',
            graduationYear: 2015,
            boardCertifications: ['Large Animal Internal Medicine'],
            continuingEducationHours: 45,
            publications: ['Cattle Health Management in Educational Settings'],
            awards: ['Excellence in Large Animal Practice 2022']
          },
          performance: {
            totalConsultations: 156,
            averageRating: 4.8,
            responseTimeMinutes: 12,
            resolutionRate: 0.92,
            studentSatisfaction: 4.7,
            educatorFeedback: 4.9,
            lastMonthConsultations: 23,
            totalEarnings: 8235.50
          },
          compensation: {
            baseRate: 75,
            bonusMultiplier: 1.2,
            paymentMethod: 'direct_deposit',
            taxId: '123-45-6789',
            preferredCurrency: 'USD',
            minimumPayoutThreshold: 100
          },
          createdAt: new Date('2023-01-15'),
          lastActiveAt: new Date()
        };
        
        setVeterinarian(mockVet);
        resolve();
      }, 3000);
    });
  };

  const handleEndConsultation = () => {
    Alert.alert(
      'End Consultation',
      'Are you ready to end this consultation? The veterinarian will provide their final recommendations.',
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'End Consultation', 
          onPress: async () => {
            try {
              setLoading(true);
              
              // Simulate veterinarian completing diagnosis and treatment plan
              const mockDiagnosis = {
                primaryDiagnosis: 'Upper Respiratory Infection',
                differentialDiagnoses: ['Pneumonia', 'Allergic Reaction'],
                diagnosticConfidence: 0.85,
                recommendedTests: [
                  {
                    testName: 'Nasal Swab Culture',
                    priority: 'recommended' as const,
                    estimatedCost: 75,
                    expectedResults: 'Identify causative bacteria',
                    educationalValue: 'Learn about diagnostic sampling techniques'
                  }
                ],
                prognosisAssessment: 'good' as const,
                urgencyLevel: 'routine' as const
              };

              const mockTreatmentPlan = {
                immediateActions: [
                  {
                    action: 'Isolate animal from herd',
                    priority: 'immediate' as const,
                    frequency: 'Once',
                    duration: 'Until recovery',
                    instructions: 'Move to separate pen with good ventilation',
                    studentCanPerform: true,
                    supervisionRequired: false
                  }
                ],
                medications: [
                  {
                    name: 'Penicillin G',
                    dosage: '22,000 IU/kg',
                    frequency: 'Twice daily',
                    duration: '5 days',
                    administration: 'Intramuscular injection',
                    sideEffects: ['Injection site swelling', 'Allergic reaction (rare)'],
                    contraindications: ['Penicillin allergy'],
                    cost: 45,
                    prescriptionRequired: true,
                    educationalNotes: 'Learn proper injection techniques and withdrawal periods'
                  }
                ],
                managementChanges: [
                  'Improve ventilation in housing area',
                  'Reduce stress factors',
                  'Monitor water intake'
                ],
                monitoringInstructions: [
                  'Check temperature twice daily',
                  'Monitor appetite and activity level',
                  'Watch for discharge improvement'
                ],
                preventiveMeasures: [
                  'Maintain vaccination schedule',
                  'Ensure proper ventilation',
                  'Quarantine new animals'
                ],
                expectedOutcome: 'Full recovery expected within 7-10 days with proper treatment',
                timeToResolution: '7-10 days',
                warningSignsToWatch: [
                  'Increased difficulty breathing',
                  'Loss of appetite',
                  'High fever (>104°F)'
                ]
              };

              const completedConsultation = await vetConnectService.updateConsultation(consultation.id, {
                status: 'completed',
                completedAt: new Date(),
                duration: 25, // minutes
                veterinaryDiagnosis: mockDiagnosis,
                treatmentPlan: mockTreatmentPlan,
                followUpRequired: true,
                followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                consultationNotes: 'Successful consultation with clear treatment plan provided. Student demonstrated good observation skills and asked appropriate questions about medication administration and monitoring protocols.',
                learningObjectives: [
                  'Disease identification and differential diagnosis',
                  'Proper medication administration techniques',
                  'Animal monitoring and assessment skills',
                  'Understanding of withdrawal periods and food safety'
                ],
                educationalResources: [
                  {
                    id: 'er-001',
                    title: 'Respiratory Disease Management in Livestock',
                    type: 'article',
                    url: 'https://vetconnect.edu/respiratory-management',
                    description: 'Comprehensive guide to identifying and managing respiratory diseases',
                    estimatedTime: 15,
                    skillLevel: 'intermediate',
                    aetStandards: ['AET-001', 'AET-015']
                  }
                ],
                skillsAssessed: [
                  'Animal observation and assessment',
                  'Communication with veterinary professionals',
                  'Understanding of treatment protocols',
                  'Critical thinking in animal health'
                ]
              });
              
              setCurrentStatus('completed');
              onConsultationComplete(completedConsultation);
              
            } catch (error) {
              console.error('Failed to complete consultation:', error);
              Alert.alert('Error', 'Failed to complete consultation. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderConnectionStatus = () => {
    if (connectionStatus === 'connecting') {
      return (
        <View style={styles.connectionCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.connectionTitle}>Connecting to Veterinarian</Text>
          <Text style={styles.connectionSubtitle}>
            Our smart routing system is finding the best veterinary expert for your case...
          </Text>
        </View>
      );
    }

    if (connectionStatus === 'failed') {
      return (
        <View style={styles.connectionCard}>
          <Text style={styles.connectionFailedIcon}>❌</Text>
          <Text style={styles.connectionTitle}>Connection Failed</Text>
          <Text style={styles.connectionSubtitle}>
            Unable to connect to a veterinarian at this time. Please try again later.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeConsultation}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderActiveConsultation = () => {
    if (!veterinarian || connectionStatus !== 'connected') return null;

    return (
      <View style={styles.consultationContainer}>
        
        {/* Veterinarian Info */}
        <View style={styles.vetCard}>
          <View style={styles.vetHeader}>
            <View style={styles.vetAvatar}>
              <Text style={styles.vetAvatarText}>{veterinarian.name.charAt(0)}</Text>
            </View>
            <View style={styles.vetInfo}>
              <Text style={styles.vetName}>{veterinarian.name}</Text>
              <Text style={styles.vetClinic}>{veterinarian.clinicName}</Text>
              <Text style={styles.vetSpecialty}>
                {veterinarian.specializations.slice(0, 2).join(', ')}
              </Text>
            </View>
            <View style={styles.vetStatus}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.vetCredentials}>
            <Text style={styles.credentialsTitle}>Credentials</Text>
            <Text style={styles.credentialsText}>
              {veterinarian.credentials.degree}, {veterinarian.credentials.institution} ({veterinarian.credentials.graduationYear})
            </Text>
            <Text style={styles.performanceText}>
              ⭐ {veterinarian.performance.averageRating} rating • {veterinarian.performance.totalConsultations} consultations
            </Text>
          </View>
        </View>

        {/* Video Call Simulation */}
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>📹</Text>
            <Text style={styles.videoText}>Video Consultation in Progress</Text>
            <Text style={styles.videoSubtext}>
              Duration: {Math.floor(Math.random() * 20) + 5} minutes
            </Text>
          </View>
          
          <View style={styles.videoControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlIcon}>🎤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlIcon}>📹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlIcon}>📱</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consultation Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>📋 Consultation Progress</Text>
          
          <View style={styles.progressStep}>
            <View style={styles.stepIndicatorComplete} />
            <Text style={styles.stepText}>Initial assessment review</Text>
          </View>
          
          <View style={styles.progressStep}>
            <View style={styles.stepIndicatorComplete} />
            <Text style={styles.stepText}>Symptom discussion</Text>
          </View>
          
          <View style={styles.progressStep}>
            <View style={styles.stepIndicatorActive} />
            <Text style={styles.stepText}>Diagnostic recommendations</Text>
          </View>
          
          <View style={styles.progressStep}>
            <View style={styles.stepIndicatorPending} />
            <Text style={styles.stepTextPending}>Treatment plan development</Text>
          </View>
          
          <View style={styles.progressStep}>
            <View style={styles.stepIndicatorPending} />
            <Text style={styles.stepTextPending}>Educational discussion</Text>
          </View>
        </View>

        {/* Educational Value */}
        <View style={styles.educationCard}>
          <Text style={styles.educationTitle}>🎓 Learning Objectives</Text>
          <View style={styles.learningList}>
            {consultation.learningObjectives.map((objective, index) => (
              <View key={index} style={styles.learningItem}>
                <Text style={styles.learningBullet}>•</Text>
                <Text style={styles.learningText}>{objective}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionText}>Take Notes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📸</Text>
              <Text style={styles.actionText}>Share Photos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>❓</Text>
              <Text style={styles.actionText}>Ask Question</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Share Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinary Consultation</Text>
        {currentStatus === 'in_progress' && (
          <TouchableOpacity 
            style={styles.endButton} 
            onPress={handleEndConsultation}
            disabled={loading}
          >
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderConnectionStatus()}
        {renderActiveConsultation()}
      </ScrollView>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
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
  endButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  connectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  connectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  connectionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  connectionFailedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  consultationContainer: {
    gap: 16,
  },
  vetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vetAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vetAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vetClinic: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vetSpecialty: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  vetStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  vetCredentials: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  credentialsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  performanceText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  videoContainer: {
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16/9,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  videoIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  videoText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  videoSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    gap: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 20,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicatorComplete: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745',
    marginRight: 12,
  },
  stepIndicatorActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffc107',
    marginRight: 12,
  },
  stepIndicatorPending: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  stepTextPending: {
    fontSize: 14,
    color: '#666',
  },
  educationCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  learningList: {
    gap: 8,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  learningBullet: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  learningText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
});