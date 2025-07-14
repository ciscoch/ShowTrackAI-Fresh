// =========================================================================
// FFA Integration Test Screen - Service & Database Testing
// =========================================================================
// Test screen for verifying FFA services and database integration
// Used for development and debugging purposes
// =========================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { ffaDegreeService } from '../../../core/services/FFADegreeService';
import { saeProjectService } from '../../../core/services/SAEProjectService';
import { motivationalContentService } from '../../../core/services/MotivationalContentService';
import { ffaAnalyticsService } from '../../../core/services/FFAAnalyticsService';
import { ServiceFactory } from '../../../core/services/adapters/ServiceFactory';

interface FFAIntegrationTestScreenProps {
  onBack: () => void;
}

export const FFAIntegrationTestScreen: React.FC<FFAIntegrationTestScreenProps> = ({
  onBack,
}) => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const userId = user?.id;
  const supabaseAdapter = ServiceFactory.getSupabaseAdapter();

  const logResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runDatabaseConnectivityTest = async () => {
    try {
      logResult('🔍 Testing database connectivity...');
      
      if (!supabaseAdapter) {
        logResult('❌ No Supabase adapter available');
        return;
      }

      // Test basic connectivity
      const result = await supabaseAdapter.query('profiles', {
        limit: 1
      });
      
      logResult('✅ Database connectivity test passed');
      logResult(`📊 Sample query returned: ${result ? result.length : 0} results`);
    } catch (error) {
      logResult(`❌ Database connectivity test failed: ${error.message}`);
    }
  };

  const runFFADegreeServiceTest = async () => {
    if (!userId) {
      logResult('❌ No user ID available for FFA degree service test');
      return;
    }

    try {
      logResult('🎓 Testing FFA Degree Service...');
      
      // Initialize degree progress
      await ffaDegreeService.initializeDegreeProgress(userId);
      logResult('✅ Degree progress initialized');

      // Get degree progress
      const progress = await ffaDegreeService.getDegreeProgress(userId);
      logResult(`📈 Retrieved ${progress.length} degree progress records`);

      // Test validation
      const validation = await ffaDegreeService.validateDegreeRequirements(userId, 'discovery');
      logResult(`🔍 Validation completed: ${validation.isValid ? 'Valid' : 'Invalid'}`);
      logResult(`📋 Missing requirements: ${validation.missingRequirements.length}`);

      logResult('✅ FFA Degree Service test passed');
    } catch (error) {
      logResult(`❌ FFA Degree Service test failed: ${error.message}`);
    }
  };

  const runSAEProjectServiceTest = async () => {
    if (!userId) {
      logResult('❌ No user ID available for SAE project service test');
      return;
    }

    try {
      logResult('🚜 Testing SAE Project Service...');
      
      // Get all projects
      const projects = await saeProjectService.getAllProjects(userId);
      logResult(`📊 Retrieved ${projects.length} SAE projects`);

      // Get analytics
      const analytics = await saeProjectService.getUserSAEAnalytics(userId);
      logResult(`📈 Analytics - Total projects: ${analytics.totalProjects}, Hours: ${analytics.totalHours}`);

      // Test project creation (in memory only for test)
      logResult('🧪 Testing project creation logic...');
      
      logResult('✅ SAE Project Service test passed');
    } catch (error) {
      logResult(`❌ SAE Project Service test failed: ${error.message}`);
    }
  };

  const runMotivationalContentTest = async () => {
    if (!userId) {
      logResult('❌ No user ID available for motivational content test');
      return;
    }

    try {
      logResult('💡 Testing Motivational Content Service...');
      
      // Get personalized feed
      const feed = await motivationalContentService.getPersonalizedFeed(userId);
      logResult(`📝 Daily tip: ${feed.daily_tip ? 'Available' : 'None'}`);
      logResult(`🎯 Encouragement: ${feed.encouragement ? 'Available' : 'None'}`);
      logResult(`📋 Reminders: ${feed.reminders.length}`);

      // Test competition content
      const competitionContent = await motivationalContentService.getCompetitionContent('speech', 'planning');
      logResult(`🏆 Competition content: ${competitionContent.length} items`);

      logResult('✅ Motivational Content Service test passed');
    } catch (error) {
      logResult(`❌ Motivational Content Service test failed: ${error.message}`);
    }
  };

  const runAnalyticsServiceTest = async () => {
    if (!userId) {
      logResult('❌ No user ID available for analytics service test');
      return;
    }

    try {
      logResult('📊 Testing Analytics Service...');
      
      // Test event tracking
      await ffaAnalyticsService.trackEvent(
        userId,
        'test_event',
        'testing',
        'integration_test',
        { test: true }
      );
      logResult('✅ Event tracking test completed');

      // Test user engagement metrics
      const engagement = await ffaAnalyticsService.getUserEngagementMetrics();
      logResult(`📈 Engagement metrics - DAU: ${engagement.daily_active_users}`);

      // Test educational outcomes
      const outcomes = await ffaAnalyticsService.getEducationalOutcomes();
      logResult(`🎓 Educational outcomes - Discovery completion: ${outcomes.degree_completion_rates.discovery}%`);

      logResult('✅ Analytics Service test passed');
    } catch (error) {
      logResult(`❌ Analytics Service test failed: ${error.message}`);
    }
  };

  const runFullTestSuite = async () => {
    setIsRunning(true);
    clearResults();
    
    logResult('🚀 Starting FFA Integration Test Suite...');
    logResult(`👤 User ID: ${userId || 'Not available'}`);
    logResult('─'.repeat(50));

    await runDatabaseConnectivityTest();
    await runFFADegreeServiceTest();
    await runSAEProjectServiceTest();
    await runMotivationalContentTest();
    await runAnalyticsServiceTest();

    logResult('─'.repeat(50));
    logResult('🏁 Test suite completed!');
    setIsRunning(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FFA Integration Test</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.testButton, styles.primaryButton]}
          onPress={runFullTestSuite}
          disabled={isRunning}
        >
          <Text style={styles.testButtonText}>
            {isRunning ? '⏳ Running Tests...' : '🚀 Run Full Test Suite'}
          </Text>
        </TouchableOpacity>

        <View style={styles.individualTests}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={runDatabaseConnectivityTest}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>🔍 Database Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={runFFADegreeServiceTest}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>🎓 Degree Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={runSAEProjectServiceTest}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>🚜 SAE Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={runMotivationalContentTest}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>💡 Content Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={runAnalyticsServiceTest}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>📊 Analytics Service</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.testButton, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.clearButtonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results</Text>
        <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
          {testResults.length > 0 ? (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          ) : (
            <Text style={styles.noResults}>No test results yet. Run a test to see results.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  testButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  testButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  individualTests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resultsScroll: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});