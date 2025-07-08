import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, SafeAreaView, ScrollView } from 'react-native';
import { Animal } from '../../../core/models';
import { useAnimalStore } from '../../../core/stores';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { educatorStudentService } from '../../../core/services/EducatorStudentService';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';

interface AnimalListScreenProps {
  onAddAnimal?: () => void;
  onEditAnimal?: (animal: Animal) => void;
  onViewAnimal: (animal: Animal) => void;
  onViewHealthRecords?: (animal: Animal) => void;
  onBack?: () => void;
  isReadOnly?: boolean;
}

export const AnimalListScreen: React.FC<AnimalListScreenProps> = ({
  onAddAnimal,
  onEditAnimal,
  onViewAnimal,
  onViewHealthRecords,
  onBack,
  isReadOnly = false,
}) => {
  const { animals, loadAnimals, deleteAnimal, error, isLoading } = useAnimalStore();
  const { currentProfile } = useProfileStore();
  const { user, profile } = useAuth();
  const { isEnabled: useBackend } = useSupabaseBackend();
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);

  useEffect(() => {
    if (useBackend && !user) {
      // Don't load animals if using backend but not authenticated
      return;
    }
    
    if (isReadOnly && (currentProfile?.type === 'educator' || profile?.role === 'educator')) {
      loadEducatorAnimals();
    } else {
      loadAnimals();
    }
  }, [loadAnimals, isReadOnly, currentProfile, user, profile, useBackend]);

  useEffect(() => {
    if (!isReadOnly) {
      setFilteredAnimals(animals);
    }
  }, [animals, isReadOnly]);

  const loadEducatorAnimals = async () => {
    const activeProfile = profile || currentProfile;
    if (!activeProfile || (activeProfile.type !== 'educator' && activeProfile.role !== 'educator')) return;
    
    try {
      setIsLoadingFiltered(true);
      
      if (useBackend && profile) {
        // For backend: Load students linked to this educator
        // TODO: Implement proper educator-student relationship queries
        // For now, load all animals (would need proper filtering in production)
        await loadAnimals();
        setFilteredAnimals(animals);
      } else {
        // For local storage: Use existing local service
        const students = await educatorStudentService.getStudentsForEducator(activeProfile.id);
        const allStudentAnimals: Animal[] = [];
        
        for (const student of students) {
          const studentRecord = await educatorStudentService.getStudentRecord(student.id, activeProfile.id);
          if (studentRecord) {
            allStudentAnimals.push(...studentRecord.animals);
          }
        }
        
        setFilteredAnimals(allStudentAnimals);
      }
    } catch (error) {
      console.error('Failed to load educator animals:', error);
      setFilteredAnimals([]);
    } finally {
      setIsLoadingFiltered(false);
    }
  };

  const handleDeleteAnimal = (animal: Animal) => {
    Alert.alert(
      'Delete Animal',
      `Are you sure you want to delete ${animal.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteAnimal(animal.id)
        }
      ]
    );
  };

  const getAnimalEmoji = (species: string): string => {
    switch (species.toLowerCase()) {
      case 'cattle': case 'cow': case 'bull': return '🐄';
      case 'goat': return '🐐';
      case 'sheep': return '🐑';
      case 'pig': case 'swine': return '🐷';
      case 'horse': return '🐴';
      case 'chicken': case 'poultry': return '🐔';
      case 'duck': return '🦆';
      case 'rabbit': return '🐰';
      default: return '🐾';
    }
  };

  const getSpeciesColor = (species: string): string => {
    switch (species.toLowerCase()) {
      case 'cattle': case 'cow': case 'bull': return '#8B4513';
      case 'goat': return '#A0522D';
      case 'sheep': return '#F5F5DC';
      case 'pig': case 'swine': return '#FFC0CB';
      case 'horse': return '#654321';
      case 'chicken': case 'poultry': return '#FFD700';
      case 'duck': return '#4682B4';
      case 'rabbit': return '#DEB887';
      default: return '#6B7280';
    }
  };

  const renderAnimal = ({ item }: { item: Animal }) => (
    <TouchableOpacity 
      style={styles.animalCard}
      onPress={() => onViewAnimal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.animalIconContainer}>
          <Text style={styles.animalEmoji}>{getAnimalEmoji(item.species)}</Text>
          <View style={[styles.speciesBadge, { backgroundColor: getSpeciesColor(item.species) }]}>
            <Text style={styles.speciesText}>{item.species}</Text>
          </View>
        </View>
        {!isReadOnly && (
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEditAnimal?.(item);
              }}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteAction]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteAnimal(item);
              }}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.animalMainInfo}>
        <Text style={styles.animalName}>{item.name}</Text>
        <View style={styles.identificationContainer}>
          <View style={styles.tagContainer}>
            <Text style={styles.tagLabel}>Tag:</Text>
            <View style={styles.tagNumber}>
              <Text style={styles.tagText}>{item.tagNumber}</Text>
            </View>
          </View>
          <View style={styles.penContainer}>
            <Text style={styles.penLabel}>Pen:</Text>
            <View style={styles.penNumber}>
              <Text style={styles.penText}>{item.penNumber}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.animalDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🏷️</Text>
          <Text style={styles.detailLabel}>Breed:</Text>
          <Text style={styles.detailValue}>{item.breed}</Text>
        </View>
        {item.dateOfBirth && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🎂</Text>
            <Text style={styles.detailLabel}>Born:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.dateOfBirth).toLocaleDateString()}
            </Text>
          </View>
        )}
        {item.weight && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⚖️</Text>
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>{item.weight} lbs</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>Tap to view details</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>🐾</Text>
        <View style={styles.emptyIconBackground} />
      </View>
      <Text style={styles.emptyTitle}>{isReadOnly ? 'No Animals to Display' : 'No Animals Yet'}</Text>
      <Text style={styles.emptySubtitle}>
        {isReadOnly 
          ? 'Students have not added any animals to their projects yet. Animal records will appear here once students begin their livestock management.' 
          : 'Start building your livestock project by adding your first animal. Track their health, growth, and progress!'
        }
      </Text>
      {!isReadOnly && onAddAnimal && (
        <TouchableOpacity style={styles.primaryButton} onPress={onAddAnimal}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.primaryButtonText}>Add Your First Animal</Text>
        </TouchableOpacity>
      )}
      {!isReadOnly && (
        <View style={styles.helpTip}>
          <Text style={styles.helpTipIcon}>💡</Text>
          <Text style={styles.helpTipText}>
            Pro tip: Add photos and detailed info to make the most of your tracking
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isReadOnly ? 'Student Animals' : 'My Animals'}
            {useBackend && user && (
              <Text style={styles.authIndicator}> (Authenticated)</Text>
            )}
          </Text>
        </View>
        {!isReadOnly && onAddAnimal ? (
          <TouchableOpacity style={styles.addButton} onPress={onAddAnimal}>
            <Text style={styles.addButtonText}>+ Add Animal</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {useBackend && !user && (
        <View style={styles.warningContainer}>
          <View style={styles.warningIconContainer}>
            <Text style={styles.warningIcon}>🔒</Text>
          </View>
          <Text style={styles.warningText}>Please sign in to access your animals</Text>
        </View>
      )}

      <View style={styles.content}>
        {filteredAnimals.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🐾</Text>
              <Text style={styles.statLabel}>Total Animals</Text>
              <Text style={styles.statValue}>{filteredAnimals.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statLabel}>Species</Text>
              <Text style={styles.statValue}>
                {new Set(filteredAnimals.map(a => a.species)).size}
              </Text>
            </View>
          </View>
        )}

        <FlatList
          data={filteredAnimals}
          keyExtractor={(item) => item.id}
          renderItem={renderAnimal}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
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
  authIndicator: {
    fontSize: 12,
    fontWeight: 'normal',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerSpacer: {
    width: 100,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
  },
  separator: {
    height: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  animalIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  animalEmoji: {
    fontSize: 32,
  },
  speciesBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speciesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deleteAction: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffe6e6',
  },
  actionIcon: {
    fontSize: 16,
  },
  animalMainInfo: {
    marginBottom: 16,
  },
  animalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  identificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagNumber: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  penContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  penLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  penNumber: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  penText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  animalDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 16,
    width: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 64,
    zIndex: 1,
  },
  emptyIconBackground: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 40,
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  addIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helpTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  helpTipIcon: {
    fontSize: 16,
  },
  helpTipText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
    lineHeight: 16,
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffe6e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#d63031',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffeaa7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
});