import { create } from 'zustand';
import { Journal, CreateJournalRequest } from '../models/Journal';
import { ServiceFactory } from '../services/adapters/ServiceFactory';

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
  clearEntries: () => void;
}

type JournalStore = JournalState & JournalActions;

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  selectedEntry: null,
  isLoading: false,
  error: null,

  addEntry: async (request: CreateJournalRequest) => {
    try {
      console.log('📝 JournalStore: Adding new entry via ServiceFactory');
      set({ isLoading: true, error: null });
      
      const journalService = ServiceFactory.getJournalService();
      const createdEntry = await journalService.createJournalEntry(request);
      
      console.log('✅ JournalStore: Entry created successfully', createdEntry);
      
      set((state) => ({
        entries: [...state.entries, createdEntry],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('❌ JournalStore: Error adding journal entry:', error);
      set({ error: 'Failed to save journal entry', isLoading: false });
      throw error;
    }
  },

  updateEntry: async (id: string, updates: Partial<Journal>) => {
    try {
      console.log('✏️ JournalStore: Updating entry via ServiceFactory', id);
      set({ isLoading: true, error: null });
      
      const journalService = ServiceFactory.getJournalService();
      const updatedEntry = await journalService.updateJournalEntry(id, updates);
      
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('❌ JournalStore: Error updating journal entry:', error);
      set({ error: 'Failed to update journal entry', isLoading: false });
      throw error;
    }
  },

  deleteEntry: async (id: string) => {
    try {
      console.log('🗑️ JournalStore: Deleting entry via ServiceFactory', id);
      set({ isLoading: true, error: null });
      
      const journalService = ServiceFactory.getJournalService();
      await journalService.deleteJournalEntry(id);
      
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
        selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry,
        isLoading: false,
        error: null,
      }));
      
      console.log('✅ JournalStore: Entry deleted successfully');
    } catch (error) {
      console.error('❌ JournalStore: Error deleting journal entry:', error);
      set({ error: 'Failed to delete journal entry', isLoading: false });
      throw error;
    }
  },

  selectEntry: (entry: Journal | null) => {
    set({ selectedEntry: entry });
  },

  loadEntries: async () => {
    try {
      console.log('📚 JournalStore: Loading entries via ServiceFactory');
      set({ isLoading: true, error: null });
      
      const journalService = ServiceFactory.getJournalService();
      const entries = await journalService.getJournalEntries();
      
      console.log('✅ JournalStore: Loaded entries successfully', entries.length);
      set({ entries, isLoading: false });
    } catch (error) {
      console.error('❌ JournalStore: Error loading journal entries:', error);
      set({ error: 'Failed to load journal entries', isLoading: false });
    }
  },


  clearEntries: () => {
    console.log('🧹 JournalStore: Clearing entries');
    set({ entries: [], selectedEntry: null, error: null });
  },
}));