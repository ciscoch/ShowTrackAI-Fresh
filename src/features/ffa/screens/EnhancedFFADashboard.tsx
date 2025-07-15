// =========================================================================
// Enhanced FFA Dashboard - Modern Progressive Tracking Interface
// =========================================================================
// Comprehensive FFA dashboard integrating all enhanced services
// Features degree progress, SAE projects, competitions, and analytics
// =========================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ffaDegreeService } from '../../../core/services/FFADegreeService';
import { saeProjectService } from '../../../core/services/SAEProjectService';
import { motivationalContentService } from '../../../core/services/MotivationalContentService';
import { ffaAnalyticsService } from '../../../core/services/FFAAnalyticsService';
import { aetFFAIntegrationService } from '../../../core/services/AETFFAIntegrationService';
import { 
  FFADegreeProgress, 
  EnhancedSAEProject, 
  MotivationalContent,
  FFADegreeLevel 
} from '../../../core/models/FFADegreeTracker';
import type { AETFFAProgressSummary } from '../../../core/services/AETFFAIntegrationService';
import type { 
  SAEProjectAnalytics,
  StudentPerformanceAnalytics
} from '../../../core/services/SAEProjectService';
import type { PersonalizedContentFeed } from '../../../core/services/MotivationalContentService';
import { checkFFATablesExist, createBasicFFAData } from '../../../utils/ffaDatabaseSetup';
import { 
  initializeOfflineData, 
  getSampleDegreeProgress, 
  getSampleSAEProjects, 
  getSampleMotivationalContent, 
  setOfflineMode 
} from '../../../utils/ffaOfflineMode';
import { sentryService } from '../../../core/services/SentryService';
import { useAnalytics } from '../../../core/hooks/useAnalytics';

const { width } = Dimensions.get('window');

interface EnhancedFFADashboardProps {
  onNavigateToProgress: () => void;
  onNavigateToSAE: () => void;
  onNavigateToCompetitions: () => void;
  onNavigateToAnalytics: () => void;
  onBack: () => void;
}

export const EnhancedFFADashboard: React.FC<EnhancedFFADashboardProps> = ({
  onNavigateToProgress,
  onNavigateToSAE,
  onNavigateToCompetitions,
  onNavigateToAnalytics,
  onBack,
}) => {
  const { user } = useAuth();
  const { trackUserInteraction, trackFeatureUsage } = useAnalytics({ screenName: 'FFADashboard' });
  const [degreeProgress, setDegreeProgress] = useState<FFADegreeProgress[]>([]);
  const [saeProjects, setSaeProjects] = useState<EnhancedSAEProject[]>([]);
  const [saeAnalytics, setSaeAnalytics] = useState<SAEProjectAnalytics | null>(null);
  const [motivationalFeed, setMotivationalFeed] = useState<PersonalizedContentFeed | null>(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState<StudentPerformanceAnalytics | null>(null);
  const [aetFFAProgress, setAetFFAProgress] = useState<AETFFAProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    if (!userId) {
      console.log('🚫 No userId available for FFA dashboard');
      return;
    }
    
    console.log('📊 Loading FFA dashboard data for user:', userId);
    
    try {
      // Load data one by one with individual error handling for debugging
      console.log('🎓 Loading degree progress...');
      let degreeData = [];
      try {
        degreeData = await ffaDegreeService.getDegreeProgress(userId);
        console.log('✅ Degree progress loaded:', degreeData.length, 'records');
      } catch (error) {
        console.error('❌ Error loading degree progress:', error.message);
        degreeData = [];
      }

      console.log('🚜 Loading SAE projects...');
      let saeData = [];
      try {
        saeData = await saeProjectService.getAllProjects(userId);
        console.log('✅ SAE projects loaded:', saeData.length, 'projects');
      } catch (error) {
        console.error('❌ Error loading SAE projects:', error.message);
        saeData = [];
      }

      console.log('📈 Loading SAE analytics...');
      let analyticsData = null;
      try {
        analyticsData = await saeProjectService.getUserSAEAnalytics(userId);
        console.log('✅ SAE analytics loaded');
      } catch (error) {
        console.error('❌ Error loading SAE analytics:', error.message);
        analyticsData = {
          totalProjects: 0,
          projectsByType: { entrepreneurship: 0, placement: 0, research: 0, exploratory: 0 },
          projectsByStatus: { planning: 0, active: 0, completed: 0, suspended: 0 },
          totalHours: 0,
          totalEarnings: 0,
          averageSAEScore: 0,
          topPerformingProjects: [],
          competencyDevelopment: {},
          monthlyTrends: []
        };
      }

      console.log('💡 Loading motivational content...');
      let feedData = null;
      try {
        feedData = await motivationalContentService.getPersonalizedFeed(userId);
        console.log('✅ Motivational content loaded');
      } catch (error) {
        console.error('❌ Error loading motivational content:', error.message);
        feedData = {
          daily_tip: null,
          encouragement: null,
          reminders: [],
          competition_prep: [],
          seasonal_content: []
        };
      }

      console.log('📊 Loading performance analytics...');
      let performanceData = null;
      try {
        performanceData = await ffaAnalyticsService.getStudentPerformanceAnalytics(userId);
        console.log('✅ Performance analytics loaded');
      } catch (error) {
        console.error('❌ Error loading performance analytics (expected if tables don\'t exist):', error.message);
        performanceData = null;
        
        // If all services are failing, likely tables don't exist - provide setup guidance
        if (degreeData.length === 0 && saeData.length === 0) {
          console.log('🔧 All FFA services failed - entering offline/demo mode');
          await setOfflineMode(true);
        }
      }

      // Load AET-FFA integration progress
      console.log('🎓 Loading AET-FFA integration progress...');
      let aetFFAData = null;
      try {
        aetFFAData = await aetFFAIntegrationService.getAETFFAProgressSummary(userId);
        console.log('✅ AET-FFA progress loaded:', aetFFAData.total_aet_points, 'total points');
      } catch (error) {
        console.error('❌ Error loading AET-FFA progress:', error.message);
        aetFFAData = null;
      }

      console.log('📱 Setting dashboard state...');
      
      // If no data was loaded, use sample/demo data
      if (degreeData.length === 0 && saeData.length === 0) {
        console.log('📱 Loading demo data for offline mode');
        
        const sampleDegreeData = getSampleDegreeProgress(userId);
        const sampleSAEData = getSampleSAEProjects(userId);
        const sampleFeedData = {
          daily_tip: getSampleMotivationalContent(),
          encouragement: null,
          reminders: [],
          competition_prep: [],
          seasonal_content: []
        };
        
        setDegreeProgress(sampleDegreeData);
        setSaeProjects(sampleSAEData);
        setMotivationalFeed(sampleFeedData);
        
        // Update analytics based on sample data
        setSaeAnalytics({
          totalProjects: sampleSAEData.length,
          projectsByType: { entrepreneurship: 1, placement: 0, research: 0, exploratory: 0 },
          projectsByStatus: { planning: 0, active: 1, completed: 0, suspended: 0 },
          totalHours: sampleSAEData.reduce((sum, p) => sum + p.actual_hours, 0),
          totalEarnings: sampleSAEData.reduce((sum, p) => sum + p.actual_earnings, 0),
          averageSAEScore: sampleSAEData.reduce((sum, p) => sum + p.sae_score, 0) / sampleSAEData.length,
          topPerformingProjects: sampleSAEData,
          competencyDevelopment: {},
          monthlyTrends: []
        });
      } else {
        setDegreeProgress(degreeData);
        setSaeProjects(saeData);
        setSaeAnalytics(analyticsData);
        setMotivationalFeed(feedData);
      }
      
      setPerformanceAnalytics(performanceData);
      setAetFFAProgress(aetFFAData);
      
      console.log('✅ FFA dashboard data loading completed successfully');
    } catch (error) {
      console.error('❌ Critical error loading dashboard data:', error);
      Alert.alert('Error', `Failed to load FFA dashboard: ${error.message}`);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [userId]);

  const handleInitialLoad = useCallback(async () => {
    setLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⏰ FFA dashboard loading timeout - forcing completion');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('❌ Error during initial load:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleInitialLoad();
  }, [handleInitialLoad]);

  const getCurrentDegreeLevel = (): FFADegreeLevel => {
    const inProgress = degreeProgress.find(p => p.status === 'in_progress');
    return inProgress?.degree_level || 'discovery';
  };

  const getOverallProgress = (): number => {
    if (degreeProgress.length === 0) return 0;
    const totalProgress = degreeProgress.reduce((sum, p) => sum + p.completion_percentage, 0);
    return Math.round(totalProgress / degreeProgress.length);
  };

  const getAwardsEarned = (): number => {
    return degreeProgress.filter(p => p.status === 'awarded').length;
  };

  const renderWelcomeHeader = () => (
    <View style={styles.welcomeHeader}>
      <View style={styles.headerContent}>
        <Text style={styles.welcomeTitle}>Welcome back! 🌾</Text>
        <Text style={styles.welcomeSubtitle}>
          Your FFA Journey • {getCurrentDegreeLevel().charAt(0).toUpperCase() + getCurrentDegreeLevel().slice(1)} Level
        </Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <View style={styles.quickStatsCard}>
        <Text style={styles.statValue}>{getOverallProgress()}%</Text>
        <Text style={styles.statLabel}>Overall Progress</Text>
      </View>
      
      <View style={styles.quickStatsCard}>
        <Text style={styles.statValue}>{getAwardsEarned()}</Text>
        <Text style={styles.statLabel}>Awards Earned</Text>
      </View>
      
      <View style={styles.quickStatsCard}>
        <Text style={styles.statValue}>{saeAnalytics?.totalProjects || 0}</Text>
        <Text style={styles.statLabel}>SAE Projects</Text>
      </View>
      
      <View style={styles.quickStatsCard}>
        <Text style={styles.statValue}>{saeAnalytics?.totalHours || 0}</Text>
        <Text style={styles.statLabel}>Total Hours</Text>
      </View>
    </View>
  );

  const renderMotivationalContent = () => {
    if (!motivationalFeed?.daily_tip && !motivationalFeed?.encouragement) return null;

    return (
      <View style={styles.motivationalSection}>
        <Text style={styles.sectionTitle}>💡 Daily Motivation</Text>
        
        {motivationalFeed.daily_tip && (
          <View style={styles.motivationalCard}>
            <Text style={styles.motivationalTitle}>Today's Tip</Text>
            <Text style={styles.motivationalContent}>
              {motivationalFeed.daily_tip.content}
            </Text>
          </View>
        )}
        
        {motivationalFeed.encouragement && (
          <View style={styles.motivationalCard}>
            <Text style={styles.motivationalTitle}>Encouragement</Text>
            <Text style={styles.motivationalContent}>
              {motivationalFeed.encouragement.content}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderDegreeProgressOverview = () => {
    const currentDegree = degreeProgress.find(p => p.status === 'in_progress');
    const completedDegrees = degreeProgress.filter(p => p.status === 'awarded');

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 Degree Progress</Text>
          <TouchableOpacity onPress={() => {
            trackUserInteraction('ffa_degree_progress_link', 'tap', {
              degreeCount: degreeProgress.length,
              currentLevel: degreeProgress[0]?.degree_level,
              completionPercentage: degreeProgress[0]?.completion_percentage,
            });
            
            sentryService.trackEducationalEvent('ffa_navigation', {
              eventType: 'degree_progress_accessed',
              category: 'ffa_tracking',
              skillLevel: 'intermediate',
              completionStatus: 'in_progress',
              educationalValue: 'high',
            });
            
            onNavigateToProgress();
          }}>
            <Text style={styles.sectionLink}>View Details →</Text>
          </TouchableOpacity>
        </View>

        {currentDegree && (
          <View style={styles.currentDegreeCard}>
            <Text style={styles.currentDegreeTitle}>
              Current: {currentDegree.degree_level.charAt(0).toUpperCase() + currentDegree.degree_level.slice(1)} Degree
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${currentDegree.completion_percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(currentDegree.completion_percentage)}% Complete
              </Text>
            </View>
          </View>
        )}

        {completedDegrees.length > 0 && (
          <View style={styles.completedDegreesContainer}>
            <Text style={styles.completedDegreesTitle}>Completed Degrees</Text>
            <View style={styles.completedDegreesList}>
              {completedDegrees.map((degree, index) => (
                <View key={index} style={styles.completedDegreeItem}>
                  <Text style={styles.completedDegreeText}>
                    ✅ {degree.degree_level.charAt(0).toUpperCase() + degree.degree_level.slice(1)}
                  </Text>
                  {degree.awarded_date && (
                    <Text style={styles.completedDegreeDate}>
                      {new Date(degree.awarded_date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSAEProjectsOverview = () => {
    const activeProjects = saeProjects.filter(p => p.project_status === 'active');
    
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚜 SAE Projects</Text>
          <TouchableOpacity onPress={() => {
            trackUserInteraction('ffa_sae_projects_link', 'tap', {
              projectCount: saeProjects.length,
              activeProjects: saeProjects.filter(p => p.status === 'active').length,
              totalEarnings: saeAnalytics?.totalEarnings || 0,
            });
            
            sentryService.trackEducationalEvent('ffa_navigation', {
              eventType: 'sae_projects_accessed',
              category: 'sae_management',
              skillLevel: 'advanced',
              completionStatus: 'in_progress',
              educationalValue: 'high',
            });
            
            onNavigateToSAE();
          }}>
            <Text style={styles.sectionLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        {saeAnalytics && (
          <View style={styles.saeStatsContainer}>
            <View style={styles.saeStatItem}>
              <Text style={styles.saeStatValue}>{saeAnalytics.totalProjects}</Text>
              <Text style={styles.saeStatLabel}>Total Projects</Text>
            </View>
            <View style={styles.saeStatItem}>
              <Text style={styles.saeStatValue}>{saeAnalytics.totalHours}</Text>
              <Text style={styles.saeStatLabel}>Total Hours</Text>
            </View>
            <View style={styles.saeStatItem}>
              <Text style={styles.saeStatValue}>${saeAnalytics.totalEarnings.toFixed(0)}</Text>
              <Text style={styles.saeStatLabel}>Total Earnings</Text>
            </View>
          </View>
        )}

        {activeProjects.length > 0 ? (
          <View style={styles.activeProjectsContainer}>
            <Text style={styles.activeProjectsTitle}>Active Projects</Text>
            {activeProjects.slice(0, 2).map((project, index) => (
              <View key={index} style={styles.activeProjectItem}>
                <Text style={styles.activeProjectName}>{project.project_name}</Text>
                <Text style={styles.activeProjectType}>
                  {project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1)}
                </Text>
                <Text style={styles.activeProjectProgress}>
                  {project.actual_hours} / {project.target_hours} hours
                </Text>
              </View>
            ))}
            {activeProjects.length > 2 && (
              <Text style={styles.moreProjectsText}>
                +{activeProjects.length - 2} more projects
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.noActiveProjects}>
            <Text style={styles.noActiveProjectsText}>
              No active projects. Start your next SAE project!
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAETFFAProgress = () => {
    if (!aetFFAProgress) return null;

    const topCategories = Object.entries(aetFFAProgress.points_by_category)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎓 AET Skills & FFA Progress</Text>
          <TouchableOpacity onPress={() => Alert.alert('AET-FFA Integration', 'Detailed view coming soon!')}>
            <Text style={styles.sectionLink}>View Details →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aetFFAGrid}>
          <View style={styles.aetFFAMainStats}>
            <View style={styles.aetFFAStatItem}>
              <Text style={styles.aetFFAStatValue}>{aetFFAProgress.total_aet_points}</Text>
              <Text style={styles.aetFFAStatLabel}>Total AET Points</Text>
            </View>
            
            <View style={styles.aetFFAStatItem}>
              <Text style={styles.aetFFAStatValue}>{aetFFAProgress.career_readiness_score}%</Text>
              <Text style={styles.aetFFAStatLabel}>Career Readiness</Text>
            </View>
          </View>

          <View style={styles.aetFFASkillDistribution}>
            <Text style={styles.aetFFASubtitle}>Skill Distribution</Text>
            <View style={styles.skillLevelBars}>
              {Object.entries(aetFFAProgress.skill_distribution).map(([level, count]) => {
                // Shortened labels to prevent word breaks
                const skillLevelLabels: Record<string, string> = {
                  'beginner': 'Beginner',
                  'intermediate': 'Intermed.',
                  'advanced': 'Advanced',
                  'expert': 'Expert'
                };
                
                return (
                  <View key={level} style={styles.skillLevelBar}>
                    <Text style={styles.skillLevelLabel} numberOfLines={1}>
                      {skillLevelLabels[level] || level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                    <View style={styles.skillLevelBarContainer}>
                      <View style={[
                        styles.skillLevelBarFill,
                        { width: `${Math.min(100, (count / 10) * 100)}%` }
                      ]} />
                    </View>
                    <Text style={styles.skillLevelCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.aetFFATopCategories}>
            <Text style={styles.aetFFASubtitle}>Top Skill Categories</Text>
            {topCategories.map(([category, points]) => {
              // Better category name formatting
              const categoryLabels: Record<string, string> = {
                'Agricultural Production Systems': 'Production Systems',
                'Animal Health Management': 'Animal Health',
                'Feed and Nutrition Management': 'Feed & Nutrition',
                'Agricultural Mechanics and Technology': 'Mechanics & Tech',
                'Record Keeping and Business Management': 'Business Mgmt',
                'Marketing and Sales': 'Marketing',
                'Leadership and Personal Development': 'Leadership',
                'Risk Management': 'Risk Management'
              };
              
              return (
                <View key={category} style={styles.aetFFACategoryItem}>
                  <Text style={styles.aetFFACategoryName} numberOfLines={1}>
                    {categoryLabels[category] || category.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Text style={styles.aetFFACategoryPoints}>{Math.round(points)} pts</Text>
                </View>
              );
            })}
          </View>

          {aetFFAProgress.next_recommendations.length > 0 && (
            <View style={styles.aetFFARecommendations}>
              <Text style={styles.aetFFASubtitle}>📚 Recommendations</Text>
              <Text style={styles.aetFFARecommendationText}>
                {aetFFAProgress.next_recommendations[0]}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPerformanceInsights = () => {
    if (!performanceAnalytics) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 Performance Insights</Text>
          <TouchableOpacity onPress={onNavigateToAnalytics}>
            <Text style={styles.sectionLink}>View Details →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>
              {Math.round(performanceAnalytics.overall_progress_score)}%
            </Text>
            <Text style={styles.performanceLabel}>Overall Score</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>
              {Math.round(performanceAnalytics.learning_velocity)}%
            </Text>
            <Text style={styles.performanceLabel}>Learning Velocity</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>
              {Math.round(performanceAnalytics.engagement_consistency)}%
            </Text>
            <Text style={styles.performanceLabel}>Engagement</Text>
          </View>
        </View>

        {performanceAnalytics.strengths.length > 0 && (
          <View style={styles.strengthsContainer}>
            <Text style={styles.strengthsTitle}>💪 Your Strengths</Text>
            {performanceAnalytics.strengths.slice(0, 2).map((strength, index) => (
              <Text key={index} style={styles.strengthItem}>
                • {strength}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionButton} onPress={() => {
          trackUserInteraction('quick_action_degree_progress', 'tap', {
            section: 'quick_actions',
            degreeCount: degreeProgress.length,
          });
          onNavigateToProgress();
        }}>
          <Text style={styles.quickActionIcon}>🎯</Text>
          <Text style={styles.quickActionText}>Degree Progress</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionButton} onPress={() => {
          trackUserInteraction('quick_action_sae_projects', 'tap', {
            section: 'quick_actions',
            projectCount: saeProjects.length,
          });
          onNavigateToSAE();
        }}>
          <Text style={styles.quickActionIcon}>🚜</Text>
          <Text style={styles.quickActionText}>SAE Projects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionButton} onPress={() => {
          trackUserInteraction('quick_action_competitions', 'tap', {
            section: 'quick_actions',
          });
          onNavigateToCompetitions();
        }}>
          <Text style={styles.quickActionIcon}>🏆</Text>
          <Text style={styles.quickActionText}>Competitions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionButton} onPress={() => {
          trackUserInteraction('quick_action_analytics', 'tap', {
            section: 'quick_actions',
            hasPerformanceData: !!performanceAnalytics,
          });
          onNavigateToAnalytics();
        }}>
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>Analytics</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      {renderWelcomeHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderQuickStats()}
        {renderMotivationalContent()}
        {renderDegreeProgressOverview()}
        {renderSAEProjectsOverview()}
        {renderAETFFAProgress()}
        {renderPerformanceInsights()}
        {renderQuickActions()}
      </ScrollView>
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
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20, // Safe area padding for status bar
    paddingBottom: 16,
    backgroundColor: '#1e3a8a',
  },
  headerContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  quickStatsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  motivationalSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  motivationalCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  motivationalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  motivationalContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  currentDegreeCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  currentDegreeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  completedDegreesContainer: {
    marginTop: 8,
  },
  completedDegreesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  completedDegreesList: {
    gap: 4,
  },
  completedDegreeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  completedDegreeText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  completedDegreeDate: {
    fontSize: 12,
    color: '#666',
  },
  saeStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  saeStatItem: {
    alignItems: 'center',
  },
  saeStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  saeStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeProjectsContainer: {
    marginTop: 8,
  },
  activeProjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  activeProjectItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeProjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activeProjectType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  activeProjectProgress: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  moreProjectsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noActiveProjects: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noActiveProjectsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  strengthsContainer: {
    marginTop: 8,
  },
  strengthsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  strengthItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionButton: {
    width: (width - 48) / 2,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // AET-FFA Integration Styles
  aetFFAGrid: {
    gap: 16,
  },
  aetFFAMainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  aetFFAStatItem: {
    alignItems: 'center',
  },
  aetFFAStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  aetFFAStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  aetFFASkillDistribution: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  aetFFASubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  skillLevelBars: {
    gap: 10,
  },
  skillLevelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillLevelLabel: {
    fontSize: 12,
    color: '#666',
    width: 85,
    fontWeight: '500',
  },
  skillLevelBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  skillLevelBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    minWidth: 2, // Ensure minimum visibility even for 0 values
  },
  skillLevelCount: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    width: 20,
    textAlign: 'right',
  },
  aetFFATopCategories: {
    backgroundColor: '#fff9f0',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  aetFFACategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  aetFFACategoryName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    fontWeight: '500',
    marginRight: 8,
  },
  aetFFACategoryPoints: {
    fontSize: 13,
    color: '#d97706',
    fontWeight: '600',
  },
  aetFFARecommendations: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  aetFFARecommendationText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
});