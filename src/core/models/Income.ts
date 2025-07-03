export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: IncomeCategory;
  subcategory?: string;
  source: string;
  paymentMethod: 'Cash' | 'Check' | 'Credit Card' | 'Bank Transfer' | 'Other';
  animalId?: string;
  projectPhase?: 'Sale' | 'Show Winnings' | 'Breeding' | 'Other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IncomeCategory = 
  | 'Livestock Sales'
  | 'Show Winnings'
  | 'Breeding Services'
  | 'Product Sales'
  | 'Consulting'
  | 'Other';

export interface CreateIncomeRequest extends Omit<Income, 'id' | 'createdAt' | 'updatedAt'> {}