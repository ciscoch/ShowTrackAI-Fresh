import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { EducatorDashboardScreen } from '../../medical/screens/EducatorDashboardScreen';
import { PendingHealthIssuesScreen } from '../../medical/screens/PendingHealthIssuesScreen';

interface EducatorDashboardProps {
  onSwitchProfile: () => void;
  onShowSettings: () => void;
  onNavigateToAnimals: () => void;
  onNavigateToJournal: () => void;
  onNavigateToFinancial: () => void;
  onNavigateToMedical: () => void;
}

type EducatorView = 'main' | 'healthDashboard' | 'studentHealth';

export const EducatorDashboard: React.FC<EducatorDashboardProps> = ({
  onSwitchProfile,
  onShowSettings,
  onNavigateToAnimals,
  onNavigateToJournal,
  onNavigateToFinancial,
  onNavigateToMedical,
}) => {
  const { currentProfile } = useProfileStore();
  const [currentView, setCurrentView] = useState<EducatorView>('main');
  const [showCertificationsModal, setShowCertificationsModal] = useState(false);

  const handleViewChange = (view: EducatorView) => {
    setCurrentView(view);
  };

  const renderCertificationsModal = () => (
    <Modal visible={showCertificationsModal} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🏆 Professional Certifications</Text>
            <TouchableOpacity onPress={() => setShowCertificationsModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.educatorInfo}>
              <Text style={styles.educatorName}>{currentProfile?.name}</Text>
              <Text style={styles.educatorRole}>
                {currentProfile?.educator_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.experience}>
                {currentProfile?.years_experience} years of teaching experience
              </Text>
            </View>

            <View style={styles.certificationsSection}>
              <Text style={styles.modalSectionTitle}>📜 Professional Certifications</Text>
              {currentProfile?.certification && currentProfile.certification.length > 0 ? (
                currentProfile.certification.map((cert, index) => (
                  <View key={index} style={styles.certificationItem}>
                    <Text style={styles.certificationBullet}>✓</Text>
                    <Text style={styles.certificationText}>{cert}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noCertifications}>No certifications listed</Text>
              )}
            </View>

            <View style={styles.achievementsSection}>
              <Text style={styles.modalSectionTitle}>🎯 Professional Development</Text>
              <View style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>📚</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.achievementTitle}>Continuing Education</Text>
                  <Text style={styles.achievementDesc}>
                    {currentProfile?.stats.achievementsEarned} professional development credits
                  </Text>
                </View>
              </View>
              
              <View style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>🏫</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.achievementTitle}>FFA Chapter Leadership</Text>
                  <Text style={styles.achievementDesc}>
                    {currentProfile?.chapter} • ID: {currentProfile?.ffa_chapter_id}
                  </Text>
                </View>
              </View>
              
              <View style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>👥</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.achievementTitle}>Student Supervision</Text>
                  <Text style={styles.achievementDesc}>
                    Currently supervising {currentProfile?.students_supervised?.length || 0} students
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMainDashboard = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{currentProfile?.name}</Text>
            <Text style={styles.userRole}>
              {currentProfile?.educator_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {currentProfile?.school}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={onSwitchProfile}>
            <Text style={styles.profileButtonText}>Switch Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Educator Role Badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeIcon}>👨‍🏫</Text>
          <View style={styles.roleBadgeContent}>
            <Text style={styles.roleBadgeTitle}>Agriculture Educator</Text>
            <Text style={styles.roleBadgeSubtitle}>
              {currentProfile?.years_experience} years experience • Professional Tier
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, styles.interactiveStatCard]}
            onPress={() => handleViewChange('studentHealth')}
          >
            <Text style={styles.statNumber}>{currentProfile?.students_supervised?.length || 0}</Text>
            <Text style={styles.statLabel}>Students Supervised</Text>
            <Text style={styles.statAction}>👥 View Students</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, styles.interactiveStatCard]}
            onPress={onNavigateToAnimals}
          >
            <Text style={styles.statNumber}>{currentProfile?.stats.animalsManaged}</Text>
            <Text style={styles.statLabel}>Animals Monitored</Text>
            <Text style={styles.statAction}>🐄 View Animals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, styles.interactiveStatCard]}
            onPress={onNavigateToJournal}
          >
            <Text style={styles.statNumber}>{Math.round((currentProfile?.stats.totalHoursLogged || 0) / 60)}h</Text>
            <Text style={styles.statLabel}>Supervision Hours</Text>
            <Text style={styles.statAction}>📝 View Journal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, styles.interactiveStatCard]}
            onPress={() => setShowCertificationsModal(true)}
          >
            <Text style={styles.statNumber}>{currentProfile?.stats.achievementsEarned}</Text>
            <Text style={styles.statLabel}>Certifications</Text>
            <Text style={styles.statAction}>🏆 View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Main Educator Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎓 Educator Dashboard</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity 
              style={[styles.featureCard, styles.primaryFeature]} 
              onPress={() => handleViewChange('healthDashboard')}
            >
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Health Monitoring</Text>
              <Text style={styles.featureDescription}>Monitor student health follow-ups and interventions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.featureCard, styles.primaryFeature]}
              onPress={() => handleViewChange('studentHealth')}
            >
              <Text style={styles.featureIcon}>📚</Text>
              <Text style={styles.featureTitle}>Student Records</Text>
              <Text style={styles.featureDescription}>Access comprehensive student progress and records</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Educational Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Educational Tools</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity style={styles.featureCard} onPress={onNavigateToJournal}>
              <Text style={styles.featureIcon}>📖</Text>
              <Text style={styles.featureTitle}>AET Journal Review</Text>
              <Text style={styles.featureDescription}>Review student journal entries and provide feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={onNavigateToFinancial}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureTitle}>Financial Oversight</Text>
              <Text style={styles.featureDescription}>Monitor student project finances and budgets</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={onNavigateToAnimals}>
              <Text style={styles.featureIcon}>🐄</Text>
              <Text style={styles.featureTitle}>Animal Registry</Text>
              <Text style={styles.featureDescription}>Oversee student animal management and records</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={onNavigateToMedical}>
              <Text style={styles.featureIcon}>🏥</Text>
              <Text style={styles.featureTitle}>Medical Records</Text>
              <Text style={styles.featureDescription}>Access comprehensive health documentation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professional Development */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Professional Development</Text>
          <View style={styles.certificationContainer}>
            {currentProfile?.certification?.map((cert, index) => (
              <View key={index} style={styles.certificationBadge}>
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Chapter Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏫 Chapter Information</Text>
          <View style={styles.chapterCard}>
            <Text style={styles.chapterName}>{currentProfile?.chapter}</Text>
            <Text style={styles.chapterDetails}>
              Chapter ID: {currentProfile?.ffa_chapter_id}
            </Text>
            <Text style={styles.chapterDetails}>
              School: {currentProfile?.school}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionText}>Create Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Generate Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📧</Text>
              <Text style={styles.quickActionText}>Send Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={onShowSettings}>
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderView = () => {
    switch (currentView) {
      case 'healthDashboard':
        return (
          <EducatorDashboardScreen 
            onBack={() => setCurrentView('main')}
          />
        );
      case 'studentHealth':
        return (
          <PendingHealthIssuesScreen 
            onBack={() => setCurrentView('main')}
          />
        );
      default:
        return renderMainDashboard();
    }
  };

  return (
    <>
      {renderView()}
      {renderCertificationsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  roleBadge: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleBadgeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  roleBadgeContent: {
    flex: 1,
  },
  roleBadgeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  roleBadgeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  interactiveStatCard: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    transform: [{ scale: 1 }],
  },
  statAction: {
    fontSize: 9,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
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
  featureGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 8,
  },
  primaryFeature: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  certificationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  certificationText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  chapterCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chapterDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    maxWidth: 400,
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
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    fontSize: 22,
    color: '#666',
    fontWeight: 'bold',
    padding: 4,
  },
  modalBody: {
    maxHeight: 500,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  educatorInfo: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  educatorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  educatorRole: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  experience: {
    fontSize: 12,
    color: '#666',
  },
  certificationsSection: {
    marginBottom: 16,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 2,
  },
  certificationBullet: {
    fontSize: 14,
    color: '#28a745',
    marginRight: 8,
    fontWeight: 'bold',
  },
  certificationText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  noCertifications: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  achievementsSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  achievementIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
});