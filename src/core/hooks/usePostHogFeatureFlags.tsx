/**
 * PostHog Feature Flags Hook for ShowTrackAI
 * 
 * Custom hook for managing PostHog feature flags in React Native
 * with proper error handling and fallback values.
 */

import React, { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';

interface FeatureFlagConfig {
  [key: string]: boolean | string | number;
}

// Default feature flag values (fallbacks)
const DEFAULT_FLAGS: FeatureFlagConfig = {
  'new-dashboard-layout': false,
  'ai-weight-prediction': true,
  'advanced-analytics': false,
  'elite-features': true,
  'beta-calendar': false,
  'vet-connect-integration': false,
  'photo-analysis': true,
  'competition-tracking': false,
  'parent-oversight': true,
  'enhanced-journal': false,
};

export const usePostHogFeatureFlags = () => {
  const posthog = usePostHog();
  const [flags, setFlags] = useState<FeatureFlagConfig>(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeatureFlags = async () => {
      if (!posthog) {
        console.log('📝 PostHog not available, using default feature flags');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const flagPromises = Object.keys(DEFAULT_FLAGS).map(async (flagKey) => {
          try {
            const flagValue = await posthog.getFeatureFlag(flagKey);
            return [flagKey, flagValue ?? DEFAULT_FLAGS[flagKey]];
          } catch (err) {
            console.warn(`⚠️ Failed to load feature flag '${flagKey}':`, err);
            return [flagKey, DEFAULT_FLAGS[flagKey]];
          }
        });

        const flagResults = await Promise.all(flagPromises);
        const newFlags: FeatureFlagConfig = Object.fromEntries(flagResults);
        
        setFlags(newFlags);
        
        // Track feature flag exposure for analytics
        Object.entries(newFlags).forEach(([flagKey, flagValue]) => {
          if (flagValue !== DEFAULT_FLAGS[flagKey]) {
            posthog.capture('$feature_flag_called', {
              $feature_flag: flagKey,
              $feature_flag_response: flagValue,
              flag_source: 'posthog',
            });
          }
        });

        console.log('🚩 Feature flags loaded:', newFlags);
        
      } catch (err) {
        console.error('❌ Failed to load feature flags:', err);
        setError('Failed to load feature flags');
        // Keep using default flags on error
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatureFlags();
  }, [posthog]);

  // Individual flag getters with proper typing
  const getFlag = (flagKey: string, defaultValue?: any) => {
    const value = flags[flagKey];
    return value !== undefined ? value : defaultValue;
  };

  const getBooleanFlag = (flagKey: string, defaultValue: boolean = false): boolean => {
    const value = getFlag(flagKey, defaultValue);
    return Boolean(value);
  };

  const getStringFlag = (flagKey: string, defaultValue: string = ''): string => {
    const value = getFlag(flagKey, defaultValue);
    return String(value);
  };

  const getNumberFlag = (flagKey: string, defaultValue: number = 0): number => {
    const value = getFlag(flagKey, defaultValue);
    return Number(value) || defaultValue;
  };

  // ShowTrackAI specific feature flags
  const featureFlags = {
    // UI/UX Features
    newDashboardLayout: getBooleanFlag('new-dashboard-layout'),
    betaCalendar: getBooleanFlag('beta-calendar'),
    enhancedJournal: getBooleanFlag('enhanced-journal'),
    
    // AI Features
    aiWeightPrediction: getBooleanFlag('ai-weight-prediction'),
    photoAnalysis: getBooleanFlag('photo-analysis'),
    
    // Premium Features
    eliteFeatures: getBooleanFlag('elite-features'),
    advancedAnalytics: getBooleanFlag('advanced-analytics'),
    
    // Integration Features
    vetConnectIntegration: getBooleanFlag('vet-connect-integration'),
    competitionTracking: getBooleanFlag('competition-tracking'),
    
    // Educational Features
    parentOversight: getBooleanFlag('parent-oversight'),
    
    // Get any flag by name
    getFlag,
    getBooleanFlag,
    getStringFlag,
    getNumberFlag,
  };

  return {
    ...featureFlags,
    flags,
    isLoading,
    error,
    posthog,
  };
};

/**
 * HOC for conditional rendering based on feature flags
 */
export const withFeatureFlag = <P extends object>(
  Component: React.ComponentType<P>,
  flagKey: string,
  defaultValue: boolean = false
) => {
  return (props: P) => {
    const { getBooleanFlag, isLoading } = usePostHogFeatureFlags();
    
    if (isLoading) {
      return null; // or loading component
    }
    
    if (!getBooleanFlag(flagKey, defaultValue)) {
      return null;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Example usage:
 * 
 * // Basic usage
 * const { aiWeightPrediction, newDashboardLayout } = usePostHogFeatureFlags();
 * 
 * if (aiWeightPrediction) {
 *   // Show AI features
 * }
 * 
 * // A/B Testing
 * const dashboardVariant = getStringFlag('dashboard-variant', 'default');
 * 
 * // Conditional rendering
 * const BetaFeature = withFeatureFlag(MyComponent, 'beta-feature');
 */

/**
 * Feature flag experiment helper
 */
export const useExperiment = (experimentKey: string) => {
  const { getStringFlag, posthog } = usePostHogFeatureFlags();
  const variant = getStringFlag(experimentKey, 'control');
  
  useEffect(() => {
    if (posthog && variant !== 'control') {
      posthog.capture('experiment_exposure', {
        experiment_key: experimentKey,
        variant,
        exposure_time: new Date().toISOString(),
      });
    }
  }, [experimentKey, variant, posthog]);
  
  return {
    variant,
    isControl: variant === 'control',
    isTest: variant === 'test',
    isVariant: (variantName: string) => variant === variantName,
  };
};