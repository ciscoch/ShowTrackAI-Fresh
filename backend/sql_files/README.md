# ShowTrackAI SQL Deployment Files

This directory contains SQL files for deploying the complete ShowTrackAI backend to Supabase. These files break down the deployment into manageable steps.

## 📋 Deployment Order

Run these SQL files **in order** by copying and pasting them into the Supabase SQL Editor:

### ✅ Already Completed
1. **`database.sql`** - Main database schema (already deployed)
2. **`seed.sql`** - Initial data and AET standards (already deployed)

### 🚀 Next Steps - Run These Now

3. **[02-storage-buckets.sql](02-storage-buckets.sql)** - Creates storage buckets and file access policies
   - Creates 5 storage buckets for different file types
   - Sets up access policies for secure file sharing
   - Configures public/private bucket permissions

4. **[03-user-storage-table.sql](03-user-storage-table.sql)** - Creates user storage table for the storage adapter
   - Replaces AsyncStorage functionality with cloud storage
   - Includes backup/restore capabilities
   - Provides migration utilities for local data

5. **[04-additional-policies.sql](04-additional-policies.sql)** - Enhanced security policies
   - Admin management capabilities
   - Parent access controls
   - QR code access enhancements
   - Subscription tier enforcement

6. **[05-final-setup.sql](05-final-setup.sql)** - System configuration and verification
   - System configuration management
   - Monitoring views and health checks
   - Utility functions
   - Final verification and summary

## 🗂️ File Details

### 02-storage-buckets.sql
```sql
-- Creates storage buckets:
-- • animal-photos (public, 50MB limit)
-- • journal-photos (public, 50MB limit)  
-- • medical-documents (private, 50MB limit)
-- • profile-pictures (public, 10MB limit)
-- • receipts (private, 50MB limit)
```

**Purpose**: Enables file uploads for photos, documents, and receipts with proper access controls.

### 03-user-storage-table.sql
```sql
-- Creates user_storage table for cloud-based key-value storage
-- Includes helper functions for:
-- • Data migration from local storage
-- • Backup and restore operations
-- • Cleanup of old backups
```

**Purpose**: Replaces AsyncStorage with cloud-based storage when backend is enabled.

### 04-additional-policies.sql
```sql
-- Enhanced security policies for:
-- • Admin management
-- • Parent-child relationships
-- • QR code access
-- • Subscription limits
-- • Data export controls
```

**Purpose**: Adds advanced security and access control features.

### 05-final-setup.sql
```sql
-- System management features:
-- • Configuration management
-- • Health monitoring views
-- • Utility functions
-- • Final verification
```

**Purpose**: Completes the setup with management and monitoring capabilities.

## 🚀 Quick Deployment

### Option 1: Manual Copy-Paste (Recommended)
1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Copy and paste each file in order
3. Run each script individually
4. Verify no errors in the output

### Option 2: Command Line (if you have psql access)
```bash
# If you have direct database access
psql $DATABASE_URL -f 02-storage-buckets.sql
psql $DATABASE_URL -f 03-user-storage-table.sql
psql $DATABASE_URL -f 04-additional-policies.sql
psql $DATABASE_URL -f 05-final-setup.sql
```

## ✅ Verification Steps

After running all scripts, verify the setup:

1. **Check Tables**: Ensure all tables exist in Supabase Dashboard > Table Editor
2. **Check Storage**: Verify buckets exist in Supabase Dashboard > Storage
3. **Check Policies**: Review RLS policies in each table
4. **Test Connection**: Try connecting from your app with `EXPO_PUBLIC_USE_BACKEND=true`

## 🔍 Expected Results

After successful deployment:

- **20+ database tables** with proper relationships
- **5 storage buckets** with access policies
- **Comprehensive RLS policies** for data security
- **System configuration** management
- **Monitoring capabilities** for health checks

## 🆘 Troubleshooting

### Common Issues:

**Error: "table already exists"**
- Safe to ignore - scripts use `IF NOT EXISTS` where possible

**Error: "permission denied"**
- Ensure you're running in Supabase SQL Editor as project owner
- Some operations require elevated permissions

**Error: "function does not exist"**
- Ensure previous scripts ran successfully
- Some functions depend on earlier scripts

### Getting Help:

1. Check the Supabase logs for detailed error messages
2. Verify each script runs without errors before proceeding
3. Review the final verification output in `05-final-setup.sql`

## 🎯 Next Steps After Deployment

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Add your Supabase credentials
   ```

2. **Enable Backend**:
   ```env
   EXPO_PUBLIC_USE_BACKEND=true
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Test Connection**:
   ```bash
   npm start
   ```

## 📊 Monitoring Your Backend

After deployment, monitor your backend health:

```sql
-- Check system health
SELECT * FROM public.system_health;

-- Check user activity
SELECT * FROM public.user_activity_summary;

-- Check configuration
SELECT * FROM public.system_config;
```

---

**Total Deployment Time**: ~5-10 minutes
**Complexity**: Beginner-friendly with copy-paste approach
**Risk**: Low (all scripts are idempotent and safe to re-run)