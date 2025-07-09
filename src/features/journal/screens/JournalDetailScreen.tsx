import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Journal } from '../../../core/models/Journal';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { useJournalStore } from '../../../core/stores/JournalStore';
import { DeleteConfirmationModal } from '../../../shared/components/DeleteConfirmationModal';

interface JournalDetailScreenProps {
  entry: Journal;
  onBack: () => void;
  onEdit: (entry: Journal) => void;
  onDelete?: (entry: Journal) => void;
}

export const JournalDetailScreen: React.FC<JournalDetailScreenProps> = ({
  entry,
  onBack,
  onEdit,
  onDelete,
}) => {
  const { animals } = useAnimalStore();
  const { deleteEntry } = useJournalStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getAnimalName = (animalId: string): string => {
    const animal = animals.find(a => a.id === animalId);
    return animal ? `${animal.name} (${animal.breed})` : 'Unknown Animal';
  };

  const handleDeletePress = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteEntry(entry.id);
      setShowDeleteModal(false);
      if (onDelete) {
        onDelete(entry);
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      Alert.alert('Error', 'Failed to delete journal entry. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(entry)}>
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{entry.title}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.category}>{entry.category}</Text>
            <Text style={styles.duration}>{formatDuration(entry.duration)}</Text>
          </View>
          <Text style={styles.date}>{formatDate(entry.date)} at {formatTime(entry.date)}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          <Text style={styles.description}>{entry.description}</Text>
        </View>

        {/* AET Skills */}
        {entry.aetSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎓 AET Skills ({entry.aetSkills.length})</Text>
            <View style={styles.skillsContainer}>
              {entry.aetSkills.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>Skill {index + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Learning Objectives */}
        {entry.objectives && entry.objectives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Learning Objectives</Text>
            {entry.objectives.map((objective, index) => (
              <View key={index} style={styles.objectiveItem}>
                <Text style={styles.objectiveBullet}>•</Text>
                <Text style={styles.objectiveText}>{objective}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Feed Data */}
        {entry.feedData && entry.feedData.feeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌾 Feed Data</Text>
            {entry.animalId && (
              <Text style={styles.animalInfo}>
                📌 Animal: {getAnimalName(entry.animalId)}
              </Text>
            )}
            
            <View style={styles.feedContainer}>
              {entry.feedData.feeds.map((feed, index) => (
                <View key={index} style={styles.feedItem}>
                  <View style={styles.feedHeader}>
                    <Text style={styles.feedBrand}>{feed.brand}</Text>
                    {feed.cost && feed.cost > 0 && (
                      <Text style={styles.feedCost}>${feed.cost.toFixed(2)}</Text>
                    )}
                  </View>
                  <Text style={styles.feedProduct}>{feed.product}</Text>
                  <Text style={styles.feedAmount}>
                    {feed.amount} {feed.unit}
                  </Text>
                </View>
              ))}
              
              {entry.feedData.totalCost > 0 && (
                <View style={styles.feedTotal}>
                  <Text style={styles.feedTotalText}>
                    Total Cost: ${entry.feedData.totalCost.toFixed(2)}
                  </Text>
                </View>
              )}
              
              {entry.feedData.notes && (
                <View style={styles.feedNotes}>
                  <Text style={styles.feedNotesTitle}>Feed Notes:</Text>
                  <Text style={styles.feedNotesText}>{entry.feedData.notes}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Weather & Location */}
        {(entry.weather?.conditions || entry.location?.address) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌍 Context</Text>
            <View style={styles.contextContainer}>
              {entry.weather?.conditions && (
                <View style={styles.contextItem}>
                  <Text style={styles.contextLabel}>Weather:</Text>
                  <Text style={styles.contextValue}>{entry.weather.conditions}</Text>
                </View>
              )}
              {entry.location?.address && (
                <View style={styles.contextItem}>
                  <Text style={styles.contextLabel}>Location:</Text>
                  <Text style={styles.contextValue}>{entry.location.address}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Photos */}
        {entry.photos && entry.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Photos ({entry.photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
              {entry.photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reflection & Learning */}
        {(entry.learningOutcomes || entry.challenges || entry.improvements) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💭 Reflection</Text>
            
            {entry.learningOutcomes && entry.learningOutcomes.length > 0 && (
              <View style={styles.reflectionItem}>
                <Text style={styles.reflectionTitle}>Learning Outcomes:</Text>
                {entry.learningOutcomes.map((outcome, index) => (
                  <Text key={index} style={styles.reflectionText}>• {outcome}</Text>
                ))}
              </View>
            )}
            
            {entry.challenges && (
              <View style={styles.reflectionItem}>
                <Text style={styles.reflectionTitle}>Challenges:</Text>
                <Text style={styles.reflectionText}>{entry.challenges}</Text>
              </View>
            )}
            
            {entry.improvements && (
              <View style={styles.reflectionItem}>
                <Text style={styles.reflectionTitle}>Improvements:</Text>
                <Text style={styles.reflectionText}>{entry.improvements}</Text>
              </View>
            )}
          </View>
        )}

        {/* Additional Notes */}
        {entry.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Additional Notes</Text>
            <Text style={styles.notes}>{entry.notes}</Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        title="Delete Journal Entry"
        itemName={entry.title}
        itemType="journal entry"
        description="This will permanently delete this activity log including all feed data, photos, and learning records."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  duration: {
    backgroundColor: '#F3E5F5',
    color: '#7B1FA2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  skillText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '500',
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  objectiveBullet: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  objectiveText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  animalInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  feedContainer: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
  },
  feedItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  feedCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  feedProduct: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  feedAmount: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  feedTotal: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  feedTotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  feedNotes: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  feedNotesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  feedNotesText: {
    fontSize: 12,
    color: '#444',
    lineHeight: 16,
  },
  contextContainer: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  contextValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  photoContainer: {
    marginTop: 8,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  reflectionItem: {
    marginBottom: 16,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  reflectionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  notes: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});