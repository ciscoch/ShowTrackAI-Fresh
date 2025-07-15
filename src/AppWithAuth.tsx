/**
 * App wrapper with Authentication
 * This component wraps your app with the authentication context
 */

import React, { useEffect } from 'react';
import { AuthProvider } from './core/contexts/AuthContext';
import { useSupabaseBackend } from './core/hooks/useSupabaseBackend';
import RootNavigator from './navigation/RootNavigator';
import { sentryService } from './core/services/SentryService';

// For testing purposes - you can also use the test screens
import { UserManagementTestScreen } from './features/profile/screens';

interface AppWithAuthProps {
  testMode?: boolean; // Set to true to show test screen
}

const AppWithAuth: React.FC<AppWithAuthProps> = ({ testMode = false }) => {
  const { isEnabled: useBackend, hasCredentials } = useSupabaseBackend();

  // Initialize Sentry on app startup
  useEffect(() => {
    const initializeSentry = async () => {
      try {
        await sentryService.initialize();
        
        // Track app initialization
        sentryService.addBreadcrumb('App initialized', 'app_lifecycle', {
          testMode,
          useBackend,
          hasCredentials,
        });

        console.log('📊 Sentry initialized for ShowTrackAI');
      } catch (error) {
        console.error('Failed to initialize Sentry:', error);
      }
    };

    initializeSentry();
  }, []);

  // Show test screen if requested
  if (testMode) {
    return <UserManagementTestScreen />;
  }

  // If backend is enabled but credentials are missing, show error
  if (useBackend && !hasCredentials) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#ff4444', textAlign: 'center' }}>
          Backend is enabled but Supabase credentials are missing.
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10 }}>
          Please check your .env file and add:
          {'\n'}EXPO_PUBLIC_SUPABASE_URL
          {'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY
        </Text>
      </View>
    );
  }

  // Normal app flow
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
};

// Add missing imports that TypeScript might need
import { View, Text } from 'react-native';

export default AppWithAuth;