export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  subcategory?: string;
  paymentMethod: 'Cash' | 'Check' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Other';
  vendor?: string;
  receiptPhoto?: string;
  isDeductible: boolean;
  scheduleFLineItem?: string;
  aetCategory?: string;
  animalId?: string;
  projectPhase?: 'Acquisition' | 'Feeding' | 'Healthcare' | 'Showing' | 'Marketing' | 'Other';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseCategory = 
  | 'Feed'
  | 'Veterinary'
  | 'Supplies'
  | 'Equipment'
  | 'Transportation'
  | 'Show Entries'
  | 'Labor'
  | 'Insurance'
  | 'Utilities'
  | 'Repairs'
  | 'Professional Services'
  | 'Other';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, {
  label: string;
  subcategories: string[];
  scheduleFLineItem: string;
  isDeductible: boolean;
  aetMapping?: string;
}> = {
  Feed: {
    label: 'Feed & Nutrition',
    subcategories: ['Grain', 'Hay/Forage', 'Supplements', 'Minerals', 'Pasture Rent'],
    scheduleFLineItem: 'Line 5 - Feed',
    isDeductible: true,
    aetMapping: 'Feed and Nutrition Management'
  },
  Veterinary: {
    label: 'Veterinary & Health',
    subcategories: ['Vaccinations', 'Medications', 'Vet Visits', 'Health Testing', 'Emergency Care'],
    scheduleFLineItem: 'Line 6 - Veterinary',
    isDeductible: true,
    aetMapping: 'Animal Health Management'
  },
  Supplies: {
    label: 'Supplies',
    subcategories: ['Bedding', 'Cleaning Supplies', 'Show Supplies', 'Grooming', 'Tags/ID'],
    scheduleFLineItem: 'Line 7 - Supplies',
    isDeductible: true,
    aetMapping: 'Record Keeping and Business Management'
  },
  Equipment: {
    label: 'Equipment',
    subcategories: ['Feeders', 'Waterers', 'Fencing', 'Gates', 'Tools', 'Scales'],
    scheduleFLineItem: 'Line 13 - Equipment (Depreciation)',
    isDeductible: true,
    aetMapping: 'Agricultural Mechanics and Technology'
  },
  Transportation: {
    label: 'Transportation',
    subcategories: ['Fuel', 'Vehicle Maintenance', 'Trailer Rental', 'Shipping', 'Travel'],
    scheduleFLineItem: 'Line 10 - Car and Truck Expenses',
    isDeductible: true,
    aetMapping: 'Marketing and Sales'
  },
  'Show Entries': {
    label: 'Show Entries & Competition',
    subcategories: ['Entry Fees', 'Premium Books', 'Photography', 'Awards', 'Membership'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Leadership and Personal Development'
  },
  Labor: {
    label: 'Labor',
    subcategories: ['Hired Labor', 'Contract Work', 'Professional Training', 'Consulting'],
    scheduleFLineItem: 'Line 8 - Labor Hired',
    isDeductible: true,
    aetMapping: 'Agricultural Production Systems'
  },
  Insurance: {
    label: 'Insurance',
    subcategories: ['Livestock Insurance', 'Property Insurance', 'Liability Insurance', 'Health Insurance'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Risk Management'
  },
  Utilities: {
    label: 'Utilities',
    subcategories: ['Electricity', 'Water', 'Phone', 'Internet', 'Propane/Gas'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Agricultural Production Systems'
  },
  Repairs: {
    label: 'Repairs & Maintenance',
    subcategories: ['Facility Repairs', 'Equipment Repairs', 'Fence Repairs', 'Building Maintenance'],
    scheduleFLineItem: 'Line 11 - Repairs and Maintenance',
    isDeductible: true,
    aetMapping: 'Agricultural Mechanics and Technology'
  },
  'Professional Services': {
    label: 'Professional Services',
    subcategories: ['Accounting', 'Legal', 'Consulting', 'Artificial Insemination', 'Testing'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Record Keeping and Business Management'
  },
  Other: {
    label: 'Other Expenses',
    subcategories: ['Miscellaneous', 'Unexpected', 'One-time', 'Research'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: false,
    aetMapping: 'Record Keeping and Business Management'
  }
};

export interface ExpenseSummary {
  totalExpenses: number;
  totalDeductible: number;
  categorySummary: Record<ExpenseCategory, number>;
  monthlyTrend: Array<{
    month: string;
    total: number;
    deductible: number;
  }>;
  scheduleFSummary: Record<string, number>;
  aetSummary: Record<string, number>;
}

export interface CreateExpenseRequest extends Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {}

// Vendor database for supplier tracking and industry benchmarking
export const COMMON_VENDORS = {
  Feed: [
    'Purina Mills',
    'Cargill',
    'ADM Alliance Nutrition',
    'Kent Feeds',
    'Local Feed Store',
    'Co-op Feed Mill',
    'Nutrena Feeds',
    'MoorMan\'s ShowTec'
  ],
  Veterinary: [
    'Local Veterinarian',
    'Large Animal Clinic',
    'Mobile Vet Service',
    'Emergency Animal Hospital',
    'Livestock Health Services',
    'Ranch Veterinary Services'
  ],
  Equipment: [
    'Tractor Supply Co.',
    'Farm & Ranch Store',
    'Local Equipment Dealer',
    'Online Agricultural Supply',
    'Livestock Equipment Co.',
    'Feed Equipment Specialist'
  ]
};