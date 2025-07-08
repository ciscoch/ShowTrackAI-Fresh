/**
 * Main Authentication Screen for ShowTrackAI
 * Handles sign in, sign up, and password reset
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../../core/contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'reset';

const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'educator' | 'parent' | 'veterinarian' | 'admin'>('student');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Email validation - Allow test emails for development
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const testEmailRegex = /^[^\s@]+@(test\.com|example\.com|gmail\.com|yahoo\.com|hotmail\.com)$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email) && !testEmailRegex.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Password validation
    if (mode !== 'reset') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (!fullName || fullName.trim().length < 2) {
          newErrors.fullName = 'Full name is required';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    const result = await signIn(email, password);
    if (result.error) {
      Alert.alert('Sign In Failed', result.error);
    }
    // If successful, AuthContext will handle navigation
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    const result = await signUp({
      email,
      password,
      fullName,
      role,
    });
    
    if (result.error) {
      Alert.alert('Sign Up Failed', result.error);
    } else {
      Alert.alert(
        'Success!', 
        'Your account has been created. Please check your email to verify your account.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    const result = await resetPassword(email);
    if (result.error) {
      Alert.alert('Reset Failed', result.error);
    } else {
      Alert.alert(
        'Check Your Email',
        'We sent you a password reset link. Please check your email.',
        [{ text: 'OK', onPress: () => setMode('signin') }]
      );
    }
  };

  const handleSubmit = () => {
    switch (mode) {
      case 'signin':
        handleSignIn();
        break;
      case 'signup':
        handleSignUp();
        break;
      case 'reset':
        handleResetPassword();
        break;
    }
  };

  const renderRoleSelector = () => {
    if (mode !== 'signup') return null;
    
    const roles: Array<{ value: typeof role; label: string; description: string }> = [
      { value: 'student', label: 'Student', description: 'Track animals and projects' },
      { value: 'educator', label: 'Educator', description: 'Manage student progress' },
      { value: 'parent', label: 'Parent', description: 'Monitor child activities' },
      { value: 'veterinarian', label: 'Veterinarian', description: 'Provide health services' },
      { value: 'admin', label: 'Admin', description: 'Full system access' },
    ];
    
    return (
      <View style={styles.roleSection}>
        <Text style={styles.label}>I am a:</Text>
        {roles.map((roleOption) => (
          <TouchableOpacity
            key={roleOption.value}
            style={[styles.roleCard, role === roleOption.value && styles.roleCardSelected]}
            onPress={() => setRole(roleOption.value)}
          >
            <View style={styles.roleContent}>
              <Text style={[styles.roleLabel, role === roleOption.value && styles.roleLabelSelected]}>
                {roleOption.label}
              </Text>
              <Text style={[styles.roleDescription, role === roleOption.value && styles.roleDescriptionSelected]}>
                {roleOption.description}
              </Text>
            </View>
            {role === roleOption.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ShowTrackAI</Text>
            <Text style={styles.subtitle}>
              {mode === 'signin' && 'Welcome back!'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset your password'}
            </Text>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="student.test@gmail.com, educator.test@gmail.com, etc."
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              {mode === 'signup' && (
                <Text style={styles.hintText}>
                  💡 For testing: Use emails like student.test@gmail.com, educator.test@gmail.com, parent.test@gmail.com
                </Text>
              )}
            </View>

            {mode !== 'reset' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            )}

            {renderRoleSelector()}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'reset' && 'Send Reset Email'}
                </Text>
              )}
            </TouchableOpacity>

            {mode === 'signin' && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => setMode('reset')}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            {mode === 'signin' && (
              <TouchableOpacity onPress={() => setMode('signup')}>
                <Text style={styles.footerText}>
                  Don't have an account? <Text style={styles.linkText}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            )}
            
            {mode === 'signup' && (
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text style={styles.footerText}>
                  Already have an account? <Text style={styles.linkText}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            )}
            
            {mode === 'reset' && (
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text style={styles.footerText}>
                  Remember your password? <Text style={styles.linkText}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50, // Account for status bar
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  roleSection: {
    marginVertical: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  roleContent: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleLabelSelected: {
    color: '#007AFF',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  roleDescriptionSelected: {
    color: '#0056b3',
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default AuthScreen;