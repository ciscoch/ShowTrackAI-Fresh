import { storageService } from './StorageService';
import { UserProfile } from '../models/Profile';
import { Animal } from '../models/Animal';
import { JournalEntry } from '../models/Journal';
import { HealthRecord } from '../models/HealthRecord';
import { FollowUpTask } from '../models/FollowUpTask';
import { FinancialEntry } from '../models/Financial';

export interface StudentRecord {
  student: UserProfile;
  animals: Animal[];
  journalEntries: JournalEntry[];
  healthRecords: HealthRecord[];
  followUpTasks: FollowUpTask[];
  financialEntries: FinancialEntry[];
  summary: {
    totalAnimals: number;
    activeHealthIssues: number;
    completedTasks: number;
    totalHours: number;
    lastActivity: Date | null;
    competencyProgress: Record<string, number>;
  };
}

export interface StudentOverview {
  studentId: string;
  studentName: string;
  lastActive: Date;
  summary: {
    animals: number;
    activeIssues: number;
    overdueTasks: number;
    responseRate: number;
    engagementScore: number;
  };
  alerts: {
    urgent: number;
    warnings: number;
    info: number;
  };
}

class EducatorStudentService {
  async getStudentsForEducator(educatorId: string): Promise<UserProfile[]> {
    try {
      const allProfiles = await storageService.loadData('@ShowTrackAI:ffaProfiles') || [];
      const educator = allProfiles.find((p: UserProfile) => p.id === educatorId);
      
      if (!educator || educator.type !== 'educator') {
        return [];
      }

      const studentIds = educator.students_supervised || [];
      const students = allProfiles.filter((p: UserProfile) => 
        studentIds.includes(p.id) || 
        (p.ffa_chapter_id === educator.ffa_chapter_id && 
         ['student', 'freemium_student', 'elite_student'].includes(p.type))
      );

      return students;
    } catch (error) {
      console.error('Failed to get students for educator:', error);
      return [];
    }
  }

  async getStudentRecord(studentId: string, educatorId: string): Promise<StudentRecord | null> {
    try {
      // Verify educator has access to this student
      const students = await this.getStudentsForEducator(educatorId);
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        console.warn('Educator does not have access to student:', studentId);
        return null;
      }

      // Load all student data
      const [animals, journalEntries, healthRecords, followUpTasks, financialEntries] = await Promise.all([
        this.getStudentAnimals(studentId),
        this.getStudentJournalEntries(studentId),
        this.getStudentHealthRecords(studentId),
        this.getStudentFollowUpTasks(studentId),
        this.getStudentFinancialEntries(studentId)
      ]);

      // Calculate summary statistics
      const activeHealthIssues = healthRecords.filter(h => 
        h.status === 'ongoing' || h.status === 'monitoring'
      ).length;

      const completedTasks = followUpTasks.filter(t => 
        t.completionStatus === 'completed'
      ).length;

      const lastActivity = this.getLastActivityDate([
        ...journalEntries.map(j => j.date),
        ...healthRecords.map(h => h.date),
        ...followUpTasks.map(t => t.lastUpdate).filter(Boolean)
      ]);

      const competencyProgress = this.calculateCompetencyProgress(journalEntries, followUpTasks);

      return {
        student,
        animals,
        journalEntries,
        healthRecords,
        followUpTasks,
        financialEntries,
        summary: {
          totalAnimals: animals.length,
          activeHealthIssues,
          completedTasks,
          totalHours: student.stats.totalHoursLogged,
          lastActivity,
          competencyProgress
        }
      };
    } catch (error) {
      console.error('Failed to get student record:', error);
      return null;
    }
  }

  async getAllStudentOverviews(educatorId: string): Promise<StudentOverview[]> {
    try {
      const students = await this.getStudentsForEducator(educatorId);
      const overviews: StudentOverview[] = [];

      for (const student of students) {
        const overview = await this.getStudentOverview(student.id, educatorId);
        if (overview) {
          overviews.push(overview);
        }
      }

      return overviews.sort((a, b) => {
        // Sort by urgency: urgent alerts first, then by last active
        if (a.alerts.urgent !== b.alerts.urgent) {
          return b.alerts.urgent - a.alerts.urgent;
        }
        return b.lastActive.getTime() - a.lastActive.getTime();
      });
    } catch (error) {
      console.error('Failed to get student overviews:', error);
      return [];
    }
  }

  async getStudentOverview(studentId: string, educatorId: string): Promise<StudentOverview | null> {
    try {
      const record = await this.getStudentRecord(studentId, educatorId);
      if (!record) return null;

      const { student, animals, followUpTasks, journalEntries } = record;

      // Calculate metrics
      const activeIssues = record.summary.activeHealthIssues;
      const overdueTasks = followUpTasks.filter(t => 
        new Date(t.dueDate) < new Date() && t.completionStatus !== 'completed'
      ).length;

      const responseRate = this.calculateResponseRate(followUpTasks);
      const engagementScore = this.calculateEngagementScore(journalEntries, followUpTasks);

      // Count alerts by severity
      const alerts = this.countAlerts(followUpTasks, record.healthRecords);

      return {
        studentId: student.id,
        studentName: student.name,
        lastActive: student.lastActive || new Date(), // Fallback if lastActive is missing
        summary: {
          animals: animals.length,
          activeIssues,
          overdueTasks,
          responseRate,
          engagementScore
        },
        alerts
      };
    } catch (error) {
      console.error('Failed to get student overview:', error);
      return null;
    }
  }

  private async getStudentAnimals(studentId: string): Promise<Animal[]> {
    try {
      const allAnimals = await storageService.loadData('@ShowTrackAI:animals') || [];
      return allAnimals.filter((animal: Animal) => animal.ownerId === studentId);
    } catch (error) {
      console.error('Failed to get student animals:', error);
      return [];
    }
  }

  private async getStudentJournalEntries(studentId: string): Promise<JournalEntry[]> {
    try {
      const allEntries = await storageService.loadData('@ShowTrackAI:journal') || [];
      return allEntries.filter((entry: JournalEntry) => entry.userId === studentId);
    } catch (error) {
      console.error('Failed to get student journal entries:', error);
      return [];
    }
  }

  private async getStudentHealthRecords(studentId: string): Promise<HealthRecord[]> {
    try {
      const allRecords = await storageService.loadData('@ShowTrackAI:healthRecords') || [];
      return allRecords.filter((record: HealthRecord) => record.studentId === studentId);
    } catch (error) {
      console.error('Failed to get student health records:', error);
      return [];
    }
  }

  private async getStudentFollowUpTasks(studentId: string): Promise<FollowUpTask[]> {
    try {
      const allTasks = await storageService.loadData('@ShowTrackAI:followUpTasks') || [];
      return allTasks.filter((task: FollowUpTask) => task.studentId === studentId);
    } catch (error) {
      console.error('Failed to get student follow-up tasks:', error);
      return [];
    }
  }

  private async getStudentFinancialEntries(studentId: string): Promise<FinancialEntry[]> {
    try {
      const allEntries = await storageService.loadData('@ShowTrackAI:financialEntries') || [];
      return allEntries.filter((entry: FinancialEntry) => entry.userId === studentId);
    } catch (error) {
      console.error('Failed to get student financial entries:', error);
      return [];
    }
  }

  private getLastActivityDate(dates: (Date | undefined)[]): Date | null {
    const validDates = dates.filter(Boolean).map(d => new Date(d!));
    if (validDates.length === 0) return null;
    return new Date(Math.max(...validDates.map(d => d.getTime())));
  }

  private calculateCompetencyProgress(journalEntries: JournalEntry[], followUpTasks: FollowUpTask[]): Record<string, number> {
    const competencies: Record<string, { attempted: number; completed: number }> = {};

    // Count from journal entries
    journalEntries.forEach(entry => {
      if (entry.aetCategories) {
        entry.aetCategories.forEach(category => {
          if (!competencies[category]) {
            competencies[category] = { attempted: 0, completed: 0 };
          }
          competencies[category].attempted++;
          if (entry.reflectionNote && entry.reflectionNote.length > 50) {
            competencies[category].completed++;
          }
        });
      }
    });

    // Count from follow-up tasks
    followUpTasks.forEach(task => {
      if (task.competencyStandards) {
        task.competencyStandards.forEach(standard => {
          if (!competencies[standard]) {
            competencies[standard] = { attempted: 0, completed: 0 };
          }
          competencies[standard].attempted++;
          if (task.completionStatus === 'completed') {
            competencies[standard].completed++;
          }
        });
      }
    });

    // Calculate progress percentages
    const progress: Record<string, number> = {};
    Object.entries(competencies).forEach(([competency, counts]) => {
      progress[competency] = counts.attempted > 0 
        ? (counts.completed / counts.attempted) * 100 
        : 0;
    });

    return progress;
  }

  private calculateResponseRate(followUpTasks: FollowUpTask[]): number {
    if (followUpTasks.length === 0) return 100;

    const onTimeUpdates = followUpTasks.filter(task => {
      if (!task.lastUpdate) return false;
      const dueDate = new Date(task.dueDate);
      const updateDate = new Date(task.lastUpdate);
      return updateDate <= dueDate;
    }).length;

    return Math.round((onTimeUpdates / followUpTasks.length) * 100);
  }

  private calculateEngagementScore(journalEntries: JournalEntry[], followUpTasks: FollowUpTask[]): number {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentJournalEntries = journalEntries.filter(entry => 
      new Date(entry.date) >= thirtyDaysAgo
    ).length;

    const recentTaskUpdates = followUpTasks.filter(task => 
      task.lastUpdate && new Date(task.lastUpdate) >= thirtyDaysAgo
    ).length;

    // Score based on activity frequency (max 100)
    const activityScore = Math.min(100, (recentJournalEntries * 5) + (recentTaskUpdates * 10));
    return Math.round(activityScore);
  }

  private countAlerts(followUpTasks: FollowUpTask[], healthRecords: HealthRecord[]): { urgent: number; warnings: number; info: number } {
    let urgent = 0;
    let warnings = 0;
    let info = 0;

    // Count from follow-up tasks
    followUpTasks.forEach(task => {
      if (task.escalationTriggered || task.priorityLevel === 'urgent') {
        urgent++;
      } else if (task.priorityLevel === 'high') {
        warnings++;
      } else if (new Date(task.dueDate) < new Date() && task.completionStatus !== 'completed') {
        warnings++;
      } else {
        info++;
      }
    });

    // Count from health records
    healthRecords.forEach(record => {
      if (record.severity === 'severe' || record.status === 'emergency') {
        urgent++;
      } else if (record.severity === 'moderate' || record.status === 'monitoring') {
        warnings++;
      } else {
        info++;
      }
    });

    return { urgent, warnings, info };
  }

  async assignTaskToStudent(
    educatorId: string, 
    studentId: string, 
    taskData: Partial<FollowUpTask>
  ): Promise<boolean> {
    try {
      // Verify educator has access to student
      const students = await this.getStudentsForEducator(educatorId);
      if (!students.find(s => s.id === studentId)) {
        return false;
      }

      const task: FollowUpTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        healthRecordId: taskData.healthRecordId || '',
        animalId: taskData.animalId || '',
        studentId,
        assignedBy: educatorId,
        taskType: taskData.taskType || 'monitoring',
        taskTitle: taskData.taskTitle || 'Health Monitoring Task',
        taskDescription: taskData.taskDescription || '',
        detailedInstructions: taskData.detailedInstructions || '',
        createdDate: new Date(),
        dueDate: taskData.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default: 24 hours
        frequency: taskData.frequency || 'once',
        durationDays: taskData.durationDays || 1,
        completionStatus: 'pending',
        progressPercentage: 0,
        priorityLevel: taskData.priorityLevel || 'medium',
        escalationTriggered: false,
        learningObjectives: taskData.learningObjectives || [],
        competencyStandards: taskData.competencyStandards || [],
        reflectionRequired: taskData.reflectionRequired || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const allTasks = await storageService.loadData('@ShowTrackAI:followUpTasks') || [];
      allTasks.push(task);
      await storageService.saveData('@ShowTrackAI:followUpTasks', allTasks);

      return true;
    } catch (error) {
      console.error('Failed to assign task to student:', error);
      return false;
    }
  }

  async addStudentToSupervision(educatorId: string, studentId: string): Promise<boolean> {
    try {
      const allProfiles = await storageService.loadData('@ShowTrackAI:ffaProfiles') || [];
      const educatorIndex = allProfiles.findIndex((p: UserProfile) => p.id === educatorId);
      
      if (educatorIndex === -1) return false;

      const educator = allProfiles[educatorIndex];
      if (!educator.students_supervised) {
        educator.students_supervised = [];
      }

      if (!educator.students_supervised.includes(studentId)) {
        educator.students_supervised.push(studentId);
        allProfiles[educatorIndex] = educator;
        await storageService.saveData('@ShowTrackAI:ffaProfiles', allProfiles);
      }

      return true;
    } catch (error) {
      console.error('Failed to add student to supervision:', error);
      return false;
    }
  }

  async removeStudentFromSupervision(educatorId: string, studentId: string): Promise<boolean> {
    try {
      const allProfiles = await storageService.loadData('@ShowTrackAI:ffaProfiles') || [];
      const educatorIndex = allProfiles.findIndex((p: UserProfile) => p.id === educatorId);
      
      if (educatorIndex === -1) return false;

      const educator = allProfiles[educatorIndex];
      if (educator.students_supervised) {
        educator.students_supervised = educator.students_supervised.filter(id => id !== studentId);
        allProfiles[educatorIndex] = educator;
        await storageService.saveData('@ShowTrackAI:ffaProfiles', allProfiles);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove student from supervision:', error);
      return false;
    }
  }
}

export const educatorStudentService = new EducatorStudentService();