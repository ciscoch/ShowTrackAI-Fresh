import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FinancialEntry, Budget, FinancialSummary, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../models/Financial';

interface FinancialStore {
  entries: FinancialEntry[];
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadEntries: () => Promise<void>;
  addEntry: (entry: Omit<FinancialEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<FinancialEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  
  // Budget actions
  createBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Analytics
  getFinancialSummary: (startDate?: Date, endDate?: Date, animals?: any[]) => FinancialSummary;
  getEntriesByCategory: (category: string) => FinancialEntry[];
  getEntriesByAnimal: (animalId: string) => FinancialEntry[];
  getFeedExpenses: () => FinancialEntry[];
  getPredictedIncome: (animals?: any[]) => { amount: number; note: string; breakdown: any[] };
}

const STORAGE_KEY = '@financial_entries';
const BUDGETS_KEY = '@financial_budgets';

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  entries: [],
  budgets: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const [entriesData, budgetsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(BUDGETS_KEY)
      ]);
      
      if (entriesData) {
        const entries = JSON.parse(entriesData);
        // Convert date strings back to Date objects
        entries.forEach((entry: any) => {
          entry.date = new Date(entry.date);
          entry.createdAt = new Date(entry.createdAt);
          entry.updatedAt = new Date(entry.updatedAt);
        });
        set({ entries });
      }
      
      if (budgetsData) {
        const budgets = JSON.parse(budgetsData);
        budgets.forEach((budget: any) => {
          budget.startDate = new Date(budget.startDate);
          budget.endDate = new Date(budget.endDate);
        });
        set({ budgets });
      }
    } catch (error) {
      set({ error: 'Failed to load financial data' });
    } finally {
      set({ isLoading: false });
    }
  },

  addEntry: async (entryData) => {
    const { entries } = get();
    const newEntry: FinancialEntry = {
      ...entryData,
      id: `fin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedEntries = [...entries, newEntry];
    set({ entries: updatedEntries });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      set({ error: 'Failed to save entry' });
      // Revert on error
      set({ entries });
    }
  },

  updateEntry: async (id, updates) => {
    const { entries } = get();
    const updatedEntries = entries.map(entry =>
      entry.id === id
        ? { ...entry, ...updates, updatedAt: new Date() }
        : entry
    );
    
    set({ entries: updatedEntries });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      set({ error: 'Failed to update entry' });
      set({ entries });
    }
  },

  deleteEntry: async (id) => {
    const { entries } = get();
    const updatedEntries = entries.filter(entry => entry.id !== id);
    
    set({ entries: updatedEntries });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      set({ error: 'Failed to delete entry' });
      set({ entries });
    }
  },

  createBudget: async (budgetData) => {
    const { budgets } = get();
    const newBudget: Budget = {
      ...budgetData,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedBudgets = [...budgets, newBudget];
    set({ budgets: updatedBudgets });
    
    try {
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updatedBudgets));
    } catch (error) {
      set({ error: 'Failed to save budget' });
      set({ budgets });
    }
  },

  updateBudget: async (id, updates) => {
    const { budgets } = get();
    const updatedBudgets = budgets.map(budget =>
      budget.id === id ? { ...budget, ...updates } : budget
    );
    
    set({ budgets: updatedBudgets });
    
    try {
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updatedBudgets));
    } catch (error) {
      set({ error: 'Failed to update budget' });
      set({ budgets });
    }
  },

  deleteBudget: async (id) => {
    const { budgets } = get();
    const updatedBudgets = budgets.filter(budget => budget.id !== id);
    
    set({ budgets: updatedBudgets });
    
    try {
      await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updatedBudgets));
    } catch (error) {
      set({ error: 'Failed to delete budget' });
      set({ budgets });
    }
  },

  getPredictedIncome: (animals = []) => {
    // Calculate predicted income based on animals' predicted sale costs
    const animalsWithPredictions = animals.filter(animal => 
      animal.predictedSaleCost && 
      animal.predictedSaleCost > 0
      // Now includes all project types (Market, Breeding, Show, Dairy)
    );
    
    const totalPredictedIncome = animalsWithPredictions.reduce((sum, animal) => 
      sum + (animal.predictedSaleCost || 0), 0
    );
    
    // Create breakdown by species for educational insights
    const breakdown = animalsWithPredictions.reduce((acc, animal) => {
      const species = animal.species;
      if (!acc[species]) {
        acc[species] = { count: 0, totalValue: 0, animals: [] };
      }
      acc[species].count++;
      acc[species].totalValue += animal.predictedSaleCost;
      acc[species].animals.push({
        name: animal.name,
        earTag: animal.earTag,
        projectType: animal.projectType,
        predictedValue: animal.predictedSaleCost,
        acquisitionCost: animal.acquisitionCost,
        potentialProfit: animal.predictedSaleCost - animal.acquisitionCost
      });
      return acc;
    }, {} as Record<string, any>);
    
    // Educational note about break-even analysis for FFA SAE
    const note = animalsWithPredictions.length > 0 
      ? `*Based on predicted sale values for ${animalsWithPredictions.length} ${animalsWithPredictions.length === 1 ? 'animal' : 'animals'}. This projection helps calculate your break-even point and potential profit for your SAE project.`
      : '*Set predicted sale costs for your animals to see projected income and break-even analysis.';
    
    return {
      amount: totalPredictedIncome,
      note,
      breakdown: Object.entries(breakdown).map(([species, data]) => ({
        species,
        ...data
      }))
    };
  },

  getFinancialSummary: (startDate, endDate, animals = []) => {
    const { entries } = get();
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), 0, 1); // Default to start of year
    const end = endDate || now;
    
    const filteredEntries = entries.filter(entry => 
      entry.date >= start && entry.date <= end
    );
    
    const actualIncome = filteredEntries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Get predicted income from animal sale projections
    const predictedIncome = get().getPredictedIncome(animals);
    const totalIncome = actualIncome + predictedIncome.amount;
    
    const totalExpenses = filteredEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    
    // Feed analytics
    const feedEntries = filteredEntries.filter(e => 
      e.category === 'feed_supplies' || e.feedId
    );
    
    const totalFeedCost = feedEntries.reduce((sum, e) => sum + e.amount, 0);
    
    // Get feed costs by brand from journal feed data integration
    const feedCostByBrand: Record<string, number> = {};
    const feedCostByType: Record<string, number> = {};
    
    feedEntries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => {
          if (tag.startsWith('brand:')) {
            const brand = tag.replace('brand:', '');
            feedCostByBrand[brand] = (feedCostByBrand[brand] || 0) + entry.amount;
          }
          if (tag.startsWith('type:')) {
            const type = tag.replace('type:', '');
            feedCostByType[type] = (feedCostByType[type] || 0) + entry.amount;
          }
        });
      }
    });
    
    // Monthly trend
    const monthlyTrend: Array<{month: string; income: number; expenses: number; profit: number}> = [];
    const months = 12;
    
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthEntries = entries.filter(e => 
        e.date >= monthStart && e.date <= monthEnd
      );
      
      const monthIncome = monthEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const monthExpenses = monthEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
      
      monthlyTrend.unshift({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      });
    }
    
    // Top expense categories
    const expenseByCategory: Record<string, number> = {};
    filteredEntries
      .filter(e => e.type === 'expense')
      .forEach(entry => {
        expenseByCategory[entry.category] = (expenseByCategory[entry.category] || 0) + entry.amount;
      });
    
    const topExpenseCategories = Object.entries(expenseByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // AET Financial Skills scoring
    const hasRecords = entries.length > 0;
    const hasBudgets = get().budgets.length > 0;
    const categoriesUsed = new Set(entries.map(e => e.category)).size;
    const hasDescriptions = entries.filter(e => e.description.length > 20).length / entries.length;
    
    return {
      totalIncome,
      actualIncome,
      predictedIncome,
      totalExpenses,
      netProfit,
      feedCostPerAnimal: 0, // Would need animal count integration
      profitMargin,
      topExpenseCategories,
      monthlyTrend,
      feedAnalytics: {
        totalFeedCost,
        feedCostByBrand,
        feedCostByType,
        feedEfficiency: 0, // Would need weight gain data
        feedCostTrend: monthlyTrend.map(m => ({
          month: m.month,
          cost: feedEntries
            .filter(e => e.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) === m.month)
            .reduce((sum, e) => sum + e.amount, 0)
        }))
      },
      aetFinancialSkills: {
        recordKeeping: hasRecords ? Math.min(100, entries.length * 2) : 0,
        budgeting: hasBudgets ? 80 : 0,
        profitAnalysis: categoriesUsed >= 5 ? 90 : categoriesUsed * 18,
        marketingSkills: hasDescriptions > 0.7 ? 85 : hasDescriptions * 100
      }
    };
  },

  getEntriesByCategory: (category) => {
    return get().entries.filter(entry => entry.category === category);
  },

  getEntriesByAnimal: (animalId) => {
    return get().entries.filter(entry => entry.animalId === animalId);
  },

  getFeedExpenses: () => {
    return get().entries.filter(entry => 
      entry.category === 'feed_supplies' || entry.feedId
    );
  }
}));