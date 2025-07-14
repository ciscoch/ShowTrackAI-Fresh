# ShowTrackAI Analytics Events Documentation

## 📊 Overview

This document outlines all analytics events tracked in ShowTrackAI using PostHog. Events are designed to be privacy-first and FERPA/COPPA compliant for educational use.

## 🔧 Configuration

### Environment Variables
```env
EXPO_PUBLIC_POSTHOG_API_KEY=your_posthog_api_key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

### Privacy Settings
- **User Consent Required**: Analytics only track with explicit user consent
- **No PII Tracking**: Personal information is never transmitted
- **Anonymous User IDs**: User IDs are hashed for privacy protection
- **Educational Focus**: Events designed for educational outcome tracking

## 📱 Screen Tracking Events

### Automatic Screen Views
All screens with `useAnalytics({ autoTrackScreenView: true })` automatically track:

```javascript
{
  event: "$screen",
  properties: {
    screen_name: "AnimalListScreen",
    previous_screen: "EliteDashboard",
    time_spent_seconds: 45,
    user_role: "student",
    timestamp: "2025-01-12T10:30:00Z"
  }
}
```

**Tracked Screens:**
- `AnimalListScreen` - Animal management overview
- `AnimalDetailsScreen` - Individual animal details
- `AnimalFormScreen` - Add/edit animal form
- `WeightHistoryScreen` - Weight tracking charts
- `AddWeightScreen` - Weight entry form
- `JournalListScreen` - Journal entries overview
- `JournalEntryScreen` - Journal creation/editing
- `FinancialTrackingScreen` - Financial management
- `MedicalRecordsScreen` - Health tracking
- `EnhancedFFADashboard` - FFA progress overview
- `ParentDashboard` - Parent oversight interface

## 🐄 Animal Management Events

### Animal Creation
```javascript
trackAnimalEvent('add_initiated', {
  action: 'add_initiated',
  animal_species: undefined, // Not yet selected
  animal_breed: undefined,
  has_photo: false
});
```

### Animal Viewing
```javascript
trackAnimalEvent('view_details', {
  action: 'view_details',
  animal_species: 'cattle',
  animal_breed: 'angus',
  has_photo: true
});
```

### Animal Editing
```javascript
trackAnimalEvent('edit_initiated', {
  action: 'edit_initiated',
  animal_species: 'cattle',
  animal_breed: 'angus',
  has_photo: true
});
```

### Animal Deletion
```javascript
// When delete button clicked
trackAnimalEvent('delete_initiated', animal);

// When user cancels
trackAnimalEvent('delete_cancelled', animal);

// When deletion completes
trackAnimalEvent('delete_completed', animal);
```

## ⚖️ Weight Tracking Events

### Weight Entry
```javascript
trackWeightEvent('weight_added', {
  measurement_type: 'scale', // scale, ai, visual, tape
  weight_value: 'recorded',
  has_bcs: true, // body condition score included
  eventType: 'weight_tracking',
  category: 'animal_science',
  completionStatus: 'completed'
});
```

### Weight History Analysis
```javascript
trackWeightEvent('history_viewed', {
  measurement_type: 'various',
  weight_value: 'recorded',
  has_bcs: true,
  eventType: 'weight_tracking',
  category: 'animal_science',
  completionStatus: 'started'
});
```

## 📖 Journal & AET Events

### Journal Entry Creation
```javascript
trackJournalEvent('entry_saved', {
  category: 'Animal Care & Management',
  has_photos: true,
  word_count: 145,
  aet_skills_identified: 3,
  eventType: 'journal_entry',
  completionStatus: 'completed'
});
```

### AET Skill Recognition
```javascript
trackAETEvent('Animal Science', {
  proficiencyLevel: 'intermediate',
  isCompleted: true,
  pointsEarned: 15,
  skillName: 'Livestock Nutrition',
  eventType: 'aet_skill',
  category: 'Animal Science',
  skillLevel: 'intermediate',
  completionStatus: 'completed'
});
```

## 🎓 FFA Progress Events

### Degree Progress Updates
```javascript
trackFFAEvent('requirement_completed', {
  degreeLevel: 'Greenhand',
  completedRequirements: 3,
  totalRequirements: 8,
  progressPercentage: 37.5,
  eventType: 'ffa_progress',
  category: 'degree_progress',
  completionStatus: 'completed'
});
```

### SAE Project Milestones
```javascript
trackFFAEvent('sae_milestone', {
  degreeLevel: 'Chapter',
  projectType: 'livestock',
  hoursLogged: 125,
  eventType: 'ffa_progress',
  category: 'sae_project',
  completionStatus: 'started'
});
```

## 🏥 Medical Records Events

### Health Record Creation
```javascript
trackMedicalEvent('record_saved', {
  observationType: 'routine',
  has_vitals: true,
  has_photos: false,
  vet_consultation: false,
  eventType: 'health_record',
  category: 'veterinary_science',
  completionStatus: 'completed'
});
```

### Veterinary Consultations
```javascript
trackMedicalEvent('vet_consultation_requested', {
  observationType: 'illness',
  has_vitals: true,
  has_photos: true,
  vet_consultation: true,
  eventType: 'health_record',
  category: 'veterinary_science',
  completionStatus: 'started'
});
```

## 💰 Financial Tracking Events

### Receipt Processing
```javascript
trackFinancialEvent('receipt_processed', {
  entry_type: 'expense',
  amount_range: '50_100',
  has_receipt: true,
  ai_processed: true,
  vendor: 'recorded',
  action: 'receipt_processed'
});
```

### Manual Entry
```javascript
trackFinancialEvent('manual_entry', {
  entry_type: 'income',
  amount_range: '500_1000',
  has_receipt: false,
  ai_processed: false,
  vendor: 'not_recorded',
  action: 'manual_entry'
});
```

## 👨‍👩‍👧‍👦 Parent Dashboard Events

### Progress Monitoring
```javascript
trackParentEvent('progress_viewed', {
  student_count: 2,
  evidence_submissions: 5,
  progress_view: 'detailed',
  action: 'progress_viewed'
});
```

### Evidence Submission
```javascript
trackParentEvent('evidence_submitted', {
  student_count: 1,
  evidence_type: 'photo',
  ffa_requirement: 'livestock_care',
  action: 'evidence_submitted'
});
```

## 🔐 Authentication Events

### User Login
```javascript
trackAuthEvent('login_success', {
  user_role: 'student',
  subscription_tier: 'premium',
  is_new_user: false,
  action: 'login_success'
});
```

### Profile Creation
```javascript
trackAuthEvent('profile_created', {
  user_role: 'student',
  subscription_tier: 'free',
  is_new_user: true,
  action: 'profile_created'
});
```

## 📊 Business Intelligence Events

### Subscription Changes
```javascript
trackSubscriptionEvent('upgrade_completed', {
  tier: 'premium',
  price: 45,
  billing_cycle: 'monthly',
  trial_status: false,
  action: 'upgrade_completed'
});
```

### Feature Usage Analytics
```javascript
trackCustomEvent('ai_weight_prediction', {
  accuracy_rating: 'high',
  user_satisfaction: 5,
  feature_category: 'ai_tools'
});
```

## 🚨 Error Tracking

### Technical Errors
```javascript
trackError(error, {
  screen: 'AnimalListScreen',
  user_action: 'delete_animal',
  feature: 'animal_management',
  error_category: 'network_error'
});
```

### User Experience Issues
```javascript
trackCustomEvent('user_friction', {
  issue_type: 'slow_loading',
  screen: 'WeightHistoryScreen',
  load_time_seconds: 8.5
});
```

## 🎯 Feature Flags

### A/B Testing
```javascript
const featureEnabled = await getFeatureFlag('new_dashboard_layout');

if (featureEnabled) {
  trackCustomEvent('feature_flag_exposure', {
    flag_name: 'new_dashboard_layout',
    variant: 'enabled',
    user_segment: 'premium_users'
  });
}
```

## 📈 Custom Educational Metrics

### Learning Progression
```javascript
trackEducationalEvent('skill_mastery_achieved', {
  eventType: 'aet_skill',
  category: 'Animal Science',
  skillLevel: 'expert',
  completionStatus: 'completed',
  educationalValue: 9,
  time_to_mastery_days: 45,
  prerequisite_skills_completed: 8
});
```

### Engagement Quality
```javascript
trackEngagement('deep_feature_usage', {
  session_duration_minutes: 25,
  features_used_count: 6,
  educational_actions: 12,
  engagement_quality: 'high'
});
```

## 🛡️ Privacy Compliance

### Data Sanitization
All events automatically:
- Remove PII fields (names, emails, addresses)
- Hash user identifiers
- Limit string lengths to prevent sensitive data leaks
- Convert complex objects to summary metrics

### User Consent Management
```javascript
// Set user consent
setAnalyticsConsent(true);

// Check analytics status
const status = analyticsStatus;
// Returns: { initialized: true, enabled: true, userConsent: true, ready: true }
```

### FERPA Compliance Features
- Educational records protection
- Parent/guardian consent for minors
- Transparent data usage policies
- Secure data transmission and storage

## 🔧 Development Tools

### Testing Analytics
```javascript
// Check if analytics is ready
console.log('Analytics ready:', isAnalyticsReady);

// View current status
console.log('Status:', analyticsStatus);

// Test event firing
trackCustomEvent('test_event', { test_data: 'analytics_working' });
```

### Debugging
- Enable debug logging: `EXPO_PUBLIC_DEBUG_MODE=true`
- Analytics events logged to console in development
- PostHog dashboard provides real-time event verification

## 📊 Dashboard Configuration

### Key Metrics to Track
1. **User Engagement**: Daily/weekly active users
2. **Feature Adoption**: Animal creation, weight tracking, journal entries
3. **Educational Outcomes**: FFA progress, AET skill completion
4. **Technical Performance**: Error rates, load times
5. **Business Metrics**: Subscription conversions, feature usage

### Recommended PostHog Dashboards
- **Student Progress Dashboard**: FFA degree completion, AET skills
- **Feature Usage Dashboard**: Most/least used features
- **Technical Health Dashboard**: Error rates, performance metrics
- **Business Intelligence Dashboard**: Conversion funnels, retention

---

*This documentation is automatically updated as new analytics events are added to ShowTrackAI.*