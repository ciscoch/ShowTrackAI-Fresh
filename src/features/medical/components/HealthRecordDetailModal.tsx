import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { HealthRecord, HealthPhoto, OBSERVATION_TYPES, COMMON_SYMPTOMS } from '../../../core/models/HealthRecord';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { useHealthRecordStore } from '../../../core/stores/HealthRecordStore';

interface HealthRecordDetailModalProps {
  visible: boolean;
  onClose: () => void;
  record: HealthRecord | null;
  onEdit?: (record: HealthRecord) => void;
}

export const HealthRecordDetailModal: React.FC<HealthRecordDetailModalProps> = ({
  visible,
  onClose,
  record,
  onEdit,
}) => {
  const { animals } = useAnimalStore();
  const { deleteHealthRecord } = useHealthRecordStore();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!record) return null;

  const animal = animals.find(a => a.id === record.animalId);
  const observationType = OBSERVATION_TYPES.find(type => type.id === record.observationType);

  const handleDelete = () => {
    Alert.alert(
      'Delete Health Record',
      'Are you sure you want to delete this health record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHealthRecord(record.id);
              Alert.alert('Success', 'Health record deleted successfully');
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete health record');
            }
          }
        }
      ]
    );
  };

  const getSymptomInfo = (symptomId: string) => {
    return COMMON_SYMPTOMS.find(s => s.id === symptomId);
  };

  const formatConditionScore = (score?: number) => {
    if (!score) return 'Not recorded';
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return `${score}/5 (${labels[score] || 'Unknown'})`;
  };

  const renderPhotoGallery = () => {
    if (record.photos.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 Medical Photos ({record.photos.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photoGrid}>
            {record.photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoItem}
                onPress={() => setSelectedPhotoIndex(index)}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <Text style={styles.photoType}>{photo.photoType.replace('_', ' ')}</Text>
                {photo.qualityScore && (
                  <Text style={styles.photoQuality}>
                    Quality: {(photo.qualityScore * 100).toFixed(0)}%
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderPhotoViewer = () => {
    if (selectedPhotoIndex === null || !record.photos[selectedPhotoIndex]) return null;

    const photo = record.photos[selectedPhotoIndex];

    return (
      <Modal
        visible={true}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPhotoIndex(null)}
      >
        <View style={styles.photoViewerOverlay}>
          <View style={styles.photoViewerContainer}>
            <View style={styles.photoViewerHeader}>
              <Text style={styles.photoViewerTitle}>
                {photo.photoType.replace('_', ' ')} Photo
              </Text>
              <TouchableOpacity
                style={styles.photoViewerClose}
                onPress={() => setSelectedPhotoIndex(null)}
              >
                <Text style={styles.photoViewerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Image source={{ uri: photo.uri }} style={styles.photoViewerImage} />
            
            <View style={styles.photoViewerInfo}>
              <Text style={styles.photoViewerInfoText}>
                Captured: {photo.capturedAt.toLocaleDateString()} at {photo.capturedAt.toLocaleTimeString()}
              </Text>
              {photo.qualityScore && (
                <Text style={styles.photoViewerInfoText}>
                  Quality Score: {(photo.qualityScore * 100).toFixed(0)}%
                </Text>
              )}
              {photo.description && (
                <Text style={styles.photoViewerDescription}>{photo.description}</Text>
              )}
              {photo.aiAnalysis && (
                <View style={styles.aiAnalysisSection}>
                  <Text style={styles.aiAnalysisTitle}>🤖 AI Analysis:</Text>
                  {photo.aiAnalysis.detected_conditions.map((condition, index) => (
                    <Text key={index} style={styles.aiCondition}>
                      • {condition} ({(photo.aiAnalysis!.confidence_scores[condition] * 100).toFixed(0)}% confidence)
                    </Text>
                  ))}
                  {photo.aiAnalysis.recommendations.length > 0 && (
                    <View style={styles.aiRecommendations}>
                      <Text style={styles.aiRecommendationsTitle}>Recommendations:</Text>
                      {photo.aiAnalysis.recommendations.map((rec, index) => (
                        <Text key={index} style={styles.aiRecommendation}>• {rec}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.photoNavigation}>
              <TouchableOpacity
                style={[styles.photoNavButton, selectedPhotoIndex === 0 && styles.photoNavButtonDisabled]}
                onPress={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                disabled={selectedPhotoIndex === 0}
              >
                <Text style={styles.photoNavButtonText}>← Previous</Text>
              </TouchableOpacity>
              
              <Text style={styles.photoCounter}>
                {selectedPhotoIndex + 1} of {record.photos.length}
              </Text>
              
              <TouchableOpacity
                style={[styles.photoNavButton, selectedPhotoIndex === record.photos.length - 1 && styles.photoNavButtonDisabled]}
                onPress={() => setSelectedPhotoIndex(Math.min(record.photos.length - 1, selectedPhotoIndex + 1))}
                disabled={selectedPhotoIndex === record.photos.length - 1}
              >
                <Text style={styles.photoNavButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {observationType?.icon || '🏥'} Health Record Details
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Basic Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Animal:</Text>
                  <Text style={styles.infoValue}>{animal?.name || 'Unknown'} ({animal?.species})</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Observation Type:</Text>
                  <Text style={styles.infoValue}>
                    {observationType?.icon} {observationType?.name || record.observationType}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date & Time:</Text>
                  <Text style={styles.infoValue}>
                    {record.recordedDate.toLocaleDateString()} at {record.recordedDate.toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Recorded By:</Text>
                  <Text style={styles.infoValue}>{record.recordedBy}</Text>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Detailed Notes</Text>
                <Text style={styles.notesText}>{record.notes}</Text>
              </View>

              {/* Vital Signs */}
              {(record.temperature || record.heartRate || record.respiratoryRate) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🌡️ Vital Signs</Text>
                  {record.temperature && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Temperature:</Text>
                      <Text style={styles.infoValue}>{record.temperature}°F</Text>
                    </View>
                  )}
                  {record.heartRate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Heart Rate:</Text>
                      <Text style={styles.infoValue}>{record.heartRate} BPM</Text>
                    </View>
                  )}
                  {record.respiratoryRate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Respiratory Rate:</Text>
                      <Text style={styles.infoValue}>{record.respiratoryRate} BPM</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Condition Scores */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Condition Scores</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Body Condition:</Text>
                  <Text style={styles.infoValue}>{formatConditionScore(record.bodyConditionScore)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mobility:</Text>
                  <Text style={styles.infoValue}>{formatConditionScore(record.mobilityScore)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Appetite:</Text>
                  <Text style={styles.infoValue}>{formatConditionScore(record.appetiteScore)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alertness:</Text>
                  <Text style={styles.infoValue}>{formatConditionScore(record.alertnessScore)}</Text>
                </View>
              </View>

              {/* Physical Observations */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👁️ Physical Observations</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Eye Condition:</Text>
                  <Text style={styles.infoValue}>{record.eyeCondition}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nasal Discharge:</Text>
                  <Text style={styles.infoValue}>{record.nasalDischarge}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Manure Consistency:</Text>
                  <Text style={styles.infoValue}>{record.manureConsistency}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gait/Mobility:</Text>
                  <Text style={styles.infoValue}>{record.gaitMobility}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Appetite:</Text>
                  <Text style={styles.infoValue}>{record.appetite}</Text>
                </View>
              </View>

              {/* Symptoms */}
              {(record.symptoms.length > 0 || record.customSymptoms?.length) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🔍 Symptoms</Text>
                  {record.symptoms.length > 0 && (
                    <View style={styles.symptomsContainer}>
                      <Text style={styles.symptomsSubtitle}>Standard Symptoms:</Text>
                      <View style={styles.symptomsGrid}>
                        {record.symptoms.map((symptomId) => {
                          const symptomInfo = getSymptomInfo(symptomId);
                          return (
                            <View key={symptomId} style={styles.symptomChip}>
                              <Text style={styles.symptomIcon}>{symptomInfo?.icon || '🔍'}</Text>
                              <Text style={styles.symptomText}>{symptomInfo?.name || symptomId}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  {record.customSymptoms && record.customSymptoms.length > 0 && (
                    <View style={styles.symptomsContainer}>
                      <Text style={styles.symptomsSubtitle}>Custom Symptoms:</Text>
                      <View style={styles.symptomsGrid}>
                        {record.customSymptoms.map((symptom, index) => (
                          <View key={index} style={[styles.symptomChip, styles.customSymptomChip]}>
                            <Text style={styles.symptomIcon}>📝</Text>
                            <Text style={styles.symptomText}>{symptom}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Photos */}
              {renderPhotoGallery()}

              {/* Unknown Condition */}
              {record.isUnknownCondition && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>❓ Unknown Condition</Text>
                  <View style={styles.unknownConditionCard}>
                    <Text style={styles.unknownConditionText}>
                      This has been flagged as an unknown condition requiring expert review.
                    </Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Priority Level:</Text>
                      <Text style={[styles.infoValue, styles.priorityText]}>
                        {record.unknownConditionPriority?.toUpperCase() || 'MONITOR'}
                      </Text>
                    </View>
                    {record.expertReviewRequested && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Expert Review:</Text>
                        <Text style={styles.infoValue}>{record.expertReviewStatus || 'Pending'}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Follow-up */}
              {record.followUpRequired && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📅 Follow-up Required</Text>
                  <View style={styles.followUpCard}>
                    <Text style={styles.followUpText}>
                      Follow-up scheduled for: {record.followUpDate?.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Metadata */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ℹ️ Record Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>
                    {record.createdAt.toLocaleDateString()} at {record.createdAt.toLocaleTimeString()}
                  </Text>
                </View>
                {record.updatedAt.getTime() !== record.createdAt.getTime() && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Updated:</Text>
                    <Text style={styles.infoValue}>
                      {record.updatedAt.toLocaleDateString()} at {record.updatedAt.toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              {onEdit && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.editButton]} 
                  onPress={() => {
                    onEdit(record);
                    onClose();
                  }}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.modalButton, styles.closeModalButton]} onPress={onClose}>
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {renderPhotoViewer()}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
    minWidth: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  symptomsContainer: {
    marginBottom: 12,
  },
  symptomsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  customSymptomChip: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  symptomIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  symptomText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  photoItem: {
    alignItems: 'center',
    width: 100,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  photoType: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  photoQuality: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
  },
  unknownConditionCard: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  unknownConditionText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
    lineHeight: 18,
  },
  priorityText: {
    fontWeight: '600',
    color: '#dc3545',
  },
  followUpCard: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  followUpText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeModalButton: {
    backgroundColor: '#f8f9fa',
  },
  closeModalButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
  },
  // Photo Viewer Styles
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  photoViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  photoViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  photoViewerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerCloseText: {
    fontSize: 16,
    color: '#666',
  },
  photoViewerImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f8f9fa',
  },
  photoViewerInfo: {
    padding: 16,
  },
  photoViewerInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  photoViewerDescription: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 18,
  },
  aiAnalysisSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  aiAnalysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  aiCondition: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  aiRecommendations: {
    marginTop: 8,
  },
  aiRecommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  aiRecommendation: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  photoNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  photoNavButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  photoNavButtonDisabled: {
    backgroundColor: '#ccc',
  },
  photoNavButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  photoCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});