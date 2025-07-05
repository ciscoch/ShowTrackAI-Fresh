import { storageService } from './StorageService';
import { Event, CreateEventRequest, DEFAULT_COUNTY_SHOW } from '../models/Event';

export class CalendarService {
  private readonly STORAGE_KEY = '@ShowTrackAI:events';

  /**
   * Get all events for a user
   */
  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      const allEvents = await storageService.loadData<Event[]>(this.STORAGE_KEY) || [];
      return allEvents
        .filter(event => event.userId === userId)
        .map(event => ({
          ...event,
          date: new Date(event.date),
          endDate: event.endDate ? new Date(event.endDate) : undefined,
          registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Failed to get user events:', error);
      return [];
    }
  }

  /**
   * Get upcoming events (next 30 days)
   */
  async getUpcomingEvents(userId: string, days: number = 30): Promise<Event[]> {
    try {
      const allEvents = await this.getUserEvents(userId);
      const now = new Date();
      const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

      return allEvents.filter(event => 
        event.date >= now && event.date <= futureDate
      );
    } catch (error) {
      console.error('Failed to get upcoming events:', error);
      return [];
    }
  }

  /**
   * Get next County Show event
   */
  async getCountyShow(userId: string): Promise<Event | null> {
    try {
      const allEvents = await this.getUserEvents(userId);
      const now = new Date();
      
      const countyShow = allEvents.find(event => 
        event.isCountyShow && event.date >= now
      );

      return countyShow || null;
    } catch (error) {
      console.error('Failed to get county show:', error);
      return null;
    }
  }

  /**
   * Calculate days until event
   */
  getDaysUntilEvent(eventDate: Date): number {
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Add a new event
   */
  async addEvent(eventData: CreateEventRequest): Promise<Event> {
    try {
      const newEvent: Event = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const allEvents = await storageService.loadData<Event[]>(this.STORAGE_KEY) || [];
      allEvents.push(newEvent);
      await storageService.saveData(this.STORAGE_KEY, allEvents);

      return newEvent;
    } catch (error) {
      console.error('Failed to add event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const allEvents = await storageService.loadData<Event[]>(this.STORAGE_KEY) || [];
      const eventIndex = allEvents.findIndex(event => event.id === eventId);

      if (eventIndex === -1) {
        throw new Error('Event not found');
      }

      allEvents[eventIndex] = {
        ...allEvents[eventIndex],
        ...updates,
        updatedAt: new Date(),
      };

      await storageService.saveData(this.STORAGE_KEY, allEvents);
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const allEvents = await storageService.loadData<Event[]>(this.STORAGE_KEY) || [];
      const filteredEvents = allEvents.filter(event => event.id !== eventId);
      await storageService.saveData(this.STORAGE_KEY, filteredEvents);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  /**
   * Create demo events for testing
   */
  async createDemoEvents(userId: string): Promise<void> {
    try {
      const now = new Date();
      
      const demoEvents: CreateEventRequest[] = [
        {
          ...DEFAULT_COUNTY_SHOW,
          date: new Date(now.getTime() + (45 * 24 * 60 * 60 * 1000)), // 45 days from now
          userId,
        },
        {
          title: 'FFA Chapter Meeting',
          description: 'Monthly chapter meeting to discuss upcoming events and projects',
          date: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
          eventType: 'meeting',
          priority: 'medium',
          isAllDay: false,
          location: 'School Agriculture Classroom',
          organizerName: 'Ms. Rodriguez',
          userId,
        },
        {
          title: 'Animal Health Workshop',
          description: 'Learn about livestock health management and vaccination schedules',
          date: new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)), // 14 days from now
          eventType: 'workshop',
          priority: 'high',
          isAllDay: false,
          location: 'County Extension Office',
          cost: 25,
          registrationRequired: true,
          registrationDeadline: new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000)),
          userId,
        },
        {
          title: 'Project Record Books Due',
          description: 'Submit completed project record books for review',
          date: new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000)), // 21 days from now
          eventType: 'deadline',
          priority: 'urgent',
          isAllDay: true,
          organizerName: 'FFA Advisor',
          userId,
        },
        {
          title: 'Regional Livestock Competition',
          description: 'Regional showmanship and livestock judging competition',
          date: new Date(now.getTime() + (35 * 24 * 60 * 60 * 1000)), // 35 days from now
          eventType: 'competition',
          priority: 'high',
          isAllDay: true,
          location: 'Regional Fairgrounds',
          cost: 50,
          registrationRequired: true,
          registrationDeadline: new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)),
          userId,
        },
      ];

      for (const eventData of demoEvents) {
        await this.addEvent(eventData);
      }
    } catch (error) {
      console.error('Failed to create demo events:', error);
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(userId: string, eventType: string): Promise<Event[]> {
    try {
      const allEvents = await this.getUserEvents(userId);
      return allEvents.filter(event => event.eventType === eventType);
    } catch (error) {
      console.error('Failed to get events by type:', error);
      return [];
    }
  }

  /**
   * Get events by priority
   */
  async getEventsByPriority(userId: string, priority: string): Promise<Event[]> {
    try {
      const allEvents = await this.getUserEvents(userId);
      return allEvents.filter(event => event.priority === priority);
    } catch (error) {
      console.error('Failed to get events by priority:', error);
      return [];
    }
  }
}

export const calendarService = new CalendarService();