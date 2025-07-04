import { storageService, STORAGE_KEYS } from './StorageService';
import { 
  FollowUpTask, 
  FollowUpUpdate, 
  HealthAlert, 
  EducatorMonitoring,
  StudentHealthOverview,
  ChapterHealthMetrics,
  HealthPhoto,
  HealthMeasurements
} from '../models/FollowUpTask';
import { HealthRecord } from '../models/HealthRecord';
import { Animal } from '../models/Animal';

export class FollowUpTaskService {
  private readonly FOLLOW_UP_TASKS_KEY = STORAGE_KEYS.FOLLOW_UP_TASKS;
  private readonly FOLLOW_UP_UPDATES_KEY = STORAGE_KEYS.FOLLOW_UP_UPDATES;
  private readonly HEALTH_ALERTS_KEY = STORAGE_KEYS.HEALTH_ALERTS;
  private readonly EDUCATOR_MONITORING_KEY = STORAGE_KEYS.EDUCATOR_MONITORING;

  // Task Management
  async createFollowUpTask(taskData: Omit<FollowUpTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<FollowUpTask> {
    const task: FollowUpTask = {
      ...taskData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      progressPercentage: 0,
      escalationTriggered: false,
      completionStatus: 'pending'
    };

    const tasks = await this.getAllFollowUpTasks();
    tasks.push(task);
    await storageService.saveData(this.FOLLOW_UP_TASKS_KEY, tasks);

    // Create initial alert for assignment
    await this.createAlert({
      alertType: 'completion_reminder',
      priorityLevel: task.priorityLevel,
      studentId: task.studentId,
      followUpTaskId: task.id,
      title: `New Follow-up Task: ${task.taskTitle}`,
      message: `You have been assigned a new health follow-up task for ${await this.getAnimalName(task.animalId)}.`,
      alertData: { taskId: task.id, dueDate: task.dueDate },
      createdDate: new Date(),
      actionTaken: false,
      emailSent: false,
      pushNotificationSent: false,
      dashboardNotification: true,
      createdAt: new Date()
    });

    return task;
  }

  async updateFollowUpTask(taskId: string, updates: Partial<FollowUpTask>): Promise<FollowUpTask | null> {
    const tasks = await this.getAllFollowUpTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return null;

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };

    await storageService.saveData(this.FOLLOW_UP_TASKS_KEY, tasks);
    return tasks[taskIndex];
  }

  async getFollowUpTask(taskId: string): Promise<FollowUpTask | null> {
    const tasks = await this.getAllFollowUpTasks();
    return tasks.find(t => t.id === taskId) || null;
  }

  async getAllFollowUpTasks(): Promise<FollowUpTask[]> {
    const tasks = await storageService.loadData<FollowUpTask[]>(this.FOLLOW_UP_TASKS_KEY);
    return tasks || [];
  }

  async getActiveTasksForStudent(studentId: string): Promise<FollowUpTask[]> {
    const tasks = await this.getAllFollowUpTasks();
    return tasks.filter(t => 
      t.studentId === studentId && 
      ['pending', 'in_progress'].includes(t.completionStatus)
    );
  }

  async getTasksForAnimal(animalId: string): Promise<FollowUpTask[]> {
    const tasks = await this.getAllFollowUpTasks();
    return tasks.filter(t => t.animalId === animalId);
  }

  // Task Updates Management
  async addTaskUpdate(updateData: Omit<FollowUpUpdate, 'id' | 'createdAt'>): Promise<FollowUpUpdate> {
    const update: FollowUpUpdate = {
      ...updateData,
      id: this.generateId(),
      createdAt: new Date(),
      reviewStatus: 'pending',
      competencyDemonstrated: false
    };

    const updates = await this.getAllTaskUpdates();
    updates.push(update);
    await storageService.saveData(this.FOLLOW_UP_UPDATES_KEY, updates);

    // Update task progress
    await this.updateTaskProgress(updateData.followUpTaskId);

    // Check for escalation triggers
    await this.checkEscalationTriggers(updateData.followUpTaskId, update);

    // Notify educator of update
    await this.notifyEducatorOfUpdate(updateData.followUpTaskId, update);

    return update;
  }

  async getAllTaskUpdates(): Promise<FollowUpUpdate[]> {
    const updates = await storageService.loadData<FollowUpUpdate[]>(this.FOLLOW_UP_UPDATES_KEY);
    return updates || [];
  }

  async getUpdatesForTask(taskId: string): Promise<FollowUpUpdate[]> {
    const updates = await this.getAllTaskUpdates();
    return updates.filter(u => u.followUpTaskId === taskId)
                  .sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
  }

  async getLatestUpdateForTask(taskId: string): Promise<FollowUpUpdate | null> {
    const updates = await this.getUpdatesForTask(taskId);
    return updates.length > 0 ? updates[0] : null;
  }

  // Progress Tracking
  private async updateTaskProgress(taskId: string): Promise<void> {
    const task = await this.getFollowUpTask(taskId);
    if (!task) return;

    const updates = await this.getUpdatesForTask(taskId);
    const totalExpectedUpdates = this.calculateExpectedUpdates(task);
    const progress = Math.min((updates.length / totalExpectedUpdates) * 100, 100);

    // Update task progress
    await this.updateFollowUpTask(taskId, {
      progressPercentage: progress,
      lastUpdate: new Date(),
      completionStatus: progress >= 100 ? 'completed' : 'in_progress'
    });
  }

  private calculateExpectedUpdates(task: FollowUpTask): number {
    switch (task.frequency) {
      case 'daily':
        return task.durationDays;
      case 'twice_daily':
        return task.durationDays * 2;
      case 'weekly':
        return Math.ceil(task.durationDays / 7);
      default:
        return 1;
    }
  }

  // Escalation Management
  private async checkEscalationTriggers(taskId: string, update: FollowUpUpdate): Promise<void> {
    const task = await this.getFollowUpTask(taskId);
    if (!task) return;

    let shouldEscalate = false;
    let escalationReason = '';

    // Check concern level
    if (update.concernLevel >= 4) {
      shouldEscalate = true;
      escalationReason = 'High concern level reported';
    }

    // Check condition deterioration
    if (update.conditionAssessment === 'worse') {
      shouldEscalate = true;
      escalationReason = 'Condition deteriorating';
    }

    // Check for emergency keywords in observations
    const emergencyKeywords = ['emergency', 'severe', 'critical', 'urgent', 'distress'];
    if (emergencyKeywords.some(keyword => 
      update.observations.toLowerCase().includes(keyword) ||
      update.studentNotes.toLowerCase().includes(keyword)
    )) {
      shouldEscalate = true;
      escalationReason = 'Emergency keywords detected';
    }

    if (shouldEscalate && !task.escalationTriggered) {
      await this.triggerEscalation(taskId, escalationReason, update);
    }
  }

  private async triggerEscalation(taskId: string, reason: string, update: FollowUpUpdate): Promise<void> {
    const task = await this.getFollowUpTask(taskId);
    if (!task) return;

    // Mark task as escalated
    await this.updateFollowUpTask(taskId, {
      escalationTriggered: true,
      escalationDate: new Date(),
      priorityLevel: 'urgent'
    });

    // Create escalation alert
    await this.createAlert({
      alertType: 'escalation_needed',
      priorityLevel: 'urgent',
      studentId: task.studentId,
      educatorId: task.assignedBy,
      followUpTaskId: taskId,
      title: `URGENT: Escalation Required - ${task.taskTitle}`,
      message: `${reason}. Immediate attention needed for ${await this.getAnimalName(task.animalId)}.`,
      alertData: { 
        taskId, 
        reason, 
        updateId: update.id,
        concernLevel: update.concernLevel,
        conditionAssessment: update.conditionAssessment
      },
      createdDate: new Date(),
      actionTaken: false,
      emailSent: false,
      pushNotificationSent: true,
      dashboardNotification: true,
      createdAt: new Date()
    });
  }

  // Alert Management
  async createAlert(alertData: Omit<HealthAlert, 'id'>): Promise<HealthAlert> {
    const alert: HealthAlert = {
      ...alertData,
      id: this.generateId()
    };

    const alerts = await this.getAllAlerts();
    alerts.push(alert);
    await storageService.saveData(this.HEALTH_ALERTS_KEY, alerts);

    return alert;
  }

  async getAllAlerts(): Promise<HealthAlert[]> {
    const alerts = await storageService.loadData<HealthAlert[]>(this.HEALTH_ALERTS_KEY);
    return alerts || [];
  }

  async getAlertsForStudent(studentId: string): Promise<HealthAlert[]> {
    const alerts = await this.getAllAlerts();
    return alerts.filter(a => a.studentId === studentId && !a.resolvedDate)
                 .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  async getAlertsForEducator(educatorId: string): Promise<HealthAlert[]> {
    const alerts = await this.getAllAlerts();
    return alerts.filter(a => a.educatorId === educatorId && !a.resolvedDate)
                 .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alerts = await this.getAllAlerts();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex !== -1) {
      alerts[alertIndex].acknowledgedDate = new Date();
      await storageService.saveData(this.HEALTH_ALERTS_KEY, alerts);
    }
  }

  async resolveAlert(alertId: string, actionDescription: string): Promise<void> {
    const alerts = await this.getAllAlerts();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex !== -1) {
      alerts[alertIndex].actionTaken = true;
      alerts[alertIndex].actionDescription = actionDescription;
      alerts[alertIndex].resolvedDate = new Date();
      await storageService.saveData(this.HEALTH_ALERTS_KEY, alerts);
    }
  }

  // Educator Dashboard Services
  async getStudentHealthOverview(studentId: string): Promise<StudentHealthOverview> {
    const activeTasks = await this.getActiveTasksForStudent(studentId);
    const allTasks = (await this.getAllFollowUpTasks()).filter(t => t.studentId === studentId);
    const recentCompleted = allTasks.filter(t => 
      t.completionStatus === 'completed' && 
      t.completedDate && 
      new Date(t.completedDate).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    const healthRecords = await storageService.loadData<HealthRecord[]>(STORAGE_KEYS.HEALTH_RECORDS) || [];
    const currentIssues = healthRecords.filter(r => 
      r.studentId === studentId && 
      r.conditionStatus !== 'Resolved'
    );

    const performanceMetrics = await this.calculateStudentPerformanceMetrics(studentId);
    const upcomingDeadlines = await this.getUpcomingDeadlines(studentId);
    const recommendations = await this.generateStudentRecommendations(studentId);
    const alertSummary = await this.getStudentAlertSummary(studentId);

    return {
      studentId,
      activeTasks,
      recentCompleted,
      currentIssues,
      performanceMetrics,
      upcomingDeadlines,
      recommendations,
      alertSummary
    };
  }

  async getChapterHealthMetrics(chapterId: string): Promise<ChapterHealthMetrics> {
    // For now, we'll use a simplified version since we don't have chapter management yet
    const allTasks = await this.getAllFollowUpTasks();
    const allAlerts = await this.getAllAlerts();
    
    const activeHealthCases = allTasks.filter(t => ['pending', 'in_progress'].includes(t.completionStatus)).length;
    const urgentAttentionNeeded = allAlerts.filter(a => a.priorityLevel === 'urgent' && !a.resolvedDate).length;
    const overdueTasks = allTasks.filter(t => 
      t.dueDate < new Date() && 
      !['completed', 'cancelled'].includes(t.completionStatus)
    ).length;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completedThisMonth = allTasks.filter(t => 
      t.completionStatus === 'completed' && 
      t.completedDate && 
      new Date(t.completedDate) > thirtyDaysAgo
    ).length;

    return {
      chapterId,
      totalStudents: new Set(allTasks.map(t => t.studentId)).size,
      activeHealthCases,
      urgentAttentionNeeded,
      overdueTasks,
      completedThisMonth,
      averageResolutionTime: 4.2, // Placeholder
      studentEngagementRate: 0.92, // Placeholder
      competencyProgress: {
        'AS.07.01.02.a': 0.78,
        'AS.07.02.01.b': 0.85,
        'AS.07.03.01.a': 0.72
      },
      trendAnalysis: {
        commonIssues: [
          { issue: 'Respiratory', count: 6 },
          { issue: 'Lameness', count: 4 },
          { issue: 'Digestive', count: 3 }
        ],
        resolutionTrends: [
          { period: 'This Week', avgDays: 3.8 },
          { period: 'Last Week', avgDays: 4.5 },
          { period: 'Two Weeks Ago', avgDays: 4.1 }
        ],
        engagementTrends: [
          { period: 'This Week', rate: 0.94 },
          { period: 'Last Week', rate: 0.91 },
          { period: 'Two Weeks Ago', rate: 0.89 }
        ]
      }
    };
  }

  // Task Completion
  async completeTask(
    taskId: string, 
    resolutionNotes: string, 
    outcomeStatus: 'resolved' | 'improved' | 'referred' | 'ongoing',
    learningReflection: string
  ): Promise<void> {
    await this.updateFollowUpTask(taskId, {
      completionStatus: 'completed',
      completedDate: new Date(),
      resolutionNotes,
      outcomeStatus,
      progressPercentage: 100
    });

    // Add final reflection update
    await this.addTaskUpdate({
      followUpTaskId: taskId,
      studentId: (await this.getFollowUpTask(taskId))!.studentId,
      updateDate: new Date(),
      observations: 'Task completed successfully',
      measurements: {},
      photos: [],
      conditionAssessment: outcomeStatus === 'resolved' ? 'resolved' : 'improved',
      concernLevel: 1,
      actionTaken: 'Task completion and reflection',
      studentNotes: learningReflection,
      questionsForExpert: '',
      confidenceLevel: 4,
      updateCompletenessScore: 1.0,
      photoQualityScore: 0,
      documentationQuality: 'good'
    });

    // Create completion alert for educator
    const task = await this.getFollowUpTask(taskId);
    if (task?.assignedBy) {
      await this.createAlert({
        alertType: 'completion_reminder',
        priorityLevel: 'medium',
        educatorId: task.assignedBy,
        followUpTaskId: taskId,
        title: `Task Completed: ${task.taskTitle}`,
        message: `Student has completed the follow-up task with outcome: ${outcomeStatus}`,
        alertData: { taskId, outcomeStatus, resolutionNotes },
        createdDate: new Date(),
        actionTaken: false,
        emailSent: false,
        pushNotificationSent: false,
        dashboardNotification: true,
        createdAt: new Date()
      });
    }
  }

  // Utility Methods
  private async calculateStudentPerformanceMetrics(studentId: string) {
    const tasks = (await this.getAllFollowUpTasks()).filter(t => t.studentId === studentId);
    const updates = (await this.getAllTaskUpdates()).filter(u => u.studentId === studentId);
    
    const totalTasks = tasks.length;
    const completedOnTime = tasks.filter(t => 
      t.completionStatus === 'completed' && 
      t.completedDate && 
      new Date(t.completedDate) <= t.dueDate
    ).length;

    const qualityScores = updates.map(u => u.updateCompletenessScore);
    const averageQuality = qualityScores.length > 0 ? 
      qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;

    return {
      responseRate: totalTasks > 0 ? (completedOnTime / totalTasks) : 0,
      averageUpdateQuality: averageQuality,
      competencyProgress: {
        'AS.07.01.02.a': 0.78,
        'AS.07.02.01.b': 0.85,
        'AS.07.03.01.a': 0.72
      },
      timelyCompletionRate: totalTasks > 0 ? (completedOnTime / totalTasks) : 0
    };
  }

  private async getUpcomingDeadlines(studentId: string) {
    const tasks = await this.getActiveTasksForStudent(studentId);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(t => t.dueDate <= sevenDaysFromNow)
      .map(t => ({
        taskId: t.id,
        title: t.taskTitle,
        dueDate: t.dueDate,
        priority: t.priorityLevel
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  private async generateStudentRecommendations(studentId: string): Promise<string[]> {
    const recommendations: string[] = [];
    const metrics = await this.calculateStudentPerformanceMetrics(studentId);
    
    if (metrics.responseRate < 0.8) {
      recommendations.push('Improve response timeliness for better health monitoring');
    }
    
    if (metrics.averageUpdateQuality < 0.7) {
      recommendations.push('Focus on providing more detailed observations and measurements');
    }
    
    return recommendations;
  }

  private async getStudentAlertSummary(studentId: string) {
    const alerts = await this.getAlertsForStudent(studentId);
    
    return {
      urgent: alerts.filter(a => a.priorityLevel === 'urgent').length,
      overdue: alerts.filter(a => a.alertType === 'overdue_update').length,
      pending: alerts.filter(a => !a.acknowledgedDate).length
    };
  }

  private async notifyEducatorOfUpdate(taskId: string, update: FollowUpUpdate): Promise<void> {
    const task = await this.getFollowUpTask(taskId);
    if (!task?.assignedBy) return;

    await this.createAlert({
      alertType: 'completion_reminder',
      priorityLevel: 'low',
      educatorId: task.assignedBy,
      followUpTaskId: taskId,
      title: `Student Update: ${task.taskTitle}`,
      message: `New update received for ${await this.getAnimalName(task.animalId)}`,
      alertData: { taskId, updateId: update.id, conditionAssessment: update.conditionAssessment },
      createdDate: new Date(),
      actionTaken: false,
      emailSent: false,
      pushNotificationSent: false,
      dashboardNotification: true,
      createdAt: new Date()
    });
  }

  private async getAnimalName(animalId: string): Promise<string> {
    const animals = await storageService.loadData<Animal[]>(STORAGE_KEYS.ANIMALS) || [];
    const animal = animals.find(a => a.id === animalId);
    return animal ? `${animal.name} (#${animal.tagNumber})` : 'Unknown Animal';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const followUpTaskService = new FollowUpTaskService();