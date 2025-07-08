/**
 * Parent Animal View
 * Allows parents to view and monitor their child's animals
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';
import { Animal } from '../../../core/models/Animal';
import { AnimalPermissionsService } from '../../../core/services/AnimalPermissionsService';

interface ParentAnimalViewProps {
  onViewAnimal: (animal: Animal) => void;
  onBack?: () => void;
}

export const ParentAnimalView: React.FC<ParentAnimalViewProps> = ({
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
  const [childGroups, setChildGroups] = useState<{ [key: string]: Animal[] }>({});
  const [permissionSummary, setPermissionSummary] = useState<string[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    if (profile?.role === 'parent') {
      loadAnimals();
      updatePermissionSummary();
    }
  }, [profile, loadAnimals]);

  useEffect(() => {
    if (profile?.role === 'parent' && user) {
      const context = { user, profile };
      const filtered = getFilteredAnimals(context);
      setFilteredAnimals(filtered);
      
      // Group animals by child (owner)
      const groups: { [key: string]: Animal[] } = {};
      let expenses = 0;
      
      filtered.forEach(animal => {
        const ownerId = animal.owner_id || 'unknown';
        if (!groups[ownerId]) {
          groups[ownerId] = [];
        }
        groups[ownerId].push(animal);
        expenses += animal.acquisitionCost || 0;
      });
      
      setChildGroups(groups);
      setTotalExpenses(expenses);
    }
  }, [animals, profile, user, getFilteredAnimals]);

  const updatePermissionSummary = () => {
    if (profile?.role === 'parent') {
      const accessPatterns = AnimalPermissionsService.getRoleAccessPatterns('parent');
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

  const getProjectTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'market': return '#007AFF';
      case 'breeding': return '#28a745';
      case 'show': return '#ffc107';
      case 'dairy': return '#6f42c1';
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
        isChildAnimal: !isOwnAnimal,
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
        
        <View style={styles.animalMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Project:</Text>
            <View style={[
              styles.projectBadge,
              { backgroundColor: getProjectTypeColor(animal.projectType) }
            ]}>
              <Text style={styles.projectText}>{animal.projectType}</Text>
            </View>
          </View>
          
          {animal.weight && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Weight:</Text>
              <Text style={styles.metricValue}>{animal.weight} lbs</Text>
            </View>
          )}
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Investment:</Text>
            <Text style={styles.metricValue}>${animal.acquisitionCost?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
        
        {animal.birthDate && (
          <View style={styles.ageContainer}>
            <Text style={styles.ageLabel}>Age:</Text>
            <Text style={styles.ageValue}>
              {Math.floor((new Date().getTime() - new Date(animal.birthDate).getTime()) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
        )}
        
        {permissions && (
          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsLabel}>Your Access:</Text>
            <View style={styles.permissionsList}>
              {permissions.canView && <Text style={styles.permissionTag}>View</Text>}
              {permissions.canEdit && <Text style={styles.permissionTag}>Edit</Text>}
              {permissions.canViewFinancials && <Text style={styles.permissionTag}>Finances</Text>}
              {permissions.canExport && <Text style={styles.permissionTag}>Export</Text>}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderChildGroup = (ownerId: string, animals: Animal[]) => {
    const isOwnGroup = ownerId === user?.id;
    const groupTitle = isOwnGroup ? 'Your Animals' : `Child's Animals (${ownerId})`;
    const groupExpenses = animals.reduce((sum, animal) => sum + (animal.acquisitionCost || 0), 0);
    
    return (
      <View key={ownerId} style={styles.childGroup}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupTitle}>{groupTitle}</Text>
            <Text style={styles.groupStats}>
              {animals.length} animals • ${groupExpenses.toFixed(2)} invested
            </Text>
          </View>
          <View style={styles.groupMetrics}>
            <View style={styles.speciesBreakdown}>
              {Object.entries(
                animals.reduce((acc, animal) => {
                  acc[animal.species] = (acc[animal.species] || 0) + 1;
                  return acc;
                }, {} as { [key: string]: number })
              ).map(([species, count]) => (
                <Text key={species} style={styles.speciesCount}>
                  {getAnimalEmoji(species)} {count}
                </Text>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.groupAnimals}>
          {animals.map(renderAnimalCard)}
        </View>
      </View>
    );
  };

  if (profile?.role !== 'parent') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>This view is only available to parents.</Text>
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
        <Text style={styles.title}>Child Animal Monitoring</Text>
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
        <Text style={styles.summaryTitle}>Parent Access Rights</Text>
        <Text style={styles.summaryText}>
          As a parent, you can monitor your child's livestock projects and view their progress.
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
          <Text style={styles.statValue}>{Object.keys(childGroups).length}</Text>
          <Text style={styles.statLabel}>Children</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${totalExpenses.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Investment</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading animals...</Text>
        </View>
      ) : filteredAnimals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>No Child Animals to Monitor</Text>
          <Text style={styles.emptyText}>
            Your children have not started any livestock projects yet. Animal records 
            will appear here when they begin their agricultural education activities.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {Object.entries(childGroups).map(([ownerId, animals]) => 
            renderChildGroup(ownerId, animals)
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
    backgroundColor: '#6f42c1',
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
    color: '#6f42c1',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
  },
  childGroup: {
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
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupStats: {
    fontSize: 14,
    color: '#666',
  },
  groupMetrics: {
    alignItems: 'flex-end',
  },
  speciesBreakdown: {
    flexDirection: 'row',
    gap: 8,
  },
  speciesCount: {
    fontSize: 12,
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
    borderLeftColor: '#6f42c1',
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
  animalMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  projectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ageLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  ageValue: {
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
    color: '#6f42c1',
    backgroundColor: 'rgba(111, 66, 193, 0.1)',
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