export interface FFAStudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: Date;
  schoolDistrict: string;
  schoolName: string;
  graduationYear: number;
  chapterNumber: string;
  membershipType: 'Active' | 'Alumni' | 'Honorary';
  
  // FFA Degrees
  degrees: {
    greenhand: { earned: boolean; dateEarned?: Date };
    chapterDegree: { earned: boolean; dateEarned?: Date };
    stateDegree: { earned: boolean; dateEarned?: Date };
    americanDegree: { earned: boolean; dateEarned?: Date };
  };
  
  // Leadership Positions
  officerPositions: Array<{
    position: string;
    level: 'Chapter' | 'Area' | 'Region' | 'State' | 'National';
    year: number;
    description?: string;
  }>;
  
  // SAE Projects
  saeProjects: Array<{
    id: string;
    title: string;
    type: 'Entrepreneurship' | 'Placement' | 'Research/Experimentation' | 'Exploratory';
    category: string;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    supervisor?: string;
    description: string;
    goals: string[];
    achievements: string[];
    financialSummary?: {
      totalInvestment: number;
      totalRevenue: number;
      netProfit: number;
    };
  }>;
  
  // Competition Records
  competitions: Array<{
    event: string;
    level: 'Chapter' | 'Area' | 'Region' | 'State' | 'National';
    year: number;
    placement?: number;
    award?: string;
    teamMembers?: string[];
  }>;
  
  // Proficiency Awards
  proficiencyAwards: Array<{
    area: string;
    level: 'Chapter' | 'Area' | 'Region' | 'State' | 'National';
    year: number;
    placement?: number;
  }>;
  
  // Academic Information
  academics: {
    gpa?: number;
    agriculturalEducationCredits: number;
    careerPlan: string;
    collegeInterest?: string[];
    scholarshipsReceived: Array<{
      name: string;
      amount: number;
      year: number;
    }>;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FFAEducatorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  
  // Professional Information
  schoolDistrict: string;
  schoolName: string;
  yearsTeaching: number;
  yearsInAgriculture: number;
  certifications: string[];
  
  // Education
  education: Array<{
    degree: string;
    institution: string;
    year: number;
    major: string;
  }>;
  
  // FFA Chapter Management
  chapterInfo: {
    chapterNumber: string;
    chapterSize: number;
    programAreas: string[];
    facilitiesAvailable: string[];
  };
  
  // Professional Development
  professionalDevelopment: Array<{
    activity: string;
    provider: string;
    date: Date;
    hoursCompleted: number;
    certificateEarned?: string;
  }>;
  
  // Student Management
  currentStudents: string[]; // Student profile IDs
  alumniTracked: string[];
  
  // Program Statistics
  programStats: {
    averageGPA: number;
    degreesEarned: {
      greenhand: number;
      chapter: number;
      state: number;
      american: number;
    };
    competitionParticipation: number;
    saeParticipation: number;
    collegeEnrollment: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FFAInstitutionProfile {
  id: string;
  institutionName: string;
  district: string;
  state: string;
  type: 'High School' | 'Community College' | 'University' | 'Technical School';
  
  // Contact Information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactEmail: string;
  contactPhone: string;
  
  // Program Information
  programDetails: {
    chapterNumber: string;
    yearEstablished: number;
    totalEnrollment: number;
    agriculturalEnrollment: number;
    facilitiesDescription: string;
    programAreas: string[];
  };
  
  // Staff
  educators: string[]; // Educator profile IDs
  administrativeSupport: Array<{
    name: string;
    role: string;
    email?: string;
  }>;
  
  // Demographics
  demographics: {
    studentBody: {
      rural: number;
      suburban: number;
      urban: number;
    };
    socioeconomic: {
      freeReducedLunch: number;
      averageHouseholdIncome?: number;
    };
    ethnicity: Record<string, number>;
  };
  
  // Performance Metrics
  performance: {
    graduationRate: number;
    collegeEnrollmentRate: number;
    employmentRate: number;
    averageStartingSalary?: number;
    industryPlacement: Record<string, number>;
  };
  
  // Awards and Recognition
  awards: Array<{
    title: string;
    level: 'Local' | 'State' | 'National';
    year: number;
    description?: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SAEProject {
  id: string;
  studentId: string;
  title: string;
  type: 'Entrepreneurship' | 'Placement' | 'Research/Experimentation' | 'Exploratory';
  category: string;
  description: string;
  
  // Timeline
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  plannedDuration: number; // months
  
  // Supervision
  supervisor: {
    name: string;
    email?: string;
    phone?: string;
    organization?: string;
  };
  educatorSupervisor: string; // Educator ID
  
  // Goals and Objectives
  goals: Array<{
    description: string;
    targetDate: Date;
    isCompleted: boolean;
    completedDate?: Date;
    evidence?: string[];
  }>;
  
  // Skills and Learning Outcomes
  skillsDeveloped: string[]; // AET skill IDs
  learningOutcomes: string[];
  careerClusterAlignment: string[];
  
  // Financial Tracking
  financial: {
    initialInvestment: number;
    ongoingExpenses: Array<{
      date: Date;
      amount: number;
      description: string;
      category: string;
    }>;
    revenue: Array<{
      date: Date;
      amount: number;
      source: string;
      description: string;
    }>;
    currentValue?: number;
    netProfit: number;
  };
  
  // Time Tracking
  timeLog: Array<{
    date: Date;
    hours: number;
    activity: string;
    skillsApplied: string[];
    reflectionNotes?: string;
  }>;
  
  // Documentation
  documentation: {
    photos: string[];
    videos: string[];
    documents: string[];
    certificates: string[];
  };
  
  // Evaluation
  evaluation: {
    selfAssessment: {
      completed: boolean;
      score?: number;
      reflections: string;
    };
    educatorAssessment: {
      completed: boolean;
      score?: number;
      feedback: string;
      rubricScores?: Record<string, number>;
    };
    supervisorAssessment: {
      completed: boolean;
      score?: number;
      feedback: string;
    };
  };
  
  // Competition and Recognition
  competitions: Array<{
    name: string;
    level: 'Chapter' | 'Area' | 'Region' | 'State' | 'National';
    year: number;
    placement?: number;
    award?: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

export const FFA_DEGREE_REQUIREMENTS = {
  greenhand: {
    name: 'Greenhand FFA Degree',
    requirements: [
      'Be enrolled in agricultural education',
      'Have satisfactory plans for SAE',
      'Learn and explain FFA Creed',
      'Describe FFA history and organization',
      'Know FFA Code of Ethics',
      'Describe opportunities in agriculture'
    ]
  },
  chapter: {
    name: 'Chapter FFA Degree',
    requirements: [
      'Hold Greenhand FFA Degree',
      'Complete one year of agricultural education',
      'Have satisfactory SAE in operation',
      'Earn and productively invest $150 or work 45 hours',
      'Demonstrate leadership abilities',
      'Participate in chapter activities'
    ]
  },
  state: {
    name: 'State FFA Degree',
    requirements: [
      'Hold Chapter FFA Degree for one year',
      'Complete two years of agricultural education',
      'Complete 25 hours of community service',
      'Earn and productively invest $1,000 or work 300 hours',
      'Demonstrate leadership in chapter/community',
      'Graduate from high school'
    ]
  },
  american: {
    name: 'American FFA Degree',
    requirements: [
      'Hold State FFA Degree',
      'Complete three years of agricultural education',
      'Complete 50 hours of community service',
      'Earn and productively invest $10,000 or work 2,250 hours',
      'Demonstrate outstanding leadership',
      'Complete associate degree or equivalent'
    ]
  }
};

export const SAE_CATEGORIES = [
  'Beef Production',
  'Swine Production', 
  'Sheep Production',
  'Goat Production',
  'Dairy Production',
  'Poultry Production',
  'Aquaculture',
  'Agricultural Sales',
  'Agricultural Service',
  'Agricultural Processing',
  'Forestry',
  'Crop Production',
  'Horticulture',
  'Agricultural Mechanics',
  'Food Science',
  'Agricultural Communications',
  'Agricultural Education',
  'Veterinary Science',
  'Agricultural Research',
  'Agricultural Business',
  'Other'
];

export interface CreateStudentProfileRequest extends Omit<FFAStudentProfile, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateEducatorProfileRequest extends Omit<FFAEducatorProfile, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateInstitutionProfileRequest extends Omit<FFAInstitutionProfile, 'id' | 'createdAt' | 'updatedAt'> {}
export interface CreateSAEProjectRequest extends Omit<SAEProject, 'id' | 'createdAt' | 'updatedAt'> {}