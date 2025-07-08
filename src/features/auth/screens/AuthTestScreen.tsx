/**
 * Authentication Test Screen
 * Simple auth screen for testing Supabase user management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ServiceFactory } from '../../core/services/adapters/ServiceFactory';
import { useSupabaseBackend } from '../../core/hooks/useSupabaseBackend';

const AuthTestScreen: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const { isEnabled: useBackend } = useSupabaseBackend();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form state
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Test User');
  const [role, setRole] = useState<'student' | 'educator' | 'admin' | 'parent' | 'veterinarian'>('student');

  const authService = ServiceFactory.getAuthService();
  const profileService = ServiceFactory.getProfileService();

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const profile = await profileService.getCurrentProfile();
        console.log('Current profile:', profile);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const result = await authService.signUp({
        email,
        password,
        fullName,
        role,
      });

      if (result.error) {
        Alert.alert('Sign Up Failed', result.error);
      } else {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => {
            setCurrentUser(result.user);
            onAuthenticated();
          }}
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }

    try {
      setLoading(true);
      const result = await authService.signIn({ email, password });

      if (result.error) {
        Alert.alert('Sign In Failed', result.error);
      } else {
        setCurrentUser(result.user);
        onAuthenticated();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setCurrentUser(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!useBackend) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.center}>
          <Text style={styles.warningText}>
            Backend is not enabled. Set EXPO_PUBLIC_USE_BACKEND=true to use authentication.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onAuthenticated}>
            <Text style={styles.buttonText}>Continue with Local Storage</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (currentUser) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.center}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.userInfo}>Email: {currentUser.email}</Text>
          <Text style={styles.userInfo}>Role: {currentUser.role || 'Not set'}</Text>
          
          <TouchableOpacity style={styles.button} onPress={onAuthenticated}>
            <Text style={styles.buttonText}>Continue to App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleSignOut}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.form}>
        <Text style={styles.title}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        {isSignUp && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
            
            <Text style={styles.label}>Role:</Text>
            <View style={styles.roleSelector}>
              {(['student', 'educator', 'admin', 'parent', 'veterinarian'] as const).map(roleOption => (
                <TouchableOpacity
                  key={roleOption}
                  style={[styles.roleButton, role === roleOption && styles.selectedRole]}
                  onPress={() => setRole(roleOption)}
                >
                  <Text style={[styles.roleText, role === roleOption && styles.selectedRoleText]}>
                    {roleOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
        ) : (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={isSignUp ? handleSignUp : handleSignIn}
            >
              <Text style={styles.buttonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.linkText}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50, // Account for status bar
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  selectedRole: {
    backgroundColor: '#007AFF',
  },
  roleText: {
    color: '#007AFF',
    fontSize: 14,
  },
  selectedRoleText: {
    color: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loading: {
    marginVertical: 20,
  },
  userInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default AuthTestScreen;