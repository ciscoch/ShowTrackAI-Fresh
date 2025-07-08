/**
 * Supabase Profile Adapter for ShowTrackAI
 * Handles user profile management with roles and organizations
 */

import { getSupabaseClient, getCurrentUser, Database } from '../../../../backend/api/clients/supabase';
import { IProfileService } from '../interfaces/ServiceInterfaces';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
  subscription_tier: 'freemium' | 'elite';
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface ProfileRelationship {
  id: string;
  educator_id: string;
  student_id: string;
  relationship_type: 'educator_student' | 'parent_child' | 'mentor_mentee';
  active: boolean;
  permissions: any;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'school' | 'chapter' | 'farm' | 'clinic' | 'other';
  description: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  settings: any;
  created_at: string;
}

export class SupabaseProfileAdapter implements IProfileService {
  private supabase = getSupabaseClient();

  /**
   * Get the current user's profile
   */
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return null;
      }

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to get current profile:', error);
        return null;
      }

      return profile as UserProfile;
    } catch (error) {
      console.error('GetCurrentProfile error:', error);
      return null;
    }
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return profile as UserProfile;
    } catch (error) {
      console.error('UpdateProfile error:', error);
      throw error;
    }
  }

  /**
   * Create a new profile (admin only)
   */
  async createProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentProfile();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Only administrators can create profiles');
      }

      const { data: newProfile, error } = await this.supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        console.error('Failed to create profile:', error);
        throw new Error(`Failed to create profile: ${error.message}`);
      }

      return newProfile as UserProfile;
    } catch (error) {
      console.error('CreateProfile error:', error);
      throw error;
    }
  }

  /**
   * Get profiles (with role-based filtering)
   */
  async getProfiles(filters?: {
    role?: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
    organization_id?: string;
    subscription_tier?: 'freemium' | 'elite';
  }): Promise<UserProfile[]> {
    try {
      const currentUser = await this.getCurrentProfile();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      let query = this.supabase.from('profiles').select('*');

      // Apply role-based access control
      if (currentUser.role === 'admin') {
        // Admins can see all profiles
      } else if (currentUser.role === 'educator') {
        // Educators can see their students and other educators in their organization
        query = query.or(`role.eq.student,role.eq.educator`);
        if (currentUser.organization_id) {
          query = query.eq('organization_id', currentUser.organization_id);
        }
      } else if (currentUser.role === 'parent') {
        // Parents can only see their children's profiles
        const { data: relationships } = await this.supabase
          .from('profile_relationships')
          .select('student_id')
          .eq('educator_id', currentUser.id)
          .eq('relationship_type', 'parent_child')
          .eq('active', true);

        if (relationships && relationships.length > 0) {
          const studentIds = relationships.map(r => r.student_id);
          query = query.in('id', studentIds);
        } else {
          return []; // No children found
        }
      } else {
        // Students and veterinarians can only see their own profile
        query = query.eq('id', currentUser.id);
      }

      // Apply additional filters
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.organization_id) {
        query = query.eq('organization_id', filters.organization_id);
      }
      if (filters?.subscription_tier) {
        query = query.eq('subscription_tier', filters.subscription_tier);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Failed to get profiles:', error);
        throw new Error(`Failed to get profiles: ${error.message}`);
      }

      return profiles as UserProfile[];
    } catch (error) {
      console.error('GetProfiles error:', error);
      throw error;
    }
  }

  /**
   * Switch active profile context (not implemented - single user per session)
   */
  async switchProfile(profileId: string): Promise<void> {
    // Note: In this implementation, each user has one profile
    // This method is kept for interface compatibility
    console.warn('Profile switching not implemented in Supabase adapter');
  }

  /**
   * Link a student to an educator
   */
  async linkStudentToEducator(
    studentId: string, 
    educatorId: string, 
    relationshipType: 'educator_student' | 'parent_child' | 'mentor_mentee' = 'educator_student'
  ): Promise<void> {
    try {
      const currentUser = await this.getCurrentProfile();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Check permissions - only admins, educators, or parents can create relationships
      if (!['admin', 'educator', 'parent'].includes(currentUser.role)) {
        throw new Error('Insufficient permissions to create relationships');
      }

      // Verify that the educator exists and has the correct role
      const { data: educator, error: educatorError } = await this.supabase
        .from('profiles')
        .select('id, role')
        .eq('id', educatorId)
        .single();

      if (educatorError || !educator) {
        throw new Error('Educator not found');
      }

      if (relationshipType === 'parent_child' && educator.role !== 'parent') {
        throw new Error('Invalid relationship: only parents can have parent_child relationships');
      }

      if (relationshipType === 'educator_student' && !['educator', 'admin'].includes(educator.role)) {
        throw new Error('Invalid relationship: only educators can have educator_student relationships');
      }

      // Verify that the student exists and is a student
      const { data: student, error: studentError } = await this.supabase
        .from('profiles')
        .select('id, role')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        throw new Error('Student not found');
      }

      if (student.role !== 'student') {
        throw new Error('Target user is not a student');
      }

      // Create the relationship
      const { error } = await this.supabase
        .from('profile_relationships')
        .insert({
          educator_id: educatorId,
          student_id: studentId,
          relationship_type: relationshipType,
          active: true,
          permissions: {
            can_view_animals: true,
            can_view_health_records: true,
            can_view_financial_data: relationshipType === 'parent_child',
            can_edit_profile: false,
          },
        });

      if (error) {
        console.error('Failed to create relationship:', error);
        throw new Error(`Failed to create relationship: ${error.message}`);
      }
    } catch (error) {
      console.error('LinkStudentToEducator error:', error);
      throw error;
    }
  }

  /**
   * Get relationships for the current user
   */
  async getRelationships(): Promise<ProfileRelationship[]> {
    try {
      const currentUser = await this.getCurrentProfile();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const { data: relationships, error } = await this.supabase
        .from('profile_relationships')
        .select(`
          *,
          educator:profiles!profile_relationships_educator_id_fkey(id, full_name, email, role),
          student:profiles!profile_relationships_student_id_fkey(id, full_name, email, role)
        `)
        .or(`educator_id.eq.${currentUser.id},student_id.eq.${currentUser.id}`)
        .eq('active', true);

      if (error) {
        console.error('Failed to get relationships:', error);
        throw new Error(`Failed to get relationships: ${error.message}`);
      }

      return relationships as ProfileRelationship[];
    } catch (error) {
      console.error('GetRelationships error:', error);
      throw error;
    }
  }

  /**
   * Update subscription tier (admin only)
   */
  async updateSubscriptionTier(
    userId: string, 
    tier: 'freemium' | 'elite'
  ): Promise<void> {
    try {
      const currentUser = await this.getCurrentProfile();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Only administrators can update subscription tiers');
      }

      const { error } = await this.supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update subscription tier:', error);
        throw new Error(`Failed to update subscription tier: ${error.message}`);
      }
    } catch (error) {
      console.error('UpdateSubscriptionTier error:', error);
      throw error;
    }
  }

  /**
   * Get organization details
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const { data: organization, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) {
        console.error('Failed to get organization:', error);
        return null;
      }

      return organization as Organization;
    } catch (error) {
      console.error('GetOrganization error:', error);
      return null;
    }
  }

  /**
   * Check subscription limits
   */
  async checkSubscriptionLimit(limitType: 'animals' | 'storage' | 'ai_predictions'): Promise<{
    current: number;
    limit: number;
    canAdd: boolean;
  }> {
    try {
      const currentUser = await this.getCurrentProfile();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Get subscription limits
      const { data: limits, error: limitsError } = await this.supabase
        .from('subscription_limits')
        .select('*')
        .eq('tier', currentUser.subscription_tier)
        .single();

      if (limitsError || !limits) {
        throw new Error('Failed to get subscription limits');
      }

      let current = 0;
      let limit = 0;

      switch (limitType) {
        case 'animals':
          // Count current animals
          const { count: animalCount, error: animalError } = await this.supabase
            .from('animals')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', currentUser.id);

          if (animalError) {
            throw new Error('Failed to count animals');
          }

          current = animalCount || 0;
          limit = limits.max_animals;
          break;

        case 'storage':
          // This would require additional logic to calculate storage usage
          limit = limits.max_storage_gb;
          current = 0; // Placeholder
          break;

        case 'ai_predictions':
          // This would require tracking AI prediction usage
          limit = limits.ai_predictions_per_month;
          current = 0; // Placeholder
          break;

        default:
          throw new Error(`Unknown limit type: ${limitType}`);
      }

      return {
        current,
        limit,
        canAdd: current < limit,
      };
    } catch (error) {
      console.error('CheckSubscriptionLimit error:', error);
      throw error;
    }
  }
}