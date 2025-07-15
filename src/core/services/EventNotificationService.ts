/**
 * EventNotificationService - Event Check-out Notification & Reminder System
 * 
 * Handles scheduling and managing notifications for event check-out reminders,
 * attendance tracking, and motivational alerts for FFA SAE/AET point earning.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttendedEvent } from '../models/EventAttendance';
import { analyticsService } from './AnalyticsService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationSchedule {
  id: string;
  attendedEventId: string;
  scheduledTime: string;
  notificationType: 'checkout_reminder' | 'motivation' | 'points_deadline';
  isScheduled: boolean;
}

interface CheckoutReminderConfig {
  enabled: boolean;
  reminderIntervals: number[]; // Minutes before event end
  motivationalMessages: boolean;
  pointsDeadlineAlert: boolean;
}

class EventNotificationService {
  private static instance: EventNotificationService;
  private scheduledNotifications = new Map<string, NotificationSchedule>();
  private readonly STORAGE_KEY = 'event_notifications';

  static getInstance(): EventNotificationService {
    if (!EventNotificationService.instance) {
      EventNotificationService.instance = new EventNotificationService();
    }
    return EventNotificationService.instance;
  }

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<boolean> {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('📱 Notification permissions not granted');
        return false;
      }

      // Load existing scheduled notifications
      await this.loadScheduledNotifications();

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('🔔 Event notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Schedule check-out reminder for an attended event
   */
  async scheduleCheckoutReminder(attendedEvent: AttendedEvent): Promise<void> {
    try {
      if (!attendedEvent.event_end_time || attendedEvent.attendance_status !== 'checked_in') {
        return;
      }

      const config = await this.getNotificationConfig();
      if (!config.enabled) {
        return;
      }

      const eventEndTime = this.parseEventDateTime(
        attendedEvent.event_date,
        attendedEvent.event_end_time
      );

      // Schedule reminders at different intervals
      for (const minutesBefore of config.reminderIntervals) {
        const reminderTime = new Date(eventEndTime.getTime() - (minutesBefore * 60 * 1000));
        
        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
          await this.scheduleNotification({
            attendedEventId: attendedEvent.id,
            scheduledTime: reminderTime,
            type: 'checkout_reminder',
            title: this.getReminderTitle(minutesBefore),
            body: this.getReminderMessage(attendedEvent, minutesBefore),
            data: {
              attendedEventId: attendedEvent.id,
              eventTitle: attendedEvent.event_title,
              type: 'checkout_reminder',
            },
          });
        }
      }

      // Schedule motivational reminder 15 minutes before end
      if (config.motivationalMessages) {
        const motivationTime = new Date(eventEndTime.getTime() - (15 * 60 * 1000));
        if (motivationTime > new Date()) {
          await this.scheduleNotification({
            attendedEventId: attendedEvent.id,
            scheduledTime: motivationTime,
            type: 'motivation',
            title: '🌟 Making the Most of Your Event!',
            body: this.getMotivationalMessage(attendedEvent),
            data: {
              attendedEventId: attendedEvent.id,
              eventTitle: attendedEvent.event_title,
              type: 'motivation',
            },
          });
        }
      }

      // Schedule points deadline alert
      if (config.pointsDeadlineAlert) {
        const deadlineTime = new Date(eventEndTime.getTime() + (5 * 60 * 1000)); // 5 min after end
        await this.scheduleNotification({
          attendedEventId: attendedEvent.id,
          scheduledTime: deadlineTime,
          type: 'points_deadline',
          title: '⏰ Don\'t Forget Your Points!',
          body: `Check out of ${attendedEvent.event_title} now to earn your FFA SAE/AET points!`,
          data: {
            attendedEventId: attendedEvent.id,
            eventTitle: attendedEvent.event_title,
            type: 'points_deadline',
          },
        });
      }

      analyticsService.trackEngagement('checkout_reminders_scheduled', {
        event_id: attendedEvent.event_id,
        event_type: attendedEvent.event_type,
        reminder_count: config.reminderIntervals.length,
      });

    } catch (error) {
      console.error('❌ Failed to schedule checkout reminder:', error);
      analyticsService.trackError(error as Error, {
        feature: 'notification_service',
        action: 'schedule_checkout_reminder',
        attended_event_id: attendedEvent.id,
      });
    }
  }

  /**
   * Cancel all notifications for a specific attended event
   */
  async cancelEventNotifications(attendedEventId: string): Promise<void> {
    try {
      const notificationsToCancel = Array.from(this.scheduledNotifications.values())
        .filter(notification => notification.attendedEventId === attendedEventId);

      for (const notification of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
        this.scheduledNotifications.delete(notification.id);
      }

      await this.saveScheduledNotifications();

      console.log(`🔕 Cancelled ${notificationsToCancel.length} notifications for event:`, attendedEventId);
    } catch (error) {
      console.error('❌ Failed to cancel event notifications:', error);
    }
  }

  /**
   * Send immediate check-out reminder notification
   */
  async sendImmediateCheckoutReminder(attendedEvent: AttendedEvent): Promise<void> {
    try {
      // Get current settings to respect user preferences
      const config = await this.getNotificationConfig();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Ready to Check Out?',
          body: `Complete your attendance at ${attendedEvent.event_title} and earn your points!`,
          data: {
            attendedEventId: attendedEvent.id,
            eventTitle: attendedEvent.event_title,
            type: 'immediate_checkout',
          },
          sound: (config as any).soundEnabled !== false,
          vibrate: (config as any).vibrationEnabled !== false ? [0, 250, 250, 250] : undefined,
        },
        trigger: null, // Send immediately
      });

      analyticsService.trackEngagement('immediate_checkout_reminder_sent', {
        attended_event_id: attendedEvent.id,
        event_type: attendedEvent.event_type,
      });
    } catch (error) {
      console.error('❌ Failed to send immediate checkout reminder:', error);
    }
  }

  /**
   * Get active check-out reminders for user
   */
  async getActiveReminders(userId: string): Promise<NotificationSchedule[]> {
    return Array.from(this.scheduledNotifications.values())
      .filter(notification => 
        notification.isScheduled && 
        new Date(notification.scheduledTime) > new Date()
      );
  }

  /**
   * Update notification configuration
   */
  async updateNotificationConfig(config: CheckoutReminderConfig): Promise<void> {
    try {
      await AsyncStorage.setItem('checkout_reminder_config', JSON.stringify(config));
      console.log('💾 Notification config updated:', config);
    } catch (error) {
      console.error('❌ Failed to update notification config:', error);
    }
  }

  /**
   * Get current notification configuration
   */
  private async getNotificationConfig(): Promise<CheckoutReminderConfig> {
    try {
      const stored = await AsyncStorage.getItem('checkout_reminder_config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load notification config, using defaults');
    }

    // Default configuration
    return {
      enabled: true,
      reminderIntervals: [30, 15, 5], // 30min, 15min, 5min before event end
      motivationalMessages: true,
      pointsDeadlineAlert: true,
    };
  }

  /**
   * Schedule a notification
   */
  private async scheduleNotification(params: {
    attendedEventId: string;
    scheduledTime: Date;
    type: 'checkout_reminder' | 'motivation' | 'points_deadline';
    title: string;
    body: string;
    data: any;
  }): Promise<void> {
    try {
      // Get current settings to respect user preferences
      const config = await this.getNotificationConfig();
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          data: params.data,
          sound: (config as any).soundEnabled !== false, // Default to true if not set
          vibrate: (config as any).vibrationEnabled !== false ? [0, 250, 250, 250] : undefined,
        },
        trigger: {
          date: params.scheduledTime,
        },
      });

      const schedule: NotificationSchedule = {
        id: notificationId,
        attendedEventId: params.attendedEventId,
        scheduledTime: params.scheduledTime.toISOString(),
        notificationType: params.type,
        isScheduled: true,
      };

      this.scheduledNotifications.set(notificationId, schedule);
      await this.saveScheduledNotifications();

      console.log(`🔔 Scheduled ${params.type} notification:`, {
        id: notificationId,
        time: params.scheduledTime.toLocaleString(),
        event: params.attendedEventId,
      });
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Parse event date and time into Date object
   */
  private parseEventDateTime(eventDate: string, eventTime: string): Date {
    // eventDate format: "2025-07-14"
    // eventTime format: "18:00"
    const [hours, minutes] = eventTime.split(':').map(Number);
    const date = new Date(eventDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Get reminder title based on minutes before event end
   */
  private getReminderTitle(minutesBefore: number): string {
    if (minutesBefore >= 30) {
      return '⏰ Event Ending Soon';
    } else if (minutesBefore >= 15) {
      return '🎯 Time to Wrap Up';
    } else {
      return '🏁 Almost Time to Check Out';
    }
  }

  /**
   * Get reminder message based on minutes before event end
   */
  private getReminderMessage(attendedEvent: AttendedEvent, minutesBefore: number): string {
    const messages = [
      `${attendedEvent.event_title} ends in ${minutesBefore} minutes. Don't forget to check out and earn your points!`,
      `Your attendance at ${attendedEvent.event_title} is almost complete. Remember to check out to maximize your FFA SAE/AET points!`,
      `${minutesBefore} minutes left at ${attendedEvent.event_title}. Check out soon to secure your points and reflect on what you learned!`,
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get motivational message for ongoing event
   */
  private getMotivationalMessage(attendedEvent: AttendedEvent): string {
    const messages = [
      `You're doing great at ${attendedEvent.event_title}! Stay engaged to maximize your learning and points.`,
      `Make the most of these final minutes at ${attendedEvent.event_title}. Ask questions and connect with others!`,
      `Almost time to complete ${attendedEvent.event_title}! Your participation is building valuable FFA career skills.`,
      `Strong finish ahead! Continue participating actively in ${attendedEvent.event_title} for maximum points and learning.`,
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Set up notification response listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      
      analyticsService.trackEngagement('notification_received', {
        type: notification.request.content.data?.type || 'unknown',
        attended_event_id: notification.request.content.data?.attendedEventId,
      });
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      analyticsService.trackEngagement('notification_tapped', {
        type: data?.type || 'unknown',
        attended_event_id: data?.attendedEventId,
      });

      // Handle navigation to check-out screen
      if (data?.type === 'checkout_reminder' || data?.type === 'points_deadline') {
        // This would trigger navigation to the attended events screen
        // Implementation depends on navigation structure
        console.log('🎯 Should navigate to check-out for event:', data.attendedEventId);
      }
    });
  }

  /**
   * Load scheduled notifications from storage
   */
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const notifications: NotificationSchedule[] = JSON.parse(stored);
        for (const notification of notifications) {
          this.scheduledNotifications.set(notification.id, notification);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load scheduled notifications:', error);
    }
  }

  /**
   * Save scheduled notifications to storage
   */
  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.scheduledNotifications.values());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('❌ Failed to save scheduled notifications:', error);
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const expiredIds: string[] = [];

      for (const [id, notification] of this.scheduledNotifications) {
        if (new Date(notification.scheduledTime) < now) {
          expiredIds.push(id);
        }
      }

      for (const id of expiredIds) {
        this.scheduledNotifications.delete(id);
      }

      if (expiredIds.length > 0) {
        await this.saveScheduledNotifications();
        console.log(`🧹 Cleaned up ${expiredIds.length} expired notifications`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired notifications:', error);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalScheduled: number;
    activeReminders: number;
    expiredCount: number;
  }> {
    const now = new Date();
    const notifications = Array.from(this.scheduledNotifications.values());
    
    return {
      totalScheduled: notifications.length,
      activeReminders: notifications.filter(n => new Date(n.scheduledTime) > now).length,
      expiredCount: notifications.filter(n => new Date(n.scheduledTime) <= now).length,
    };
  }
}

// Export singleton instance
export const eventNotificationService = EventNotificationService.getInstance();
export default EventNotificationService;