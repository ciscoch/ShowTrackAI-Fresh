# User Management Verification Guide

## Overview
This guide helps you verify the user management functionality of the ShowTrackAI backend integration, including profile management with roles, organization relationships, and subscription tier enforcement.

## Prerequisites

### 1. Environment Setup
Ensure your `.env` file contains:
```
EXPO_PUBLIC_USE_BACKEND=true
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. SQL Deployment Complete
All SQL files should be successfully deployed to your Supabase project:
- ✅ database.sql (main schema)
- ✅ seed.sql (initial data)
- ✅ 02-storage-simple.sql (storage buckets)
- ✅ 03-user-storage-table-fixed.sql (user storage)
- ✅ 04-additional-policies-fixed.sql (RLS policies)
- ✅ 05-final-setup.sql (final configuration)

## Testing User Management Features

### Accessing the Test Screen

1. **Import the test screen** in your navigation or main app component:
   ```typescript
   import { UserManagementTestScreen } from './src/features/profile/screens';
   ```

2. **Add to your navigation** (example with React Navigation):
   ```typescript
   <Stack.Screen 
     name="UserManagementTest" 
     component={UserManagementTestScreen} 
     options={{ title: 'User Management Test' }}
   />
   ```

3. **Navigate to the screen** from your app's debug/admin section

### Test Scenarios

#### 1. User Registration with Different Roles

**Test Student Registration:**
- Email: `student@test.com`
- Password: `password123`
- Full Name: `Test Student`
- Role: `student`

**Expected Results:**
- ✅ User account created in Supabase Auth
- ✅ Profile created in `profiles` table with role 'student'
- ✅ Default subscription tier set to 'freemium'
- ✅ RLS policies allow user to see own profile only

**Test Educator Registration:**
- Email: `educator@test.com`
- Password: `password123`
- Full Name: `Test Educator`
- Role: `educator`

**Expected Results:**
- ✅ User account created with educator role
- ✅ Can view student profiles in their organization
- ✅ Can create educator-student relationships

**Test Admin Registration:**
- Email: `admin@test.com`
- Password: `password123`
- Full Name: `Test Admin`
- Role: `admin`

**Expected Results:**
- ✅ User account created with admin role
- ✅ Can view all profiles regardless of organization
- ✅ Can update subscription tiers
- ✅ Can create profile relationships

#### 2. Profile Management Tests

**Profile Updates:**
- Test updating profile information (name, phone, address)
- Verify `updated_at` timestamp changes
- Ensure RLS policies prevent unauthorized updates

**Profile Visibility:**
- As admin: Should see all profiles
- As educator: Should see students and educators in organization
- As parent: Should see only linked children
- As student: Should see only own profile

#### 3. Role-Based Access Control

**Role Verification:**
- Test `hasRole()` function with different roles
- Verify users can only access features allowed by their role
- Test role changes (admin only)

**Subscription Tier Enforcement:**
- Test freemium vs elite access levels
- Verify animal count limits (freemium: 5, elite: 100)
- Test feature access based on subscription tier

#### 4. Organization and Relationships

**Student-Educator Relationships:**
- Create educator-student relationship
- Verify educator can access student's data
- Test relationship permissions

**Parent-Child Relationships:**
- Create parent-child relationship
- Verify parent can access child's profile and animals
- Test financial data access (parents only)

### Expected Test Results

#### Authentication Tests
```
✅ Sign up successful! User ID: [uuid]
✅ Session created with access token
✅ Sign in successful! User: test@example.com
✅ User role: student
✅ Sign out successful!
```

#### Profile Tests
```
✅ Profile updated successfully!
✅ New name: Updated Test User
✅ New phone: +1234567890
✅ Found 3 profiles (role-based filtering working)
✅ Found 2 students
✅ Found 1 educators
```

#### Role and Subscription Tests
```
✅ Has student role: true
✅ Has admin role: false
✅ Animal limit: 0/5 (can add: true)
✅ Freemium access: true
✅ Elite access: false
```

### Troubleshooting Common Issues

#### Backend Not Enabled
```
Backend is not enabled. Set EXPO_PUBLIC_USE_BACKEND=true to test user management.
```
**Solution:** Check your environment variables and restart the app.

#### Authentication Errors
```
Sign up failed: Invalid email format
```
**Solution:** Ensure email format is valid and password meets requirements.

#### Database Connection Issues
```
Failed to get current profile: relation "profiles" does not exist
```
**Solution:** Verify all SQL files have been deployed successfully.

#### RLS Policy Issues
```
Failed to get profiles: new row violates row-level security policy
```
**Solution:** Check that RLS policies are correctly configured and user has proper role.

### Manual Database Verification

You can also verify the results directly in your Supabase dashboard:

1. **Check Auth Users:**
   - Go to Authentication > Users
   - Verify new users appear with correct email

2. **Check Profiles Table:**
   - Go to Table Editor > profiles
   - Verify profile records with correct roles and subscription tiers

3. **Check Relationships:**
   - Go to Table Editor > profile_relationships
   - Verify educator-student and parent-child relationships

4. **Check RLS Policies:**
   - Go to Table Editor > [table] > RLS tab
   - Verify policies are enabled and working correctly

### Success Criteria

Your user management system is working correctly if:

- ✅ Users can register with different roles
- ✅ Profile data is correctly stored and retrievable
- ✅ Role-based access control is enforced
- ✅ Subscription tier limits are enforced
- ✅ Educator-student relationships work
- ✅ Parent-child relationships work
- ✅ RLS policies prevent unauthorized access
- ✅ Profile updates work correctly
- ✅ Authentication state changes are handled

### Next Steps

Once user management is verified:

1. **Test Animal Management** - Verify animal creation with subscription limits
2. **Test Health Records** - Verify health record access based on relationships
3. **Test Financial Data** - Verify parent access to financial information
4. **Test Admin Features** - Verify admin can manage all users and data
5. **Test Real-time Updates** - Verify profile changes sync in real-time

## Support

If you encounter issues during verification:

1. Check the test results log in the app
2. Verify Supabase project configuration
3. Check browser network logs for API errors
4. Review RLS policy configurations
5. Verify SQL deployment was successful

Remember: The user management system is the foundation for all other features, so it's critical that these tests pass before proceeding with other functionality verification.