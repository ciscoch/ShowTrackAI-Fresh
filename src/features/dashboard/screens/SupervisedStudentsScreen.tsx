import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { educatorStudentService, StudentOverview } from '../../../core/services/EducatorStudentService';

interface SupervisedStudentsScreenProps {
  onBack: () => void;
  onStudentSelect: (studentId: string) => void;
}

export const SupervisedStudentsScreen: React.FC<SupervisedStudentsScreenProps> = ({
  onBack,
  onStudentSelect,
}) => {
  const { currentProfile } = useProfileStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentOverviews, setStudentOverviews] = useState<StudentOverview[]>([]);

  useEffect(() => {
    loadStudents();
  }, [currentProfile]);

  const loadStudents = async () => {
    if (!currentProfile || currentProfile.type !== 'educator') return;

    try {
      setLoading(true);
      const overviews = await educatorStudentService.getAllStudentOverviews(currentProfile.id);
      setStudentOverviews(overviews);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const getEngagementColor = (score: number): string => {
    if (score >= 70) return '#28a745';
    if (score >= 40) return '#ffc107';
    return '#dc3545';
  };

  const renderStudentCard = (student: StudentOverview) => (
    <TouchableOpacity
      key={student.studentId}
      style={styles.studentCard}
      onPress={() => onStudentSelect(student.studentId)}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.studentName}</Text>
          <Text style={styles.lastActive}>
            Last active: {formatDate(student.lastActive)}
          </Text>
        </View>
        <View style={styles.alertBadges}>
          {student.alerts.urgent > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: '#dc3545' }]}>
              <Text style={styles.alertBadgeText}>{student.alerts.urgent}</Text>
            </View>
          )}
          {student.alerts.warnings > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: '#ffc107' }]}>
              <Text style={styles.alertBadgeText}>{student.alerts.warnings}</Text>
            </View>
          )}
          {student.alerts.info > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: '#17a2b8' }]}>
              <Text style={styles.alertBadgeText}>{student.alerts.info}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{student.summary.animals}</Text>
          <Text style={styles.statLabel}>Animals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: student.summary.activeIssues > 0 ? '#dc3545' : '#28a745' }]}>
            {student.summary.activeIssues}
          </Text>
          <Text style={styles.statLabel}>Active Issues</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: student.summary.overdueTasks > 0 ? '#dc3545' : '#28a745' }]}>
            {student.summary.overdueTasks}
          </Text>
          <Text style={styles.statLabel}>Overdue Tasks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{student.summary.responseRate}%</Text>
          <Text style={styles.statLabel}>Response Rate</Text>
        </View>
      </View>

      <View style={styles.engagementSection}>
        <Text style={styles.engagementLabel}>Engagement Score</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${student.summary.engagementScore}%`,
                backgroundColor: getEngagementColor(student.summary.engagementScore)
              }
            ]} 
          />
        </View>
        <Text style={[styles.engagementValue, { color: getEngagementColor(student.summary.engagementScore) }]}>
          {student.summary.engagementScore}%
        </Text>
      </View>

      <View style={styles.viewDetailsSection}>
        <Text style={styles.viewDetailsText}>Tap to view detailed records →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Supervised Students</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supervised Students</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>👥 Student Overview</Text>
          <Text style={styles.summarySubtitle}>
            You are currently supervising {studentOverviews.length} students
          </Text>
          <Text style={styles.summaryNote}>
            💡 Tap any student card to view their detailed records and progress
          </Text>
        </View>

        {studentOverviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Students Assigned</Text>
            <Text style={styles.emptyMessage}>
              You don't have any students assigned for supervision yet. Contact your administrator to assign students to your supervision.
            </Text>
          </View>
        ) : (
          <View style={styles.studentsContainer}>
            {studentOverviews.map(renderStudentCard)}
          </View>
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
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
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
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryNote: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  studentsContainer: {
    gap: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 12,
    color: '#666',
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  engagementSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  viewDetailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});