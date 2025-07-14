#!/usr/bin/env node

/**
 * PostHog Integration Test Script
 * 
 * Run this script to verify PostHog configuration
 * before running the React Native app.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 PostHog Integration Test for ShowTrackAI');
console.log('==========================================');

// Test 1: Check environment file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  console.log('   Create a .env file with PostHog configuration');
  process.exit(1);
}

console.log('✅ .env file found');

// Test 2: Read and validate environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

const getEnvValue = (key) => {
  const line = envLines.find(line => line.startsWith(`${key}=`));
  return line ? line.split('=')[1] : null;
};

const posthogApiKey = getEnvValue('EXPO_PUBLIC_POSTHOG_API_KEY');
const posthogHost = getEnvValue('EXPO_PUBLIC_POSTHOG_HOST');
const analyticsEnabled = getEnvValue('EXPO_PUBLIC_ENABLE_ANALYTICS');

console.log('\n📊 PostHog Configuration:');
console.log(`   API Key: ${posthogApiKey ? (posthogApiKey.startsWith('phc_') ? '✅ Valid format' : '⚠️ Invalid format') : '❌ Missing'}`);
console.log(`   Host: ${posthogHost || 'https://us.i.posthog.com (default)'}`);
console.log(`   Analytics Enabled: ${analyticsEnabled || 'true (default)'}`);

// Test 3: Check for placeholder values
if (posthogApiKey === 'phc_placeholder_key_replace_with_real_key') {
  console.log('\n⚠️  WARNING: Still using placeholder API key');
  console.log('   Replace with your real PostHog API key from https://app.posthog.com');
}

if (!posthogApiKey || !posthogApiKey.startsWith('phc_')) {
  console.log('\n❌ Invalid PostHog API key format');
  console.log('   API key should start with "phc_"');
  process.exit(1);
}

// Test 4: Check React Native PostHog package
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const posthogVersion = packageJson.dependencies['posthog-react-native'];
if (!posthogVersion) {
  console.log('\n❌ posthog-react-native package not installed');
  console.log('   Run: npx expo install posthog-react-native');
  process.exit(1);
}

console.log(`\n✅ posthog-react-native installed: ${posthogVersion}`);

// Test 5: Check required Expo dependencies
const requiredPackages = [
  'expo-file-system',
  'expo-application', 
  'expo-device',
  'expo-localization'
];

const missingPackages = requiredPackages.filter(pkg => !packageJson.dependencies[pkg]);

if (missingPackages.length > 0) {
  console.log(`\n⚠️  Missing required packages: ${missingPackages.join(', ')}`);
  console.log('   Run: npx expo install ' + missingPackages.join(' '));
} else {
  console.log('\n✅ All required Expo packages installed');
}

// Test 6: Check PostHog integration files
const integrationFiles = [
  'src/core/services/AnalyticsService.ts',
  'src/core/hooks/useAnalytics.ts',
  'src/core/hooks/usePostHogFeatureFlags.tsx',
  'src/core/utils/posthogTest.ts'
];

console.log('\n📁 Integration Files:');
integrationFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
  }
});

// Summary
console.log('\n==========================================');
if (posthogApiKey && posthogApiKey.startsWith('phc_') && missingPackages.length === 0) {
  console.log('🎉 PostHog integration looks good!');
  console.log('\n📱 Next steps:');
  console.log('   1. Run: npm start');
  console.log('   2. Open the app and navigate to Elite Dashboard');
  console.log('   3. Check console for PostHog test results');
  console.log('   4. Visit https://app.posthog.com to see events');
} else {
  console.log('⚠️  PostHog integration needs attention');
  console.log('   Fix the issues above before running the app');
}
console.log('==========================================');