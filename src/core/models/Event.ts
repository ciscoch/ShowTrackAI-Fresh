export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  location?: string;
  eventType: 'show' | 'meeting' | 'deadline' | 'fair' | 'competition' | 'field_trip' | 'workshop' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAllDay: boolean;
  reminders?: EventReminder[];
  attendees?: string[];
  organizerName?: string;
  organizerContact?: string;
  registrationRequired?: boolean;
  registrationDeadline?: Date;
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isCountyShow?: boolean;
}

export interface EventReminder {
  id: string;
  eventId: string;
  reminderTime: Date;
  message: string;
  isActive: boolean;
}

export interface CreateEventRequest extends Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {}

export const EVENT_TYPES = [
  { label: 'Show/Competition', value: 'show', icon: '🏆' },
  { label: 'FFA Meeting', value: 'meeting', icon: '🤝' },
  { label: 'Project Deadline', value: 'deadline', icon: '⏰' },
  { label: 'County Fair', value: 'fair', icon: '🎡' },
  { label: 'Competition', value: 'competition', icon: '🥇' },
  { label: 'Field Trip', value: 'field_trip', icon: '🚌' },
  { label: 'Workshop', value: 'workshop', icon: '🔧' },
  { label: 'Other', value: 'other', icon: '📅' },
] as const;

export const PRIORITY_LEVELS = [
  { label: 'Low', value: 'low', color: '#28a745' },
  { label: 'Medium', value: 'medium', color: '#ffc107' },
  { label: 'High', value: 'high', color: '#fd7e14' },
  { label: 'Urgent', value: 'urgent', color: '#dc3545' },
] as const;

export const DEFAULT_COUNTY_SHOW = {
  title: 'County Show',
  description: 'Annual County Livestock Show and Fair',
  eventType: 'show' as const,
  priority: 'high' as const,
  isAllDay: true,
  isCountyShow: true,
  location: 'County Fairgrounds',
};