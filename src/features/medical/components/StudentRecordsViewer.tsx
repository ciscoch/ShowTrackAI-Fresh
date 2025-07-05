import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { educatorStudentService, StudentRecord, StudentOverview } from '../../../core/services/EducatorStudentService';
import { useProfileStore } from '../../../core/stores/ProfileStore';

interface StudentRecordsViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const StudentRecordsViewer: React.FC<StudentRecordsViewerProps> = ({
  visible,
  onClose,
}) => {
  const { currentProfile, createDemoProfiles } = useProfileStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'individual'>('overview');
  const [studentOverviews, setStudentOverviews] = useState<StudentOverview[]>([]);
  const [selectedStudentRecord, setSelectedStudentRecord] = useState<StudentRecord | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && currentProfile) {
      loadData();
    }
  }, [visible, currentProfile]);

  const loadData = async () => {
    if (!currentProfile || currentProfile.type !== 'educator') return;

    try {
      setLoading(true);
      
      // Force migration to ensure demo profiles have ffa_chapter_id
      await createDemoProfiles();
      
      const overviews = await educatorStudentService.getAllStudentOverviews(currentProfile.id);
      setStudentOverviews(overviews);
    } catch (error) {
      console.error('Failed to load student data:', error);
      Alert.alert('Error', 'Failed to load student records');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStudentSelect = async (studentId: string) => {
    try {
      setLoading(true);
      const record = await educatorStudentService.getStudentRecord(studentId, currentProfile!.id);
      if (record) {
        setSelectedStudentRecord(record);
        setSelectedStudentId(studentId);
        setActiveTab('individual');
      } else {
        Alert.alert('Error', 'Unable to access student record');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load student record');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAlertColor = (type: 'urgent' | 'warnings' | 'info'): string => {
    switch (type) {
      case 'urgent': return '#dc3545';
      case 'warnings': return '#ffc107';
      default: return '#17a2b8';
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'overview', name: 'All Students', icon: '👥' },
        { id: 'individual', name: 'Student Details', icon: '📋' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id as any)}
          disabled={tab.id === 'individual' && !selectedStudentRecord}
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

  const renderStudentOverviewCard = (overview: StudentOverview) => (
    <TouchableOpacity
      key={overview.studentId}
      style={styles.studentCard}
      onPress={() => handleStudentSelect(overview.studentId)}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{overview.studentName}</Text>
          <Text style={styles.lastActive}>
            Last active: {formatDate(overview.lastActive)}
          </Text>
        </View>
        <View style={styles.alertBadges}>
          {overview.alerts.urgent > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: getAlertColor('urgent') }]}>
              <Text style={styles.alertBadgeText}>{overview.alerts.urgent}</Text>
            </View>
          )}
          {overview.alerts.warnings > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: getAlertColor('warnings') }]}>
              <Text style={styles.alertBadgeText}>{overview.alerts.warnings}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{overview.summary.animals}</Text>
          <Text style={styles.summaryLabel}>Animals</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: overview.summary.activeIssues > 0 ? '#dc3545' : '#28a745' }]}>
            {overview.summary.activeIssues}
          </Text>
          <Text style={styles.summaryLabel}>Active Issues</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: overview.summary.overdueTasks > 0 ? '#dc3545' : '#28a745' }]}>
            {overview.summary.overdueTasks}
          </Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{overview.summary.responseRate}%</Text>
          <Text style={styles.summaryLabel}>Response Rate</Text>
        </View>
      </View>

      <View style={styles.engagementBar}>
        <Text style={styles.engagementLabel}>Engagement Score</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${overview.summary.engagementScore}%`,
                backgroundColor: overview.summary.engagementScore >= 70 ? '#28a745' : 
                                overview.summary.engagementScore >= 40 ? '#ffc107' : '#dc3545'
              }
            ]} 
          />
        </View>
        <Text style={styles.engagementValue}>{overview.summary.engagementScore}%</Text>
      </View>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Records Overview</Text>
        <Text style={styles.headerSubtitle}>
          Monitoring {studentOverviews.length} students
        </Text>
      </View>

      {studentOverviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Students Assigned</Text>
          <Text style={styles.emptyMessage}>
            You don't have any students assigned for supervision yet. Check that student profiles have been created and assigned to your chapter.
          </Text>
          <TouchableOpacity 
            style={{backgroundColor: '#007AFF', padding: 10, borderRadius: 8, marginTop: 10}}
            onPress={handleRefresh}
          >
            <Text style={{color: 'white', textAlign: 'center'}}>🔄 Refresh Data</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {studentOverviews.map(renderStudentOverviewCard)}
        </View>
      )}
    </ScrollView>
  );

  const renderCompetencyProgress = (competencies: Record<string, number>) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Competency Progress</Text>
      {Object.entries(competencies).map(([competency, progress]) => (
        <View key={competency} style={styles.competencyItem}>
          <Text style={styles.competencyName}>{competency}</Text>
          <View style={styles.competencyProgress}>
            <View style={styles.competencyBar}>
              <View 
                style={[
                  styles.competencyFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.competencyValue}>{Math.round(progress)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderStudentAnimals = (record: StudentRecord) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🐄 Animals ({record.animals.length})</Text>
      {record.animals.map((animal) => (
        <View key={animal.id} style={styles.animalItem}>
          <Text style={styles.animalName}>{animal.name}</Text>
          <Text style={styles.animalDetails}>
            {animal.breed} • {animal.species} • Tag: {animal.tagNumber}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderRecentActivity = (record: StudentRecord) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📝 Recent Activity</Text>
      
      {/* Recent Journal Entries */}
      <Text style={styles.subsectionTitle}>Journal Entries</Text>
      {record.journalEntries.slice(0, 3).map((entry) => (
        <View key={entry.id} style={styles.activityItem}>
          <Text style={styles.activityDate}>{formatDate(entry.date)}</Text>
          <Text style={styles.activityTitle}>{entry.title}</Text>
          <Text style={styles.activityDetails} numberOfLines={2}>
            {entry.workDescription}
          </Text>
        </View>
      ))}

      {/* Recent Health Records */}
      <Text style={styles.subsectionTitle}>Health Records</Text>
      {record.healthRecords.slice(0, 3).map((health) => (
        <View key={health.id} style={styles.activityItem}>
          <Text style={styles.activityDate}>{formatDate(health.date)}</Text>
          <Text style={styles.activityTitle}>{health.condition}</Text>
          <Text style={styles.activityDetails}>
            {health.animalId} • {health.severity} • {health.status}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderFollowUpTasks = (record: StudentRecord) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Follow-Up Tasks</Text>
      {record.followUpTasks.map((task) => (
        <View key={task.id} style={[styles.taskItem, { borderLeftColor: task.priorityLevel === 'urgent' ? '#dc3545' : '#007AFF' }]}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{task.taskTitle}</Text>
            <Text style={[
              styles.taskStatus,
              { color: task.completionStatus === 'completed' ? '#28a745' : 
                       task.completionStatus === 'overdue' ? '#dc3545' : '#ffc107' }
            ]}>
              {task.completionStatus}
            </Text>
          </View>
          <Text style={styles.taskDescription}>{task.taskDescription}</Text>
          <Text style={styles.taskDue}>Due: {formatDate(task.dueDate)}</Text>
          {task.lastUpdate && (
            <Text style={styles.taskUpdate}>
              Last update: {formatDate(task.lastUpdate)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderIndividualTab = () => {
    if (!selectedStudentRecord) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Select a Student</Text>
          <Text style={styles.emptyMessage}>
            Choose a student from the overview to view their detailed records.
          </Text>
        </View>
      );
    }

    const { student, summary } = selectedStudentRecord;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.studentDetailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setSelectedStudentRecord(null);
              setActiveTab('overview');
            }}
          >
            <Text style={styles.backButtonText}>← Back to Overview</Text>
          </TouchableOpacity>
          <Text style={styles.studentDetailName}>{student.name}</Text>
          <Text style={styles.studentDetailInfo}>
            {student.school} • {student.grade} • {student.chapter}
          </Text>
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardValue}>{summary.totalAnimals}</Text>
            <Text style={styles.summaryCardLabel}>Total Animals</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryCardValue, { color: summary.activeHealthIssues > 0 ? '#dc3545' : '#28a745' }]}>
              {summary.activeHealthIssues}
            </Text>
            <Text style={styles.summaryCardLabel}>Active Health Issues</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardValue}>{summary.completedTasks}</Text>
            <Text style={styles.summaryCardLabel}>Completed Tasks</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardValue}>{Math.round(summary.totalHours / 60)}h</Text>
            <Text style={styles.summaryCardLabel}>Total Hours</Text>
          </View>
        </View>

        {renderStudentAnimals(selectedStudentRecord)}
        {renderFollowUpTasks(selectedStudentRecord)}
        {renderCompetencyProgress(summary.competencyProgress)}
        {renderRecentActivity(selectedStudentRecord)}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading student records...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📚 Student Records</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {renderTabBar()}

          <View style={{ flex: 1 }}>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'individual' && renderIndividualTab()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  lastActive: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  alertBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  engagementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#666',
    minWidth: 80,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  engagementValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
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
  studentDetailHeader: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  studentDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  studentDetailInfo: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '22%',
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryCardLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 16,
    marginBottom: 8,
  },
  competencyItem: {
    marginBottom: 12,
  },
  competencyName: {
    fontSize: 12,
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
    minWidth: 35,
    textAlign: 'right',
  },
  animalItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  animalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  animalDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  activityDate: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  activityDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  taskItem: {
    borderLeftWidth: 4,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
  taskStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  taskDue: {
    fontSize: 11,
    color: '#dc3545',
  },
  taskUpdate: {
    fontSize: 11,
    color: '#28a745',
    marginTop: 2,
  },
});