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
import { FollowUpTask, HealthAlert } from '../../../core/models/FollowUpTask';
import { FollowUpTaskModal } from '../components/FollowUpTaskModal';

interface PendingHealthIssuesScreenProps {
  onBack: () => void;
}

export const PendingHealthIssuesScreen: React.FC<PendingHealthIssuesScreenProps> = ({
  onBack,
}) => {
  const { currentProfile } = useProfileStore();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  const loadData = async () => {
    if (!currentProfile) return;

    try {
      setLoading(true);
      const [activeTasks, studentAlerts] = await Promise.all([
        followUpTaskService.getActiveTasksForStudent(currentProfile.id),
        followUpTaskService.getAlertsForStudent(currentProfile.id)
      ]);

      setTasks(activeTasks);
      setAlerts(studentAlerts);
    } catch (error) {
      console.error('Failed to load pending health issues:', error);
      Alert.alert('Error', 'Failed to load health issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTaskPress = (task: FollowUpTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = async () => {
    setShowTaskModal(false);
    setSelectedTask(null);
    await loadData();
  };

  const getTasksByPriority = () => {
    const urgent = tasks.filter(t => t.priorityLevel === 'urgent' || isOverdue(t));
    const scheduled = tasks.filter(t => t.priorityLevel !== 'urgent' && !isOverdue(t) && isScheduledSoon(t));
    const monitoring = tasks.filter(t => !urgent.includes(t) && !scheduled.includes(t));

    return { urgent, scheduled, monitoring };
  };

  const isOverdue = (task: FollowUpTask): boolean => {
    return new Date(task.dueDate) < new Date() && task.completionStatus !== 'completed';
  };

  const isScheduledSoon = (task: FollowUpTask): boolean => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 48; // Next 48 hours
  };

  const formatDueDate = (dueDate: Date): string => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      const daysOverdue = Math.ceil(Math.abs(diffHours) / 24);
      return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    } else if (diffHours < 24) {
      return diffHours < 1 ? 'Due now' : `Due in ${diffHours}h`;
    } else {
      const days = Math.ceil(diffHours / 24);
      return `Due in ${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getPriorityColor = (task: FollowUpTask): string => {
    if (isOverdue(task)) return '#dc3545';
    switch (task.priorityLevel) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      default: return '#28a745';
    }
  };

  const getPriorityIcon = (task: FollowUpTask): string => {
    if (isOverdue(task)) return '🚨';
    switch (task.priorityLevel) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  };

  const renderTaskCard = (task: FollowUpTask, showProgress: boolean = false) => (
    <TouchableOpacity
      key={task.id}
      style={[styles.taskCard, { borderLeftColor: getPriorityColor(task) }]}
      onPress={() => handleTaskPress(task)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <Text style={styles.taskIcon}>{getPriorityIcon(task)}</Text>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.taskTitle}
          </Text>
        </View>
        <Text style={[styles.dueDate, { color: getPriorityColor(task) }]}>
          {formatDueDate(task.dueDate)}
        </Text>
      </View>
      
      <Text style={styles.taskDescription} numberOfLines={2}>
        {task.taskDescription}
      </Text>
      
      {task.lastUpdate && (
        <Text style={styles.lastUpdate}>
          Last updated: {new Date(task.lastUpdate).toLocaleDateString()} at{' '}
          {new Date(task.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
      
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${task.progressPercentage}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(task.progressPercentage)}% complete
          </Text>
        </View>
      )}
      
      <View style={styles.taskActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📝 Add Update</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📸 Take Photos</Text>
        </TouchableOpacity>
        {task.progressPercentage >= 80 && (
          <TouchableOpacity style={[styles.actionButton, styles.resolveButton]}>
            <Text style={styles.resolveButtonText}>✅ Mark Resolved</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, taskList: FollowUpTask[], icon: string, showProgress: boolean = false) => {
    if (taskList.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{taskList.length}</Text>
          </View>
        </View>
        {taskList.map(task => renderTaskCard(task, showProgress))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.quickActionButton}>
        <Text style={styles.quickActionIcon}>📱</Text>
        <Text style={styles.quickActionText}>Quick Health Check</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton}>
        <Text style={styles.quickActionIcon}>📞</Text>
        <Text style={styles.quickActionText}>Contact Veterinarian</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton}>
        <Text style={styles.quickActionIcon}>📚</Text>
        <Text style={styles.quickActionText}>Learning Resources</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton}>
        <Text style={styles.quickActionIcon}>🎯</Text>
        <Text style={styles.quickActionText}>Competency Progress</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading health issues...</Text>
      </View>
    );
  }

  const { urgent, scheduled, monitoring } = getTasksByPriority();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Pending Health Issues</Text>
        <Text style={styles.subtitle}>{currentProfile?.name}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>No Pending Health Issues</Text>
            <Text style={styles.emptyMessage}>
              Great job! You're all caught up with your animal health monitoring.
            </Text>
          </View>
        ) : (
          <>
            {renderSection('🚨 URGENT FOLLOW-UP REQUIRED', urgent, '🚨')}
            {renderSection('📅 SCHEDULED FOLLOW-UPS', scheduled, '📅')}
            {renderSection('🔍 MONITORING CASES', monitoring, '🔍', true)}
          </>
        )}

        {renderQuickActions()}
      </ScrollView>

      {selectedTask && (
        <FollowUpTaskModal
          visible={showTaskModal}
          task={selectedTask}
          onClose={() => setShowTaskModal(false)}
          onUpdate={handleTaskUpdate}
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  taskIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  taskActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  resolveButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
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
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});