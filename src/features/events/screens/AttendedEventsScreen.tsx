/**
 * AttendedEventsScreen - Event Attendance Management
 * 
 * Comprehensive screen for managing event attendance with prominent encouragement,
 * streak tracking, points progress, and FFA degree advancement.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { attendedEventsService } from '../../../core/services/AttendedEventsService';
import { useAnalytics } from '../../../core/hooks/useAnalytics';
import { 
  AttendedEvent, 
  AttendanceStreakData, 
  UpcomingEventAlert,
  EventAttendanceType 
} from '../../../core/models/EventAttendance';
import EventCheckInModal from '../components/EventCheckInModal';
import EventCheckOutModal from '../components/EventCheckOutModal';

interface AttendedEventsScreenProps {
  onNavigateToCalendar?: () => void;
  onNavigateToFFA?: () => void;
  onNavigateToNotificationSettings?: () => void;
  onNavigateBack?: () => void;
  onNavigateToHome?: () => void;
}

export const AttendedEventsScreen: React.FC<AttendedEventsScreenProps> = ({
  onNavigateToCalendar,
  onNavigateToFFA,
  onNavigateToNotificationSettings,
  onNavigateBack,
  onNavigateToHome,
}) => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendedEvent[]>([]);
  const [streakData, setStreakData] = useState<AttendanceStreakData | null>(null);
  const [upcomingAlerts, setUpcomingAlerts] = useState<UpcomingEventAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeAttendance, setActiveAttendance] = useState<AttendedEvent | null>(null);
  
  // Animation values
  const [motivationOpacity] = useState(new Animated.Value(0));
  const [streakPulse] = useState(new Animated.Value(1));

  const { trackFeatureUsage, trackScreen } = useAnalytics({
    autoTrackScreenView: true,
    screenName: 'AttendedEventsScreen',
  });

  useEffect(() => {
    initializeScreen();
    startMotivationAnimation();
  }, []);

  const initializeScreen = async () => {
    // Initialize notifications
    await attendedEventsService.initializeNotifications();
    
    // Load data
    await loadData();
    
    // Check for overdue check-outs
    await checkForOverdueCheckouts();
  };

  const startMotivationAnimation = () => {
    // Animate motivation sections
    Animated.timing(motivationOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for streak
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [history, streak, alerts] = await Promise.all([
        attendedEventsService.getAttendanceHistory('current-user-id'),
        attendedEventsService.getAttendanceStreak('current-user-id'),
        attendedEventsService.getUpcomingEventsWithMotivation('current-user-id'),
      ]);

      setAttendanceHistory(history);
      setStreakData(streak);
      setUpcomingAlerts(alerts);
      
      // Check for active attendance (checked in but not checked out)
      const active = history.find(event => 
        event.attendance_status === 'checked_in' && !event.checked_out_at
      );
      setActiveAttendance(active || null);

    } catch (error) {
      console.error('Failed to load attendance data:', error);
      Alert.alert('Error', 'Failed to load attendance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheckInSuccess = (attendedEvent: AttendedEvent) => {
    setActiveAttendance(attendedEvent);
    loadData(); // Refresh data
    
    trackFeatureUsage('event_attendance', {
      action: 'check_in_success',
      event_type: attendedEvent.event_type,
    });
  };

  const handleCheckOutSuccess = (updatedEvent: AttendedEvent) => {
    setActiveAttendance(null);
    loadData(); // Refresh data
    
    trackFeatureUsage('event_attendance', {
      action: 'check_out_success',
      points_earned: updatedEvent.aet_points_awarded + updatedEvent.sae_points_awarded,
      duration_minutes: updatedEvent.attendance_duration_minutes,
    });
  };

  const openCheckInModal = (event: any) => {
    setSelectedEvent(event);
    setCheckInModalVisible(true);
  };

  const openCheckOutModal = () => {
    if (activeAttendance) {
      setCheckOutModalVisible(true);
    }
  };

  const checkForOverdueCheckouts = async () => {
    try {
      const overdueAttendances = await attendedEventsService.getActiveAttendancesNeedingReminder('current-user-id');
      
      if (overdueAttendances.length > 0) {
        const event = overdueAttendances[0]; // Show alert for first overdue event
        Alert.alert(
          '⏰ Don\'t Forget to Check Out!',
          `You attended ${event.event_title} but haven't checked out yet. Check out now to earn your FFA SAE/AET points!`,
          [
            {
              text: 'Remind Me Later',
              style: 'cancel',
              onPress: () => sendCheckoutReminder(event.id),
            },
            {
              text: 'Check Out Now',
              onPress: () => {
                setActiveAttendance(event);
                setCheckOutModalVisible(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.warn('Failed to check for overdue checkouts:', error);
    }
  };

  const sendCheckoutReminder = async (attendedEventId: string) => {
    try {
      await attendedEventsService.sendCheckoutReminder(attendedEventId);
      Alert.alert(
        '📱 Reminder Set!',
        'We\'ll send you a notification to remind you to check out and earn your points.'
      );
    } catch (error) {
      Alert.alert(
        'Reminder Failed',
        'Unable to set reminder. Please try checking out manually.'
      );
    }
  };

  const renderMotivationalHeader = () => (
    <Animated.View style={[styles.motivationHeader, { opacity: motivationOpacity }]}>
      <Text style={styles.motivationTitle}>🌟 Event Attendance Hub</Text>
      <Text style={styles.motivationSubtitle}>
        Build your FFA journey through active participation!
      </Text>
      
      {streakData && (
        <Animated.View style={[styles.streakContainer, { transform: [{ scale: streakPulse }] }]}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streakData.current_streak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streakData.this_month_count}</Text>
            <Text style={styles.streakLabel}>This Month</Text>
          </View>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streakData.total_events_attended}</Text>
            <Text style={styles.streakLabel}>Total Events</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderActiveAttendance = () => {
    if (!activeAttendance) return null;

    const checkInTime = new Date(activeAttendance.checked_in_at);
    const now = new Date();
    const durationMinutes = Math.round((now.getTime() - checkInTime.getTime()) / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return (
      <View style={styles.activeAttendanceContainer}>
        <Text style={styles.activeTitle}>🎯 Currently Attending</Text>
        <View style={styles.activeEventCard}>
          <Text style={styles.activeEventTitle}>{activeAttendance.event_title}</Text>
          <Text style={styles.activeEventTime}>
            Attending for {hours}h {minutes}m
          </Text>
          <View style={styles.activeButtonsContainer}>
            <TouchableOpacity
              style={styles.checkOutButton}
              onPress={openCheckOutModal}
            >
              <Text style={styles.checkOutButtonText}>🏁 Check Out & Earn Points</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => sendCheckoutReminder(activeAttendance.id)}
            >
              <Text style={styles.reminderButtonText}>🔔 Set Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderUpcomingEvents = () => (
    <View style={styles.upcomingSection}>
      <Text style={styles.sectionTitle}>📅 Upcoming Opportunities</Text>
      {upcomingAlerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No upcoming events</Text>
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={onNavigateToCalendar}
          >
            <Text style={styles.calendarButtonText}>📅 View Calendar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        upcomingAlerts.map((alert, index) => (
          <View key={index} style={styles.upcomingEventCard}>
            <View style={styles.upcomingEventHeader}>
              <Text style={styles.upcomingEventTitle}>{alert.event_title}</Text>
              <Text style={styles.upcomingEventPoints}>+{alert.potential_points} pts</Text>
            </View>
            <Text style={styles.upcomingEventDate}>
              {alert.event_date} at {alert.event_time}
            </Text>
            <Text style={styles.upcomingEventImpact}>{alert.degree_progress_impact}</Text>
            <Text style={styles.upcomingEventEncouragement}>{alert.attendance_encouragement}</Text>
            
            <TouchableOpacity
              style={styles.preCheckInButton}
              onPress={() => openCheckInModal({
                id: alert.event_id,
                title: alert.event_title,
                type: 'ffa_meeting', // Would be dynamic
              })}
            >
              <Text style={styles.preCheckInButtonText}>🎯 Ready to Check In</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderAttendanceHistory = () => (
    <View style={styles.historySection}>
      <Text style={styles.sectionTitle}>📚 Your Achievement History</Text>
      {attendanceHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Start attending events to build your FFA portfolio!
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Every event adds valuable points and advances your degree progress.
          </Text>
        </View>
      ) : (
        attendanceHistory.slice(0, 10).map((event, index) => (
          <View key={index} style={styles.historyEventCard}>
            <View style={styles.historyEventHeader}>
              <Text style={styles.historyEventTitle}>{event.event_title}</Text>
              <Text style={styles.historyEventPoints}>
                +{event.aet_points_awarded + event.sae_points_awarded} pts
              </Text>
            </View>
            <Text style={styles.historyEventDate}>
              {new Date(event.checked_in_at).toLocaleDateString()}
            </Text>
            <Text style={styles.historyEventDuration}>
              Attended for {Math.round((event.attendance_duration_minutes || 0) / 60 * 10) / 10}h
            </Text>
            {event.ffa_degree_credits.length > 0 && (
              <Text style={styles.historyEventCredits}>
                🎓 {event.ffa_degree_credits[0].degree_level} degree progress
              </Text>
            )}
          </View>
        ))
      )}
      
      {attendanceHistory.length > 10 && (
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All History</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={onNavigateToCalendar}
      >
        <Text style={styles.actionButtonText}>📅 Calendar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={onNavigateToFFA}
      >
        <Text style={styles.actionButtonText}>🎓 FFA Progress</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={onNavigateToNotificationSettings}
      >
        <Text style={styles.actionButtonText}>🔔 Reminders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => trackFeatureUsage('event_attendance', { action: 'help_viewed' })}
      >
        <Text style={styles.actionButtonText}>❓ Help</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onNavigateBack || onNavigateToHome}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>🎯 Event Attendance Hub</Text>
            <Text style={styles.headerSubtitle}>Build your FFA journey through active participation!</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={onNavigateToHome}
        >
          <Text style={styles.homeButtonText}>🏠</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Removed motivational header - now in main header */}
        {renderActiveAttendance()}
        {renderUpcomingEvents()}
        {renderAttendanceHistory()}
        {renderQuickActions()}
      </ScrollView>

      {/* Check-in Modal */}
      {selectedEvent && (
        <EventCheckInModal
          visible={checkInModalVisible}
          onClose={() => setCheckInModalVisible(false)}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          eventType={selectedEvent.type}
          onCheckInSuccess={handleCheckInSuccess}
        />
      )}

      {/* Check-out Modal */}
      {activeAttendance && (
        <EventCheckOutModal
          visible={checkOutModalVisible}
          onClose={() => setCheckOutModalVisible(false)}
          attendedEventId={activeAttendance.id}
          eventTitle={activeAttendance.event_title}
          checkInTime={activeAttendance.checked_in_at}
          onCheckOutSuccess={handleCheckOutSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Header Navigation Styles
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C8E6C9',
    lineHeight: 18,
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  motivationHeader: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  motivationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationSubtitle: {
    fontSize: 16,
    color: '#C8E6C9',
    textAlign: 'center',
    marginBottom: 20,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 12,
    color: '#C8E6C9',
    marginTop: 4,
  },
  activeAttendanceContainer: {
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 12,
  },
  activeEventCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  activeEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activeEventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  activeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  checkOutButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
  },
  checkOutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reminderButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  reminderButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  upcomingSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  upcomingEventCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  upcomingEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  upcomingEventPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingEventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  upcomingEventImpact: {
    fontSize: 13,
    color: '#2E7D32',
    marginBottom: 4,
  },
  upcomingEventEncouragement: {
    fontSize: 13,
    color: '#1976D2',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  preCheckInButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  preCheckInButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  historySection: {
    margin: 16,
  },
  historyEventCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyEventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  historyEventPoints: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  historyEventDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  historyEventDuration: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  historyEventCredits: {
    fontSize: 12,
    color: '#1976D2',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  calendarButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  calendarButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    minWidth: '22%',
  },
  actionButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default AttendedEventsScreen;