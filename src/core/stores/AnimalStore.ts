import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Animal, CreateAnimalRequest } from '../models/Animal';
import { storageService, STORAGE_KEYS } from '../services/StorageService';

interface AnimalState {
  animals: Animal[];
  selectedAnimal: Animal | null;
  isLoading: boolean;
  error: string | null;
}

interface AnimalActions {
  addAnimal: (animal: CreateAnimalRequest) => Promise<void>;
  updateAnimal: (id: string, updates: Partial<Animal>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
  selectAnimal: (animal: Animal | null) => void;
  getAnimalById: (id: string) => Animal | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAnimals: () => void;
  loadAnimals: () => Promise<void>;
  saveAnimals: () => Promise<void>;
}

type AnimalStore = AnimalState & AnimalActions;

export const useAnimalStore = create<AnimalStore>()(
  subscribeWithSelector((set, get) => ({
    animals: [],
    selectedAnimal: null,
    isLoading: false,
    error: null,

    addAnimal: async (request: CreateAnimalRequest) => {
      const newAnimal: Animal = {
        id: Date.now().toString(),
        ...request,
        healthStatus: 'Healthy',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => ({
        animals: [...state.animals, newAnimal],
        error: null,
      }));
      
      try {
        await get().saveAnimals();
        console.log('Animal saved successfully:', newAnimal.name);
      } catch (error) {
        console.error('Failed to save animal:', error);
        set({ error: 'Failed to save animal to storage' });
      }
    },

    updateAnimal: async (id: string, updates: Partial<Animal>) => {
      set((state) => ({
        animals: state.animals.map((animal) =>
          animal.id === id
            ? {
                ...animal,
                ...updates,
                updatedAt: new Date(),
              }
            : animal
        ),
        selectedAnimal:
          state.selectedAnimal?.id === id
            ? { ...state.selectedAnimal, ...updates, updatedAt: new Date() }
            : state.selectedAnimal,
        error: null,
      }));
      
      try {
        await get().saveAnimals();
        console.log('Animal updated successfully');
      } catch (error) {
        console.error('Failed to update animal:', error);
        set({ error: 'Failed to update animal in storage' });
      }
    },

    deleteAnimal: async (id: string) => {
      set((state) => ({
        animals: state.animals.filter((animal) => animal.id !== id),
        selectedAnimal: state.selectedAnimal?.id === id ? null : state.selectedAnimal,
        error: null,
      }));
      
      try {
        await get().saveAnimals();
        console.log('Animal deleted successfully');
      } catch (error) {
        console.error('Failed to delete animal:', error);
        set({ error: 'Failed to delete animal from storage' });
      }
    },

    selectAnimal: (animal: Animal | null) => {
      set({ selectedAnimal: animal });
    },

    getAnimalById: (id: string) => {
      return get().animals.find((animal) => animal.id === id);
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearAnimals: () => {
      set({
        animals: [],
        selectedAnimal: null,
        error: null,
      });
      
      get().saveAnimals();
    },

    loadAnimals: async () => {
      try {
        set({ isLoading: true, error: null });
        const savedAnimals = await storageService.loadData<Animal[]>(STORAGE_KEYS.ANIMALS);
        
        if (savedAnimals) {
          const animalsWithDates = savedAnimals.map(animal => ({
            ...animal,
            birthDate: animal.birthDate ? new Date(animal.birthDate) : undefined,
            pickupDate: animal.pickupDate ? new Date(animal.pickupDate) : undefined,
            createdAt: new Date(animal.createdAt),
            updatedAt: new Date(animal.updatedAt),
          }));
          
          set({ animals: animalsWithDates, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load animals:', error);
        set({ 
          error: 'Failed to load animals from storage', 
          isLoading: false 
        });
      }
    },

    saveAnimals: async () => {
      try {
        const { animals } = get();
        const success = await storageService.saveData(STORAGE_KEYS.ANIMALS, animals);
        
        if (!success) {
          set({ error: 'Failed to save animals to storage' });
        }
      } catch (error) {
        console.error('Failed to save animals:', error);
        set({ error: 'Failed to save animals to storage' });
      }
    },
  }))
);