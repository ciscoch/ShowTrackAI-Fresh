/**
 * Root Navigator for ShowTrackAI
 * Decides whether to show auth flow or main app based on authentication state
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../core/contexts/AuthContext';
import { useSupabaseBackend } from '../core/hooks/useSupabaseBackend';
import AuthScreen from '../features/auth/screens/AuthScreen';

// Import your existing main app component
// This is a placeholder - replace with your actual main app component
interface MainAppProps {
  user?: any;
  profile?: any;
}

const MainApp: React.FC<MainAppProps> = ({ user, profile }) => {
  const AuthenticatedMainApp = require('./MainApp').default;
  const ProfileChooserScreen = require('../features/profile/screens/ProfileChooserScreen').ProfileChooserScreen;
  
  // If user is authenticated (has user object), show authenticated main app
  if (user) {
    console.log('Authenticated user:', user);
    console.log('User profile:', profile);
    return <AuthenticatedMainApp user={user} profile={profile} />;
  }
  
  // Otherwise show the local profile chooser (for local storage mode)
  return (
    <ProfileChooserScreen 
      onProfileSelected={(profile) => {
        console.log('Profile selected:', profile);
        // Navigate to main dashboard
      }}
    />
  );
};

const RootNavigator: React.FC = () => {
  const { isEnabled: useBackend } = useSupabaseBackend();
  const { isAuthenticated, loading, user, profile } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If backend is not enabled, show the local storage version
  if (!useBackend) {
    return <MainApp />;
  }

  // If backend is enabled, show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Show main app with user context
  return <MainApp user={user} profile={profile} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default RootNavigator;