#!/usr/bin/env node

/**
 * Demo: Predicted Income & Break-Even Analysis
 * Shows how the predicted sale cost field works in practice
 */

console.log('🎯 ShowTrackAI: Predicted Income & Break-Even Analysis Demo\n');

// Sample animal data with predicted sale costs
const animals = [
  {
    id: 'animal_1',
    name: 'Thunder',
    earTag: 'A001',
    species: 'Cattle',
    projectType: 'Market',
    acquisitionCost: 800,
    predictedSaleCost: 1400,  // Student sets this based on market research
  },
  {
    id: 'animal_2',
    name: 'Daisy',
    earTag: 'G002',
    species: 'Goat',
    projectType: 'Market',
    acquisitionCost: 250,
    predictedSaleCost: 450,   // Student sets this based on market research
  },
  {
    id: 'animal_3',
    name: 'Buttercup',
    earTag: 'C003',
    species: 'Cattle',
    projectType: 'Breeding',  // Not counted in sale projections
    acquisitionCost: 1200,
    predictedSaleCost: 0,     // Breeding animals don't have sale predictions
  }
];

// Sample expenses (what students would track)
const expenses = [
  { description: 'Feed - Cattle', amount: 400, category: 'feed_supplies' },
  { description: 'Feed - Goat', amount: 150, category: 'feed_supplies' },
  { description: 'Veterinary Care', amount: 125, category: 'veterinary_health' },
  { description: 'Show Supplies', amount: 85, category: 'show_expenses' },
];

// Simulate the getPredictedIncome function
function getPredictedIncome(animals = []) {
  // Filter only market animals with predicted sale costs
  const animalsWithPredictions = animals.filter(animal => 
    animal.predictedSaleCost && 
    animal.predictedSaleCost > 0 &&
    animal.projectType === 'Market'
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
      predictedValue: animal.predictedSaleCost,
      acquisitionCost: animal.acquisitionCost,
      potentialProfit: animal.predictedSaleCost - animal.acquisitionCost
    });
    return acc;
  }, {});
  
  const note = animalsWithPredictions.length > 0 
    ? `*Based on predicted sale values for ${animalsWithPredictions.length} market ${animalsWithPredictions.length === 1 ? 'animal' : 'animals'}. This projection helps calculate your break-even point and potential profit for your SAE project.`
    : '*Set predicted sale costs for your market animals to see projected income and break-even analysis.';
  
  return {
    amount: totalPredictedIncome,
    note,
    breakdown: Object.entries(breakdown).map(([species, data]) => ({
      species,
      ...data
    }))
  };
}

// Calculate financial summary
const actualIncome = 0; // No animals sold yet
const predictedIncome = getPredictedIncome(animals);
const totalIncome = actualIncome + predictedIncome.amount;

const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
const netProfit = totalIncome - totalExpenses;

console.log('📊 FINANCIAL OVERVIEW DISPLAY:');
console.log('================================');
console.log(`💰 Total Income: $${totalIncome.toFixed(2)}`);
console.log(`   • Actual: $${actualIncome.toFixed(2)}`);
console.log(`   • Projected: $${predictedIncome.amount.toFixed(2)}`);
console.log(`📊 Total Expenses: $${totalExpenses.toFixed(2)}`);
console.log(`📈 Net Profit: $${netProfit.toFixed(2)}`);
console.log(`\n${predictedIncome.note}`);

console.log('\n🐄 ANIMAL BREAKDOWN:');
console.log('====================');
predictedIncome.breakdown.forEach(species => {
  console.log(`\n${species.species}:`);
  console.log(`   • Count: ${species.count} animals`);
  console.log(`   • Total Value: $${species.totalValue.toFixed(2)}`);
  
  species.animals.forEach(animal => {
    console.log(`   • ${animal.name} (${animal.earTag}):`);
    console.log(`     - Predicted Sale: $${animal.predictedValue.toFixed(2)}`);
    console.log(`     - Acquisition Cost: $${animal.acquisitionCost.toFixed(2)}`);
    console.log(`     - Potential Profit: $${animal.potentialProfit.toFixed(2)}`);
  });
});

console.log('\n📚 BREAK-EVEN ANALYSIS:');
console.log('========================');
console.log(`Break-even point: $${totalExpenses.toFixed(2)} (total expenses)`);
console.log(`Predicted income: $${predictedIncome.amount.toFixed(2)}`);
console.log(`Expected profit: $${netProfit.toFixed(2)}`);
console.log(`Profit margin: ${((netProfit / totalIncome) * 100).toFixed(1)}%`);

console.log('\n🎓 EDUCATIONAL VALUE:');
console.log('======================');
console.log('• Students learn to set realistic sale price goals');
console.log('• Demonstrates the relationship between costs and profit');
console.log('• Encourages market research and price awareness');
console.log('• Shows the importance of cost control in profitability');
console.log('• Prepares students for agricultural business careers');

console.log('\n🏆 FFA SAE INTEGRATION:');
console.log('========================');
console.log('• Supports Entrepreneurship SAE record keeping');
console.log('• Aligns with Agricultural Business Management CDE');
console.log('• Teaches financial planning and goal setting');
console.log('• Demonstrates profit/loss analysis skills');
console.log('• Provides data for FFA proficiency awards');

console.log('\n✅ IMPLEMENTATION STATUS:');
console.log('==========================');
console.log('✅ Animal.predictedSaleCost field added');
console.log('✅ Financial Store getPredictedIncome() function');
console.log('✅ Financial Overview displays predicted income');
console.log('✅ Animal Form includes predicted sale cost input');
console.log('✅ Educational notes and break-even analysis');
console.log('✅ Species-based breakdown for analysis');

console.log('\n🚀 Ready for FFA students to use for SAE projects!');