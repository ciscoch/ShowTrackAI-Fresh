import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Event, EVENT_TYPES, PRIORITY_LEVELS } from '../../../core/models/Event';
import { calendarService } from '../../../core/services/CalendarService';
import { useProfileStore } from '../../../core/stores/ProfileStore';

interface UpcomingEventsScreenProps {
  onBack: () => void;
}

export const UpcomingEventsScreen: React.FC<UpcomingEventsScreenProps> = ({
  onBack,
}) => {
  const { currentProfile } = useProfileStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    if (!currentProfile) return;

    try {
      setLoading(true);
      const upcomingEvents = await calendarService.getUpcomingEvents(currentProfile.id, 60); // Next 60 days
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const getEventTypeInfo = (eventType: string) => {
    return EVENT_TYPES.find(type => type.value === eventType) || EVENT_TYPES[EVENT_TYPES.length - 1];
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITY_LEVELS.find(level => level.value === priority) || PRIORITY_LEVELS[0];
  };

  const getDaysUntilEvent = (eventDate: Date): string => {
    const days = calendarService.getDaysUntilEvent(eventDate);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const formatEventTime = (event: Event): string => {
    if (event.isAllDay) return 'All Day';
    
    const startTime = event.date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (event.endDate) {
      const endTime = event.endDate.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${startTime} - ${endTime}`;
    }
    
    return startTime;
  };

  const renderEventCard = (event: Event) => {
    const eventType = getEventTypeInfo(event.eventType);
    const priority = getPriorityInfo(event.priority);
    const daysUntil = getDaysUntilEvent(event.date);

    return (
      <TouchableOpacity key={event.id} style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Text style={styles.eventTypeIcon}>{eventType.icon}</Text>
            <Text style={styles.eventType}>{eventType.label}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priority.color }]}>
            <Text style={styles.priorityText}>{priority.label}</Text>
          </View>
        </View>

        <View style={styles.eventMainInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>📅</Text>
            <Text style={styles.eventDetailText}>
              {event.date.toLocaleDateString()} • {formatEventTime(event)}
            </Text>
          </View>
          
          {event.location && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailIcon}>📍</Text>
              <Text style={styles.eventDetailText}>{event.location}</Text>
            </View>
          )}

          {event.cost && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailIcon}>💰</Text>
              <Text style={styles.eventDetailText}>${event.cost}</Text>
            </View>
          )}

          {event.registrationRequired && event.registrationDeadline && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailIcon}>📝</Text>
              <Text style={[styles.eventDetailText, styles.registrationText]}>
                Registration due: {event.registrationDeadline.toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.eventFooter}>
          <View style={[styles.countdownBadge, event.isCountyShow && styles.countyShowBadge]}>
            <Text style={[styles.countdownText, event.isCountyShow && styles.countyShowText]}>
              {daysUntil}
            </Text>
          </View>
          {event.organizerName && (
            <Text style={styles.organizerText}>By {event.organizerName}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📅</Text>
      <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
      <Text style={styles.emptyStateText}>
        You don't have any events scheduled for the next 60 days.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length > 0 ? (
          <View style={styles.eventsList}>
            {events.map(renderEventCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  eventsList: {
    padding: 20,
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTypeIcon: {
    fontSize: 20,
  },
  eventType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  eventMainInfo: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailIcon: {
    fontSize: 16,
    width: 20,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  registrationText: {
    color: '#fd7e14',
    fontWeight: '500',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countyShowBadge: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  countdownText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  countyShowText: {
    color: '#856404',
  },
  organizerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});