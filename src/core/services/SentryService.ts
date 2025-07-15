/**
 * SentryService - Error Tracking and Performance Monitoring
 * 
 * Comprehensive error tracking, crash reporting, and performance monitoring
 * for ShowTrackAI using Sentry. Integrates with existing analytics pipeline.
 */

import * as Sentry from '@sentry/react-native';
import { User } from '@sentry/react-native';

interface SentryConfig {
  dsn: string;
  debug: boolean;
  environment: 'development' | 'staging' | 'production';
  tracesSampleRate: number;
  enableAutoSessionTracking: boolean;
  enableOutOfMemoryTracking: boolean;
  enableNativeCrashHandling: boolean;
  enableAutoPerformanceTracking: boolean;
}

interface ErrorContext {
  feature?: string;
  action?: string;
  userId?: string;
  screen?: string;
  additional?: Record<string, any>;
}

interface PerformanceContext {
  operation: string;
  description?: string;
  data?: Record<string, any>;
}

class SentryService {
  private static instance: SentryService;
  private isInitialized = false;
  private config: SentryConfig;

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  /**
   * Initialize Sentry with ShowTrackAI configuration
   */
  async initialize(): Promise<void> {
    try {
      this.config = this.getConfiguration();
      
      // Check if DSN is available before initializing
      if (!this.config.dsn) {
        console.warn('🔶 Sentry DSN not configured, skipping initialization');
        return;
      }

      Sentry.init({
        dsn: this.config.dsn,
        debug: this.config.debug,
        environment: this.config.environment,
        
        // Performance Monitoring
        tracesSampleRate: this.config.tracesSampleRate,
        enableAutoSessionTracking: this.config.enableAutoSessionTracking,
        enableOutOfMemoryTracking: this.config.enableOutOfMemoryTracking,
        enableNativeCrashHandling: this.config.enableNativeCrashHandling,
        enableAutoPerformanceTracking: this.config.enableAutoPerformanceTracking,

        // Custom configuration for ShowTrackAI
        beforeSend: (event) => {
          // Filter out development errors in production
          if (this.config.environment === 'production') {
            if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
              // Only log network errors with additional context
              return event.tags?.critical ? event : null;
            }
          }
          return event;
        },

        beforeBreadcrumb: (breadcrumb) => {
          // Enhanced breadcrumbs for ShowTrackAI features
          if (breadcrumb.category === 'navigation') {
            breadcrumb.data = {
              ...breadcrumb.data,
              app: 'ShowTrackAI',
              platform: 'react-native',
            };
          }
          return breadcrumb;
        },

        // Using default integrations that come with React Native
        // Custom tracing will be handled through manual tracking methods
      });

      // Set global tags for ShowTrackAI
      Sentry.setTag('app', 'ShowTrackAI');
      Sentry.setTag('platform', 'react-native');
      Sentry.setTag('feature_tier', 'elite');

      this.isInitialized = true;
      console.log('📊 Sentry initialized successfully for ShowTrackAI');

      // Test basic functionality
      this.addBreadcrumb('Sentry initialized', 'initialization', {
        version: '6.17.0',
        environment: this.config.environment,
      });

    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
      this.isInitialized = false;
      // Don't throw - app should continue without Sentry if needed
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: {
    id: string;
    email?: string;
    username?: string;
    subscription_tier?: string;
    ffa_chapter?: string;
  }): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      subscription_tier: user.subscription_tier,
      ffa_chapter: user.ffa_chapter,
    } as User);

    Sentry.setTag('subscription_tier', user.subscription_tier || 'unknown');
    Sentry.setTag('ffa_chapter', user.ffa_chapter || 'unknown');
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser(): void {
    if (!this.isInitialized) return;
    Sentry.setUser(null);
  }

  /**
   * Track errors with ShowTrackAI context
   */
  captureError(error: Error, context?: ErrorContext): void {
    if (!this.isInitialized) {
      console.error('Sentry not initialized, logging error:', error);
      return;
    }

    try {
      Sentry.withScope((scope) => {
        if (context) {
          // Set ShowTrackAI specific context
          if (context.feature) scope.setTag('feature', context.feature);
          if (context.action) scope.setTag('action', context.action);
          if (context.screen) scope.setTag('screen', context.screen);
          if (context.userId) scope.setUser({ id: context.userId });

          // Add additional context
          if (context.additional) {
            Object.entries(context.additional).forEach(([key, value]) => {
              scope.setContext(key, value);
            });
          }

          // Set level based on feature criticality
          if (context.feature === 'financial' || context.feature === 'medical') {
            scope.setLevel('error');
          } else if (context.feature === 'authentication') {
            scope.setLevel('warning');
          } else {
            scope.setLevel('info');
          }
        }

        Sentry.captureException(error);
      });

      console.log('📊 Error captured by Sentry:', {
        error: error.message,
        feature: context?.feature,
        action: context?.action,
      });

    } catch (sentryError) {
      console.error('Failed to capture error in Sentry:', sentryError);
    }
  }

  /**
   * Track custom messages and events
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (!this.isInitialized) {
      console.log('Sentry not initialized, logging message:', message);
      return;
    }

    try {
      Sentry.withScope((scope) => {
        scope.setLevel(level);
        
        if (context) {
          if (context.feature) scope.setTag('feature', context.feature);
          if (context.action) scope.setTag('action', context.action);
          if (context.screen) scope.setTag('screen', context.screen);
          
          if (context.additional) {
            Object.entries(context.additional).forEach(([key, value]) => {
              scope.setContext(key, value);
            });
          }
        }

        Sentry.captureMessage(message);
      });

    } catch (sentryError) {
      console.error('Failed to capture message in Sentry:', sentryError);
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, context?: PerformanceContext): any {
    if (!this.isInitialized) return null;

    try {
      // Use withScope for transaction tracking instead of deprecated startTransaction
      const mockTransaction = {
        name,
        op: context?.operation || 'unknown',
        description: context?.description,
        data: context?.data,
        tags: {
          app: 'ShowTrackAI',
          platform: 'react-native',
        },
        finish: () => {
          // Track completion as breadcrumb
          this.addBreadcrumb(`Transaction finished: ${name}`, 'performance', {
            operation: context?.operation || 'unknown',
            description: context?.description,
          });
        }
      };

      // Track transaction start as breadcrumb
      this.addBreadcrumb(`Transaction started: ${name}`, 'performance', {
        operation: context?.operation || 'unknown',
        description: context?.description,
        data: context?.data,
      });

      return mockTransaction;
    } catch (error) {
      console.error('Failed to start Sentry transaction:', error);
      return null;
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        message,
        category: `showtrack.${category}`,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        level: 'info',
      });
    } catch (error) {
      console.error('Failed to add Sentry breadcrumb:', error);
    }
  }

  /**
   * Track feature usage for performance monitoring
   */
  trackFeaturePerformance(feature: string, action: string, duration?: number): void {
    if (!this.isInitialized) return;

    try {
      const transaction = this.startTransaction(`${feature}.${action}`, {
        operation: 'feature_usage',
        description: `ShowTrackAI ${feature} feature usage`,
        data: {
          feature,
          action,
          duration,
        },
      });

      if (transaction && duration) {
        // Set transaction duration if provided
        setTimeout(() => {
          transaction.finish();
        }, duration);
      }

      this.addBreadcrumb(`Feature used: ${feature}.${action}`, 'feature_usage', {
        feature,
        action,
        duration,
      });

    } catch (error) {
      console.error('Failed to track feature performance:', error);
    }
  }

  /**
   * Get Sentry configuration based on environment
   */
  private getConfiguration(): SentryConfig {
    // Get configuration from environment variables
    const isDevelopment = __DEV__;
    
    return {
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://be3026a595cb40fafbafbdd80117ddd7@o4509670223577088.ingest.us.sentry.io/4509670225608704',
      debug: isDevelopment,
      environment: isDevelopment ? 'development' : 'production',
      tracesSampleRate: isDevelopment ? 1.0 : 0.1, // 100% in dev, 10% in prod
      enableAutoSessionTracking: true,
      enableOutOfMemoryTracking: true,
      enableNativeCrashHandling: true,
      enableAutoPerformanceTracking: true,
    };
  }

  /**
   * Integration with ShowTrackAI analytics service
   */
  trackEducationalEvent(eventType: string, properties: Record<string, any>): void {
    this.addBreadcrumb(`Educational event: ${eventType}`, 'education', {
      eventType,
      properties,
    });

    // Track high-value educational events as custom metrics
    if (['ffa_degree_progress', 'sae_project_completion', 'competition_entry'].includes(eventType)) {
      this.trackFeaturePerformance('education', eventType);
    }
  }

  /**
   * Track critical business events
   */
  trackBusinessEvent(eventType: string, properties: Record<string, any>): void {
    this.captureMessage(`Business event: ${eventType}`, 'info', {
      feature: 'business_intelligence',
      action: eventType,
      additional: { properties },
    });
  }

  /**
   * Track navigation events for ShowTrackAI custom navigation
   */
  trackNavigation(fromScreen: string, toScreen: string, duration?: number): void {
    if (!this.isInitialized) return;

    try {
      // Start navigation transaction
      const transaction = this.startTransaction(`navigation_${toScreen}`, {
        operation: 'navigation',
        description: `Navigate from ${fromScreen} to ${toScreen}`,
        data: {
          from_screen: fromScreen,
          to_screen: toScreen,
          navigation_type: 'screen_change',
        },
      });

      // Add breadcrumb for navigation
      this.addBreadcrumb(`Navigate: ${fromScreen} → ${toScreen}`, 'navigation', {
        from_screen: fromScreen,
        to_screen: toScreen,
        duration,
      });

      // Set current screen context
      Sentry.setContext('screen', {
        current_screen: toScreen,
        previous_screen: fromScreen,
        navigation_timestamp: new Date().toISOString(),
      });

      // Finish transaction if duration provided
      if (transaction && duration) {
        setTimeout(() => {
          transaction.finish();
        }, duration);
      }

    } catch (error) {
      console.error('Failed to track navigation:', error);
    }
  }

  /**
   * Track screen view with performance timing
   */
  trackScreenView(screenName: string, loadTime?: number): void {
    if (!this.isInitialized) return;

    try {
      // Create screen view transaction
      const transaction = this.startTransaction(`screen_${screenName}`, {
        operation: 'screen_load',
        description: `Load ${screenName} screen`,
        data: {
          screen_name: screenName,
          load_time: loadTime,
        },
      });

      // Set screen context
      Sentry.setContext('current_screen', {
        name: screenName,
        load_time: loadTime,
        timestamp: new Date().toISOString(),
      });

      // Add breadcrumb
      this.addBreadcrumb(`Screen loaded: ${screenName}`, 'screen_view', {
        screen_name: screenName,
        load_time: loadTime,
      });

      // Auto-finish transaction after load time
      if (transaction) {
        setTimeout(() => {
          transaction.finish();
        }, loadTime || 1000);
      }

    } catch (error) {
      console.error('Failed to track screen view:', error);
    }
  }

  /**
   * Track user interactions (button taps, form submissions, etc.)
   */
  trackUserInteraction(element: string, action: string, screen: string, data?: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      this.addBreadcrumb(`User interaction: ${action} on ${element}`, 'user_interaction', {
        element,
        action,
        screen,
        ...data,
      });

      // Track significant interactions as transactions
      if (['submit', 'save', 'delete', 'calculate'].some(keyword => action.includes(keyword))) {
        this.startTransaction(`interaction_${action}`, {
          operation: 'user_interaction',
          description: `User ${action} on ${element} in ${screen}`,
          data: {
            element,
            action,
            screen,
            ...data,
          },
        });
      }

    } catch (error) {
      console.error('Failed to track user interaction:', error);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<string, any> {
    if (!this.isInitialized) return {};

    return {
      isInitialized: this.isInitialized,
      environment: this.config?.environment,
      tracesSampleRate: this.config?.tracesSampleRate,
    };
  }
}

// Export singleton instance
export const sentryService = SentryService.getInstance();
export default SentryService;