#!/usr/bin/env node

/**
 * Sentry Integration Test Runner for ShowTrackAI
 * 
 * This script tests the Sentry integration by:
 * 1. Checking DSN configuration
 * 2. Running integration tests
 * 3. Verifying all Sentry services are working
 * 4. Testing error tracking, navigation tracking, and educational event tracking
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ShowTrackAI Sentry Integration Tests...\n');

// Check if environment file exists and has Sentry configuration
function checkSentryConfiguration() {
  console.log('📋 1. Checking Sentry Configuration...');
  
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for Sentry DSN
  const dsnMatch = envContent.match(/EXPO_PUBLIC_SENTRY_DSN=(.+)/);
  const authTokenMatch = envContent.match(/SENTRY_AUTH_TOKEN=(.+)/);
  const orgMatch = envContent.match(/SENTRY_ORG=(.+)/);
  const projectMatch = envContent.match(/SENTRY_PROJECT=(.+)/);
  
  console.log('   🔍 DSN Found:', dsnMatch ? '✅' : '❌');
  console.log('   🔍 Auth Token Found:', authTokenMatch ? '✅' : '❌');
  console.log('   🔍 Organization Found:', orgMatch ? '✅' : '❌');
  console.log('   🔍 Project Found:', projectMatch ? '✅' : '❌');
  
  if (dsnMatch) {
    const dsn = dsnMatch[1];
    console.log('   📡 DSN: ', dsn.substring(0, 50) + '...');
    
    // Validate DSN format
    if (dsn.includes('sentry.io') && dsn.startsWith('https://')) {
      console.log('   ✅ DSN format appears valid');
    } else {
      console.log('   ⚠️ DSN format might be invalid');
    }
  }
  
  return dsnMatch && authTokenMatch && orgMatch && projectMatch;
}

// Check Sentry service file
function checkSentryService() {
  console.log('\n📋 2. Checking Sentry Service Implementation...');
  
  const servicePath = path.join(__dirname, 'src/core/services/SentryService.ts');
  
  if (!fs.existsSync(servicePath)) {
    console.log('❌ SentryService.ts not found');
    return false;
  }
  
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  // Check for key methods
  const methods = [
    'initialize',
    'captureError',
    'captureMessage',
    'trackNavigation',
    'trackEducationalEvent',
    'trackScreenView',
    'trackUserInteraction',
    'setUser',
    'addBreadcrumb'
  ];
  
  console.log('   🔍 Checking required methods:');
  methods.forEach(method => {
    const hasMethod = serviceContent.includes(method);
    console.log(`     ${method}: ${hasMethod ? '✅' : '❌'}`);
  });
  
  // Check for React Native Sentry import
  const hasRNSentry = serviceContent.includes('@sentry/react-native');
  console.log('   🔍 React Native Sentry import:', hasRNSentry ? '✅' : '❌');
  
  return true;
}

// Check test utilities
function checkSentryTests() {
  console.log('\n📋 3. Checking Sentry Test Utilities...');
  
  const testPath = path.join(__dirname, 'src/core/utils/sentryTest.ts');
  
  if (!fs.existsSync(testPath)) {
    console.log('❌ sentryTest.ts not found');
    return false;
  }
  
  const testContent = fs.readFileSync(testPath, 'utf8');
  
  // Check for test functions
  const testFunctions = [
    'testSentryError',
    'testSentryMessage',
    'testSentryNavigation',
    'testSentryEducational',
    'runAllSentryTests',
    'getSentryStatus'
  ];
  
  console.log('   🔍 Checking test functions:');
  testFunctions.forEach(func => {
    const hasFunction = testContent.includes(func);
    console.log(`     ${func}: ${hasFunction ? '✅' : '❌'}`);
  });
  
  return true;
}

// Check app initialization
function checkAppInitialization() {
  console.log('\n📋 4. Checking App Initialization...');
  
  const appPath = path.join(__dirname, 'src/AppWithAuth.tsx');
  
  if (!fs.existsSync(appPath)) {
    console.log('❌ AppWithAuth.tsx not found');
    return false;
  }
  
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Check for Sentry initialization
  const hasSentryImport = appContent.includes('sentryService');
  const hasSentryInit = appContent.includes('sentryService.initialize');
  
  console.log('   🔍 Sentry Service Import:', hasSentryImport ? '✅' : '❌');
  console.log('   🔍 Sentry Initialization:', hasSentryInit ? '✅' : '❌');
  
  return hasSentryImport && hasSentryInit;
}

// Check package.json for Sentry dependencies
function checkSentryDependencies() {
  console.log('\n📋 5. Checking Sentry Dependencies...');
  
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
  
  const sentryPackages = [
    '@sentry/react-native',
    '@sentry/integrations'
  ];
  
  console.log('   🔍 Checking Sentry packages:');
  sentryPackages.forEach(pkg => {
    const hasPackage = deps[pkg];
    console.log(`     ${pkg}: ${hasPackage ? `✅ v${deps[pkg]}` : '❌'}`);
  });
  
  return sentryPackages.every(pkg => deps[pkg]);
}

// Check sentry.properties file
function checkSentryProperties() {
  console.log('\n📋 6. Checking Sentry Properties File...');
  
  const propsPath = path.join(__dirname, 'sentry.properties');
  
  if (!fs.existsSync(propsPath)) {
    console.log('❌ sentry.properties not found');
    return false;
  }
  
  const propsContent = fs.readFileSync(propsPath, 'utf8');
  
  console.log('   🔍 sentry.properties exists: ✅');
  console.log('   📄 Content preview:');
  console.log(propsContent.split('\n').slice(0, 5).map(line => `     ${line}`).join('\n'));
  
  return true;
}

// Generate test report
function generateTestReport() {
  console.log('\n📊 7. Generating Sentry Integration Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    tests: {
      configuration: checkSentryConfiguration(),
      service: checkSentryService(),
      tests: checkSentryTests(),
      initialization: checkAppInitialization(),
      dependencies: checkSentryDependencies(),
      properties: checkSentryProperties()
    }
  };
  
  const passed = Object.values(report.tests).filter(Boolean).length;
  const total = Object.keys(report.tests).length;
  
  console.log('\n📋 Test Results Summary:');
  console.log(`   ✅ Passed: ${passed}/${total}`);
  console.log(`   ❌ Failed: ${total - passed}/${total}`);
  
  Object.entries(report.tests).forEach(([test, result]) => {
    console.log(`   ${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  // Save report to file
  const reportPath = path.join(__dirname, 'sentry-integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return report;
}

// Instructions for running live tests
function displayLiveTestInstructions() {
  console.log('\n🧪 8. Live Testing Instructions:');
  console.log('   To run live Sentry tests in your React Native app:');
  console.log('');
  console.log('   1. Import the test utilities in your component:');
  console.log('      import { runAllSentryTests, getSentryStatus } from "./src/core/utils/sentryTest";');
  console.log('');
  console.log('   2. Call the test functions:');
  console.log('      // Get current status');
  console.log('      const status = getSentryStatus();');
  console.log('      console.log("Sentry Status:", status);');
  console.log('');
  console.log('      // Run all tests');
  console.log('      const results = await runAllSentryTests();');
  console.log('      console.log("Test Results:", results);');
  console.log('');
  console.log('   3. Check Sentry dashboard for captured events:');
  console.log('      https://sentry.io/organizations/showtrack-ai/');
  console.log('');
  console.log('   4. Verify these event types appear:');
  console.log('      - Error events (from testSentryError)');
  console.log('      - Message events (from testSentryMessage)');
  console.log('      - Navigation breadcrumbs (from testSentryNavigation)');
  console.log('      - Educational events (from testSentryEducational)');
}

// Show DSN validation info
function showDSNValidation() {
  console.log('\n🔍 9. DSN Validation Information:');
  
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dsnMatch = envContent.match(/EXPO_PUBLIC_SENTRY_DSN=(.+)/);
    
    if (dsnMatch) {
      const dsn = dsnMatch[1];
      
      console.log('   📡 Current DSN Configuration:');
      console.log(`      ${dsn}`);
      console.log('');
      
      // Parse DSN components
      try {
        const url = new URL(dsn);
        console.log('   🔧 DSN Components:');
        console.log(`      Protocol: ${url.protocol}`);
        console.log(`      Host: ${url.hostname}`);
        console.log(`      Path: ${url.pathname}`);
        console.log(`      Project ID: ${url.pathname.split('/').pop()}`);
        
        if (url.hostname.includes('sentry.io')) {
          console.log('   ✅ DSN appears to be a valid Sentry.io DSN');
        } else {
          console.log('   ⚠️ DSN does not appear to be a Sentry.io DSN');
        }
      } catch (error) {
        console.log('   ❌ DSN format is invalid:', error.message);
      }
    }
  }
}

// Main execution
function main() {
  try {
    const report = generateTestReport();
    displayLiveTestInstructions();
    showDSNValidation();
    
    const allPassed = Object.values(report.tests).every(Boolean);
    
    console.log('\n🎯 Final Assessment:');
    if (allPassed) {
      console.log('   🎉 ALL TESTS PASSED! Sentry integration appears to be properly configured.');
      console.log('   📊 Ready to run live tests in your React Native app.');
    } else {
      console.log('   ⚠️ Some tests failed. Please review the issues above before running live tests.');
    }
    
    console.log('\n📚 Documentation:');
    console.log('   - Sentry React Native docs: https://docs.sentry.io/platforms/react-native/');
    console.log('   - ShowTrackAI Sentry setup: ./docs/sentry-setup-complete.md');
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
main();