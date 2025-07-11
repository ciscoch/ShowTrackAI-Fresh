/**
 * Main App Component - Shows when user is authenticated
 * Routes to appropriate dashboard and manages navigation
 */

import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useAuth } from '../core/contexts/AuthContext';
import { EliteDashboard } from '../features/dashboard/screens/EliteDashboard';
import { AnimalListScreen } from '../features/animals/screens/AnimalListScreen';
import { AnimalFormScreen } from '../features/animals/screens/AnimalFormScreen';
import { AnimalDetailsScreen } from '../features/animals/screens/AnimalDetailsScreen';
import { WeightHistoryScreen } from '../features/animals/screens/WeightHistoryScreen';
import { AddWeightScreen } from '../features/animals/screens/AddWeightScreen';
import { JournalListScreen, JournalEntryScreen, JournalDetailScreen } from '../features/journal/screens';
import { FinancialTrackingScreen } from '../features/financial/screens/FinancialTrackingScreen';
import { Animal } from '../core/models/Animal';
import { Journal } from '../core/models/Journal';
import { useProfileStore } from '../core/stores/ProfileStore';

interface MainAppProps {
  user?: any;
  profile?: any;
}

type AppScreen = 'dashboard' | 'animalList' | 'animalForm' | 'animalDetails' | 'weightHistory' | 'addWeight' | 'journalList' | 'journalEntry' | 'journalDetail' | 'financial';

const MainApp: React.FC<MainAppProps> = ({ user, profile }) => {
  const { signOut } = useAuth();
  const { createProfile, switchProfile, currentProfile, getAllProfiles } = useProfileStore();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | undefined>();
  const [selectedJournal, setSelectedJournal] = useState<Journal | undefined>();

  // Create a profile for the authenticated user if one doesn't exist
  useEffect(() => {
    if (user && profile && !currentProfile) {
      const existingProfiles = getAllProfiles();
      const existingProfile = existingProfiles.find(p => p.name === (profile.full_name || 'Elite Student'));
      
      if (existingProfile) {
        // Switch to existing profile
        switchProfile(existingProfile.id);
      } else {
        // Create new profile for authenticated user
        createProfile({
          name: profile.full_name || 'Elite Student',
          type: 'elite_student',
          avatar: '🎓',
          school: 'ShowTrackAI Academy',
          grade: '12',
          chapter: 'Elite Chapter',
          subscriptionTier: 'elite',
          isDemo: false,
        }).then((newProfile) => {
          console.log('Created profile for authenticated user:', newProfile.name);
        }).catch((error) => {
          console.error('Failed to create profile:', error);
        });
      }
    }
  }, [user, profile, currentProfile, createProfile, switchProfile, getAllProfiles]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const navigateToAnimals = () => {
    setCurrentScreen('animalList');
  };

  const handleAddAnimal = () => {
    setSelectedAnimal(undefined);
    setCurrentScreen('animalForm');
  };

  const handleEditAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('animalForm');
  };

  const handleViewAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('animalDetails');
  };

  const handleSaveAnimal = () => {
    setCurrentScreen('animalList');
    setSelectedAnimal(undefined);
  };

  const handleCancelAnimal = () => {
    setCurrentScreen('animalList');
    setSelectedAnimal(undefined);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
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

  const handlePlaceholderAction = (action: string) => {
    Alert.alert('Coming Soon', `${action} feature coming soon!`);
  };

  const handleViewWeightHistory = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('weightHistory');
  };

  const handleAddWeight = () => {
    setCurrentScreen('addWeight');
  };

  const handleBackFromWeight = () => {
    setCurrentScreen('animalDetails');
  };

  const handleSaveWeight = () => {
    setCurrentScreen('weightHistory');
  };

  const handleNavigateToJournal = () => {
    setCurrentScreen('journalList');
  };

  const handleAddJournalEntry = () => {
    setSelectedJournal(undefined);
    setCurrentScreen('journalEntry');
  };

  const handleViewJournalEntry = (journal: Journal) => {
    setSelectedJournal(journal);
    setCurrentScreen('journalDetail');
  };

  const handleEditJournalEntry = (journal: Journal) => {
    setSelectedJournal(journal);
    setCurrentScreen('journalEntry');
  };

  const handleBackFromJournal = () => {
    setCurrentScreen('dashboard');
    setSelectedJournal(undefined);
  };

  const handleBackToJournalList = () => {
    setCurrentScreen('journalList');
    setSelectedJournal(undefined);
  };

  const handleBackFromJournalDetail = () => {
    setCurrentScreen('journalList');
    setSelectedJournal(undefined);
  };

  const handleDeleteJournalEntry = (journal: Journal) => {
    // After deletion, return to journal list
    setCurrentScreen('journalList');
    setSelectedJournal(undefined);
  };

  const handleSaveJournal = () => {
    setCurrentScreen('journalList');
    setSelectedJournal(undefined);
  };

  const handleBackFromFinancial = () => {
    setCurrentScreen('dashboard');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <EliteDashboard
            onSwitchProfile={handleSignOut}
            onShowSettings={handleSignOut}
            onNavigateToAnimals={navigateToAnimals}
            onNavigateToAnalytics={() => handlePlaceholderAction('Analytics')}
            onNavigateToAI={() => handlePlaceholderAction('AI Features')}
            onNavigateToExport={() => handlePlaceholderAction('Export')}
            onNavigateToJournal={handleNavigateToJournal}
            onNavigateToFinancial={() => setCurrentScreen('financial')}
            onNavigateToMedical={() => handlePlaceholderAction('Medical')}
            onNavigateToCalendar={() => handlePlaceholderAction('Calendar')}
            onAddAnimal={handleAddAnimal}
            onTakePhoto={handleTakePhoto}
            onNavigateToVetConnect={() => handlePlaceholderAction('VetConnect')}
          />
        );

      case 'animalList':
        return (
          <AnimalListScreen
            onAddAnimal={handleAddAnimal}
            onEditAnimal={handleEditAnimal}
            onViewAnimal={handleViewAnimal}
            onBack={handleBackToDashboard}
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

      case 'animalDetails':
        return selectedAnimal ? (
          <AnimalDetailsScreen
            animal={selectedAnimal}
            onEdit={() => {
              setCurrentScreen('animalForm');
            }}
            onBack={() => {
              setCurrentScreen('animalList');
              setSelectedAnimal(undefined);
            }}
            onViewWeightHistory={() => handleViewWeightHistory(selectedAnimal)}
          />
        ) : null;

      case 'weightHistory':
        return selectedAnimal ? (
          <WeightHistoryScreen
            animal={selectedAnimal}
            onBack={handleBackFromWeight}
            onAddWeight={handleAddWeight}
          />
        ) : null;

      case 'addWeight':
        return selectedAnimal ? (
          <AddWeightScreen
            animal={selectedAnimal}
            onSave={handleSaveWeight}
            onCancel={handleBackFromWeight}
          />
        ) : null;

      case 'journalList':
        return (
          <JournalListScreen
            onAddEntry={handleAddJournalEntry}
            onViewEntry={handleViewJournalEntry}
            onViewAnalytics={() => handlePlaceholderAction('Journal Analytics')}
            onBack={handleBackFromJournal}
          />
        );

      case 'journalEntry':
        return (
          <JournalEntryScreen
            entry={selectedJournal}
            onSave={handleSaveJournal}
            onCancel={handleBackToJournalList}
            onBack={handleBackToJournalList}
          />
        );

      case 'journalDetail':
        return selectedJournal ? (
          <JournalDetailScreen
            entry={selectedJournal}
            onBack={handleBackFromJournalDetail}
            onEdit={handleEditJournalEntry}
            onDelete={handleDeleteJournalEntry}
          />
        ) : null;

      case 'financial':
        return (
          <FinancialTrackingScreen
            onBack={handleBackFromFinancial}
          />
        );

      default:
        return (
          <EliteDashboard
            onSwitchProfile={handleSignOut}
            onShowSettings={handleSignOut}
            onNavigateToAnimals={navigateToAnimals}
            onNavigateToAnalytics={() => handlePlaceholderAction('Analytics')}
            onNavigateToAI={() => handlePlaceholderAction('AI Features')}
            onNavigateToExport={() => handlePlaceholderAction('Export')}
            onNavigateToJournal={handleNavigateToJournal}
            onNavigateToFinancial={() => setCurrentScreen('financial')}
            onNavigateToMedical={() => handlePlaceholderAction('Medical')}
            onNavigateToCalendar={() => handlePlaceholderAction('Calendar')}
            onAddAnimal={handleAddAnimal}
            onTakePhoto={handleTakePhoto}
            onNavigateToVetConnect={() => handlePlaceholderAction('VetConnect')}
          />
        );
    }
  };

  return <View style={{ flex: 1 }}>{renderCurrentScreen()}</View>;
};

export default MainApp;