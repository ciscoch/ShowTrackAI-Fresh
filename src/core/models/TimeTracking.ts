export interface TimeTracking {
  id: string;
  animalId?: string;
  activity: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  category: TimeCategory;
  aetSkills: string[];
  isActive: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TimeCategory = 
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

export interface CreateTimeTrackingRequest extends Omit<TimeTracking, 'id' | 'createdAt' | 'updatedAt'> {}