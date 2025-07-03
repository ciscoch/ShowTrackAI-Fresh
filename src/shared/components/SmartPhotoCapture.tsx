import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { aiWeightPredictionService } from '../../core/services/AIWeightPredictionService';
import { neuralNetworkService } from '../../core/services/NeuralNetworkService';
import { rewardPointsService } from '../../core/services/RewardPointsService';

export interface PhotoAnalysisData {
  id: string;
  uri: string;
  angle: 'side_profile' | 'rear_view' | 'front_view' | 'three_quarter';
  quality: number;
  aiAnalysis?: {
    weightEstimate: number;
    confidence: number;
    bodyConditionScore: number;
  };
  contributedToNN: boolean;
  pointsEarned: number;
  timestamp: Date;
}

interface SmartPhotoCaptureProps {
  label: string;
  value: PhotoAnalysisData[];
  onValueChange: (photos: PhotoAnalysisData[]) => void;
  isEliteUser?: boolean;
  animalSpecies: 'cattle' | 'sheep' | 'swine' | 'goat';
  maxPhotos?: number;
  onRewardPointsEarned?: (points: number) => void;
}

export const SmartPhotoCapture: React.FC<SmartPhotoCaptureProps> = ({
  label,
  value,
  onValueChange,
  isEliteUser = false,
  animalSpecies,
  maxPhotos = 4,
  onRewardPointsEarned,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [selectedAngle, setSelectedAngle] = useState<PhotoAnalysisData['angle']>('side_profile');

  const photoAngles = [
    { key: 'side_profile', label: 'Side Profile', icon: '📸', description: 'Perfect for weight estimation' },
    { key: 'rear_view', label: 'Rear View', icon: '📷', description: 'Shows muscle development' },
    { key: 'front_view', label: 'Front View', icon: '📹', description: 'Face and front structure' },
    { key: 'three_quarter', label: 'Three-Quarter', icon: '🎥', description: 'General body condition' },
  ] as const;

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const analyzePhotoQuality = (metadata: any): number => {
    // Simulate photo quality analysis
    let quality = 0.6; // Base quality
    
    // Add randomness for demo (real implementation would use computer vision)
    quality += Math.random() * 0.4;
    
    return Math.min(1.0, quality);
  };

  const generatePhotoGuidance = (angle: PhotoAnalysisData['angle']) => {
    const guidance = {
      side_profile: {
        title: '📸 Perfect Side Profile',
        tips: [
          '🎯 Position animal perpendicular to camera',
          '☀️ Ensure good, even lighting',
          '🏞️ Use clean, uncluttered background',
          '📏 Keep animal in center of frame',
          '🐄 Wait for animal to stand square'
        ]
      },
      rear_view: {
        title: '📷 Rear View Capture',
        tips: [
          '🎯 Center the rear end in frame',
          '📏 Keep camera at animal\'s hip level',
          '💪 Shows muscle development clearly',
          '🏞️ Clean background important',
          '⏰ Wait for natural stance'
        ]
      },
      front_view: {
        title: '📹 Front View Setup',
        tips: [
          '👁️ Capture face and front structure',
          '📏 Camera at animal\'s chest level',
          '🎯 Center head and shoulders',
          '☀️ Avoid harsh shadows on face',
          '🐄 Calm animal for best results'
        ]
      },
      three_quarter: {
        title: '🎥 Three-Quarter Angle',
        tips: [
          '🔄 45-degree angle to animal',
          '📸 Shows overall body condition',
          '🎯 Include full body in frame',
          '☀️ Even lighting on visible side',
          '📏 Medium distance for full view'
        ]
      }
    };

    return guidance[angle];
  };

  const capturePhoto = async () => {
    if (value.length >= maxPhotos) {
      Alert.alert('Photo limit reached', `Maximum of ${maxPhotos} photos allowed`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsCapturing(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        await processPhoto(photo.uri, selectedAngle);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const processPhoto = async (uri: string, angle: PhotoAnalysisData['angle']) => {
    try {
      // 1. Analyze photo quality
      const quality = analyzePhotoQuality({});
      
      // 2. Get AI weight analysis (for elite users)
      let aiAnalysis;
      if (isEliteUser) {
        const analysis = await aiWeightPredictionService.analyzePhoto(
          uri,
          animalSpecies,
          angle
        );
        aiAnalysis = {
          weightEstimate: analysis.weightEstimate,
          confidence: analysis.confidence,
          bodyConditionScore: analysis.bodyConditionScore
        };
      }

      // 3. Contribute to neural network training
      const nnContribution = await neuralNetworkService.submitTrainingData(
        uri,
        0, // Actual weight would be provided later
        animalSpecies,
        angle,
        {
          lighting: quality > 0.8 ? 'excellent' : quality > 0.6 ? 'good' : 'poor',
          background: 'clean', // Would be analyzed
          animalPosition: quality > 0.7 ? 'perfect' : 'good',
          imageResolution: 1920
        }
      );

      // 4. Award reward points
      const rewardResult = await rewardPointsService.earnPoints(
        nnContribution.pointsEarned,
        'photo_contribution',
        `${angle.replace('_', ' ')} photo of ${animalSpecies}`,
        {
          photoQuality: quality,
          speciesContributed: animalSpecies
        }
      );

      // 5. Create photo data object
      const photoData: PhotoAnalysisData = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri,
        angle,
        quality,
        aiAnalysis,
        contributedToNN: true,
        pointsEarned: nnContribution.pointsEarned,
        timestamp: new Date()
      };

      // 6. Update parent component
      const updatedPhotos = [...value, photoData];
      onValueChange(updatedPhotos);

      // 7. Notify about points earned
      if (onRewardPointsEarned) {
        onRewardPointsEarned(nnContribution.pointsEarned);
      }

      // 8. Show success feedback
      const qualityText = quality > 0.8 ? 'Excellent' : quality > 0.6 ? 'Good' : 'Fair';
      Alert.alert(
        '📸 Photo Captured!',
        `Quality: ${qualityText}\n🏆 Points earned: ${nnContribution.pointsEarned}\n${isEliteUser ? `🤖 Weight estimate: ${aiAnalysis?.weightEstimate} lbs` : '🤝 Thanks for contributing to our AI!'}`,
        [{ text: 'Great!', style: 'default' }]
      );

    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Error', 'Failed to process photo');
    }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = value.filter(p => p.id !== photoId);
            onValueChange(updatedPhotos);
          }
        }
      ]
    );
  };

  const renderPhotoGuidance = () => {
    const guidance = generatePhotoGuidance(selectedAngle);
    
    return (
      <Modal visible={showGuidance} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.guidanceContainer}>
          <View style={styles.guidanceHeader}>
            <Text style={styles.guidanceTitle}>{guidance.title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowGuidance(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.guidanceContent}>
            <Text style={styles.guidanceSubtitle}>Tips for best results:</Text>
            {guidance.tips.map((tip, index) => (
              <Text key={index} style={styles.guidanceTip}>{tip}</Text>
            ))}
            
            <View style={styles.guidanceActions}>
              <TouchableOpacity 
                style={styles.guidanceButton}
                onPress={() => {
                  setShowGuidance(false);
                  capturePhoto();
                }}
              >
                <Text style={styles.guidanceButtonText}>📸 Start Capture</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Angle Selection */}
      <View style={styles.angleSelector}>
        <Text style={styles.selectorLabel}>Choose photo angle:</Text>
        <View style={styles.angleButtons}>
          {photoAngles.map((angleOption) => (
            <TouchableOpacity
              key={angleOption.key}
              style={[
                styles.angleButton,
                selectedAngle === angleOption.key && styles.selectedAngleButton
              ]}
              onPress={() => setSelectedAngle(angleOption.key)}
            >
              <Text style={styles.angleIcon}>{angleOption.icon}</Text>
              <Text style={[
                styles.angleLabel,
                selectedAngle === angleOption.key && styles.selectedAngleLabel
              ]}>
                {angleOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.guidanceButton}
          onPress={() => setShowGuidance(true)}
        >
          <Text style={styles.guidanceButtonText}>💡 Photo Tips</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.captureButton, isCapturing && styles.capturingButton]}
          onPress={capturePhoto}
          disabled={isCapturing}
        >
          <Text style={styles.captureButtonText}>
            {isCapturing ? '📸 Capturing...' : '📸 Take Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Gallery */}
      {value.length > 0 && (
        <View style={styles.photoGallery}>
          <Text style={styles.galleryTitle}>📷 Captured Photos ({value.length}/{maxPhotos})</Text>
          <View style={styles.photoGrid}>
            {value.map((photo) => (
              <View key={photo.id} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoAngle}>{photo.angle.replace('_', ' ')}</Text>
                  <Text style={styles.photoQuality}>
                    Quality: {(photo.quality * 100).toFixed(0)}%
                  </Text>
                  {photo.aiAnalysis && (
                    <Text style={styles.aiResult}>
                      🤖 {photo.aiAnalysis.weightEstimate} lbs
                    </Text>
                  )}
                  <Text style={styles.photoPoints}>🏆 {photo.pointsEarned} pts</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deletePhoto(photo.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Photo Guidance Modal */}
      {renderPhotoGuidance()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  angleSelector: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  angleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  angleButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedAngleButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  angleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  angleLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedAngleLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  guidanceButton: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  guidanceButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  captureButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  capturingButton: {
    backgroundColor: '#ccc',
  },
  captureButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  photoGallery: {
    marginTop: 16,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photoGrid: {
    gap: 12,
  },
  photoItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  photoInfo: {
    flex: 1,
  },
  photoAngle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  photoQuality: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  aiResult: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  photoPoints: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  guidanceContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  guidanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  guidanceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  guidanceContent: {
    flex: 1,
    padding: 16,
  },
  guidanceSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  guidanceTip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  guidanceActions: {
    marginTop: 32,
  },
});