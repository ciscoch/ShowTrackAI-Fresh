import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Animal, CreateAnimalRequest } from '../models/Animal';
import { storageService, STORAGE_KEYS } from '../services/StorageService';
import { getAnimalService } from '../services/adapters/ServiceFactory';
import { useSupabaseBackend } from '../hooks/useSupabaseBackend';
import { AnimalPermissionsService, AnimalPermissions, AnimalAccessContext } from '../services/AnimalPermissionsService';
import { IAnimalService } from '../services/interfaces/ServiceInterfaces';

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
  refreshAnimals: () => Promise<void>;
  uploadAnimalPhoto: (animalId: string, photo: any) => Promise<string>;
  getAnimalPhotos: (animalId: string) => Promise<any[]>;
  getAnimalPermissions: (animal: Animal, context: AnimalAccessContext) => AnimalPermissions;
  canPerformAction: (action: keyof AnimalPermissions, animal: Animal, context: AnimalAccessContext) => boolean;
  getFilteredAnimals: (context: AnimalAccessContext) => Animal[];
  checkSubscriptionLimits: (context: AnimalAccessContext) => Promise<{ canCreate: boolean; reason?: string }>;
}

type AnimalStore = AnimalState & AnimalActions;

export const useAnimalStore = create<AnimalStore>()(
  subscribeWithSelector((set, get) => ({
    animals: [],
    selectedAnimal: null,
    isLoading: false,
    error: null,

    addAnimal: async (request: CreateAnimalRequest) => {
      try {
        set({ isLoading: true, error: null });
        const animalService = getAnimalService();
        
        if (useSupabaseBackend().isEnabled) {
          // Use backend service
          const newAnimal = await animalService.createAnimal(request);
          set((state) => ({
            animals: [...state.animals, newAnimal],
            isLoading: false,
            error: null,
          }));
          console.log('Animal saved successfully to backend:', newAnimal.name);
        } else {
          // Use local storage
          const newAnimal: Animal = {
            id: Date.now().toString(),
            ...request,
            healthStatus: 'Healthy',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          set((state) => ({
            animals: [...state.animals, newAnimal],
            isLoading: false,
            error: null,
          }));
          
          await get().saveAnimals();
          console.log('Animal saved successfully to local storage:', newAnimal.name);
        }
      } catch (error) {
        console.error('Failed to add animal:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add animal',
          isLoading: false 
        });
      }
    },

    updateAnimal: async (id: string, updates: Partial<Animal>) => {
      try {
        set({ isLoading: true, error: null });
        const animalService = getAnimalService();
        
        if (useSupabaseBackend().isEnabled) {
          // Use backend service
          const updatedAnimal = await animalService.updateAnimal(id, updates);
          set((state) => ({
            animals: state.animals.map((animal) =>
              animal.id === id ? updatedAnimal : animal
            ),
            selectedAnimal: state.selectedAnimal?.id === id ? updatedAnimal : state.selectedAnimal,
            isLoading: false,
            error: null,
          }));
          console.log('Animal updated successfully in backend');
        } else {
          // Use local storage
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
            isLoading: false,
            error: null,
          }));
          
          await get().saveAnimals();
          console.log('Animal updated successfully in local storage');
        }
      } catch (error) {
        console.error('Failed to update animal:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update animal',
          isLoading: false 
        });
      }
    },

    deleteAnimal: async (id: string) => {
      try {
        set({ isLoading: true, error: null });
        const animalService = getAnimalService();
        
        if (useSupabaseBackend().isEnabled) {
          // Use backend service
          await animalService.deleteAnimal(id);
          set((state) => ({
            animals: state.animals.filter((animal) => animal.id !== id),
            selectedAnimal: state.selectedAnimal?.id === id ? null : state.selectedAnimal,
            isLoading: false,
            error: null,
          }));
          console.log('Animal deleted successfully from backend');
        } else {
          // Use local storage
          set((state) => ({
            animals: state.animals.filter((animal) => animal.id !== id),
            selectedAnimal: state.selectedAnimal?.id === id ? null : state.selectedAnimal,
            isLoading: false,
            error: null,
          }));
          
          await get().saveAnimals();
          console.log('Animal deleted successfully from local storage');
        }
      } catch (error) {
        console.error('Failed to delete animal:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete animal',
          isLoading: false 
        });
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
        const animalService = getAnimalService();
        
        if (useSupabaseBackend().isEnabled) {
          // Use backend service
          const animals = await animalService.getAnimals();
          const animalsWithDates = animals.map(animal => ({
            ...animal,
            birthDate: animal.birthDate ? new Date(animal.birthDate) : undefined,
            pickupDate: animal.pickupDate ? new Date(animal.pickupDate) : undefined,
            createdAt: new Date(animal.createdAt),
            updatedAt: new Date(animal.updatedAt),
          }));
          
          set({ animals: animalsWithDates, isLoading: false });
          console.log('Animals loaded successfully from backend:', animals.length);
        } else {
          // Use local storage
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
            console.log('Animals loaded successfully from local storage:', savedAnimals.length);
          } else {
            set({ animals: [], isLoading: false });
          }
        }
      } catch (error) {
        console.error('Failed to load animals:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load animals', 
          isLoading: false 
        });
      }
    },

    saveAnimals: async () => {
      try {
        // Only save to local storage if not using backend
        if (!useSupabaseBackend().isEnabled) {
          const { animals } = get();
          const success = await storageService.saveData(STORAGE_KEYS.ANIMALS, animals);
          
          if (!success) {
            set({ error: 'Failed to save animals to storage' });
          }
        }
        // Backend saves are handled automatically by individual operations
      } catch (error) {
        console.error('Failed to save animals:', error);
        set({ error: 'Failed to save animals to storage' });
      }
    },

    refreshAnimals: async () => {
      await get().loadAnimals();
    },

    uploadAnimalPhoto: async (animalId: string, photo: any) => {
      try {
        set({ isLoading: true, error: null });
        const animalService = getAnimalService();
        const photoId = await animalService.uploadPhoto(animalId, photo);
        set({ isLoading: false });
        return photoId;
      } catch (error) {
        console.error('Failed to upload photo:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to upload photo',
          isLoading: false 
        });
        throw error;
      }
    },

    getAnimalPhotos: async (animalId: string) => {
      try {
        const animalService = getAnimalService();
        return await animalService.getPhotos(animalId);
      } catch (error) {
        console.error('Failed to get photos:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to get photos' });
        return [];
      }
    },

    getAnimalPermissions: (animal: Animal, context: AnimalAccessContext) => {
      return AnimalPermissionsService.getAnimalPermissions({
        ...context,
        targetAnimal: animal,
        isOwnAnimal: animal.owner_id === context.user?.id,
      });
    },

    canPerformAction: (action: keyof AnimalPermissions, animal: Animal, context: AnimalAccessContext) => {
      return AnimalPermissionsService.canPerformAction(action, {
        ...context,
        targetAnimal: animal,
        isOwnAnimal: animal.owner_id === context.user?.id,
      });
    },

    getFilteredAnimals: (context: AnimalAccessContext) => {
      const { animals } = get();
      return AnimalPermissionsService.filterAnimalsForUser(
        animals,
        context.user,
        context.profile,
        [], // TODO: Add student animals when educator relationships are implemented
        []  // TODO: Add child animals when parent relationships are implemented
      );
    },

    checkSubscriptionLimits: async (context: AnimalAccessContext) => {
      if (!context.profile) {
        return { canCreate: false, reason: 'No profile information' };
      }
      
      const { animals } = get();
      const userAnimals = animals.filter(animal => animal.owner_id === context.user?.id);
      
      return AnimalPermissionsService.checkSubscriptionLimits(
        context.profile,
        userAnimals.length
      );
    },
  }))
);