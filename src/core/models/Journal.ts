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