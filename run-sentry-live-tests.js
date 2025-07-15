/**
 * Live Sentry Tests Runner for ShowTrackAI
 * 
 * This script demonstrates how to run Sentry tests within the React Native app.
 * It can be imported and executed from any screen or component.
 */

// Import the test utilities
// Note: In a real React Native component, you would import from the actual paths
const testUtilities = {
  // Mock implementations for demonstration - replace with actual imports
  testSentryError: () => {
    console.log('🧪 Testing Sentry error capture...');
    return true;
  },
  
  testSentryMessage: () => {
    console.log('🧪 Testing Sentry message capture...');
    return true;
  },
  
  testSentryNavigation: () => {
    console.log('🧪 Testing Sentry navigation tracking...');
    return true;
  },
  
  testSentryEducational: () => {
    console.log('🧪 Testing Sentry educational event tracking...');
    return true;
  },
  
  getSentryStatus: () => {
    return {
      isInitialized: true,
      environment: 'development',
      tracesSampleRate: 1.0
    };
  }
};

/**
 * Example React Native Component Code
 * Copy this into your actual React Native component to run live tests
 */
const exampleComponentCode = `
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { 
  runAllSentryTests, 
  getSentryStatus,
  testSentryError,
  testSentryMessage,
  testSentryNavigation,
  testSentryEducational 
} from '../core/utils/sentryTest';
import { sentryService } from '../core/services/SentryService';

const SentryTestScreen = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runIndividualTest = async (testName, testFunction) => {
    try {
      console.log(\`🧪 Running \${testName}...\`);
      const result = await testFunction();
      console.log(\`✅ \${testName} completed:\`, result);
      Alert.alert('Test Complete', \`\${testName} completed successfully\`);
      return result;
    } catch (error) {
      console.error(\`❌ \${testName} failed:\`, error);
      Alert.alert('Test Failed', \`\${testName} failed: \${error.message}\`);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      console.log('🚀 Starting comprehensive Sentry tests...');
      
      // Get initial status
      const status = getSentryStatus();
      console.log('📊 Sentry Status:', status);
      
      // Run all tests
      const results = await runAllSentryTests();
      console.log('🎉 All tests completed:', results);
      
      setTestResults(results);
      
      Alert.alert(
        'Tests Complete', 
        \`All tests finished. Check console and Sentry dashboard for results.\`
      );
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      Alert.alert('Test Suite Failed', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Sentry Integration Tests
      </Text>
      
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
          }}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {isRunning ? 'Running Tests...' : 'Run All Sentry Tests'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Individual Tests:
        </Text>
        
        <TouchableOpacity
          style={{ backgroundColor: '#FF6B6B', padding: 10, borderRadius: 5, marginBottom: 5 }}
          onPress={() => runIndividualTest('Error Capture', testSentryError)}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Error Capture</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#4ECDC4', padding: 10, borderRadius: 5, marginBottom: 5 }}
          onPress={() => runIndividualTest('Message Capture', testSentryMessage)}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Message Capture</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#45B7D1', padding: 10, borderRadius: 5, marginBottom: 5 }}
          onPress={() => runIndividualTest('Navigation Tracking', testSentryNavigation)}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Navigation Tracking</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#F7B731', padding: 10, borderRadius: 5, marginBottom: 5 }}
          onPress={() => runIndividualTest('Educational Events', testSentryEducational)}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Test Educational Events</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Manual Tests:
        </Text>
        
        <TouchableOpacity
          style={{ backgroundColor: '#6C5CE7', padding: 10, borderRadius: 5, marginBottom: 5 }}
          onPress={() => {
            sentryService.setUser({
              id: 'test-user-123',
              email: 'test@showtrackai.com',
              subscription_tier: 'elite',
              ffa_chapter: 'Test Chapter'
            });
            Alert.alert('User Set', 'Test user context set in Sentry');
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Set Test User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#FD79A8', padding: 10, borderRadius: 5, marginBottom: 5 }}
          onPress={() => {
            sentryService.trackScreenView('SentryTestScreen', 500);
            Alert.alert('Screen Tracked', 'Screen view tracked in Sentry');
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Track Screen View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#FDCB6E', padding: 10, borderRadius: 5, marginBottom: 5 }}
          onPress={() => {
            sentryService.trackUserInteraction('test_button', 'manual_tap', 'SentryTestScreen', {
              test_data: 'manual_interaction_test'
            });
            Alert.alert('Interaction Tracked', 'User interaction tracked in Sentry');
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Track User Interaction</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={{ 
          backgroundColor: '#f0f0f0', 
          padding: 15, 
          borderRadius: 8,
          marginTop: 20 
        }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Last Test Results:
          </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}
      
      <View style={{ 
        backgroundColor: '#e8f4f8', 
        padding: 15, 
        borderRadius: 8,
        marginTop: 20 
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Verification Steps:
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20 }}>
          1. Run tests above{'\n'}
          2. Check console logs for test output{'\n'}
          3. Visit Sentry dashboard: https://sentry.io/organizations/showtrack-ai/{'\n'}
          4. Verify events appear in Issues and Performance sections{'\n'}
          5. Check breadcrumbs for navigation tracking{'\n'}
          6. Verify user context is set correctly
        </Text>
      </View>
    </ScrollView>
  );
};

export default SentryTestScreen;
`;

/**
 * Simulate running the tests (for demonstration)
 */
function runDemoTests() {
  console.log('🚀 ShowTrackAI Sentry Live Tests Demo\n');
  
  // Get status
  const status = testUtilities.getSentryStatus();
  console.log('📊 Sentry Status:', status);
  
  // Run tests
  const results = {
    error_capture: testUtilities.testSentryError(),
    message_capture: testUtilities.testSentryMessage(),
    navigation_tracking: testUtilities.testSentryNavigation(),
    educational_tracking: testUtilities.testSentryEducational(),
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n📋 Demo Test Results:');
  Object.entries(results).forEach(([test, result]) => {
    console.log(`   ${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  if (allPassed) {
    console.log('\n🎉 All demo tests passed!');
  } else {
    console.log('\n⚠️ Some demo tests failed.');
  }
  
  return { allPassed, results };
}

// Export everything for use
module.exports = {
  runDemoTests,
  exampleComponentCode,
  testUtilities
};

// If run directly, execute demo
if (require.main === module) {
  runDemoTests();
  
  console.log('\n📝 To implement in React Native:');
  console.log('1. Copy the example component code above');
  console.log('2. Create a new screen or add to existing component');
  console.log('3. Import the actual Sentry test utilities');
  console.log('4. Run tests and check Sentry dashboard');
  console.log('5. Verify all events appear correctly');
  
  console.log('\n🔗 Useful Links:');
  console.log('   Sentry Dashboard: https://sentry.io/organizations/showtrack-ai/');
  console.log('   React Native Docs: https://docs.sentry.io/platforms/react-native/');
  console.log('   ShowTrackAI Config: ./src/core/services/SentryService.ts');
}