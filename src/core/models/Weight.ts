export interface Weight {
  id: string;
  animalId: string;
  weight: number;
  date: Date;
  measurementType: 'Scale' | 'AI Estimate' | 'Visual Estimate' | 'Tape Measure';
  bodyConditionScore?: number;
  confidence?: number; // For AI estimates
  photoUri?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWeightRequest extends Omit<Weight, 'id' | 'createdAt' | 'updatedAt'> {}