/**
 * useAnalytics Hook - React Hook for PostHog Analytics Integration
 * 
 * Provides easy-to-use analytics tracking for React components
 * with built-in privacy protection for educational platforms.
 * Enhanced with Sentry navigation and performance tracking.
 */

import { useCallback, useEffect, useRef } from 'react';
import { analyticsService, type EducationalEvent, type UserProperties } from '../services/AnalyticsService';
import { sentryService } from '../services/SentryService';

interface UseAnalyticsOptions {
  autoTrackScreenView?: boolean;
  screenName?: string;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { autoTrackScreenView = false, screenName } = options;
  const screenStartTime = useRef<Date | null>(null);
  const previousScreen = useRef<string | null>(null);

  // Auto-track screen view if enabled with Sentry integration
  useEffect(() => {
    if (autoTrackScreenView && screenName) {
      screenStartTime.current = new Date();
      
      // Track in PostHog
      analyticsService.trackScreenView(screenName, {
        previousScreen: previousScreen.current || undefined,
      });

      // Track in Sentry
      sentryService.trackScreenView(screenName);

      previousScreen.current = screenName;

      // Track screen exit time on unmount
      return () => {
        if (screenStartTime.current) {
          const timeSpent = Math.round((new Date().getTime() - screenStartTime.current.getTime()) / 1000);
          analyticsService.trackEngagement('screen_exit', {
            screen: screenName,
            time_spent_seconds: timeSpent,
          });
        }
      };
    }
  }, [autoTrackScreenView, screenName]);

  // Animal Management Analytics
  const trackAnimalEvent = useCallback((action: string, animalData?: any) => {
    analyticsService.trackFeatureUsage('animal_management', {
      action,
      animal_species: animalData?.species,
      animal_breed: animalData?.breed,
      has_photo: !!animalData?.photos?.length,
    });
  }, []);

  // Weight Tracking Analytics
  const trackWeightEvent = useCallback((action: string, weightData?: any) => {
    analyticsService.trackEducationalEvent('weight_tracking_event', {
      eventType: 'weight_tracking',
      category: 'animal_science',
      completionStatus: action === 'weight_added' ? 'completed' : 'started',
      measurement_type: weightData?.measurementType,
      weight_value: weightData?.weight ? 'recorded' : 'not_recorded',
      has_bcs: !!weightData?.bodyConditionScore,
    });
  }, []);

  // Journal Entry Analytics
  const trackJournalEvent = useCallback((action: string, journalData?: any) => {
    analyticsService.trackEducationalEvent('journal_entry_event', {
      eventType: 'journal_entry',
      category: journalData?.category || 'general',
      completionStatus: action === 'entry_saved' ? 'completed' : 'started',
      has_photos: !!journalData?.photos?.length,
      word_count: journalData?.description?.split(' ')?.length || 0,
      aet_skills_identified: journalData?.aetSkills?.length || 0,
    });
  }, []);

  // FFA Progress Analytics
  const trackFFAEvent = useCallback((action: string, ffaData?: any) => {
    analyticsService.trackEducationalEvent('ffa_progress_event', {
      eventType: 'ffa_progress',
      category: 'degree_progress',
      completionStatus: ffaData?.isCompleted ? 'completed' : 'started',
      degree_level: ffaData?.degreeLevel,
      requirements_completed: ffaData?.completedRequirements || 0,
      total_requirements: ffaData?.totalRequirements || 0,
      progress_percentage: ffaData?.progressPercentage || 0,
    });
  }, []);

  // AET Skills Analytics
  const trackAETEvent = useCallback((skillCategory: string, skillData?: any) => {
    analyticsService.trackEducationalEvent('aet_skill_event', {
      eventType: 'aet_skill',
      category: skillCategory,
      skillLevel: skillData?.proficiencyLevel || 'beginner',
      completionStatus: skillData?.isCompleted ? 'completed' : 'started',
      points_earned: skillData?.pointsEarned || 0,
      skill_name: skillData?.skillName,
    });
  }, []);

  // Medical Records Analytics
  const trackMedicalEvent = useCallback((action: string, medicalData?: any) => {
    analyticsService.trackEducationalEvent('health_record_event', {
      eventType: 'health_record',
      category: 'veterinary_science',
      completionStatus: action === 'record_saved' ? 'completed' : 'started',
      observation_type: medicalData?.observationType,
      has_vitals: !!(medicalData?.temperature || medicalData?.heartRate),
      has_photos: !!medicalData?.photos?.length,
      vet_consultation: !!medicalData?.vetConsultation,
    });
  }, []);

  // Financial Analytics
  const trackFinancialEvent = useCallback((action: string, financialData?: any) => {
    analyticsService.trackFeatureUsage('financial_tracking', {
      action,
      entry_type: financialData?.type, // income/expense
      amount_range: financialData?.amount ? getAmountRange(financialData.amount) : 'unknown',
      has_receipt: !!financialData?.receiptPhoto,
      ai_processed: !!financialData?.aiProcessed,
      vendor: financialData?.vendor ? 'recorded' : 'not_recorded',
    });
  }, []);

  // Parent Dashboard Analytics
  const trackParentEvent = useCallback((action: string, parentData?: any) => {
    analyticsService.trackFeatureUsage('parent_dashboard', {
      action,
      student_count: parentData?.studentCount || 1,
      evidence_submissions: parentData?.evidenceCount || 0,
      progress_view: parentData?.progressView || 'summary',
    });
  }, []);

  // User Authentication Analytics
  const trackAuthEvent = useCallback((action: string, authData?: any) => {
    analyticsService.trackFeatureUsage('authentication', {
      action,
      user_role: authData?.userRole,
      subscription_tier: authData?.subscriptionTier,
      is_new_user: !!authData?.isNewUser,
    });
  }, []);

  // AI Features Analytics
  const trackAIEvent = useCallback((action: string, aiData?: any) => {
    analyticsService.trackFeatureUsage('ai_features', {
      action,
      animal_species: aiData?.animal_species,
      prediction_type: aiData?.prediction_type || 'weight',
      confidence_score: aiData?.confidence_score,
      accuracy_rate: aiData?.accuracy_rate,
      model_version: aiData?.model_version || 'v2.1.0',
    });
  }, []);

  // User Interaction Tracking with Sentry
  const trackUserInteraction = useCallback((element: string, action: string, data?: any) => {
    if (screenName) {
      sentryService.trackUserInteraction(element, action, screenName, data);
    }
    
    // Also track in PostHog
    analyticsService.trackFeatureUsage('user_interaction', {
      screen: screenName,
      element,
      action,
      ...data,
    });
  }, [screenName]);

  // Error Tracking
  const trackError = useCallback((error: Error, context?: any) => {
    analyticsService.trackError(error, {
      screen: screenName,
      user_action: context?.userAction,
      feature: context?.feature,
    });
  }, [screenName]);

  // Business Intelligence Events
  const trackSubscriptionEvent = useCallback((action: string, subscriptionData?: any) => {
    analyticsService.trackBusinessEvent('subscription_event', {
      action,
      tier: subscriptionData?.tier,
      price: subscriptionData?.price,
      billing_cycle: subscriptionData?.billingCycle,
      trial_status: subscriptionData?.isTrialUser,
    });
  }, []);

  // Feature Flag Utilities
  const getFeatureFlag = useCallback(async (flagKey: string) => {
    return analyticsService.getFeatureFlag(flagKey);
  }, []);

  // User Identification
  const identifyUser = useCallback((userId: string, properties?: UserProperties) => {
    analyticsService.identifyUser(userId, properties);
  }, []);

  // Privacy Controls
  const setAnalyticsConsent = useCallback((hasConsent: boolean) => {
    analyticsService.setUserConsent(hasConsent);
  }, []);

  // Manual screen tracking
  const trackScreen = useCallback((screen: string, properties?: any) => {
    analyticsService.trackScreenView(screen, properties);
  }, []);

  // Custom event tracking
  const trackCustomEvent = useCallback((eventName: string, properties?: any) => {
    analyticsService.trackFeatureUsage(eventName, properties);
  }, []);

  // Feature usage tracking (direct access to analyticsService method)
  const trackFeatureUsage = useCallback((featureName: string, properties?: any) => {
    analyticsService.trackFeatureUsage(featureName, properties);
  }, []);

  // Helper function to categorize amounts for privacy
  const getAmountRange = (amount: number): string => {
    if (amount < 10) return 'under_10';
    if (amount < 50) return '10_50';
    if (amount < 100) return '50_100';
    if (amount < 500) return '100_500';
    if (amount < 1000) return '500_1000';
    return 'over_1000';
  };

  return {
    // Core tracking functions
    trackScreen,
    trackCustomEvent,
    trackFeatureUsage,
    trackUserInteraction,
    trackError,
    identifyUser,
    setAnalyticsConsent,
    getFeatureFlag,

    // Feature-specific tracking
    trackAnimalEvent,
    trackWeightEvent,
    trackJournalEvent,
    trackFFAEvent,
    trackAETEvent,
    trackMedicalEvent,
    trackFinancialEvent,
    trackParentEvent,
    trackAuthEvent,
    trackSubscriptionEvent,
    trackAIEvent,

    // Service status
    isAnalyticsReady: analyticsService.isReady,
    analyticsStatus: analyticsService.getStatus(),
  };
};

// Export for use in class components
export { analyticsService as Analytics };

// Helper hook for feature flags
export const useFeatureFlag = (flagKey: string, defaultValue?: boolean | string) => {
  const { getFeatureFlag } = useAnalytics();
  
  useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        const flagValue = await getFeatureFlag(flagKey);
        if (mounted && flagValue !== undefined) {
          // Flag value would be handled by component state
          console.log(`🚩 Feature flag ${flagKey}:`, flagValue);
        }
      } catch (error) {
        console.error(`❌ Failed to check feature flag ${flagKey}:`, error);
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flagKey, getFeatureFlag]);

  return defaultValue;
};