export interface FinancialEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  date: Date;
  description: string;
  animalId?: string;
  feedId?: string;
  aetSkills?: string[];
  saeProject?: string;
  tags?: string[];
  attachments?: string[];
  vendor?: string;
  vendorLocation?: string;
  receiptItems?: ReceiptLineItem[];
  receiptMetadata?: ReceiptMetadata;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ReceiptLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  feedWeight?: number;
}

export interface ReceiptMetadata {
  receiptNumber?: string;
  processingMethod: 'manual' | 'ai_vision' | 'ai_ocr';
  processingConfidence?: number;
  originalImageUrl?: string;
  feedAnalysis?: {
    totalFeedWeight: number;
    feedTypes: string[];
    estimatedDaysSupply: number;
  };
  // Enhanced fields for business intelligence (internal use)
  businessIntelligence?: BusinessIntelligenceData;
  vendorIntelligence?: VendorIntelligenceData;
}

// Business Intelligence Data (Internal Only)
export interface BusinessIntelligenceData {
  feed_type?: string; // e.g., "growth/development"
  brand_names?: string[]; // e.g., ["JACOBY'S"]
  equipment_purchased?: string[]; // e.g., ["FENCE FEEDER 16\"", "SCOOP,ENCLOSED 3QT"]
  seasonal_indicator?: string; // extracted from date
  purchase_pattern?: string; // frequency analysis
  supplier_loyalty?: string; // repeat vendor tracking
  
  // Monetization Opportunities
  affiliate_potential?: string[]; // brands for partnerships
  price_benchmarking?: PriceBenchmark[];
  bulk_purchase_indicators?: BulkIndicator[];
  equipment_lifecycle?: EquipmentData[];
  regional_suppliers?: RegionalData[];
}

// Enhanced Vendor Data (Internal Only)
export interface VendorIntelligenceData {
  vendor_address?: string;
  vendor_phone?: string;
  vendor_website?: string;
  vendor_category?: string;
  invoice_number?: string;
  cashier_id?: string;
  employee_name?: string;
  payment_method?: string;
  transaction_time?: string;
  tax_amount?: number;
  tax_rate?: number;
  item_count?: number;
}

// Supporting interfaces for business intelligence
export interface PriceBenchmark {
  item: string;
  price: number;
  vendor: string;
  region: string;
  date: Date;
}

export interface BulkIndicator {
  item: string;
  quantity: number;
  unit_price: number;
  bulk_threshold: number;
  savings_potential: number;
}

export interface EquipmentData {
  equipment_type: string;
  brand: string;
  purchase_date: Date;
  expected_lifecycle: number; // months
  replacement_indicator?: boolean;
}

export interface RegionalData {
  vendor_name: string;
  location: string;
  coverage_area: string;
  service_quality_score?: number;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  subcategories?: string[];
  aetAlignment?: string[];
}

export const EXPENSE_CATEGORIES: FinancialCategory[] = [
  {
    id: 'feed_supplies',
    name: 'Feed & Supplies',
    type: 'expense',
    icon: '🌾',
    subcategories: ['Grain', 'Hay', 'Supplements', 'Minerals', 'Bedding'],
    aetAlignment: ['AS.03.01', 'AS.03.02'] // Animal Nutrition standards
  },
  {
    id: 'veterinary',
    name: 'Veterinary Care',
    type: 'expense',
    icon: '🏥',
    subcategories: ['Routine Care', 'Emergency', 'Vaccinations', 'Medications'],
    aetAlignment: ['AS.02.01', 'AS.02.02'] // Animal Health standards
  },
  {
    id: 'equipment',
    name: 'Equipment & Tools',
    type: 'expense',
    icon: '🔧',
    subcategories: ['Purchase', 'Maintenance', 'Repair', 'Fuel'],
    aetAlignment: ['PST.03.01', 'PST.03.02'] // Power & Technical Systems
  },
  {
    id: 'show_expenses',
    name: 'Show & Competition',
    type: 'expense',
    icon: '🏆',
    subcategories: ['Entry Fees', 'Travel', 'Lodging', 'Show Supplies'],
    aetAlignment: ['AS.01.01'] // Animal Systems
  },
  {
    id: 'facilities',
    name: 'Facilities & Infrastructure',
    type: 'expense',
    icon: '🏠',
    subcategories: ['Utilities', 'Repairs', 'Improvements', 'Rent'],
    aetAlignment: ['PST.01.01'] // Structural Systems
  },
  {
    id: 'breeding',
    name: 'Breeding & Genetics',
    type: 'expense',
    icon: '🧬',
    subcategories: ['AI Services', 'Registration', 'Testing'],
    aetAlignment: ['AS.04.01', 'AS.04.02'] // Animal Reproduction
  }
];

export const INCOME_CATEGORIES: FinancialCategory[] = [
  {
    id: 'animal_sales',
    name: 'Animal Sales',
    type: 'income',
    icon: '💵',
    subcategories: ['Market Animals', 'Breeding Stock', 'Show Animals'],
    aetAlignment: ['ABM.01.01', 'ABM.01.02'] // Agribusiness Management
  },
  {
    id: 'product_sales',
    name: 'Product Sales',
    type: 'income',
    icon: '📦',
    subcategories: ['Eggs', 'Milk', 'Meat', 'Other Products'],
    aetAlignment: ['ABM.02.01'] // Marketing
  },
  {
    id: 'show_winnings',
    name: 'Show Winnings',
    type: 'income',
    icon: '🥇',
    subcategories: ['Prize Money', 'Premiums', 'Scholarships'],
    aetAlignment: ['AS.01.01'] // Animal Systems
  },
  {
    id: 'services',
    name: 'Services',
    type: 'income',
    icon: '🤝',
    subcategories: ['Boarding', 'Training', 'Consultation'],
    aetAlignment: ['ABM.03.01'] // Business Operations
  }
];

export interface FinancialSummary {
  totalIncome: number;
  actualIncome: number;
  predictedIncome: {
    amount: number;
    note: string;
    breakdown: Array<{
      species: string;
      count: number;
      totalValue: number;
      animals: Array<{
        name: string;
        earTag: string;
        predictedValue: number;
        acquisitionCost: number;
        potentialProfit: number;
      }>;
    }>;
  };
  totalExpenses: number;
  netProfit: number;
  feedCostPerAnimal: number;
  profitMargin: number;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
  feedAnalytics: {
    totalFeedCost: number;
    feedCostByBrand: Record<string, number>;
    feedCostByType: Record<string, number>;
    feedEfficiency: number; // cost per pound of gain
    feedCostTrend: Array<{
      month: string;
      cost: number;
    }>;
  };
  aetFinancialSkills: {
    recordKeeping: number;
    budgeting: number;
    profitAnalysis: number;
    marketingSkills: number;
  };
}

export interface Budget {
  id: string;
  name: string;
  period: 'monthly' | 'quarterly' | 'annual';
  startDate: Date;
  endDate: Date;
  categories: Array<{
    categoryId: string;
    budgetedAmount: number;
    actualAmount?: number;
  }>;
  notes?: string;
  userId: string;
}