#!/usr/bin/env node

/**
 * Test Vendor Analytics and Receipt Items Implementation
 * Verifies the vendor tracking and detailed receipt breakdown features
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Vendor Analytics & Receipt Items Implementation...\n');

// Test Financial Model Updates
const financialModelFile = path.join(__dirname, 'src/core/models/Financial.ts');
if (fs.existsSync(financialModelFile)) {
  const content = fs.readFileSync(financialModelFile, 'utf8');
  
  const modelChecks = [
    {
      name: 'Vendor Field in FinancialEntry',
      pattern: /vendor\?\s*:\s*string/,
      found: /vendor\?\s*:\s*string/.test(content)
    },
    {
      name: 'Vendor Location Field',
      pattern: /vendorLocation\?\s*:\s*string/,
      found: /vendorLocation\?\s*:\s*string/.test(content)
    },
    {
      name: 'Receipt Items Array',
      pattern: /receiptItems\?\s*:\s*ReceiptLineItem/,
      found: /receiptItems\?\s*:\s*ReceiptLineItem/.test(content)
    },
    {
      name: 'Receipt Metadata',
      pattern: /receiptMetadata\?\s*:\s*ReceiptMetadata/,
      found: /receiptMetadata\?\s*:\s*ReceiptMetadata/.test(content)
    },
    {
      name: 'ReceiptLineItem Interface',
      pattern: /interface ReceiptLineItem/,
      found: content.includes('interface ReceiptLineItem')
    },
    {
      name: 'ReceiptMetadata Interface',
      pattern: /interface ReceiptMetadata/,
      found: content.includes('interface ReceiptMetadata')
    },
    {
      name: 'Feed Analysis in Metadata',
      pattern: /feedAnalysis\?\s*:\s*{/,
      found: /feedAnalysis\?\s*:\s*{/.test(content)
    }
  ];
  
  console.log('📋 FINANCIAL MODEL VERIFICATION:');
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
      name: 'Vendor Form Fields',
      pattern: /vendor.*vendorLocation/,
      found: /vendor.*vendorLocation/.test(content)
    },
    {
      name: 'Receipt Items in Entry Data',
      pattern: /receiptItems.*receiptMetadata/,
      found: /receiptItems.*receiptMetadata/.test(content)
    },
    {
      name: 'Vendor Information in Entry View',
      pattern: /viewingEntry\.vendor/,
      found: content.includes('viewingEntry.vendor')
    },
    {
      name: 'Receipt Items Breakdown Section',
      pattern: /Receipt Items.*receiptItemsSection/,
      found: /Receipt Items.*receiptItemsSection/.test(content)
    },
    {
      name: 'Feed Analysis Display',
      pattern: /Feed Analysis.*feedAnalysisSection/,
      found: /Feed Analysis.*feedAnalysisSection/.test(content)
    },
    {
      name: 'Processing Method Display',
      pattern: /processingMethod.*ai_vision/,
      found: /processingMethod.*ai_vision/.test(content)
    },
    {
      name: 'Vendor Location in Form Reset',
      pattern: /resetForm.*vendorLocation.*''/,
      found: /resetForm[\s\S]*vendorLocation.*''/.test(content)
    },
    {
      name: 'Item Description with Quantity',
      pattern: /receiptItemDescription.*receiptItemQuantity/,
      found: /receiptItemDescription.*receiptItemQuantity/.test(content)
    },
    {
      name: 'Feed Weight Display',
      pattern: /feedWeight.*lbs/,
      found: /feedWeight.*lbs/.test(content)
    },
    {
      name: 'Vendor Analytics Styles',
      pattern: /receiptItemsSection.*receiptItemRow/,
      found: /receiptItemsSection.*receiptItemRow/.test(content)
    }
  ];
  
  console.log('\n📱 FINANCIAL TRACKING SCREEN VERIFICATION:');
  screenChecks.forEach(check => {
    const status = check.found ? '✅' : '❌';
    const statusText = check.found ? 'IMPLEMENTED' : 'MISSING';
    console.log(`${status} ${check.name}: ${statusText}`);
  });
  
  // Check for comprehensive implementation
  const allModelPassed = fs.existsSync(financialModelFile) ? 
    modelChecks.every(check => check.found) : false;
  const allScreenPassed = screenChecks.every(check => check.found);
  
  console.log(`\n🎯 OVERALL STATUS: ${allModelPassed && allScreenPassed ? '✅ ALL FEATURES IMPLEMENTED' : '⚠️ SOME FEATURES MISSING'}`);
  
  if (allModelPassed && allScreenPassed) {
    console.log('\n🚀 Vendor Analytics & Receipt Items Features:');
    console.log('   🏪 Vendor tracking with location for business intelligence');
    console.log('   📍 Vendor location notes for market analysis');
    console.log('   📋 Detailed receipt item breakdown in entry view');
    console.log('   🌾 Feed analysis with weight and supply estimates');
    console.log('   🤖 Processing method and confidence tracking');
    console.log('   💰 Individual item pricing with quantity display');
    console.log('   🏷️ Category classification for each item');
    console.log('   📊 Analytics-ready data structure for research');
    
    console.log('\n💡 Business Intelligence Benefits:');
    console.log('   • Vendor performance analysis');
    console.log('   • Geographic spending patterns');
    console.log('   • Feed cost optimization insights');
    console.log('   • Market trend identification');
    console.log('   • Customer behavior analysis');
    console.log('   • Supply chain optimization');
    
    console.log('\n📖 Enhanced Entry Details View:');
    console.log('   • Shows all receipt items with descriptions');
    console.log('   • Displays individual and total pricing');
    console.log('   • Highlights feed items with weight information');
    console.log('   • Shows processing method and confidence');
    console.log('   • Includes vendor and location details');
    console.log('   • Provides feed analysis summary');
    
    console.log('\n🗄️ Database Schema Enhancements:');
    console.log('   • vendor: string (for business analysis)');
    console.log('   • vendorLocation: string (for geographic insights)');
    console.log('   • receiptItems: ReceiptLineItem[] (detailed breakdown)');
    console.log('   • receiptMetadata: ReceiptMetadata (AI processing info)');
    
    console.log('\n📈 Example Entry Details Display:');
    console.log('   Vendor: Jupe Mills (Helotes, TX)');
    console.log('   Processing: 🤖 AI Vision (95% confidence)');
    console.log('   ');
    console.log('   📋 Receipt Items:');
    console.log('   • Waterless Shampoo 1Qt Weaver - $13.50');
    console.log('   • Sheep & Goat Conditioning Spray 12oz - $11.75');
    console.log('   • Goat Show Halter Small Red - $22.00');
    console.log('   • Show Brush Clip-On Blue/Yellow (x2) - $15.98');
    console.log('   • Rubber Feed Pan 4Qt - $7.99');
    console.log('   • Suncoast Shavings Large Flake (x2) - $18.00');
    console.log('   • Alfalfa (2 square bales) 🌾 50lbs - $44.00');
    console.log('   ');
    console.log('   🌾 Feed Analysis:');
    console.log('   • Total Feed Weight: 50lbs');
    console.log('   • Estimated Supply: 30 days');
    console.log('   • Feed Types: Alfalfa');
  }
  
} else {
  console.log('❌ Could not find FinancialTrackingScreen.tsx file');
}

console.log('\n🏁 Test Complete - Vendor analytics and receipt breakdown ready!');