# FFA Parent Oversight System - Deployment Guide

## 🚀 **Quick Start Deployment**

Deploy the complete FFA Parent Oversight System in 3 simple steps:

```bash
# 1. Install deployment tools
cd deploy && npm install

# 2. Deploy database and configure environment  
npm run deploy:full

# 3. Verify deployment
npm run deploy:verify
```

## 📁 **Deployment Structure**

```
deploy/
├── package.json              # Deployment dependencies
├── DEPLOYMENT_CHECKLIST.md   # Production deployment checklist
├── README.md                 # This file
└── scripts/
    ├── deploy-database.js     # Database schema deployment
    ├── setup-environment.js   # Environment configuration
    ├── verify-deployment.js   # Deployment verification
    └── health-check.js        # System health monitoring
```

## 🔧 **Available Commands**

### **Core Deployment**
```bash
npm run deploy:db      # Deploy database schema only
npm run deploy:env     # Configure environment only  
npm run deploy:verify  # Verify deployment only
npm run deploy:full    # Complete deployment pipeline
```

### **Monitoring & Maintenance**
```bash
npm run health-check   # Check system health
npm run backup         # Backup database (coming soon)
npm run rollback       # Rollback deployment (emergency)
```

## 📋 **Pre-Deployment Requirements**

### **1. Supabase Setup**
- ✅ Supabase project created
- ✅ Database URL and keys obtained
- ✅ Service role key available (for deployment)

### **2. Environment**
- ✅ Node.js 16+ installed
- ✅ npm 8+ installed
- ✅ Git repository access

### **3. Permissions**
- ✅ Database admin access
- ✅ Environment variable configuration access
- ✅ App deployment permissions

## 🚦 **Deployment Steps**

### **Step 1: Database Deployment**
```bash
npm run deploy:db
```

**What it does:**
- Creates parent oversight tables
- Sets up Row Level Security policies
- Creates indexes and triggers
- Inserts sample data for testing

**Expected output:**
```
🚀 Starting FFA Parent Oversight System Database Deployment
✅ Supabase connection verified
✅ 08-parent-oversight-system.sql executed successfully
✅ 09-user-roles-and-notifications.sql executed successfully
✅ Deployment verification completed
✅ Database deployment completed successfully!
```

### **Step 2: Environment Configuration**
```bash
npm run deploy:env
```

**Interactive prompts:**
- Supabase URL
- Supabase Anon Key
- Service Role Key (for deployment)
- Enable notifications? (recommended: Yes)
- Enable analytics? (recommended: Yes)
- Deployment environment (development/staging/production)

**Generated files:**
- `.env` - Environment variables
- `app.json` - Updated with FFA features

### **Step 3: Verification**
```bash
npm run deploy:verify
```

**Verification tests:**
- ✅ Database schema validation
- ✅ Security policies check
- ✅ Environment configuration
- ✅ Feature flags verification
- ✅ Functional testing

## 🔍 **Health Monitoring**

### **System Health Check**
```bash
npm run health-check
```

**Monitors:**
- Database connectivity and performance
- Table sizes and growth
- Feature functionality
- Response times
- Security status

**Example output:**
```
🏥 FFA Parent Oversight System - Health Check

✅ Overall System Health: HEALTHY
📊 Health Score: 95%

🔧 Service Status:
  ✅ database: healthy
  ✅ configuration: healthy  
  ✅ features: healthy

📊 Table Sizes:
  📋 parent_student_links: 42 records
  📋 evidence_submissions: 156 records
  📋 notifications: 89 records
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Database Connection Failed**
```bash
❌ Missing Supabase credentials
```
**Solution:** Check environment variables in `.env` file

#### **Table Creation Failed**
```bash  
❌ relation "parent_student_links" already exists
```
**Solution:** This warning is normal for re-deployments

#### **Permission Denied**
```bash
❌ insufficient_privilege
```
**Solution:** Ensure using service role key, not anon key

#### **Feature Tests Failed**
```bash
❌ Evidence submission test failed
```
**Solution:** Check RLS policies and table permissions

### **Emergency Rollback**
```bash
npm run rollback
```

**Rollback procedure:**
1. Disable FFA Parent Oversight features
2. Restore previous database state
3. Revert environment configuration
4. Restart application services

## 📊 **Success Metrics**

### **Deployment Success Indicators**
- ✅ All verification tests pass (95%+ success rate)
- ✅ Health check shows "HEALTHY" status
- ✅ Test linking code generates successfully
- ✅ Evidence submission works end-to-end
- ✅ Parent dashboard loads without errors

### **Production Readiness**
- ✅ Database response times < 500ms
- ✅ RLS policies active and working
- ✅ Notifications configured and functional
- ✅ All feature flags properly set
- ✅ Error monitoring active

## 🔧 **Configuration Reference**

### **Environment Variables**
```bash
# Required
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Feature Flags
EXPO_PUBLIC_FFA_PARENT_OVERSIGHT_ENABLED=true
EXPO_PUBLIC_FFA_EVIDENCE_SUBMISSION_ENABLED=true
EXPO_PUBLIC_FFA_NOTIFICATIONS_ENABLED=true

# Settings
EXPO_PUBLIC_LINKING_CODE_EXPIRY_HOURS=24
EXPO_PUBLIC_MAX_EVIDENCE_FILE_SIZE=10485760
```

### **Database Tables Created**
- `parent_student_links` - Family connections
- `parent_linking_codes` - Secure linking codes
- `evidence_submissions` - Student evidence
- `parent_notifications` - Family communication
- `student_profiles` - Student information
- `user_profiles` - Role management
- `notifications` - System notifications
- `notification_preferences` - User preferences

## 📞 **Support**

### **Getting Help**
- 📖 **Documentation:** `/docs/` folder
- 🐛 **Issues:** GitHub repository issues
- 💬 **Community:** Discord server
- 📧 **Email:** Support team contact

### **Deployment Support**
- Check logs: `npm run health-check`
- Verify configuration: `npm run deploy:verify`
- Emergency rollback: `npm run rollback`
- Manual verification: Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## ✅ **Ready for Production**

Once deployment completes successfully:

1. **User Communication**
   - Announce new parent oversight features
   - Provide user guides and tutorials
   - Set up feedback collection

2. **Monitoring Setup**
   - Schedule regular health checks
   - Set up automated alerts
   - Monitor user engagement metrics

3. **Ongoing Maintenance**
   - Regular database cleanup
   - Performance optimization
   - Security updates
   - Feature enhancements

**🎉 Your FFA Parent Oversight System is now deployed and ready to enhance family engagement in agricultural education!**