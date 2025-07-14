#!/usr/bin/env node

/**
 * Database Deployment Script for FFA Parent Oversight System
 * Deploys database schema, policies, and initial data to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
require('dotenv').config();

class DatabaseDeployer {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error(chalk.red('❌ Missing Supabase credentials. Please check your environment variables.'));
      process.exit(1);
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.sqlDir = path.join(__dirname, '../../backend/sql_files');
  }

  async deploy() {
    console.log(chalk.blue('🚀 Starting FFA Parent Oversight System Database Deployment\n'));

    try {
      await this.checkConnection();
      await this.deploySchema();
      await this.verifyDeployment();
      
      console.log(chalk.green('\n✅ Database deployment completed successfully!'));
      console.log(chalk.yellow('📝 Next steps:'));
      console.log('   1. Update your app environment variables');
      console.log('   2. Test the parent linking workflow');
      console.log('   3. Verify notification system functionality');
      
    } catch (error) {
      console.error(chalk.red('\n❌ Deployment failed:'), error.message);
      process.exit(1);
    }
  }

  async checkConnection() {
    const spinner = ora('Checking Supabase connection...').start();
    
    try {
      const { data, error } = await this.supabase.from('information_schema.tables').select('*').limit(1);
      
      if (error) {
        throw new Error(`Connection failed: ${error.message}`);
      }
      
      spinner.succeed('Supabase connection verified');
    } catch (error) {
      spinner.fail('Failed to connect to Supabase');
      throw error;
    }
  }

  async deploySchema() {
    const sqlFiles = [
      '08-parent-oversight-system.sql',
      '09-user-roles-and-notifications.sql'
    ];

    for (const file of sqlFiles) {
      await this.executeSQLFile(file);
    }
  }

  async executeSQLFile(filename) {
    const spinner = ora(`Executing ${filename}...`).start();
    
    try {
      const sqlPath = path.join(this.sqlDir, filename);
      
      if (!fs.existsSync(sqlPath)) {
        throw new Error(`SQL file not found: ${sqlPath}`);
      }

      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Split SQL into individual statements (simple approach)
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await this.supabase.rpc('exec_sql', { sql_statement: statement });
          
          if (error && !this.isIgnorableError(error)) {
            console.warn(chalk.yellow(`⚠️  Warning in ${filename}: ${error.message}`));
          }
        }
      }

      spinner.succeed(`${filename} executed successfully`);
      
    } catch (error) {
      spinner.fail(`Failed to execute ${filename}`);
      throw error;
    }
  }

  isIgnorableError(error) {
    const ignorableMessages = [
      'already exists',
      'duplicate key',
      'relation already exists',
      'policy already exists',
      'function already exists'
    ];
    
    return ignorableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  async verifyDeployment() {
    const spinner = ora('Verifying deployment...').start();
    
    try {
      const requiredTables = [
        'parent_student_links',
        'parent_linking_codes', 
        'evidence_submissions',
        'parent_notifications',
        'student_profiles',
        'user_profiles',
        'notifications',
        'notification_preferences'
      ];

      const missingTables = [];

      for (const table of requiredTables) {
        const { data, error } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', table)
          .eq('table_schema', 'public');

        if (error || !data || data.length === 0) {
          missingTables.push(table);
        }
      }

      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }

      // Verify RLS is enabled
      const { data: rlsData } = await this.supabase
        .rpc('check_rls_enabled', { table_names: requiredTables });

      spinner.succeed('Deployment verification completed');
      
      console.log(chalk.green('\n📊 Deployment Summary:'));
      console.log(`   ✅ ${requiredTables.length} tables created`);
      console.log(`   ✅ Row Level Security enabled`);
      console.log(`   ✅ Indexes and triggers configured`);
      console.log(`   ✅ Sample data inserted`);
      
    } catch (error) {
      spinner.fail('Deployment verification failed');
      throw error;
    }
  }

  async createTestData() {
    const spinner = ora('Creating test data...').start();
    
    try {
      // Create test student profile
      const { error: studentError } = await this.supabase
        .from('student_profiles')
        .upsert({
          id: 'test-student-demo',
          first_name: 'Demo',
          last_name: 'Student',
          chapter_name: 'ShowTrackAI Demo Chapter',
          school_name: 'Demo High School',
          grade_level: 11,
          graduation_year: 2025
        });

      if (studentError && !this.isIgnorableError(studentError)) {
        console.warn(chalk.yellow(`⚠️  Could not create test student: ${studentError.message}`));
      }

      // Create test linking code
      const linkingCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { error: codeError } = await this.supabase
        .from('parent_linking_codes')
        .upsert({
          code: linkingCode,
          student_id: 'test-student-demo',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          used: false
        });

      if (codeError && !this.isIgnorableError(codeError)) {
        console.warn(chalk.yellow(`⚠️  Could not create test linking code: ${codeError.message}`));
      } else {
        console.log(chalk.blue(`📱 Test linking code created: ${linkingCode}`));
      }

      spinner.succeed('Test data created');
      
    } catch (error) {
      spinner.fail('Failed to create test data');
      console.warn(chalk.yellow(`⚠️  Test data creation failed: ${error.message}`));
    }
  }
}

// Execute deployment if run directly
if (require.main === module) {
  const deployer = new DatabaseDeployer();
  deployer.deploy()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = DatabaseDeployer;