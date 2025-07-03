import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { FFAStudentProfile } from '../../../core/models/FFAProfiles';
import { ffaProfileService, DegreeProgress, SAEAnalytics } from '../../../core/services/FFAProfileService';

interface FFADashboardScreenProps {
  studentProfile: FFAStudentProfile;
  onCreateSAEProject: () => void;
  onViewProfile: () => void;
  onViewCompetitions: () => void;
  onApplyForDegree: (degree: string) => void;
}

export const FFADashboardScreen: React.FC<FFADashboardScreenProps> = ({
  studentProfile,
  onCreateSAEProject,
  onViewProfile,
  onViewCompetitions,
  onApplyForDegree,
}) => {
  const [degreeProgress, setDegreeProgress] = useState<DegreeProgress[]>([]);
  const [saeAnalytics, setSaeAnalytics] = useState<SAEAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [studentProfile.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [progress, analytics] = await Promise.all([
        ffaProfileService.analyzeDegreeProgress(studentProfile.id),
        ffaProfileService.calculateSAEAnalytics(studentProfile.id),
      ]);
      setDegreeProgress(progress);
      setSaeAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDegreeApplication = async (degree: string) => {
    Alert.alert(
      `Apply for ${degree} Degree`,
      'Are you ready to submit your application? Make sure all requirements are completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Application',
          onPress: async () => {
            try {
              const result = await ffaProfileService.processDegreeApplication(
                studentProfile.id,
                degree as any
              );
              
              Alert.alert(
                result.approved ? 'Application Approved!' : 'Application Incomplete',
                result.feedback,
                [{ text: 'OK' }]
              );
              
              if (result.approved) {
                loadDashboardData(); // Refresh data
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to process application');
            }
          },
        },
      ]
    );
  };

  const renderWelcomeCard = () => (
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeText}>
        Welcome back, {studentProfile.firstName}! 🌾
      </Text>
      <Text style={styles.chapterInfo}>
        {studentProfile.schoolName} • Chapter {studentProfile.chapterNumber}
      </Text>
      <Text style={styles.graduationInfo}>
        Class of {studentProfile.graduationYear} • {studentProfile.membershipType} Member
      </Text>
    </View>
  );

  const renderDegreeProgress = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>🏆 FFA Degree Progress</Text>
      {degreeProgress.map((degree) => (
        <View key={degree.degree} style={styles.degreeItem}>
          <View style={styles.degreeHeader}>
            <Text style={styles.degreeName}>
              {degree.degree.charAt(0).toUpperCase() + degree.degree.slice(1)} Degree
            </Text>
            <Text style={[
              styles.degreeProgress,
              { color: degree.progress === 100 ? '#28a745' : '#007AFF' }
            ]}>
              {degree.progress.toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${degree.progress}%` }
              ]} 
            />
          </View>
          
          {degree.canApply && (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => handleDegreeApplication(degree.degree)}
            >
              <Text style={styles.applyButtonText}>🎓 Apply Now</Text>
            </TouchableOpacity>
          )}
          
          {degree.missingRequirements.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Missing Requirements:</Text>
              {degree.missingRequirements.slice(0, 2).map((req, index) => (
                <Text key={index} style={styles.requirementItem}>• {req}</Text>
              ))}
              {degree.missingRequirements.length > 2 && (
                <Text style={styles.requirementItem}>
                  • and {degree.missingRequirements.length - 2} more...
                </Text>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderSAEProjects = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🚜 SAE Projects</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreateSAEProject}
        >
          <Text style={styles.createButtonText}>+ New Project</Text>
        </TouchableOpacity>
      </View>

      {saeAnalytics && (
        <View style={styles.saeStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{saeAnalytics.totalProjects}</Text>
            <Text style={styles.statLabel}>Total Projects</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{saeAnalytics.activeProjects}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${saeAnalytics.totalInvestment.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Investment</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${saeAnalytics.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>
      )}

      {studentProfile.saeProjects.length > 0 ? (
        <View style={styles.projectsList}>
          {studentProfile.saeProjects.slice(0, 3).map((project, index) => (
            <View key={index} style={styles.projectItem}>
              <View style={styles.projectHeader}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <View style={[
                  styles.projectStatus,
                  { backgroundColor: project.isActive ? '#28a745' : '#6c757d' }
                ]}>
                  <Text style={styles.projectStatusText}>
                    {project.isActive ? 'Active' : 'Completed'}
                  </Text>
                </View>
              </View>
              <Text style={styles.projectCategory}>{project.category}</Text>
              <Text style={styles.projectType}>{project.type}</Text>
              {project.financialSummary && (
                <Text style={styles.projectFinancial}>
                  Investment: ${project.financialSummary.totalInvestment} • 
                  Revenue: ${project.financialSummary.totalRevenue}
                </Text>
              )}
            </View>
          ))}
          {studentProfile.saeProjects.length > 3 && (
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>
                View all {studentProfile.saeProjects.length} projects
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No SAE Projects Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start your first Supervised Agricultural Experience project to begin earning toward your FFA degrees
          </Text>
        </View>
      )}
    </View>
  );

  const renderAchievements = () => {
    const earnedDegrees = Object.entries(studentProfile.degrees)
      .filter(([_, degree]) => degree.earned)
      .map(([name, degree]) => ({ name, date: degree.dateEarned }));

    const recentCompetitions = studentProfile.competitions
      .sort((a, b) => b.year - a.year)
      .slice(0, 3);

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🏅 Recent Achievements</Text>
        
        {earnedDegrees.length > 0 && (
          <View style={styles.achievementSection}>
            <Text style={styles.achievementSubtitle}>FFA Degrees Earned:</Text>
            {earnedDegrees.map((degree, index) => (
              <View key={index} style={styles.achievementItem}>
                <Text style={styles.achievementText}>
                  🎓 {degree.name.charAt(0).toUpperCase() + degree.name.slice(1)} Degree
                </Text>
                {degree.date && (
                  <Text style={styles.achievementDate}>
                    {new Date(degree.date).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {recentCompetitions.length > 0 && (
          <View style={styles.achievementSection}>
            <Text style={styles.achievementSubtitle}>Competition Results:</Text>
            {recentCompetitions.map((competition, index) => (
              <View key={index} style={styles.achievementItem}>
                <Text style={styles.achievementText}>
                  🏆 {competition.event} - {competition.level}
                </Text>
                <Text style={styles.achievementDate}>
                  {competition.placement ? `${competition.placement}${getOrdinalSuffix(competition.placement)} Place` : competition.award} • {competition.year}
                </Text>
              </View>
            ))}
          </View>
        )}

        {earnedDegrees.length === 0 && recentCompetitions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Achievements Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete SAE projects and participate in competitions to earn achievements
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const renderQuickActions = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onViewProfile}>
          <Text style={styles.actionButtonIcon}>👤</Text>
          <Text style={styles.actionButtonText}>View Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onViewCompetitions}>
          <Text style={styles.actionButtonIcon}>🏆</Text>
          <Text style={styles.actionButtonText}>Competitions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Feature Coming Soon', 'Officer elections feature is in development')}>
          <Text style={styles.actionButtonIcon}>🗳️</Text>
          <Text style={styles.actionButtonText}>Officer Elections</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Feature Coming Soon', 'Scholarship search feature is in development')}>
          <Text style={styles.actionButtonIcon}>💰</Text>
          <Text style={styles.actionButtonText}>Scholarships</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading your FFA dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderWelcomeCard()}
        {renderDegreeProgress()}
        {renderSAEProjects()}
        {renderAchievements()}
        {renderQuickActions()}
      </ScrollView>
    </View>
  );
};

const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
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
  content: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  welcomeCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  chapterInfo: {
    fontSize: 14,
    color: '#bfdbfe',
    marginBottom: 2,
  },
  graduationInfo: {
    fontSize: 12,
    color: '#93c5fd',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  degreeItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  degreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  degreeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  degreeProgress: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  applyButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  requirementItem: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 2,
  },
  saeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  projectsList: {
    marginTop: 8,
  },
  projectItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  projectStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  projectStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  projectCategory: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  projectType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  projectFinancial: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '500',
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
  },
  viewAllText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  achievementSection: {
    marginBottom: 12,
  },
  achievementSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  achievementText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  achievementDate: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});