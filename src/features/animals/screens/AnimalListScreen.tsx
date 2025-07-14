import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, SafeAreaView, ScrollView } from 'react-native';
import { Animal } from '../../../core/models';
import { useAnimalStore } from '../../../core/stores';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { educatorStudentService } from '../../../core/services/EducatorStudentService';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';
import { useAnalytics } from '../../../core/hooks/useAnalytics';

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
  
  // Analytics
  const { trackScreen, trackAnimalEvent, trackError } = useAnalytics({
    autoTrackScreenView: true,
    screenName: 'AnimalListScreen',
  });

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

  // Analytics wrapper functions
  const handleViewAnimal = (animal: Animal) => {
    trackAnimalEvent('view_details', animal);
    onViewAnimal(animal);
  };

  const handleEditAnimal = (animal: Animal) => {
    trackAnimalEvent('edit_initiated', animal);
    onEditAnimal?.(animal);
  };

  const handleAddAnimal = () => {
    trackAnimalEvent('add_initiated');
    onAddAnimal?.();
  };

  const handleDeleteAnimal = (animal: Animal) => {
    // Track analytics before showing alert
    trackAnimalEvent('delete_initiated', animal);
    
    Alert.alert(
      'Delete Animal',
      `Are you sure you want to delete ${animal.name}?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => trackAnimalEvent('delete_cancelled', animal)
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnimal(animal.id);
              trackAnimalEvent('delete_completed', animal);
            } catch (error) {
              trackError(error as Error, {
                feature: 'animal_management',
                userAction: 'delete_animal',
                animalId: animal.id,
              });
            }
          }
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
      case 'sheep': return '#9CA3AF'; // Changed from beige to better gray
      case 'pig': case 'swine': return '#EC4899'; // Changed from light pink to stronger pink
      case 'horse': return '#654321';
      case 'chicken': case 'poultry': return '#F59E0B'; // Changed from light yellow to amber
      case 'duck': return '#4682B4';
      case 'rabbit': return '#92400E'; // Changed from light tan to brown
      default: return '#6B7280';
    }
  };

  const renderAnimal = ({ item }: { item: Animal }) => (
    <View style={styles.animalCard}>
      {/* Card Header */}
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
              onPress={() => handleEditAnimal(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteAction]}
              onPress={() => handleDeleteAnimal(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main touchable area for animal details */}
      <TouchableOpacity 
        style={styles.cardMainContent}
        onPress={() => handleViewAnimal(item)}
        activeOpacity={0.8}
      >
        <View style={styles.animalMainInfo}>
          <Text style={styles.animalName}>{item.name}</Text>
          <View style={styles.identificationContainer}>
            <View style={styles.tagContainer}>
              <Text style={styles.tagLabel}>Ear Tag:</Text>
              <View style={styles.tagNumber}>
                <Text style={styles.tagText}>{item.earTag}</Text>
              </View>
            </View>
            <View style={styles.penContainer}>
              <Text style={styles.penLabel}>Pen:</Text>
              <View style={styles.penNumber}>
                <Text style={styles.penText}>{item.penNumber}</Text>
              </View>
            </View>
            <View style={styles.sexContainer}>
              <Text style={styles.sexLabel}>Sex:</Text>
              <View style={styles.sexBadge}>
                <Text style={styles.sexText}>{item.sex}</Text>
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

        {/* Clear call-to-action footer */}
        <View style={styles.cardFooter}>
          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>👆 Tap anywhere to view details</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Action Bar */}
      <View style={styles.quickActionBar}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => handleViewAnimal(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.quickActionIcon}>👁️</Text>
          <Text style={styles.quickActionText}>View</Text>
        </TouchableOpacity>
        
        {!isReadOnly && (
          <>
            <View style={styles.quickActionDivider} />
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => handleEditAnimal(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>✏️</Text>
              <Text style={styles.quickActionText}>Edit</Text>
            </TouchableOpacity>
            
            <View style={styles.quickActionDivider} />
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => onViewHealthRecords?.(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>🏥</Text>
              <Text style={styles.quickActionText}>Health</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
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
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddAnimal}>
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
          <Text style={styles.title} numberOfLines={1}>
            {isReadOnly ? 'Student Animals' : 'My Animals'}
          </Text>
        </View>
        {!isReadOnly && onAddAnimal ? (
          <TouchableOpacity style={styles.addButton} onPress={handleAddAnimal}>
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
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 100,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.15)',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#667eea',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    marginHorizontal: 20,
  },
  separator: {
    height: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.12)',
    overflow: 'hidden',
    transform: [{ translateY: 0 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.02)',
  },
  cardMainContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  animalIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  animalEmoji: {
    fontSize: 36,
  },
  speciesBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speciesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  deleteAction: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffe6e6',
  },
  actionIcon: {
    fontSize: 18,
  },
  animalMainInfo: {
    marginBottom: 16,
  },
  animalName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 12,
    letterSpacing: 0.3,
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
    backgroundColor: '#667eea',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  penText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sexLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sexBadge: {
    backgroundColor: '#64748b',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    borderTopColor: 'rgba(102, 126, 234, 0.08)',
    paddingTop: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.02)',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  quickActionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(102, 126, 234, 0.08)',
    backgroundColor: 'rgba(102, 126, 234, 0.02)',
  },
  quickAction: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionDivider: {
    width: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  quickActionIcon: {
    fontSize: 18,
  },
  quickActionText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    width: 90,
    height: 90,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderRadius: 45,
    transform: [{ translateX: -45 }, { translateY: -45 }],
  },
  emptyTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 17,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 28,
  },
  addIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  helpTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderColor: 'rgba(102, 126, 234, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  helpTipIcon: {
    fontSize: 16,
  },
  helpTipText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
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