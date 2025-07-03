export interface FeedItem {
  id: string;
  brand: string;
  product: string;
  amount: number;
  unit: string;
  cost?: number;
  isHay: boolean;
  hayType?: string;
  proteinLevel?: string;
  category: 'grain' | 'pellets' | 'textured' | 'supplement' | 'mineral' | 'hay' | 'other';
}

export interface FeedTrackingData {
  feeds: FeedItem[];
  totalCost?: number;
  notes?: string;
}

export interface Journal {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: number; // minutes
  category: JournalCategory;
  subcategory?: string;
  animalId?: string;
  aetSkills: string[];
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  weather?: {
    temperature: number;
    conditions: string;
  };
  notes?: string;
  feedData: FeedTrackingData; // Mandatory feed tracking - multiple feeds
  objectives?: string[];
  learningOutcomes?: string[];
  challenges?: string;
  improvements?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JournalCategory = 
  | 'Feeding'
  | 'Health Care'
  | 'Exercise'
  | 'Training'
  | 'Grooming'
  | 'Record Keeping'
  | 'Equipment Maintenance'
  | 'Show Preparation'
  | 'Marketing'
  | 'Other';

export interface CreateJournalRequest extends Omit<Journal, 'id' | 'createdAt' | 'updatedAt'> {}

// Export the FeedTrackingData type for use in other components
export type { FeedTrackingData };