/**
 * CalendarScreen - Elite Calendar Feature for ShowTrackAI
 * 
 * A comprehensive calendar interface designed for FFA students to manage:
 * - Livestock shows and competitions
 * - FFA meetings and deadlines
 * - Project milestones and SAE activities
 * - Academic events and workshops
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Event, EventReminder, EVENT_TYPES, PRIORITY_LEVELS } from '../../../core/models/Event';
import { calendarService } from '../../../core/services/CalendarService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { useAnalytics } from '../../../core/hooks/useAnalytics';

interface CalendarScreenProps {
  onBack: () => void;
  onAddEvent?: () => void;
  onEditEvent?: (event: Event) => void;
}

type ViewMode = 'month' | 'week' | 'agenda';

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onBack,
  onAddEvent,
  onEditEvent,
}) => {
  const { currentProfile } = useProfileStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics
  const { trackFeatureUsage, trackCustomEvent, trackError } = useAnalytics({
    autoTrackScreenView: true,
    screenName: 'CalendarScreen',
  });

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (currentProfile) {
      loadCalendarData();
    }
  }, [currentProfile]);

  const loadCalendarData = async () => {
    if (!currentProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      const userEvents = await calendarService.getUserEvents(currentProfile.id);
      setEvents(userEvents);
      
      trackCustomEvent('calendar_loaded', {
        total_events: userEvents.length,
        view_mode: viewMode,
        upcoming_events: userEvents.filter(e => e.date > new Date()).length,
      });
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError('Failed to load calendar events');
      trackError(err as Error, {
        feature: 'calendar',
        userAction: 'load_events',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Analytics wrapper functions
  const handleViewModeChange = (mode: ViewMode) => {
    trackFeatureUsage('calendar', {
      action: 'view_mode_changed',
      previous_mode: viewMode,
      new_mode: mode,
      events_visible: getEventsForCurrentView().length,
    });
    setViewMode(mode);
  };

  const handleAddEvent = () => {
    trackFeatureUsage('calendar', {
      action: 'add_event_initiated',
      view_mode: viewMode,
      selected_date: selectedDate.toISOString().split('T')[0],
    });
    onAddEvent?.();
  };

  const handleEventPress = (event: Event) => {
    trackFeatureUsage('calendar', {
      action: 'event_viewed',
      event_type: event.eventType,
      event_priority: event.priority,
      days_until_event: calendarService.getDaysUntilEvent(event.date),
    });
    onEditEvent?.(event);
  };

  const handleDeleteEvent = (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => trackFeatureUsage('calendar', {
            action: 'delete_event_cancelled',
            event_type: event.eventType,
          })
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await calendarService.deleteEvent(event.id);
              await loadCalendarData();
              trackFeatureUsage('calendar', {
                action: 'event_deleted',
                event_type: event.eventType,
                event_priority: event.priority,
              });
            } catch (err) {
              trackError(err as Error, {
                feature: 'calendar',
                userAction: 'delete_event',
                eventId: event.id,
              });
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  // Calendar calculations
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const today = new Date();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForCurrentView = (): Event[] => {
    switch (viewMode) {
      case 'month':
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        });
      case 'week':
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
      case 'agenda':
        const now = new Date();
        return events.filter(event => event.date >= now).slice(0, 10);
      default:
        return events;
    }
  };

  const getPriorityColor = (priority: Event['priority']): string => {
    const priorityData = PRIORITY_LEVELS.find(p => p.value === priority);
    return priorityData?.color || '#6c757d';
  };

  const getEventTypeIcon = (eventType: Event['eventType']): string => {
    const typeData = EVENT_TYPES.find(t => t.value === eventType);
    return typeData?.icon || '📅';
  };

  // Navigation helpers
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setSelectedDate(newDate);
    
    trackFeatureUsage('calendar', {
      action: 'month_navigation',
      direction,
      new_month: newDate.getMonth(),
      new_year: newDate.getFullYear(),
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    trackFeatureUsage('calendar', {
      action: 'go_to_today',
      view_mode: viewMode,
    });
  };

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>📅 Calendar</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
        <Text style={styles.addButtonText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      {(['month', 'week', 'agenda'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[styles.viewModeButton, viewMode === mode && styles.activeViewMode]}
          onPress={() => handleViewModeChange(mode)}
        >
          <Text style={[styles.viewModeText, viewMode === mode && styles.activeViewModeText]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthHeader = () => (
    <View style={styles.monthHeader}>
      <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
        <Text style={styles.navButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.monthTitleContainer}>
        <Text style={styles.monthTitle}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
        <Text style={styles.navButtonText}>→</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeekDays = () => (
    <View style={styles.weekDaysContainer}>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <View key={day} style={styles.weekDayHeader}>
          <Text style={styles.weekDayText}>{day}</Text>
        </View>
      ))}
    </View>
  );

  const renderMonthView = () => {
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      calendarDays.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            isSelected && styles.selectedCell,
            dayEvents.length > 0 && styles.hasEventsCell,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            isSelected && styles.selectedText,
          ]}>
            {day}
          </Text>
          {dayEvents.length > 0 && (
            <View style={styles.eventDots}>
              {dayEvents.slice(0, 3).map((event, index) => (
                <View
                  key={event.id}
                  style={[
                    styles.eventDot,
                    { backgroundColor: getPriorityColor(event.priority) }
                  ]}
                />
              ))}
              {dayEvents.length > 3 && (
                <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.monthGrid}>
        {calendarDays}
      </View>
    );
  };

  const renderEventsList = () => {
    const currentEvents = getEventsForCurrentView();
    
    if (currentEvents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No Events</Text>
          <Text style={styles.emptySubtitle}>
            {viewMode === 'month' 
              ? `No events scheduled for ${monthNames[currentMonth]}`
              : 'No upcoming events to display'
            }
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddEvent}>
            <Text style={styles.emptyButtonText}>Add First Event</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        {currentEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => handleEventPress(event)}
            onLongPress={() => handleDeleteEvent(event)}
          >
            <View style={styles.eventHeader}>
              <View style={styles.eventIconContainer}>
                <Text style={styles.eventIcon}>{getEventTypeIcon(event.eventType)}</Text>
              </View>
              <View style={styles.eventMainContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {event.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: event.date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
                  })}
                  {!event.isAllDay && ` at ${event.date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`}
                </Text>
              </View>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(event.priority) }]} />
            </View>
            
            {event.description && (
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>
            )}
            
            {event.location && (
              <Text style={styles.eventLocation}>📍 {event.location}</Text>
            )}
            
            <View style={styles.eventDetails}>
              <View style={styles.eventTags}>
                <View style={styles.eventTypeTag}>
                  <Text style={styles.eventTypeTagText}>
                    {EVENT_TYPES.find(t => t.value === event.eventType)?.label || event.eventType}
                  </Text>
                </View>
                {event.isCountyShow && (
                  <View style={styles.countyShowTag}>
                    <Text style={styles.countyShowTagText}>🏆 County Show</Text>
                  </View>
                )}
              </View>
              
              {event.registrationRequired && event.registrationDeadline && (
                <Text style={styles.registrationInfo}>
                  Registration due: {event.registrationDeadline.toLocaleDateString()}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderAgendaView = () => {
    const upcomingEvents = events
      .filter(event => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 20);

    if (upcomingEvents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>No Upcoming Events</Text>
          <Text style={styles.emptySubtitle}>
            You're all caught up! Add new events to stay organized.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddEvent}>
            <Text style={styles.emptyButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.agendaList} showsVerticalScrollIndicator={false}>
        {upcomingEvents.map((event, index) => {
          const daysUntil = calendarService.getDaysUntilEvent(event.date);
          const isUpcoming = daysUntil <= 7;
          
          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.agendaEventCard, isUpcoming && styles.upcomingEventCard]}
              onPress={() => handleEventPress(event)}
            >
              <View style={styles.agendaEventLeft}>
                <Text style={styles.agendaEventIcon}>{getEventTypeIcon(event.eventType)}</Text>
                <View style={styles.agendaEventTime}>
                  <Text style={styles.agendaEventDate}>
                    {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  {!event.isAllDay && (
                    <Text style={styles.agendaEventHour}>
                      {event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.agendaEventContent}>
                <Text style={styles.agendaEventTitle}>{event.title}</Text>
                {event.location && (
                  <Text style={styles.agendaEventLocation}>📍 {event.location}</Text>
                )}
                <View style={styles.agendaEventMeta}>
                  <Text style={[styles.agendaEventDays, isUpcoming && styles.upcomingEventDays]}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                  </Text>
                  <View style={[styles.agendaPriorityDot, { backgroundColor: getPriorityColor(event.priority) }]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please select a profile to view calendar</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderViewModeSelector()}
      
      <View style={styles.content}>
        {viewMode === 'month' && (
          <>
            {renderMonthHeader()}
            {renderWeekDays()}
            {renderMonthView()}
          </>
        )}
        
        {viewMode === 'week' && (
          <>
            {renderMonthHeader()}
            {renderEventsList()}
          </>
        )}
        
        {viewMode === 'agenda' && renderAgendaView()}
      </View>
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  
  // View Mode Selector
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeViewMode: {
    backgroundColor: '#667eea',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeViewModeText: {
    color: '#fff',
  },
  
  // Month Navigation
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 4,
  },
  todayButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Week Days Header
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Month Grid
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dayCell: {
    width: '14.285%', // 7 days in a week
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  todayCell: {
    backgroundColor: '#667eea',
    borderRadius: 12,
  },
  selectedCell: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
  },
  hasEventsCell: {
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayText: {
    color: '#fff',
  },
  selectedText: {
    color: '#667eea',
    fontWeight: '800',
  },
  eventDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreEventsText: {
    fontSize: 8,
    color: '#666',
    fontWeight: '500',
  },
  
  // Events List
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fbff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventMainContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginBottom: 8,
  },
  eventDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  eventTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  eventTypeTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventTypeTagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  countyShowTag: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countyShowTagText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  registrationInfo: {
    fontSize: 12,
    color: '#dc3545',
    fontStyle: 'italic',
  },
  
  // Agenda View
  agendaList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  agendaEventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  upcomingEventCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    backgroundColor: '#f8fbff',
  },
  agendaEventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  agendaEventIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  agendaEventTime: {
    alignItems: 'center',
  },
  agendaEventDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  agendaEventHour: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  agendaEventContent: {
    flex: 1,
  },
  agendaEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  agendaEventLocation: {
    fontSize: 12,
    color: '#667eea',
    marginBottom: 4,
  },
  agendaEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agendaEventDays: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  upcomingEventDays: {
    color: '#667eea',
    fontWeight: '600',
  },
  agendaPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Empty States
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  errorBannerText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
});