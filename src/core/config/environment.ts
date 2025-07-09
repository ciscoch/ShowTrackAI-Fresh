/**
 * Environment Configuration for ShowTrackAI
 * Manages all environment variables and feature flags
 */

export interface EnvironmentConfig {
  // Backend Configuration
  useBackend: boolean;
  apiUrl: string;
  
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  
  // Third-party Services
  openai: {
    apiKey: string;
    baseUrl?: string;
  };
  
  stripe: {
    publishableKey: string;
    secretKey?: string;
  };
  
  twilio: {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
  };
  
  sendgrid: {
    apiKey?: string;
    fromEmail?: string;
  };
  
  cloudinary: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  
  // Feature Flags
  features: {
    aiWeightPrediction: boolean;
    vetConnect: boolean;
    advancedAnalytics: boolean;
    offlineMode: boolean;
    qrCodeAccess: boolean;
    realtimeSync: boolean;
    pushNotifications: boolean;
  };
  
  // Development Configuration
  development: {
    enableLogging: boolean;
    debugMode: boolean;
    useMockData: boolean;
    skipAuthentication: boolean;
  };
  
  // App Configuration
  app: {
    version: string;
    buildNumber: string;
    environment: 'development' | 'staging' | 'production';
  };
}

// Default configuration
const defaultConfig: EnvironmentConfig = {
  useBackend: true,
  apiUrl: 'http://localhost:3000',
  
  supabase: {
    url: 'https://zifbuzsdhparxlhsifdi.supabase.co',
    anonKey: '', // Use environment variable only
  },
  
  openai: {
    apiKey: '',
  },
  
  stripe: {
    publishableKey: '',
  },
  
  twilio: {},
  sendgrid: {},
  cloudinary: {},
  
  features: {
    aiWeightPrediction: true,
    vetConnect: false,
    advancedAnalytics: false,
    offlineMode: true,
    qrCodeAccess: true,
    realtimeSync: false,
    pushNotifications: false,
  },
  
  development: {
    enableLogging: true,
    debugMode: true,
    useMockData: true,
    skipAuthentication: false,
  },
  
  app: {
    version: '1.0.0',
    buildNumber: '1',
    environment: 'development',
  },
};

// Environment-specific configurations
const environments = {
  development: {
    ...defaultConfig,
    useBackend: process.env.EXPO_PUBLIC_USE_BACKEND === 'true',
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zifbuzsdhparxlhsifdi.supabase.co',
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    
    openai: {
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
      baseUrl: process.env.EXPO_PUBLIC_OPENAI_BASE_URL,
    },
    
    stripe: {
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY,
    },
    
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
    },
    
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    
    features: {
      aiWeightPrediction: process.env.EXPO_PUBLIC_ENABLE_AI_WEIGHT === 'true',
      vetConnect: process.env.EXPO_PUBLIC_ENABLE_VET_CONNECT === 'true',
      advancedAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
      offlineMode: process.env.EXPO_PUBLIC_ENABLE_OFFLINE !== 'false',
      qrCodeAccess: process.env.EXPO_PUBLIC_ENABLE_QR_ACCESS !== 'false',
      realtimeSync: process.env.EXPO_PUBLIC_ENABLE_REALTIME === 'true',
      pushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH === 'true',
    },
    
    development: {
      enableLogging: process.env.EXPO_PUBLIC_ENABLE_LOGGING !== 'false',
      debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE !== 'false',
      useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false',
      skipAuthentication: process.env.EXPO_PUBLIC_SKIP_AUTH === 'true',
    },
    
    app: {
      version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      environment: 'development',
    },
  },
  
  staging: {
    ...defaultConfig,
    useBackend: true,
    
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    
    features: {
      aiWeightPrediction: true,
      vetConnect: true,
      advancedAnalytics: true,
      offlineMode: true,
      qrCodeAccess: true,
      realtimeSync: true,
      pushNotifications: true,
    },
    
    development: {
      enableLogging: true,
      debugMode: false,
      useMockData: false,
      skipAuthentication: false,
    },
    
    app: {
      version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      environment: 'staging' as const,
    },
  },
  
  production: {
    ...defaultConfig,
    useBackend: true,
    
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    
    features: {
      aiWeightPrediction: true,
      vetConnect: true,
      advancedAnalytics: true,
      offlineMode: true,
      qrCodeAccess: true,
      realtimeSync: true,
      pushNotifications: true,
    },
    
    development: {
      enableLogging: false,
      debugMode: false,
      useMockData: false,
      skipAuthentication: false,
    },
    
    app: {
      version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      environment: 'production' as const,
    },
  },
};

// Get current environment
const getCurrentEnvironment = (): keyof typeof environments => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  if (env in environments) {
    return env as keyof typeof environments;
  }
  return 'development';
};

// Export the configuration for the current environment
export const config: EnvironmentConfig = environments[getCurrentEnvironment()];

// Utility functions
export const isProduction = () => config.app.environment === 'production';
export const isDevelopment = () => config.app.environment === 'development';
export const isStaging = () => config.app.environment === 'staging';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  return config.features[feature];
};

// Backend configuration helpers
export const useSupabaseBackend = (): boolean => {
  const result = config.useBackend && !!config.supabase.url && !!config.supabase.anonKey;
  console.log('🔧 useSupabaseBackend check:', {
    useBackend: config.useBackend,
    hasUrl: !!config.supabase.url,
    hasAnonKey: !!config.supabase.anonKey,
    result
  });
  return result;
};

export const getApiUrl = (): string => {
  return config.apiUrl;
};

// Validation functions
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required environment variables for backend mode
  if (config.useBackend) {
    if (!config.supabase.url) {
      errors.push('EXPO_PUBLIC_SUPABASE_URL is required when using backend');
    }
    if (!config.supabase.anonKey) {
      errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is required when using backend');
    }
  }
  
  // Check AI features
  if (config.features.aiWeightPrediction && !config.openai.apiKey) {
    errors.push('EXPO_PUBLIC_OPENAI_API_KEY is required for AI weight prediction');
  }
  
  // Check VetConnect features
  if (config.features.vetConnect) {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      console.warn('Twilio configuration missing - video consultations may not work');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Development helpers
export const logConfig = (): void => {
  if (config.development.enableLogging) {
    console.log('📱 ShowTrackAI Configuration:', {
      environment: config.app.environment,
      version: config.app.version,
      useBackend: config.useBackend,
      features: config.features,
    });
    
    const validation = validateConfig();
    if (!validation.valid) {
      console.warn('⚠️ Configuration warnings:', validation.errors);
    }
  }
};

// Export config validation on import in development
if (isDevelopment()) {
  logConfig();
}