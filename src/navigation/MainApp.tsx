/**
 * Main App Component - Shows when user is authenticated
 * Routes to appropriate dashboard and manages navigation
 */

import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PostHogProvider } from 'posthog-react-native';
import { useAuth } from '../core/contexts/AuthContext';
import { analyticsService } from '../core/services/AnalyticsService';
import { sentryService } from '../core/services/SentryService';
import { EliteDashboard } from '../features/dashboard/screens/EliteDashboard';
import { AnimalListScreen } from '../features/animals/screens/AnimalListScreen';
import { AnimalFormScreen } from '../features/animals/screens/AnimalFormScreen';
import { AnimalDetailsScreen } from '../features/animals/screens/AnimalDetailsScreen';
import { WeightHistoryScreen } from '../features/animals/screens/WeightHistoryScreen';
import { AddWeightScreen } from '../features/animals/screens/AddWeightScreen';
import { PhotoGalleryScreen } from '../features/animals/screens/PhotoGalleryScreen';
import { AIWeightPredictionScreen } from '../features/animals/screens/AIWeightPredictionScreen';
import { JournalListScreen, JournalEntryScreen, JournalDetailScreen } from '../features/journal/screens';
import { FinancialTrackingScreen } from '../features/financial/screens/FinancialTrackingScreen';
import { MedicalRecordsScreen } from '../features/medical/screens/MedicalRecordsScreen';
import { 
  EnhancedFFADashboard,
  FFADegreeProgressScreen,
  SAEProjectManagementScreen,
  CompetitionTrackingScreen,
  ParentDashboard,
  ParentLinkingScreen,
  StudentLinkingScreen,
  EvidenceSubmissionScreen
} from '../features/ffa/screens';
import { CalendarScreen, EventFormScreen } from '../features/calendar/screens';
import { AttendedEventsScreen, NotificationSettingsScreen } from '../features/events/screens';
import { Animal } from '../core/models/Animal';
import { Journal } from '../core/models/Journal';
import { Event } from '../core/models/Event';
import { useProfileStore } from '../core/stores/ProfileStore';

interface MainAppProps {
  user?: any;
  profile?: any;
}

type AppScreen = 'dashboard' | 'animalList' | 'animalForm' | 'animalDetails' | 'weightHistory' | 'addWeight' | 'photoGallery' | 'aiWeightPrediction' | 'journalList' | 'journalEntry' | 'journalDetail' | 'financial' | 'medical' | 'ffaDashboard' | 'ffaDegreeProgress' | 'ffaSAEProjects' | 'ffaCompetitions' | 'parentDashboard' | 'parentLinking' | 'studentLinking' | 'evidenceSubmission' | 'calendar' | 'eventForm' | 'attendedEvents' | 'notificationSettings';

const MainApp: React.FC<MainAppProps> = ({ user, profile }) => {
  const { signOut } = useAuth();
  const { createProfile, switchProfile, currentProfile, getAllProfiles } = useProfileStore();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('dashboard');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | undefined>();
  const [selectedJournal, setSelectedJournal] = useState<Journal | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  const [evidenceSubmissionContext, setEvidenceSubmissionContext] = useState<{
    degreeLevel: any;
    requirementKey: string;
    requirement: any;
  } | undefined>();

  // Initialize analytics on component mount
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await analyticsService.initialize();
        
        // Set user consent (in production, this should be based on user preference)
        analyticsService.setUserConsent(true);
        
        // Identify user if authenticated
        if (user && profile) {
          analyticsService.identifyUser(user.id, {
            userRole: 'student', // or determine from profile
            subscriptionTier: currentProfile?.subscriptionTier || 'free',
            gradeLevel: currentProfile?.grade,
            ffaChapter: currentProfile?.chapter,
          });
        }
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, []);

  // Track screen changes with Sentry
  const navigateToScreen = (screen: AppScreen) => {
    const startTime = Date.now();
    
    // Track navigation in Sentry
    sentryService.trackNavigation(currentScreen, screen);
    
    // Update state
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
    
    // Track in analytics
    analyticsService.trackScreenView(screen, previousScreen);
    
    // Track screen load time
    setTimeout(() => {
      const loadTime = Date.now() - startTime;
      sentryService.trackScreenView(screen, loadTime);
    }, 100);
  };

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
          
          // Update analytics with new profile
          analyticsService.setUserProperties({
            userRole: 'student',
            subscriptionTier: 'elite',
            gradeLevel: '12',
            ffaChapter: 'Elite Chapter',
          });
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
              // Track sign out event
              analyticsService.trackFeatureUsage('authentication', {
                action: 'sign_out',
                user_role: currentProfile?.type,
              });
              
              // Reset analytics state
              analyticsService.reset();
              
              await signOut();
            } catch (error) {
              analyticsService.trackError(error as Error, {
                feature: 'authentication',
                userAction: 'sign_out',
              });
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
    navigateToScreen('animalForm');
    sentryService.trackUserInteraction('add_animal_button', 'tap', currentScreen);
  };

  const handleEditAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    navigateToScreen('animalForm');
    sentryService.trackUserInteraction('edit_animal_button', 'tap', currentScreen, {
      animal_id: animal.id,
      animal_type: animal.species,
    });
  };

  const handleViewAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    navigateToScreen('animalDetails');
    sentryService.trackUserInteraction('view_animal_details', 'tap', currentScreen, {
      animal_id: animal.id,
      animal_type: animal.species,
    });
  };

  const handleSaveAnimal = () => {
    navigateToScreen('animalList');
    setSelectedAnimal(undefined);
    sentryService.trackUserInteraction('save_animal_button', 'submit', currentScreen);
  };

  const handleCancelAnimal = () => {
    setCurrentScreen('animalList');
    setSelectedAnimal(undefined);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to take photos of your animals.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Take Photo',
        'Choose an option:',
        [
          { 
            text: 'Camera', 
            onPress: async () => {
              try {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                });

                if (!result.canceled && result.assets[0]) {
                  // Photo taken successfully
                  console.log('📸 Photo taken:', result.assets[0].uri);
                  
                  // Track the photo capture
                  analyticsService.trackFeatureUsage('photo_capture', {
                    source: 'camera',
                    screen: currentScreen,
                  });
                  
                  Alert.alert(
                    'Photo Captured!',
                    'Your photo has been saved successfully.',
                    [{ text: 'Great!' }]
                  );
                }
              } catch (error) {
                console.error('Camera error:', error);
                Alert.alert('Error', 'Failed to open camera. Please try again.');
              }
            }
          },
          { 
            text: 'Photo Library', 
            onPress: async () => {
              try {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                });

                if (!result.canceled && result.assets[0]) {
                  // Photo selected successfully
                  console.log('📱 Photo selected:', result.assets[0].uri);
                  
                  // Track the photo selection
                  analyticsService.trackFeatureUsage('photo_capture', {
                    source: 'library',
                    screen: currentScreen,
                  });
                  
                  Alert.alert(
                    'Photo Selected!',
                    'Your photo has been imported successfully.',
                    [{ text: 'Great!' }]
                  );
                }
              } catch (error) {
                console.error('Photo library error:', error);
                Alert.alert('Error', 'Failed to access photo library. Please try again.');
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request camera permissions.');
    }
  };

  const handlePlaceholderAction = (action: string) => {
    Alert.alert('Coming Soon', `${action} feature coming soon!`);
  };

  const handleNavigateToAI = () => {
    // Create a demo animal for AI features if needed
    const demoAnimal: Animal = {
      id: 'demo-ai-animal',
      name: 'Demo Goat',
      species: 'Goat',
      breed: 'Boer',
      sex: 'Male',
      earTag: 'AI001',
      penNumber: '1',
      projectType: 'Market',
      breeder: 'ShowTrackAI Demo',
      weight: 75,
      healthStatus: 'Healthy',
      acquisitionCost: 250,
      birthDate: new Date('2024-03-15'),
      pickupDate: new Date('2024-05-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Set the demo animal and navigate to AI Weight Prediction
    setSelectedAnimal(demoAnimal);
    navigateToScreen('aiWeightPrediction');
  };

  const handleViewWeightHistory = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('weightHistory');
  };

  const handleViewPhotoGallery = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('photoGallery');
  };

  const handleViewAIWeightPrediction = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('aiWeightPrediction');
  };

  const handleViewHealthRecords = (animal: Animal) => {
    setSelectedAnimal(animal);
    setCurrentScreen('medical');
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

  const handleNavigateToMedical = () => {
    setCurrentScreen('medical');
  };

  const handleBackFromMedical = () => {
    setCurrentScreen('dashboard');
  };

  // FFA Navigation Handlers
  const handleNavigateToFFA = () => {
    setCurrentScreen('ffaDashboard');
  };

  const handleNavigateToFFADegreeProgress = () => {
    setCurrentScreen('ffaDegreeProgress');
  };

  const handleNavigateToFFASAEProjects = () => {
    setCurrentScreen('ffaSAEProjects');
  };

  const handleNavigateToFFACompetitions = () => {
    setCurrentScreen('ffaCompetitions');
  };

  const handleBackFromFFA = () => {
    setCurrentScreen('dashboard');
  };

  // Parent Oversight Navigation Handlers
  const handleNavigateToParentLinking = () => {
    setCurrentScreen('parentLinking');
  };

  const handleNavigateToStudentLinking = () => {
    setCurrentScreen('studentLinking');
  };

  const handleNavigateToEvidenceSubmission = (degreeLevel: any, requirementKey: string, requirement: any) => {
    setEvidenceSubmissionContext({ degreeLevel, requirementKey, requirement });
    setCurrentScreen('evidenceSubmission');
  };

  const handleNavigateToParentDashboard = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentScreen('parentDashboard');
  };

  const handleBackFromParentOversight = () => {
    setCurrentScreen('ffaDegreeProgress');
    setSelectedStudentId(undefined);
    setEvidenceSubmissionContext(undefined);
  };

  // Calendar Navigation Handlers
  const handleNavigateToCalendar = () => {
    setCurrentScreen('calendar');
  };

  const handleNavigateToAttendedEvents = () => {
    setCurrentScreen('attendedEvents');
  };
  const handleNavigateToNotificationSettings = () => {
    setCurrentScreen('notificationSettings');
  };

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setCurrentScreen('eventForm');
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setCurrentScreen('eventForm');
  };

  const handleBackFromCalendar = () => {
    setCurrentScreen('dashboard');
    setSelectedEvent(undefined);
  };

  const handleBackFromEventForm = () => {
    setCurrentScreen('calendar');
    setSelectedEvent(undefined);
  };

  const handleSaveEvent = () => {
    setCurrentScreen('calendar');
    setSelectedEvent(undefined);
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
            onNavigateToAI={handleNavigateToAI}
            onNavigateToExport={() => handlePlaceholderAction('Export')}
            onNavigateToJournal={handleNavigateToJournal}
            onNavigateToFinancial={() => setCurrentScreen('financial')}
            onNavigateToMedical={handleNavigateToMedical}
            onNavigateToCalendar={handleNavigateToCalendar}
            onNavigateToAttendedEvents={handleNavigateToAttendedEvents}
            onAddAnimal={handleAddAnimal}
            onTakePhoto={handleTakePhoto}
            onNavigateToVetConnect={() => handlePlaceholderAction('VetConnect')}
            onNavigateToFFA={handleNavigateToFFA}
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
            onViewPhotoGallery={() => handleViewPhotoGallery(selectedAnimal)}
            onViewAIWeightPrediction={() => handleViewAIWeightPrediction(selectedAnimal)}
            onViewHealthRecords={() => handleViewHealthRecords(selectedAnimal)}
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

      case 'photoGallery':
        return selectedAnimal ? (
          <PhotoGalleryScreen
            animal={selectedAnimal}
            onBack={() => {
              setCurrentScreen('animalDetails');
            }}
            onTakePhoto={handleTakePhoto}
          />
        ) : null;

      case 'aiWeightPrediction':
        return selectedAnimal ? (
          <AIWeightPredictionScreen
            animal={selectedAnimal}
            onBack={() => {
              setCurrentScreen('animalDetails');
            }}
            onTakePhoto={handleTakePhoto}
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

      case 'medical':
        return (
          <MedicalRecordsScreen
            onBack={handleBackFromMedical}
            onNavigateToAddAnimal={handleAddAnimal}
          />
        );

      case 'ffaDashboard':
        return (
          <EnhancedFFADashboard
            onNavigateToProgress={handleNavigateToFFADegreeProgress}
            onNavigateToSAE={handleNavigateToFFASAEProjects}
            onNavigateToCompetitions={handleNavigateToFFACompetitions}
            onNavigateToAnalytics={() => handlePlaceholderAction('FFA Analytics')}
            onBack={handleBackFromFFA}
          />
        );

      case 'ffaDegreeProgress':
        return (
          <FFADegreeProgressScreen
            onBack={() => setCurrentScreen('ffaDashboard')}
            onNavigateToSAE={handleNavigateToFFASAEProjects}
            onNavigateToCompetitions={handleNavigateToFFACompetitions}
            onNavigateToEvidenceSubmission={handleNavigateToEvidenceSubmission}
            onNavigateToParentLinking={handleNavigateToStudentLinking}
          />
        );

      case 'ffaSAEProjects':
        return (
          <SAEProjectManagementScreen
            onBack={() => setCurrentScreen('ffaDashboard')}
            onNavigateToFinancial={() => setCurrentScreen('financial')}
          />
        );

      case 'ffaCompetitions':
        return (
          <CompetitionTrackingScreen
            onBack={() => setCurrentScreen('ffaDashboard')}
            onNavigateToPrep={() => handlePlaceholderAction('Competition Prep')}
          />
        );

      case 'parentDashboard':
        return selectedStudentId ? (
          <ParentDashboard
            onBack={handleBackFromParentOversight}
            studentId={selectedStudentId}
          />
        ) : null;

      case 'parentLinking':
        return (
          <ParentLinkingScreen
            onBack={handleBackFromParentOversight}
            onLinkingSuccess={handleNavigateToParentDashboard}
          />
        );

      case 'studentLinking':
        return (
          <StudentLinkingScreen
            onBack={handleBackFromParentOversight}
          />
        );

      case 'evidenceSubmission':
        return evidenceSubmissionContext ? (
          <EvidenceSubmissionScreen
            onBack={handleBackFromParentOversight}
            degreeLevel={evidenceSubmissionContext.degreeLevel}
            requirementKey={evidenceSubmissionContext.requirementKey}
            requirementTitle={evidenceSubmissionContext.requirement.title || 'FFA Requirement'}
            requirementDescription={evidenceSubmissionContext.requirement.description || 'Complete this requirement for your FFA degree.'}
          />
        ) : null;

      case 'calendar':
        return (
          <CalendarScreen
            onBack={handleBackFromCalendar}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
          />
        );

      case 'eventForm':
        return (
          <EventFormScreen
            event={selectedEvent}
            onSave={handleSaveEvent}
            onCancel={handleBackFromEventForm}
          />
        );

      case 'attendedEvents':
        return (
          <AttendedEventsScreen
            onNavigateToCalendar={handleNavigateToCalendar}
            onNavigateToFFA={handleNavigateToFFA}
            onNavigateToNotificationSettings={handleNavigateToNotificationSettings}
            onNavigateBack={() => setCurrentScreen('dashboard')}
            onNavigateToHome={() => setCurrentScreen('dashboard')}
          />
        );
      case 'notificationSettings':
        return (
          <NotificationSettingsScreen
            onNavigateBack={() => setCurrentScreen('attendedEvents')}
          />
        );

      default:
        return (
          <EliteDashboard
            onSwitchProfile={handleSignOut}
            onShowSettings={handleSignOut}
            onNavigateToAnimals={navigateToAnimals}
            onNavigateToAnalytics={() => handlePlaceholderAction('Analytics')}
            onNavigateToAI={handleNavigateToAI}
            onNavigateToExport={() => handlePlaceholderAction('Export')}
            onNavigateToJournal={handleNavigateToJournal}
            onNavigateToFinancial={() => setCurrentScreen('financial')}
            onNavigateToMedical={handleNavigateToMedical}
            onNavigateToCalendar={handleNavigateToCalendar}
            onNavigateToAttendedEvents={handleNavigateToAttendedEvents}
            onAddAnimal={handleAddAnimal}
            onTakePhoto={handleTakePhoto}
            onNavigateToVetConnect={() => handlePlaceholderAction('VetConnect')}
            onNavigateToFFA={handleNavigateToFFA}
          />
        );
    }
  };

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY || ''}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      }}
    >
      <View style={{ flex: 1 }}>{renderCurrentScreen()}</View>
    </PostHogProvider>
  );
};

export default MainApp;