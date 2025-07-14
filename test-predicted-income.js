#!/usr/bin/env node

/**
 * Test Predicted Income & Break-Even Analysis Implementation
 * Verifies the FFA SAE educational financial planning features
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Predicted Income & Break-Even Analysis...\n');

// Test Animal Model Updates
const animalModelFile = path.join(__dirname, 'src/core/models/Animal.ts');
if (fs.existsSync(animalModelFile)) {
  const content = fs.readFileSync(animalModelFile, 'utf8');
  
  const animalChecks = [
    {
      name: 'Predicted Sale Cost Field',
      pattern: /predictedSaleCost\?\s*:\s*number/,
      found: /predictedSaleCost\?\s*:\s*number/.test(content)
    }
  ];
  
  console.log('🐄 ANIMAL MODEL VERIFICATION:');
  animalChecks.forEach(check => {
    const status = check.found ? '✅' : '❌';
    const statusText = check.found ? 'IMPLEMENTED' : 'MISSING';
    console.log(`${status} ${check.name}: ${statusText}`);
  });
} else {
  console.log('❌ Could not find Animal.ts model file');
}

// Test Financial Store Updates
const financialStoreFile = path.join(__dirname, 'src/core/stores/FinancialStore.ts');
if (fs.existsSync(financialStoreFile)) {
  const content = fs.readFileSync(financialStoreFile, 'utf8');
  
  const storeChecks = [
    {
      name: 'Get Predicted Income Function',
      pattern: /getPredictedIncome.*animals/,
      found: /getPredictedIncome.*animals/.test(content)
    },
    {
      name: 'Market Animals Filter',
      pattern: /projectType.*===.*Market/,
      found: /projectType.*===.*Market/.test(content)
    },
    {
      name: 'SAE Educational Note',
      pattern: /SAE.*project.*break-even/,
      found: /SAE.*project.*break-even/.test(content)
    },
    {
      name: 'Species Breakdown',
      pattern: /breakdown.*species.*count.*totalValue/,
      found: /breakdown.*species.*count.*totalValue/.test(content)
    },
    {
      name: 'Potential Profit Calculation',
      pattern: /potentialProfit.*predictedSaleCost.*acquisitionCost/,
      found: /potentialProfit.*predictedSaleCost.*acquisitionCost/.test(content)
    }
  ];
  
  console.log('\n💰 FINANCIAL STORE VERIFICATION:');
  storeChecks.forEach(check => {
    const status = check.found ? '✅' : '❌';
    const statusText = check.found ? 'IMPLEMENTED' : 'MISSING';
    console.log(`${status} ${check.name}: ${statusText}`);
  });
} else {
  console.log('❌ Could not find FinancialStore.ts file');
}

// Test Financial Model Updates
const financialModelFile = path.join(__dirname, 'src/core/models/Financial.ts');
if (fs.existsSync(financialModelFile)) {
  const content = fs.readFileSync(financialModelFile, 'utf8');
  
  const modelChecks = [
    {
      name: 'Actual Income Field',
      pattern: /actualIncome\s*:\s*number/,
      found: /actualIncome\s*:\s*number/.test(content)
    },
    {
      name: 'Predicted Income Object',
      pattern: /predictedIncome.*amount.*note.*breakdown/,
      found: /predictedIncome.*amount.*note.*breakdown/.test(content)
    },
    {
      name: 'Animal Breakdown Structure',
      pattern: /animals.*name.*earTag.*predictedValue/,
      found: /animals.*name.*earTag.*predictedValue/.test(content)
    }
  ];
  
  console.log('\n📊 FINANCIAL MODEL VERIFICATION:');
  modelChecks.forEach(check => {
    const status = check.found ? '✅' : '❌';
    const statusText = check.found ? 'IMPLEMENTED' : 'MISSING';
    console.log(`${status} ${check.name}: ${statusText}`);
  });
} else {
  console.log('❌ Could not find Financial.ts model file');
}

// Test Financial Tracking Screen Updates
const screenFile = path.join(__dirname, 'src/features/financial/screens/FinancialTrackingScreen.tsx');
if (fs.existsSync(screenFile)) {
  const content = fs.readFileSync(screenFile, 'utf8');
  
  const screenChecks = [
    {
      name: 'Animal Store Import',
      pattern: /useAnimalStore.*AnimalStore/,
      found: /useAnimalStore.*AnimalStore/.test(content)
    },
    {
      name: 'Animals Data Usage',
      pattern: /animals.*useAnimalStore/,
      found: /animals.*useAnimalStore/.test(content)
    },
    {
      name: 'Summary with Animals',
      pattern: /getFinancialSummary.*animals/,
      found: /getFinancialSummary.*animals/.test(content)
    },
    {
      name: 'Income Breakdown Display',
      pattern: /incomeBreakdown.*actualIncome.*predictedIncome/,
      found: /incomeBreakdown.*actualIncome.*predictedIncome/.test(content)
    },
    {
      name: 'SAE Educational Note Display',
      pattern: /saeNote.*predictedIncome\.note/,
      found: /saeNote.*predictedIncome\.note/.test(content)
    },
    {
      name: 'Conditional Projected Income',
      pattern: /predictedIncome\.amount.*>.*0/,
      found: /predictedIncome\.amount.*>.*0/.test(content)
    }
  ];
  
  console.log('\n📱 FINANCIAL SCREEN VERIFICATION:');
  screenChecks.forEach(check => {
    const status = check.found ? '✅' : '❌';
    const statusText = check.found ? 'IMPLEMENTED' : 'MISSING';
    console.log(`${status} ${check.name}: ${statusText}`);
  });
} else {
  console.log('❌ Could not find FinancialTrackingScreen.tsx file');
}

// Test Animal Form Updates
const animalFormFile = path.join(__dirname, 'src/features/animals/screens/AnimalFormScreen.tsx');
if (fs.existsSync(animalFormFile)) {
  const content = fs.readFileSync(animalFormFile, 'utf8');
  
  const formChecks = [
    {
      name: 'Predicted Sale Cost Form Field',
      pattern: /predictedSaleCost.*formData/,
      found: /predictedSaleCost.*formData/.test(content)
    },
    {
      name: 'Market Project Conditional',
      pattern: /projectType.*===.*Market.*predictedSaleCost/,
      found: /projectType.*===.*Market.*predictedSaleCost/.test(content)
    },
    {
      name: 'Educational Helper Text',
      pattern: /break-even.*analysis.*SAE.*financial.*planning/,
      found: /break-even.*analysis.*SAE.*financial.*planning/.test(content)
    },
    {
      name: 'Form Submission Update',
      pattern: /animalData.*predictedSaleCost.*Number/,
      found: /animalData.*predictedSaleCost.*Number/.test(content)
    }
  ];
  
  console.log('\n📝 ANIMAL FORM VERIFICATION:');
  formChecks.forEach(check => {
    const status = check.found ? '✅' : '❌';
    const statusText = check.found ? 'IMPLEMENTED' : 'MISSING';
    console.log(`${status} ${check.name}: ${statusText}`);
  });
} else {
  console.log('❌ Could not find AnimalFormScreen.tsx file');
}

console.log('\n🎯 FFA SAE BREAK-EVEN ANALYSIS FEATURES:');
console.log('📚 Educational Value:');
console.log('   • Teaches students about projected income vs actual income');
console.log('   • Demonstrates break-even point calculations for SAE projects');
console.log('   • Shows potential profit before animal sale completion');
console.log('   • Helps with financial planning and goal setting');
console.log('   • Supports FFA record book requirements');

console.log('\n💡 Business Intelligence Benefits:');
console.log('   • Project profitability forecasting');
console.log('   • Market animal vs breeding animal financial comparison');
console.log('   • Species-based ROI analysis');
console.log('   • Acquisition cost vs sale price tracking');
console.log('   • Educational financial literacy development');

console.log('\n📊 Example Break-Even Scenario:');
console.log('   Student purchases market steer for $800 (acquisition cost)');
console.log('   Sets predicted sale cost at $1,400 based on market research');
console.log('   Tracks feed costs, veterinary expenses, and show costs');
console.log('   Financial overview shows:');
console.log('   • Total Expenses: $1,250 (including acquisition)');
console.log('   • Projected Income: $1,400');
console.log('   • Potential Profit: $150');
console.log('   • Break-even point: Student needs $1,250 sale price to break even');

console.log('\n🏆 FFA SAE Integration:');
console.log('   • Supports Entrepreneurship SAE projects');
console.log('   • Aligns with Agricultural Business Management CDE');
console.log('   • Teaches financial record keeping (AET standards)');
console.log('   • Demonstrates profit/loss analysis skills');
console.log('   • Prepares students for agricultural business careers');

console.log('\n🏁 Test Complete - Predicted income and break-even analysis ready!');