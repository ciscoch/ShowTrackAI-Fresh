// =========================================================================
// Notification Service - Parent Engagement & Communication System
// =========================================================================
// Service for managing notifications between students, parents, and educators
// Supports real-time communication and engagement tracking for FFA activities
// =========================================================================

import { ServiceFactory } from './adapters/ServiceFactory';
import { storageService } from './StorageService';
import { userRoleService } from './UserRoleService';

// =========================================================================
// NOTIFICATION INTERFACES
// =========================================================================

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  delivery_methods: DeliveryMethod[];
  created_at: Date;
  read_at?: Date;
  expires_at?: Date;
  action_url?: string;
  category: NotificationCategory;
}

export type NotificationType = 
  | 'evidence_submission'
  | 'degree_progress'
  | 'milestone_reached'
  | 'parent_feedback'
  | 'reminder'
  | 'system_update'
  | 'achievement_earned'
  | 'competition_update'
  | 'sae_milestone';

export type DeliveryMethod = 'in_app' | 'email' | 'sms' | 'push';

export type NotificationCategory = 'engagement' | 'progress' | 'system' | 'social' | 'reminder';

export interface NotificationPreferences {
  user_id: string;
  enabled_types: NotificationType[];
  delivery_methods: DeliveryMethod[];
  quiet_hours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  frequency_limits: {
    daily_max: number;
    weekly_max: number;
    batch_similar: boolean;
  };
}

export interface NotificationTemplate {
  type: NotificationType;
  title_template: string;
  message_template: string;
  default_priority: 'low' | 'medium' | 'high' | 'urgent';
  default_delivery_methods: DeliveryMethod[];
  variables: string[];
}

// =========================================================================
// NOTIFICATION TEMPLATES
// =========================================================================

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  evidence_submission: {
    type: 'evidence_submission',
    title_template: 'New Evidence Submission',
    message_template: '{{student_name}} has submitted evidence for {{requirement_name}}. Tap to review and provide feedback.',
    default_priority: 'medium',
    default_delivery_methods: ['in_app', 'push'],
    variables: ['student_name', 'requirement_name', 'degree_level']
  },
  degree_progress: {
    type: 'degree_progress',
    title_template: 'FFA Degree Progress Update',
    message_template: '{{student_name}} has made progress on their {{degree_level}} degree. {{progress_percentage}}% complete.',
    default_priority: 'low',
    default_delivery_methods: ['in_app'],
    variables: ['student_name', 'degree_level', 'progress_percentage']
  },
  milestone_reached: {
    type: 'milestone_reached',
    title_template: '🎉 Milestone Reached!',
    message_template: 'Congratulations! {{student_name}} has reached a new milestone: {{milestone_name}}',
    default_priority: 'high',
    default_delivery_methods: ['in_app', 'push', 'email'],
    variables: ['student_name', 'milestone_name', 'achievement_details']
  },
  parent_feedback: {
    type: 'parent_feedback',
    title_template: 'Feedback from Parent',
    message_template: 'Your parent has provided feedback on your {{requirement_name}} submission. Check it out!',
    default_priority: 'medium',
    default_delivery_methods: ['in_app', 'push'],
    variables: ['requirement_name', 'feedback_preview']
  },
  reminder: {
    type: 'reminder',
    title_template: 'FFA Reminder',
    message_template: 'Don\'t forget: {{reminder_text}}',
    default_priority: 'low',
    default_delivery_methods: ['in_app'],
    variables: ['reminder_text', 'due_date']
  },
  system_update: {
    type: 'system_update',
    title_template: 'System Update',
    message_template: '{{update_title}}: {{update_message}}',
    default_priority: 'low',
    default_delivery_methods: ['in_app'],
    variables: ['update_title', 'update_message']
  },
  achievement_earned: {
    type: 'achievement_earned',
    title_template: '🏆 Achievement Unlocked!',
    message_template: 'Congratulations! {{student_name}} has earned: {{achievement_name}}',
    default_priority: 'high',
    default_delivery_methods: ['in_app', 'push'],
    variables: ['student_name', 'achievement_name', 'achievement_description']
  },
  competition_update: {
    type: 'competition_update',
    title_template: 'Competition Update',
    message_template: '{{competition_name}}: {{update_message}}',
    default_priority: 'medium',
    default_delivery_methods: ['in_app', 'push'],
    variables: ['competition_name', 'update_message', 'student_name']
  },
  sae_milestone: {
    type: 'sae_milestone',
    title_template: 'SAE Project Milestone',
    message_template: '{{student_name}} has reached a milestone in their SAE project: {{project_name}}',
    default_priority: 'medium',
    default_delivery_methods: ['in_app'],
    variables: ['student_name', 'project_name', 'milestone_description']
  }
};

// =========================================================================
// NOTIFICATION SERVICE
// =========================================================================

export class NotificationService {
  private supabaseAdapter: any;

  constructor() {
    this.supabaseAdapter = ServiceFactory.getSupabaseAdapter();
  }

  // =========================================================================
  // NOTIFICATION CREATION AND DELIVERY
  // =========================================================================

  /**
   * Send notification to user
   */
  async sendNotification(
    recipientId: string,
    type: NotificationType,
    variables: Record<string, string>,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      delivery_methods?: DeliveryMethod[];
      expires_at?: Date;
      action_url?: string;
      sender_id?: string;
    } = {}
  ): Promise<Notification> {
    try {
      // Get notification template
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Check user preferences
      const preferences = await this.getUserPreferences(recipientId);
      if (!this.shouldSendNotification(type, preferences)) {
        console.log(`Notification ${type} blocked by user preferences for ${recipientId}`);
        throw new Error('Notification blocked by user preferences');
      }

      // Generate notification content
      const title = this.interpolateTemplate(template.title_template, variables);
      const message = this.interpolateTemplate(template.message_template, variables);

      // Create notification
      const notification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient_id: recipientId,
        sender_id: options.sender_id,
        notification_type: type,
        title,
        message,
        data: variables,
        read: false,
        priority: options.priority || template.default_priority,
        delivery_methods: options.delivery_methods || template.default_delivery_methods,
        created_at: new Date(),
        expires_at: options.expires_at,
        action_url: options.action_url,
        category: this.getCategoryForType(type)
      };

      // Store notification
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.create('notifications', notification);
      }

      // Store locally
      const userNotifications = await this.getUserNotifications(recipientId);
      userNotifications.unshift(notification);
      await storageService.saveData(`notifications_${recipientId}`, userNotifications.slice(0, 100)); // Keep last 100

      // Deliver notification via specified methods
      await this.deliverNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to parents of a student
   */
  async notifyParentsOfStudent(
    studentId: string,
    type: NotificationType,
    variables: Record<string, string>,
    options: any = {}
  ): Promise<Notification[]> {
    try {
      // Get linked parents
      const parentLinks = await this.getLinkedParents(studentId);
      const notifications: Notification[] = [];

      for (const link of parentLinks) {
        try {
          const notification = await this.sendNotification(
            link.parent_id,
            type,
            variables,
            { ...options, sender_id: studentId }
          );
          notifications.push(notification);
        } catch (error) {
          console.warn(`Failed to notify parent ${link.parent_id}:`, error);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying parents:', error);
      return [];
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    recipients: string[],
    type: NotificationType,
    variables: Record<string, string>,
    options: any = {}
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const recipientId of recipients) {
      try {
        const notification = await this.sendNotification(recipientId, type, variables, options);
        notifications.push(notification);
      } catch (error) {
        console.warn(`Failed to send notification to ${recipientId}:`, error);
      }
    }

    return notifications;
  }

  // =========================================================================
  // NOTIFICATION MANAGEMENT
  // =========================================================================

  /**
   * Get notifications for user
   */
  async getUserNotifications(
    userId: string,
    options: {
      unread_only?: boolean;
      limit?: number;
      category?: NotificationCategory;
    } = {}
  ): Promise<Notification[]> {
    try {
      let notifications: Notification[] = [];

      // Try database first
      if (this.supabaseAdapter) {
        const filters: any = { recipient_id: userId };
        if (options.unread_only) {
          filters.read = false;
        }
        if (options.category) {
          filters.category = options.category;
        }

        const result = await this.supabaseAdapter.query('notifications', {
          filters,
          orderBy: { created_at: 'desc' },
          limit: options.limit || 50
        });
        notifications = result || [];
      }

      // Fallback to local storage
      if (notifications.length === 0) {
        const localNotifications = await storageService.loadData<Notification[]>(`notifications_${userId}`) || [];
        notifications = localNotifications
          .filter(n => !options.unread_only || !n.read)
          .filter(n => !options.category || n.category === options.category)
          .slice(0, options.limit || 50);
      }

      // Filter expired notifications
      const now = new Date();
      return notifications.filter(n => !n.expires_at || new Date(n.expires_at) > now);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // Update in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.update('notifications', notificationId, {
          read: true,
          read_at: new Date()
        });
      }

      // Update local storage
      const notifications = await this.getUserNotifications(userId);
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notification.read_at = new Date();
        await storageService.saveData(`notifications_${userId}`, notifications);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId, { unread_only: true });
      
      for (const notification of notifications) {
        await this.markAsRead(notification.id, userId);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      // Delete from database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.delete('notifications', notificationId);
      }

      // Remove from local storage
      const notifications = await this.getUserNotifications(userId);
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      await storageService.saveData(`notifications_${userId}`, filteredNotifications);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // =========================================================================
  // NOTIFICATION PREFERENCES
  // =========================================================================

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      let preferences: NotificationPreferences | null = null;

      // Try database first
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('notification_preferences', {
          filters: { user_id: userId }
        });
        preferences = result?.[0] || null;
      }

      // Fallback to local storage
      if (!preferences) {
        preferences = await storageService.loadData<NotificationPreferences>(`notification_prefs_${userId}`);
      }

      // Return default preferences if none found
      return preferences || this.getDefaultPreferences(userId);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      // Update in database
      if (this.supabaseAdapter) {
        await this.supabaseAdapter.upsert('notification_preferences', preferences, { user_id: preferences.user_id });
      }

      // Update locally
      await storageService.saveData(`notification_prefs_${preferences.user_id}`, preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // =========================================================================
  // CONVENIENCE METHODS FOR COMMON NOTIFICATIONS
  // =========================================================================

  /**
   * Notify parents when student submits evidence
   */
  async notifyEvidenceSubmission(
    studentId: string,
    requirementName: string,
    degreeLevel: string,
    studentName: string
  ): Promise<void> {
    await this.notifyParentsOfStudent(studentId, 'evidence_submission', {
      student_name: studentName,
      requirement_name: requirementName,
      degree_level: degreeLevel
    });
  }

  /**
   * Notify student when parent provides feedback
   */
  async notifyParentFeedback(
    studentId: string,
    requirementName: string,
    feedbackPreview: string
  ): Promise<void> {
    await this.sendNotification(studentId, 'parent_feedback', {
      requirement_name: requirementName,
      feedback_preview: feedbackPreview
    });
  }

  /**
   * Notify parents of degree progress
   */
  async notifyDegreeProgress(
    studentId: string,
    degreeLevel: string,
    progressPercentage: string,
    studentName: string
  ): Promise<void> {
    await this.notifyParentsOfStudent(studentId, 'degree_progress', {
      student_name: studentName,
      degree_level: degreeLevel,
      progress_percentage: progressPercentage
    });
  }

  /**
   * Notify milestone reached
   */
  async notifyMilestoneReached(
    studentId: string,
    milestoneName: string,
    studentName: string,
    achievementDetails: string
  ): Promise<void> {
    await this.notifyParentsOfStudent(studentId, 'milestone_reached', {
      student_name: studentName,
      milestone_name: milestoneName,
      achievement_details: achievementDetails
    });
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private shouldSendNotification(type: NotificationType, preferences: NotificationPreferences): boolean {
    return preferences.enabled_types.includes(type);
  }

  private getCategoryForType(type: NotificationType): NotificationCategory {
    const categoryMap: Record<NotificationType, NotificationCategory> = {
      evidence_submission: 'engagement',
      degree_progress: 'progress',
      milestone_reached: 'progress',
      parent_feedback: 'social',
      reminder: 'reminder',
      system_update: 'system',
      achievement_earned: 'progress',
      competition_update: 'progress',
      sae_milestone: 'progress'
    };
    return categoryMap[type] || 'system';
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      user_id: userId,
      enabled_types: ['evidence_submission', 'milestone_reached', 'parent_feedback', 'achievement_earned'],
      delivery_methods: ['in_app', 'push'],
      quiet_hours: {
        start: '22:00',
        end: '07:00',
        timezone: 'UTC'
      },
      frequency_limits: {
        daily_max: 10,
        weekly_max: 50,
        batch_similar: true
      }
    };
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    // This would integrate with actual delivery services
    console.log(`Delivering notification ${notification.id} via:`, notification.delivery_methods);
    
    // For now, just log the notification
    if (notification.delivery_methods.includes('in_app')) {
      console.log(`📱 In-app: ${notification.title} - ${notification.message}`);
    }
    
    if (notification.delivery_methods.includes('push')) {
      console.log(`🔔 Push: ${notification.title}`);
    }
  }

  private async getLinkedParents(studentId: string): Promise<Array<{ parent_id: string }>> {
    try {
      if (this.supabaseAdapter) {
        const result = await this.supabaseAdapter.query('parent_student_links', {
          filters: { student_id: studentId, verified: true }
        });
        return result || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting linked parents:', error);
      return [];
    }
  }
}

// =========================================================================
// EXPORT SERVICE INSTANCE
// =========================================================================

export const notificationService = new NotificationService();
export type { 
  Notification, 
  NotificationType, 
  NotificationPreferences, 
  NotificationTemplate,
  DeliveryMethod,
  NotificationCategory
};