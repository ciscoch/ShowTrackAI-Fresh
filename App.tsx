import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { DemoProfileChooserScreen } from './src/features/profile/screens/DemoProfileChooserScreen';
import { ProfileChooserScreen } from './src/features/profile/screens/ProfileChooserScreen';
import { ProfileSettingsScreen } from './src/features/profile/screens/ProfileSettingsScreen';
import { FreemiumDashboard } from './src/features/dashboard/screens/FreemiumDashboard';
import { EliteDashboard } from './src/features/dashboard/screens/EliteDashboard';
import { EducatorDashboard } from './src/features/dashboard/screens/EducatorDashboard';
import { AnimalListScreen } from './src/features/animals/screens/AnimalListScreen';
import { AnimalFormScreen } from './src/features/animals/screens/AnimalFormScreen';
import { JournalListScreen } from './src/features/journal/screens/JournalListScreen';
import { JournalEntryScreen } from './src/features/journal/screens/JournalEntryScreen';
import { JournalAnalyticsScreen } from './src/features/journal/screens/JournalAnalyticsScreen';
import { FinancialTrackingScreen } from './src/features/financial/screens/FinancialTrackingScreen';
import { MedicalRecordsScreen } from './src/features/medical/screens/MedicalRecordsScreen';
import { UpgradeScreen } from './src/features/subscription/screens/UpgradeScreen';
import { useProfileStore } from './src/core/stores/ProfileStore';
import { UserProfile, Animal, Journal } from './src/core/models';
import { autoSyncService } from './src/core/services/AutoSyncService';
import { ObserverAccessScreen } from './src/features/qrcode/screens/ObserverAccessScreen';
import { ExportScreen } from './src/features/export/screens/ExportScreen';

type AppScreen = 'demoChooser' | 'profileChooser' | 'profileSettings' | 'freemiumDashboard' | 'eliteDashboard' | 'educatorDashboard' | 'animalList' | 'animalForm' | 'journalList' | 'journalEntry' | 'journalAnalytics' | 'financial' | 'medical' | 'upgrade' | 'observerAccess' | 'export';

export default function App() {
  const { currentProfile, isFirstLaunch, checkLimitations, createDemoProfiles } = useProfileStore();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('demoChooser');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | undefined>();
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<Journal | undefined>();

  useEffect(() => {
    // Initialize auto-sync service
    autoSyncService.initialize().catch(error => {
      console.error('Failed to initialize AutoSync service:', error);
    });

    // Ensure demo profiles exist and are properly migrated
    createDemoProfiles().catch(error => {
      console.error('Failed to create/migrate demo profiles:', error);
    });

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
      case 'educator':
        setCurrentScreen('educatorDashboard');
        break;
      case 'admin':
        setCurrentScreen('eliteDashboard'); // Admin uses elite dashboard for now
        break;
      case 'parent':
        setCurrentScreen('freemiumDashboard'); // Parent uses basic dashboard
        break;
      default:
        setCurrentScreen('eliteDashboard'); // Default fallback
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

  const handleNavigateToFinancial = () => {
    setCurrentScreen('financial');
  };

  const handleNavigateToMedical = () => {
    setCurrentScreen('medical');
  };

  const handleNavigateToExport = () => {
    setCurrentScreen('export');
  };

  const handleTakePhoto = () => {
    Alert.alert(
      'Take Photo',
      'Choose an option:',
      [
        { text: 'Camera', onPress: () => console.log('Open camera') },
        { text: 'Photo Library', onPress: () => console.log('Open photo library') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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
            onNavigateToExport={handleNavigateToExport}
            onNavigateToJournal={handleNavigateToJournal}
            onNavigateToFinancial={handleNavigateToFinancial}
            onNavigateToMedical={handleNavigateToMedical}
            onAddAnimal={handleAddAnimal}
            onTakePhoto={handleTakePhoto}
          />
        );

      case 'educatorDashboard':
        return (
          <EducatorDashboard
            onSwitchProfile={() => handleSafeNavigation('demoChooser')}
            onShowSettings={handleShowSettings}
            onNavigateToAnimals={() => handleSafeNavigation('animalList')}
            onNavigateToJournal={handleNavigateToJournal}
            onNavigateToFinancial={handleNavigateToFinancial}
            onNavigateToMedical={handleNavigateToMedical}
          />
        );

      case 'animalList':
        const isEducator = currentProfile?.type === 'educator';
        return (
          <AnimalListScreen
            onAddAnimal={!isEducator ? handleAddAnimal : undefined}
            onEditAnimal={!isEducator ? handleEditAnimal : undefined}
            onViewAnimal={handleViewAnimal}
            isReadOnly={isEducator}
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

      case 'financial':
        return (
          <FinancialTrackingScreen
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

      case 'medical':
        return (
          <MedicalRecordsScreen
            onBack={() => {
              // Go back to appropriate dashboard
              if (currentProfile) {
                routeToDashboard(currentProfile);
              } else {
                setCurrentScreen('demoChooser');
              }
            }}
            onNavigateToAddAnimal={() => setCurrentScreen('animalForm')}
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

      case 'observerAccess':
        return (
          <ObserverAccessScreen
            onBack={() => setCurrentScreen('demoChooser')}
          />
        );

      case 'export':
        return (
          <ExportScreen
            onExportComplete={(result) => {
              console.log('Export completed:', result);
              // Navigate back to appropriate dashboard
              if (currentProfile?.type === 'elite_student') {
                setCurrentScreen('eliteDashboard');
              } else {
                setCurrentScreen('freemiumDashboard');
              }
            }}
            onClose={() => {
              // Navigate back to appropriate dashboard
              if (currentProfile?.type === 'elite_student') {
                setCurrentScreen('eliteDashboard');
              } else {
                setCurrentScreen('freemiumDashboard');
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
            onObserverAccess={() => setCurrentScreen('observerAccess')}
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