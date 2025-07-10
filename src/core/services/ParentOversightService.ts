// =========================================================================
// Parent Oversight Service - FFA Parent Engagement System
// =========================================================================
// Service for managing parent oversight of student FFA degree progress
// Handles parent-student linking, evidence submissions, and family communication
// =========================================================================

import { ServiceFactory } from './adapters/ServiceFactory';
import { storageService } from './StorageService';
import { FFADegreeLevel } from '../models/FFADegreeTracker';

// =========================================================================
// SERVICE INTERFACES
// =========================================================================

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: 'parent' | 'guardian' | 'caregiver';
  verified: boolean;
  created_at: Date;
  student_name: string;
  parent_name: string;
  permission_level: 'view_only' | 'view_and_comment' | 'full_access';
}

export interface EvidenceSubmission {
  id: string;
  student_id: string;
  degree_level: FFADegreeLevel;
  requirement_key: string;
  evidence_type: 'text' | 'photo' | 'video' | 'document';
  evidence_data: string; // Base64 for media, text for text submissions
  student_notes?: string;
  parent_feedback?: string;
  parent_viewed: boolean;
  submission_date: Date;
  metadata?: {
    file_size?: number;
    file_type?: string;
    duration?: number; // for videos
    location?: string;
    timestamp?: Date;
  };
}

export interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  chapter_name: string;
  school_name: string;
  grade_level: number;
  graduation_year: number;
  contact_email?: string;
  profile_image?: string;
}

export interface ParentNotification {
  id: string;
  parent_id: string;
  student_id: string;
  notification_type: 'new_submission' | 'degree_progress' | 'milestone_reached' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
  action_url?: string;
}

export interface LinkingCode {
  code: string;
  student_id: string;
  expires_at: Date;
  used: boolean;
}

// =========================================================================
// PARENT OVERSIGHT SERVICE
// =========================================================================

export class ParentOversightService {
  private supabaseAdapter: any;

  constructor() {
    this.supabaseAdapter = ServiceFactory.getSupabaseAdapter();
  }

  // =========================================================================
  // PARENT-STUDENT LINKING
  // =========================================================================

  /**
   * Generate a linking code for students to share with parents
   */
  async generateLinkingCode(studentId: string): Promise<string> {
    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const linkingCode: LinkingCode = {
        code,
        student_id: studentId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        used: false
      };

      // Store in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('parent_linking_codes', linkingCode);
      }

      // Also store locally
      await storageService.saveData(`linking_code_${code}`, linkingCode);

      return code;
    } catch (error) {
      console.error('Error generating linking code:', error);
      throw error;
    }
  }

  /**
   * Verify and use linking code to connect parent and student
   */
  async connectParentToStudent(
    parentId: string,
    linkingCode: string,
    relationship: 'parent' | 'guardian' | 'caregiver' = 'parent'
  ): Promise<ParentStudentLink> {
    try {
      // Check if code exists and is valid
      let codeData: LinkingCode | null = null;

      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('parent_linking_codes', {
          filters: { code: linkingCode, used: false }
        });
        codeData = result?.[0] || null;
      }

      // Fallback to local storage
      if (!codeData) {
        codeData = await storageService.loadData<LinkingCode>(`linking_code_${linkingCode}`);
      }

      if (!codeData) {
        throw new Error('Invalid linking code');
      }

      if (codeData.used) {
        throw new Error('Linking code has already been used');
      }

      if (new Date() > new Date(codeData.expires_at)) {
        throw new Error('Linking code has expired');
      }

      // Create parent-student link
      const link: ParentStudentLink = {
        id: `link_${Date.now()}`,
        parent_id: parentId,
        student_id: codeData.student_id,
        relationship,
        verified: true,
        created_at: new Date(),
        student_name: '', // Will be populated from student profile
        parent_name: '', // Will be populated from parent profile
        permission_level: 'view_and_comment'
      };

      // Store link
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('parent_student_links', link);
        // Mark code as used
        await this.supabaseAdapter.update('parent_linking_codes', codeData.code, { used: true });
      }

      // Store locally
      await storageService.saveData(`parent_link_${parentId}_${codeData.student_id}`, link);

      return link;
    } catch (error) {
      console.error('Error connecting parent to student:', error);
      throw error;
    }
  }

  /**
   * Get all students linked to a parent
   */
  async getLinkedStudents(parentId: string): Promise<ParentStudentLink[]> {
    try {
      let links: ParentStudentLink[] = [];

      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('parent_student_links', {
          filters: { parent_id: parentId }
        });
        links = result || [];
      }

      return links;
    } catch (error) {
      console.error('Error getting linked students:', error);
      return [];
    }
  }

  // =========================================================================
  // EVIDENCE SUBMISSION MANAGEMENT
  // =========================================================================

  /**
   * Submit evidence for a requirement
   */
  async submitEvidence(
    studentId: string,
    degreeLevel: FFADegreeLevel,
    requirementKey: string,
    evidenceType: 'text' | 'photo' | 'video' | 'document',
    evidenceData: string,
    studentNotes?: string,
    metadata?: any
  ): Promise<EvidenceSubmission> {
    try {
      const submission: EvidenceSubmission = {
        id: `evidence_${Date.now()}`,
        student_id: studentId,
        degree_level: degreeLevel,
        requirement_key: requirementKey,
        evidence_type: evidenceType,
        evidence_data: evidenceData,
        student_notes,
        parent_viewed: false,
        submission_date: new Date(),
        metadata
      };

      // Store in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('evidence_submissions', submission);
      }

      // Store locally
      const localSubmissions = await storageService.loadData<EvidenceSubmission[]>(`evidence_${studentId}`) || [];
      localSubmissions.push(submission);
      await storageService.saveData(`evidence_${studentId}`, localSubmissions);

      // Send notification to parents
      await this.notifyParentsOfNewSubmission(studentId, submission);

      return submission;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      throw error;
    }
  }

  /**
   * Get all evidence submissions for a student
   */
  async getStudentEvidenceSubmissions(studentId: string): Promise<EvidenceSubmission[]> {
    try {
      let submissions: EvidenceSubmission[] = [];

      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('evidence_submissions', {
          filters: { student_id: studentId },
          orderBy: { submission_date: 'desc' }
        });
        submissions = result || [];
      }

      // Fallback to local storage
      if (submissions.length === 0) {
        submissions = await storageService.loadData<EvidenceSubmission[]>(`evidence_${studentId}`) || [];
      }

      return submissions;
    } catch (error) {
      console.error('Error getting evidence submissions:', error);
      return [];
    }
  }

  /**
   * Mark evidence as viewed by parent
   */
  async markEvidenceAsViewed(evidenceId: string): Promise<void> {
    try {
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('evidence_submissions', evidenceId, {
          parent_viewed: true
        });
      }
    } catch (error) {
      console.error('Error marking evidence as viewed:', error);
    }
  }

  /**
   * Submit parent feedback on evidence
   */
  async submitParentFeedback(evidenceId: string, feedback: string): Promise<void> {
    try {
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('evidence_submissions', evidenceId, {
          parent_feedback: feedback,
          parent_viewed: true
        });
      }
    } catch (error) {
      console.error('Error submitting parent feedback:', error);
      throw error;
    }
  }

  // =========================================================================
  // STUDENT PROFILE MANAGEMENT
  // =========================================================================

  /**
   * Get student profile information
   */
  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('student_profiles', {
          filters: { id: studentId }
        });
        return result?.[0] || null;
      }

      // Fallback to local storage
      return await storageService.loadData<StudentProfile>(`student_profile_${studentId}`);
    } catch (error) {
      console.error('Error getting student profile:', error);
      return null;
    }
  }

  // =========================================================================
  // NOTIFICATION SYSTEM
  // =========================================================================

  /**
   * Send notification to parents about new evidence submission
   */
  private async notifyParentsOfNewSubmission(
    studentId: string,
    submission: EvidenceSubmission
  ): Promise<void> {
    try {
      // Get all parents linked to this student
      const allLinks = await this.getAllParentLinks();
      const parentLinks = allLinks.filter(link => link.student_id === studentId);

      for (const link of parentLinks) {
        const notification: ParentNotification = {
          id: `notification_${Date.now()}_${link.parent_id}`,
          parent_id: link.parent_id,
          student_id: studentId,
          notification_type: 'new_submission',
          title: 'New Evidence Submission',
          message: `${link.student_name} has submitted evidence for their FFA degree requirements.`,
          read: false,
          created_at: new Date(),
          action_url: `/parent/dashboard/${studentId}`
        };

        // Store notification
        if (this.supabaseAdapter) {
          await this.supabaseAdapter.create('parent_notifications', notification);
        }

        // Store locally
        const localNotifications = await storageService.loadData<ParentNotification[]>(`notifications_${link.parent_id}`) || [];
        localNotifications.push(notification);
        await storageService.saveData(`notifications_${link.parent_id}`, localNotifications);
      }
    } catch (error) {
      console.error('Error sending parent notifications:', error);
    }
  }

  /**
   * Get notifications for a parent
   */
  async getParentNotifications(parentId: string): Promise<ParentNotification[]> {
    try {
      let notifications: ParentNotification[] = [];

      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('parent_notifications', {
          filters: { parent_id: parentId },
          orderBy: { created_at: 'desc' }
        });
        notifications = result || [];
      }

      // Fallback to local storage
      if (notifications.length === 0) {
        notifications = await storageService.loadData<ParentNotification[]>(`notifications_${parentId}`) || [];
      }

      return notifications;
    } catch (error) {
      console.error('Error getting parent notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('parent_notifications', notificationId, {
          read: true
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // =========================================================================
  // PRIVACY AND SECURITY
  // =========================================================================

  /**
   * Verify parent has access to student data
   */
  async verifyParentAccess(parentId: string, studentId: string): Promise<boolean> {
    try {
      const links = await this.getLinkedStudents(parentId);
      return links.some(link => link.student_id === studentId && link.verified);
    } catch (error) {
      console.error('Error verifying parent access:', error);
      return false;
    }
  }

  /**
   * Remove parent-student link
   */
  async removeParentLink(linkId: string): Promise<void> {
    try {
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.delete('parent_student_links', linkId);
      }
    } catch (error) {
      console.error('Error removing parent link:', error);
      throw error;
    }
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private async getAllParentLinks(): Promise<ParentStudentLink[]> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('parent_student_links', {});
        return result || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting all parent links:', error);
      return [];
    }
  }
}

// =========================================================================
// EXPORT SERVICE INSTANCE
// =========================================================================

export const parentOversightService = new ParentOversightService();
export type { 
  ParentStudentLink, 
  EvidenceSubmission, 
  StudentProfile, 
  ParentNotification, 
  LinkingCode 
};