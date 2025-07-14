// =========================================================================
// FFA Degree Progress Tracker - React Native Component Templates
// =========================================================================
// Mobile-first UI components for FFA degree tracking system
// Copy and customize these components for your React Native application
// =========================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// Import your interfaces
import {
  FFADegreeProgress,
  SAEProject,
  CompetitionTracking,
  MotivationalContent,
  FFADegreeLevel,
  FFAStudentDashboard,
  calculateSAEScore,
  calculateDegreeCompletionPercentage,
  getNextDegreeLevel
} from './FFA-TypeScript-Interfaces';

// =========================================================================
// THEME AND STYLING
// =========================================================================

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const theme = {
  colors: {
    primary: '#2E8B57',      // FFA Green
    secondary: '#FFD700',     // FFA Gold
    accent: '#1E90FF',        // Blue accent
    background: '#F5F5F5',    // Light gray background
    surface: '#FFFFFF',       // White surfaces
    text: '#333333',          // Dark text
    textSecondary: '#666666', // Secondary text
    success: '#28A745',       // Success green
    warning: '#FFC107',       // Warning yellow
    error: '#DC3545',         // Error red
    border: '#E0E0E0',        // Light borders
    shadow: '#000000'         // Shadow color
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40
  },
  typography: {
    h1: { fontSize: 28, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: '600' },
    h4: { fontSize: 18, fontWeight: '600' },
    body1: { fontSize: 16, fontWeight: '400' },
    body2: { fontSize: 14, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '400' }
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20
  }
};

// =========================================================================
// MAIN DASHBOARD COMPONENT
// =========================================================================

interface FFADashboardProps {
  studentData: FFAStudentDashboard;
  onRefresh: () => Promise<void>;
  onNavigate: (screen: string, params?: any) => void;
}

export const FFADashboard: React.FC<FFADashboardProps> = ({
  studentData,
  onRefresh,
  onNavigate
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const tabs = [
    { title: 'Overview', icon: 'dashboard' },
    { title: 'Degrees', icon: 'school' },
    { title: 'SAE', icon: 'agriculture' },
    { title: 'Competitions', icon: 'emoji-events' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>FFA Progress Tracker</Text>
            <Text style={styles.headerSubtitle}>
              {studentData.student_profile.first_name} {studentData.student_profile.last_name}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tabItem,
              selectedTab === index && styles.tabItemActive
            ]}
            onPress={() => setSelectedTab(index)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={20}
              color={selectedTab === index ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              selectedTab === index && styles.tabTextActive
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 0 && (
          <OverviewContent studentData={studentData} onNavigate={onNavigate} />
        )}
        {selectedTab === 1 && (
          <DegreeProgressContent 
            degreeProgress={studentData.current_degree_progress}
            onNavigate={onNavigate}
          />
        )}
        {selectedTab === 2 && (
          <SAEProjectsContent 
            projects={studentData.active_sae_projects}
            onNavigate={onNavigate}
          />
        )}
        {selectedTab === 3 && (
          <CompetitionsContent 
            competitions={studentData.recent_competitions}
            onNavigate={onNavigate}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// =========================================================================
// OVERVIEW CONTENT COMPONENT
// =========================================================================

interface OverviewContentProps {
  studentData: FFAStudentDashboard;
  onNavigate: (screen: string, params?: any) => void;
}

const OverviewContent: React.FC<OverviewContentProps> = ({ studentData, onNavigate }) => {
  const currentDegree = studentData.current_degree_progress[0];
  const nextDegree = currentDegree ? getNextDegreeLevel(currentDegree.degree_level) : null;
  const totalSAEScore = studentData.active_sae_projects.reduce(
    (sum, project) => sum + project.sae_score, 0
  );

  return (
    <View style={styles.overviewContent}>
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Current Degree"
          value={currentDegree?.degree_level.toUpperCase() || 'Not Started'}
          subtitle={`${currentDegree?.completion_percentage.toFixed(1) || 0}% Complete`}
          icon="school"
          color={theme.colors.primary}
          onPress={() => onNavigate('DegreeDetails')}
        />
        <StatCard
          title="Active SAE Projects"
          value={studentData.active_sae_projects.length.toString()}
          subtitle={`Total Score: ${totalSAEScore.toFixed(2)}`}
          icon="agriculture"
          color={theme.colors.secondary}
          onPress={() => onNavigate('SAEProjects')}
        />
        <StatCard
          title="Competitions"
          value={studentData.recent_competitions.length.toString()}
          subtitle="This Year"
          icon="emoji-events"
          color={theme.colors.accent}
          onPress={() => onNavigate('Competitions')}
        />
      </View>

      {/* Motivational Content */}
      <MotivationalContentCard
        content={studentData.motivational_content[0]}
        onEngagement={(action) => {
          // Handle engagement tracking
          console.log('Engagement action:', action);
        }}
      />

      {/* Upcoming Deadlines */}
      <DeadlinesList
        deadlines={studentData.upcoming_deadlines}
        onDeadlinePress={(deadline) => onNavigate('DeadlineDetails', { deadline })}
      />

      {/* Recent Achievements */}
      <AchievementsList
        achievements={studentData.achievements}
        onAchievementPress={(achievement) => onNavigate('AchievementDetails', { achievement })}
      />
    </View>
  );
};

// =========================================================================
// DEGREE PROGRESS TRACKER COMPONENT
// =========================================================================

interface DegreeProgressTrackerProps {
  degreeProgress: FFADegreeProgress;
  onRequirementSelect: (requirement: string) => void;
  compact?: boolean;
}

export const DegreeProgressTracker: React.FC<DegreeProgressTrackerProps> = ({
  degreeProgress,
  onRequirementSelect,
  compact = false
}) => {
  const requirements = Object.entries(degreeProgress.requirements_met);
  const completedCount = requirements.filter(([_, completed]) => completed).length;
  const totalCount = requirements.length;

  return (
    <View style={[styles.progressTracker, compact && styles.progressTrackerCompact]}>
      {/* Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>
          {degreeProgress.degree_level.toUpperCase()} DEGREE
        </Text>
        <Text style={styles.progressSubtitle}>
          {completedCount} of {totalCount} Requirements Complete
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${degreeProgress.completion_percentage}%` }
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>
          {degreeProgress.completion_percentage.toFixed(1)}%
        </Text>
      </View>

      {/* Requirements List */}
      {!compact && (
        <View style={styles.requirementsList}>
          {requirements.map(([requirement, completed]) => (
            <RequirementItem
              key={requirement}
              requirement={requirement}
              completed={completed}
              onPress={() => onRequirementSelect(requirement)}
            />
          ))}
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          degreeProgress.completion_percentage === 100 && styles.actionButtonComplete
        ]}
        onPress={() => {
          if (degreeProgress.completion_percentage === 100) {
            Alert.alert(
              'Degree Complete',
              'Congratulations! You have completed all requirements for the ' +
              degreeProgress.degree_level.toUpperCase() + ' degree.'
            );
          } else {
            onRequirementSelect('');
          }
        }}
      >
        <Text style={styles.actionButtonText}>
          {degreeProgress.completion_percentage === 100 ? 'Claim Degree' : 'View Requirements'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// =========================================================================
// SAE PROJECT CARD COMPONENT
// =========================================================================

interface SAEProjectCardProps {
  project: SAEProject;
  onProjectPress: (projectId: string) => void;
  showProgress?: boolean;
  editable?: boolean;
}

export const SAEProjectCard: React.FC<SAEProjectCardProps> = ({
  project,
  onProjectPress,
  showProgress = true,
  editable = false
}) => {
  const hoursProgress = project.target_hours > 0 ? 
    (project.actual_hours / project.target_hours) * 100 : 0;
  const earningsProgress = project.target_earnings > 0 ? 
    (project.actual_earnings / project.target_earnings) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'completed': return theme.colors.primary;
      case 'planning': return theme.colors.warning;
      case 'suspended': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => onProjectPress(project.id)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.projectHeader}>
        <View style={styles.projectTitleContainer}>
          <Text style={styles.projectTitle}>{project.project_name}</Text>
          <Text style={styles.projectType}>{project.project_type.toUpperCase()}</Text>
        </View>
        <View style={[
          styles.projectStatusBadge,
          { backgroundColor: getStatusColor(project.project_status) }
        ]}>
          <Text style={styles.projectStatusText}>
            {project.project_status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Progress Indicators */}
      {showProgress && (
        <View style={styles.projectProgress}>
          <ProgressIndicator
            label="Hours"
            current={project.actual_hours}
            target={project.target_hours}
            progress={hoursProgress}
            unit="hrs"
          />
          <ProgressIndicator
            label="Earnings"
            current={project.actual_earnings}
            target={project.target_earnings}
            progress={earningsProgress}
            unit="$"
          />
        </View>
      )}

      {/* SAE Score */}
      <View style={styles.projectScore}>
        <Text style={styles.projectScoreLabel}>SAE Score</Text>
        <Text style={styles.projectScoreValue}>{project.sae_score.toFixed(2)}</Text>
      </View>

      {/* Footer */}
      <View style={styles.projectFooter}>
        <Text style={styles.projectPathway}>{project.afnr_pathway}</Text>
        <Text style={styles.projectDate}>
          Started: {new Date(project.start_date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// =========================================================================
// MOTIVATIONAL TIP CARD COMPONENT
// =========================================================================

interface MotivationalTipCardProps {
  content: MotivationalContent;
  onEngagement: (action: string) => void;
  dismissible?: boolean;
}

export const MotivationalTipCard: React.FC<MotivationalTipCardProps> = ({
  content,
  onEngagement,
  dismissible = true
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const getIconName = (type: string) => {
    switch (type) {
      case 'tip': return 'lightbulb';
      case 'encouragement': return 'emoji-emotions';
      case 'reminder': return 'alarm';
      case 'feedback': return 'feedback';
      case 'challenge': return 'flag';
      default: return 'info';
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'tip': return theme.colors.accent;
      case 'encouragement': return theme.colors.success;
      case 'reminder': return theme.colors.warning;
      case 'feedback': return theme.colors.primary;
      case 'challenge': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <View style={[styles.motivationalCard, { borderLeftColor: getCardColor(content.content_type) }]}>
      {/* Header */}
      <View style={styles.motivationalHeader}>
        <View style={styles.motivationalTitleContainer}>
          <MaterialIcons
            name={getIconName(content.content_type) as any}
            size={20}
            color={getCardColor(content.content_type)}
          />
          <Text style={styles.motivationalTitle}>{content.content_title}</Text>
        </View>
        {dismissible && (
          <TouchableOpacity
            onPress={() => {
              setDismissed(true);
              onEngagement('dismissed');
            }}
            style={styles.dismissButton}
          >
            <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={styles.motivationalContent}>{content.content_text}</Text>

      {/* Action Buttons */}
      <View style={styles.motivationalActions}>
        <TouchableOpacity
          style={styles.motivationalActionButton}
          onPress={() => onEngagement('helpful')}
        >
          <MaterialIcons name="thumb-up" size={16} color={theme.colors.primary} />
          <Text style={styles.motivationalActionText}>Helpful</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.motivationalActionButton}
          onPress={() => onEngagement('share')}
        >
          <MaterialIcons name="share" size={16} color={theme.colors.primary} />
          <Text style={styles.motivationalActionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.motivationalActionButton}
          onPress={() => onEngagement('save')}
        >
          <MaterialIcons name="bookmark" size={16} color={theme.colors.primary} />
          <Text style={styles.motivationalActionText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================================
// COMPETITION TRACKER COMPONENT
// =========================================================================

interface CompetitionTrackerProps {
  competitions: CompetitionTracking[];
  onCompetitionPress: (competition: CompetitionTracking) => void;
  onAddCompetition: () => void;
}

export const CompetitionTracker: React.FC<CompetitionTrackerProps> = ({
  competitions,
  onCompetitionPress,
  onAddCompetition
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'level' | 'type'>('date');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const sortedCompetitions = competitions.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.participation_date).getTime() - new Date(a.participation_date).getTime();
      case 'level':
        return a.competition_level.localeCompare(b.competition_level);
      case 'type':
        return a.competition_type.localeCompare(b.competition_type);
      default:
        return 0;
    }
  });

  const filteredCompetitions = filterLevel === 'all' 
    ? sortedCompetitions 
    : sortedCompetitions.filter(comp => comp.competition_level === filterLevel);

  return (
    <View style={styles.competitionTracker}>
      {/* Header */}
      <View style={styles.competitionHeader}>
        <Text style={styles.competitionTitle}>Competitions</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddCompetition}>
          <MaterialIcons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.competitionFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'local', 'district', 'state', 'national'].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                filterLevel === level && styles.filterButtonActive
              ]}
              onPress={() => setFilterLevel(level)}
            >
              <Text style={[
                styles.filterButtonText,
                filterLevel === level && styles.filterButtonTextActive
              ]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Competition List */}
      <View style={styles.competitionList}>
        {filteredCompetitions.map(competition => (
          <CompetitionItem
            key={competition.id}
            competition={competition}
            onPress={() => onCompetitionPress(competition)}
          />
        ))}
        {filteredCompetitions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="emoji-events" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>No competitions found</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first competition to start tracking your achievements
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// =========================================================================
// SUPPORTING COMPONENTS
// =========================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <MaterialIcons name={icon as any} size={24} color={theme.colors.surface} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

interface ProgressIndicatorProps {
  label: string;
  current: number;
  target: number;
  progress: number;
  unit: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  label, current, target, progress, unit
}) => (
  <View style={styles.progressIndicator}>
    <Text style={styles.progressLabel}>{label}</Text>
    <View style={styles.progressBarSmall}>
      <View
        style={[
          styles.progressBarFillSmall,
          { width: `${Math.min(progress, 100)}%` }
        ]}
      />
    </View>
    <Text style={styles.progressText}>
      {unit === '$' ? `$${current.toFixed(2)}` : `${current} ${unit}`} / 
      {unit === '$' ? `$${target.toFixed(2)}` : `${target} ${unit}`}
    </Text>
  </View>
);

interface RequirementItemProps {
  requirement: string;
  completed: boolean;
  onPress: () => void;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ requirement, completed, onPress }) => (
  <TouchableOpacity style={styles.requirementItem} onPress={onPress}>
    <MaterialIcons
      name={completed ? 'check-circle' : 'radio-button-unchecked'}
      size={20}
      color={completed ? theme.colors.success : theme.colors.textSecondary}
    />
    <Text style={[
      styles.requirementText,
      completed && styles.requirementTextCompleted
    ]}>
      {requirement.replace(/_/g, ' ').toUpperCase()}
    </Text>
  </TouchableOpacity>
);

interface CompetitionItemProps {
  competition: CompetitionTracking;
  onPress: () => void;
}

const CompetitionItem: React.FC<CompetitionItemProps> = ({ competition, onPress }) => (
  <TouchableOpacity style={styles.competitionItem} onPress={onPress}>
    <View style={styles.competitionItemHeader}>
      <Text style={styles.competitionItemTitle}>{competition.competition_name}</Text>
      <Text style={styles.competitionItemDate}>
        {new Date(competition.participation_date).toLocaleDateString()}
      </Text>
    </View>
    <View style={styles.competitionItemDetails}>
      <Text style={styles.competitionItemType}>
        {competition.competition_type.replace(/_/g, ' ').toUpperCase()}
      </Text>
      <Text style={styles.competitionItemLevel}>
        {competition.competition_level.toUpperCase()}
      </Text>
      {competition.placement && (
        <Text style={styles.competitionItemPlacement}>
          {competition.placement}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

// =========================================================================
// ADDITIONAL CONTENT COMPONENTS
// =========================================================================

interface DegreeProgressContentProps {
  degreeProgress: FFADegreeProgress[];
  onNavigate: (screen: string, params?: any) => void;
}

const DegreeProgressContent: React.FC<DegreeProgressContentProps> = ({
  degreeProgress,
  onNavigate
}) => (
  <View style={styles.degreeContent}>
    {degreeProgress.map(degree => (
      <DegreeProgressTracker
        key={degree.id}
        degreeProgress={degree}
        onRequirementSelect={(requirement) => 
          onNavigate('RequirementDetails', { degree, requirement })
        }
      />
    ))}
  </View>
);

interface SAEProjectsContentProps {
  projects: SAEProject[];
  onNavigate: (screen: string, params?: any) => void;
}

const SAEProjectsContent: React.FC<SAEProjectsContentProps> = ({
  projects,
  onNavigate
}) => (
  <View style={styles.saeContent}>
    <TouchableOpacity
      style={styles.addProjectButton}
      onPress={() => onNavigate('CreateSAEProject')}
    >
      <MaterialIcons name="add" size={24} color={theme.colors.surface} />
      <Text style={styles.addProjectButtonText}>Add New Project</Text>
    </TouchableOpacity>
    {projects.map(project => (
      <SAEProjectCard
        key={project.id}
        project={project}
        onProjectPress={(projectId) => onNavigate('ProjectDetails', { projectId })}
      />
    ))}
  </View>
);

interface CompetitionsContentProps {
  competitions: CompetitionTracking[];
  onNavigate: (screen: string, params?: any) => void;
}

const CompetitionsContent: React.FC<CompetitionsContentProps> = ({
  competitions,
  onNavigate
}) => (
  <View style={styles.competitionsContent}>
    <CompetitionTracker
      competitions={competitions}
      onCompetitionPress={(competition) => 
        onNavigate('CompetitionDetails', { competition })
      }
      onAddCompetition={() => onNavigate('AddCompetition')}
    />
  </View>
);

// =========================================================================
// HELPER COMPONENTS
// =========================================================================

interface MotivationalContentCardProps {
  content: MotivationalContent;
  onEngagement: (action: string) => void;
}

const MotivationalContentCard: React.FC<MotivationalContentCardProps> = ({
  content,
  onEngagement
}) => {
  if (!content) return null;

  return (
    <View style={styles.motivationalSection}>
      <Text style={styles.sectionTitle}>Daily Motivation</Text>
      <MotivationalTipCard
        content={content}
        onEngagement={onEngagement}
      />
    </View>
  );
};

interface DeadlinesListProps {
  deadlines: any[];
  onDeadlinePress: (deadline: any) => void;
}

const DeadlinesList: React.FC<DeadlinesListProps> = ({ deadlines, onDeadlinePress }) => (
  <View style={styles.deadlinesSection}>
    <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
    {deadlines.slice(0, 3).map(deadline => (
      <TouchableOpacity
        key={deadline.id}
        style={styles.deadlineItem}
        onPress={() => onDeadlinePress(deadline)}
      >
        <View style={styles.deadlineContent}>
          <Text style={styles.deadlineTitle}>{deadline.title}</Text>
          <Text style={styles.deadlineDate}>
            {new Date(deadline.due_date).toLocaleDateString()}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    ))}
  </View>
);

interface AchievementsListProps {
  achievements: any[];
  onAchievementPress: (achievement: any) => void;
}

const AchievementsList: React.FC<AchievementsListProps> = ({ achievements, onAchievementPress }) => (
  <View style={styles.achievementsSection}>
    <Text style={styles.sectionTitle}>Recent Achievements</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {achievements.map(achievement => (
        <TouchableOpacity
          key={achievement.id}
          style={styles.achievementItem}
          onPress={() => onAchievementPress(achievement)}
        >
          <View style={styles.achievementBadge}>
            <MaterialIcons name="emoji-events" size={24} color={theme.colors.secondary} />
          </View>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDate}>
            {new Date(achievement.date_earned).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// =========================================================================
// STYLESHEET
// =========================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    marginBottom: theme.spacing.md
  },
  headerGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md
  },
  headerContent: {
    alignItems: 'center'
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs
  },
  headerSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.surface,
    opacity: 0.9
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  tabItem: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    opacity: 0.6
  },
  tabItemActive: {
    opacity: 1,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary
  },
  tabText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md
  },
  overviewContent: {
    paddingVertical: theme.spacing.md
  },
  statsContainer: {
    marginBottom: theme.spacing.lg
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md
  },
  statContent: {
    flex: 1
  },
  statTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  statSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary
  },
  progressTracker: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  progressTrackerCompact: {
    padding: theme.spacing.sm
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  progressTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  progressSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginRight: theme.spacing.md
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4
  },
  progressPercentage: {
    ...theme.typography.body2,
    color: theme.colors.text,
    fontWeight: '600',
    minWidth: 50
  },
  requirementsList: {
    marginBottom: theme.spacing.md
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  requirementText: {
    ...theme.typography.body2,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1
  },
  requirementTextCompleted: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through'
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center'
  },
  actionButtonComplete: {
    backgroundColor: theme.colors.success
  },
  actionButtonText: {
    ...theme.typography.body1,
    color: theme.colors.surface,
    fontWeight: '600'
  },
  projectCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md
  },
  projectTitleContainer: {
    flex: 1
  },
  projectTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  projectType: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary
  },
  projectStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm
  },
  projectStatusText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600'
  },
  projectProgress: {
    marginBottom: theme.spacing.md
  },
  progressIndicator: {
    marginBottom: theme.spacing.sm
  },
  progressLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: theme.spacing.xs
  },
  progressBarFillSmall: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.text
  },
  projectScore: {
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  projectScoreLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs
  },
  projectScoreValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: 'bold'
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm
  },
  projectPathway: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary
  },
  projectDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary
  },
  motivationalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  motivationalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  motivationalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  motivationalTitle: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
    marginLeft: theme.spacing.sm
  },
  dismissButton: {
    padding: theme.spacing.xs
  },
  motivationalContent: {
    ...theme.typography.body2,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.md
  },
  motivationalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  motivationalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md
  },
  motivationalActionText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs
  },
  competitionTracker: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  competitionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  competitionFilters: {
    marginBottom: theme.spacing.md
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.border,
    marginRight: theme.spacing.sm
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary
  },
  filterButtonText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary
  },
  filterButtonTextActive: {
    color: theme.colors.surface
  },
  competitionList: {
    flex: 1
  },
  competitionItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  competitionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs
  },
  competitionItemTitle: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1
  },
  competitionItemDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary
  },
  competitionItemDetails: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  competitionItemType: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.md
  },
  competitionItemLevel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: theme.spacing.md
  },
  competitionItemPlacement: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl
  },
  emptyStateText: {
    ...theme.typography.h4,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm
  },
  emptyStateSubtext: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center'
  },
  degreeContent: {
    paddingVertical: theme.spacing.md
  },
  saeContent: {
    paddingVertical: theme.spacing.md
  },
  competitionsContent: {
    paddingVertical: theme.spacing.md
  },
  addProjectButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md
  },
  addProjectButtonText: {
    ...theme.typography.body1,
    color: theme.colors.surface,
    marginLeft: theme.spacing.sm,
    fontWeight: '600'
  },
  motivationalSection: {
    marginBottom: theme.spacing.lg
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  deadlinesSection: {
    marginBottom: theme.spacing.lg
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  deadlineContent: {
    flex: 1
  },
  deadlineTitle: {
    ...theme.typography.body1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  deadlineDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary
  },
  achievementsSection: {
    marginBottom: theme.spacing.lg
  },
  achievementItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    width: 120,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  achievementBadge: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  achievementTitle: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs
  },
  achievementDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 10
  }
});

// =========================================================================
// EXPORT STATEMENTS
// =========================================================================

export {
  FFADashboard,
  DegreeProgressTracker,
  SAEProjectCard,
  MotivationalTipCard,
  CompetitionTracker,
  theme,
  styles
};

export default FFADashboard;

/*
USAGE NOTES:
1. Install required dependencies:
   - expo-linear-gradient
   - react-native-safe-area-context
   - @expo/vector-icons

2. Import components as needed:
   import { FFADashboard, DegreeProgressTracker } from './FFA-React-Native-Components';

3. Customize theme colors and spacing to match your app's design system

4. Connect components to your Supabase backend services

5. Add navigation handlers for screen transitions

6. Implement proper error handling and loading states

7. Add accessibility features (accessibilityLabel, accessibilityHint)

8. Consider adding haptic feedback for better user experience

9. Test on both iOS and Android devices for platform-specific styling

10. Optimize performance for large datasets using FlatList or VirtualizedList
*/