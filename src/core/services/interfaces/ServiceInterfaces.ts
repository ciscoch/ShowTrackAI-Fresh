/**
 * Service Interfaces for ShowTrackAI
 * Defines contracts for all service adapters
 */

// Storage Service Interface
export interface IStorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  backup(): Promise<void>;
  restore(data: any): Promise<void>;
}

// Animal Service Interface
export interface IAnimalService {
  getAnimals(): Promise<any[]>;
  getAnimal(id: string): Promise<any | null>;
  createAnimal(animal: any): Promise<any>;
  updateAnimal(id: string, updates: any): Promise<any>;
  deleteAnimal(id: string): Promise<void>;
  uploadPhoto(animalId: string, photo: any): Promise<string>;
  getPhotos(animalId: string): Promise<any[]>;
}

// Profile Service Interface
export interface IProfileService {
  getCurrentProfile(): Promise<any | null>;
  updateProfile(updates: any): Promise<any>;
  createProfile(profile: any): Promise<any>;
  getProfiles(): Promise<any[]>;
  switchProfile(profileId: string): Promise<void>;
  linkStudentToEducator(studentId: string, educatorId: string): Promise<void>;
}

// Health Service Interface
export interface IHealthService {
  getHealthRecords(animalId: string): Promise<any[]>;
  addHealthRecord(animalId: string, record: any): Promise<any>;
  updateHealthRecord(recordId: string, updates: any): Promise<any>;
  deleteHealthRecord(recordId: string): Promise<void>;
  getVaccinations(animalId: string): Promise<any[]>;
  addVaccination(animalId: string, vaccination: any): Promise<any>;
  getMedications(animalId: string): Promise<any[]>;
  addMedication(animalId: string, medication: any): Promise<any>;
}

// Journal Service Interface
export interface IJournalService {
  getJournalEntries(filters?: any): Promise<any[]>;
  getJournalEntry(id: string): Promise<any | null>;
  createJournalEntry(entry: any): Promise<any>;
  updateJournalEntry(id: string, updates: any): Promise<any>;
  deleteJournalEntry(id: string): Promise<void>;
  addPhotoToEntry(entryId: string, photo: any): Promise<string>;
}

// Financial Service Interface
export interface IFinancialService {
  getExpenses(filters?: any): Promise<any[]>;
  addExpense(expense: any): Promise<any>;
  updateExpense(id: string, updates: any): Promise<any>;
  deleteExpense(id: string): Promise<void>;
  getIncome(filters?: any): Promise<any[]>;
  addIncome(income: any): Promise<any>;
  getBudgets(): Promise<any[]>;
  createBudget(budget: any): Promise<any>;
}

// Authentication Service Interface
export interface IAuthService {
  signIn(data: { email: string; password: string }): Promise<{ user: any | null; session: any | null; error?: string }>;
  signUp(data: { email: string; password: string; fullName?: string; role?: string; [key: string]: any }): Promise<{ user: any | null; session: any | null; error?: string }>;
  signOut(): Promise<{ error?: string }>;
  getCurrentUser(): Promise<any | null>;
  getCurrentSession(): Promise<any | null>;
  updatePassword(newPassword: string): Promise<{ error?: string }>;
  resetPassword(email: string): Promise<{ error?: string }>;
  onAuthStateChange(callback: (event: string, session: any | null) => void): any;
  hasRole(role: string): Promise<boolean>;
  hasSubscriptionAccess(tier: string): Promise<boolean>;
}

// Weight Service Interface
export interface IWeightService {
  getWeights(animalId: string): Promise<any[]>;
  addWeight(animalId: string, weight: any): Promise<any>;
  updateWeight(id: string, updates: any): Promise<any>;
  deleteWeight(id: string): Promise<void>;
  predictWeight(photo: any, animalMetadata: any): Promise<any>;
}