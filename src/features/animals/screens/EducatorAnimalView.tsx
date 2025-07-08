/**
 * Educator Animal View
 * Allows educators to view and supervise student animals
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';
import { Animal } from '../../../core/models/Animal';
import { AnimalPermissionsService } from '../../../core/services/AnimalPermissionsService';

interface EducatorAnimalViewProps {
  onViewAnimal: (animal: Animal) => void;
  onBack?: () => void;
}

export const EducatorAnimalView: React.FC<EducatorAnimalViewProps> = ({
  onViewAnimal,
  onBack,
}) => {
  const { 
    animals, 
    loadAnimals, 
    getFilteredAnimals, 
    canPerformAction, 
    isLoading, 
    error 
  } = useAnimalStore();
  
  const { user, profile } = useAuth();
  const { isEnabled: useBackend } = useSupabaseBackend();
  
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [studentGroups, setStudentGroups] = useState<{ [key: string]: Animal[] }>({});
  const [permissionSummary, setPermissionSummary] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.role === 'educator') {
      loadAnimals();
      updatePermissionSummary();
    }
  }, [profile, loadAnimals]);

  useEffect(() => {
    if (profile?.role === 'educator' && user) {
      const context = { user, profile };
      const filtered = getFilteredAnimals(context);
      setFilteredAnimals(filtered);
      
      // Group animals by student (owner)
      const groups: { [key: string]: Animal[] } = {};
      filtered.forEach(animal => {
        const ownerId = animal.owner_id || 'unknown';
        if (!groups[ownerId]) {
          groups[ownerId] = [];
        }
        groups[ownerId].push(animal);
      });
      
      setStudentGroups(groups);
    }
  }, [animals, profile, user, getFilteredAnimals]);

  const updatePermissionSummary = () => {
    if (profile?.role === 'educator') {
      const accessPatterns = AnimalPermissionsService.getRoleAccessPatterns('educator');
      setPermissionSummary(accessPatterns.permissions);
    }
  };

  const handleViewAnimal = (animal: Animal) => {
    if (user && profile) {
      const context = { user, profile };
      const canView = canPerformAction('canView', animal, context);
      
      if (canView) {
        onViewAnimal(animal);
      } else {
        Alert.alert('Access Denied', 'You do not have permission to view this animal.');
      }
    }
  };

  const getAnimalEmoji = (species: string): string => {
    switch (species.toLowerCase()) {
      case 'cattle': return '🐄';
      case 'goat': return '🐐';
      case 'sheep': return '🐑';
      case 'pig': return '🐷';
      default: return '🐾';
    }
  };

  const getHealthStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy': return '#28a745';
      case 'sick': return '#dc3545';
      case 'injured': return '#fd7e14';
      case 'under treatment': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const renderAnimalCard = (animal: Animal) => {
    const isOwnAnimal = animal.owner_id === user?.id;
    const permissions = user && profile ? 
      AnimalPermissionsService.getAnimalPermissions({
        user,
        profile,
        targetAnimal: animal,
        isOwnAnimal,
        isStudentAnimal: !isOwnAnimal,
      }) : null;

    return (
      <TouchableOpacity 
        key={animal.id}
        style={[
          styles.animalCard,
          isOwnAnimal && styles.ownAnimalCard
        ]}
        onPress={() => handleViewAnimal(animal)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.animalInfo}>
            <Text style={styles.animalEmoji}>{getAnimalEmoji(animal.species)}</Text>
            <View style={styles.animalDetails}>
              <Text style={styles.animalName}>{animal.name}</Text>
              <Text style={styles.animalSpecies}>{animal.species} • {animal.breed}</Text>
              <Text style={styles.animalTags}>
                Tag: {animal.tagNumber} • Pen: {animal.penNumber}
              </Text>
            </View>
          </View>
          <View style={styles.cardStatus}>
            <View style={[
              styles.healthBadge,
              { backgroundColor: getHealthStatusColor(animal.healthStatus) }
            ]}>
              <Text style={styles.healthText}>{animal.healthStatus}</Text>
            </View>
            {isOwnAnimal && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerText}>Your Animal</Text>
              </View>
            )}
          </View>
        </View>
        
        {animal.weight && (
          <View style={styles.weightContainer}>
            <Text style={styles.weightLabel}>Weight:</Text>
            <Text style={styles.weightValue}>{animal.weight} lbs</Text>
          </View>
        )}
        
        {permissions && (
          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsLabel}>Your Access:</Text>
            <View style={styles.permissionsList}>
              {permissions.canView && <Text style={styles.permissionTag}>View</Text>}
              {permissions.canEdit && <Text style={styles.permissionTag}>Edit</Text>}
              {permissions.canManageHealth && <Text style={styles.permissionTag}>Health</Text>}
              {permissions.canViewFinancials && <Text style={styles.permissionTag}>Finances</Text>}
              {permissions.canExport && <Text style={styles.permissionTag}>Export</Text>}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStudentGroup = (ownerId: string, animals: Animal[]) => {
    const isOwnGroup = ownerId === user?.id;
    const groupTitle = isOwnGroup ? 'Your Animals' : `Student Animals (${ownerId})`;
    
    return (
      <View key={ownerId} style={styles.studentGroup}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{groupTitle}</Text>
          <Text style={styles.groupCount}>{animals.length} animals</Text>
        </View>
        <View style={styles.groupAnimals}>
          {animals.map(renderAnimalCard)}
        </View>
      </View>
    );
  };

  if (profile?.role !== 'educator') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>This view is only available to educators.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Student Animal Supervision</Text>
        <Text style={styles.subtitle}>
          {useBackend ? 'Backend Mode' : 'Local Storage Mode'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.permissionsSummary}>
        <Text style={styles.summaryTitle}>Educator Permissions</Text>
        <Text style={styles.summaryText}>
          As an educator, you can view and supervise student animals for educational purposes.
        </Text>
        <View style={styles.permissionsList}>
          {permissionSummary.map((permission, index) => (
            <Text key={index} style={styles.permissionItem}>• {permission}</Text>
          ))}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredAnimals.length}</Text>
          <Text style={styles.statLabel}>Total Animals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Object.keys(studentGroups).length}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {new Set(filteredAnimals.map(a => a.species)).size}
          </Text>
          <Text style={styles.statLabel}>Species</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading animals...</Text>
        </View>
      ) : filteredAnimals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>No Animals to Supervise</Text>
          <Text style={styles.emptyText}>
            Students have not added any animals yet. Animal records will appear here 
            once students begin their livestock projects.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {Object.entries(studentGroups).map(([ownerId, animals]) => 
            renderStudentGroup(ownerId, animals)
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#28a745',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  permissionsSummary: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  permissionsList: {
    gap: 4,
  },
  permissionItem: {
    fontSize: 14,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
  },
  studentGroup: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  groupCount: {
    fontSize: 14,
    color: '#666',
  },
  groupAnimals: {
    gap: 12,
    padding: 16,
  },
  animalCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  ownAnimalCard: {
    borderLeftColor: '#007AFF',
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  animalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  animalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  animalDetails: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  animalSpecies: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  animalTags: {
    fontSize: 12,
    color: '#999',
  },
  cardStatus: {
    alignItems: 'flex-end',
    gap: 8,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  healthText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ownerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  weightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  permissionsContainer: {
    marginTop: 8,
  },
  permissionsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  permissionTag: {
    fontSize: 10,
    color: '#28a745',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#d63031',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});