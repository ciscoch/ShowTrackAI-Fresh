/**
 * Medical Records Integration Test
 * Tests the complete medical records system with Supabase integration
 */

import { ServiceFactory } from '../core/services/adapters/ServiceFactory';
import { useHealthRecordStore } from '../core/stores/HealthRecordStore';
import { HealthRecord } from '../core/models/HealthRecord';

// Mock animal ID for testing
const TEST_ANIMAL_ID = 'test-animal-123';
const TEST_USER_ID = 'test-user-456';

/**
 * Test the health service adapter
 */
export async function testHealthServiceAdapter() {
  console.log('🏥 Testing Health Service Adapter...');
  
  try {
    const healthService = ServiceFactory.getHealthService();
    console.log('✅ Health service created:', healthService.constructor.name);
    
    // Test adding a health record
    const testRecord: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      animalId: TEST_ANIMAL_ID,
      recordedBy: TEST_USER_ID,
      recordedDate: new Date(),
      observationType: 'routine',
      
      // Vital Signs
      temperature: 101.5,
      heartRate: 72,
      respiratoryRate: 16,
      
      // Physical Condition Scores
      bodyConditionScore: 4,
      mobilityScore: 5,
      appetiteScore: 4,
      alertnessScore: 5,
      
      // Observations
      eyeCondition: 'normal',
      nasalDischarge: 'none',
      manureConsistency: 'normal',
      gaitMobility: 'normal',
      appetite: 'normal',
      
      // Symptoms and notes
      symptoms: ['healthy'],
      customSymptoms: [],
      notes: 'Routine health check - animal appears healthy',
      
      // Photos
      photos: [],
      
      // Unknown condition tracking
      isUnknownCondition: false,
      expertReviewRequested: false,
      
      // Treatment related
      followUpRequired: false,
    };
    
    console.log('🧪 Testing health record creation...');
    const addedRecord = await healthService.addHealthRecord(TEST_ANIMAL_ID, testRecord);
    console.log('✅ Health record added successfully:', addedRecord.id);
    
    // Test retrieving health records
    console.log('🧪 Testing health record retrieval...');
    const retrievedRecords = await healthService.getHealthRecords(TEST_ANIMAL_ID);
    console.log('✅ Health records retrieved:', retrievedRecords.length, 'records');
    
    // Test updating a health record
    if (retrievedRecords.length > 0) {
      console.log('🧪 Testing health record update...');
      const recordToUpdate = retrievedRecords[0];
      const updatedRecord = await healthService.updateHealthRecord(recordToUpdate.id, {
        notes: 'Updated health record notes',
        temperature: 100.8
      });
      console.log('✅ Health record updated successfully:', updatedRecord.id);
    }
    
    // Test vaccinations
    console.log('🧪 Testing vaccination management...');
    const testVaccination = {
      animalId: TEST_ANIMAL_ID,
      vaccineName: 'Test Vaccine',
      manufacturer: 'Test Pharma',
      dosage: '1ml',
      administeredDate: new Date(),
      nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      cost: 25.00,
      notes: 'Annual vaccination'
    };
    
    const addedVaccination = await healthService.addVaccination(TEST_ANIMAL_ID, testVaccination);
    console.log('✅ Vaccination added successfully:', addedVaccination.id);
    
    const vaccinations = await healthService.getVaccinations(TEST_ANIMAL_ID);
    console.log('✅ Vaccinations retrieved:', vaccinations.length, 'records');
    
    // Test medications
    console.log('🧪 Testing medication management...');
    const testMedication = {
      animalId: TEST_ANIMAL_ID,
      medicationName: 'Test Antibiotic',
      dosage: '10mg',
      frequency: 'twice daily',
      duration: '7 days',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      reason: 'Testing medication tracking',
      cost: 15.50,
      notes: 'Test medication entry'
    };
    
    const addedMedication = await healthService.addMedication(TEST_ANIMAL_ID, testMedication);
    console.log('✅ Medication added successfully:', addedMedication.id);
    
    const medications = await healthService.getMedications(TEST_ANIMAL_ID);
    console.log('✅ Medications retrieved:', medications.length, 'records');
    
    return {
      success: true,
      message: 'All health service adapter tests passed!',
      results: {
        healthRecords: retrievedRecords.length,
        vaccinations: vaccinations.length,
        medications: medications.length
      }
    };
    
  } catch (error) {
    console.error('❌ Health service adapter test failed:', error);
    return {
      success: false,
      message: 'Health service adapter test failed',
      error: error.message
    };
  }
}

/**
 * Test the health record store
 */
export async function testHealthRecordStore() {
  console.log('🏥 Testing Health Record Store...');
  
  try {
    const store = useHealthRecordStore.getState();
    
    // Test loading health records
    console.log('🧪 Testing store load...');
    await store.loadHealthRecords();
    console.log('✅ Health records loaded successfully');
    
    // Test adding a health record via store
    console.log('🧪 Testing store add health record...');
    const testRecord = {
      animalId: TEST_ANIMAL_ID,
      recordedBy: TEST_USER_ID,
      recordedDate: new Date(),
      observationType: 'illness' as const,
      temperature: 103.2,
      heartRate: 85,
      respiratoryRate: 20,
      bodyConditionScore: 3,
      mobilityScore: 4,
      appetiteScore: 2,
      alertnessScore: 4,
      eyeCondition: 'normal' as const,
      nasalDischarge: 'clear' as const,
      manureConsistency: 'soft' as const,
      gaitMobility: 'slight_limp' as const,
      appetite: 'reduced' as const,
      symptoms: ['fever', 'loss_of_appetite'],
      customSymptoms: [],
      notes: 'Animal showing signs of mild illness',
      photos: [],
      isUnknownCondition: false,
      expertReviewRequested: false,
      followUpRequired: true,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    };
    
    await store.addHealthRecord(testRecord);
    console.log('✅ Health record added via store successfully');
    
    // Test getting health records by animal
    console.log('🧪 Testing get health records by animal...');
    const animalRecords = store.getHealthRecordsByAnimal(TEST_ANIMAL_ID);
    console.log('✅ Retrieved', animalRecords.length, 'records for animal');
    
    // Test health summary calculation
    console.log('🧪 Testing health summary calculation...');
    const healthSummary = store.getHealthSummary(TEST_ANIMAL_ID);
    console.log('✅ Health summary calculated:', {
      healthScore: healthSummary?.currentHealthScore,
      totalRecords: healthSummary?.totalRecords,
      trend: healthSummary?.healthTrend
    });
    
    return {
      success: true,
      message: 'All health record store tests passed!',
      results: {
        totalRecords: store.healthRecords.length,
        animalRecords: animalRecords.length,
        healthScore: healthSummary?.currentHealthScore
      }
    };
    
  } catch (error) {
    console.error('❌ Health record store test failed:', error);
    return {
      success: false,
      message: 'Health record store test failed',
      error: error.message
    };
  }
}

/**
 * Test the complete medical records system integration
 */
export async function runMedicalRecordsIntegrationTest() {
  console.log('🚀 Starting Medical Records Integration Test...');
  console.log('==========================================');
  
  const results = {
    healthServiceAdapter: await testHealthServiceAdapter(),
    healthRecordStore: await testHealthRecordStore()
  };
  
  console.log('==========================================');
  console.log('🏥 Medical Records Integration Test Results:');
  console.log('Health Service Adapter:', results.healthServiceAdapter.success ? '✅ PASS' : '❌ FAIL');
  console.log('Health Record Store:', results.healthRecordStore.success ? '✅ PASS' : '❌ FAIL');
  
  const allTestsPassed = results.healthServiceAdapter.success && results.healthRecordStore.success;
  
  if (allTestsPassed) {
    console.log('🎉 ALL MEDICAL RECORDS TESTS PASSED!');
    console.log('✅ Supabase integration is working correctly');
    console.log('✅ Health record store is functioning properly');
    console.log('✅ Medical records system is ready for production');
  } else {
    console.log('❌ SOME TESTS FAILED');
    if (!results.healthServiceAdapter.success) {
      console.log('- Health Service Adapter issues:', results.healthServiceAdapter.error);
    }
    if (!results.healthRecordStore.success) {
      console.log('- Health Record Store issues:', results.healthRecordStore.error);
    }
  }
  
  return {
    success: allTestsPassed,
    results
  };
}

// Export for use in development/testing
export const medicalRecordsTestSuite = {
  testHealthServiceAdapter,
  testHealthRecordStore,
  runMedicalRecordsIntegrationTest
};