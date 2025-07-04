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
  createdAt: Date;
  updatedAt: Date;
  userId: string;
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