/**
 * AnalyticsService - PostHog Integration for ShowTrackAI
 * 
 * Privacy-first analytics service designed for educational platforms.
 * Complies with FERPA and COPPA requirements for student data protection.
 */

import { PostHog } from 'posthog-react-native';

// Analytics Event Types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface UserProperties {
  userRole?: 'student' | 'parent' | 'educator' | 'admin';
  subscriptionTier?: 'free' | 'premium' | 'family' | 'institutional';
  gradeLevel?: string;
  ffaChapter?: string;
  animalCount?: number;
  // Note: No PII (names, emails, addresses) should be included
  [key: string]: any; // Allow additional properties for PostHog compatibility
}

export interface ScreenViewEvent {
  screen: string;
  previousScreen?: string;
  timeSpent?: number;
  userRole?: string;
}

// Educational Analytics Events
export interface EducationalEvent {
  eventType: 'ffa_progress' | 'aet_skill' | 'journal_entry' | 'weight_tracking' | 'health_record';
  category?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  completionStatus?: 'started' | 'completed' | 'abandoned';
  educationalValue?: number; // 1-10 scale
}

class AnalyticsService {
  private posthog: PostHog | null = null;
  private isInitialized = false;
  private isEnabled = false;
  private userConsent = false;

  /**
   * Initialize PostHog with environment configuration
   */
  async initialize(): Promise<void> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
      const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;
      const analyticsEnabled = process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true';

      if (!apiKey || apiKey === 'phc_placeholder_key_replace_with_real_key') {
        console.warn('⚠️ PostHog API key not configured. Analytics disabled.');
        return;
      }

      if (!analyticsEnabled) {
        console.log('📊 Analytics disabled via environment configuration.');
        return;
      }

      this.posthog = new PostHog(apiKey, {
        host: host || 'https://us.i.posthog.com',
        enableSessionReplay: false, // Disabled for privacy
        captureAppLifecycleEvents: true,
        flushInterval: 30, // Flush events every 30 seconds
        flushAt: 10, // Flush after 10 events
      });

      await this.posthog.ready();

      this.isInitialized = true;
      this.isEnabled = true;

      console.log('✅ PostHog Analytics initialized successfully.');
    } catch (error) {
      console.error('❌ Failed to initialize PostHog Analytics:', error);
    }
  }

  /**
   * Set user consent for analytics tracking
   * Required for COPPA compliance
   */
  setUserConsent(hasConsent: boolean): void {
    this.userConsent = hasConsent;
    
    if (this.isInitialized && this.posthog) {
      if (hasConsent) {
        this.posthog.optIn();
        console.log('✅ User opted in to analytics tracking.');
      } else {
        this.posthog.optOut();
        console.log('⛔ User opted out of analytics tracking.');
      }
    }
  }

  /**
   * Identify user with anonymous/educational properties only
   * No PII is transmitted to comply with FERPA
   */
  identifyUser(userId: string, properties?: UserProperties): void {
    if (!this.shouldTrack()) return;

    try {
      // Use hashed/anonymous ID for privacy
      const anonymousId = this.hashUserId(userId);
      
      this.posthog!.identify(anonymousId, {
        userRole: properties?.userRole,
        subscriptionTier: properties?.subscriptionTier,
        gradeLevel: properties?.gradeLevel,
        ffaChapter: properties?.ffaChapter,
        animalCount: properties?.animalCount,
        // Explicitly exclude any PII
        timestamp: new Date().toISOString(),
      });

      console.log('👤 User identified for analytics (anonymous).');
    } catch (error) {
      console.error('❌ Failed to identify user:', error);
    }
  }

  /**
   * Track screen views for user journey analysis
   */
  trackScreenView(screen: string, properties?: Partial<ScreenViewEvent>): void {
    if (!this.shouldTrack()) return;

    try {
      this.posthog!.screen(screen, {
        screen_name: screen,
        previous_screen: properties?.previousScreen,
        time_spent_seconds: properties?.timeSpent,
        user_role: properties?.userRole,
        timestamp: new Date().toISOString(),
      });

      console.log(`📱 Screen view tracked: ${screen}`);
    } catch (error) {
      console.error('❌ Failed to track screen view:', error);
    }
  }

  /**
   * Track educational events (FFA progress, AET skills, etc.)
   */
  trackEducationalEvent(eventName: string, properties: EducationalEvent & Record<string, any>): void {
    if (!this.shouldTrack()) return;

    try {
      this.posthog!.capture(eventName, {
        event_category: 'education',
        event_type: properties.eventType,
        category: properties.category,
        skill_level: properties.skillLevel,
        completion_status: properties.completionStatus,
        educational_value: properties.educationalValue,
        timestamp: new Date().toISOString(),
        ...this.sanitizeProperties(properties),
      });

      console.log(`🎓 Educational event tracked: ${eventName}`);
    } catch (error) {
      console.error('❌ Failed to track educational event:', error);
    }
  }

  /**
   * Track feature usage for product optimization
   */
  trackFeatureUsage(featureName: string, properties?: Record<string, any>): void {
    if (!this.shouldTrack()) return;

    try {
      this.posthog!.capture('feature_used', {
        feature_name: featureName,
        event_category: 'feature_usage',
        timestamp: new Date().toISOString(),
        ...this.sanitizeProperties(properties || {}),
      });

      console.log(`⚡ Feature usage tracked: ${featureName}`);
    } catch (error) {
      console.error('❌ Failed to track feature usage:', error);
    }
  }

  /**
   * Track user engagement metrics
   */
  trackEngagement(action: string, properties?: Record<string, any>): void {
    if (!this.shouldTrack()) return;

    try {
      this.posthog!.capture('user_engagement', {
        action: action,
        event_category: 'engagement',
        timestamp: new Date().toISOString(),
        ...this.sanitizeProperties(properties || {}),
      });

      console.log(`💡 Engagement tracked: ${action}`);
    } catch (error) {
      console.error('❌ Failed to track engagement:', error);
    }
  }

  /**
   * Track errors and technical issues
   */
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.shouldTrack()) return;

    try {
      this.posthog!.capture('error_occurred', {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 1000), // Truncate for privacy
        event_category: 'error',
        context: this.sanitizeProperties(context || {}),
        timestamp: new Date().toISOString(),
      });

      console.log(`🚨 Error tracked: ${error.message}`);
    } catch (trackingError) {
      console.error('❌ Failed to track error:', trackingError);
    }
  }

  /**
   * Track business intelligence events
   */
  trackBusinessEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.shouldTrack()) return;

    try {
      this.posthog!.capture(eventName, {
        event_category: 'business',
        timestamp: new Date().toISOString(),
        ...this.sanitizeProperties(properties || {}),
      });

      console.log(`💼 Business event tracked: ${eventName}`);
    } catch (error) {
      console.error('❌ Failed to track business event:', error);
    }
  }

  /**
   * Set custom user properties (educational/non-PII only)
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.shouldTrack()) return;

    try {
      this.posthog!.group('user_cohort', 'educational_users', properties);
      console.log('📊 User properties updated.');
    } catch (error) {
      console.error('❌ Failed to set user properties:', error);
    }
  }

  /**
   * Flush analytics events immediately
   */
  async flush(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await this.posthog!.flush();
      console.log('💾 Analytics events flushed to PostHog.');
    } catch (error) {
      console.error('❌ Failed to flush analytics:', error);
    }
  }

  /**
   * Reset analytics state (e.g., on logout)
   */
  reset(): void {
    if (!this.isInitialized) return;

    try {
      this.posthog!.reset();
      console.log('🔄 Analytics state reset.');
    } catch (error) {
      console.error('❌ Failed to reset analytics:', error);
    }
  }

  /**
   * Get current feature flags
   */
  async getFeatureFlag(flagKey: string): Promise<boolean | string | undefined> {
    if (!this.isInitialized) return undefined;

    try {
      return await this.posthog!.getFeatureFlag(flagKey);
    } catch (error) {
      console.error('❌ Failed to get feature flag:', error);
      return undefined;
    }
  }

  /**
   * Check if analytics tracking should proceed
   */
  private shouldTrack(): boolean {
    return this.isInitialized && this.isEnabled && this.userConsent;
  }

  /**
   * Hash user ID for privacy protection
   */
  private hashUserId(userId: string): string {
    // Simple hash for demo - in production, use proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash)}`;
  }

  /**
   * Sanitize properties to remove potential PII
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const piiFields = ['email', 'name', 'firstName', 'lastName', 'address', 'phone', 'ssn'];

    for (const [key, value] of Object.entries(properties)) {
      // Skip PII fields
      if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        continue;
      }

      // Include non-PII data
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.length; // Convert arrays to counts for privacy
      } else if (value && typeof value === 'object') {
        sanitized[key] = '[object]'; // Avoid nested object tracking
      }
    }

    return sanitized;
  }

  /**
   * Check if analytics is properly initialized and enabled
   */
  get isReady(): boolean {
    return this.isInitialized && this.isEnabled && this.userConsent;
  }

  /**
   * Get current analytics status for debugging
   */
  getStatus(): {
    initialized: boolean;
    enabled: boolean;
    userConsent: boolean;
    ready: boolean;
  } {
    return {
      initialized: this.isInitialized,
      enabled: this.isEnabled,
      userConsent: this.userConsent,
      ready: this.isReady,
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Types are already exported above as interfaces