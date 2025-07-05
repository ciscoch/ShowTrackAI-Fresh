export interface ObserverAccess {
  id: string;
  studentId: string;
  observerType: 'parent' | 'teacher' | 'organization' | 'mentor';
  observerName: string;
  observerEmail?: string;
  permissions: ObserverPermissions;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  accessToken: string;
}

export interface ObserverPermissions {
  viewAnimals: boolean;
  viewJournal: boolean;
  viewFinancials: boolean;
  viewHealthRecords: boolean;
  viewProgress: boolean;
  receiveNotifications: boolean;
  viewCompetencies: boolean;
}

export interface QRCodeData {
  studentId: string;
  studentName: string;
  projectName: string;
  accessToken: string;
  permissions: ObserverPermissions;
  generatedAt: Date;
  expiresAt?: Date;
  qrCodeVersion: string;
}

export interface StudentProjectSummary {
  studentId: string;
  studentName: string;
  projectName: string;
  school: string;
  chapter: string;
  totalAnimals: number;
  totalHours: number;
  competenciesProgress: Record<string, number>;
  lastActivity: Date;
  projectStartDate: Date;
  achievements: string[];
}

export interface ObserverDashboardData {
  student: StudentProjectSummary;
  animals?: Array<{
    id: string;
    name: string;
    species: string;
    breed: string;
    age?: number;
    healthStatus: string;
  }>;
  recentJournalEntries?: Array<{
    id: string;
    title: string;
    date: Date;
    hoursWorked: number;
    aetCategories: string[];
  }>;
  financialSummary?: {
    totalExpenses: number;
    totalRevenue: number;
    profitLoss: number;
    topExpenseCategories: string[];
  };
  healthAlerts?: Array<{
    animalId: string;
    animalName: string;
    alertType: 'urgent' | 'warning' | 'info';
    description: string;
    date: Date;
  }>;
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    achievedDate: Date;
    category: string;
  }>;
}