import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Animal } from '../../../core/models/Animal';

interface AnimalDetailsScreenProps {
  animal: Animal;
  onEdit: () => void;
  onBack: () => void;
  onViewWeightHistory?: () => void;
}

export const AnimalDetailsScreen: React.FC<AnimalDetailsScreenProps> = ({
  animal,
  onEdit,
  onBack,
  onViewWeightHistory,
}) => {
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

  const formatDate = (date?: Date): string => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString();
  };

  const DetailRow: React.FC<{ icon: string; label: string; value: string | number; color?: string }> = ({
    icon,
    label,
    value,
    color,
  }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, color && { color }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Animal Details</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Animal Header */}
        <View style={styles.animalHeader}>
          <View style={styles.animalIconContainer}>
            <Text style={styles.animalEmoji}>{getAnimalEmoji(animal.species)}</Text>
            <View style={[styles.speciesBadge, { backgroundColor: getSpeciesColor(animal.species) }]}>
              <Text style={styles.speciesText}>{animal.species}</Text>
            </View>
          </View>
          <View style={styles.animalInfo}>
            <Text style={styles.animalName}>{animal.name}</Text>
            <View style={styles.identificationContainer}>
              <View style={styles.tagContainer}>
                <Text style={styles.tagLabel}>Tag:</Text>
                <View style={styles.tagNumber}>
                  <Text style={styles.tagText}>{animal.tagNumber}</Text>
                </View>
              </View>
              <View style={styles.penContainer}>
                <Text style={styles.penLabel}>Pen:</Text>
                <View style={styles.penNumber}>
                  <Text style={styles.penText}>{animal.penNumber}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Basic Information</Text>
          <View style={styles.sectionContent}>
            <DetailRow icon="🏷️" label="Breed" value={animal.breed} />
            <DetailRow icon="👨‍🌾" label="Breeder" value={animal.breeder} />
            <DetailRow icon="🎯" label="Project Type" value={animal.projectType} />
            <DetailRow 
              icon="💰" 
              label="Acquisition Cost" 
              value={`$${animal.acquisitionCost.toFixed(2)}`} 
              color="#28a745"
            />
          </View>
        </View>

        {/* Physical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📏 Physical Information</Text>
          <View style={styles.sectionContent}>
            {animal.weight && (
              <DetailRow 
                icon="⚖️" 
                label="Current Weight" 
                value={`${animal.weight} lbs`}
                color="#007AFF"
              />
            )}
            <DetailRow 
              icon="❤️" 
              label="Health Status" 
              value={animal.healthStatus}
              color={animal.healthStatus === 'Healthy' ? '#28a745' : '#dc3545'}
            />
          </View>
        </View>

        {/* Important Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Important Dates</Text>
          <View style={styles.sectionContent}>
            <DetailRow icon="🎂" label="Birth Date" value={formatDate(animal.birthDate)} />
            <DetailRow icon="🚚" label="Pickup Date" value={formatDate(animal.pickupDate)} />
            <DetailRow icon="📝" label="Created" value={formatDate(animal.createdAt)} />
            <DetailRow icon="🔄" label="Last Updated" value={formatDate(animal.updatedAt)} />
          </View>
        </View>

        {/* Notes */}
        {animal.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{animal.notes}</Text>
            </View>
          </View>
        )}

        {/* Elite Features */}
        <View style={styles.eliteSection}>
          <Text style={styles.eliteSectionTitle}>⭐ Elite Features</Text>
          
          <TouchableOpacity style={styles.eliteFeatureCard}>
            <View style={styles.eliteFeatureIcon}>
              <Text style={styles.eliteFeatureEmoji}>📸</Text>
            </View>
            <View style={styles.eliteFeatureContent}>
              <Text style={styles.eliteFeatureTitle}>Photo Gallery</Text>
              <Text style={styles.eliteFeatureSubtitle}>Manage animal photos</Text>
            </View>
            <Text style={styles.eliteFeatureArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.eliteFeatureCard}
            onPress={onViewWeightHistory}
          >
            <View style={styles.eliteFeatureIcon}>
              <Text style={styles.eliteFeatureEmoji}>📊</Text>
            </View>
            <View style={styles.eliteFeatureContent}>
              <Text style={styles.eliteFeatureTitle}>Weight History</Text>
              <Text style={styles.eliteFeatureSubtitle}>Track weight over time</Text>
            </View>
            <Text style={styles.eliteFeatureArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.eliteFeatureCard}>
            <View style={styles.eliteFeatureIcon}>
              <Text style={styles.eliteFeatureEmoji}>🤖</Text>
            </View>
            <View style={styles.eliteFeatureContent}>
              <Text style={styles.eliteFeatureTitle}>AI Weight Prediction</Text>
              <Text style={styles.eliteFeatureSubtitle}>91.6% accuracy prediction</Text>
            </View>
            <Text style={styles.eliteFeatureArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.eliteFeatureCard}>
            <View style={styles.eliteFeatureIcon}>
              <Text style={styles.eliteFeatureEmoji}>🏥</Text>
            </View>
            <View style={styles.eliteFeatureContent}>
              <Text style={styles.eliteFeatureTitle}>Health Records</Text>
              <Text style={styles.eliteFeatureSubtitle}>Medical history & alerts</Text>
            </View>
            <Text style={styles.eliteFeatureArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  animalHeader: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  animalEmoji: {
    fontSize: 48,
    marginBottom: 8,
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
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
  },
  identificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  notesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  eliteSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  eliteSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  eliteFeatureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  eliteFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fbff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eliteFeatureEmoji: {
    fontSize: 24,
  },
  eliteFeatureContent: {
    flex: 1,
  },
  eliteFeatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eliteFeatureSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  eliteFeatureArrow: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});