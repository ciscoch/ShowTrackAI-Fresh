#!/usr/bin/env node

/**
 * Test script to verify predicted sale cost functionality
 * Run this after applying the database migration
 */

console.log('🧪 Testing Predicted Sale Cost Field Mapping\n');

// Mock animal data with predicted sale cost
const mockAnimal = {
  id: 'test-123',
  name: 'Thunder',
  earTag: 'T001',
  penNumber: 'Pen-1',
  species: 'Cattle',
  breed: 'Angus',
  breeder: 'Smith Farm',
  sex: 'Male',
  birthDate: new Date('2023-03-15'),
  pickupDate: new Date('2023-05-01'),
  projectType: 'Market',
  acquisitionCost: 800,
  predictedSaleCost: 1400, // This is the field we're testing
  weight: 450,
  healthStatus: 'Healthy',
  notes: 'Test animal for predicted sale cost',
  createdAt: new Date(),
  updatedAt: new Date(),
  owner_id: 'test-user-123'
};

// Test the mapping functions from SupabaseAnimalAdapter
function mapAnimalToDb(animal) {
  const dbAnimal = {};
  
  if (animal.name !== undefined) dbAnimal.name = animal.name;
  if (animal.earTag !== undefined) dbAnimal.ear_tag = animal.earTag;
  if (animal.penNumber !== undefined) dbAnimal.pen_number = animal.penNumber;
  if (animal.species !== undefined) dbAnimal.species = animal.species.toLowerCase();
  if (animal.breed !== undefined) dbAnimal.breed = animal.breed;
  if (animal.breeder !== undefined) dbAnimal.breeder = animal.breeder;
  if (animal.sex !== undefined) dbAnimal.sex = animal.sex.toLowerCase();
  if (animal.birthDate !== undefined) dbAnimal.birth_date = animal.birthDate;
  if (animal.pickupDate !== undefined) dbAnimal.pickup_date = animal.pickupDate;
  if (animal.projectType !== undefined) dbAnimal.project_type = animal.projectType;
  if (animal.acquisitionCost !== undefined) dbAnimal.acquisition_cost = animal.acquisitionCost;
  if (animal.predictedSaleCost !== undefined) dbAnimal.predicted_sale_cost = animal.predictedSaleCost; // ✅ This is the key mapping
  if (animal.weight !== undefined) dbAnimal.current_weight = animal.weight;
  if (animal.healthStatus !== undefined) dbAnimal.health_status = animal.healthStatus.toLowerCase();
  if (animal.notes !== undefined) dbAnimal.notes = animal.notes;
  
  return dbAnimal;
}

function mapDbToAnimal(dbAnimal) {
  return {
    id: dbAnimal.id,
    name: dbAnimal.name,
    earTag: dbAnimal.ear_tag || '',
    penNumber: dbAnimal.pen_number || 'Pen-1',
    species: dbAnimal.species || 'Cattle',
    breed: dbAnimal.breed || '',
    breeder: dbAnimal.breeder || '',
    sex: dbAnimal.sex || 'Male',
    birthDate: dbAnimal.birth_date ? new Date(dbAnimal.birth_date) : undefined,
    pickupDate: dbAnimal.pickup_date ? new Date(dbAnimal.pickup_date) : undefined,
    projectType: dbAnimal.project_type || 'Market',
    acquisitionCost: dbAnimal.acquisition_cost || 0,
    predictedSaleCost: dbAnimal.predicted_sale_cost, // ✅ This is the key mapping back
    weight: dbAnimal.current_weight,
    healthStatus: dbAnimal.health_status || 'Healthy',
    notes: dbAnimal.notes,
    createdAt: new Date(dbAnimal.created_at),
    updatedAt: new Date(dbAnimal.updated_at),
    owner_id: dbAnimal.owner_id,
  };
}

// Test the mappings
console.log('📊 Original Animal Object:');
console.log('  Name:', mockAnimal.name);
console.log('  Acquisition Cost: $' + mockAnimal.acquisitionCost);
console.log('  Predicted Sale Cost: $' + mockAnimal.predictedSaleCost);
console.log('  Potential Profit: $' + (mockAnimal.predictedSaleCost - mockAnimal.acquisitionCost));

console.log('\n🔄 Mapping to Database Format:');
const dbFormat = mapAnimalToDb(mockAnimal);
console.log('  acquisition_cost:', dbFormat.acquisition_cost);
console.log('  predicted_sale_cost:', dbFormat.predicted_sale_cost);

console.log('\n🔄 Mapping Back to Frontend Format:');
const frontendFormat = mapDbToAnimal({
  ...dbFormat,
  id: mockAnimal.id,
  created_at: mockAnimal.createdAt.toISOString(),
  updated_at: mockAnimal.updatedAt.toISOString(),
  owner_id: mockAnimal.owner_id
});
console.log('  acquisitionCost:', frontendFormat.acquisitionCost);
console.log('  predictedSaleCost:', frontendFormat.predictedSaleCost);

// Test financial calculation
console.log('\n💰 Financial Summary Test:');
const animals = [frontendFormat];
const animalsWithPredictions = animals.filter(animal => 
  animal.predictedSaleCost && animal.predictedSaleCost > 0
);

const totalPredictedIncome = animalsWithPredictions.reduce((sum, animal) => 
  sum + (animal.predictedSaleCost || 0), 0
);

console.log('  Animals with Predictions:', animalsWithPredictions.length);
console.log('  Total Predicted Income: $' + totalPredictedIncome);

console.log('\n✅ Field Mapping Test Complete!');
console.log('\n🚀 Next Steps:');
console.log('1. Run the database migration: add-missing-animal-fields.sql');
console.log('2. Test creating/updating an animal with predicted sale cost');
console.log('3. Verify the value appears in Financial Overview');