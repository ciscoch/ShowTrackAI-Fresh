import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { veterinarianService } from '../../../core/services/VeterinarianService';
import { VeterinarianProfile, ActiveCase, VetNotification, WorkflowTask, PerformanceAlert } from '../../../core/models/VeterinarianProfile';

interface VeterinarianDashboardProps {
  veterinarianId: string;
  onNavigateToProfile: () => void;
  onNavigateToSchedule: () => void;
  onNavigateToCase: (caseId: string) => void;
  onLogout: () => void;
}

export const VeterinarianDashboard: React.FC<VeterinarianDashboardProps> = ({
  veterinarianId,
  onNavigateToProfile,
  onNavigateToSchedule,
  onNavigateToCase,
  onLogout,
}) => {
  const [veterinarian, setVeterinarian] = useState<VeterinarianProfile | null>(null);
  const [activeCases, setActiveCases] = useState<ActiveCase[]>([]);
  const [notifications, setNotifications] = useState<VetNotification[]>([]);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [veterinarianId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load veterinarian profile
      const profile = await veterinarianService.getVeterinarianProfile(veterinarianId);
      if (profile) {
        setVeterinarian(profile);
      }

      // Load workflow state
      const workflow = await veterinarianService.getVeterinarianWorkflow(veterinarianId);
      setActiveCases(workflow.currentCases);
      setNotifications(workflow.notifications.filter(n => !n.readAt).slice(0, 5));
      setTasks(workflow.tasksToComplete.filter(t => t.status !== 'completed').slice(0, 5));
      setPerformanceAlerts(workflow.performanceAlerts.filter(a => !a.resolvedAt));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseAction = (caseId: string, action: 'start' | 'view' | 'complete') => {
    switch (action) {
      case 'start':
        veterinarianService.updateCaseStatus(veterinarianId, caseId, 'in_progress');
        break;
      case 'view':
        onNavigateToCase(caseId);
        break;
      case 'complete':
        veterinarianService.updateCaseStatus(veterinarianId, caseId, 'completed');
        loadDashboardData(); // Refresh data
        break;
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await veterinarianService.completeWorkflowTask(veterinarianId, taskId);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to complete task:', error);
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return '#FF3B30';
      case 'urgent': return '#FF9500';
      case 'routine': return '#34C759';
      default: return '#007AFF';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#8E8E93';
      default: return '#007AFF';
    }
  };

  const renderCaseItem = ({ item }: { item: ActiveCase }) => (
    <View style={styles.caseItem}>
      <View style={styles.caseHeader}>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgencyLevel) }]}>
          <Text style={styles.urgencyText}>{item.urgencyLevel.toUpperCase()}</Text>
        </View>
        <Text style={styles.caseType}>{item.consultationType}</Text>
      </View>
      
      <Text style={styles.caseTitle}>Case #{item.caseId.slice(-6)}</Text>
      <Text style={styles.caseDetails}>Student Level: {item.studentLevel}</Text>
      <Text style={styles.caseDetails}>Duration: {item.estimatedDuration} min</Text>
      <Text style={styles.caseDetails}>Scheduled: {item.scheduledTime.toLocaleString()}</Text>
      
      {item.educationalObjectives.length > 0 && (
        <Text style={styles.caseDetails}>
          Objectives: {item.educationalObjectives.slice(0, 2).join(', ')}
          {item.educationalObjectives.length > 2 && '...'}
        </Text>
      )}

      <View style={styles.caseActions}>
        {item.status === 'scheduled' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => handleCaseAction(item.caseId, 'start')}
          >
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleCaseAction(item.caseId, 'view')}
        >
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        {item.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleCaseAction(item.caseId, 'complete')}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderNotification = ({ item }: { item: VetNotification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
        <Text style={styles.notificationTime}>
          {item.createdAt.toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      {item.actionRequired && (
        <TouchableOpacity style={styles.notificationAction}>
          <Text style={styles.notificationActionText}>Take Action</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTask = ({ item }: { item: WorkflowTask }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
        <Text style={styles.taskTime}>{item.estimatedTime} min</Text>
      </View>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskDue}>Due: {item.dueDate.toLocaleString()}</Text>
      
      <TouchableOpacity
        style={styles.completeTaskButton}
        onPress={() => handleTaskComplete(item.id)}
      >
        <Text style={styles.completeTaskText}>Mark Complete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPerformanceAlert = ({ item }: { item: PerformanceAlert }) => (
    <View style={[styles.alertItem, { borderLeftColor: item.severity === 'critical' ? '#FF3B30' : '#FF9500' }]}>
      <Text style={styles.alertTitle}>{item.message}</Text>
      <Text style={styles.alertMetric}>
        {item.metric}: {item.currentValue} (expected: {item.expectedValue})
      </Text>
      <Text style={styles.alertActions}>
        Actions: {item.actionItems.slice(0, 2).join(', ')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.veterinarianName}>
            Dr. {veterinarian?.personalInfo.firstName} {veterinarian?.personalInfo.lastName}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={onNavigateToProfile}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Performance Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{activeCases.length}</Text>
              <Text style={styles.summaryLabel}>Active Cases</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{notifications.length}</Text>
              <Text style={styles.summaryLabel}>Notifications</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{tasks.length}</Text>
              <Text style={styles.summaryLabel}>Pending Tasks</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {veterinarian?.performance.clientSatisfaction.overallRating.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.summaryLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Performance Alerts */}
        {performanceAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Alerts</Text>
            <FlatList
              data={performanceAlerts}
              renderItem={renderPerformanceAlert}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Active Cases */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Cases</Text>
            <TouchableOpacity onPress={onNavigateToSchedule}>
              <Text style={styles.seeAllText}>View Schedule</Text>
            </TouchableOpacity>
          </View>
          {activeCases.length > 0 ? (
            <FlatList
              data={activeCases}
              renderItem={renderCaseItem}
              keyExtractor={(item) => item.caseId}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No active cases</Text>
          )}
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.length > 0 ? (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No new notifications</Text>
          )}
        </View>

        {/* Pending Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Tasks</Text>
          {tasks.length > 0 ? (
            <FlatList
              data={tasks}
              renderItem={renderTask}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No pending tasks</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={onNavigateToSchedule}>
              <Text style={styles.quickActionText}>View Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={onNavigateToProfile}>
              <Text style={styles.quickActionText}>Update Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => loadDashboardData()}>
              <Text style={styles.quickActionText}>Refresh Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  veterinarianName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  caseItem: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  caseType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  caseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  caseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  priorityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  notificationAction: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  notificationActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTime: {
    fontSize: 12,
    color: '#666',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  taskDue: {
    fontSize: 12,
    color: '#FF9500',
    marginBottom: 8,
  },
  completeTaskButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  completeTaskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  alertItem: {
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  alertMetric: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 4,
  },
  alertActions: {
    fontSize: 12,
    color: '#856404',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  quickActionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomActions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});