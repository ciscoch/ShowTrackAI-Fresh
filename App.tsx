import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { DemoProfileChooserScreen } from './src/features/profile/screens/DemoProfileChooserScreen';
import { ProfileChooserScreen } from './src/features/profile/screens/ProfileChooserScreen';
import { ProfileSettingsScreen } from './src/features/profile/screens/ProfileSettingsScreen';
import { FreemiumDashboard } from './src/features/dashboard/screens/FreemiumDashboard';
import { EliteDashboard } from './src/features/dashboard/screens/EliteDashboard';
import { AnimalListScreen } from './src/features/animals/screens/AnimalListScreen';
import { AnimalFormScreen } from './src/features/animals/screens/AnimalFormScreen';
import { JournalListScreen } from './src/features/journal/screens/JournalListScreen';
import { JournalEntryScreen } from './src/features/journal/screens/JournalEntryScreen';
import { JournalAnalyticsScreen } from './src/features/journal/screens/JournalAnalyticsScreen';
import { UpgradeScreen } from './src/features/subscription/screens/UpgradeScreen';
import { useProfileStore } from './src/core/stores/ProfileStore';
import { UserProfile, Animal, Journal } from './src/core/models';

type AppScreen = 'demoChooser' | 'profileChooser' | 'profileSettings' | 'freemiumDashboard' | 'eliteDashboard' | 'animalList' | 'animalForm' | 'journalList' | 'journalEntry' | 'journalAnalytics' | 'upgrade';

export default function App() {
  const { currentProfile, isFirstLaunch, checkLimitations } = useProfileStore();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('demoChooser');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | undefined>();
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<Journal | undefined>();

  useEffect(() => {
    // Always start with demo chooser on first launch
    if (isFirstLaunch || !currentProfile) {
      setCurrentScreen('demoChooser');
    } else {
      // Route to appropriate dashboard based on profile type
      routeToDashboard(currentProfile);
    }
  }, [currentProfile, isFirstLaunch]);

  const routeToDashboard = (profile: UserProfile) => {
    switch (profile.type) {
      case 'freemium_student':
        setCurrentScreen('freemiumDashboard');
        break;
      case 'elite_student':
        setCurrentScreen('eliteDashboard');
        break;
      default:
        setCurrentScreen('eliteDashboard'); // Default to elite for other types
    }
  };

  const handleProfileSelected = (profile: UserProfile) => {
    console.log(`✅ Auto-login: ${profile.name} (${profile.type})`);
    routeToDashboard(profile);
  };

  const handleShowSettings = () => {
    setCurrentScreen('profileSettings');
  };

  const handleCloseSettings = () => {
    setCurrentScreen('demoChooser');
  };

  const handleDeleteProfile = () => {
    setCurrentScreen('demoChooser');
  };

  const handleCreateCustomProfile = () => {
    setCurrentScreen('profileChooser');
  };

  const handleUpgrade = () => {
    setCurrentScreen('upgrade');
  };

  // Animal management handlers
  const handleAddAnimal = () => {
    if (!currentProfile) return;
    
    const limitation = checkLimitations(currentProfile.id, 'add_animal');
    if (!limitation.allowed) {
      Alert.alert('Upgrade Required', limitation.message, [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: handleUpgrade }
      ]);
      return;
    }
    
    setSelectedAnimal(undefined);
    setCurrentScreen('animalForm');
  };

  const handleEditAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('animalForm');
  };

  const handleViewAnimal = (animal: Animal) => {
    handleEditAnimal(animal);
  };

  const handleSaveAnimal = () => {
    setCurrentScreen('animalList');
    setSelectedAnimal(undefined);
  };

  const handleCancelAnimal = () => {
    setCurrentScreen('animalList');
    setSelectedAnimal(undefined);
  };

  // Journal management handlers
  const handleNavigateToJournal = () => {
    setCurrentScreen('journalList');
  };

  const handleAddJournalEntry = () => {
    setSelectedJournalEntry(undefined);
    setCurrentScreen('journalEntry');
  };

  const handleEditJournalEntry = (entry: Journal) => {
    setSelectedJournalEntry(entry);
    setCurrentScreen('journalEntry');
  };

  const handleSaveJournalEntry = () => {
    setCurrentScreen('journalList');
    setSelectedJournalEntry(undefined);
  };

  const handleCancelJournalEntry = () => {
    setCurrentScreen('journalList');
    setSelectedJournalEntry(undefined);
  };

  const handleViewJournalAnalytics = () => {
    setCurrentScreen('journalAnalytics');
  };

  // Navigation with safety - always provide a way back
  const handleSafeNavigation = (targetScreen: AppScreen) => {
    setCurrentScreen(targetScreen);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'demoChooser':
        return (
          <DemoProfileChooserScreen
            onProfileSelected={handleProfileSelected}
            onCreateCustomProfile={handleCreateCustomProfile}
            onShowSettings={handleShowSettings}
          />
        );

      case 'profileChooser':
        return (
          <ProfileChooserScreen
            onProfileSelected={handleProfileSelected}
            onShowSettings={handleShowSettings}
          />
        );

      case 'profileSettings':
        return (
          <ProfileSettingsScreen
            onClose={handleCloseSettings}
            onDeleteProfile={handleDeleteProfile}
          />
        );

      case 'freemiumDashboard':
        return (
          <FreemiumDashboard
            onSwitchProfile={() => handleSafeNavigation('demoChooser')}
            onShowSettings={handleShowSettings}
            onNavigateToAnimals={() => handleSafeNavigation('animalList')}
            onUpgrade={handleUpgrade}
          />
        );

      case 'eliteDashboard':
        return (
          <EliteDashboard
            onSwitchProfile={() => handleSafeNavigation('demoChooser')}
            onShowSettings={handleShowSettings}
            onNavigateToAnimals={() => handleSafeNavigation('animalList')}
            onNavigateToAnalytics={() => console.log('Navigate to Analytics')}
            onNavigateToAI={() => console.log('Navigate to AI')}
            onNavigateToExport={() => console.log('Navigate to Export')}
            onNavigateToJournal={handleNavigateToJournal}
          />
        );

      case 'animalList':
        return (
          <AnimalListScreen
            onAddAnimal={handleAddAnimal}
            onEditAnimal={handleEditAnimal}
            onViewAnimal={handleViewAnimal}
            onBack={() => {
              // Go back to appropriate dashboard
              if (currentProfile) {
                routeToDashboard(currentProfile);
              } else {
                setCurrentScreen('demoChooser');
              }
            }}
          />
        );

      case 'animalForm':
        return (
          <AnimalFormScreen
            animal={selectedAnimal}
            onSave={handleSaveAnimal}
            onCancel={handleCancelAnimal}
          />
        );

      case 'journalList':
        return (
          <JournalListScreen
            onAddEntry={handleAddJournalEntry}
            onEditEntry={handleEditJournalEntry}
            onViewAnalytics={handleViewJournalAnalytics}
            onBack={() => {
              // Go back to appropriate dashboard
              if (currentProfile) {
                routeToDashboard(currentProfile);
              } else {
                setCurrentScreen('demoChooser');
              }
            }}
          />
        );

      case 'journalEntry':
        return (
          <JournalEntryScreen
            entry={selectedJournalEntry}
            onSave={handleSaveJournalEntry}
            onCancel={handleCancelJournalEntry}
            onBack={() => {
              setCurrentScreen('journalList');
              setSelectedJournalEntry(undefined);
            }}
          />
        );

      case 'journalAnalytics':
        return (
          <JournalAnalyticsScreen
            onBack={() => {
              setCurrentScreen('journalList');
            }}
          />
        );

      case 'upgrade':
        return (
          <UpgradeScreen
            onUpgradeComplete={(tier) => {
              // Switch to elite dashboard after upgrade
              setCurrentScreen('eliteDashboard');
            }}
            onClose={() => {
              // Go back to appropriate dashboard
              if (currentProfile) {
                routeToDashboard(currentProfile);
              } else {
                setCurrentScreen('demoChooser');
              }
            }}
          />
        );

      default:
        return (
          <DemoProfileChooserScreen
            onProfileSelected={handleProfileSelected}
            onCreateCustomProfile={handleCreateCustomProfile}
            onShowSettings={handleShowSettings}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      {renderCurrentScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});