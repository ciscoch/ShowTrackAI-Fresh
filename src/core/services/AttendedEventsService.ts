/**
 * AttendedEventsService - Event Attendance Management for ShowTrackAI
 * 
 * Comprehensive service for tracking event attendance, calculating FFA SAE/AET points,
 * managing check-in/check-out functionality, and providing motivational encouragement.
 */

import { 
  AttendedEvent, 
  EventCheckInData, 
  EventCheckOutData, 
  AttendanceStreakData, 
  AttendanceMotivation,
  UpcomingEventAlert,
  EventAttendanceType,
  FFAEventCategory,
  AttendanceStatus,
  VerificationMethod,
  AET_POINTS_MATRIX,
  SAE_POINTS_MATRIX,
  FFA_DEGREE_REQUIREMENTS,
  ATTENDANCE_MOTIVATION_MESSAGES
} from '../models/EventAttendance';
import { analyticsService } from './AnalyticsService';
import { ffaDegreeService } from './FFADegreeService';
import { aetFFAIntegrationService } from './AETFFAIntegrationService';
import { eventNotificationService } from './EventNotificationService';

class AttendedEventsService {
  private ffaDegreeService: any;
  private aetService: any;

  constructor() {
    this.ffaDegreeService = ffaDegreeService;
    this.aetService = aetFFAIntegrationService;
  }

  /**
   * Check into an event - start attendance tracking
   */
  async checkInToEvent(userId: string, checkInData: EventCheckInData): Promise<AttendedEvent> {
    try {
      console.log('🎫 Checking into event:', checkInData.event_id);

      const checkInTime = new Date().toISOString();
      
      // Get event details (this would come from calendar/events service)
      const eventDetails = await this.getEventDetails(checkInData.event_id);
      
      // Create attended event record
      const attendedEvent: AttendedEvent = {
        id: this.generateId(),
        user_id: userId,
        event_id: checkInData.event_id,
        event_title: eventDetails.title,
        event_type: eventDetails.type,
        event_category: eventDetails.category,
        
        // Check-in data
        checked_in_at: checkInTime,
        attendance_status: 'checked_in',
        
        // Location tracking
        check_in_location: checkInData.location,
        verification_method: this.determineVerificationMethod(checkInData),
        verification_code: checkInData.verification_code,
        
        // Event details
        event_date: eventDetails.date,
        event_start_time: eventDetails.start_time,
        event_end_time: eventDetails.end_time,
        event_location: eventDetails.location,
        event_description: eventDetails.description,
        learning_objectives: eventDetails.learning_objectives,
        skills_demonstrated: eventDetails.skills_demonstrated,
        career_cluster_alignment: eventDetails.career_cluster_alignment,
        
        // Points (calculated at checkout)
        aet_points_awarded: 0,
        sae_points_awarded: 0,
        ffa_degree_credits: [],
        
        // Metadata
        created_at: checkInTime,
        updated_at: checkInTime,
        metadata: {
          check_in_notes: checkInData.notes,
          motivation_shown: true,
        },
      };

      // Save to storage/database
      await this.saveAttendedEvent(attendedEvent);

      // Show motivational encouragement
      await this.showCheckInMotivation(userId, attendedEvent);

      // Schedule check-out reminders
      await eventNotificationService.scheduleCheckoutReminder(attendedEvent);

      // Track analytics
      analyticsService.trackEducationalEvent('event_check_in', {
        eventType: 'event_attendance',
        event_id: checkInData.event_id,
        event_type: eventDetails.type,
        verification_method: attendedEvent.verification_method,
        has_location: !!checkInData.location,
      });

      console.log('✅ Successfully checked into event:', attendedEvent.event_title);
      return attendedEvent;

    } catch (error) {
      console.error('❌ Failed to check into event:', error);
      analyticsService.trackError(error as Error, {
        feature: 'event_attendance',
        action: 'check_in',
        event_id: checkInData.event_id,
      });
      throw error;
    }
  }

  /**
   * Check out of an event - complete attendance and award points
   */
  async checkOutOfEvent(userId: string, checkOutData: EventCheckOutData): Promise<AttendedEvent> {
    try {
      console.log('🏁 Checking out of event:', checkOutData.attended_event_id);

      const attendedEvent = await this.getAttendedEvent(checkOutData.attended_event_id);
      if (!attendedEvent || attendedEvent.user_id !== userId) {
        throw new Error('Attended event not found or access denied');
      }

      const checkOutTime = new Date().toISOString();
      const checkInTime = new Date(attendedEvent.checked_in_at);
      const durationMinutes = Math.round((new Date().getTime() - checkInTime.getTime()) / 60000);

      // Calculate points based on attendance duration and event type
      const { aetPoints, saePoints } = this.calculateAttendancePoints(
        attendedEvent.event_type,
        durationMinutes
      );

      // Get FFA degree credits
      const ffaCredits = this.calculateFFADegreeCredits(attendedEvent.event_type);

      // Update attended event
      const updatedEvent: AttendedEvent = {
        ...attendedEvent,
        checked_out_at: checkOutTime,
        attendance_duration_minutes: durationMinutes,
        attendance_status: 'verified',
        aet_points_awarded: aetPoints,
        sae_points_awarded: saePoints,
        ffa_degree_credits: ffaCredits,
        updated_at: checkOutTime,
        metadata: {
          ...attendedEvent.metadata,
          check_out_reflection: checkOutData.reflection_notes,
          skills_learned: checkOutData.skills_learned,
          networking_contacts: checkOutData.networking_contacts,
          overall_rating: checkOutData.overall_rating,
        },
      };

      // Save updated event
      await this.saveAttendedEvent(updatedEvent);

      // Award AET points (with fallback)
      try {
        if (this.aetService && typeof this.aetService.awardPointsFromEvent === 'function') {
          await this.aetService.awardPointsFromEvent(userId, {
            event_type: updatedEvent.event_type,
            points: aetPoints,
            skills_demonstrated: updatedEvent.skills_demonstrated || [],
            duration_minutes: durationMinutes,
          });
        } else {
          console.log('📝 AET points award skipped - service method unavailable');
        }
      } catch (aetError) {
        console.warn('AET points award failed:', aetError);
      }

      // Update FFA degree progress (with fallback)
      try {
        if (this.ffaDegreeService && typeof this.ffaDegreeService.updateDegreeProgress === 'function') {
          await this.ffaDegreeService.updateDegreeProgress(userId, ffaCredits);
        } else {
          console.log('📝 FFA degree progress update skipped - service method unavailable');
        }
      } catch (ffaError) {
        console.warn('FFA degree update failed:', ffaError);
      }

      // Show completion celebration
      await this.showCheckOutCelebration(userId, updatedEvent);

      // Update attendance streak
      await this.updateAttendanceStreak(userId);

      // Cancel remaining notifications for this event
      await eventNotificationService.cancelEventNotifications(updatedEvent.id);

      // Track analytics
      analyticsService.trackEducationalEvent('event_check_out', {
        eventType: 'event_attendance',
        event_id: updatedEvent.event_id,
        event_type: updatedEvent.event_type,
        duration_minutes: durationMinutes,
        aet_points_awarded: aetPoints,
        sae_points_awarded: saePoints,
        overall_rating: checkOutData.overall_rating,
      });

      console.log('🎉 Event attendance completed! Points awarded:', { aetPoints, saePoints });
      return updatedEvent;

    } catch (error) {
      console.error('❌ Failed to check out of event:', error);
      analyticsService.trackError(error as Error, {
        feature: 'event_attendance',
        action: 'check_out',
        attended_event_id: checkOutData.attended_event_id,
      });
      throw error;
    }
  }

  /**
   * Get user's attendance history
   */
  async getAttendanceHistory(userId: string, filters?: {
    event_type?: EventAttendanceType;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AttendedEvent[]> {
    try {
      // This would query the database with filters
      // For now, returning mock data structure
      const events = await this.queryAttendedEvents(userId, filters);
      
      return events.sort((a, b) => 
        new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
      );
    } catch (error) {
      console.error('❌ Failed to get attendance history:', error);
      return [];
    }
  }

  /**
   * Get attendance streak data
   */
  async getAttendanceStreak(userId: string): Promise<AttendanceStreakData> {
    try {
      const events = await this.getAttendanceHistory(userId);
      const now = new Date();
      const thisMonth = events.filter(e => 
        new Date(e.checked_in_at).getMonth() === now.getMonth()
      );
      const thisYear = events.filter(e => 
        new Date(e.checked_in_at).getFullYear() === now.getFullYear()
      );

      return {
        current_streak: this.calculateCurrentStreak(events),
        longest_streak: this.calculateLongestStreak(events),
        total_events_attended: events.length,
        this_month_count: thisMonth.length,
        this_semester_count: this.calculateSemesterCount(events),
        this_year_count: thisYear.length,
      };
    } catch (error) {
      console.error('❌ Failed to get attendance streak:', error);
      return {
        current_streak: 0,
        longest_streak: 0,
        total_events_attended: 0,
        this_month_count: 0,
        this_semester_count: 0,
        this_year_count: 0,
      };
    }
  }

  /**
   * Get upcoming events with attendance encouragement
   */
  async getUpcomingEventsWithMotivation(userId: string): Promise<UpcomingEventAlert[]> {
    try {
      // Get user's current progress
      const streakData = await this.getAttendanceStreak(userId);
      
      // Get FFA progress (with fallback if service method doesn't exist)
      let ffaProgress = null;
      try {
        if (this.ffaDegreeService && typeof this.ffaDegreeService.getUserProgress === 'function') {
          ffaProgress = await this.ffaDegreeService.getUserProgress(userId);
        }
      } catch (progressError) {
        console.warn('FFA progress unavailable:', progressError);
      }
      
      // Get upcoming events (would come from calendar service)
      const upcomingEvents = await this.getUpcomingEvents(userId);
      
      return upcomingEvents.map(event => ({
        event_id: event.id,
        event_title: event.title,
        event_date: event.date,
        event_time: event.start_time,
        potential_points: AET_POINTS_MATRIX[event.type] + SAE_POINTS_MATRIX[event.type],
        degree_progress_impact: this.calculateDegreeImpact(event.type, ffaProgress),
        attendance_encouragement: this.generateEncouragement(event, streakData),
        days_until_event: this.calculateDaysUntil(event.date),
      }));
    } catch (error) {
      console.error('❌ Failed to get upcoming events with motivation:', error);
      return [];
    }
  }

  /**
   * Generate motivational message for event attendance
   */
  private generateEncouragement(event: any, streakData: AttendanceStreakData): string {
    const messages = ATTENDANCE_MOTIVATION_MESSAGES;
    
    if (streakData.current_streak >= 5) {
      return messages.streak_building[Math.floor(Math.random() * messages.streak_building.length)];
    }
    
    if (streakData.this_month_count >= 3) {
      return messages.points_close[Math.floor(Math.random() * messages.points_close.length)];
    }
    
    return messages.skill_development[Math.floor(Math.random() * messages.skill_development.length)];
  }

  /**
   * Calculate points based on event type and duration
   */
  private calculateAttendancePoints(eventType: EventAttendanceType, durationMinutes: number): {
    aetPoints: number;
    saePoints: number;
  } {
    const baseAETPoints = AET_POINTS_MATRIX[eventType] || 5;
    const baseSAEPoints = SAE_POINTS_MATRIX[eventType] || 2;
    
    // Bonus for full attendance (90% of expected duration)
    const durationBonus = durationMinutes >= 90 ? 1.2 : 1.0;
    
    return {
      aetPoints: Math.round(baseAETPoints * durationBonus),
      saePoints: Math.round(baseSAEPoints * durationBonus),
    };
  }

  /**
   * Calculate FFA degree credits for event type
   */
  private calculateFFADegreeCredits(eventType: EventAttendanceType) {
    return FFA_DEGREE_REQUIREMENTS[eventType] || [];
  }

  /**
   * Show motivational message on check-in
   */
  private async showCheckInMotivation(userId: string, event: AttendedEvent): Promise<void> {
    const streakData = await this.getAttendanceStreak(userId);
    const message = this.generateEncouragement(event, streakData);
    
    // This would trigger a UI notification/modal
    console.log('🎯 Motivation:', message);
    
    analyticsService.trackEngagement('motivation_shown', {
      context: 'event_check_in',
      event_type: event.event_type,
      current_streak: streakData.current_streak,
    });
  }

  /**
   * Show celebration on successful check-out
   */
  private async showCheckOutCelebration(userId: string, event: AttendedEvent): Promise<void> {
    const totalPoints = event.aet_points_awarded + event.sae_points_awarded;
    
    console.log(`🎊 Congratulations! You earned ${totalPoints} points from ${event.event_title}!`);
    
    analyticsService.trackEngagement('completion_celebration', {
      context: 'event_check_out',
      points_earned: totalPoints,
      event_type: event.event_type,
      duration_minutes: event.attendance_duration_minutes,
    });
  }

  /**
   * Calculate current attendance streak
   */
  private calculateCurrentStreak(events: AttendedEvent[]): number {
    if (events.length === 0) return 0;
    
    let streak = 0;
    const sortedEvents = events.sort((a, b) => 
      new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
    );
    
    // Implementation would check for consecutive attendance
    // This is a simplified version
    return Math.min(sortedEvents.length, 10); // Cap at 10 for demo
  }

  /**
   * Calculate longest attendance streak
   */
  private calculateLongestStreak(events: AttendedEvent[]): number {
    // Implementation would analyze historical data for longest consecutive streak
    return Math.min(events.length + 2, 15); // Simplified for demo
  }

  /**
   * Calculate semester attendance count
   */
  private calculateSemesterCount(events: AttendedEvent[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const semesterStart = currentMonth >= 8 ? 8 : 1; // Fall (Aug) or Spring (Jan)
    
    return events.filter(event => {
      const eventDate = new Date(event.checked_in_at);
      return eventDate.getMonth() >= semesterStart;
    }).length;
  }

  /**
   * Calculate days until event
   */
  private calculateDaysUntil(eventDate: string): number {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate degree progress impact
   */
  private calculateDegreeImpact(eventType: EventAttendanceType, ffaProgress: any): string {
    const credits = FFA_DEGREE_REQUIREMENTS[eventType] || [];
    if (credits.length === 0) return "Contributes to overall FFA experience";
    
    const mainCredit = credits[0];
    return `Advances ${mainCredit.degree_level} degree by ${mainCredit.completion_percentage}%`;
  }

  /**
   * Update attendance streak after successful event
   */
  private async updateAttendanceStreak(userId: string): Promise<void> {
    // Implementation would update user's streak data
    console.log('📈 Attendance streak updated for user:', userId);
  }

  /**
   * Determine verification method based on check-in data
   */
  private determineVerificationMethod(checkInData: EventCheckInData): VerificationMethod {
    if (checkInData.verification_code) return 'instructor_code';
    if (checkInData.location) return 'location_based';
    return 'self_reported';
  }

  // Helper methods (would be implemented with actual database/storage)
  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getEventDetails(eventId: string): Promise<any> {
    // Mock event details - would come from calendar service
    return {
      title: 'FFA Chapter Meeting',
      type: 'ffa_meeting' as EventAttendanceType,
      category: 'chapter_activities' as FFAEventCategory,
      date: new Date().toISOString().split('T')[0],
      start_time: '18:00',
      end_time: '19:30',
      location: 'Agriculture Classroom',
      description: 'Monthly chapter meeting with committee reports and upcoming event planning',
      learning_objectives: ['Leadership development', 'Parliamentary procedure', 'Event planning'],
      skills_demonstrated: ['Communication', 'Organization', 'Teamwork'],
      career_cluster_alignment: ['Agriculture', 'Business', 'Leadership'],
    };
  }

  private async saveAttendedEvent(event: AttendedEvent): Promise<void> {
    // Implementation would save to Supabase/database
    console.log('💾 Saving attended event:', event.id);
  }

  private async getAttendedEvent(id: string): Promise<AttendedEvent | null> {
    // Implementation would query database
    return null;
  }

  private async queryAttendedEvents(userId: string, filters?: any): Promise<AttendedEvent[]> {
    // Implementation would query database with filters
    // For now, return mock data to demonstrate the feature
    const mockHistory: AttendedEvent[] = [
      {
        id: 'attended-001',
        user_id: userId,
        event_id: 'ffa-meeting-prev-001',
        event_title: 'September FFA Meeting',
        event_type: 'ffa_meeting',
        event_category: 'chapter_activities',
        checked_in_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        checked_out_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 90 min later
        attendance_duration_minutes: 90,
        attendance_status: 'verified',
        verification_method: 'instructor_code',
        aet_points_awarded: 5,
        sae_points_awarded: 3,
        ffa_degree_credits: [{
          degree_level: 'greenhand',
          requirement_category: 'chapter_participation',
          requirement_description: 'Attend chapter meetings',
          points_earned: 1,
          completion_percentage: 10,
        }],
        event_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        event_start_time: '18:00',
        event_end_time: '19:30',
        event_location: 'Agriculture Classroom',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'attended-002',
        user_id: userId,
        event_id: 'community-service-001',
        event_title: 'Community Garden Project',
        event_type: 'community_service',
        event_category: 'community_engagement',
        checked_in_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        checked_out_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 180 * 60 * 1000).toISOString(), // 3 hours later
        attendance_duration_minutes: 180,
        attendance_status: 'verified',
        verification_method: 'location_based',
        aet_points_awarded: 10,
        sae_points_awarded: 5,
        ffa_degree_credits: [{
          degree_level: 'greenhand',
          requirement_category: 'community_service',
          requirement_description: 'Complete community service hours',
          points_earned: 2,
          completion_percentage: 20,
        }],
        event_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        event_start_time: '09:00',
        event_end_time: '12:00',
        event_location: 'Downtown Community Garden',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    return mockHistory;
  }

  private async getUpcomingEvents(userId: string): Promise<any[]> {
    // Implementation would get upcoming events from calendar service
    // For now, return mock data to demonstrate the feature
    const mockEvents = [
      {
        id: 'ffa-meeting-001',
        title: 'Monthly FFA Chapter Meeting',
        type: 'ffa_meeting',
        date: this.getDateString(3), // 3 days from now
        start_time: '18:00',
        location: 'Agriculture Classroom',
      },
      {
        id: 'livestock-show-001',
        title: 'County Livestock Show',
        type: 'livestock_show',
        date: this.getDateString(14), // 2 weeks from now
        start_time: '08:00',
        location: 'County Fairgrounds',
      },
      {
        id: 'leadership-training-001',
        title: 'FFA Leadership Workshop',
        type: 'leadership_training',
        date: this.getDateString(7), // 1 week from now
        start_time: '09:00',
        location: 'District FFA Center',
      },
    ];
    
    return mockEvents;
  }

  /**
   * Send immediate check-out reminder for active attendance
   */
  async sendCheckoutReminder(attendedEventId: string): Promise<void> {
    try {
      const attendedEvent = await this.getAttendedEvent(attendedEventId);
      if (!attendedEvent || attendedEvent.attendance_status !== 'checked_in') {
        throw new Error('No active attendance found for reminder');
      }

      await eventNotificationService.sendImmediateCheckoutReminder(attendedEvent);
      
      analyticsService.trackEngagement('manual_checkout_reminder', {
        attended_event_id: attendedEventId,
        event_type: attendedEvent.event_type,
      });

      console.log('📱 Check-out reminder sent for event:', attendedEvent.event_title);
    } catch (error) {
      console.error('❌ Failed to send checkout reminder:', error);
      throw error;
    }
  }

  /**
   * Get active attendances that need check-out reminders
   */
  async getActiveAttendancesNeedingReminder(userId: string): Promise<AttendedEvent[]> {
    try {
      const history = await this.getAttendanceHistory(userId);
      const now = new Date();
      
      return history.filter(event => {
        if (event.attendance_status !== 'checked_in' || !event.event_end_time) {
          return false;
        }

        const eventEndTime = this.parseEventDateTime(event.event_date, event.event_end_time);
        const timeSinceEnd = now.getTime() - eventEndTime.getTime();
        
        // Show reminder if event ended within last 30 minutes
        return timeSinceEnd > 0 && timeSinceEnd < (30 * 60 * 1000);
      });
    } catch (error) {
      console.error('❌ Failed to get active attendances:', error);
      return [];
    }
  }

  /**
   * Initialize notification system
   */
  async initializeNotifications(): Promise<boolean> {
    try {
      return await eventNotificationService.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Parse event date and time into Date object
   */
  private parseEventDateTime(eventDate: string, eventTime: string): Date {
    const [hours, minutes] = eventTime.split(':').map(Number);
    const date = new Date(eventDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Helper to get date string for X days from now
   */
  private getDateString(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}

// Export singleton instance
export const attendedEventsService = new AttendedEventsService();
export default AttendedEventsService;