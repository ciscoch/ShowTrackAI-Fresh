import { create } from 'zustand';
import { Journal, CreateJournalRequest } from '../models/Journal';
import { storageService, STORAGE_KEYS } from '../services/StorageService';

interface JournalState {
  entries: Journal[];
  selectedEntry: Journal | null;
  isLoading: boolean;
  error: string | null;
}

interface JournalActions {
  addEntry: (entry: CreateJournalRequest) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Journal>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  selectEntry: (entry: Journal | null) => void;
  loadEntries: () => Promise<void>;
  saveEntries: () => Promise<void>;
  clearEntries: () => void;
}

type JournalStore = JournalState & JournalActions;

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  selectedEntry: null,
  isLoading: false,
  error: null,

  addEntry: async (request: CreateJournalRequest) => {
    const newEntry: Journal = {
      id: Date.now().toString(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      entries: [...state.entries, newEntry],
      error: null,
    }));
    
    try {
      await get().saveEntries();
    } catch (error) {
      set({ error: 'Failed to save journal entry' });
    }
  },

  updateEntry: async (id: string, updates: Partial<Journal>) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
      ),
      error: null,
    }));
    
    try {
      await get().saveEntries();
    } catch (error) {
      set({ error: 'Failed to update journal entry' });
    }
  },

  deleteEntry: async (id: string) => {
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
      selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry,
      error: null,
    }));
    
    try {
      await get().saveEntries();
    } catch (error) {
      set({ error: 'Failed to delete journal entry' });
    }
  },

  selectEntry: (entry: Journal | null) => {
    set({ selectedEntry: entry });
  },

  loadEntries: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedEntries = await storageService.loadData<Journal[]>(STORAGE_KEYS.JOURNAL);
      
      if (savedEntries) {
        const entriesWithDates = savedEntries.map(entry => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        }));
        
        set({ entries: entriesWithDates, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to load journal entries', isLoading: false });
    }
  },

  saveEntries: async () => {
    try {
      const { entries } = get();
      await storageService.saveData(STORAGE_KEYS.JOURNAL, entries);
    } catch (error) {
      set({ error: 'Failed to save journal entries' });
    }
  },

  clearEntries: () => {
    set({ entries: [], selectedEntry: null, error: null });
    get().saveEntries();
  },
}));