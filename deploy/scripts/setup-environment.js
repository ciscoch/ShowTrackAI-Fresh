#!/usr/bin/env node

/**
 * Environment Setup Script for FFA Parent Oversight System
 * Configures environment variables and app settings
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
require('dotenv').config();

class EnvironmentSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.envPath = path.join(this.projectRoot, '.env');
    this.appJsonPath = path.join(this.projectRoot, 'app.json');
  }

  async setup() {
    console.log(chalk.blue('🔧 Setting up FFA Parent Oversight System Environment\n'));

    try {
      await this.checkExistingConfig();
      await this.configureEnvironment();
      await this.updateAppConfig();
      await this.verifyConfiguration();
      
      console.log(chalk.green('\n✅ Environment setup completed successfully!'));
      console.log(chalk.yellow('📝 Configuration Summary:'));
      console.log('   ✅ Environment variables configured');
      console.log('   ✅ App.json updated with FFA features');
      console.log('   ✅ Parent oversight system enabled');
      
    } catch (error) {
      console.error(chalk.red('\n❌ Environment setup failed:'), error.message);
      process.exit(1);
    }
  }

  async checkExistingConfig() {
    const spinner = ora('Checking existing configuration...').start();
    
    try {
      this.existingEnv = {};
      
      if (fs.existsSync(this.envPath)) {
        const envContent = fs.readFileSync(this.envPath, 'utf8');
        const envLines = envContent.split('\n');
        
        for (const line of envLines) {
          const [key, value] = line.split('=');
          if (key && value) {
            this.existingEnv[key.trim()] = value.trim();
          }
        }
      }

      spinner.succeed('Configuration check completed');
      
    } catch (error) {
      spinner.fail('Failed to check existing configuration');
      throw error;
    }
  }

  async configureEnvironment() {
    console.log(chalk.blue('\n🔑 Environment Configuration'));
    
    const questions = [
      {
        type: 'input',
        name: 'supabaseUrl',
        message: 'Supabase URL:',
        default: this.existingEnv.EXPO_PUBLIC_SUPABASE_URL || '',
        validate: (input) => {
          if (!input || !input.startsWith('https://')) {
            return 'Please enter a valid Supabase URL (https://...)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'supabaseAnonKey',
        message: 'Supabase Anon Key:',
        default: this.existingEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        validate: (input) => {
          if (!input || input.length < 50) {
            return 'Please enter a valid Supabase anon key';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'supabaseServiceKey',
        message: 'Supabase Service Role Key (for deployment):',
        default: this.existingEnv.SUPABASE_SERVICE_ROLE_KEY || '',
        validate: (input) => {
          if (!input || input.length < 50) {
            return 'Please enter a valid Supabase service role key';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'enableNotifications',
        message: 'Enable push notifications for parent engagement?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableAnalytics',
        message: 'Enable analytics for family engagement tracking?',
        default: true
      },
      {
        type: 'list',
        name: 'deploymentEnvironment',
        message: 'Deployment environment:',
        choices: ['development', 'staging', 'production'],
        default: 'development'
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    await this.writeEnvironmentFile(answers);
  }

  async writeEnvironmentFile(config) {
    const spinner = ora('Writing environment configuration...').start();
    
    try {
      const envContent = `# FFA Parent Oversight System Configuration
# Generated on ${new Date().toISOString()}

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${config.supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${config.supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${config.supabaseServiceKey}

# FFA Parent Oversight Features
EXPO_PUBLIC_FFA_PARENT_OVERSIGHT_ENABLED=true
EXPO_PUBLIC_FFA_EVIDENCE_SUBMISSION_ENABLED=true
EXPO_PUBLIC_FFA_NOTIFICATIONS_ENABLED=${config.enableNotifications}
EXPO_PUBLIC_FFA_ANALYTICS_ENABLED=${config.enableAnalytics}

# Environment Configuration
NODE_ENV=${config.deploymentEnvironment}
EXPO_PUBLIC_ENVIRONMENT=${config.deploymentEnvironment}

# Parent Oversight Settings
EXPO_PUBLIC_LINKING_CODE_EXPIRY_HOURS=24
EXPO_PUBLIC_MAX_EVIDENCE_FILE_SIZE=10485760
EXPO_PUBLIC_NOTIFICATION_BATCH_SIZE=10

# Security Settings
EXPO_PUBLIC_ENABLE_RLS=true
EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
EXPO_PUBLIC_ENABLE_AUDIT_LOGGING=true

# Feature Flags
EXPO_PUBLIC_ENABLE_VIDEO_EVIDENCE=true
EXPO_PUBLIC_ENABLE_PHOTO_EVIDENCE=true
EXPO_PUBLIC_ENABLE_TEXT_EVIDENCE=true
EXPO_PUBLIC_ENABLE_PARENT_FEEDBACK=true
EXPO_PUBLIC_ENABLE_ROLE_VERIFICATION=true

# Performance Settings
EXPO_PUBLIC_CACHE_DURATION_MINUTES=30
EXPO_PUBLIC_OFFLINE_SYNC_INTERVAL_MINUTES=15
EXPO_PUBLIC_MAX_NOTIFICATION_HISTORY=100
`;

      fs.writeFileSync(this.envPath, envContent);
      
      spinner.succeed('Environment file created');
      
    } catch (error) {
      spinner.fail('Failed to write environment file');
      throw error;
    }
  }

  async updateAppConfig() {
    const spinner = ora('Updating app configuration...').start();
    
    try {
      let appConfig = {};
      
      if (fs.existsSync(this.appJsonPath)) {
        appConfig = JSON.parse(fs.readFileSync(this.appJsonPath, 'utf8'));
      }

      // Update app.json with FFA Parent Oversight features
      appConfig.expo = appConfig.expo || {};
      appConfig.expo.name = appConfig.expo.name || 'ShowTrackAI - FFA Edition';
      appConfig.expo.description = 'Agricultural education tracking with family engagement through FFA Parent Oversight System';
      
      // Add notification configuration
      appConfig.expo.notification = {
        icon: './assets/notification-icon.png',
        color: '#007AFF',
        sounds: ['./assets/notification-sound.wav'],
        androidMode: 'default',
        androidCollapsedTitle: 'FFA Progress Update'
      };

      // Add permission requirements
      appConfig.expo.permissions = appConfig.expo.permissions || [];
      const requiredPermissions = [
        'CAMERA',
        'CAMERA_ROLL',
        'NOTIFICATIONS',
        'VIBRATE'
      ];
      
      for (const permission of requiredPermissions) {
        if (!appConfig.expo.permissions.includes(permission)) {
          appConfig.expo.permissions.push(permission);
        }
      }

      // Add iOS configuration
      appConfig.expo.ios = appConfig.expo.ios || {};
      appConfig.expo.ios.infoPlist = appConfig.expo.ios.infoPlist || {};
      appConfig.expo.ios.infoPlist.NSCameraUsageDescription = 'This app uses the camera to capture evidence for FFA degree requirements.';
      appConfig.expo.ios.infoPlist.NSPhotoLibraryUsageDescription = 'This app accesses photos to submit evidence for FFA degree requirements.';

      // Add Android configuration
      appConfig.expo.android = appConfig.expo.android || {};
      appConfig.expo.android.permissions = appConfig.expo.android.permissions || [];
      
      const androidPermissions = [
        'android.permission.CAMERA',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.VIBRATE'
      ];
      
      for (const permission of androidPermissions) {
        if (!appConfig.expo.android.permissions.includes(permission)) {
          appConfig.expo.android.permissions.push(permission);
        }
      }

      // Add FFA-specific metadata
      appConfig.expo.extra = appConfig.expo.extra || {};
      appConfig.expo.extra.ffaParentOversight = {
        version: '1.0.0',
        features: [
          'parent_student_linking',
          'evidence_submission',
          'real_time_notifications',
          'family_engagement_analytics'
        ],
        supportedEvidenceTypes: ['photo', 'video', 'text'],
        maxFileSizeBytes: 10485760, // 10MB
        linkingCodeExpiryHours: 24
      };

      fs.writeFileSync(this.appJsonPath, JSON.stringify(appConfig, null, 2));
      
      spinner.succeed('App configuration updated');
      
    } catch (error) {
      spinner.fail('Failed to update app configuration');
      throw error;
    }
  }

  async verifyConfiguration() {
    const spinner = ora('Verifying configuration...').start();
    
    try {
      // Check environment variables
      require('dotenv').config({ path: this.envPath });
      
      const requiredEnvVars = [
        'EXPO_PUBLIC_SUPABASE_URL',
        'EXPO_PUBLIC_SUPABASE_ANON_KEY',
        'EXPO_PUBLIC_FFA_PARENT_OVERSIGHT_ENABLED'
      ];

      const missingVars = [];
      for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
      }

      // Check app.json
      if (!fs.existsSync(this.appJsonPath)) {
        throw new Error('app.json not found');
      }

      const appConfig = JSON.parse(fs.readFileSync(this.appJsonPath, 'utf8'));
      if (!appConfig.expo || !appConfig.expo.extra || !appConfig.expo.extra.ffaParentOversight) {
        throw new Error('FFA Parent Oversight configuration missing from app.json');
      }

      spinner.succeed('Configuration verification completed');
      
      // Display configuration summary
      console.log(chalk.green('\n📋 Configuration Summary:'));
      console.log(`   🌐 Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL}`);
      console.log(`   🔐 Authentication: Configured`);
      console.log(`   👨‍👩‍👧‍👦 Parent Oversight: ${process.env.EXPO_PUBLIC_FFA_PARENT_OVERSIGHT_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`   🔔 Notifications: ${process.env.EXPO_PUBLIC_FFA_NOTIFICATIONS_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`   📊 Analytics: ${process.env.EXPO_PUBLIC_FFA_ANALYTICS_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`   🌍 Environment: ${process.env.NODE_ENV}`);
      
    } catch (error) {
      spinner.fail('Configuration verification failed');
      throw error;
    }
  }
}

// Execute setup if run directly
if (require.main === module) {
  const setup = new EnvironmentSetup();
  setup.setup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = EnvironmentSetup;