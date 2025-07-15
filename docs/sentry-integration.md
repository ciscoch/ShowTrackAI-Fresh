# Sentry Integration Guide - ShowTrackAI

## 🎯 Overview

ShowTrackAI now includes comprehensive error tracking and performance monitoring through Sentry integration. This provides real-time crash reporting, performance insights, and detailed error analysis for both development and production environments.

## 🔧 Setup Instructions

### 1. **Sentry Project Setup**

1. **Create Sentry Account**: Visit [sentry.io](https://sentry.io) and create an account
2. **Create Organization**: Set up organization named `showtrack-ai`
3. **Create Project**: Create a React Native project named `react-native`
4. **Get DSN**: Copy your project's DSN from Settings → Client Keys

### 2. **Environment Configuration**

Add the following to your `.env` file:

```bash
# Sentry Configuration  
EXPO_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=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
SENTRY_ORG=showtrack-ai
SENTRY_PROJECT=react-native
```

**Note**: Replace the DSN with your actual project DSN from your Sentry dashboard. The auth token provided above is ready to use.

### 3. **Installation Complete**

The following packages are already installed:
- ✅ `@sentry/react-native`
- ✅ `@sentry/integrations`

## 🚀 Features Implemented

### **Error Tracking**
- ✅ **Automatic Crash Reporting**: All unhandled exceptions captured
- ✅ **Manual Error Tracking**: Custom error capture with context
- ✅ **Performance Monitoring**: Transaction tracking and performance insights
- ✅ **User Context**: Anonymous user identification for better debugging
- ✅ **Custom Tags**: ShowTrackAI-specific tags (feature, action, screen)

### **Integration Points**
- ✅ **AnalyticsService Enhanced**: Errors automatically sent to both PostHog and Sentry
- ✅ **AppWithAuth Initialization**: Sentry initialized on app startup
- ✅ **Feature-Specific Context**: Each feature adds relevant context to errors
- ✅ **Educational Event Tracking**: Special handling for FFA/AET events

### **Privacy & Compliance**
- ✅ **FERPA Compliant**: No PII sent to Sentry
- ✅ **Anonymous User IDs**: Hashed user identifiers only
- ✅ **Filtered Breadcrumbs**: Educational context without sensitive data
- ✅ **Environment-Based Filtering**: Development errors filtered in production

## 📊 Usage Examples

### **Manual Error Capture**
```typescript
import { sentryService } from '../core/services/SentryService';

try {
  // Some operation that might fail
  await riskyOperation();
} catch (error) {
  sentryService.captureError(error, {
    feature: 'animal_management',
    action: 'weight_update',
    screen: 'AddWeightScreen',
    additional: { animalId: animal.id }
  });
}
```

### **Performance Tracking**
```typescript
const transaction = sentryService.startTransaction('ffa_degree_progress', {
  operation: 'calculation',
  description: 'Calculate FFA degree advancement',
  data: { userId, degreeLevel }
});

// Perform operation
await calculateDegreeProgress();

transaction?.finish();
```

### **Custom Messages**
```typescript
sentryService.captureMessage('User completed SAE project', 'info', {
  feature: 'sae_tracking',
  action: 'project_completion',
  additional: { projectType: 'livestock', duration: 180 }
});
```

### **Educational Event Tracking**
```typescript
// Automatically tracked through existing AnalyticsService
analyticsService.trackEducationalEvent('ffa_meeting_attendance', {
  eventType: 'chapter_meeting',
  category: 'participation',
  skillLevel: 'intermediate',
  completionStatus: 'completed',
  educationalValue: 'high'
});
```

## 🎯 ShowTrackAI-Specific Features

### **Contextual Error Tracking**
Each error includes ShowTrackAI-specific context:
- **Feature**: `animal_management`, `ffa_tracking`, `financial`, `medical`, etc.
- **Action**: `weight_entry`, `degree_calculation`, `receipt_processing`, etc.
- **Screen**: Current screen where error occurred
- **User Context**: Anonymous ID, subscription tier, FFA chapter

### **Educational Event Monitoring**
Special tracking for educational events:
- FFA degree progress tracking
- SAE project completion monitoring
- Competition participation tracking
- Skill development measurement

### **Performance Insights**
Monitor critical ShowTrackAI operations:
- Weight prediction AI performance
- Receipt processing with OpenAI Vision
- Database synchronization operations
- Photo upload and processing times

## 🔍 Error Categories

### **Critical Errors** (sent to Sentry immediately)
- Authentication failures
- Data corruption/loss
- Payment processing issues
- Medical record access problems

### **Feature Errors** (tracked with context)
- Animal weight calculation failures
- FFA degree calculation errors
- Journal photo upload issues
- Financial receipt processing problems

### **Performance Issues**
- Slow database queries
- Network timeout errors
- Memory usage spikes
- UI freezing/stalling

## 📈 Analytics Integration

### **Dual Tracking System**
1. **PostHog**: User behavior analytics, feature usage, educational metrics
2. **Sentry**: Error tracking, performance monitoring, crash reporting

### **Unified Context**
Both systems share consistent context:
- Anonymous user identification
- Feature-based tagging
- Educational event categorization
- Privacy-compliant data handling

## 🛠️ Development Workflow

### **Local Development**
- Sentry captures errors but with debug mode enabled
- Full error details logged to console
- Performance tracking active for optimization

### **Production Monitoring**
- Filtered error reporting (reduces noise)
- Performance sampling (10% of transactions)
- User session tracking
- Release tracking for deployment monitoring

## 🚨 Troubleshooting

### **Common Issues**

1. **Sentry Not Initialized**
   ```
   Error: Sentry not initialized, logging error: [Error details]
   ```
   **Solution**: Check DSN in environment variables

2. **Missing Context**
   ```
   Warning: Error captured without feature context
   ```
   **Solution**: Add feature context to error capture

3. **Permission Errors**
   ```
   Error: Failed to capture error in Sentry: [Permission details]
   ```
   **Solution**: Verify Sentry auth token and organization access

### **Debug Commands**

```typescript
// Check Sentry status
const stats = sentryService.getPerformanceStats();
console.log('Sentry Status:', stats);

// Test error capture
sentryService.captureMessage('Test message', 'info', {
  feature: 'testing',
  action: 'debug'
});
```

## 📊 Monitoring Dashboard

### **Key Metrics to Monitor**
- **Error Rate**: Errors per user session
- **Performance**: Average transaction times
- **Feature Usage**: Most/least used features
- **Educational Impact**: FFA/AET completion rates

### **Alerts Setup**
Recommended alerts:
- Error rate > 5% for any feature
- Performance degradation > 50% slower
- Critical feature failures (financial, medical)
- Authentication error spikes

## 🔐 Privacy & Security

### **Data Protection**
- **No PII**: Only anonymous IDs and educational metadata
- **FERPA Compliant**: Educational records remain private
- **Hashed Identifiers**: User IDs cryptographically hashed
- **Filtered Breadcrumbs**: Sensitive data automatically removed

### **Data Retention**
- **Errors**: 90 days retention
- **Performance**: 30 days retention
- **User Sessions**: 30 days retention
- **Breadcrumbs**: 30 days retention

## 🚀 Benefits for ShowTrackAI

### **For Developers**
- **Faster Debugging**: Detailed error context and stack traces
- **Performance Insights**: Identify slow operations and bottlenecks
- **Release Monitoring**: Track error rates across deployments
- **User Impact**: See which features are causing problems

### **For Students/Educators**
- **Better Reliability**: Proactive error detection and fixing
- **Improved Performance**: Optimized based on real usage data
- **Feature Optimization**: Data-driven feature improvements
- **Educational Value**: Better tracking of learning outcomes

### **For Business**
- **User Retention**: Reduce churn through better error handling
- **Feature Adoption**: Track which features provide most value
- **Cost Optimization**: Identify expensive operations
- **Compliance**: Maintain FERPA compliance with detailed monitoring

## 📋 Next Steps

1. **Set up Sentry account** with actual DSN
2. **Configure environment variables** with real tokens
3. **Test error capture** in development
4. **Set up production alerts** for critical errors
5. **Monitor performance metrics** after deployment
6. **Regular review** of error patterns and fixes

---

## 🎉 Integration Complete!

ShowTrackAI now has enterprise-grade error tracking and performance monitoring. This provides the foundation for:
- **Proactive error resolution**
- **Performance optimization**
- **Better user experience**
- **Educational outcome improvement**

*The integration maintains ShowTrackAI's commitment to student privacy while providing powerful insights for continuous improvement.* 📊✨