/**
 * User Management Test Screen
 * For testing and verifying Supabase backend user management functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';
import { SupabaseAuthAdapter, SignUpData } from '../../../core/services/adapters/SupabaseAuthAdapter';
import { SupabaseProfileAdapter, UserProfile } from '../../../core/services/adapters/SupabaseProfileAdapter';

const UserManagementTestScreen: React.FC = () => {
  const { isEnabled: useBackend } = useSupabaseBackend();
  const [authAdapter] = useState(() => new SupabaseAuthAdapter());
  const [profileAdapter] = useState(() => new SupabaseProfileAdapter());
  
  // Test state
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  // Form state for testing
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testFullName, setTestFullName] = useState('Test User');
  const [testRole, setTestRole] = useState<'student' | 'educator' | 'admin' | 'parent' | 'veterinarian'>('student');

  useEffect(() => {
    loadCurrentUserData();
  }, []);

  const loadCurrentUserData = async () => {
    try {
      setLoading(true);
      addTestResult('Loading current user data...');
      
      const user = await authAdapter.getCurrentUser();
      setCurrentUser(user);
      addTestResult(`Current user: ${user ? user.email : 'None'}`);
      
      if (user) {
        const profile = await profileAdapter.getCurrentProfile();
        setCurrentProfile(profile);
        addTestResult(`Current profile role: ${profile?.role || 'No profile'}`);
        addTestResult(`Subscription tier: ${profile?.subscription_tier || 'Unknown'}`);
      }
    } catch (error) {
      addTestResult(`Error loading user data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testSignUp = async () => {
    try {
      setLoading(true);
      addTestResult(`Testing sign up with role: ${testRole}`);
      
      const signUpData: SignUpData = {
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
        role: testRole,
      };
      
      const result = await authAdapter.signUp(signUpData);
      
      if (result.error) {
        addTestResult(`Sign up failed: ${result.error}`);
      } else {
        addTestResult(`Sign up successful! User ID: ${result.user?.id}`);
        if (result.session) {
          addTestResult(`Session created with access token`);
        }
        // Reload user data
        await loadCurrentUserData();
      }
    } catch (error) {
      addTestResult(`Sign up error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    try {
      setLoading(true);
      addTestResult(`Testing sign in with: ${testEmail}`);
      
      const result = await authAdapter.signIn({
        email: testEmail,
        password: testPassword,
      });
      
      if (result.error) {
        addTestResult(`Sign in failed: ${result.error}`);
      } else {
        addTestResult(`Sign in successful! User: ${result.user?.email}`);
        addTestResult(`User role: ${result.user?.role || 'Not set'}`);
        // Reload user data
        await loadCurrentUserData();
      }
    } catch (error) {
      addTestResult(`Sign in error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignOut = async () => {
    try {
      setLoading(true);
      addTestResult('Testing sign out...');
      
      const result = await authAdapter.signOut();
      
      if (result.error) {
        addTestResult(`Sign out failed: ${result.error}`);
      } else {
        addTestResult('Sign out successful!');
        setCurrentUser(null);
        setCurrentProfile(null);
        setProfiles([]);
      }
    } catch (error) {
      addTestResult(`Sign out error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testProfileUpdates = async () => {
    try {
      setLoading(true);
      addTestResult('Testing profile updates...');
      
      if (!currentProfile) {
        addTestResult('No current profile to update');
        return;
      }
      
      const updates = {
        full_name: 'Updated Test User',
        phone: '+1234567890',
        address: '123 Test Street, Test City, TX 12345',
      };
      
      const updatedProfile = await profileAdapter.updateProfile(updates);
      
      if (updatedProfile) {
        addTestResult('Profile updated successfully!');
        addTestResult(`New name: ${updatedProfile.full_name}`);
        addTestResult(`New phone: ${updatedProfile.phone}`);
        setCurrentProfile(updatedProfile);
      } else {
        addTestResult('Profile update failed');
      }
    } catch (error) {
      addTestResult(`Profile update error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetProfiles = async () => {
    try {
      setLoading(true);
      addTestResult('Testing get profiles...');
      
      const allProfiles = await profileAdapter.getProfiles();
      setProfiles(allProfiles);
      addTestResult(`Found ${allProfiles.length} profiles`);
      
      // Test role-based filtering
      if (currentProfile?.role === 'admin') {
        const students = await profileAdapter.getProfiles({ role: 'student' });
        addTestResult(`Found ${students.length} students`);
        
        const educators = await profileAdapter.getProfiles({ role: 'educator' });
        addTestResult(`Found ${educators.length} educators`);
      }
    } catch (error) {
      addTestResult(`Get profiles error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSubscriptionLimits = async () => {
    try {
      setLoading(true);
      addTestResult('Testing subscription limits...');
      
      if (!currentProfile) {
        addTestResult('No current profile for testing limits');
        return;
      }
      
      const animalLimits = await profileAdapter.checkSubscriptionLimit('animals');
      addTestResult(`Animal limit: ${animalLimits.current}/${animalLimits.limit} (can add: ${animalLimits.canAdd})`);
      
      // Test subscription access
      const hasFreemiumAccess = await authAdapter.hasSubscriptionAccess('freemium');
      const hasEliteAccess = await authAdapter.hasSubscriptionAccess('elite');
      
      addTestResult(`Freemium access: ${hasFreemiumAccess}`);
      addTestResult(`Elite access: ${hasEliteAccess}`);
    } catch (error) {
      addTestResult(`Subscription limits error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRoleChecks = async () => {
    try {
      setLoading(true);
      addTestResult('Testing role checks...');
      
      const roles: Array<'student' | 'educator' | 'admin' | 'parent' | 'veterinarian'> = 
        ['student', 'educator', 'admin', 'parent', 'veterinarian'];
      
      for (const role of roles) {
        const hasRole = await authAdapter.hasRole(role);
        addTestResult(`Has ${role} role: ${hasRole}`);
      }
    } catch (error) {
      addTestResult(`Role checks error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (!useBackend) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.center}>
          <Text style={styles.warningText}>
            Backend is not enabled. Set EXPO_PUBLIC_USE_BACKEND=true to test user management.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>User Management Test</Text>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Testing...</Text>
          </View>
        )}
        
        {/* Current User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current User</Text>
          <Text style={styles.infoText}>
            Email: {currentUser?.email || 'Not signed in'}
          </Text>
          <Text style={styles.infoText}>
            Role: {currentProfile?.role || 'No profile'}
          </Text>
          <Text style={styles.infoText}>
            Subscription: {currentProfile?.subscription_tier || 'Unknown'}
          </Text>
        </View>

        {/* Test Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Credentials</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={testEmail}
            onChangeText={setTestEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={testPassword}
            onChangeText={setTestPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={testFullName}
            onChangeText={setTestFullName}
          />
          
          {/* Role Selector */}
          <Text style={styles.label}>Role:</Text>
          <View style={styles.roleSelector}>
            {(['student', 'educator', 'admin', 'parent', 'veterinarian'] as const).map(role => (
              <TouchableOpacity
                key={role}
                style={[styles.roleButton, testRole === role && styles.selectedRole]}
                onPress={() => setTestRole(role)}
              >
                <Text style={[styles.roleText, testRole === role && styles.selectedRoleText]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Tests</Text>
          <TouchableOpacity style={styles.button} onPress={testSignUp} disabled={loading}>
            <Text style={styles.buttonText}>Test Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testSignIn} disabled={loading}>
            <Text style={styles.buttonText}>Test Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testSignOut} disabled={loading}>
            <Text style={styles.buttonText}>Test Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Tests</Text>
          <TouchableOpacity style={styles.button} onPress={testProfileUpdates} disabled={loading}>
            <Text style={styles.buttonText}>Test Profile Updates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testGetProfiles} disabled={loading}>
            <Text style={styles.buttonText}>Test Get Profiles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testRoleChecks} disabled={loading}>
            <Text style={styles.buttonText}>Test Role Checks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={testSubscriptionLimits} disabled={loading}>
            <Text style={styles.buttonText}>Test Subscription Limits</Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearTestResults}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.resultsContainer} nestedScrollEnabled>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Profile List */}
        {profiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessible Profiles ({profiles.length})</Text>
            {profiles.map((profile, index) => (
              <View key={index} style={styles.profileItem}>
                <Text style={styles.profileName}>{profile.full_name || 'No name'}</Text>
                <Text style={styles.profileDetails}>
                  {profile.email} | {profile.role} | {profile.subscription_tier}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff4444',
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  resultsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  warningText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    padding: 20,
  },
  profileItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  profileDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default UserManagementTestScreen;