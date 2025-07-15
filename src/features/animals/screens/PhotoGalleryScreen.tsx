import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Animal } from '../../../core/models/Animal';
import { useAnalytics } from '../../../core/hooks/useAnalytics';

interface PhotoGalleryScreenProps {
  animal: Animal;
  onBack: () => void;
  onTakePhoto: () => void;
}

export const PhotoGalleryScreen: React.FC<PhotoGalleryScreenProps> = ({
  animal,
  onBack,
  onTakePhoto,
}) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Analytics
  const { trackFeatureUsage } = useAnalytics({
    autoTrackScreenView: true,
    screenName: 'PhotoGalleryScreen',
  });

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      // TODO: Load photos from storage service
      // For now, using placeholder photos - high quality goat photos for demo
      const mockPhotos = [
        'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1422565096762-bdb997a56a84?w=400&h=400&fit=crop', 
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1605027990121-3b2c2c7e1625?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1615486635652-7855bf29b5cd?w=400&h=400&fit=crop',
      ];
      setPhotos(mockPhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    trackFeatureUsage('photo_management', {
      action: 'take_photo_initiated',
      animal_species: animal.species,
      current_photo_count: photos.length,
    });
    onTakePhoto();
  };

  const handleDeletePhoto = (photoUri: string, index: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedPhotos = photos.filter((_, i) => i !== index);
            setPhotos(updatedPhotos);
            trackFeatureUsage('photo_management', {
              action: 'photo_deleted',
              animal_species: animal.species,
              remaining_photo_count: updatedPhotos.length,
            });
          },
        },
      ]
    );
  };

  const renderPhotoGrid = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      );
    }

    if (photos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyTitle}>No Photos Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start documenting {animal.name}'s journey by taking your first photo!
          </Text>
          <TouchableOpacity style={styles.firstPhotoButton} onPress={handleTakePhoto}>
            <Text style={styles.firstPhotoButtonText}>Take First Photo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.photoGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {photos.map((photoUri, index) => (
            <TouchableOpacity
              key={index}
              style={styles.photoContainer}
              onPress={() => {
                // TODO: Open photo in full screen
                Alert.alert('Photo Viewer', 'Full screen photo viewer coming soon!');
              }}
              onLongPress={() => handleDeletePhoto(photoUri, index)}
            >
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoDate}>Today</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Photo Gallery</Text>
          <Text style={styles.subtitle}>{animal.name}</Text>
        </View>
        <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
          <Text style={styles.cameraButtonText}>📷</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Count Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{photos.length}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.min(photos.length, 14)}</Text>
          <Text style={styles.statLabel}>Days Documented</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.min(photos.length, 7)}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

      {/* Photo Grid */}
      {renderPhotoGrid()}

      {/* Action Buttons */}
      {photos.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
            <Text style={styles.actionButtonEmoji}>📷</Text>
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Slideshow feature coming soon!')}
          >
            <Text style={styles.actionButtonEmoji}>🎞️</Text>
            <Text style={styles.actionButtonText}>Slideshow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Share feature coming soon!')}
          >
            <Text style={styles.actionButtonEmoji}>📤</Text>
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 8,
  },
  photoGrid: {
    flex: 1,
    paddingTop: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    marginRight: '4%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  photoDate: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  firstPhotoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  firstPhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});