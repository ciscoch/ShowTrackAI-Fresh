# Authentication Flow Setup Guide

This guide explains how to set up and test the proper authentication flow for ShowTrackAI with Supabase backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      AppWithAuth                        │
│  (Wraps app with AuthProvider context)                  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    AuthProvider                         │
│  (Manages auth state, provides auth methods)           │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   RootNavigator                         │
│  (Decides: Auth Screen or Main App)                    │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
    ┌────────▼────────┐      ┌───────▼────────┐
    │   AuthScreen    │      │    Main App    │
    │ (Sign In/Up)    │      │  (Your App)    │
    └─────────────────┘      └────────────────┘
```

## Setup Instructions

### 1. Update Your App Entry Point

In your main App component (e.g., `App.tsx` or `App.js`), replace the content with:

```typescript
import React from 'react';
import AppWithAuth from './src/AppWithAuth';

export default function App() {
  // Normal mode - shows auth flow when backend is enabled
  return <AppWithAuth />;
  
  // Test mode - shows user management test screen
  // return <AppWithAuth testMode={true} />;
}
```

### 2. Environment Configuration

Ensure your `.env` file has:

```bash
# Enable Supabase backend
EXPO_PUBLIC_USE_BACKEND=true

# Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Update Your Main App Component

In `src/navigation/RootNavigator.tsx`, replace the `MainApp` placeholder with your actual app:

```typescript
// Import your actual main app/dashboard
import MainDashboard from '../features/dashboard/MainDashboard';

const MainApp: React.FC<MainAppProps> = ({ user, profile }) => {
  return (
    <MainDashboard 
      user={user}
      profile={profile}
    />
  );
};
```

## Testing the Auth Flow

### 1. First Time User Flow

1. **Launch App** → Shows AuthScreen
2. **Tap "Sign up"** → Shows registration form
3. **Fill in details:**
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
   - Role: Select one (student, educator, etc.)
4. **Create Account** → Creates auth user + profile
5. **Auto Sign In** → Redirects to main app

### 2. Returning User Flow

1. **Launch App** → Shows AuthScreen
2. **Enter credentials:**
   - Email: test@example.com
   - Password: password123
3. **Sign In** → Loads profile and redirects to main app

### 3. Password Reset Flow

1. **On Sign In screen** → Tap "Forgot password?"
2. **Enter email** → Send reset email
3. **Check email** → Click reset link
4. **Set new password** → Sign in with new password

## User Roles and Permissions

The auth flow supports these roles:

### Student
- Default role for most users
- Can manage their own animals and data
- Limited to own profile access

### Educator
- Can view and manage student profiles
- Access to educational oversight features
- Can create student relationships

### Parent
- Can view children's profiles and data
- Access to financial information
- Limited to linked children only

### Veterinarian
- Can provide health consultations
- Access to assigned animal health records
- Professional service features

### Admin
- Full system access
- Can manage all users and data
- Subscription tier management

## Using Auth Context in Your App

Once authenticated, you can use the auth context throughout your app:

```typescript
import { useAuth } from '../core/contexts/AuthContext';

function MyComponent() {
  const { 
    user,           // Current auth user
    profile,        // User's profile data
    isAuthenticated,// Auth state
    hasRole,        // Check user role
    signOut         // Sign out method
  } = useAuth();
  
  // Check user role
  if (hasRole('educator')) {
    // Show educator features
  }
  
  // Check subscription
  if (hasSubscriptionTier('elite')) {
    // Show premium features
  }
  
  return (
    <View>
      <Text>Welcome, {profile?.full_name}!</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

## Testing Different Scenarios

### Test Different User Roles

Create test accounts for each role:

1. **Student Account:**
   - Email: student@test.com
   - Role: Student

2. **Educator Account:**
   - Email: educator@test.com
   - Role: Educator

3. **Admin Account:**
   - Email: admin@test.com
   - Role: Admin

### Test Subscription Tiers

By default, all users start with 'freemium' tier. To test elite features:

1. Sign in as admin
2. Use admin panel to upgrade user to 'elite'
3. Sign out and sign back in as upgraded user
4. Verify elite features are accessible

### Test Profile Relationships

1. **Create educator account**
2. **Create student account**
3. **As educator:** Link student to your profile
4. **Verify:** Educator can see student data

## Troubleshooting

### "Backend is not enabled"
- Check `EXPO_PUBLIC_USE_BACKEND=true` in .env
- Restart Metro bundler after changing .env

### "Invalid credentials"
- Verify email/password are correct
- Check if user exists in Supabase Auth
- Ensure profile was created in profiles table

### "Failed to load profile"
- Check RLS policies are correctly configured
- Verify profile exists for the user
- Check Supabase logs for policy violations

### Session Persistence Issues
- Auth sessions are automatically persisted
- Check if cookies/storage is enabled
- Verify Supabase project settings

## Security Considerations

1. **Password Requirements:**
   - Minimum 6 characters (configurable in Supabase)
   - Consider adding stronger requirements

2. **Email Verification:**
   - Enable email verification in Supabase
   - Restrict features until email is verified

3. **Role Management:**
   - Only admins can change user roles
   - Roles are stored in profiles table
   - RLS policies enforce role-based access

## Next Steps

After setting up authentication:

1. **Customize the UI** to match your app's design
2. **Add social auth** (Google, Apple, etc.) if needed
3. **Implement profile onboarding** for new users
4. **Add analytics** to track user sign-ups
5. **Set up email templates** in Supabase

## Summary

With this auth flow:
- ✅ Users can sign up with different roles
- ✅ Profiles are automatically created
- ✅ Role-based access is enforced
- ✅ Subscription tiers are supported
- ✅ Session persistence works
- ✅ Password reset is available

The authentication system is now ready for production use!