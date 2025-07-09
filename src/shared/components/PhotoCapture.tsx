import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface PhotoCaptureProps {
  onPhotosChange: (photos: string[]) => void;
  existingPhotos?: string[];
  maxPhotos?: number;
  context: 'feeding' | 'health' | 'behavior' | 'facility' | 'equipment' | 'general';
  showGuidance?: boolean;
}

interface PhotoGuidance {
  title: string;
  suggestions: string[];
  privacyNote: string;
}

const PHOTO_GUIDANCE: Record<string, PhotoGuidance> = {
  feeding: {
    title: "📸 Feeding Documentation Photos",
    suggestions: [
      "Wide shot: Animal(s) eating from feed containers/trough",
      "Close-up: Feed quality and texture in container", 
      "Side profile: Animal body condition during feeding",
      "Environment: Feeding area setup and cleanliness"
    ],
    privacyNote: "Focus on feed and animals only. Avoid including people or identifiable farm features."
  },
  health: {
    title: "📸 Health Record Photos", 
    suggestions: [
      "Full body: Animal standing naturally for condition assessment",
      "Side profile: Clear view of body posture and stance",
      "Close-up: Specific area of concern (hooves, eyes, coat)",
      "Comparison: Before/after treatment progress"
    ],
    privacyNote: "Document only the animal and relevant health indicators. No personal items or identifiable locations."
  },
  behavior: {
    title: "📸 Behavior Documentation Photos",
    suggestions: [
      "Natural behavior: Animal in normal activity state",
      "Group interaction: Social dynamics with other animals", 
      "Environment response: Animal adapting to conditions",
      "Activity level: Movement and engagement patterns"
    ],
    privacyNote: "Capture natural behaviors only. Avoid background elements that could identify location."
  },
  facility: {
    title: "📸 Facility & Housing Photos",
    suggestions: [
      "Wide view: Overall housing/pen layout and condition",
      "Detail shot: Specific equipment or infrastructure",
      "Safety features: Gates, fencing, water systems",
      "Maintenance areas: Cleaning or repair work"
    ],
    privacyNote: "Focus on educational aspects. Blur or crop any identifying farm names or personal property."
  },
  equipment: {
    title: "📸 Equipment & Tools Photos",
    suggestions: [
      "Full view: Complete equipment setup and organization",
      "Detail shot: Specific tool use or maintenance",
      "Safety gear: Proper equipment handling and storage",
      "Measurement tools: Scales, measuring devices, instruments"
    ],
    privacyNote: "Document equipment only. Remove any identifying labels or personal property from frame."
  },
  general: {
    title: "📸 General Activity Photos",
    suggestions: [
      "Overview: General farm activity and operations",
      "Process documentation: Step-by-step activity progress",
      "Results: Completed work or project outcomes", 
      "Learning moments: Educational highlights and discoveries"
    ],
    privacyNote: "Keep photos educational and anonymous. Avoid personal items, faces, or identifying information."
  }
};

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotosChange,
  existingPhotos = [],
  maxPhotos = 4,
  context,
  showGuidance = true,
}) => {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [showGuidanceDetail, setShowGuidanceDetail] = useState(false);

  const guidance = PHOTO_GUIDANCE[context];

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Camera Permissions Required',
        'Please enable camera and photo library permissions to capture photos for your journal entries.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo Limit', `Maximum ${maxPhotos} photos allowed per journal entry.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setProcessingPhoto(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto = result.assets[0].uri;
        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Camera Error', 'Unable to take photo. Please try again.');
    } finally {
      setProcessingPhoto(false);
    }
  };

  const pickFromLibrary = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo Limit', `Maximum ${maxPhotos} photos allowed per journal entry.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setProcessingPhoto(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto = result.assets[0].uri;
        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Photo Error', 'Unable to select photo. Please try again.');
    } finally {
      setProcessingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = photos.filter((_, i) => i !== index);
            setPhotos(updatedPhotos);
            onPhotosChange(updatedPhotos);
          },
        },
      ]
    );
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you would like to add a photo to your journal entry.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📷 Take Photo', onPress: takePhoto },
        { text: '📚 Choose from Library', onPress: pickFromLibrary },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📸 Photo Documentation</Text>
        <View style={styles.photoCount}>
          <Text style={styles.photoCountText}>{photos.length}/{maxPhotos}</Text>
        </View>
      </View>

      {showGuidance && (
        <View style={styles.guidanceSection}>
          <TouchableOpacity
            style={styles.guidanceHeader}
            onPress={() => setShowGuidanceDetail(!showGuidanceDetail)}
          >
            <Text style={styles.guidanceTitle}>{guidance.title}</Text>
            <Text style={styles.guidanceToggle}>
              {showGuidanceDetail ? '▼' : '▶️'} AI Photo Guidance
            </Text>
          </TouchableOpacity>

          {showGuidanceDetail && (
            <View style={styles.guidanceDetail}>
              <Text style={styles.guidanceSubtitle}>📋 Recommended Shots:</Text>
              {guidance.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.guidanceItem}>• {suggestion}</Text>
              ))}
              
              <Text style={styles.privacyTitle}>🔒 Privacy Guidelines:</Text>
              <Text style={styles.privacyNote}>{guidance.privacyNote}</Text>
            </View>
          )}
        </View>
      )}

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {photos.length < maxPhotos && (
        <TouchableOpacity 
          style={[styles.addButton, processingPhoto && styles.addButtonDisabled]} 
          onPress={showPhotoOptions}
          disabled={processingPhoto}
        >
          {processingPhoto ? (
            <>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.addButtonText}>Processing Photo...</Text>
            </>
          ) : (
            <>
              <Text style={styles.addButtonIcon}>📷</Text>
              <Text style={styles.addButtonText}>Add Photo</Text>
              <Text style={styles.addButtonSubtext}>
                {photos.length === 0 ? 'Tap to add your first photo' : `${maxPhotos - photos.length} more available`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {uploading && (
        <View style={styles.uploadingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadingText}>Processing photos...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  photoCount: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  guidanceSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  guidanceHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  guidanceToggle: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  guidanceDetail: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  guidanceSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  guidanceItem: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    lineHeight: 16,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28A745',
    marginTop: 12,
    marginBottom: 8,
  },
  privacyNote: {
    fontSize: 12,
    color: '#28A745',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  photoList: {
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
  },
  addButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  addButtonSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    marginTop: 12,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#007AFF',
  },
});