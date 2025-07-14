#!/usr/bin/env node

/**
 * Health Check Script for FFA Parent Oversight System
 * Monitors system health and performance metrics
 */

const { createClient } = require('@supabase/supabase-js');
const chalk = require('chalk');
const ora = require('ora');
require('dotenv').config();

class HealthChecker {
  constructor() {
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error(chalk.red('❌ Missing Supabase credentials'));
      process.exit(1);
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.healthStatus = {
      overall: 'healthy',
      services: {},
      metrics: {},
      alerts: []
    };
  }

  async check() {
    console.log(chalk.blue('🏥 FFA Parent Oversight System - Health Check\n'));

    try {
      await this.checkDatabaseHealth();
      await this.checkSystemMetrics();
      await this.checkFeatureHealth();
      await this.checkPerformanceMetrics();
      
      this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('💥 Health check failed:'), error.message);
      this.healthStatus.overall = 'critical';
      this.healthStatus.alerts.push({
        level: 'critical',
        message: `Health check system failure: ${error.message}`,
        timestamp: new Date()
      });
    }

    this.printSummary();
    process.exit(this.healthStatus.overall === 'critical' ? 1 : 0);
  }

  async checkDatabaseHealth() {
    const spinner = ora('Checking database health...').start();
    
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      const { data, error } = await this.supabase
        .from('parent_student_links')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Database connectivity failed: ${error.message}`);
      }

      this.healthStatus.services.database = {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastChecked: new Date()
      };

      // Check table sizes
      await this.checkTableSizes();
      
      // Check for recent errors
      await this.checkDatabaseErrors();

      spinner.succeed('Database health check completed');
      
    } catch (error) {
      spinner.fail('Database health check failed');
      this.healthStatus.services.database = {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date()
      };
      this.addAlert('error', `Database health check failed: ${error.message}`);
    }
  }

  async checkTableSizes() {
    try {
      const tables = [
        'parent_student_links',
        'evidence_submissions',
        'notifications',
        'parent_linking_codes'
      ];

      const tableSizes = {};

      for (const table of tables) {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tableSizes[table] = count;
        }
      }

      this.healthStatus.metrics.tableSizes = tableSizes;

      // Check for concerning table sizes
      if (tableSizes.parent_linking_codes > 1000) {
        this.addAlert('warning', 'Large number of unused linking codes - cleanup recommended');
      }

      if (tableSizes.notifications > 10000) {
        this.addAlert('warning', 'Large notification table - archival recommended');
      }

    } catch (error) {
      this.addAlert('warning', `Could not check table sizes: ${error.message}`);
    }
  }

  async checkDatabaseErrors() {
    // In a real implementation, this would check database logs
    // For now, we'll simulate by checking for recent failed operations
    this.healthStatus.metrics.databaseErrors = 0;
  }

  async checkSystemMetrics() {
    const spinner = ora('Checking system metrics...').start();
    
    try {
      // Check environment configuration
      const requiredEnvVars = [
        'EXPO_PUBLIC_SUPABASE_URL',
        'EXPO_PUBLIC_SUPABASE_ANON_KEY',
        'EXPO_PUBLIC_FFA_PARENT_OVERSIGHT_ENABLED'
      ];

      const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingEnvVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      }

      // Check feature flags
      const ffaEnabled = process.env.EXPO_PUBLIC_FFA_PARENT_OVERSIGHT_ENABLED === 'true';
      const notificationsEnabled = process.env.EXPO_PUBLIC_FFA_NOTIFICATIONS_ENABLED === 'true';

      this.healthStatus.services.configuration = {
        status: 'healthy',
        ffaParentOversight: ffaEnabled,
        notifications: notificationsEnabled,
        lastChecked: new Date()
      };

      spinner.succeed('System metrics check completed');
      
    } catch (error) {
      spinner.fail('System metrics check failed');
      this.healthStatus.services.configuration = {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date()
      };
      this.addAlert('error', `Configuration check failed: ${error.message}`);
    }
  }

  async checkFeatureHealth() {
    const spinner = ora('Checking feature health...').start();
    
    try {
      const features = {
        parentLinking: await this.testParentLinking(),
        evidenceSubmission: await this.testEvidenceSubmission(),
        notifications: await this.testNotifications(),
        userRoles: await this.testUserRoles()
      };

      this.healthStatus.services.features = {
        status: Object.values(features).every(f => f.status === 'healthy') ? 'healthy' : 'degraded',
        details: features,
        lastChecked: new Date()
      };

      spinner.succeed('Feature health check completed');
      
    } catch (error) {
      spinner.fail('Feature health check failed');
      this.healthStatus.services.features = {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date()
      };
      this.addAlert('error', `Feature health check failed: ${error.message}`);
    }
  }

  async testParentLinking() {
    try {
      // Test that we can query linking codes table
      const { data, error } = await this.supabase
        .from('parent_linking_codes')
        .select('code, expires_at')
        .limit(1);

      if (error) {
        return { status: 'unhealthy', error: error.message };
      }

      return { status: 'healthy', recordCount: data.length };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async testEvidenceSubmission() {
    try {
      // Test that we can query evidence submissions table
      const { data, error } = await this.supabase
        .from('evidence_submissions')
        .select('id, evidence_type')
        .limit(1);

      if (error) {
        return { status: 'unhealthy', error: error.message };
      }

      return { status: 'healthy', recordCount: data.length };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async testNotifications() {
    try {
      // Test that we can query notifications table
      const { data, error } = await this.supabase
        .from('notifications')
        .select('id, notification_type')
        .limit(1);

      if (error) {
        return { status: 'unhealthy', error: error.message };
      }

      return { status: 'healthy', recordCount: data.length };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async testUserRoles() {
    try {
      // Test that we can query user profiles table
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('id, role')
        .limit(1);

      if (error) {
        return { status: 'unhealthy', error: error.message };
      }

      return { status: 'healthy', recordCount: data.length };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkPerformanceMetrics() {
    const spinner = ora('Checking performance metrics...').start();
    
    try {
      const performanceTests = [
        { name: 'Database Query Speed', test: () => this.testQuerySpeed() },
        { name: 'Table Access Speed', test: () => this.testTableAccess() },
        { name: 'RLS Performance', test: () => this.testRLSPerformance() }
      ];

      const results = {};

      for (const perfTest of performanceTests) {
        try {
          const result = await perfTest.test();
          results[perfTest.name] = result;
        } catch (error) {
          results[perfTest.name] = { 
            status: 'failed',
            error: error.message 
          };
        }
      }

      this.healthStatus.metrics.performance = results;

      spinner.succeed('Performance metrics check completed');
      
    } catch (error) {
      spinner.fail('Performance metrics check failed');
      this.addAlert('warning', `Performance check failed: ${error.message}`);
    }
  }

  async testQuerySpeed() {
    const startTime = Date.now();
    
    const { data, error } = await this.supabase
      .from('parent_student_links')
      .select('*')
      .limit(10);

    const responseTime = Date.now() - startTime;

    if (error) {
      return { status: 'failed', error: error.message };
    }

    const status = responseTime < 500 ? 'excellent' : 
                   responseTime < 1000 ? 'good' : 
                   responseTime < 2000 ? 'acceptable' : 'slow';

    return {
      status,
      responseTime: `${responseTime}ms`,
      recordCount: data.length
    };
  }

  async testTableAccess() {
    const tables = ['evidence_submissions', 'notifications', 'user_profiles'];
    const results = {};

    for (const table of tables) {
      const startTime = Date.now();
      
      const { error } = await this.supabase
        .from(table)
        .select('*', { head: true })
        .limit(1);

      const responseTime = Date.now() - startTime;

      results[table] = {
        status: error ? 'failed' : 'success',
        responseTime: `${responseTime}ms`,
        error: error?.message
      };
    }

    return results;
  }

  async testRLSPerformance() {
    // Test RLS policy performance
    const startTime = Date.now();
    
    try {
      // This would fail due to RLS if not properly authenticated
      const { error } = await this.supabase
        .from('parent_student_links')
        .select('*')
        .limit(1);

      const responseTime = Date.now() - startTime;

      return {
        status: 'active',
        responseTime: `${responseTime}ms`,
        rlsActive: !!error
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  addAlert(level, message) {
    this.healthStatus.alerts.push({
      level,
      message,
      timestamp: new Date()
    });

    if (level === 'critical' || level === 'error') {
      this.healthStatus.overall = 'unhealthy';
    } else if (level === 'warning' && this.healthStatus.overall === 'healthy') {
      this.healthStatus.overall = 'degraded';
    }
  }

  generateReport() {
    // Calculate overall health score
    const services = Object.values(this.healthStatus.services);
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    
    const healthScore = totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 0;
    
    this.healthStatus.metrics.healthScore = healthScore;
    this.healthStatus.metrics.uptime = '99.9%'; // Would be calculated from actual uptime data
    this.healthStatus.metrics.lastChecked = new Date();

    // Determine overall status
    if (healthScore >= 90) {
      this.healthStatus.overall = 'healthy';
    } else if (healthScore >= 70) {
      this.healthStatus.overall = 'degraded';
    } else {
      this.healthStatus.overall = 'unhealthy';
    }
  }

  printSummary() {
    const statusColor = this.healthStatus.overall === 'healthy' ? 'green' :
                       this.healthStatus.overall === 'degraded' ? 'yellow' : 'red';
    
    const statusIcon = this.healthStatus.overall === 'healthy' ? '✅' :
                      this.healthStatus.overall === 'degraded' ? '⚠️' : '❌';

    console.log(chalk[statusColor](`\n${statusIcon} Overall System Health: ${this.healthStatus.overall.toUpperCase()}`));
    
    if (this.healthStatus.metrics.healthScore !== undefined) {
      console.log(chalk.blue(`📊 Health Score: ${this.healthStatus.metrics.healthScore}%`));
    }

    console.log(chalk.blue('\n🔧 Service Status:'));
    for (const [serviceName, serviceData] of Object.entries(this.healthStatus.services)) {
      const serviceIcon = serviceData.status === 'healthy' ? '✅' : 
                         serviceData.status === 'degraded' ? '⚠️' : '❌';
      console.log(`  ${serviceIcon} ${serviceName}: ${serviceData.status}`);
      
      if (serviceData.responseTime) {
        console.log(`    Response Time: ${serviceData.responseTime}`);
      }
      
      if (serviceData.error) {
        console.log(chalk.red(`    Error: ${serviceData.error}`));
      }
    }

    if (this.healthStatus.metrics.tableSizes) {
      console.log(chalk.blue('\n📊 Table Sizes:'));
      for (const [table, size] of Object.entries(this.healthStatus.metrics.tableSizes)) {
        console.log(`  📋 ${table}: ${size} records`);
      }
    }

    if (this.healthStatus.alerts.length > 0) {
      console.log(chalk.yellow('\n⚠️  Alerts:'));
      this.healthStatus.alerts.forEach(alert => {
        const alertColor = alert.level === 'critical' ? 'red' :
                          alert.level === 'error' ? 'red' :
                          alert.level === 'warning' ? 'yellow' : 'blue';
        console.log(chalk[alertColor](`  • ${alert.level.toUpperCase()}: ${alert.message}`));
      });
    }

    console.log(chalk.blue(`\n🕐 Last Checked: ${new Date().toLocaleString()}`));
  }
}

// Execute health check if run directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker.check();
}

module.exports = HealthChecker;