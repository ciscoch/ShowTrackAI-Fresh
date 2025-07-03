import { create } from 'zustand';
import { Income, CreateIncomeRequest } from '../models/Income';
import { storageService, STORAGE_KEYS } from '../services/StorageService';

interface IncomeState {
  income: Income[];
  selectedIncome: Income | null;
  isLoading: boolean;
  error: string | null;
}

interface IncomeActions {
  addIncome: (income: CreateIncomeRequest) => Promise<void>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  selectIncome: (income: Income | null) => void;
  loadIncome: () => Promise<void>;
  saveIncome: () => Promise<void>;
  clearIncome: () => void;
}

type IncomeStore = IncomeState & IncomeActions;

export const useIncomeStore = create<IncomeStore>((set, get) => ({
  income: [],
  selectedIncome: null,
  isLoading: false,
  error: null,

  addIncome: async (request: CreateIncomeRequest) => {
    const newIncome: Income = {
      id: Date.now().toString(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      income: [...state.income, newIncome],
      error: null,
    }));
    
    try {
      await get().saveIncome();
    } catch (error) {
      set({ error: 'Failed to save income' });
    }
  },

  updateIncome: async (id: string, updates: Partial<Income>) => {
    set((state) => ({
      income: state.income.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
      error: null,
    }));
    
    try {
      await get().saveIncome();
    } catch (error) {
      set({ error: 'Failed to update income' });
    }
  },

  deleteIncome: async (id: string) => {
    set((state) => ({
      income: state.income.filter((item) => item.id !== id),
      selectedIncome: state.selectedIncome?.id === id ? null : state.selectedIncome,
      error: null,
    }));
    
    try {
      await get().saveIncome();
    } catch (error) {
      set({ error: 'Failed to delete income' });
    }
  },

  selectIncome: (income: Income | null) => {
    set({ selectedIncome: income });
  },

  loadIncome: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedIncome = await storageService.loadData<Income[]>(STORAGE_KEYS.INCOME);
      
      if (savedIncome) {
        const incomeWithDates = savedIncome.map(item => ({
          ...item,
          date: new Date(item.date),
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));
        
        set({ income: incomeWithDates, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to load income', isLoading: false });
    }
  },

  saveIncome: async () => {
    try {
      const { income } = get();
      await storageService.saveData(STORAGE_KEYS.INCOME, income);
    } catch (error) {
      set({ error: 'Failed to save income' });
    }
  },

  clearIncome: () => {
    set({ income: [], selectedIncome: null, error: null });
    get().saveIncome();
  },
}));