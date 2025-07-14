// =========================================================================
// SAE Project Management Screen - Enhanced Project Tracking
// =========================================================================
// Comprehensive SAE project management with business intelligence
// Integrates with SAEProjectService for advanced project analytics
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
import { saeProjectService } from '../../../core/services/SAEProjectService';
import { 
  EnhancedSAEProject, 
  SAEProjectType, 
  SAEProjectStatus,
  SAERecordType,
  formatSAEScore 
} from '../../../core/models/FFADegreeTracker';
import type { 
  SAEProjectCreateRequest, 
  SAERecordCreateRequest, 
  SAEProjectSummary,
  SAEProjectAnalytics
} from '../../../core/services/SAEProjectService';

interface SAEProjectManagementScreenProps {
  onBack: () => void;
  onNavigateToFinancial: () => void;
}

export const SAEProjectManagementScreen: React.FC<SAEProjectManagementScreenProps> = ({
  onBack,
  onNavigateToFinancial,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<EnhancedSAEProject[]>([]);
  const [analytics, setAnalytics] = useState<SAEProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<EnhancedSAEProject | null>(null);
  const [projectSummary, setProjectSummary] = useState<SAEProjectSummary | null>(null);

  // Create Project Form State
  const [newProject, setNewProject] = useState({
    projectName: '',
    projectType: 'entrepreneurship' as SAEProjectType,
    afnrPathway: '',
    targetHours: '',
    targetEarnings: '',
    description: '',
    supervisorName: '',
    supervisorEmail: '',
    supervisorPhone: '',
  });

  // Add Record Form State
  const [newRecord, setNewRecord] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    activityType: 'labor' as SAERecordType,
    description: '',
    hoursWorked: '',
    expenseAmount: '',
    incomeAmount: '',
    category: '',
    learningObjectives: '',
    competencies: '',
  });

  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      loadProjects();
      loadAnalytics();
    }
  }, [userId]);

  const loadProjects = async () => {
    if (!userId) return;
    
    try {
      const projectData = await saeProjectService.getAllProjects(userId);
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load SAE projects');
    }
  };

  const loadAnalytics = async () => {
    if (!userId) return;
    
    try {
      const analyticsData = await saeProjectService.getUserSAEAnalytics(userId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProjects(), loadAnalytics()]);
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

  const handleCreateProject = async () => {
    if (!userId) return;

    if (!newProject.projectName || !newProject.afnrPathway || !newProject.targetHours || !newProject.targetEarnings) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const request: SAEProjectCreateRequest = {
        user_id: userId,
        project_name: newProject.projectName,
        project_type: newProject.projectType,
        afnr_pathway: newProject.afnrPathway,
        start_date: new Date(),
        target_hours: parseInt(newProject.targetHours),
        target_earnings: parseFloat(newProject.targetEarnings),
        description: newProject.description,
        supervisor_info: {
          name: newProject.supervisorName,
          email: newProject.supervisorEmail,
          phone: newProject.supervisorPhone,
        },
      };

      await saeProjectService.createProject(request);
      await loadProjects();
      await loadAnalytics();
      setShowCreateModal(false);
      resetNewProject();
      Alert.alert('Success', 'SAE project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create SAE project');
    }
  };

  const handleAddRecord = async () => {
    if (!selectedProject || !userId) return;

    if (!newRecord.description || !newRecord.activityType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const request: SAERecordCreateRequest = {
        project_id: selectedProject.id,
        user_id: userId,
        record_date: new Date(newRecord.recordDate),
        activity_type: newRecord.activityType,
        description: newRecord.description,
        hours_worked: parseFloat(newRecord.hoursWorked) || 0,
        expense_amount: parseFloat(newRecord.expenseAmount) || 0,
        income_amount: parseFloat(newRecord.incomeAmount) || 0,
        category: newRecord.category,
        learning_objectives: newRecord.learningObjectives.split(',').map(s => s.trim()).filter(Boolean),
        competencies_demonstrated: newRecord.competencies.split(',').map(s => s.trim()).filter(Boolean),
      };

      await saeProjectService.addRecord(request);
      await loadProjects();
      await loadAnalytics();
      setShowRecordModal(false);
      resetNewRecord();
      Alert.alert('Success', 'Record added successfully!');
    } catch (error) {
      console.error('Error adding record:', error);
      Alert.alert('Error', 'Failed to add record');
    }
  };

  const handleViewProject = async (project: EnhancedSAEProject) => {
    try {
      const summary = await saeProjectService.getProjectSummary(project.id);
      setProjectSummary(summary);
      setSelectedProject(project);
    } catch (error) {
      console.error('Error loading project summary:', error);
      Alert.alert('Error', 'Failed to load project details');
    }
  };

  const resetNewProject = () => {
    setNewProject({
      projectName: '',
      projectType: 'entrepreneurship',
      afnrPathway: '',
      targetHours: '',
      targetEarnings: '',
      description: '',
      supervisorName: '',
      supervisorEmail: '',
      supervisorPhone: '',
    });
  };

  const resetNewRecord = () => {
    setNewRecord({
      recordDate: new Date().toISOString().split('T')[0],
      activityType: 'labor',
      description: '',
      hoursWorked: '',
      expenseAmount: '',
      incomeAmount: '',
      category: '',
      learningObjectives: '',
      competencies: '',
    });
  };

  const renderAnalyticsCard = () => {
    if (!analytics) return null;

    return (
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>📊 SAE Analytics</Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>{analytics.totalProjects}</Text>
            <Text style={styles.analyticsLabel}>Total Projects</Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>{analytics.totalHours}</Text>
            <Text style={styles.analyticsLabel}>Total Hours</Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>${analytics.totalEarnings.toFixed(0)}</Text>
            <Text style={styles.analyticsLabel}>Total Earnings</Text>
          </View>
          
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>{analytics.averageSAEScore.toFixed(0)}</Text>
            <Text style={styles.analyticsLabel}>Avg SAE Score</Text>
          </View>
        </View>

        <View style={styles.projectTypesContainer}>
          <Text style={styles.projectTypesTitle}>Project Types</Text>
          <View style={styles.projectTypesList}>
            {Object.entries(analytics.projectsByType).map(([type, count]) => (
              <View key={type} style={styles.projectTypeItem}>
                <Text style={styles.projectTypeLabel}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <Text style={styles.projectTypeCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderProjectCard = (project: EnhancedSAEProject) => {
    return (
      <TouchableOpacity
        key={project.id}
        style={styles.projectCard}
        onPress={() => handleViewProject(project)}
      >
        <View style={styles.projectHeader}>
          <Text style={styles.projectName}>{project.project_name}</Text>
          <View style={[
            styles.projectStatusBadge,
            { backgroundColor: getStatusColor(project.project_status) }
          ]}>
            <Text style={styles.projectStatusText}>
              {project.project_status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.projectType}>
          {project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1)} • {project.afnr_pathway}
        </Text>

        <View style={styles.projectMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{project.actual_hours}</Text>
            <Text style={styles.metricLabel}>Hours</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>${project.actual_earnings.toFixed(0)}</Text>
            <Text style={styles.metricLabel}>Earnings</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatSAEScore(project.sae_score)}</Text>
            <Text style={styles.metricLabel}>SAE Score</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progress: {project.target_hours > 0 ? Math.round((project.actual_hours / project.target_hours) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${project.target_hours > 0 ? Math.min((project.actual_hours / project.target_hours) * 100, 100) : 0}%` }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateProjectModal = () => (
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
          <Text style={styles.modalTitle}>Create New SAE Project</Text>
          
          <ScrollView style={styles.modalScroll}>
            <TextInput
              style={styles.modalInput}
              placeholder="Project Name *"
              value={newProject.projectName}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, projectName: text }))}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Project Type *</Text>
              <View style={styles.pickerButtons}>
                {(['entrepreneurship', 'placement', 'research', 'exploratory'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pickerButton,
                      newProject.projectType === type && styles.pickerButtonSelected
                    ]}
                    onPress={() => setNewProject(prev => ({ ...prev, projectType: type }))}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      newProject.projectType === type && styles.pickerButtonTextSelected
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="AFNR Pathway *"
              value={newProject.afnrPathway}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, afnrPathway: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Target Hours *"
              value={newProject.targetHours}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, targetHours: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Target Earnings *"
              value={newProject.targetEarnings}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, targetEarnings: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              value={newProject.description}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, description: text }))}
              multiline={true}
              numberOfLines={3}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Supervisor Name"
              value={newProject.supervisorName}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, supervisorName: text }))}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Supervisor Email"
              value={newProject.supervisorEmail}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, supervisorEmail: text }))}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Supervisor Phone"
              value={newProject.supervisorPhone}
              onChangeText={(text) => setNewProject(prev => ({ ...prev, supervisorPhone: text }))}
              keyboardType="phone-pad"
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
              onPress={handleCreateProject}
            >
              <Text style={styles.modalSaveText}>Create Project</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderProjectSummaryModal = () => (
    <Modal
      visible={!!projectSummary}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setProjectSummary(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {projectSummary?.project.project_name}
          </Text>
          
          <ScrollView style={styles.modalScroll}>
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Project Overview</Text>
              <Text style={styles.summaryText}>
                Type: {projectSummary?.project.project_type}
              </Text>
              <Text style={styles.summaryText}>
                AFNR Pathway: {projectSummary?.project.afnr_pathway}
              </Text>
              <Text style={styles.summaryText}>
                Status: {projectSummary?.project.project_status}
              </Text>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Progress</Text>
              <Text style={styles.summaryText}>
                Hours: {projectSummary?.project.actual_hours} / {projectSummary?.project.target_hours}
              </Text>
              <Text style={styles.summaryText}>
                Earnings: ${projectSummary?.project.actual_earnings} / ${projectSummary?.project.target_earnings}
              </Text>
              <Text style={styles.summaryText}>
                SAE Score: {formatSAEScore(projectSummary?.project.sae_score || 0)}
              </Text>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Business Intelligence</Text>
              <Text style={styles.summaryText}>
                Cost per Hour: ${projectSummary?.insights.costPerHour.toFixed(2)}
              </Text>
              <Text style={styles.summaryText}>
                Profit Margin: {projectSummary?.insights.profitMargin.toFixed(1)}%
              </Text>
              <Text style={styles.summaryText}>
                Efficiency: {projectSummary?.insights.efficiency.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Learning Outcomes</Text>
              {projectSummary?.insights.learningOutcomes.map((outcome, index) => (
                <Text key={index} style={styles.summaryText}>
                  • {outcome}
                </Text>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setProjectSummary(null)}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={() => {
                setProjectSummary(null);
                setShowRecordModal(true);
              }}
            >
              <Text style={styles.modalSaveText}>Add Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getStatusColor = (status: SAEProjectStatus): string => {
    switch (status) {
      case 'planning': return '#6c757d';
      case 'active': return '#28a745';
      case 'completed': return '#007bff';
      case 'suspended': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading your SAE projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SAE Projects</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderAnalyticsCard()}
        
        {projects.length > 0 ? (
          projects.map(renderProjectCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No SAE Projects Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first Supervised Agricultural Experience project to start tracking your progress
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyCreateButtonText}>🚜 Create Your First SAE Project</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderCreateProjectModal()}
      {renderProjectSummaryModal()}
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
  analyticsCard: {
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
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  projectTypesContainer: {
    marginTop: 16,
  },
  projectTypesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  projectTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  projectTypeItem: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectTypeLabel: {
    fontSize: 12,
    color: '#333',
    marginRight: 6,
  },
  projectTypeCount: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  projectStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  projectType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  projectMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
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
    marginBottom: 24,
  },
  emptyCreateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCreateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    maxHeight: 300,
    flexGrow: 0,
    marginBottom: 16,
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
  summarySection: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});