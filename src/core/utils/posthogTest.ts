/**
 * PostHog Integration Test Utilities
 * 
 * Simple utilities to test that PostHog is working correctly
 * in the ShowTrackAI React Native app.
 */

import { usePostHog } from 'posthog-react-native';

/**
 * Test PostHog basic functionality
 */
export const testPostHogIntegration = () => {
  console.log('🔍 Testing PostHog Integration...');
  
  try {
    // Test environment variables
    const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;
    
    console.log('📊 PostHog Configuration:');
    console.log(`  API Key: ${apiKey ? 'Set ✅' : 'Missing ❌'}`);
    console.log(`  Host: ${host || 'Default'}`);
    console.log(`  Analytics Enabled: ${process.env.EXPO_PUBLIC_ENABLE_ANALYTICS || 'true'}`);
    
    if (!apiKey || apiKey === 'phc_placeholder_key_replace_with_real_key') {
      console.warn('⚠️  PostHog API key not set or still using placeholder');
      return false;
    }
    
    console.log('✅ PostHog configuration looks good!');
    return true;
  } catch (error) {
    console.error('❌ PostHog integration test failed:', error);
    return false;
  }
};

/**
 * Test PostHog event tracking
 */
export const testPostHogEvents = (posthog: ReturnType<typeof usePostHog>) => {
  if (!posthog) {
    console.error('❌ PostHog instance not available');
    return;
  }
  
  console.log('🧪 Testing PostHog event tracking...');
  
  try {
    // Test basic event
    posthog.capture('test_event', {
      test_property: 'integration_test',
      timestamp: new Date().toISOString(),
      app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    });
    
    // Test screen tracking
    posthog.screen('TestScreen', {
      screen_category: 'testing',
      integration_test: true,
    });
    
    console.log('✅ Test events sent successfully!');
    console.log('📊 Check your PostHog dashboard for events:');
    console.log(`   • test_event`);
    console.log(`   • $screen (TestScreen)`);
    
  } catch (error) {
    console.error('❌ Failed to send test events:', error);
  }
};

/**
 * Test PostHog feature flags
 */
export const testPostHogFeatureFlags = async (posthog: ReturnType<typeof usePostHog>) => {
  if (!posthog) {
    console.error('❌ PostHog instance not available');
    return;
  }
  
  console.log('🚩 Testing PostHog feature flags...');
  
  try {
    // Test a feature flag (replace with actual flag names from your PostHog dashboard)
    const testFlag = await posthog.getFeatureFlag('test-flag');
    const newDashboardFlag = await posthog.getFeatureFlag('new-dashboard-layout');
    const aiWeightFlag = await posthog.getFeatureFlag('ai-weight-prediction');
    
    console.log('🚩 Feature Flag Results:');
    console.log(`   test-flag: ${testFlag || 'not set'}`);
    console.log(`   new-dashboard-layout: ${newDashboardFlag || 'not set'}`);
    console.log(`   ai-weight-prediction: ${aiWeightFlag || 'not set'}`);
    
    // Send feature flag exposure events
    if (testFlag) {
      posthog.capture('$feature_flag_called', {
        $feature_flag: 'test-flag',
        $feature_flag_response: testFlag,
      });
    }
    
    console.log('✅ Feature flag test completed!');
    
  } catch (error) {
    console.error('❌ Feature flag test failed:', error);
  }
};

/**
 * Complete PostHog integration test
 */
export const runCompletePostHogTest = async (posthog?: ReturnType<typeof usePostHog>) => {
  console.log('🚀 Running Complete PostHog Integration Test...');
  console.log('===============================================');
  
  // Test 1: Configuration
  const configOk = testPostHogIntegration();
  
  if (!configOk) {
    console.log('❌ Configuration test failed. Fix configuration before proceeding.');
    return;
  }
  
  // Test 2: Events (if PostHog instance available)
  if (posthog) {
    testPostHogEvents(posthog);
    
    // Test 3: Feature Flags
    await testPostHogFeatureFlags(posthog);
  } else {
    console.log('ℹ️  PostHog instance not provided - skipping event and feature flag tests');
    console.log('   Call this function from a component that uses usePostHog() hook');
  }
  
  console.log('===============================================');
  console.log('🎉 PostHog integration test completed!');
  console.log('📊 Check your PostHog dashboard at: https://app.posthog.com');
};

/**
 * Example usage in a React component:
 * 
 * import { usePostHog } from 'posthog-react-native';
 * import { runCompletePostHogTest } from '../core/utils/posthogTest';
 * 
 * const MyComponent = () => {
 *   const posthog = usePostHog();
 *   
 *   useEffect(() => {
 *     runCompletePostHogTest(posthog);
 *   }, [posthog]);
 *   
 *   return <YourComponentJSX />;
 * };
 */