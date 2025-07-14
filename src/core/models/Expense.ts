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
  // Multi-category receipt processing
  receiptData?: ReceiptData;
  lineItems?: ExpenseLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Individual line item from receipt breakdown
export interface ExpenseLineItem {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  subcategory?: string;
  quantity?: number;
  unitPrice?: number;
  unitOfMeasure?: string;
  feedWeight?: number; // Weight in pounds for feed items
  feedType?: FeedType;
  confidence?: number; // AI confidence score (0-1)
  rawText?: string; // Original receipt text
}

// Receipt processing data
export interface ReceiptData {
  id: string;
  originalImageUrl: string;
  processedImageUrl?: string;
  ocrText?: string;
  vendor: string;
  totalAmount: number;
  taxAmount?: number;
  date: Date;
  receiptNumber?: string;
  paymentMethod?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiConfidence: number; // Overall AI confidence score
  manualReview?: boolean; // Flagged for manual review
  processedAt?: Date;
  errorMessage?: string;
}

// Feed types for detailed analysis
export interface FeedType {
  id: string;
  name: string;
  category: 'grain' | 'pellets' | 'textured' | 'supplement' | 'mineral' | 'hay' | 'other';
  proteinContent?: number;
  species: string[];
  brand?: string;
  commonNames: string[]; // For AI matching
  pricePerPound?: number;
  nutritionalData?: {
    protein: number;
    fat: number;
    fiber: number;
    tdn?: number; // Total Digestible Nutrients
  };
}

export type ExpenseCategory = 
  | 'feed_supplies'
  | 'veterinary_health'
  | 'supplies'
  | 'equipment'
  | 'transportation'
  | 'show_entries'
  | 'labor'
  | 'insurance'
  | 'utilities'
  | 'repairs_maintenance'
  | 'professional_services'
  | 'other';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  scheduleFLineItem: string;
  isDeductible: boolean;
  aetMapping?: string;
  aiKeywords: string[]; // For AI categorization
}> = {
  feed_supplies: {
    id: 'feed_supplies',
    name: 'Feed & Nutrition',
    icon: '🌾',
    subcategories: ['Grain', 'Hay/Forage', 'Supplements', 'Minerals', 'Pasture Rent'],
    scheduleFLineItem: 'Line 5 - Feed',
    isDeductible: true,
    aetMapping: 'Feed and Nutrition Management',
    aiKeywords: ['feed', 'grain', 'hay', 'alfalfa', 'corn', 'oats', 'supplement', 'mineral', 'pellet', 'range cube', 'protein', 'creep feed', 'forage', 'pasture', 'timothy', 'barley', 'wheat', 'milo', 'sorghum']
  },
  veterinary_health: {
    id: 'veterinary_health',
    name: 'Veterinary & Health',
    icon: '🏥',
    subcategories: ['Vaccinations', 'Medications', 'Vet Visits', 'Health Testing', 'Emergency Care'],
    scheduleFLineItem: 'Line 6 - Veterinary',
    isDeductible: true,
    aetMapping: 'Animal Health Management',
    aiKeywords: ['veterinary', 'vet', 'vaccine', 'vaccination', 'medication', 'antibiotic', 'treatment', 'health', 'medical', 'doctor', 'clinic', 'surgery', 'examination', 'testing', 'lab work', 'prescription']
  },
  supplies: {
    id: 'supplies',
    name: 'Supplies',
    icon: '🧰',
    subcategories: ['Bedding', 'Cleaning Supplies', 'Show Supplies', 'Grooming', 'Tags/ID'],
    scheduleFLineItem: 'Line 7 - Supplies',
    isDeductible: true,
    aetMapping: 'Record Keeping and Business Management',
    aiKeywords: ['bedding', 'shavings', 'straw', 'cleaning', 'disinfectant', 'soap', 'shampoo', 'grooming', 'brush', 'comb', 'clippers', 'tags', 'ear tags', 'identification', 'supplies', 'equipment']
  },
  equipment: {
    id: 'equipment',
    name: 'Equipment',
    icon: '⚙️',
    subcategories: ['Feeders', 'Waterers', 'Fencing', 'Gates', 'Tools', 'Scales'],
    scheduleFLineItem: 'Line 13 - Equipment (Depreciation)',
    isDeductible: true,
    aetMapping: 'Agricultural Mechanics and Technology',
    aiKeywords: ['feeder', 'waterer', 'fence', 'fencing', 'gate', 'panel', 'scale', 'tool', 'equipment', 'bucket', 'trough', 'post', 'wire', 'hardware', 'shovel', 'rake', 'pitchfork']
  },
  transportation: {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚛',
    subcategories: ['Fuel', 'Vehicle Maintenance', 'Trailer Rental', 'Shipping', 'Travel'],
    scheduleFLineItem: 'Line 10 - Car and Truck Expenses',
    isDeductible: true,
    aetMapping: 'Marketing and Sales',
    aiKeywords: ['fuel', 'gas', 'gasoline', 'diesel', 'transportation', 'shipping', 'delivery', 'freight', 'trailer', 'truck', 'vehicle', 'maintenance', 'repair', 'oil change', 'tires', 'travel']
  },
  show_entries: {
    id: 'show_entries',
    name: 'Show Entries & Competition',
    icon: '🏆',
    subcategories: ['Entry Fees', 'Premium Books', 'Photography', 'Awards', 'Membership'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Leadership and Personal Development',
    aiKeywords: ['show', 'competition', 'entry fee', 'premium', 'fair', 'exhibition', 'contest', 'judging', 'award', 'trophy', 'ribbon', 'membership', 'registration', 'photography', 'pictures']
  },
  labor: {
    id: 'labor',
    name: 'Labor',
    icon: '👷',
    subcategories: ['Hired Labor', 'Contract Work', 'Professional Training', 'Consulting'],
    scheduleFLineItem: 'Line 8 - Labor Hired',
    isDeductible: true,
    aetMapping: 'Agricultural Production Systems',
    aiKeywords: ['labor', 'worker', 'employee', 'hired', 'contract', 'consulting', 'training', 'professional', 'service', 'work', 'help', 'assistance', 'wages', 'salary', 'hourly']
  },
  insurance: {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    subcategories: ['Livestock Insurance', 'Property Insurance', 'Liability Insurance', 'Health Insurance'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Risk Management',
    aiKeywords: ['insurance', 'coverage', 'policy', 'premium', 'liability', 'property', 'livestock', 'protection', 'risk', 'claim', 'deductible']
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    icon: '💡',
    subcategories: ['Electricity', 'Water', 'Phone', 'Internet', 'Propane/Gas'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Agricultural Production Systems',
    aiKeywords: ['electricity', 'electric', 'power', 'water', 'phone', 'internet', 'wifi', 'propane', 'gas', 'utility', 'utilities', 'bill', 'service', 'connection']
  },
  repairs_maintenance: {
    id: 'repairs_maintenance',
    name: 'Repairs & Maintenance',
    icon: '🔧',
    subcategories: ['Facility Repairs', 'Equipment Repairs', 'Fence Repairs', 'Building Maintenance'],
    scheduleFLineItem: 'Line 11 - Repairs and Maintenance',
    isDeductible: true,
    aetMapping: 'Agricultural Mechanics and Technology',
    aiKeywords: ['repair', 'maintenance', 'fix', 'service', 'parts', 'replacement', 'building', 'facility', 'barn', 'shed', 'roof', 'plumbing', 'electrical', 'hvac', 'ventilation']
  },
  professional_services: {
    id: 'professional_services',
    name: 'Professional Services',
    icon: '📋',
    subcategories: ['Accounting', 'Legal', 'Consulting', 'Artificial Insemination', 'Testing'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: true,
    aetMapping: 'Record Keeping and Business Management',
    aiKeywords: ['accounting', 'legal', 'consulting', 'professional', 'service', 'advice', 'consultation', 'artificial insemination', 'breeding', 'testing', 'analysis', 'audit', 'bookkeeping']
  },
  other: {
    id: 'other',
    name: 'Other Expenses',
    icon: '📦',
    subcategories: ['Miscellaneous', 'Unexpected', 'One-time', 'Research'],
    scheduleFLineItem: 'Line 15 - Other Expenses',
    isDeductible: false,
    aetMapping: 'Record Keeping and Business Management',
    aiKeywords: ['miscellaneous', 'other', 'unexpected', 'research', 'one-time', 'various', 'general', 'misc']
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
  // Multi-category receipt analytics
  receiptSummary: {
    totalReceipts: number;
    totalLineItems: number;
    averageItemsPerReceipt: number;
    aiProcessingAccuracy: number;
    manualReviewRate: number;
  };
  feedAnalytics: {
    totalFeedExpenses: number;
    totalFeedWeight: number;
    averageCostPerPound: number;
    feedTypeBreakdown: Record<string, { weight: number; cost: number }>;
    topFeedBrands: Array<{ brand: string; cost: number; weight: number }>;
  };
}

export interface CreateExpenseRequest extends Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {}

// AI Receipt Processing Request
export interface ProcessReceiptRequest {
  imageUrl: string;
  userId: string;
  animalId?: string;
  expectedCategories?: ExpenseCategory[];
  processingOptions?: {
    extractFeedWeights: boolean;
    categorizeLineItems: boolean;
    validateWithDatabase: boolean;
    confidenceThreshold: number;
  };
}

// AI Receipt Processing Response
export interface ProcessReceiptResponse {
  receiptData: ReceiptData;
  lineItems: ExpenseLineItem[];
  suggestedExpenses: CreateExpenseRequest[];
  processingMetrics: {
    totalProcessingTime: number;
    ocrConfidence: number;
    categorizationConfidence: number;
    itemsRequiringReview: number;
  };
  warnings?: string[];
  feedAnalysis?: {
    totalFeedWeight: number;
    estimatedFeedCost: number;
    feedTypes: Array<{
      name: string;
      weight: number;
      cost: number;
      category: string;
    }>;
    feedEfficiencyPredictions?: {
      estimatedDailyConsumption: number;
      daysOfFeedSupply: number;
      costPerDay: number;
    };
  };
}

// Vendor database for supplier tracking and industry benchmarking
export const COMMON_VENDORS = {
  feed_supplies: [
    'Purina Mills',
    'Cargill',
    'ADM Alliance Nutrition',
    'Kent Feeds',
    'Local Feed Store',
    'Co-op Feed Mill',
    'Nutrena Feeds',
    'MoorMan\'s ShowTec',
    'Tractor Supply Co.',
    'Farm & Fleet',
    'Rural King',
    'Southern States',
    'Nutrena',
    'Jacoby Feed'
  ],
  veterinary_health: [
    'Local Veterinarian',
    'Large Animal Clinic',
    'Mobile Vet Service',
    'Emergency Animal Hospital',
    'Livestock Health Services',
    'Ranch Veterinary Services',
    'Valley Vet',
    'Jeffers Pet',
    'PBS Animal Health'
  ],
  equipment: [
    'Tractor Supply Co.',
    'Farm & Ranch Store',
    'Local Equipment Dealer',
    'Online Agricultural Supply',
    'Livestock Equipment Co.',
    'Feed Equipment Specialist',
    'Rural King',
    'Farm & Fleet',
    'Murdoch\'s Ranch & Home'
  ]
};

// Feed product patterns for AI recognition
export const FEED_PRODUCT_PATTERNS = {
  grain: [
    /corn/i, /oats/i, /barley/i, /wheat/i, /milo/i, /sorghum/i,
    /cracked corn/i, /whole corn/i, /rolled oats/i
  ],
  pellets: [
    /pellet/i, /pelleted/i, /complete feed/i, /range cubes/i,
    /protein pellets/i, /cattle pellets/i, /sheep pellets/i
  ],
  textured: [
    /textured/i, /sweet feed/i, /mixed feed/i, /show feed/i,
    /performance feed/i, /developer/i, /grower/i
  ],
  supplement: [
    /supplement/i, /protein tub/i, /mineral block/i, /salt block/i,
    /vitamin/i, /probiotic/i, /creep feed/i
  ],
  hay: [
    /hay/i, /alfalfa/i, /timothy/i, /grass hay/i, /square bale/i,
    /round bale/i, /baled hay/i, /forage/i
  ]
};

// Feed weight extraction patterns
export const FEED_WEIGHT_PATTERNS = [
  /(\d+)\s*lb/i,
  /(\d+)\s*lbs/i,
  /(\d+)\s*#/i,
  /(\d+)\s*pound/i,
  /(\d+)\s*pounds/i,
  /(\d+)\s*kg/i,
  /(\d+)\s*ton/i,
  /(\d+)\s*tons/i,
  /bag\s*(\d+)/i,
  /sack\s*(\d+)/i
];