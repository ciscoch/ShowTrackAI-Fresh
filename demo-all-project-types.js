#!/usr/bin/env node

/**
 * Demo: Predicted Income for All Project Types
 * Shows how predicted sale cost works for Market, Breeding, Show, and Dairy animals
 */

console.log('🎯 ShowTrackAI: Predicted Income for All Project Types\n');

// Sample animals with different project types
const animals = [
  {
    id: 'animal_1',
    name: 'Thunder',
    earTag: 'A001',
    species: 'Cattle',
    projectType: 'Market',
    acquisitionCost: 800,
    predictedSaleCost: 1400,  // Market steer
  },
  {
    id: 'animal_2',
    name: 'Bella',
    earTag: 'C002',
    species: 'Cattle',
    projectType: 'Breeding',
    acquisitionCost: 1200,
    predictedSaleCost: 1800,  // Breeding heifer (future calf sales)
  },
  {
    id: 'animal_3',
    name: 'Champion',
    earTag: 'S003',
    species: 'Sheep',
    projectType: 'Show',
    acquisitionCost: 300,
    predictedSaleCost: 450,   // Show lamb (post-show sale)
  },
  {
    id: 'animal_4',
    name: 'Daisy',
    earTag: 'G004',
    species: 'Goat',
    projectType: 'Dairy',
    acquisitionCost: 400,
    predictedSaleCost: 600,   // Dairy goat (culling value)
  },
  {
    id: 'animal_5',
    name: 'Ruby',
    earTag: 'G005',
    species: 'Goat',
    projectType: 'Market',
    acquisitionCost: 250,
    predictedSaleCost: 0,     // No prediction set yet
  }
];

// Simulate the updated getPredictedIncome function
function getPredictedIncome(animals = []) {
  const animalsWithPredictions = animals.filter(animal => 
    animal.predictedSaleCost && 
    animal.predictedSaleCost > 0
    // Now includes all project types (Market, Breeding, Show, Dairy)
  );
  
  const totalPredictedIncome = animalsWithPredictions.reduce((sum, animal) => 
    sum + (animal.predictedSaleCost || 0), 0
  );
  
  // Create breakdown by species
  const breakdown = animalsWithPredictions.reduce((acc, animal) => {
    const species = animal.species;
    if (!acc[species]) {
      acc[species] = { count: 0, totalValue: 0, animals: [] };
    }
    acc[species].count++;
    acc[species].totalValue += animal.predictedSaleCost;
    acc[species].animals.push({
      name: animal.name,
      earTag: animal.earTag,
      projectType: animal.projectType,
      predictedValue: animal.predictedSaleCost,
      acquisitionCost: animal.acquisitionCost,
      potentialProfit: animal.predictedSaleCost - animal.acquisitionCost
    });
    return acc;
  }, {});
  
  const note = animalsWithPredictions.length > 0 
    ? `*Based on predicted sale values for ${animalsWithPredictions.length} ${animalsWithPredictions.length === 1 ? 'animal' : 'animals'}. This projection helps calculate your break-even point and potential profit for your SAE project.`
    : '*Set predicted sale costs for your animals to see projected income and break-even analysis.';
  
  return {
    amount: totalPredictedIncome,
    note,
    breakdown: Object.entries(breakdown).map(([species, data]) => ({
      species,
      ...data
    }))
  };
}

// Calculate results
const predictedIncome = getPredictedIncome(animals);
const actualIncome = 0; // No animals sold yet
const totalIncome = actualIncome + predictedIncome.amount;

console.log('📊 FINANCIAL OVERVIEW (All Project Types):');
console.log('==========================================');
console.log(`💰 Total Income: $${totalIncome.toFixed(2)}`);
console.log(`   • Actual: $${actualIncome.toFixed(2)}`);
console.log(`   • Projected: $${predictedIncome.amount.toFixed(2)}`);
console.log(`\n${predictedIncome.note}`);

console.log('\n🐄 BREAKDOWN BY SPECIES & PROJECT TYPE:');
console.log('========================================');
predictedIncome.breakdown.forEach(species => {
  console.log(`\n${species.species}:`);
  console.log(`   • Count: ${species.count} animals`);
  console.log(`   • Total Value: $${species.totalValue.toFixed(2)}`);
  
  species.animals.forEach(animal => {
    console.log(`   • ${animal.name} (${animal.earTag}) - ${animal.projectType}:`);
    console.log(`     - Predicted Sale: $${animal.predictedValue.toFixed(2)}`);
    console.log(`     - Acquisition Cost: $${animal.acquisitionCost.toFixed(2)}`);
    console.log(`     - Potential Profit: $${animal.potentialProfit.toFixed(2)}`);
  });
});

console.log('\n📚 PROJECT TYPE EXPLANATIONS:');
console.log('==============================');
console.log('🎯 Market Animals: Direct sale for meat market');
console.log('   • Thunder (Cattle): $1,400 market steer');
console.log('   • Example: Fed to market weight and sold');

console.log('\n🐄 Breeding Animals: Reproductive value and offspring sales');
console.log('   • Bella (Cattle): $1,800 breeding heifer');
console.log('   • Example: Future calf sales or breeding stock value');

console.log('\n🏆 Show Animals: Competition and post-show sales');
console.log('   • Champion (Sheep): $450 show lamb');
console.log('   • Example: Premium prices after show competition');

console.log('\n🥛 Dairy Animals: Milk production and culling value');
console.log('   • Daisy (Goat): $600 dairy goat');
console.log('   • Example: End-of-production culling value');

console.log('\n🎓 EDUCATIONAL BENEFITS:');
console.log('========================');
console.log('✅ Comprehensive Financial Planning: All project types included');
console.log('✅ Diversified Portfolio Analysis: Multiple income sources');
console.log('✅ Project Comparison: Different animal enterprises');
console.log('✅ Risk Management: Not just market animals');
console.log('✅ Long-term Planning: Breeding and dairy considerations');

console.log('\n🏆 FFA SAE INTEGRATION:');
console.log('========================');
console.log('• Market Projects: Traditional meat animal sales');
console.log('• Breeding Projects: Genetic improvement and breeding stock');
console.log('• Show Projects: Competition and exhibition excellence');
console.log('• Dairy Projects: Milk production and herd management');
console.log('• Diversified Operations: Multiple income streams');

console.log('\n📊 BUSINESS INTELLIGENCE:');
console.log('==========================');
console.log('• Enterprise Comparison: Compare profitability across project types');
console.log('• Risk Diversification: Multiple income sources reduce risk');
console.log('• Market Timing: Different sale timing for different projects');
console.log('• Capital Allocation: Optimize investment across project types');
console.log('• Long-term Planning: Multi-year breeding and dairy projections');

console.log('\n✅ IMPLEMENTATION COMPLETE:');
console.log('============================');
console.log('✅ Field now available for ALL project types');
console.log('✅ No longer restricted to Market animals only');
console.log('✅ Enhanced educational value for diverse SAE projects');
console.log('✅ Better reflects real-world agricultural operations');
console.log('✅ Supports comprehensive financial planning');

console.log('\n🚀 Ready for all FFA SAE project types!');