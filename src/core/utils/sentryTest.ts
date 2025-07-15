/**
 * Sentry Integration Test Utilities
 * 
 * Simple functions to test that Sentry is properly integrated
 * and capturing errors/events in ShowTrackAI.
 */

import { sentryService } from '../services/SentryService';

/**
 * Test basic Sentry error capture
 */
export const testSentryError = () => {
  try {
    console.log('🧪 Testing Sentry error capture...');
    
    sentryService.captureError(new Error('Test error from ShowTrackAI'), {
      feature: 'sentry_testing',
      action: 'test_error_capture',
      screen: 'test_screen',
      additional: {
        test_type: 'integration_test',
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log('✅ Sentry error test sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Sentry error test failed:', error);
    return false;
  }
};

/**
 * Test Sentry message capture
 */
export const testSentryMessage = () => {
  try {
    console.log('🧪 Testing Sentry message capture...');
    
    sentryService.captureMessage('ShowTrackAI Sentry integration test message', 'info', {
      feature: 'sentry_testing',
      action: 'test_message_capture',
      additional: {
        test_type: 'integration_test',
        app_version: '1.0.0',
        platform: 'react-native',
      },
    });
    
    console.log('✅ Sentry message test sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Sentry message test failed:', error);
    return false;
  }
};

/**
 * Test navigation tracking
 */
export const testSentryNavigation = () => {
  try {
    console.log('🧪 Testing Sentry navigation tracking...');
    
    sentryService.trackNavigation('test_screen_1', 'test_screen_2', 150);
    sentryService.trackScreenView('test_screen_2', 250);
    sentryService.trackUserInteraction('test_button', 'tap', 'test_screen_2', {
      test_data: 'navigation_test',
    });
    
    console.log('✅ Sentry navigation tests sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Sentry navigation test failed:', error);
    return false;
  }
};

/**
 * Test educational event tracking
 */
export const testSentryEducational = () => {
  try {
    console.log('🧪 Testing Sentry educational event tracking...');
    
    sentryService.trackEducationalEvent('test_ffa_event', {
      eventType: 'chapter_meeting',
      category: 'participation',
      skillLevel: 'intermediate',
      completionStatus: 'completed',
      educationalValue: 'high',
    });
    
    console.log('✅ Sentry educational test sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Sentry educational test failed:', error);
    return false;
  }
};

/**
 * Run all Sentry tests
 */
export const runAllSentryTests = async () => {
  console.log('🚀 Starting comprehensive Sentry integration tests...');
  
  const results = {
    error_capture: testSentryError(),
    message_capture: testSentryMessage(),
    navigation_tracking: testSentryNavigation(),
    educational_tracking: testSentryEducational(),
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 All Sentry integration tests passed!');
    sentryService.captureMessage('ShowTrackAI Sentry integration tests completed successfully', 'info', {
      feature: 'sentry_testing',
      action: 'integration_test_complete',
      additional: { all_tests_passed: true, ...results },
    });
  } else {
    console.log('⚠️ Some Sentry integration tests failed:', results);
    sentryService.captureMessage('ShowTrackAI Sentry integration tests had failures', 'warning', {
      feature: 'sentry_testing',
      action: 'integration_test_complete',
      additional: { all_tests_passed: false, ...results },
    });
  }
  
  return { allPassed, results };
};

/**
 * Get Sentry configuration status
 */
export const getSentryStatus = () => {
  const stats = sentryService.getPerformanceStats();
  console.log('📊 Sentry Status:', stats);
  return stats;
};