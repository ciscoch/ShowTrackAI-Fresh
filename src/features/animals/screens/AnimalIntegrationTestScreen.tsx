/**
 * Animal Integration Test Screen
 * Tests the integration between animal management and user authentication
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { useAuth } from '../../../core/contexts/AuthContext';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';
import { Animal } from '../../../core/models/Animal';

export const AnimalIntegrationTestScreen: React.FC = () => {
  const { 
    animals, 
    loadAnimals, 
    addAnimal, 
    updateAnimal, 
    deleteAnimal, 
    isLoading, 
    error,
    refreshAnimals 
  } = useAnimalStore();
  
  const { user, profile, signOut } = useAuth();
  const { isEnabled: useBackend } = useSupabaseBackend();
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testCreateAnimal = async () => {
    try {
      addTestResult('Testing animal creation...');
      await addAnimal({
        name: `Test Animal ${Date.now()}`,
        tagNumber: `T${Date.now()}`,
        penNumber: `P${Date.now()}`,
        species: 'Cattle',
        breed: 'Angus',
        breeder: 'Test Breeder',
        birthDate: new Date(),
        pickupDate: new Date(),
        projectType: 'Market',
        acquisitionCost: 500,
        weight: 100,
        notes: 'Test animal for integration testing'
      });
      addTestResult('✅ Animal created successfully');
    } catch (error) {
      addTestResult(`❌ Animal creation failed: ${error}`);
    }
  };

  const testUpdateAnimal = async () => {
    if (animals.length === 0) {
      addTestResult('❌ No animals to update');
      return;
    }

    try {
      const animal = animals[0];
      addTestResult(`Testing animal update for ${animal.name}...`);
      await updateAnimal(animal.id, {
        name: `${animal.name} (Updated)`,
        weight: (animal.weight || 0) + 10,
        notes: 'Updated by integration test'
      });
      addTestResult('✅ Animal updated successfully');
    } catch (error) {
      addTestResult(`❌ Animal update failed: ${error}`);
    }
  };

  const testDeleteAnimal = async () => {
    if (animals.length === 0) {
      addTestResult('❌ No animals to delete');
      return;
    }

    try {
      const animal = animals[animals.length - 1];
      addTestResult(`Testing animal deletion for ${animal.name}...`);
      await deleteAnimal(animal.id);
      addTestResult('✅ Animal deleted successfully');
    } catch (error) {
      addTestResult(`❌ Animal deletion failed: ${error}`);
    }
  };

  const testRefreshAnimals = async () => {
    try {
      addTestResult('Testing animal refresh...');
      await refreshAnimals();
      addTestResult('✅ Animals refreshed successfully');
    } catch (error) {
      addTestResult(`❌ Animal refresh failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addTestResult('🧪 Starting comprehensive animal integration tests...');
    
    await testCreateAnimal();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testUpdateAnimal();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRefreshAnimals();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testDeleteAnimal();
    
    addTestResult('🎉 All tests completed!');
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Animal Integration Test</Text>
        <Text style={styles.subtitle}>Testing Animal-User Integration</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Backend:</Text>
            <Text style={[styles.statusValue, useBackend ? styles.enabled : styles.disabled]}>
              {useBackend ? 'Enabled' : 'Disabled (Local)'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>User:</Text>
            <Text style={[styles.statusValue, user ? styles.enabled : styles.disabled]}>
              {user ? `${user.email}` : 'Not authenticated'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Profile:</Text>
            <Text style={[styles.statusValue, profile ? styles.enabled : styles.disabled]}>
              {profile ? `${profile.full_name} (${profile.role})` : 'No profile'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Loading:</Text>
            <Text style={[styles.statusValue, isLoading ? styles.warning : styles.enabled]}>
              {isLoading ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Animal Data</Text>
        <View style={styles.dataContainer}>
          <Text style={styles.dataLabel}>Total Animals: {animals.length}</Text>
          {animals.length > 0 && (
            <View style={styles.animalsList}>
              {animals.slice(0, 3).map((animal, index) => (
                <View key={animal.id} style={styles.animalItem}>
                  <Text style={styles.animalName}>{animal.name}</Text>
                  <Text style={styles.animalDetails}>
                    {animal.species} • Tag: {animal.tagNumber} • Pen: {animal.penNumber}
                  </Text>
                  {animal.owner_id && (
                    <Text style={styles.ownerInfo}>Owner: {animal.owner_id}</Text>
                  )}
                </View>
              ))}
              {animals.length > 3 && (
                <Text style={styles.moreAnimals}>... and {animals.length - 3} more</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Current Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Controls</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={runAllTests}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Run All Tests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={testCreateAnimal}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Create</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={testUpdateAnimal}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Update</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={testDeleteAnimal}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Delete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={testRefreshAnimals}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <TouchableOpacity onPress={clearTestResults} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.resultsContainer}>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No test results yet. Run a test to see results.</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultItem}>{result}</Text>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
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
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusContainer: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  enabled: {
    color: '#28a745',
  },
  disabled: {
    color: '#6c757d',
  },
  warning: {
    color: '#ffc107',
  },
  dataContainer: {
    gap: 8,
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  animalsList: {
    gap: 12,
    marginTop: 8,
  },
  animalItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  animalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
  },
  ownerInfo: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  moreAnimals: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d63031',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d63031',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '30%',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#6c757d',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    lineHeight: 16,
  },
});