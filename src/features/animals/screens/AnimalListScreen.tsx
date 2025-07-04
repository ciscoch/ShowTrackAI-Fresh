import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Animal } from '../../../core/models';
import { useAnimalStore } from '../../../core/stores';

interface AnimalListScreenProps {
  onAddAnimal: () => void;
  onEditAnimal: (animal: Animal) => void;
  onViewAnimal: (animal: Animal) => void;
  onViewHealthRecords?: (animal: Animal) => void;
  onBack?: () => void;
}

export const AnimalListScreen: React.FC<AnimalListScreenProps> = ({
  onAddAnimal,
  onEditAnimal,
  onViewAnimal,
  onViewHealthRecords,
  onBack,
}) => {
  const { animals, loadAnimals, deleteAnimal, error } = useAnimalStore();

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

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

  const renderAnimal = ({ item }: { item: Animal }) => (
    <TouchableOpacity 
      style={styles.animalCard}
      onPress={() => onViewAnimal(item)}
    >
      <View style={styles.animalInfo}>
        <Text style={styles.animalName}>{item.name}</Text>
        <Text style={styles.animalDetails}>
          {item.species} • Tag: {item.tagNumber}
        </Text>
        <Text style={styles.animalBreed}>{item.breed}</Text>
      </View>
      
      <View style={styles.animalActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => onEditAnimal(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteAnimal(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Animals Added</Text>
      <Text style={styles.emptySubtitle}>
        Add your first animal to start tracking your livestock project
      </Text>
      <TouchableOpacity style={styles.button} onPress={onAddAnimal}>
        <Text style={styles.buttonText}>Add First Animal</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>My Animals ({animals.length})</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAddAnimal}>
          <Text style={styles.addButtonText}>Add Animal</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        renderItem={renderAnimal}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  animalBreed: {
    fontSize: 14,
    color: '#999',
  },
  animalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
});