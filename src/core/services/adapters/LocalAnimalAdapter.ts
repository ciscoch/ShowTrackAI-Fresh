/**
 * Local Animal Adapter for ShowTrackAI
 * Wraps local storage operations for animal management
 */

import { IAnimalService, IStorageService } from '../interfaces/ServiceInterfaces';
import { storageService, STORAGE_KEYS } from '../StorageService';
import { Animal } from '../../models/Animal';

export class LocalAnimalAdapter implements IAnimalService {
  private storageService = storageService;
  private readonly STORAGE_KEY = STORAGE_KEYS.ANIMALS;

  async getAnimals(): Promise<Animal[]> {
    const animals = await this.storageService.loadData<Animal[]>(this.STORAGE_KEY);
    return animals || [];
  }

  async getAnimal(id: string): Promise<Animal | null> {
    const animals = await this.getAnimals();
    return animals.find(animal => animal.id === id) || null;
  }

  async createAnimal(animal: Animal): Promise<Animal> {
    const animals = await this.getAnimals();
    const newAnimal = {
      ...animal,
      id: animal.id || `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    animals.push(newAnimal);
    await this.storageService.saveData(this.STORAGE_KEY, animals);
    return newAnimal;
  }

  async updateAnimal(id: string, updates: Partial<Animal>): Promise<Animal> {
    const animals = await this.getAnimals();
    const index = animals.findIndex(animal => animal.id === id);
    
    if (index === -1) {
      throw new Error(`Animal with id ${id} not found`);
    }
    
    animals[index] = {
      ...animals[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    await this.storageService.saveData(this.STORAGE_KEY, animals);
    return animals[index];
  }

  async deleteAnimal(id: string): Promise<void> {
    const animals = await this.getAnimals();
    const filteredAnimals = animals.filter(animal => animal.id !== id);
    
    if (filteredAnimals.length === animals.length) {
      throw new Error(`Animal with id ${id} not found`);
    }
    
    await this.storageService.saveData(this.STORAGE_KEY, filteredAnimals);
  }

  async uploadPhoto(animalId: string, photo: any): Promise<string> {
    // For local storage, we'll store photo data directly
    // In a real implementation, you might save to file system
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const photoData = {
      id: photoId,
      animalId,
      uri: photo.uri,
      timestamp: new Date(),
      ...photo,
    };
    
    // Store photo metadata
    const photosKey = `@ShowTrackAI:animal_photos_${animalId}`;
    const existingPhotos = await this.storageService.loadData<any[]>(photosKey) || [];
    existingPhotos.push(photoData);
    await this.storageService.saveData(photosKey, existingPhotos);
    
    return photoId;
  }

  async getPhotos(animalId: string): Promise<any[]> {
    const photosKey = `@ShowTrackAI:animal_photos_${animalId}`;
    return await this.storageService.loadData<any[]>(photosKey) || [];
  }
}