/**
 * Animal Permissions Service
 * Handles role-based access control for animal management
 */

import { Animal } from '../models/Animal';
import { UserProfile } from './adapters/SupabaseProfileAdapter';

export interface AnimalPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canManageHealth: boolean;
  canViewFinancials: boolean;
  canExport: boolean;
}

export interface AnimalAccessContext {
  user: any; // Current authenticated user
  profile: UserProfile | null; // Current user profile
  targetAnimal?: Animal; // Animal being accessed
  targetUserId?: string; // User ID of animal owner
  isOwnAnimal?: boolean; // Whether user owns the animal
  isStudentAnimal?: boolean; // Whether accessing student's animal
  isChildAnimal?: boolean; // Whether accessing child's animal
}

export class AnimalPermissionsService {
  
  /**
   * Get comprehensive permissions for an animal based on user role and context
   */
  static getAnimalPermissions(context: AnimalAccessContext): AnimalPermissions {
    const { user, profile, targetAnimal, isOwnAnimal = false } = context;
    
    if (!user || !profile) {
      return this.getNoPermissions();
    }

    // Check if user owns the animal
    const ownsAnimal = isOwnAnimal || (targetAnimal?.owner_id === user.id);

    switch (profile.role) {
      case 'student':
        return this.getStudentPermissions(ownsAnimal);
      
      case 'educator':
        return this.getEducatorPermissions(ownsAnimal, context);
      
      case 'parent':
        return this.getParentPermissions(ownsAnimal, context);
      
      case 'admin':
        return this.getAdminPermissions();
      
      case 'veterinarian':
        return this.getVeterinarianPermissions(ownsAnimal, context);
      
      default:
        return this.getNoPermissions();
    }
  }

  /**
   * Student permissions - Full access to their own animals
   */
  private static getStudentPermissions(ownsAnimal: boolean): AnimalPermissions {
    return {
      canView: ownsAnimal,
      canEdit: ownsAnimal,
      canDelete: ownsAnimal,
      canCreate: true, // Students can always create new animals
      canManageHealth: ownsAnimal,
      canViewFinancials: ownsAnimal,
      canExport: ownsAnimal,
    };
  }

  /**
   * Educator permissions - Read access to student animals, full access to own
   */
  private static getEducatorPermissions(ownsAnimal: boolean, context: AnimalAccessContext): AnimalPermissions {
    const { isStudentAnimal = false } = context;
    
    return {
      canView: ownsAnimal || isStudentAnimal,
      canEdit: ownsAnimal, // Educators can't edit student animals
      canDelete: ownsAnimal, // Educators can't delete student animals
      canCreate: true, // Educators can create their own animals
      canManageHealth: ownsAnimal || isStudentAnimal, // Can manage health for supervision
      canViewFinancials: ownsAnimal || isStudentAnimal, // Can view for educational purposes
      canExport: ownsAnimal || isStudentAnimal, // Can export for reporting
    };
  }

  /**
   * Parent permissions - Read access to child animals
   */
  private static getParentPermissions(ownsAnimal: boolean, context: AnimalAccessContext): AnimalPermissions {
    const { isChildAnimal = false } = context;
    
    return {
      canView: ownsAnimal || isChildAnimal,
      canEdit: ownsAnimal, // Parents can't edit child animals directly
      canDelete: ownsAnimal, // Parents can't delete child animals
      canCreate: true, // Parents can create their own animals
      canManageHealth: ownsAnimal, // Can't manage child animal health directly
      canViewFinancials: ownsAnimal || isChildAnimal, // Can view child expenses
      canExport: ownsAnimal || isChildAnimal, // Can export for records
    };
  }

  /**
   * Admin permissions - Full access to everything
   */
  private static getAdminPermissions(): AnimalPermissions {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canCreate: true,
      canManageHealth: true,
      canViewFinancials: true,
      canExport: true,
    };
  }

  /**
   * Veterinarian permissions - Health-focused access
   */
  private static getVeterinarianPermissions(ownsAnimal: boolean, context: AnimalAccessContext): AnimalPermissions {
    const { isStudentAnimal = false } = context;
    
    return {
      canView: ownsAnimal || isStudentAnimal,
      canEdit: ownsAnimal, // Vets can't edit student animals directly
      canDelete: ownsAnimal, // Vets can't delete student animals
      canCreate: true, // Vets can create their own animals
      canManageHealth: true, // Vets can manage health for all animals they can view
      canViewFinancials: ownsAnimal, // Limited financial access
      canExport: ownsAnimal || isStudentAnimal, // Can export health records
    };
  }

  /**
   * No permissions - Default fallback
   */
  private static getNoPermissions(): AnimalPermissions {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canCreate: false,
      canManageHealth: false,
      canViewFinancials: false,
      canExport: false,
    };
  }

  /**
   * Check if user can perform a specific action on an animal
   */
  static canPerformAction(
    action: keyof AnimalPermissions,
    context: AnimalAccessContext
  ): boolean {
    const permissions = this.getAnimalPermissions(context);
    return permissions[action];
  }

  /**
   * Filter animals based on user permissions
   */
  static filterAnimalsForUser(
    animals: Animal[],
    user: any,
    profile: UserProfile | null,
    studentAnimals: Animal[] = [],
    childAnimals: Animal[] = []
  ): Animal[] {
    if (!user || !profile) {
      return [];
    }

    return animals.filter(animal => {
      const isOwnAnimal = animal.owner_id === user.id;
      const isStudentAnimal = studentAnimals.some(sa => sa.id === animal.id);
      const isChildAnimal = childAnimals.some(ca => ca.id === animal.id);

      const context: AnimalAccessContext = {
        user,
        profile,
        targetAnimal: animal,
        isOwnAnimal,
        isStudentAnimal,
        isChildAnimal,
      };

      return this.canPerformAction('canView', context);
    });
  }

  /**
   * Get permission summary for UI display
   */
  static getPermissionSummary(context: AnimalAccessContext): string[] {
    const permissions = this.getAnimalPermissions(context);
    const summary: string[] = [];

    if (permissions.canView) summary.push('View');
    if (permissions.canEdit) summary.push('Edit');
    if (permissions.canDelete) summary.push('Delete');
    if (permissions.canCreate) summary.push('Create');
    if (permissions.canManageHealth) summary.push('Manage Health');
    if (permissions.canViewFinancials) summary.push('View Finances');
    if (permissions.canExport) summary.push('Export');

    return summary;
  }

  /**
   * Check subscription limits for animal creation
   */
  static async checkSubscriptionLimits(
    profile: UserProfile,
    currentAnimalCount: number
  ): Promise<{ canCreate: boolean; reason?: string }> {
    if (!profile.subscription_tier) {
      return { canCreate: false, reason: 'No subscription information' };
    }

    const limits = {
      freemium: 5,
      elite: 100,
    };

    const limit = limits[profile.subscription_tier as keyof typeof limits];
    if (!limit) {
      return { canCreate: false, reason: 'Invalid subscription tier' };
    }

    if (currentAnimalCount >= limit) {
      return { 
        canCreate: false, 
        reason: `You've reached your ${profile.subscription_tier} plan limit of ${limit} animals` 
      };
    }

    return { canCreate: true };
  }

  /**
   * Get role-specific animal access patterns
   */
  static getRoleAccessPatterns(role: string): {
    description: string;
    permissions: string[];
    limitations: string[];
  } {
    switch (role) {
      case 'student':
        return {
          description: 'Full access to your own animals',
          permissions: ['Create, edit, and delete your animals', 'Manage health records', 'View financial data', 'Export records'],
          limitations: ['Cannot access other students\' animals', 'Subject to subscription limits'],
        };
      
      case 'educator':
        return {
          description: 'Supervision access to student animals',
          permissions: ['View student animals', 'Manage health records for supervision', 'Export student reports', 'Full access to own animals'],
          limitations: ['Cannot edit or delete student animals', 'Read-only access to student data'],
        };
      
      case 'parent':
        return {
          description: 'Monitoring access to child animals',
          permissions: ['View child animals', 'View financial records', 'Export child reports', 'Full access to own animals'],
          limitations: ['Cannot edit child animals', 'Cannot manage child health records'],
        };
      
      case 'admin':
        return {
          description: 'Full system access',
          permissions: ['Complete access to all animals', 'User management', 'System configuration', 'All export capabilities'],
          limitations: ['None - full administrative access'],
        };
      
      case 'veterinarian':
        return {
          description: 'Health-focused access',
          permissions: ['View assigned animals', 'Manage health records', 'Export health reports', 'Full access to own animals'],
          limitations: ['Cannot edit non-health animal data', 'Limited financial access'],
        };
      
      default:
        return {
          description: 'No access',
          permissions: [],
          limitations: ['No access to animal data'],
        };
    }
  }
}