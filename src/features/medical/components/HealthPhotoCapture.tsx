import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { HealthPhoto } from '../../../core/models/HealthRecord';

interface HealthPhotoCaptureProps {
  photos: HealthPhoto[];
  onPhotosChange: (photos: HealthPhoto[]) => void;
  maxPhotos?: number;
}

export const HealthPhotoCapture: React.FC<HealthPhotoCaptureProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const photoTypes = [
    { key: 'general', label: 'General', icon: '📸', description: 'Overall condition' },
    { key: 'eye', label: 'Eye', icon: '👁️', description: 'Eye condition/discharge' },
    { key: 'nasal', label: 'Nasal', icon: '👃', description: 'Nasal discharge' },
    { key: 'skin', label: 'Skin', icon: '🩹', description: 'Skin conditions/wounds' },
    { key: 'gait', label: 'Gait', icon: '🚶', description: 'Movement/posture' },
    { key: 'manure', label: 'Manure', icon: '💩', description: 'Manure consistency' },
    { key: 'comparison', label: 'Comparison', icon: '📊', description: 'Before/after comparison' },
    { key: 'unknown', label: 'Unknown', icon: '❓', description: 'Unknown condition' },
  ] as const;

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos for medical documentation');
      return false;
    }
    return true;
  };

  const capturePhoto = async (photoType: HealthPhoto['photoType']) => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo limit reached', `Maximum of ${maxPhotos} photos allowed per health record`);
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
        await processPhoto(photo.uri, photoType);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const processPhoto = async (uri: string, photoType: HealthPhoto['photoType']) => {
    try {
      // Create photo data object for health record
      const healthPhoto: HealthPhoto = {
        id: `health_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        healthRecordId: '', // Will be set when health record is saved
        filename: `health_${photoType}_${Date.now()}.jpg`,
        uri,
        photoType,
        description: undefined,
        qualityScore: 0.8 + (Math.random() * 0.2), // Simulated quality score
        capturedAt: new Date(),
        userId: 'current-user', // Would come from auth context
      };

      // Update photos array
      const updatedPhotos = [...photos, healthPhoto];
      onPhotosChange(updatedPhotos);

      // Show success feedback
      const photoTypeInfo = photoTypes.find(pt => pt.key === photoType);
      Alert.alert(
        '📸 Photo Captured!',
        `${photoTypeInfo?.icon} ${photoTypeInfo?.label} photo saved for medical documentation.\n\nThis photo will be valuable for AI analysis and veterinary consultations.`,
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
      'Are you sure you want to delete this medical photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = photos.filter(p => p.id !== photoId);
            onPhotosChange(updatedPhotos);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📸 Medical Photos ({photos.length}/{maxPhotos})</Text>
      <Text style={styles.sectionSubtitle}>
        Photos help with diagnosis and are valuable for future AI health analysis
      </Text>
      
      {/* Photo Type Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.photoTypeSelector}
        contentContainerStyle={styles.photoTypeSelectorContent}
      >
        {photoTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[styles.photoTypeButton, isCapturing && styles.photoTypeButtonDisabled]}
            onPress={() => capturePhoto(type.key)}
            disabled={isCapturing}
          >
            <Text style={styles.photoTypeIcon}>{type.icon}</Text>
            <Text style={styles.photoTypeLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <View style={styles.photoGallery}>
          <Text style={styles.galleryTitle}>📷 Captured Medical Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photoGrid}>
              {photos.map((photo) => {
                const photoTypeInfo = photoTypes.find(pt => pt.key === photo.photoType);
                return (
                  <View key={photo.id} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    <View style={styles.photoInfo}>
                      <Text style={styles.photoType}>
                        {photoTypeInfo?.icon} {photoTypeInfo?.label}
                      </Text>
                      <Text style={styles.photoQuality}>
                        Quality: {(photo.qualityScore ? photo.qualityScore * 100 : 80).toFixed(0)}%
                      </Text>
                      <Text style={styles.photoTime}>
                        {photo.capturedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deletePhoto(photo.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Benefits Info */}
      <View style={styles.benefitsInfo}>
        <Text style={styles.benefitsTitle}>🤖 AI Future Features</Text>
        <Text style={styles.benefitsText}>
          These photos will be used to train AI for automatic health condition detection, 
          helping FFA students learn veterinary skills and identify issues early.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 16,
  },
  photoTypeSelector: {
    marginBottom: 16,
  },
  photoTypeSelectorContent: {
    paddingRight: 16,
  },
  photoTypeButton: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 70,
  },
  photoTypeButtonDisabled: {
    opacity: 0.5,
  },
  photoTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  photoTypeLabel: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  photoGallery: {
    marginBottom: 16,
  },
  galleryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  photoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  photoThumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    marginBottom: 6,
  },
  photoInfo: {
    alignItems: 'center',
  },
  photoType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  photoQuality: {
    fontSize: 9,
    color: '#666',
    marginBottom: 1,
  },
  photoTime: {
    fontSize: 9,
    color: '#999',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
  },
  benefitsInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  benefitsText: {
    fontSize: 11,
    color: '#1976d2',
    lineHeight: 15,
  },
});