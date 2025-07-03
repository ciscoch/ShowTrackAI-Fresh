import { create } from 'zustand';
import { TimeTracking, CreateTimeTrackingRequest } from '../models/TimeTracking';
import { storageService, STORAGE_KEYS } from '../services/StorageService';

interface TimeTrackingState {
  entries: TimeTracking[];
  activeEntry: TimeTracking | null;
  selectedEntry: TimeTracking | null;
  isLoading: boolean;
  error: string | null;
}

interface TimeTrackingActions {
  startTracking: (entry: Omit<CreateTimeTrackingRequest, 'startTime' | 'isActive'>) => Promise<void>;
  stopTracking: (id: string) => Promise<void>;
  addEntry: (entry: CreateTimeTrackingRequest) => Promise<void>;
  updateEntry: (id: string, updates: Partial<TimeTracking>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  selectEntry: (entry: TimeTracking | null) => void;
  loadEntries: () => Promise<void>;
  saveEntries: () => Promise<void>;
  clearEntries: () => void;
}

type TimeTrackingStore = TimeTrackingState & TimeTrackingActions;

export const useTimeTrackingStore = create<TimeTrackingStore>((set, get) => ({
  entries: [],
  activeEntry: null,
  selectedEntry: null,
  isLoading: false,
  error: null,

  startTracking: async (entryData) => {
    const newEntry: TimeTracking = {
      id: Date.now().toString(),
      ...entryData,
      startTime: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      entries: [...state.entries, newEntry],
      activeEntry: newEntry,
      error: null,
    }));
    
    try {
      await get().saveEntries();
    } catch (error) {
      set({ error: 'Failed to start time tracking' });
    }
  },

  stopTracking: async (id: string) => {
    const now = new Date();
    
    set((state) => {
      const updatedEntries = state.entries.map((entry) => {
        if (entry.id === id && entry.isActive) {
          const duration = Math.round((now.getTime() - entry.startTime.getTime()) / 60000);
          return {
            ...entry,
            endTime: now,
            duration,
            isActive: false,
            updatedAt: new Date(),
          };
        }
        return entry;
      });

      return {
        entries: updatedEntries,
        activeEntry: null,
        error: null,
      };
    });
    
    try {
      await get().saveEntries();
    } catch (error) {
      set({ error: 'Failed to stop time tracking' });
    }
  },

  addEntry: async (request: CreateTimeTrackingRequest) => {
    const newEntry: TimeTracking = {
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
      set({ error: 'Failed to save time entry' });
    }
  },

  updateEntry: async (id: string, updates: Partial<TimeTracking>) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
      ),
      error: null,
    }));
    
    try {
      await get().saveEntries();
    } catch (error) {
      set({ error: 'Failed to update time entry' });
    }
  },

  deleteEntry: async (id: string) => {
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
      selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry,
      activeEntry: state.activeEntry?.id === id ? null : state.activeEntry,
      error: null,
    }));
    
    try {
      await get().saveEntries();
    } catch (error) {
      set({ error: 'Failed to delete time entry' });
    }
  },

  selectEntry: (entry: TimeTracking | null) => {
    set({ selectedEntry: entry });
  },

  loadEntries: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedEntries = await storageService.loadData<TimeTracking[]>('@ShowTrackAI:timeTracking');
      
      if (savedEntries) {
        const entriesWithDates = savedEntries.map(entry => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        }));
        
        const activeEntry = entriesWithDates.find(entry => entry.isActive) || null;
        
        set({ entries: entriesWithDates, activeEntry, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to load time entries', isLoading: false });
    }
  },

  saveEntries: async () => {
    try {
      const { entries } = get();
      await storageService.saveData('@ShowTrackAI:timeTracking', entries);
    } catch (error) {
      set({ error: 'Failed to save time entries' });
    }
  },

  clearEntries: () => {
    set({ entries: [], activeEntry: null, selectedEntry: null, error: null });
    get().saveEntries();
  },
}));