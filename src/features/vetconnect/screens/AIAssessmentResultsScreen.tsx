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
import { HealthAssessment, DiagnosticSuggestion, VetConsultation } from '../../../core/models/VetConnect';
import { vetConnectService } from '../../../core/services/VetConnectService';
import { useProfileStore } from '../../../core/stores/ProfileStore';

interface AIAssessmentResultsScreenProps {
  assessment: HealthAssessment;
  onBack: () => void;
  onRequestConsultation: (consultation: VetConsultation) => void;
}

export const AIAssessmentResultsScreen: React.FC<AIAssessmentResultsScreenProps> = ({
  assessment,
  onBack,
  onRequestConsultation,
}) => {
  const { currentProfile } = useProfileStore();
  const [loading, setLoading] = useState(false);
  const [consultationRequested, setConsultationRequested] = useState(false);

  const handleRequestConsultation = async () => {
    if (!currentProfile) {
      Alert.alert('Error', 'No profile selected');
      return;
    }

    Alert.alert(
      'Request Veterinary Consultation',
      `This will connect you with a veterinary professional for a consultation about ${assessment.animalId}. Consultation fee: $75-150`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Consultation', 
          onPress: async () => {
            try {
              setLoading(true);
              
              const consultation = await vetConnectService.createConsultation({
                assessmentId: assessment.id,
                veterinarianId: '', // Will be assigned by smart routing
                studentId: currentProfile.id,
                animalId: assessment.animalId,
                status: 'pending',
                consultationType: assessment.urgencyLevel === 'emergency' ? 'video' : 'video',
                scheduledAt: new Date(Date.now() + (assessment.urgencyLevel === 'emergency' ? 15 : 60) * 60 * 1000),
                studentQuestions: assessment.symptoms.map(s => `Concerned about ${s.symptom}`),
                educatorNotifications: true,
                consultationFee: assessment.urgencyLevel === 'emergency' ? 150 : 75,
                veterinarianEarnings: assessment.urgencyLevel === 'emergency' ? 105 : 52.50,
                platformFee: assessment.urgencyLevel === 'emergency' ? 45 : 22.50,
                paymentStatus: 'pending',
                followUpRequired: false,
                learningObjectives: ['Disease identification', 'Treatment planning'],
                educationalResources: [],
                skillsAssessed: ['Observation skills', 'Communication'],
                consultationNotes: 'Generated from AI health assessment'
              });

              setConsultationRequested(true);
              onRequestConsultation(consultation);
              
            } catch (error) {
              console.error('Failed to request consultation:', error);
              Alert.alert('Error', 'Failed to request consultation. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'emergency': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    return '#fd7e14';
  };

  const renderDiagnosticSuggestion = (suggestion: DiagnosticSuggestion, index: number) => (
    <View key={index} style={styles.suggestionCard}>
      <View style={styles.suggestionHeader}>
        <Text style={styles.suggestionTitle}>{suggestion.condition}</Text>
        <View style={[styles.probabilityBadge, { backgroundColor: getConfidenceColor(suggestion.probability) }]}>
          <Text style={styles.probabilityText}>{Math.round(suggestion.probability * 100)}%</Text>
        </View>
      </View>
      
      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
      
      <View style={styles.suggestionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Common in:</Text>
          <Text style={styles.detailValue}>{suggestion.commonIn.join(', ')}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Urgency:</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(suggestion.urgency) }]}>
            <Text style={styles.urgencyText}>{suggestion.urgency.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.actionRow}>
          <Text style={styles.actionLabel}>Recommended Action:</Text>
          <Text style={styles.actionText}>{suggestion.requiredAction}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assessment Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Assessment Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>🤖 AI Analysis Complete</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(assessment.aiAnalysis.confidenceLevel) }]}>
              <Text style={styles.confidenceText}>
                {Math.round(assessment.aiAnalysis.confidenceLevel * 100)}% Confidence
              </Text>
            </View>
          </View>
          
          <View style={styles.assessmentSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Assessment Date:</Text>
              <Text style={styles.summaryValue}>{assessment.createdAt.toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Urgency Level:</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(assessment.urgencyLevel) }]}>
                <Text style={styles.urgencyText}>{assessment.urgencyLevel.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recommended Action:</Text>
              <Text style={styles.summaryValue}>{assessment.recommendedAction.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* Possible Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Possible Conditions</Text>
          <Text style={styles.sectionSubtitle}>
            Based on the symptoms and data provided, our AI has identified these potential conditions:
          </Text>
          
          {assessment.aiAnalysis.possibleConditions.map((suggestion, index) => 
            renderDiagnosticSuggestion(suggestion, index)
          )}
        </View>

        {/* Risk Factors */}
        {assessment.aiAnalysis.riskFactors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Risk Factors Identified</Text>
            <View style={styles.listContainer}>
              {assessment.aiAnalysis.riskFactors.map((factor, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{factor}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommended Tests */}
        {assessment.aiAnalysis.recommendedTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 Recommended Tests</Text>
            <View style={styles.listContainer}>
              {assessment.aiAnalysis.recommendedTests.map((test, index) => (
                <View key={index} style={styles.testItem}>
                  <Text style={styles.testIcon}>🔬</Text>
                  <Text style={styles.testText}>{test}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Treatment Suggestions */}
        {assessment.aiAnalysis.treatmentSuggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Treatment Suggestions</Text>
            <View style={styles.listContainer}>
              {assessment.aiAnalysis.treatmentSuggestions.map((treatment, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{treatment}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Preventive Measures */}
        {assessment.aiAnalysis.preventiveMeasures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛡️ Preventive Measures</Text>
            <View style={styles.listContainer}>
              {assessment.aiAnalysis.preventiveMeasures.map((measure, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{measure}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Educational Resources */}
        {assessment.aiAnalysis.educationalResources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Educational Resources</Text>
            <View style={styles.resourcesContainer}>
              {assessment.aiAnalysis.educationalResources.map((resource, index) => (
                <TouchableOpacity key={index} style={styles.resourceItem}>
                  <Text style={styles.resourceIcon}>📖</Text>
                  <Text style={styles.resourceText}>{resource}</Text>
                  <Text style={styles.resourceArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>🎯 Next Steps</Text>
          
          {assessment.recommendedAction === 'vet_consultation' || assessment.recommendedAction === 'emergency_care' ? (
            <View style={styles.consultationRecommendation}>
              <Text style={styles.consultationText}>
                {assessment.recommendedAction === 'emergency_care' 
                  ? '🚨 Immediate veterinary attention is recommended for this condition.'
                  : '👨‍⚕️ A veterinary consultation is recommended to properly diagnose and treat this condition.'
                }
              </Text>
              
              {!consultationRequested ? (
                <TouchableOpacity 
                  style={[
                    styles.consultationButton,
                    assessment.urgencyLevel === 'emergency' && styles.emergencyButton
                  ]}
                  onPress={handleRequestConsultation}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.consultationButtonText}>
                        {assessment.urgencyLevel === 'emergency' ? 'Request Emergency Consultation' : 'Request Veterinary Consultation'}
                      </Text>
                      <Text style={styles.consultationFee}>
                        ${assessment.urgencyLevel === 'emergency' ? '150' : '75-150'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.consultationRequested}>
                  <Text style={styles.consultationRequestedText}>
                    ✅ Consultation requested! You'll be connected with a veterinary professional shortly.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.monitoringRecommendation}>
              <Text style={styles.monitoringText}>
                Continue monitoring your animal and document any changes. Follow the preventive measures outlined above.
              </Text>
              
              <TouchableOpacity style={styles.monitoringButton}>
                <Text style={styles.monitoringButtonText}>Set Monitoring Reminders</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* AI Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>⚠️ Important Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This AI assessment is designed to assist with educational purposes and initial health screening. 
            It should not replace professional veterinary diagnosis and treatment. Always consult with a 
            licensed veterinarian for definitive diagnosis and treatment plans.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assessmentSummary: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  probabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  probabilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    marginTop: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  listBullet: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testIcon: {
    fontSize: 20,
  },
  testText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  resourcesContainer: {
    gap: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  resourceIcon: {
    fontSize: 20,
  },
  resourceText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  resourceArrow: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  nextStepsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  consultationRecommendation: {
    alignItems: 'center',
  },
  consultationText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  consultationButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  emergencyButton: {
    backgroundColor: '#dc3545',
  },
  consultationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  consultationFee: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  consultationRequested: {
    backgroundColor: '#d4edda',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  consultationRequestedText: {
    color: '#155724',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  monitoringRecommendation: {
    alignItems: 'center',
  },
  monitoringText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  monitoringButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  monitoringButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});