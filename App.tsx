import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AnimalListScreen } from './src/features/animals/screens/AnimalListScreen';
import { AnimalFormScreen } from './src/features/animals/screens/AnimalFormScreen';
import { Animal } from './src/core/models/Animal';

type Screen = 'list' | 'form';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('list');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | undefined>();

  const handleAddAnimal = () => {
    setSelectedAnimal(undefined);
    setCurrentScreen('form');
  };

  const handleEditAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('form');
  };

  const handleViewAnimal = (animal: Animal) => {
    // For now, just edit when viewing
    handleEditAnimal(animal);
  };

  const handleSaveAnimal = () => {
    setCurrentScreen('list');
    setSelectedAnimal(undefined);
  };

  const handleCancel = () => {
    setCurrentScreen('list');
    setSelectedAnimal(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {currentScreen === 'list' ? (
        <AnimalListScreen
          onAddAnimal={handleAddAnimal}
          onEditAnimal={handleEditAnimal}
          onViewAnimal={handleViewAnimal}
        />
      ) : (
        <AnimalFormScreen
          animal={selectedAnimal}
          onSave={handleSaveAnimal}
          onCancel={handleCancel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
