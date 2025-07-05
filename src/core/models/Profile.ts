export interface UserProfile {
  id: string;
  name: string;
  type: 'student' | 'educator' | 'parent' | 'admin' | 'freemium_student' | 'elite_student';
  avatar?: string;
  school?: string;
  grade?: string;
  chapter?: string;
  subscriptionTier?: 'Free' | 'Basic' | 'Professional' | 'Enterprise';
  createdAt: Date;
  lastActive: Date;
  settings: {
    defaultSpecies: string;
    measurements: 'metric' | 'imperial';
    notifications: boolean;
    dataSharing: boolean;
  };
  stats: {
    animalsManaged: number;
    journalEntries: number;
    totalHoursLogged: number;
    achievementsEarned: number;
  };
  isDemo?: boolean;
  // Educator-specific fields
  ffa_chapter_id?: string;
  educator_role?: 'agriculture_teacher' | 'ffa_advisor' | 'substitute' | 'administrator';
  certification?: string[];
  years_experience?: number;
  students_supervised?: string[]; // Array of student IDs
}

export interface ProfileCreationData {
  name: string;
  type: 'student' | 'educator' | 'parent' | 'admin' | 'freemium_student' | 'elite_student';
  school?: string;
  grade?: string;
  chapter?: string;
  avatar?: string;
  subscriptionTier?: 'Free' | 'Basic' | 'Professional' | 'Enterprise';
  isDemo?: boolean;
  // Educator-specific creation data
  ffa_chapter_id?: string;
  educator_role?: 'agriculture_teacher' | 'ffa_advisor' | 'substitute' | 'administrator';
  certification?: string[];
  years_experience?: number;
}

export const PROFILE_TYPES = {
  student: {
    label: 'Student',
    description: 'Track your SAE projects and FFA activities',
    icon: '🎓',
    features: ['Animal tracking', 'Journal logging', 'FFA integration', 'Progress reports']
  },
  educator: {
    label: 'Educator',
    description: 'Manage classroom and student projects',
    icon: '👨‍🏫',
    features: ['Student oversight', 'Curriculum tools', 'Assessment tracking', 'Analytics']
  },
  parent: {
    label: 'Parent/Guardian',
    description: 'Support your child\'s agricultural education',
    icon: '👨‍👩‍👧‍👦',
    features: ['Progress monitoring', 'Photo sharing', 'Communication tools', 'Event tracking']
  },
  admin: {
    label: 'Administrator',
    description: 'Full system management and analytics',
    icon: '⚙️',
    features: ['System management', 'User administration', 'Advanced analytics', 'Data export']
  },
  freemium_student: {
    label: 'Freemium Student',
    description: 'Try ShowTrackAI with basic features',
    icon: '🆓',
    features: ['5 animals max', 'Basic journal', 'Photo capture', 'Basic reports'],
    tier: 'Free',
    limitations: {
      maxAnimals: 5,
      maxPhotos: 20,
      exportFormats: ['csv'],
      aiPredictions: false,
      advancedAnalytics: false
    }
  },
  elite_student: {
    label: 'Elite Student',
    description: 'Full ShowTrackAI experience with all premium features',
    icon: '⭐',
    features: ['Unlimited animals', 'AI predictions', 'Advanced analytics', 'All export formats', 'FFA integration', 'Priority support'],
    tier: 'Professional',
    limitations: {
      maxAnimals: -1, // unlimited
      maxPhotos: -1, // unlimited
      exportFormats: ['csv', 'json', 'pdf', 'xlsx', 'schedulef', 'aet_report'],
      aiPredictions: true,
      advancedAnalytics: true
    }
  }
} as const;

export const DEFAULT_SETTINGS = {
  defaultSpecies: 'Cattle',
  measurements: 'imperial' as const,
  notifications: true,
  dataSharing: false
};

export const DEFAULT_STATS = {
  animalsManaged: 0,
  journalEntries: 0,
  totalHoursLogged: 0,
  achievementsEarned: 0
};