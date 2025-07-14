// =========================================================================
// Competition Tracking Screen - FFA Competition Management
// =========================================================================
// Comprehensive FFA competition tracking and preparation system
// Integrates with motivational content and analytics services
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
  Modal,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { motivationalContentService } from '../../../core/services/MotivationalContentService';
import { ffaAnalyticsService } from '../../../core/services/FFAAnalyticsService';
import { ServiceFactory } from '../../../core/services/adapters/ServiceFactory';
import { 
  CompetitionTracking, 
  CompetitionType, 
  CompetitionLevel, 
  CompetitionStatus,
  MotivationalContent
} from '../../../core/models/FFADegreeTracker';

interface CompetitionTrackingScreenProps {
  onBack: () => void;
  onNavigateToPrep: (competition: CompetitionTracking) => void;
}

export const CompetitionTrackingScreen: React.FC<CompetitionTrackingScreenProps> = ({
  onBack,
  onNavigateToPrep,
}) => {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<CompetitionTracking[]>([]);
  const [motivationalContent, setMotivationalContent] = useState<MotivationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionTracking | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

  // Create Competition Form State
  const [newCompetition, setNewCompetition] = useState({
    competitionName: '',
    competitionType: 'speech' as CompetitionType,
    competitionLevel: 'chapter' as CompetitionLevel,
    competitionDate: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    preparationNotes: '',
    registrationDeadline: '',
  });

  const userId = user?.id;
  const supabaseAdapter = ServiceFactory.getSupabaseAdapter();

  useEffect(() => {
    if (userId) {
      loadCompetitions();
      loadMotivationalContent();
    }
  }, [userId]);

  const loadCompetitions = async () => {
    if (!userId) return;
    
    try {
      if (supabaseAdapter) {
        const result = await supabaseAdapter.query('ffa_competition_tracking', {
          filters: { user_id: userId },
          orderBy: { participation_date: 'desc' }
        });
        setCompetitions(result || []);
      }
    } catch (error) {
      console.error('Error loading competitions:', error);
      Alert.alert('Error', 'Failed to load competitions');
    }
  };

  const loadMotivationalContent = async () => {
    if (!userId) return;
    
    try {
      const feed = await motivationalContentService.getPersonalizedFeed(userId);
      setMotivationalContent(feed.competition_prep || []);
    } catch (error) {
      console.error('Error loading motivational content:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCompetitions(), loadMotivationalContent()]);
    setRefreshing(false);
  }, [userId]);

  const handleInitialLoad = useCallback(async () => {
    setLoading(true);
    await handleRefresh();
    setLoading(false);
  }, [handleRefresh]);

  useEffect(() => {
    handleInitialLoad();
  }, [handleInitialLoad]);

  const handleCreateCompetition = async () => {
    if (!userId) return;

    if (!newCompetition.competitionName || !newCompetition.competitionDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const competitionData: any = {
        user_id: userId,
        competition_name: newCompetition.competitionName,
        competition_type: newCompetition.competitionType,
        competition_level: newCompetition.competitionLevel,
        participation_date: new Date(newCompetition.competitionDate).toISOString().split('T')[0], // Store as date string
        skills_demonstrated: [],
        improvement_areas: [],
        parent_notified: false,
        analytics_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabaseAdapter) {
        await supabaseAdapter.create('ffa_competition_tracking', competitionData);
        await loadCompetitions();
        setShowCreateModal(false);
        resetNewCompetition();
        Alert.alert('Success', 'Competition registered successfully!');
      }
    } catch (error) {
      console.error('Error creating competition:', error);
      Alert.alert('Error', 'Failed to register competition');
    }
  };

  const handleUpdateCompetitionStatus = async (competition: CompetitionTracking, status: CompetitionStatus, placement?: number, score?: number) => {
    if (!supabaseAdapter) return;

    try {
      const updateData = {
        status,
        placement,
        score,
        updated_at: new Date(),
      };

      await supabaseAdapter.update('ffa_competition_tracking', competition.id, updateData);
      await loadCompetitions();
      
      // Track analytics
      await ffaAnalyticsService.trackEvent(
        userId!,
        'competition_result',
        'ffa_competition',
        'result_recorded',
        {
          competition_id: competition.id,
          competition_type: competition.competition_type,
          competition_level: competition.competition_level,
          placement,
          score,
        }
      );
      
      Alert.alert('Success', 'Competition result updated successfully!');
    } catch (error) {
      console.error('Error updating competition:', error);
      Alert.alert('Error', 'Failed to update competition result');
    }
  };

  const resetNewCompetition = () => {
    setNewCompetition({
      competitionName: '',
      competitionType: 'speech',
      competitionLevel: 'chapter',
      competitionDate: new Date().toISOString().split('T')[0],
      location: '',
      description: '',
      preparationNotes: '',
      registrationDeadline: '',
    });
  };

  const getFilteredCompetitions = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return competitions.filter(comp => 
          new Date(comp.participation_date) >= now && 
          ['registered', 'preparing'].includes(comp.status)
        );
      case 'completed':
        return competitions.filter(comp => 
          comp.status === 'completed' || 
          new Date(comp.participation_date) < now
        );
      default:
        return competitions;
    }
  };

  const renderMotivationalContent = () => {
    if (motivationalContent.length === 0) return null;

    return (
      <View style={styles.motivationalCard}>
        <Text style={styles.motivationalTitle}>🎯 Competition Preparation</Text>
        {motivationalContent.slice(0, 2).map((content, index) => (
          <View key={index} style={styles.motivationalItem}>
            <Text style={styles.motivationalText}>{content.content}</Text>
            <Text style={styles.motivationalCategory}>
              {content.content_category.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
        onPress={() => setActiveTab('upcoming')}
      >
        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
          Upcoming
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
        onPress={() => setActiveTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
          Completed
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
        onPress={() => setActiveTab('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
          All
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompetitionCard = (competition: CompetitionTracking) => {
    const isUpcoming = new Date(competition.participation_date) >= new Date();
    const daysUntil = Math.ceil((new Date(competition.participation_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <TouchableOpacity
        key={competition.id}
        style={styles.competitionCard}
        onPress={() => setSelectedCompetition(competition)}
      >
        <View style={styles.competitionHeader}>
          <Text style={styles.competitionName}>{competition.competition_name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(competition.status) }
          ]}>
            <Text style={styles.statusText}>
              {competition.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.competitionType}>
          {competition.competition_type.charAt(0).toUpperCase() + competition.competition_type.slice(1)} • {competition.competition_level.charAt(0).toUpperCase() + competition.competition_level.slice(1)} Level
        </Text>

        <View style={styles.competitionDetails}>
          <Text style={styles.competitionDate}>
            📅 {new Date(competition.participation_date).toLocaleDateString()}
          </Text>
          {competition.location && (
            <Text style={styles.competitionLocation}>
              📍 {competition.location}
            </Text>
          )}
        </View>

        {isUpcoming && daysUntil >= 0 && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {daysUntil === 0 ? 'Today!' : 
               daysUntil === 1 ? 'Tomorrow' : 
               `${daysUntil} days away`}
            </Text>
          </View>
        )}

        {competition.placement && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              🏆 {getOrdinalSuffix(competition.placement)} Place
            </Text>
            {competition.score && (
              <Text style={styles.scoreText}>
                Score: {competition.score}
              </Text>
            )}
          </View>
        )}

        <View style={styles.competitionActions}>
          {isUpcoming && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigateToPrep(competition)}
            >
              <Text style={styles.actionButtonText}>📚 Prepare</Text>
            </TouchableOpacity>
          )}
          
          {competition.status === 'completed' && !competition.placement && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRecordResult(competition)}
            >
              <Text style={styles.actionButtonText}>📊 Record Result</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleRecordResult = (competition: CompetitionTracking) => {
    Alert.alert(
      'Record Competition Result',
      `Record your result for ${competition.competition_name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter Result',
          onPress: () => {
            Alert.prompt(
              'Placement',
              'Enter your placement (1, 2, 3, etc.)',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save',
                  onPress: (placement) => {
                    if (placement) {
                      handleUpdateCompetitionStatus(competition, 'completed', parseInt(placement));
                    }
                  },
                },
              ],
              'plain-text',
              '',
              'numeric'
            );
          },
        },
      ]
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
          <Text style={styles.modalTitle}>Register for Competition</Text>
          
          <ScrollView style={styles.modalScroll}>
            <TextInput
              style={styles.modalInput}
              placeholder="Competition Name *"
              value={newCompetition.competitionName}
              onChangeText={(text) => setNewCompetition(prev => ({ ...prev, competitionName: text }))}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Competition Type</Text>
              <View style={styles.pickerButtons}>
                {([
                  { label: 'Speech', value: 'speech' },
                  { label: 'Board Meeting', value: 'board_meeting' },
                  { label: 'Radio/Podcast', value: 'radio_podcast' },
                  { label: 'Project Presentation', value: 'project_presentation' }
                ] as const).map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.pickerButton,
                      newCompetition.competitionType === type.value && styles.pickerButtonSelected
                    ]}
                    onPress={() => setNewCompetition(prev => ({ ...prev, competitionType: type.value }))}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      newCompetition.competitionType === type.value && styles.pickerButtonTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Competition Level</Text>
              <View style={styles.pickerButtons}>
                {(['chapter', 'regional', 'state', 'national'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.pickerButton,
                      newCompetition.competitionLevel === level && styles.pickerButtonSelected
                    ]}
                    onPress={() => setNewCompetition(prev => ({ ...prev, competitionLevel: level }))}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      newCompetition.competitionLevel === level && styles.pickerButtonTextSelected
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Competition Date *"
              value={newCompetition.competitionDate}
              onChangeText={(text) => setNewCompetition(prev => ({ ...prev, competitionDate: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Location"
              value={newCompetition.location}
              onChangeText={(text) => setNewCompetition(prev => ({ ...prev, location: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Registration Deadline"
              value={newCompetition.registrationDeadline}
              onChangeText={(text) => setNewCompetition(prev => ({ ...prev, registrationDeadline: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              value={newCompetition.description}
              onChangeText={(text) => setNewCompetition(prev => ({ ...prev, description: text }))}
              multiline={true}
              numberOfLines={3}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Preparation Notes"
              value={newCompetition.preparationNotes}
              onChangeText={(text) => setNewCompetition(prev => ({ ...prev, preparationNotes: text }))}
              multiline={true}
              numberOfLines={3}
            />
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={handleCreateCompetition}
            >
              <Text style={styles.modalSaveText}>Register</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  const getStatusColor = (status: CompetitionStatus): string => {
    switch (status) {
      case 'registered': return '#007bff';
      case 'preparing': return '#ffc107';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading your competitions...</Text>
      </View>
    );
  }

  const filteredCompetitions = getFilteredCompetitions();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Competitions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Register</Text>
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderMotivationalContent()}
        
        {filteredCompetitions.length > 0 ? (
          filteredCompetitions.map(renderCompetitionCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Competitions Found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming' 
                ? 'No upcoming competitions. Register for your next competition!'
                : 'No competitions in this category yet.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {renderCreateModal()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20, // Safe area padding for status bar
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  motivationalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  motivationalItem: {
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  motivationalCategory: {
    fontSize: 10,
    color: '#ffc107',
    fontWeight: '600',
  },
  competitionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  competitionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  competitionType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  competitionDetails: {
    marginBottom: 8,
  },
  competitionDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  competitionLocation: {
    fontSize: 14,
    color: '#666',
  },
  countdownContainer: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  competitionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  actionButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    marginVertical: 'auto',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  pickerButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  pickerButtonTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  modalCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});