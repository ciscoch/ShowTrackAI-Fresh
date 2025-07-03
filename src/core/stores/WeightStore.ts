import { create } from 'zustand';
import { Weight, CreateWeightRequest } from '../models/Weight';
import { storageService, STORAGE_KEYS } from '../services/StorageService';

interface WeightState {
  weights: Weight[];
  selectedWeight: Weight | null;
  isLoading: boolean;
  error: string | null;
}

interface WeightActions {
  addWeight: (weight: CreateWeightRequest) => Promise<void>;
  updateWeight: (id: string, updates: Partial<Weight>) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;
  selectWeight: (weight: Weight | null) => void;
  getWeightsByAnimal: (animalId: string) => Weight[];
  loadWeights: () => Promise<void>;
  saveWeights: () => Promise<void>;
  clearWeights: () => void;
}

type WeightStore = WeightState & WeightActions;

export const useWeightStore = create<WeightStore>((set, get) => ({
  weights: [],
  selectedWeight: null,
  isLoading: false,
  error: null,

  addWeight: async (request: CreateWeightRequest) => {
    const newWeight: Weight = {
      id: Date.now().toString(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      weights: [...state.weights, newWeight],
      error: null,
    }));
    
    try {
      await get().saveWeights();
    } catch (error) {
      set({ error: 'Failed to save weight record' });
    }
  },

  updateWeight: async (id: string, updates: Partial<Weight>) => {
    set((state) => ({
      weights: state.weights.map((weight) =>
        weight.id === id ? { ...weight, ...updates, updatedAt: new Date() } : weight
      ),
      error: null,
    }));
    
    try {
      await get().saveWeights();
    } catch (error) {
      set({ error: 'Failed to update weight record' });
    }
  },

  deleteWeight: async (id: string) => {
    set((state) => ({
      weights: state.weights.filter((weight) => weight.id !== id),
      selectedWeight: state.selectedWeight?.id === id ? null : state.selectedWeight,
      error: null,
    }));
    
    try {
      await get().saveWeights();
    } catch (error) {
      set({ error: 'Failed to delete weight record' });
    }
  },

  selectWeight: (weight: Weight | null) => {
    set({ selectedWeight: weight });
  },

  getWeightsByAnimal: (animalId: string) => {
    return get().weights.filter(weight => weight.animalId === animalId);
  },

  loadWeights: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedWeights = await storageService.loadData<Weight[]>(STORAGE_KEYS.WEIGHTS);
      
      if (savedWeights) {
        const weightsWithDates = savedWeights.map(weight => ({
          ...weight,
          date: new Date(weight.date),
          createdAt: new Date(weight.createdAt),
          updatedAt: new Date(weight.updatedAt),
        }));
        
        set({ weights: weightsWithDates, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to load weight records', isLoading: false });
    }
  },

  saveWeights: async () => {
    try {
      const { weights } = get();
      await storageService.saveData(STORAGE_KEYS.WEIGHTS, weights);
    } catch (error) {
      set({ error: 'Failed to save weight records' });
    }
  },

  clearWeights: () => {
    set({ weights: [], selectedWeight: null, error: null });
    get().saveWeights();
  },
}));