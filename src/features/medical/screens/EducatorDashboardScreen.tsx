import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { followUpTaskService } from '../../../core/services/FollowUpTaskService';
import { 
  FollowUpTask, 
  HealthAlert, 
  ChapterHealthMetrics,
  StudentHealthOverview 
} from '../../../core/models/FollowUpTask';
import { StudentHealthModal } from '../components/StudentHealthModal';
import { StudentRecordsViewer } from '../components/StudentRecordsViewer';
import { ContextualHelpButton } from '../../../shared/components/ContextualHelpButton';

interface EducatorDashboardScreenProps {
  onBack: () => void;
}

export const EducatorDashboardScreen: React.FC<EducatorDashboardScreenProps> = ({
  onBack,
}) => {
  const { currentProfile } = useProfileStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'analytics'>('overview');
  
  // Dashboard data
  const [chapterMetrics, setChapterMetrics] = useState<ChapterHealthMetrics | null>(null);
  const [urgentCases, setUrgentCases] = useState<FollowUpTask[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [todaysFollowUps, setTodaysFollowUps] = useState<FollowUpTask[]>([]);
  
  // Student management
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStudentRecords, setShowStudentRecords] = useState(false);
  const [studentOverviews, setStudentOverviews] = useState<Record<string, StudentHealthOverview>>({});

  useEffect(() => {
    if (currentProfile) {
      loadDashboardData();
    }
  }, [currentProfile]);

  const loadDashboardData = async () => {
    if (!currentProfile) return;

    try {
      setLoading(true);

      // Load chapter metrics
      const metrics = await followUpTaskService.getChapterHealthMetrics(currentProfile.ffa_chapter_id || 'default');
      setChapterMetrics(metrics);

      // Load educator alerts
      const educatorAlerts = await followUpTaskService.getAlertsForEducator(currentProfile.id);
      setAlerts(educatorAlerts);

      // Load all tasks to find urgent cases and today's follow-ups
      const allTasks = await followUpTaskService.getAllFollowUpTasks();
      
      // Filter urgent cases (assigned by this educator)
      const urgent = allTasks.filter(task => 
        task.assignedBy === currentProfile.id &&
        (task.priorityLevel === 'urgent' || 
         task.escalationTriggered ||
         (new Date(task.dueDate) < new Date() && task.completionStatus !== 'completed'))
      );
      setUrgentCases(urgent);

      // Filter today's follow-ups
      const today = new Date();
      const todayStr = today.toDateString();
      const todays = allTasks.filter(task =>
        task.assignedBy === currentProfile.id &&
        new Date(task.dueDate).toDateString() === todayStr &&
        ['pending', 'in_progress'].includes(task.completionStatus)
      );
      setTodaysFollowUps(todays);

      // Load student overviews for unique students
      const studentIds = [...new Set(allTasks
        .filter(task => task.assignedBy === currentProfile.id)
        .map(task => task.studentId))];
      
      const overviews: Record<string, StudentHealthOverview> = {};
      for (const studentId of studentIds) {
        try {
          const overview = await followUpTaskService.getStudentHealthOverview(studentId);
          overviews[studentId] = overview;
        } catch (error) {
          console.error(`Failed to load overview for student ${studentId}:`, error);
        }
      }
      setStudentOverviews(overviews);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleStudentPress = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowStudentModal(true);
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      if (action === 'acknowledge') {
        await followUpTaskService.acknowledgeAlert(alertId);
      } else {
        await followUpTaskService.resolveAlert(alertId, 'Resolved by educator');
      }
      await loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert');
    }
  };

  const formatDaysOverdue = (dueDate: Date): string => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days overdue` : 'Due today';
  };

  const getStudentName = (studentId: string): string => {
    // In a real app, this would come from a student database
    return `Student ${studentId.slice(-4)}`;
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'students', name: 'Students', icon: '👥' },
        { id: 'analytics', name: 'Analytics', icon: '📈' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <Text style={[styles.tabIcon, activeTab === tab.id && styles.activeTabIcon]}>
            {tab.icon}
          </Text>
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Chapter Health Metrics */}
      {chapterMetrics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Chapter Health Overview</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{chapterMetrics.activeHealthCases}</Text>
              <Text style={styles.metricLabel}>Active Cases</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#dc3545' }]}>
                {chapterMetrics.urgentAttentionNeeded}
              </Text>
              <Text style={styles.metricLabel}>Urgent</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{chapterMetrics.completedThisMonth}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {Math.round(chapterMetrics.studentEngagementRate * 100)}%
              </Text>
              <Text style={styles.metricLabel}>Engagement</Text>
            </View>
          </View>
        </View>
      )}

      {/* Urgent Attention Required */}
      {urgentCases.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🚨 Urgent Attention Required</Text>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>{urgentCases.length}</Text>
            </View>
          </View>
          {urgentCases.map((task) => (
            <View key={task.id} style={styles.urgentCase}>
              <View style={styles.urgentCaseHeader}>
                <Text style={styles.urgentCaseTitle}>{task.taskTitle}</Text>
                <Text style={styles.urgentCaseStudent}>
                  {getStudentName(task.studentId)}
                </Text>
              </View>
              <Text style={styles.urgentCaseDetails}>
                {task.escalationTriggered ? 'Escalation triggered' : formatDaysOverdue(task.dueDate)}
              </Text>
              <View style={styles.urgentCaseActions}>
                <TouchableOpacity 
                  style={styles.urgentActionButton}
                  onPress={() => handleStudentPress(task.studentId)}
                >
                  <Text style={styles.urgentActionText}>📞 Contact Student</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.urgentActionButton}>
                  <Text style={styles.urgentActionText}>👩‍⚕️ Alert Vet</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Today's Follow-ups */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          📅 Today's Follow-ups ({todaysFollowUps.length} students, {todaysFollowUps.length} cases)
        </Text>
        {todaysFollowUps.length === 0 ? (
          <Text style={styles.emptyText}>No follow-ups scheduled for today</Text>
        ) : (
          todaysFollowUps.map((task) => {
            const overview = studentOverviews[task.studentId];
            return (
              <TouchableOpacity
                key={task.id}
                style={styles.followUpItem}
                onPress={() => handleStudentPress(task.studentId)}
              >
                <View style={styles.followUpHeader}>
                  <Text style={styles.followUpStudent}>{getStudentName(task.studentId)}</Text>
                  <Text style={styles.followUpStatus}>
                    {overview?.activeTasks.length || 0} pending
                  </Text>
                </View>
                <Text style={styles.followUpTask}>{task.taskTitle}</Text>
                <Text style={styles.followUpProgress}>
                  📈 {overview?.performanceMetrics.responseRate ? 
                    `${Math.round(overview.performanceMetrics.responseRate * 100)}%` : 'N/A'} response rate
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Recent Alerts</Text>
          {alerts.slice(0, 5).map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={[
                  styles.alertPriority,
                  { color: alert.priorityLevel === 'urgent' ? '#dc3545' : '#ffc107' }
                ]}>
                  {alert.priorityLevel.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={styles.alertActionButton}
                  onPress={() => handleAlertAction(alert.id, 'acknowledge')}
                >
                  <Text style={styles.alertActionText}>✓ Acknowledge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.alertActionButton, styles.alertResolveButton]}
                  onPress={() => handleAlertAction(alert.id, 'resolve')}
                >
                  <Text style={styles.alertResolveText}>✅ Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={() => setShowStudentRecords(true)}
          >
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionText}>View Student Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Assign New Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>Generate Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <Text style={styles.quickActionIcon}>💬</Text>
            <Text style={styles.quickActionText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderStudentsTab = () => (
    <ScrollView 
      style={styles.tabContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>👥 Student Health Monitoring</Text>
          <TouchableOpacity 
            style={styles.viewRecordsButton}
            onPress={() => setShowStudentRecords(true)}
          >
            <Text style={styles.viewRecordsButtonText}>📚 View All Records</Text>
          </TouchableOpacity>
        </View>
        {Object.entries(studentOverviews).map(([studentId, overview]) => (
          <TouchableOpacity
            key={studentId}
            style={styles.studentItem}
            onPress={() => handleStudentPress(studentId)}
          >
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{getStudentName(studentId)}</Text>
              <View style={styles.studentStats}>
                <Text style={styles.studentStat}>
                  {overview.activeTasks.length} active
                </Text>
                <Text style={styles.studentStat}>
                  {overview.alertSummary.urgent > 0 && (
                    <Text style={styles.urgentCount}>⚠️ {overview.alertSummary.urgent}</Text>
                  )}
                </Text>
              </View>
            </View>
            
            <View style={styles.studentMetrics}>
              <View style={styles.studentMetric}>
                <Text style={styles.metricLabel}>Response Rate</Text>
                <Text style={styles.metricValue}>
                  {Math.round(overview.performanceMetrics.responseRate * 100)}%
                </Text>
              </View>
              <View style={styles.studentMetric}>
                <Text style={styles.metricLabel}>Update Quality</Text>
                <Text style={styles.metricValue}>
                  {Math.round(overview.performanceMetrics.averageUpdateQuality * 100)}%
                </Text>
              </View>
              <View style={styles.studentMetric}>
                <Text style={styles.metricLabel}>Completion Rate</Text>
                <Text style={styles.metricValue}>
                  {Math.round(overview.performanceMetrics.timelyCompletionRate * 100)}%
                </Text>
              </View>
            </View>

            {overview.recommendations.length > 0 && (
              <View style={styles.studentRecommendations}>
                <Text style={styles.recommendationTitle}>💡 Recommendations:</Text>
                {overview.recommendations.slice(0, 2).map((rec, index) => (
                  <Text key={index} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView 
      style={styles.tabContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {chapterMetrics && (
        <>
          {/* Trend Analysis */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Trend Analysis</Text>
            
            <View style={styles.trendSection}>
              <Text style={styles.trendTitle}>Common Health Issues</Text>
              {chapterMetrics.trendAnalysis.commonIssues.map((issue, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendLabel}>{issue.issue}</Text>
                  <View style={styles.trendBar}>
                    <View 
                      style={[
                        styles.trendFill, 
                        { width: `${(issue.count / 10) * 100}%` }
                      ]} 
                    />
                    <Text style={styles.trendValue}>{issue.count}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.trendSection}>
              <Text style={styles.trendTitle}>Resolution Time Trends</Text>
              {chapterMetrics.trendAnalysis.resolutionTrends.map((trend, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendLabel}>{trend.period}</Text>
                  <Text style={styles.trendValue}>{trend.avgDays} days avg</Text>
                </View>
              ))}
            </View>

            <View style={styles.trendSection}>
              <Text style={styles.trendTitle}>Student Engagement</Text>
              {chapterMetrics.trendAnalysis.engagementTrends.map((trend, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendLabel}>{trend.period}</Text>
                  <Text style={styles.trendValue}>{Math.round(trend.rate * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Competency Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Competency Progress</Text>
            {Object.entries(chapterMetrics.competencyProgress).map(([standard, progress]) => (
              <View key={standard} style={styles.competencyItem}>
                <Text style={styles.competencyStandard}>{standard}</Text>
                <View style={styles.competencyProgress}>
                  <View style={styles.competencyBar}>
                    <View 
                      style={[
                        styles.competencyFill, 
                        { width: `${progress * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.competencyValue}>{Math.round(progress * 100)}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Insights and Recommendations */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 Chapter Insights</Text>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📚</Text>
              <Text style={styles.insightText}>
                Most common issues: Respiratory (6) and Lameness (4) cases suggest need for 
                prevention training workshop
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📈</Text>
              <Text style={styles.insightText}>
                Excellent student engagement this month (92% average) - consider recognizing 
                top performers
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>⏱️</Text>
              <Text style={styles.insightText}>
                Average resolution time improved to 4.2 days, down from 4.5 days last week
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading educator dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Educator Health Dashboard</Text>
        <Text style={styles.subtitle}>{currentProfile?.name}</Text>
      </View>

      <ContextualHelpButton 
        screen="EducatorDashboardScreen"
        userType="educator"
        position="top-right"
      />

      {renderTabBar()}

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'students' && renderStudentsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {selectedStudentId && (
        <StudentHealthModal
          visible={showStudentModal}
          studentId={selectedStudentId}
          onClose={() => {
            setShowStudentModal(false);
            setSelectedStudentId(null);
          }}
          onUpdate={loadDashboardData}
        />
      )}

      <StudentRecordsViewer
        visible={showStudentRecords}
        onClose={() => setShowStudentRecords(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    backgroundColor: '#fff',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    padding: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  urgentBadge: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  urgentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  urgentCase: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    backgroundColor: '#fdf2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  urgentCaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  urgentCaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  urgentCaseStudent: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
  },
  urgentCaseDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  urgentCaseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  urgentActionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgentActionText: {
    fontSize: 10,
    color: '#dc3545',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  followUpItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  followUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  followUpStudent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  followUpStatus: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  followUpTask: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  followUpProgress: {
    fontSize: 12,
    color: '#28a745',
  },
  alertItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    backgroundColor: '#fffdf0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  alertPriority: {
    fontSize: 10,
    fontWeight: '700',
  },
  alertMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertActionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertActionText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  alertResolveButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  alertResolveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  studentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentStat: {
    fontSize: 12,
    color: '#666',
  },
  urgentCount: {
    color: '#dc3545',
    fontWeight: '600',
  },
  studentMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  studentMetric: {
    flex: 1,
  },
  studentRecommendations: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  trendSection: {
    marginBottom: 20,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  trendBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginHorizontal: 8,
    position: 'relative',
  },
  trendFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  competencyItem: {
    marginBottom: 12,
  },
  competencyStandard: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  competencyProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  competencyBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
  },
  competencyFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  competencyValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  viewRecordsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewRecordsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
});