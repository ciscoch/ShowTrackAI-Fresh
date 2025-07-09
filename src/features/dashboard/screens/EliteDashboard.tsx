import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { QRCodeGenerator } from '../../qrcode/components/QRCodeGenerator';
import { calendarService } from '../../../core/services/CalendarService';
import { Event } from '../../../core/models/Event';

interface EliteDashboardProps {
  onSwitchProfile: () => void;
  onShowSettings: () => void;
  onNavigateToAnimals: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToAI: () => void;
  onNavigateToExport: () => void;
  onNavigateToJournal: () => void;
  onNavigateToFinancial: () => void;
  onNavigateToMedical: () => void;
  onNavigateToCalendar: () => void;
  onAddAnimal?: () => void;
  onTakePhoto?: () => void;
  onAddEvent?: () => void;
  onNavigateToVetConnect?: () => void;
}

export const EliteDashboard: React.FC<EliteDashboardProps> = ({
  onSwitchProfile,
  onShowSettings,
  onNavigateToAnimals,
  onNavigateToAnalytics,
  onNavigateToAI,
  onNavigateToExport,
  onNavigateToJournal,
  onNavigateToFinancial,
  onNavigateToMedical,
  onNavigateToCalendar,
  onAddAnimal,
  onTakePhoto,
  onAddEvent,
  onNavigateToVetConnect,
}) => {
  const { currentProfile } = useProfileStore();
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [countyShow, setCountyShow] = useState<Event | null>(null);
  const [daysUntilCountyShow, setDaysUntilCountyShow] = useState<number>(0);

  useEffect(() => {
    if (currentProfile) {
      loadCalendarData();
    }
  }, [currentProfile]);

  const loadCalendarData = async () => {
    if (!currentProfile) return;

    try {
      // Load upcoming events (next 7 days for dashboard preview)
      const events = await calendarService.getUpcomingEvents(currentProfile.id, 7);
      setUpcomingEvents(events.slice(0, 3)); // Show only first 3 events

      // Load county show
      const show = await calendarService.getCountyShow(currentProfile.id);
      setCountyShow(show);
      
      if (show) {
        const days = calendarService.getDaysUntilEvent(show.date);
        setDaysUntilCountyShow(days);
      }

      // Create demo events if none exist
      if (events.length === 0) {
        await calendarService.createDemoEvents(currentProfile.id);
        // Reload after creating demo events
        const newEvents = await calendarService.getUpcomingEvents(currentProfile.id, 7);
        setUpcomingEvents(newEvents.slice(0, 3));
        
        const newShow = await calendarService.getCountyShow(currentProfile.id);
        setCountyShow(newShow);
        if (newShow) {
          const newDays = calendarService.getDaysUntilEvent(newShow.date);
          setDaysUntilCountyShow(newDays);
        }
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  };

  if (!currentProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No profile selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.profileName}>{currentProfile.name}</Text>
          <Text style={styles.profileType}>Elite Student • {currentProfile.school}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>⭐ ELITE</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onSwitchProfile}
          >
            <Text style={styles.headerButtonText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onShowSettings}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Elite Benefits Banner */}
        <View style={styles.eliteBanner}>
          <Text style={styles.eliteBannerIcon}>🎉</Text>
          <View style={styles.eliteBannerContent}>
            <Text style={styles.eliteBannerTitle}>Elite Features Unlocked!</Text>
            <Text style={styles.eliteBannerText}>
              Enjoy unlimited animals, AI predictions, and advanced analytics
            </Text>
          </View>
        </View>

        {/* Elite Student Features - Moved up */}
        <View style={styles.featuresSection}>
          {/* Elite Premium Features */}
          <View style={styles.featuresSubsection}>
            <Text style={styles.subsectionTitle}>⭐ Elite Premium Features</Text>
            <View style={styles.featuresGrid}>
              <TouchableOpacity 
                style={styles.premiumFeatureCard}
                onPress={onNavigateToAnimals}
              >
                <Text style={styles.featureIcon}>🐄</Text>
                <Text style={styles.featureTitle}>Unlimited Animals</Text>
                <Text style={styles.featureSubtitle}>No limits on your herd</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>ELITE</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.premiumFeatureCard}
                onPress={onNavigateToAI}
              >
                <Text style={styles.featureIcon}>🤖</Text>
                <Text style={styles.featureTitle}>AI Predictions</Text>
                <Text style={styles.featureSubtitle}>91.6% accuracy rate</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>ELITE</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.premiumFeatureCard}
                onPress={onNavigateToAnalytics}
              >
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureTitle}>Advanced Analytics</Text>
                <Text style={styles.featureSubtitle}>Deep insights & trends</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>ELITE</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.premiumFeatureCard}
                onPress={onNavigateToExport}
              >
                <Text style={styles.featureIcon}>📤</Text>
                <Text style={styles.featureTitle}>All Export Formats</Text>
                <Text style={styles.featureSubtitle}>PDF, Excel, Schedule F</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>ELITE</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Student Features */}
          <View style={styles.featuresSubsection}>
            <Text style={styles.subsectionTitle}>📖 Additional Student Features</Text>
            <View style={styles.featuresGrid}>
              <TouchableOpacity style={styles.featureCard}>
                <Text style={styles.featureIcon}>🎓</Text>
                <Text style={styles.featureTitle}>FFA Integration</Text>
                <Text style={styles.featureSubtitle}>SAE project tracking</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard}
                onPress={onNavigateToFinancial}
              >
                <Text style={styles.featureIcon}>💰</Text>
                <Text style={styles.featureTitle}>Financial Tracking</Text>
                <Text style={styles.featureSubtitle}>Expenses & income</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard}
                onPress={onNavigateToMedical}
              >
                <Text style={styles.featureIcon}>🏥</Text>
                <Text style={styles.featureTitle}>Medical Records</Text>
                <Text style={styles.featureSubtitle}>Health tracking & vet records</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📈 Your Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentProfile.stats.animalsManaged}</Text>
              <Text style={styles.statLabel}>Animals Managed</Text>
              <Text style={styles.statNote}>Unlimited ♾️</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentProfile.stats.journalEntries}</Text>
              <Text style={styles.statLabel}>Journal Entries</Text>
              <Text style={styles.statNote}>Advanced logging</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(currentProfile.stats.totalHoursLogged / 60)}</Text>
              <Text style={styles.statLabel}>Hours Logged</Text>
              <Text style={styles.statNote}>AI insights</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentProfile.stats.achievementsEarned}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
              <Text style={styles.statNote}>Elite rewards</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Events & County Show Countdown */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>📅 Student Project Management</Text>
            <View style={styles.calendarActions}>
              {onAddEvent && (
                <TouchableOpacity onPress={onAddEvent} style={styles.addEventButton}>
                  <Text style={styles.addEventText}>+ Event</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onNavigateToCalendar} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* County Show Countdown */}
          {countyShow && (
            <View style={styles.countyShowCard}>
              <View style={styles.countyShowHeader}>
                <Text style={styles.countyShowIcon}>🏆</Text>
                <View style={styles.countyShowInfo}>
                  <Text style={styles.countyShowTitle}>Days until County Show</Text>
                  <Text style={styles.countyShowDate}>
                    {countyShow.date.toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownNumber}>{daysUntilCountyShow}</Text>
                <Text style={styles.countdownLabel}>
                  {daysUntilCountyShow === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </View>
          )}

          {/* Upcoming Events Preview */}
          <View style={styles.upcomingEventsCard}>
            <Text style={styles.eventsTitle}>Upcoming Events</Text>
            {upcomingEvents.length > 0 ? (
              <View style={styles.eventsList}>
                {upcomingEvents.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDay}>
                        {event.date.toLocaleDateString([], { day: 'numeric' })}
                      </Text>
                      <Text style={styles.eventMonth}>
                        {event.date.toLocaleDateString([], { month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventTime}>
                        {event.isAllDay ? 'All Day' : event.date.toLocaleTimeString([], { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </Text>
                      {event.location && (
                        <Text style={styles.eventLocation} numberOfLines={1}>
                          📍 {event.location}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>No upcoming events</Text>
                <Text style={styles.noEventsSubtext}>Your schedule is clear!</Text>
              </View>
            )}
          </View>
        </View>

        {/* VetConnect Feature - Highlighted */}
        <View style={styles.vetConnectSection}>
          <Text style={styles.sectionTitle}>🏥 VetConnect Platform</Text>
          <Text style={styles.vetConnectSubtitle}>
            AI-powered veterinary diagnostics with real-time professional consultations
          </Text>
          
          <TouchableOpacity 
            style={styles.vetConnectCard}
            onPress={onNavigateToVetConnect}
          >
            <View style={styles.vetConnectHeader}>
              <Text style={styles.vetConnectIcon}>🤖👨‍⚕️</Text>
              <View style={styles.vetConnectInfo}>
                <Text style={styles.vetConnectTitle}>AI Veterinary Assistant</Text>
                <Text style={styles.vetConnectDescription}>
                  Instant health assessments • Licensed vet consultations • Educational learning
                </Text>
              </View>
              <Text style={styles.vetConnectArrow}>→</Text>
            </View>
            
            <View style={styles.vetConnectFeatures}>
              <View style={styles.vetConnectFeature}>
                <Text style={styles.featureCheckmark}>✓</Text>
                <Text style={styles.featureText}>Computer vision health scanning</Text>
              </View>
              <View style={styles.vetConnectFeature}>
                <Text style={styles.featureCheckmark}>✓</Text>
                <Text style={styles.featureText}>Smart diagnostic recommendations</Text>
              </View>
              <View style={styles.vetConnectFeature}>
                <Text style={styles.featureCheckmark}>✓</Text>
                <Text style={styles.featureText}>Real-time vet consultations</Text>
              </View>
            </View>
            
            <View style={styles.vetConnectStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>91%</Text>
                <Text style={styles.statLabel}>AI Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12min</Text>
                <Text style={styles.statLabel}>Avg Response</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.8⭐</Text>
                <Text style={styles.statLabel}>User Rating</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Student Project Management - Top Priority */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>📚 Student Project Management</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={styles.highlightFeatureCard}
              onPress={onNavigateToJournal}
            >
              <Text style={styles.featureIcon}>📝</Text>
              <Text style={styles.featureTitle}>Advanced Journal</Text>
              <Text style={styles.featureSubtitle}>AET skill tracking</Text>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>FEATURED</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.highlightFeatureCard}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureTitle}>Unlimited Photos</Text>
              <Text style={styles.featureSubtitle}>Smart organization</Text>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>FEATURED</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Insights Card */}
        <View style={styles.aiInsightsCard}>
          <Text style={styles.aiInsightsTitle}>🤖 AI Insights</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiInsightIcon}>📈</Text>
            <View style={styles.aiInsightContent}>
              <Text style={styles.aiInsightText}>
                Your animals are showing optimal growth patterns. Consider increasing feed by 5% for maximum efficiency.
              </Text>
              <Text style={styles.aiInsightConfidence}>Confidence: 94%</Text>
            </View>
          </View>
          
          <View style={styles.aiInsight}>
            <Text style={styles.aiInsightIcon}>⚠️</Text>
            <View style={styles.aiInsightContent}>
              <Text style={styles.aiInsightText}>
                Animal #A001 weight variance detected. Recommend health check within 3 days.
              </Text>
              <Text style={styles.aiInsightConfidence}>Confidence: 87%</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>View All AI Recommendations</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsList}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={onAddAnimal || onNavigateToAnimals}
            >
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text style={styles.quickActionText}>Add Animal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={onNavigateToJournal}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionText}>Log Activity</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={onTakePhoto}
            >
              <Text style={styles.quickActionIcon}>📸</Text>
              <Text style={styles.quickActionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={onNavigateToExport}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Generate Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => setShowQRGenerator(true)}
            >
              <Text style={styles.quickActionIcon}>📱</Text>
              <Text style={styles.quickActionText}>Share QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Banner */}
        <View style={styles.supportBanner}>
          <Text style={styles.supportIcon}>🎧</Text>
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Elite Priority Support</Text>
            <Text style={styles.supportText}>
              Need help? Elite members get priority support with faster response times.
            </Text>
          </View>
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* QR Code Generator Modal */}
      {currentProfile && (
        <QRCodeGenerator
          studentId={currentProfile.id}
          studentName={currentProfile.name}
          visible={showQRGenerator}
          onClose={() => setShowQRGenerator(false)}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tierText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  eliteBanner: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  eliteBannerIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  eliteBannerContent: {
    flex: 1,
  },
  eliteBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  eliteBannerText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    padding: 12,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statNote: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  featuresSubsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    paddingLeft: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  premiumFeatureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#007AFF',
    position: 'relative',
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  highlightFeatureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#28a745',
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  aiInsightsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  aiInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  aiInsightIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  aiInsightContent: {
    flex: 1,
  },
  aiInsightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  aiInsightConfidence: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '500',
  },
  aiButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  supportBanner: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  supportIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 2,
  },
  supportText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  supportButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  // Calendar Section Styles
  calendarSection: {
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addEventButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addEventText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  countyShowCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ffc107',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countyShowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countyShowIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  countyShowInfo: {
    flex: 1,
  },
  countyShowTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 2,
  },
  countyShowDate: {
    fontSize: 14,
    color: '#856404',
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffc107',
    marginBottom: 4,
  },
  countdownLabel: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  upcomingEventsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  eventDate: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 50,
  },
  eventDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventMonth: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  // VetConnect Styles
  vetConnectSection: {
    marginBottom: 24,
  },
  vetConnectSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  vetConnectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  vetConnectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vetConnectIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  vetConnectInfo: {
    flex: 1,
  },
  vetConnectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vetConnectDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  vetConnectArrow: {
    fontSize: 24,
    color: '#28a745',
    fontWeight: 'bold',
  },
  vetConnectFeatures: {
    marginBottom: 16,
    gap: 8,
  },
  vetConnectFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheckmark: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  vetConnectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fbff',
    borderRadius: 12,
    padding: 12,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});