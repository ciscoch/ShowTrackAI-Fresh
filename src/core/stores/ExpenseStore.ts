import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Expense, CreateExpenseRequest, ExpenseSummary, EXPENSE_CATEGORIES } from '../models/Expense';
import { storageService, STORAGE_KEYS } from '../services/StorageService';

interface ExpenseState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  isLoading: boolean;
  error: string | null;
  summary: ExpenseSummary | null;
}

interface ExpenseActions {
  addExpense: (expense: CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  selectExpense: (expense: Expense | null) => void;
  getExpenseById: (id: string) => Expense | undefined;
  getExpensesByCategory: (category: string) => Expense[];
  getExpensesByDateRange: (startDate: Date, endDate: Date) => Expense[];
  calculateSummary: () => ExpenseSummary;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearExpenses: () => void;
  loadExpenses: () => Promise<void>;
  saveExpenses: () => Promise<void>;
  exportExpenses: (format: 'csv' | 'json' | 'schedulef') => Promise<string>;
}

type ExpenseStore = ExpenseState & ExpenseActions;

export const useExpenseStore = create<ExpenseStore>()(
  subscribeWithSelector((set, get) => ({
    expenses: [],
    selectedExpense: null,
    isLoading: false,
    error: null,
    summary: null,

    addExpense: async (request: CreateExpenseRequest) => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        ...request,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Auto-populate deductible status and Schedule F line item based on category
      const categoryInfo = EXPENSE_CATEGORIES[request.category];
      newExpense.isDeductible = categoryInfo.isDeductible;
      newExpense.scheduleFLineItem = categoryInfo.scheduleFLineItem;
      newExpense.aetCategory = categoryInfo.aetMapping;

      set((state) => ({
        expenses: [...state.expenses, newExpense],
        error: null,
      }));
      
      // Recalculate summary
      const summary = get().calculateSummary();
      set({ summary });
      
      try {
        await get().saveExpenses();
        console.log('Expense saved successfully:', newExpense.description);
      } catch (error) {
        console.error('Failed to save expense:', error);
        set({ error: 'Failed to save expense to storage' });
      }
    },

    updateExpense: async (id: string, updates: Partial<Expense>) => {
      set((state) => ({
        expenses: state.expenses.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                ...updates,
                updatedAt: new Date(),
              }
            : expense
        ),
        selectedExpense:
          state.selectedExpense?.id === id
            ? { ...state.selectedExpense, ...updates, updatedAt: new Date() }
            : state.selectedExpense,
        error: null,
      }));
      
      // Recalculate summary
      const summary = get().calculateSummary();
      set({ summary });
      
      try {
        await get().saveExpenses();
        console.log('Expense updated successfully');
      } catch (error) {
        console.error('Failed to update expense:', error);
        set({ error: 'Failed to update expense in storage' });
      }
    },

    deleteExpense: async (id: string) => {
      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== id),
        selectedExpense: state.selectedExpense?.id === id ? null : state.selectedExpense,
        error: null,
      }));
      
      // Recalculate summary
      const summary = get().calculateSummary();
      set({ summary });
      
      try {
        await get().saveExpenses();
        console.log('Expense deleted successfully');
      } catch (error) {
        console.error('Failed to delete expense:', error);
        set({ error: 'Failed to delete expense from storage' });
      }
    },

    selectExpense: (expense: Expense | null) => {
      set({ selectedExpense: expense });
    },

    getExpenseById: (id: string) => {
      return get().expenses.find((expense) => expense.id === id);
    },

    getExpensesByCategory: (category: string) => {
      return get().expenses.filter((expense) => expense.category === category);
    },

    getExpensesByDateRange: (startDate: Date, endDate: Date) => {
      return get().expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    },

    calculateSummary: () => {
      const expenses = get().expenses;
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalDeductible = expenses
        .filter(expense => expense.isDeductible)
        .reduce((sum, expense) => sum + expense.amount, 0);

      // Category summary
      const categorySummary: Record<string, number> = {};
      Object.keys(EXPENSE_CATEGORIES).forEach(category => {
        categorySummary[category] = 0;
      });
      
      expenses.forEach(expense => {
        categorySummary[expense.category] = (categorySummary[expense.category] || 0) + expense.amount;
      });

      // Monthly trend (last 12 months)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === date.getFullYear() && 
                 expenseDate.getMonth() === date.getMonth();
        });

        monthlyTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
          deductible: monthExpenses
            .filter(expense => expense.isDeductible)
            .reduce((sum, expense) => sum + expense.amount, 0)
        });
      }

      // Schedule F summary
      const scheduleFSummary: Record<string, number> = {};
      expenses.forEach(expense => {
        if (expense.scheduleFLineItem) {
          scheduleFSummary[expense.scheduleFLineItem] = 
            (scheduleFSummary[expense.scheduleFLineItem] || 0) + expense.amount;
        }
      });

      // AET summary
      const aetSummary: Record<string, number> = {};
      expenses.forEach(expense => {
        if (expense.aetCategory) {
          aetSummary[expense.aetCategory] = 
            (aetSummary[expense.aetCategory] || 0) + expense.amount;
        }
      });

      return {
        totalExpenses,
        totalDeductible,
        categorySummary: categorySummary as Record<any, number>,
        monthlyTrend,
        scheduleFSummary,
        aetSummary
      };
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearExpenses: () => {
      set({
        expenses: [],
        selectedExpense: null,
        summary: null,
        error: null,
      });
      
      get().saveExpenses();
    },

    loadExpenses: async () => {
      try {
        set({ isLoading: true, error: null });
        const savedExpenses = await storageService.loadData<Expense[]>(STORAGE_KEYS.EXPENSES);
        
        if (savedExpenses) {
          const expensesWithDates = savedExpenses.map(expense => ({
            ...expense,
            date: new Date(expense.date),
            createdAt: new Date(expense.createdAt),
            updatedAt: new Date(expense.updatedAt),
          }));
          
          set({ expenses: expensesWithDates, isLoading: false });
          
          // Calculate summary
          const summary = get().calculateSummary();
          set({ summary });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load expenses:', error);
        set({ 
          error: 'Failed to load expenses from storage', 
          isLoading: false 
        });
      }
    },

    saveExpenses: async () => {
      try {
        const { expenses } = get();
        const success = await storageService.saveData(STORAGE_KEYS.EXPENSES, expenses);
        
        if (!success) {
          set({ error: 'Failed to save expenses to storage' });
        }
      } catch (error) {
        console.error('Failed to save expenses:', error);
        set({ error: 'Failed to save expenses to storage' });
      }
    },

    exportExpenses: async (format: 'csv' | 'json' | 'schedulef') => {
      const expenses = get().expenses;
      const summary = get().summary || get().calculateSummary();
      
      switch (format) {
        case 'csv':
          const csvHeaders = 'Date,Description,Amount,Category,Subcategory,Vendor,Deductible,Schedule F Line,AET Category,Notes';
          const csvRows = expenses.map(expense => 
            `${expense.date.toISOString().split('T')[0]},` +
            `"${expense.description}",` +
            `${expense.amount},` +
            `${expense.category},` +
            `"${expense.subcategory || ''}",` +
            `"${expense.vendor || ''}",` +
            `${expense.isDeductible ? 'Yes' : 'No'},` +
            `"${expense.scheduleFLineItem || ''}",` +
            `"${expense.aetCategory || ''}",` +
            `"${expense.notes || ''}"`
          );
          return [csvHeaders, ...csvRows].join('\n');

        case 'json':
          return JSON.stringify({
            expenses,
            summary,
            exportDate: new Date().toISOString(),
            totalRecords: expenses.length
          }, null, 2);

        case 'schedulef':
          let scheduleFReport = 'IRS Schedule F - Profit or Loss From Farming\n\n';
          scheduleFReport += 'EXPENSES:\n';
          Object.entries(summary.scheduleFSummary).forEach(([line, amount]) => {
            scheduleFReport += `${line}: $${amount.toFixed(2)}\n`;
          });
          scheduleFReport += `\nTotal Deductible Expenses: $${summary.totalDeductible.toFixed(2)}\n`;
          scheduleFReport += `Total All Expenses: $${summary.totalExpenses.toFixed(2)}\n`;
          return scheduleFReport;

        default:
          throw new Error('Invalid export format');
      }
    },
  }))
);