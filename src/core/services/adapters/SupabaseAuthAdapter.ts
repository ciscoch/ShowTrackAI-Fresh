/**
 * Supabase Authentication Adapter for ShowTrackAI
 * Handles user authentication, registration, and session management
 */

import { AuthError, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../../../backend/api/clients/supabase';
import { IAuthService } from '../interfaces/ServiceInterfaces';

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  lastSignInAt?: string;
  role?: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
  metadata?: any;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  role?: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
  phone?: string;
  organizationId?: string;
  metadata?: any;
}

export interface SignInData {
  email: string;
  password: string;
}

export class SupabaseAuthAdapter implements IAuthService {
  private supabase = getSupabaseClient();

  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<{ user: AuthUser | null; session: AuthSession | null; error?: string }> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role || 'student',
            phone: data.phone,
            organization_id: data.organizationId,
            ...data.metadata,
          },
        },
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!authData.user) {
        return { user: null, session: null, error: 'Failed to create user' };
      }

      // Create profile in the profiles table
      if (authData.user) {
        await this.createUserProfile(authData.user, data);
      }

      const user = this.mapToAuthUser(authData.user);
      const session = authData.session ? this.mapToAuthSession(authData.session, user) : null;

      return { user, session };
    } catch (error) {
      console.error('SignUp error:', error);
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<{ user: AuthUser | null; session: AuthSession | null; error?: string }> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!authData.user || !authData.session) {
        return { user: null, session: null, error: 'Invalid credentials' };
      }

      const user = this.mapToAuthUser(authData.user);
      const session = this.mapToAuthSession(authData.session, user);

      return { user, session };
    } catch (error) {
      console.error('SignIn error:', error);
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('SignOut error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return this.mapToAuthUser(user);
    } catch (error) {
      console.error('GetCurrentUser error:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      const user = this.mapToAuthUser(session.user);
      return this.mapToAuthSession(session, user);
    } catch (error) {
      console.error('GetCurrentSession error:', error);
      return null;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error?: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('ResetPassword error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error?: string }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('UpdatePassword error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      const authSession = session ? this.mapToAuthSession(session, this.mapToAuthUser(session.user)) : null;
      callback(event, authSession);
    });
  }

  /**
   * Create user profile in the profiles table
   */
  private async createUserProfile(user: User, signUpData: SignUpData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: signUpData.fullName || null,
          role: signUpData.role || 'student',
          subscription_tier: 'freemium', // Default to freemium
          phone: signUpData.phone || null,
          organization_id: signUpData.organizationId || null,
          metadata: signUpData.metadata || {},
        });

      if (error) {
        console.error('Failed to create user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }
    } catch (error) {
      console.error('CreateUserProfile error:', error);
      throw error;
    }
  }

  /**
   * Map Supabase User to AuthUser
   */
  private mapToAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email!,
      phone: user.phone,
      emailConfirmed: user.email_confirmed_at !== null,
      phoneConfirmed: user.phone_confirmed_at !== null,
      lastSignInAt: user.last_sign_in_at || undefined,
      role: user.user_metadata?.role,
      metadata: user.user_metadata,
    };
  }

  /**
   * Map Supabase Session to AuthSession
   */
  private mapToAuthSession(session: any, user: AuthUser): AuthSession {
    return {
      user,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
    };
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent'): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Get role from profile table
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        return false;
      }

      return profile.role === role;
    } catch (error) {
      console.error('HasRole error:', error);
      return false;
    }
  }

  /**
   * Check if user can access subscription features
   */
  async hasSubscriptionAccess(tier: 'freemium' | 'elite'): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Get subscription tier from profile table
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        return false;
      }

      // Elite users have access to everything
      if (profile.subscription_tier === 'elite') return true;
      
      // Freemium users only have access to freemium features
      return tier === 'freemium';
    } catch (error) {
      console.error('HasSubscriptionAccess error:', error);
      return false;
    }
  }
}