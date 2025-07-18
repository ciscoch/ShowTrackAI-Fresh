/**
 * N8N Workflow Service for ShowTrackAI Agricultural Education Platform
 * 
 * Integrates with N8N automation platform to provide:
 * - Daily progress tracking workflows
 * - Feed efficiency monitoring
 * - Health alert systems
 * - SAE project automation
 * - Student reminder systems
 */

export interface N8nWorkflowConfig {
  baseUrl: string;
  apiKey?: string;
  enableWebhooks: boolean;
  enableScheduledTasks: boolean;
}

export interface WorkflowTriggerData {
  workflowId: string;
  data: any;
  executionMode?: 'synchronous' | 'asynchronous';
  timeout?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'new' | 'running' | 'success' | 'error' | 'canceled';
  data?: any;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

export class N8nWorkflowService {
  private config: N8nWorkflowConfig;
  private webhookUrl: string;
  private isInitialized: boolean = false;

  constructor(webhookUrl: string, config?: Partial<N8nWorkflowConfig>) {
    this.webhookUrl = webhookUrl;
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:5678',
      apiKey: config?.apiKey,
      enableWebhooks: config?.enableWebhooks ?? true,
      enableScheduledTasks: config?.enableScheduledTasks ?? true
    };
    
    if (this.webhookUrl) {
      this.isInitialized = true;
    }
  }

  async getStatus(): Promise<boolean> {
    if (!this.isInitialized) return false;
    
    try {
      const response = await fetch(`${this.config.baseUrl}/healthz`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });
      return response.ok;
    } catch (error) {
      console.error('N8N service status check failed:', error);
      return false;
    }
  }

  /**
   * Trigger a workflow via webhook
   */
  async triggerWorkflow(workflowName: string, data: any, options?: {
    async?: boolean;
    timeout?: number;
  }): Promise<any> {
    if (!this.isInitialized) {
      console.warn('N8N Workflow Service not initialized - skipping workflow trigger');
      return null;
    }

    try {
      const payload = {
        workflowName,
        data,
        timestamp: new Date().toISOString(),
        async: options?.async ?? true
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`N8N workflow triggered: ${workflowName}`, result);
      return result;
    } catch (error) {
      console.error(`N8N workflow trigger failed for ${workflowName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a workflow directly (if API access is available)
   */
  async executeWorkflow(workflowId: string, data: any): Promise<WorkflowExecution> {
    if (!this.config.apiKey) {
      throw new Error('API key required for direct workflow execution');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error(`Workflow execution failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Direct workflow execution failed:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    if (!this.config.apiKey) {
      throw new Error('API key required for execution status check');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/executions/${executionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Execution status check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Execution status check failed:', error);
      return null;
    }
  }

  // ===== PREDEFINED AGRICULTURAL WORKFLOWS =====

  /**
   * Student Onboarding Workflow
   */
  async triggerStudentOnboarding(data: {
    studentId: string;
    studentName: string;
    organizationId?: string;
    gradeLevel?: number;
    ffaChapter?: string;
  }): Promise<any> {
    return this.triggerWorkflow('student-onboarding', {
      ...data,
      actions: [
        'create_welcome_message',
        'setup_initial_assessments',
        'assign_mentor',
        'create_progress_tracking',
        'send_parent_notification'
      ]
    });
  }

  /**
   * SAE Project Creation Workflow
   */
  async triggerSAEProjectCreated(data: {
    projectId: string;
    studentId: string;
    projectType: string;
    category: string;
    supervisorId?: string;
  }): Promise<any> {
    return this.triggerWorkflow('sae-project-created', {
      ...data,
      actions: [
        'create_project_timeline',
        'setup_milestone_tracking',
        'notify_supervisor',
        'create_record_keeping_templates',
        'schedule_progress_reviews'
      ]
    });
  }

  /**
   * SAE Activity Logged Workflow
   */
  async triggerSAEActivityLogged(data: {
    activityId: string;
    studentId: string;
    activityType: string;
    duration: number;
    skillsDemonstrated?: string[];
  }): Promise<any> {
    return this.triggerWorkflow('sae-activity-logged', {
      ...data,
      actions: [
        'update_progress_tracking',
        'analyze_skill_development',
        'check_milestone_completion',
        'generate_competency_updates',
        'trigger_recommendation_engine'
      ]
    });
  }

  /**
   * Health Record Created Workflow
   */
  async triggerHealthRecordCreated(data: {
    recordId: string;
    animalId: string;
    observationType: string;
    severityLevel?: number;
    conditionStatus: string;
    symptoms?: string[];
  }): Promise<any> {
    return this.triggerWorkflow('health-record-created', {
      ...data,
      actions: [
        'analyze_health_patterns',
        'check_alert_conditions',
        'notify_relevant_parties',
        'update_health_dashboard',
        'schedule_follow_up_reminders'
      ]
    });
  }

  /**
   * Feed Efficiency Calculated Workflow
   */
  async triggerFeedEfficiencyCalculated(data: {
    animalId: string;
    fcr: number;
    efficiencyScore: number;
    studentId: string;
  }): Promise<any> {
    return this.triggerWorkflow('feed-efficiency-calculated', {
      ...data,
      actions: [
        'analyze_efficiency_trends',
        'compare_to_benchmarks',
        'generate_recommendations',
        'update_cost_tracking',
        'notify_if_threshold_exceeded'
      ]
    });
  }

  /**
   * Competency Assessed Workflow
   */
  async triggerCompetencyAssessed(data: {
    assessmentId: string;
    studentId: string;
    standardCode: string;
    proficiencyLevel: string;
  }): Promise<any> {
    return this.triggerWorkflow('competency-assessed', {
      ...data,
      actions: [
        'update_competency_progress',
        'check_graduation_requirements',
        'identify_skill_gaps',
        'recommend_next_activities',
        'notify_instructor_if_needed'
      ]
    });
  }

  /**
   * Daily Progress Tracking Setup
   */
  async setupDailyProgressTracking(data: {
    studentId: string;
    enableReminders: boolean;
    reminderTime: string;
    reminderFrequency: string;
  }): Promise<any> {
    return this.triggerWorkflow('setup-daily-tracking', {
      ...data,
      actions: [
        'create_daily_reminder_schedule',
        'setup_progress_monitoring',
        'configure_notification_preferences',
        'initialize_tracking_dashboard'
      ]
    });
  }

  /**
   * Feed Efficiency Monitoring Setup
   */
  async setupFeedEfficiencyMonitoring(data: {
    animalId: string;
    enableAlerts: boolean;
    alertThreshold: number;
    monitoringFrequency: string;
  }): Promise<any> {
    return this.triggerWorkflow('setup-feed-monitoring', {
      ...data,
      actions: [
        'create_monitoring_schedule',
        'setup_alert_thresholds',
        'configure_efficiency_dashboard',
        'initialize_trend_analysis'
      ]
    });
  }

  /**
   * Health Alert System Setup
   */
  async setupHealthAlerts(data: {
    animalId: string;
    enableEmergencyAlerts: boolean;
    enableReminderAlerts: boolean;
    severityThreshold: number;
  }): Promise<any> {
    return this.triggerWorkflow('setup-health-alerts', {
      ...data,
      actions: [
        'configure_emergency_protocols',
        'setup_reminder_schedule',
        'create_alert_escalation_rules',
        'initialize_health_monitoring'
      ]
    });
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Trigger multiple workflows in sequence
   */
  async triggerWorkflowBatch(workflows: Array<{
    name: string;
    data: any;
    delay?: number;
  }>): Promise<any[]> {
    const results: any[] = [];
    
    for (const workflow of workflows) {
      try {
        if (workflow.delay) {
          await new Promise(resolve => setTimeout(resolve, workflow.delay));
        }
        
        const result = await this.triggerWorkflow(workflow.name, workflow.data);
        results.push(result);
      } catch (error) {
        console.error(`Batch workflow failed: ${workflow.name}`, error);
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Schedule a workflow to run at a specific time
   */
  async scheduleWorkflow(workflowName: string, data: any, scheduleTime: Date): Promise<any> {
    const delay = scheduleTime.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Schedule time must be in the future');
    }

    return this.triggerWorkflow('schedule-workflow', {
      targetWorkflow: workflowName,
      targetData: data,
      scheduleTime: scheduleTime.toISOString(),
      delay: delay
    });
  }

  // ===== WORKFLOW MANAGEMENT =====

  /**
   * Get available workflows
   */
  async getWorkflows(): Promise<any[]> {
    if (!this.config.apiKey) {
      throw new Error('API key required for workflow management');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get workflows failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get workflows failed:', error);
      throw error;
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowData: {
    name: string;
    nodes: any[];
    connections: any[];
    active?: boolean;
  }): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('API key required for workflow creation');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(workflowData)
      });

      if (!response.ok) {
        throw new Error(`Create workflow failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create workflow failed:', error);
      throw error;
    }
  }

  /**
   * Update workflow status (activate/deactivate)
   */
  async updateWorkflowStatus(workflowId: string, active: boolean): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('API key required for workflow management');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: active ? 'POST' : 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Update workflow status failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update workflow status failed:', error);
      throw error;
    }
  }

  // ===== UTILITIES =====

  /**
   * Test webhook connectivity
   */
  async testWebhook(testData?: any): Promise<boolean> {
    try {
      const result = await this.triggerWorkflow('test-webhook', testData || {
        test: true,
        timestamp: new Date().toISOString()
      });
      
      return result !== null;
    } catch (error) {
      console.error('Webhook test failed:', error);
      return false;
    }
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(limit: number = 10, workflowId?: string): Promise<WorkflowExecution[]> {
    if (!this.config.apiKey) {
      throw new Error('API key required for execution history');
    }

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        ...(workflowId && { workflowId })
      });

      const response = await fetch(`${this.config.baseUrl}/api/v1/executions?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Get execution history failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get execution history failed:', error);
      return [];
    }
  }

  /**
   * Cancel a running workflow execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('API key required for execution cancellation');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/executions/${executionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Cancel execution failed:', error);
      return false;
    }
  }
}

export default N8nWorkflowService;