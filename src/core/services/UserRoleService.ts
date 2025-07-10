// =========================================================================
// User Role Service - Role-Based Access Control for FFA System
// =========================================================================
// Service for managing user roles and permissions within the FFA system
// Supports students, parents, educators, and administrators with different access levels
// =========================================================================

import { ServiceFactory } from './adapters/ServiceFactory';
import { storageService } from './StorageService';

// =========================================================================
// USER ROLE INTERFACES
// =========================================================================

export type UserRole = 'student' | 'parent' | 'educator' | 'administrator' | 'observer';

export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  permissions: string[];
  metadata: {
    student_grade?: number;
    chapter_affiliation?: string;
    school_district?: string;
    organization_id?: string;
    verification_status?: 'pending' | 'verified' | 'rejected';
    created_at: Date;
    updated_at: Date;
  };
  display_name: string;
  contact_email?: string;
}

export interface RolePermissions {
  [key: string]: {
    description: string;
    requires_verification: boolean;
    parent_permissions?: string[];
  };
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  student: {
    'view_own_progress': {
      description: 'View personal FFA degree progress',
      requires_verification: false
    },
    'submit_evidence': {
      description: 'Submit evidence for degree requirements',
      requires_verification: false
    },
    'generate_linking_codes': {
      description: 'Generate codes to share progress with parents',
      requires_verification: false
    },
    'manage_sae_projects': {
      description: 'Create and manage SAE projects',
      requires_verification: false
    },
    'participate_competitions': {
      description: 'Track competition participation',
      requires_verification: false
    }
  },
  parent: {
    'view_linked_student_progress': {
      description: 'View progress of linked students',
      requires_verification: true
    },
    'provide_feedback': {
      description: 'Provide feedback on student evidence',
      requires_verification: true
    },
    'receive_notifications': {
      description: 'Receive notifications about student progress',
      requires_verification: false
    },
    'view_evidence_submissions': {
      description: 'View evidence submitted by students',
      requires_verification: true
    }
  },
  educator: {
    'view_student_progress': {
      description: 'View progress of students in their classes',
      requires_verification: true
    },
    'validate_requirements': {
      description: 'Validate completion of degree requirements',
      requires_verification: true
    },
    'award_degrees': {
      description: 'Award FFA degrees to students',
      requires_verification: true
    },
    'manage_competitions': {
      description: 'Manage competition events and results',
      requires_verification: true
    },
    'access_analytics': {
      description: 'Access educational analytics and reports',
      requires_verification: true
    }
  },
  administrator: {
    'manage_users': {
      description: 'Manage user accounts and roles',
      requires_verification: true
    },
    'system_configuration': {
      description: 'Configure system settings and policies',
      requires_verification: true
    },
    'access_all_data': {
      description: 'Access all data within the organization',
      requires_verification: true
    },
    'generate_reports': {
      description: 'Generate comprehensive system reports',
      requires_verification: true
    }
  },
  observer: {
    'view_public_progress': {
      description: 'View publicly shared progress information',
      requires_verification: false
    },
    'view_competition_results': {
      description: 'View competition results and standings',
      requires_verification: false
    }
  }
};

// =========================================================================
// USER ROLE SERVICE
// =========================================================================

export class UserRoleService {
  private supabaseAdapter: any;

  constructor() {
    this.supabaseAdapter = ServiceFactory.getSupabaseAdapter();
  }

  // =========================================================================
  // ROLE MANAGEMENT
  // =========================================================================

  /**
   * Create or update user profile with role
   */
  async createUserProfile(
    userId: string,
    role: UserRole,
    displayName: string,
    metadata: Partial<UserProfile['metadata']> = {}
  ): Promise<UserProfile> {
    try {
      const profile: UserProfile = {
        id: `profile_${Date.now()}`,
        user_id: userId,
        role,
        permissions: Object.keys(ROLE_PERMISSIONS[role]),
        metadata: {
          ...metadata,
          verification_status: this.requiresVerification(role) ? 'pending' : 'verified',
          created_at: new Date(),
          updated_at: new Date()
        },
        display_name: displayName
      };

      // Store in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('user_profiles', profile);
      }

      // Store locally
      await storageService.saveData(`user_profile_${userId}`, profile);

      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      let profile: UserProfile | null = null;

      // Try database first
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('user_profiles', {
          filters: { user_id: userId }
        });
        profile = result?.[0] || null;
      }

      // Fallback to local storage
      if (!profile) {
        profile = await storageService.loadData<UserProfile>(`user_profile_${userId}`);
      }

      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      const updatedProfile = {
        ...profile,
        role: newRole,
        permissions: Object.keys(ROLE_PERMISSIONS[newRole]),
        metadata: {
          ...profile.metadata,
          verification_status: this.requiresVerification(newRole) ? 'pending' : 'verified',
          updated_at: new Date()
        }
      };

      // Update in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('user_profiles', profile.id, updatedProfile);
      }

      // Update locally
      await storageService.saveData(`user_profile_${userId}`, updatedProfile);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // =========================================================================
  // PERMISSION CHECKING
  // =========================================================================

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return false;
      }

      // Check if user has permission
      const hasPermission = profile.permissions.includes(permission);
      
      // Check if permission requires verification
      const rolePermissions = ROLE_PERMISSIONS[profile.role];
      const permissionDetails = rolePermissions[permission];
      
      if (permissionDetails?.requires_verification) {
        return hasPermission && profile.metadata.verification_status === 'verified';
      }

      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if user can access specific student data
   */
  async canAccessStudentData(userId: string, studentId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return false;
      }

      // Students can access their own data
      if (profile.role === 'student' && userId === studentId) {
        return true;
      }

      // Parents can access linked students' data
      if (profile.role === 'parent') {
        // Check for parent-student link
        const hasAccess = await this.checkParentStudentLink(userId, studentId);
        return hasAccess;
      }

      // Educators can access students in their organization
      if (profile.role === 'educator') {
        const hasAccess = await this.checkEducatorStudentAccess(userId, studentId);
        return hasAccess;
      }

      // Administrators can access all data in their organization
      if (profile.role === 'administrator') {
        return await this.hasPermission(userId, 'access_all_data');
      }

      return false;
    } catch (error) {
      console.error('Error checking student data access:', error);
      return false;
    }
  }

  /**
   * Get user's effective permissions based on role and verification status
   */
  async getEffectivePermissions(userId: string): Promise<string[]> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return [];
      }

      const rolePermissions = ROLE_PERMISSIONS[profile.role];
      const effectivePermissions: string[] = [];

      for (const permission of profile.permissions) {
        const permissionDetails = rolePermissions[permission];
        
        if (permissionDetails?.requires_verification) {
          if (profile.metadata.verification_status === 'verified') {
            effectivePermissions.push(permission);
          }
        } else {
          effectivePermissions.push(permission);
        }
      }

      return effectivePermissions;
    } catch (error) {
      console.error('Error getting effective permissions:', error);
      return [];
    }
  }

  // =========================================================================
  // ROLE DETECTION AND HELPERS
  // =========================================================================

  /**
   * Detect user role based on context
   */
  async detectUserRole(
    userId: string,
    context: {
      hasStudents?: boolean;
      hasEducatorCredentials?: boolean;
      isSystemAdmin?: boolean;
      organizationRole?: string;
    }
  ): Promise<UserRole> {
    try {
      // Check for existing profile
      const existingProfile = await this.getUserProfile(userId);
      if (existingProfile) {
        return existingProfile.role;
      }

      // Detect role based on context
      if (context.isSystemAdmin) {
        return 'administrator';
      }

      if (context.hasEducatorCredentials || context.organizationRole === 'educator') {
        return 'educator';
      }

      if (context.hasStudents) {
        return 'parent';
      }

      // Default to student
      return 'student';
    } catch (error) {
      console.error('Error detecting user role:', error);
      return 'student';
    }
  }

  /**
   * Check if role requires verification
   */
  private requiresVerification(role: UserRole): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role];
    return Object.values(rolePermissions).some(permission => permission.requires_verification);
  }

  /**
   * Check parent-student link
   */
  private async checkParentStudentLink(parentId: string, studentId: string): Promise<boolean> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('parent_student_links', {
          filters: { 
            parent_id: parentId, 
            student_id: studentId, 
            verified: true 
          }
        });
        return result && result.length > 0;
      }

      // Check local storage
      const link = await storageService.loadData(`parent_link_${parentId}_${studentId}`);
      return link && link.verified;
    } catch (error) {
      console.error('Error checking parent-student link:', error);
      return false;
    }
  }

  /**
   * Check educator-student access
   */
  private async checkEducatorStudentAccess(educatorId: string, studentId: string): Promise<boolean> {
    try {
      const educatorProfile = await this.getUserProfile(educatorId);
      const studentProfile = await this.getUserProfile(studentId);

      if (!educatorProfile || !studentProfile) {
        return false;
      }

      // Check if same organization
      return educatorProfile.metadata.organization_id === studentProfile.metadata.organization_id;
    } catch (error) {
      console.error('Error checking educator-student access:', error);
      return false;
    }
  }

  // =========================================================================
  // VERIFICATION MANAGEMENT
  // =========================================================================

  /**
   * Request verification for user
   */
  async requestVerification(
    userId: string,
    verificationType: string,
    evidence: any
  ): Promise<void> {
    try {
      const verificationRequest = {
        id: `verification_${Date.now()}`,
        user_id: userId,
        verification_type: verificationType,
        evidence,
        status: 'pending',
        requested_at: new Date()
      };

      // Store verification request
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('verification_requests', verificationRequest);
      }

      await storageService.saveData(`verification_${userId}`, verificationRequest);
    } catch (error) {
      console.error('Error requesting verification:', error);
      throw error;
    }
  }

  /**
   * Update verification status
   */
  async updateVerificationStatus(
    userId: string,
    status: 'verified' | 'rejected',
    notes?: string
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      const updatedProfile = {
        ...profile,
        metadata: {
          ...profile.metadata,
          verification_status: status,
          verification_notes: notes,
          updated_at: new Date()
        }
      };

      // Update in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('user_profiles', profile.id, updatedProfile);
      }

      // Update locally
      await storageService.saveData(`user_profile_${userId}`, updatedProfile);
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  }
}

// =========================================================================
// EXPORT SERVICE INSTANCE
// =========================================================================

export const userRoleService = new UserRoleService();
export type { UserProfile, RolePermissions };