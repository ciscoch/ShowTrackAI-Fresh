/**
 * Authentication Context for ShowTrackAI
 * Manages authentication state and provides auth methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceFactory } from '../services/adapters/ServiceFactory';
import { AuthUser, AuthSession } from '../services/adapters/SupabaseAuthAdapter';
import { UserProfile } from '../services/adapters/SupabaseProfileAdapter';
import { useSupabaseBackend } from '../hooks/useSupabaseBackend';

interface AuthContextType {
  // State
  user: AuthUser | null;
  session: AuthSession | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    fullName?: string;
    role?: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
    phone?: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  
  // Profile methods
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Utility methods
  hasRole: (role: string) => boolean;
  hasSubscriptionTier: (tier: 'freemium' | 'elite') => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isEnabled: useBackend } = useSupabaseBackend();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const authService = ServiceFactory.getAuthService();
  const profileService = ServiceFactory.getProfileService();

  useEffect(() => {
    // Check for existing session on mount
    initializeAuth();

    // Subscribe to auth state changes if using backend
    if (useBackend) {
      const unsubscribe = authService.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          await loadProfile();
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      });

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [useBackend]);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      if (!useBackend) {
        // For local storage, we don't have auth
        setLoading(false);
        return;
      }

      // Check for existing session
      const currentSession = await authService.getCurrentSession();
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const currentProfile = await profileService.getCurrentProfile();
      setProfile(currentProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      const result = await authService.signIn({ email, password });
      
      if (result.error) {
        return { error: result.error };
      }
      
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        await loadProfile();
      }
      
      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to sign in' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    fullName?: string;
    role?: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
    phone?: string;
  }): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      const result = await authService.signUp(data);
      
      if (result.error) {
        return { error: result.error };
      }
      
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        await loadProfile();
      }
      
      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to sign up' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      return await authService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Failed to reset password' 
      };
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = await profileService.updateProfile(updates);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role;
  };

  const hasSubscriptionTier = (tier: 'freemium' | 'elite'): boolean => {
    if (!profile) return false;
    if (tier === 'freemium') return true; // Everyone has at least freemium
    return profile.subscription_tier === tier;
  };

  const value: AuthContextType = {
    // State
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user && !!session,
    
    // Auth methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    
    // Profile methods
    refreshProfile,
    updateProfile,
    
    // Utility methods
    hasRole,
    hasSubscriptionTier,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};