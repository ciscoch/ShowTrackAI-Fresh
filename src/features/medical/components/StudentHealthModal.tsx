import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { followUpTaskService } from '../../../core/services/FollowUpTaskService';
import { 
  StudentHealthOverview, 
  FollowUpTask, 
  FollowUpUpdate 
} from '../../../core/models/FollowUpTask';

interface StudentHealthModalProps {
  visible: boolean;
  studentId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const StudentHealthModal: React.FC<StudentHealthModalProps> = ({
  visible,
  studentId,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StudentHealthOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'progress' | 'intervention'>('overview');
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [taskUpdates, setTaskUpdates] = useState<FollowUpUpdate[]>([]);
  
  // Intervention form
  const [interventionType, setInterventionType] = useState<'reminder' | 'guidance' | 'direct_contact' | 'escalation'>('reminder');
  const [interventionNotes, setInterventionNotes] = useState('');
  const [submittingIntervention, setSubmittingIntervention] = useState(false);

  useEffect(() => {
    if (visible && studentId) {
      loadStudentData();
    }
  }, [visible, studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const studentOverview = await followUpTaskService.getStudentHealthOverview(studentId);
      setOverview(studentOverview);
    } catch (error) {
      console.error('Failed to load student data:', error);
      Alert.alert('Error', 'Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSelect = async (task: FollowUpTask) => {
    setSelectedTask(task);
    try {
      const updates = await followUpTaskService.getUpdatesForTask(task.id);
      setTaskUpdates(updates);
    } catch (error) {
      console.error('Failed to load task updates:', error);
    }
  };

  const handleSendMessage = async () => {
    // In a real app, this would send a message through the app's messaging system
    Alert.alert('Message Sent', 'Your message has been sent to the student.');
  };

  const handleScheduleCall = async () => {
    // In a real app, this would integrate with calendar/scheduling system
    Alert.alert('Call Scheduled', 'Video call has been scheduled with the student.');
  };

  const handleSubmitIntervention = async () => {
    if (!interventionNotes.trim()) {
      Alert.alert('Error', 'Please provide intervention notes');
      return;
    }

    try {
      setSubmittingIntervention(true);
      
      // In a real app, this would save the intervention record
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Intervention recorded successfully');
      setInterventionNotes('');
      setActiveTab('overview');
      onUpdate();
    } catch (error) {
      Alert.alert('Error', 'Failed to record intervention');
    } finally {
      setSubmittingIntervention(false);
    }
  };

  const getStudentName = (studentId: string): string => {
    // In a real app, this would come from a student database
    return `Student ${studentId.slice(-4)}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString() + ' at ' + 
           new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPerformanceColor = (value: number): string => {
    if (value >= 0.8) return '#28a745';
    if (value >= 0.6) return '#ffc107';
    return '#dc3545';
  };

  const getStarRating = (value: number): string => {
    const stars = Math.round(value * 5);
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'tasks', name: 'Tasks', icon: '📋' },
        { id: 'progress', name: 'Progress', icon: '📈' },
        { id: 'intervention', name: 'Intervention', icon: '🎯' }
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

  const renderOverviewTab = () => {
    if (!overview) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Current Status Overview</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{overview.activeTasks.length}</Text>
              <Text style={styles.statusLabel}>Active Cases</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{overview.recentCompleted.length}</Text>
              <Text style={styles.statusLabel}>Completed This Month</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{overview.currentIssues.length}</Text>
              <Text style={styles.statusLabel}>Current Issues</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[
                styles.statusValue, 
                { color: getPerformanceColor(overview.performanceMetrics.responseRate) }
              ]}>
                {Math.round(overview.performanceMetrics.responseRate * 100)}%
              </Text>
              <Text style={styles.statusLabel}>Response Rate</Text>
            </View>
          </View>
        </View>

        {/* Priority Cases */}
        {overview.activeTasks.filter(t => t.priorityLevel === 'urgent' || t.escalationTriggered).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔴 Priority Cases Requiring Attention</Text>
            {overview.activeTasks
              .filter(t => t.priorityLevel === 'urgent' || t.escalationTriggered)
              .map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.priorityCase}
                  onPress={() => handleTaskSelect(task)}
                >
                  <View style={styles.priorityCaseHeader}>
                    <Text style={styles.priorityCaseTitle}>{task.taskTitle}</Text>
                    <Text style={styles.priorityCaseStatus}>
                      {task.escalationTriggered ? 'ESCALATED' : 'HIGH PRIORITY'}
                    </Text>
                  </View>
                  <Text style={styles.priorityCaseDetails}>
                    Last update: {task.lastUpdate ? 
                      formatDate(task.lastUpdate) : 'No updates yet'}
                  </Text>
                  <Text style={styles.priorityCaseAction}>
                    Action needed: {new Date(task.dueDate) < new Date() ? 
                      'Overdue update' : 'Regular monitoring'}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Learning Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Learning Progress Indicators</Text>
          <View style={styles.progressIndicators}>
            <View style={styles.progressIndicator}>
              <Text style={styles.progressLabel}>Documentation Quality</Text>
              <Text style={styles.progressStars}>
                {getStarRating(overview.performanceMetrics.averageUpdateQuality)}
              </Text>
              <Text style={styles.progressDescription}>
                {overview.performanceMetrics.averageUpdateQuality >= 0.8 ? 'Excellent' :
                 overview.performanceMetrics.averageUpdateQuality >= 0.6 ? 'Very Good' :
                 overview.performanceMetrics.averageUpdateQuality >= 0.4 ? 'Developing' : 'Needs Improvement'}
              </Text>
            </View>
            
            <View style={styles.progressIndicator}>
              <Text style={styles.progressLabel}>Follow-up Consistency</Text>
              <Text style={styles.progressStars}>
                {getStarRating(overview.performanceMetrics.timelyCompletionRate)}
              </Text>
              <Text style={styles.progressDescription}>
                {overview.performanceMetrics.timelyCompletionRate >= 0.8 ? 'Very Good' :
                 overview.performanceMetrics.timelyCompletionRate >= 0.6 ? 'Good' :
                 overview.performanceMetrics.timelyCompletionRate >= 0.4 ? 'Developing' : 'Needs Support'}
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Deadlines */}
        {overview.upcomingDeadlines.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🗓️ Upcoming Deadlines & Reminders</Text>
            {overview.upcomingDeadlines.map((deadline, index) => (
              <View key={index} style={styles.deadlineItem}>
                <View style={styles.deadlineHeader}>
                  <Text style={styles.deadlineDate}>
                    {new Date(deadline.dueDate).toLocaleDateString()}
                  </Text>
                  <Text style={[
                    styles.deadlinePriority,
                    { color: deadline.priority === 'urgent' ? '#dc3545' : '#ffc107' }
                  ]}>
                    {deadline.priority.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.deadlineTitle}>{deadline.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {overview.recommendations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Intervention Opportunities</Text>
            {overview.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationIcon}>💡</Text>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderTasksTab = () => {
    if (!overview) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Active Tasks ({overview.activeTasks.length})</Text>
          {overview.activeTasks.length === 0 ? (
            <Text style={styles.emptyText}>No active tasks</Text>
          ) : (
            overview.activeTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  selectedTask?.id === task.id && styles.selectedTaskItem
                ]}
                onPress={() => handleTaskSelect(task)}
              >
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.taskTitle}</Text>
                  <Text style={[
                    styles.taskPriority,
                    { color: task.priorityLevel === 'urgent' ? '#dc3545' : '#ffc107' }
                  ]}>
                    {task.priorityLevel.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.taskDescription}>{task.taskDescription}</Text>
                <View style={styles.taskProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${task.progressPercentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{task.progressPercentage}%</Text>
                </View>
                <Text style={styles.taskDue}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {selectedTask && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Task Updates</Text>
            {taskUpdates.length === 0 ? (
              <Text style={styles.emptyText}>No updates yet</Text>
            ) : (
              taskUpdates.map((update) => (
                <View key={update.id} style={styles.updateItem}>
                  <View style={styles.updateHeader}>
                    <Text style={styles.updateDate}>
                      {formatDate(update.updateDate)}
                    </Text>
                    <View style={[
                      styles.updateStatus,
                      { backgroundColor: update.conditionAssessment === 'improved' ? '#28a745' :
                                          update.conditionAssessment === 'worse' ? '#dc3545' : '#ffc107' }
                    ]}>
                      <Text style={styles.updateStatusText}>
                        {update.conditionAssessment}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.updateObservations}>{update.observations}</Text>
                  {update.actionTaken && (
                    <Text style={styles.updateAction}>Action: {update.actionTaken}</Text>
                  )}
                  {update.measurements.temperature && (
                    <Text style={styles.updateMeasurement}>
                      Temperature: {update.measurements.temperature.value}°{update.measurements.temperature.unit}
                    </Text>
                  )}
                  <View style={styles.updateMetrics}>
                    <Text style={styles.updateMetric}>
                      Quality: {Math.round(update.updateCompletenessScore * 100)}%
                    </Text>
                    <Text style={styles.updateMetric}>
                      Concern: {update.concernLevel}/5
                    </Text>
                    <Text style={styles.updateMetric}>
                      Confidence: {update.confidenceLevel}/5
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderProgressTab = () => {
    if (!overview) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Performance Metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Response Rate</Text>
              <Text style={[
                styles.metricValue,
                { color: getPerformanceColor(overview.performanceMetrics.responseRate) }
              ]}>
                {Math.round(overview.performanceMetrics.responseRate * 100)}%
              </Text>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricFill,
                    { 
                      width: `${overview.performanceMetrics.responseRate * 100}%`,
                      backgroundColor: getPerformanceColor(overview.performanceMetrics.responseRate)
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Update Quality</Text>
              <Text style={[
                styles.metricValue,
                { color: getPerformanceColor(overview.performanceMetrics.averageUpdateQuality) }
              ]}>
                {Math.round(overview.performanceMetrics.averageUpdateQuality * 100)}%
              </Text>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricFill,
                    { 
                      width: `${overview.performanceMetrics.averageUpdateQuality * 100}%`,
                      backgroundColor: getPerformanceColor(overview.performanceMetrics.averageUpdateQuality)
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Completion Rate</Text>
              <Text style={[
                styles.metricValue,
                { color: getPerformanceColor(overview.performanceMetrics.timelyCompletionRate) }
              ]}>
                {Math.round(overview.performanceMetrics.timelyCompletionRate * 100)}%
              </Text>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricFill,
                    { 
                      width: `${overview.performanceMetrics.timelyCompletionRate * 100}%`,
                      backgroundColor: getPerformanceColor(overview.performanceMetrics.timelyCompletionRate)
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Competency Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Competency Progress</Text>
          {Object.entries(overview.performanceMetrics.competencyProgress).map(([standard, progress]) => (
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

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Recent Activity</Text>
          {overview.recentCompleted.length === 0 ? (
            <Text style={styles.emptyText}>No recent completed tasks</Text>
          ) : (
            overview.recentCompleted.slice(0, 5).map((task) => (
              <View key={task.id} style={styles.activityItem}>
                <Text style={styles.activityTitle}>{task.taskTitle}</Text>
                <Text style={styles.activityDate}>
                  Completed: {task.completedDate ? 
                    new Date(task.completedDate).toLocaleDateString() : 'N/A'}
                </Text>
                <Text style={styles.activityOutcome}>
                  Outcome: {task.outcomeStatus || 'Not specified'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  const renderInterventionTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Student Intervention</Text>
        
        {/* Quick Actions */}
        <View style={styles.interventionActions}>
          <TouchableOpacity 
            style={styles.interventionButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.interventionButtonText}>💬 Send Message</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.interventionButton}
            onPress={handleScheduleCall}
          >
            <Text style={styles.interventionButtonText}>📞 Schedule Call</Text>
          </TouchableOpacity>
        </View>

        {/* Intervention Type */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Intervention Type</Text>
          <View style={styles.interventionTypes}>
            {(['reminder', 'guidance', 'direct_contact', 'escalation'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.interventionTypeButton,
                  interventionType === type && styles.interventionTypeButtonActive
                ]}
                onPress={() => setInterventionType(type)}
              >
                <Text style={[
                  styles.interventionTypeText,
                  interventionType === type && styles.interventionTypeTextActive
                ]}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intervention Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Intervention Notes *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe the intervention action taken, student response, and any follow-up needed..."
            multiline
            numberOfLines={4}
            value={interventionNotes}
            onChangeText={setInterventionNotes}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submittingIntervention && styles.submitButtonDisabled]}
          onPress={handleSubmitIntervention}
          disabled={submittingIntervention}
        >
          {submittingIntervention ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>📝 Record Intervention</Text>
          )}
        </TouchableOpacity>

        {/* Suggested Actions */}
        <View style={styles.suggestedActions}>
          <Text style={styles.suggestedTitle}>💡 Suggested Actions</Text>
          {overview?.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionIcon}>•</Text>
              <Text style={styles.suggestionText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, styles.centerContent]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading student information...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            👨‍🎓 {getStudentName(studentId)}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {renderTabBar()}

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'tasks' && renderTasksTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'intervention' && renderInterventionTab()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 24,
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
    fontSize: 14,
    marginBottom: 2,
  },
  activeTabIcon: {
    fontSize: 14,
  },
  tabText: {
    fontSize: 10,
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    padding: 8,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  priorityCase: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    backgroundColor: '#fdf2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  priorityCaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  priorityCaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priorityCaseStatus: {
    fontSize: 10,
    color: '#dc3545',
    fontWeight: '700',
  },
  priorityCaseDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  priorityCaseAction: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
  },
  progressIndicators: {
    gap: 16,
  },
  progressIndicator: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  progressStars: {
    fontSize: 16,
    marginBottom: 4,
  },
  progressDescription: {
    fontSize: 12,
    color: '#666',
  },
  deadlineItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  deadlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deadlineDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deadlinePriority: {
    fontSize: 10,
    fontWeight: '700',
  },
  deadlineTitle: {
    fontSize: 14,
    color: '#333',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  taskItem: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedTaskItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  taskPriority: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    minWidth: 30,
  },
  taskDue: {
    fontSize: 10,
    color: '#666',
  },
  updateItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  updateStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  updateStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  updateObservations: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  updateAction: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  updateMeasurement: {
    fontSize: 11,
    color: '#007AFF',
    marginBottom: 4,
  },
  updateMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  updateMetric: {
    fontSize: 10,
    color: '#666',
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
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
  activityItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  activityOutcome: {
    fontSize: 10,
    color: '#28a745',
  },
  interventionActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  interventionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  interventionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  interventionTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interventionTypeButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  interventionTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  interventionTypeText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  interventionTypeTextActive: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestedActions: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  suggestionIcon: {
    fontSize: 12,
    color: '#1976d2',
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: 12,
    color: '#1976d2',
    lineHeight: 16,
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});