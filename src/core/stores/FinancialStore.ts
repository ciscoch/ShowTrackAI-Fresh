import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FinancialEntry, Budget, FinancialSummary, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../models/Financial';
import { getFinancialService } from '../services/adapters/ServiceFactory';
import { Expense, Income, CreateExpenseRequest, CreateIncomeRequest } from '../models';
import { useSupabaseBackend } from '../config/environment';

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
      const isBackend = useSupabaseBackend();
      console.log('💰 FinancialStore: Loading entries, backend:', isBackend);
      
      if (isBackend) {
        // Load from Supabase
        const financialService = getFinancialService();
        const [expenses, income, budgets] = await Promise.all([
          financialService.getExpenses(),
          financialService.getIncome(),
          financialService.getBudgets()
        ]);
        
        // Convert Supabase expenses/income to FinancialEntry format
        const entries: FinancialEntry[] = [
          ...expenses.map((expense: Expense): FinancialEntry => ({
            id: expense.id,
            type: 'expense',
            category: expense.category,
            subcategory: expense.subcategory,
            amount: expense.amount,
            description: expense.description,
            vendor: expense.vendor,
            receiptPhoto: expense.receiptPhoto,
            animalId: expense.animalId,
            date: expense.date,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
            notes: expense.notes,
            tags: [],
            paymentMethod: expense.paymentMethod || 'Cash',
            isDeductible: expense.isDeductible || false,
            location: expense.location,
            projectPhase: expense.projectPhase
          })),
          ...income.map((incomeItem: Income): FinancialEntry => ({
            id: incomeItem.id,
            type: 'income',
            category: incomeItem.category,
            subcategory: incomeItem.subcategory,
            amount: incomeItem.amount,
            description: incomeItem.description,
            vendor: incomeItem.source,
            animalId: incomeItem.animalId,
            date: incomeItem.date,
            createdAt: incomeItem.createdAt,
            updatedAt: incomeItem.updatedAt,
            notes: incomeItem.notes,
            tags: [],
            paymentMethod: incomeItem.paymentMethod || 'Cash',
            projectPhase: incomeItem.projectPhase
          }))
        ];
        
        console.log('📊 Loaded from Supabase:', entries.length, 'entries,', budgets.length, 'budgets');
        set({ entries, budgets });
      } else {
        // Load from AsyncStorage (legacy local storage)
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
        
        console.log('📁 Loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
      set({ error: 'Failed to load financial data' });
    } finally {
      set({ isLoading: false });
    }
  },

  addEntry: async (entryData) => {
    set({ isLoading: true });
    try {
      const isBackend = useSupabaseBackend();
      
      if (isBackend) {
        const financialService = getFinancialService();
        
        if (entryData.type === 'expense') {
          const expenseRequest: CreateExpenseRequest = {
            description: entryData.description,
            amount: entryData.amount,
            date: entryData.date,
            category: entryData.category,
            subcategory: entryData.subcategory,
            vendor: entryData.vendor,
            receiptPhoto: entryData.receiptPhoto,
            animalId: entryData.animalId,
            paymentMethod: entryData.paymentMethod || 'Cash',
            isDeductible: entryData.isDeductible || false,
            location: entryData.location,
            projectPhase: entryData.projectPhase,
            notes: entryData.notes
          };
          
          // Check if SupabaseFinancialAdapter has enhanced method for business intelligence
          const financialAdapter = financialService as any;
          let newExpense;
          
          if (entryData.receiptMetadata?.businessIntelligence || entryData.receiptMetadata?.vendorIntelligence) {
            console.log('💡 Saving expense with business intelligence data:', {
              businessIntelligence: entryData.receiptMetadata.businessIntelligence,
              vendorIntelligence: entryData.receiptMetadata.vendorIntelligence
            });
            
            // Use enhanced method if available
            if (financialAdapter.addExpenseWithIntelligence) {
              newExpense = await financialAdapter.addExpenseWithIntelligence(
                expenseRequest,
                entryData.receiptMetadata.businessIntelligence,
                entryData.receiptMetadata.vendorIntelligence
              );
            } else {
              // Fallback to standard method
              newExpense = await financialService.addExpense(expenseRequest);
            }
          } else {
            newExpense = await financialService.addExpense(expenseRequest);
          }
          const newEntry: FinancialEntry = {
            id: newExpense.id,
            type: 'expense',
            category: newExpense.category,
            subcategory: newExpense.subcategory,
            amount: newExpense.amount,
            description: newExpense.description,
            vendor: newExpense.vendor,
            receiptPhoto: newExpense.receiptPhoto,
            animalId: newExpense.animalId,
            date: newExpense.date,
            createdAt: newExpense.createdAt,
            updatedAt: newExpense.updatedAt,
            notes: newExpense.notes,
            tags: [],
            paymentMethod: newExpense.paymentMethod || 'Cash',
            isDeductible: newExpense.isDeductible || false,
            location: newExpense.location,
            projectPhase: newExpense.projectPhase
          };
          
          const { entries } = get();
          set({ entries: [...entries, newEntry] });
        } else if (entryData.type === 'income') {
          const incomeRequest: CreateIncomeRequest = {
            description: entryData.description,
            amount: entryData.amount,
            date: entryData.date,
            source: entryData.vendor || 'Unknown',
            category: entryData.category,
            subcategory: entryData.subcategory,
            animalId: entryData.animalId,
            paymentMethod: entryData.paymentMethod || 'Cash',
            projectPhase: entryData.projectPhase,
            notes: entryData.notes
          };
          
          const newIncome = await financialService.addIncome(incomeRequest);
          const newEntry: FinancialEntry = {
            id: newIncome.id,
            type: 'income',
            category: newIncome.category,
            subcategory: newIncome.subcategory,
            amount: newIncome.amount,
            description: newIncome.description,
            vendor: newIncome.source,
            animalId: newIncome.animalId,
            date: newIncome.date,
            createdAt: newIncome.createdAt,
            updatedAt: newIncome.updatedAt,
            notes: newIncome.notes,
            tags: [],
            paymentMethod: newIncome.paymentMethod || 'Cash',
            projectPhase: newIncome.projectPhase
          };
          
          const { entries } = get();
          set({ entries: [...entries, newEntry] });
        }
      } else {
        // Local storage fallback
        const { entries } = get();
        const newEntry: FinancialEntry = {
          ...entryData,
          id: `fin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedEntries = [...entries, newEntry];
        set({ entries: updatedEntries });
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      }
    } catch (error) {
      console.error('Failed to add entry:', error);
      set({ error: 'Failed to save entry' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateEntry: async (id, updates) => {
    set({ isLoading: true });
    try {
      const isBackend = useSupabaseBackend();
      const { entries } = get();
      
      if (isBackend) {
        const financialService = getFinancialService();
        const existingEntry = entries.find(e => e.id === id);
        
        if (existingEntry?.type === 'expense') {
          await financialService.updateExpense(id, updates);
        }
        // Note: Income updates would need to be added to SupabaseFinancialAdapter
        
        // Update local state
        const updatedEntries = entries.map(entry =>
          entry.id === id
            ? { ...entry, ...updates, updatedAt: new Date() }
            : entry
        );
        set({ entries: updatedEntries });
      } else {
        // Local storage fallback
        const updatedEntries = entries.map(entry =>
          entry.id === id
            ? { ...entry, ...updates, updatedAt: new Date() }
            : entry
        );
        
        set({ entries: updatedEntries });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
      set({ error: 'Failed to update entry' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true });
    try {
      const isBackend = useSupabaseBackend();
      const { entries } = get();
      
      if (isBackend) {
        const financialService = getFinancialService();
        const existingEntry = entries.find(e => e.id === id);
        
        if (existingEntry?.type === 'expense') {
          await financialService.deleteExpense(id);
        }
        // Note: Income deletion would need to be added to SupabaseFinancialAdapter
        
        // Update local state
        const updatedEntries = entries.filter(entry => entry.id !== id);
        set({ entries: updatedEntries });
      } else {
        // Local storage fallback
        const updatedEntries = entries.filter(entry => entry.id !== id);
        set({ entries: updatedEntries });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      set({ error: 'Failed to delete entry' });
    } finally {
      set({ isLoading: false });
    }
  },

  createBudget: async (budgetData) => {
    set({ isLoading: true });
    try {
      const isBackend = useSupabaseBackend();
      
      if (isBackend) {
        const financialService = getFinancialService();
        const newBudget = await financialService.createBudget(budgetData);
        
        const { budgets } = get();
        set({ budgets: [...budgets, newBudget] });
      } else {
        // Local storage fallback
        const { budgets } = get();
        const newBudget: Budget = {
          ...budgetData,
          id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        const updatedBudgets = [...budgets, newBudget];
        set({ budgets: updatedBudgets });
        await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updatedBudgets));
      }
    } catch (error) {
      console.error('Failed to create budget:', error);
      set({ error: 'Failed to save budget' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateBudget: async (id, updates) => {
    set({ isLoading: true });
    try {
      const isBackend = useSupabaseBackend();
      const { budgets } = get();
      
      if (isBackend) {
        // Note: Budget updates would need to be added to SupabaseFinancialAdapter
        console.log('Budget updates not yet implemented for Supabase backend');
      }
      
      // Update local state regardless of backend
      const updatedBudgets = budgets.map(budget =>
        budget.id === id ? { ...budget, ...updates } : budget
      );
      set({ budgets: updatedBudgets });
      
      if (!isBackend) {
        await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updatedBudgets));
      }
    } catch (error) {
      console.error('Failed to update budget:', error);
      set({ error: 'Failed to update budget' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true });
    try {
      const isBackend = useSupabaseBackend();
      const { budgets } = get();
      
      if (isBackend) {
        // Note: Budget deletion would need to be added to SupabaseFinancialAdapter
        console.log('Budget deletion not yet implemented for Supabase backend');
      }
      
      // Update local state regardless of backend
      const updatedBudgets = budgets.filter(budget => budget.id !== id);
      set({ budgets: updatedBudgets });
      
      if (!isBackend) {
        await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(updatedBudgets));
      }
    } catch (error) {
      console.error('Failed to delete budget:', error);
      set({ error: 'Failed to delete budget' });
    } finally {
      set({ isLoading: false });
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