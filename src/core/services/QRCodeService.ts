import { storageService } from './StorageService';
import { 
  ObserverAccess, 
  QRCodeData, 
  ObserverPermissions, 
  StudentProjectSummary,
  ObserverDashboardData 
} from '../models/QRCode';
import { UserProfile } from '../models/Profile';
import { educatorStudentService } from './EducatorStudentService';

export class QRCodeService {
  private readonly STORAGE_KEY = '@ShowTrackAI:observerAccess';
  private readonly QR_VERSION = '1.0';

  /**
   * Generate a QR code access token for a student
   */
  async generateObserverAccess(
    studentId: string,
    observerType: 'parent' | 'teacher' | 'organization' | 'mentor',
    observerName: string,
    observerEmail?: string,
    customPermissions?: Partial<ObserverPermissions>,
    expirationDays?: number
  ): Promise<ObserverAccess> {
    const accessToken = this.generateSecureToken();
    const now = new Date();
    const expiresAt = expirationDays ? new Date(now.getTime() + (expirationDays * 24 * 60 * 60 * 1000)) : undefined;

    const defaultPermissions: ObserverPermissions = {
      viewAnimals: true,
      viewJournal: observerType === 'parent' || observerType === 'teacher',
      viewFinancials: observerType === 'parent',
      viewHealthRecords: true,
      viewProgress: true,
      receiveNotifications: observerType === 'parent' || observerType === 'teacher',
      viewCompetencies: observerType === 'teacher',
    };

    const permissions: ObserverPermissions = {
      ...defaultPermissions,
      ...customPermissions,
    };

    const observerAccess: ObserverAccess = {
      id: `observer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      observerType,
      observerName,
      observerEmail,
      permissions,
      createdAt: now,
      expiresAt,
      isActive: true,
      accessToken,
    };

    await this.saveObserverAccess(observerAccess);
    return observerAccess;
  }

  /**
   * Generate QR code data for sharing
   */
  async generateQRCodeData(studentId: string, observerAccess: ObserverAccess, studentName?: string): Promise<QRCodeData> {
    let finalStudentName = studentName;
    
    // Try to get student profile for display info if name not provided
    if (!finalStudentName) {
      const profiles = await storageService.loadData('@ShowTrackAI:ffaProfiles') || [];
      const student = profiles.find((p: UserProfile) => p.id === studentId);
      
      if (student) {
        finalStudentName = student.name;
      } else {
        // Fallback to a generic name if student not found in storage
        finalStudentName = 'Student';
      }
    }

    const qrCodeData: QRCodeData = {
      studentId,
      studentName: finalStudentName,
      projectName: `${finalStudentName}'s FFA Project`,
      accessToken: observerAccess.accessToken,
      permissions: observerAccess.permissions,
      generatedAt: new Date(),
      expiresAt: observerAccess.expiresAt,
      qrCodeVersion: this.QR_VERSION,
    };

    return qrCodeData;
  }

  /**
   * Validate and decode QR code data
   */
  async validateQRCodeAccess(accessToken: string): Promise<ObserverAccess | null> {
    // Handle demo token
    if (accessToken === 'qr_1704067200000_demo123456789') {
      return this.createDemoObserverAccess();
    }

    const allAccess = await this.getAllObserverAccess();
    const access = allAccess.find(a => a.accessToken === accessToken);

    if (!access) {
      return null;
    }

    // Check if access is still active
    if (!access.isActive) {
      return null;
    }

    // Check if access has expired
    if (access.expiresAt && new Date() > access.expiresAt) {
      // Deactivate expired access
      await this.deactivateObserverAccess(access.id);
      return null;
    }

    return access;
  }

  /**
   * Create demo observer access for testing
   */
  private createDemoObserverAccess(): ObserverAccess {
    return {
      id: 'demo_observer_access',
      studentId: 'freemium_student',
      observerType: 'parent',
      observerName: 'Demo Parent',
      observerEmail: 'parent@demo.com',
      permissions: {
        viewAnimals: true,
        viewJournal: true,
        viewFinancials: true,
        viewHealthRecords: true,
        viewProgress: true,
        receiveNotifications: true,
        viewCompetencies: true,
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
      accessToken: 'qr_1704067200000_demo123456789',
    };
  }

  /**
   * Create demo observer dashboard data for testing
   */
  private createDemoObserverDashboardData(access: ObserverAccess): ObserverDashboardData {
    const dashboardData: ObserverDashboardData = {
      student: {
        studentId: 'freemium_student',
        studentName: 'Alex Johnson',
        projectName: "Alex Johnson's FFA Project",
        school: 'Riverside High School',
        chapter: 'Riverside FFA Chapter',
        totalAnimals: 3,
        totalHours: 240, // 4 hours in minutes
        competenciesProgress: {
          'Animal Care': 85,
          'Record Keeping': 92,
          'Financial Management': 78,
          'Leadership': 65,
        },
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        projectStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        achievements: [
          'First Animal Purchase',
          'Health Record Certified',
          'Financial Tracking Started',
          'Monthly Report Completed',
        ],
      },
      animals: [
        {
          id: 'demo_animal_1',
          name: 'Bessie',
          species: 'Cattle',
          breed: 'Holstein',
          age: 18,
          healthStatus: 'Healthy',
        },
        {
          id: 'demo_animal_2',
          name: 'Wilbur',
          species: 'Pig',
          breed: 'Yorkshire',
          age: 6,
          healthStatus: 'Healthy',
        },
        {
          id: 'demo_animal_3',
          name: 'Clover',
          species: 'Sheep',
          breed: 'Suffolk',
          age: 12,
          healthStatus: 'Under Observation',
        },
      ],
      recentJournalEntries: [
        {
          id: 'demo_journal_1',
          title: 'Morning Feed and Health Check',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          hoursWorked: 2,
          aetCategories: ['Animal Care', 'Record Keeping'],
        },
        {
          id: 'demo_journal_2',
          title: 'Weekly Weight Measurements',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          hoursWorked: 1.5,
          aetCategories: ['Animal Care', 'Data Collection'],
        },
        {
          id: 'demo_journal_3',
          title: 'Financial Record Update',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          hoursWorked: 1,
          aetCategories: ['Financial Management', 'Record Keeping'],
        },
      ],
      financialSummary: {
        totalExpenses: 1245.50,
        totalRevenue: 850.00,
        profitLoss: -395.50,
        topExpenseCategories: ['Feed', 'Veterinary', 'Equipment'],
      },
      healthAlerts: [
        {
          animalId: 'demo_animal_3',
          animalName: 'Clover',
          alertType: 'warning',
          description: 'Slight decrease in appetite observed. Monitoring for 3 days.',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
      milestones: [
        {
          id: 'milestone_1',
          title: 'First Month Completed',
          description: 'Successfully completed the first month of animal care with consistent daily records.',
          achievedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          category: 'Time Management',
        },
        {
          id: 'milestone_2',
          title: 'Health Certification Earned',
          description: 'Completed animal health certification course and applied knowledge to project.',
          achievedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          category: 'Education',
        },
      ],
    };

    return dashboardData;
  }

  /**
   * Get observer dashboard data based on access permissions
   */
  async getObserverDashboardData(accessToken: string): Promise<ObserverDashboardData | null> {
    const access = await this.validateQRCodeAccess(accessToken);
    if (!access) {
      return null;
    }

    // Handle demo case with mock data
    if (accessToken === 'qr_1704067200000_demo123456789') {
      return this.createDemoObserverDashboardData(access);
    }

    // Get student profile
    const profiles = await storageService.loadData('@ShowTrackAI:ffaProfiles') || [];
    const student = profiles.find((p: UserProfile) => p.id === access.studentId);

    if (!student) {
      return null;
    }

    // Build student project summary
    const studentSummary: StudentProjectSummary = {
      studentId: student.id,
      studentName: student.name,
      projectName: `${student.name}'s FFA Project`,
      school: student.school || 'Unknown School',
      chapter: student.chapter || 'Unknown Chapter',
      totalAnimals: 0, // Will be updated below
      totalHours: student.stats.totalHoursLogged || 0,
      competenciesProgress: {},
      lastActivity: student.lastActive || new Date(),
      projectStartDate: student.createdAt || new Date(),
      achievements: student.achievements || [],
    };

    const dashboardData: ObserverDashboardData = {
      student: studentSummary,
    };

    // Load additional data based on permissions
    if (access.permissions.viewAnimals) {
      const allAnimals = await storageService.loadData('@ShowTrackAI:animals') || [];
      const studentAnimals = allAnimals.filter(animal => animal.ownerId === access.studentId);
      
      dashboardData.animals = studentAnimals.map(animal => ({
        id: animal.id,
        name: animal.name,
        species: animal.species,
        breed: animal.breed,
        age: animal.dateOfBirth ? this.calculateAge(animal.dateOfBirth) : undefined,
        healthStatus: animal.healthStatus || 'Unknown',
      }));

      studentSummary.totalAnimals = studentAnimals.length;
    }

    if (access.permissions.viewJournal) {
      const allJournalEntries = await storageService.loadData('@ShowTrackAI:journal') || [];
      const studentEntries = allJournalEntries
        .filter(entry => entry.userId === access.studentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Get latest 5 entries

      dashboardData.recentJournalEntries = studentEntries.map(entry => ({
        id: entry.id,
        title: entry.title,
        date: new Date(entry.date),
        hoursWorked: entry.hoursWorked || 0,
        aetCategories: entry.aetCategories || [],
      }));
    }

    if (access.permissions.viewFinancials) {
      const allFinancialEntries = await storageService.loadData('@ShowTrackAI:financialEntries') || [];
      const studentFinancials = allFinancialEntries.filter(entry => entry.userId === access.studentId);

      const totalExpenses = studentFinancials
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const totalRevenue = studentFinancials
        .filter(entry => entry.type === 'revenue')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const expenseCategories = studentFinancials
        .filter(entry => entry.type === 'expense')
        .reduce((acc, entry) => {
          acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
          return acc;
        }, {} as Record<string, number>);

      const topExpenseCategories = Object.entries(expenseCategories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      dashboardData.financialSummary = {
        totalExpenses,
        totalRevenue,
        profitLoss: totalRevenue - totalExpenses,
        topExpenseCategories,
      };
    }

    if (access.permissions.viewHealthRecords) {
      const allHealthRecords = await storageService.loadData('@ShowTrackAI:healthRecords') || [];
      const studentHealthRecords = allHealthRecords.filter(record => record.studentId === access.studentId);

      dashboardData.healthAlerts = studentHealthRecords
        .filter(record => record.status === 'emergency' || record.status === 'monitoring')
        .map(record => ({
          animalId: record.animalId,
          animalName: record.animalId, // This would need to be resolved to animal name
          alertType: record.severity === 'severe' ? 'urgent' as const : 
                    record.severity === 'moderate' ? 'warning' as const : 'info' as const,
          description: record.condition,
          date: new Date(record.date),
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);
    }

    return dashboardData;
  }

  /**
   * Generate secure access token
   */
  private generateSecureToken(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 15);
    return `qr_${timestamp}_${random}`;
  }

  /**
   * Calculate age in months from birth date
   */
  private calculateAge(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }

  /**
   * Save observer access to storage
   */
  private async saveObserverAccess(observerAccess: ObserverAccess): Promise<void> {
    const allAccess = await this.getAllObserverAccess();
    allAccess.push(observerAccess);
    await storageService.saveData(this.STORAGE_KEY, allAccess);
  }

  /**
   * Get all observer access records
   */
  private async getAllObserverAccess(): Promise<ObserverAccess[]> {
    const data = await storageService.loadData<ObserverAccess[]>(this.STORAGE_KEY);
    return data || [];
  }

  /**
   * Deactivate observer access
   */
  async deactivateObserverAccess(accessId: string): Promise<void> {
    const allAccess = await this.getAllObserverAccess();
    const updatedAccess = allAccess.map(access => 
      access.id === accessId ? { ...access, isActive: false } : access
    );
    await storageService.saveData(this.STORAGE_KEY, updatedAccess);
  }

  /**
   * Get active observer access for a student
   */
  async getStudentObserverAccess(studentId: string): Promise<ObserverAccess[]> {
    const allAccess = await this.getAllObserverAccess();
    return allAccess.filter(access => 
      access.studentId === studentId && 
      access.isActive &&
      (!access.expiresAt || new Date() <= access.expiresAt)
    );
  }

  /**
   * Revoke all observer access for a student
   */
  async revokeAllStudentAccess(studentId: string): Promise<void> {
    const allAccess = await this.getAllObserverAccess();
    const updatedAccess = allAccess.map(access => 
      access.studentId === studentId ? { ...access, isActive: false } : access
    );
    await storageService.saveData(this.STORAGE_KEY, updatedAccess);
  }
}

export const qrCodeService = new QRCodeService();