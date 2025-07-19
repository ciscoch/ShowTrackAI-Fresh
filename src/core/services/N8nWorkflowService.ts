/**
 * N8N Workflow Service for ShowTrackAI Agricultural Education Platform
 * 
 * Integrates with N8N Cloud workflows to provide:
 * - Learning event processing and Zep memory integration
 * - Knowledge graph analysis and skill gap detection
 * - AI-powered recommendation generation
 * - Agricultural education competency tracking
 * - Real-time student analytics and notifications
 */

export interface N8nWorkflowConfig {
  baseUrl: string;
  apiKey?: string;
  enableWebhooks: boolean;
  enableScheduledTasks: boolean;
  learningEventWebhook?: string;
  knowledgeGraphWebhook?: string;
  recommendationWebhook?: string;
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

  // ===== AGRICULTURAL EDUCATION WORKFLOWS =====
  // Integration with N8N Cloud workflows for agricultural education platform

  /**
   * Process Learning Event - Sends to N8N Learning Event Processor
   * Integrates with Zep memory and Supabase for comprehensive learning tracking
   * Workflow: ag_learning_event_processor.json
   */
  async processLearningEvent(eventData: {
    student_id: string;
    event_type: 'health_check' | 'journal_entry' | 'competency_assessment' | 'consultation' | 'sae_activity' | 'animal_observation' | 'feeding_record' | 'treatment_administration' | 'vaccination';
    content: string;
    animal_id?: string;
    competency?: string;
    location?: string;
    supervisor?: string;
    session_id?: string;
    grade_level?: number;
    sae_project_id?: string;
  }): Promise<any> {
    const webhookUrl = this.config.learningEventWebhook || process.env.EXPO_PUBLIC_N8N_LEARNING_EVENT_WEBHOOK;
    
    if (!webhookUrl) {
      console.warn('N8N Learning event webhook not configured - skipping cloud workflow');
      return { success: false, message: 'Webhook not configured' };
    }

    try {
      const payload = {
        ...eventData,
        timestamp: new Date().toISOString(),
        source: 'showtrack_ai_agricultural_education'
      };

      console.log('🔄 Sending learning event to N8N:', payload.event_type);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Learning event processing failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Learning event processed successfully by N8N Cloud:', {
        event_type: eventData.event_type,
        session_id: result.data?.session_id,
        concepts_extracted: result.data?.concepts_extracted,
        quality_score: result.data?.quality_score,
        competency_updated: result.data?.competency_updated
      });
      
      return result;
    } catch (error) {
      console.error('❌ N8N Learning event processing failed:', error);
      
      // Don't throw error - allow app to continue functioning without N8N
      return { 
        success: false, 
        error: error.message,
        fallback: true 
      };
    }
  }

  /**
   * Trigger Knowledge Graph Analysis - Manually trigger knowledge graph analysis for a student
   * Workflow: ag_knowledge_graph_analyzer.json (normally runs every 6 hours automatically)
   */
  async triggerKnowledgeGraphAnalysis(studentId: string, options?: {
    force_analysis?: boolean;
    include_recommendations?: boolean;
  }): Promise<any> {
    const webhookUrl = this.config.knowledgeGraphWebhook || process.env.EXPO_PUBLIC_N8N_KNOWLEDGE_GRAPH_WEBHOOK;
    
    if (!webhookUrl) {
      console.warn('N8N Knowledge graph webhook not configured - skipping analysis');
      return { success: false, message: 'Knowledge graph webhook not configured' };
    }

    try {
      const payload = {
        student_id: studentId,
        trigger_type: 'manual',
        options: options || {
          force_analysis: true,
          include_recommendations: true
        },
        timestamp: new Date().toISOString()
      };

      console.log('🧠 Triggering knowledge graph analysis for student:', studentId);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Knowledge graph analysis failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Knowledge graph analysis triggered successfully:', {
        student_id: studentId,
        analysis_scheduled: true,
        workflow: 'ag_knowledge_graph_analyzer'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Knowledge graph analysis failed:', error);
      
      // Don't throw error - return fallback response
      return { 
        success: false, 
        error: error.message,
        fallback: true 
      };
    }
  }

  /**
   * Generate Recommendations - Trigger AI-powered recommendation generation
   * Workflow: ag_recommendation_generator.json
   */
  async generateRecommendations(data: {
    student_id: string;
    trigger: 'high_quality_learning' | 'skill_gap_detected' | 'completion_milestone' | 'manual_request' | 'scheduled_analysis';
    context?: {
      competency?: string;
      animal_id?: string;
      sae_project_id?: string;
      recent_activities?: string[];
      learning_goals?: string[];
    };
  }): Promise<any> {
    const webhookUrl = this.config.recommendationWebhook || process.env.EXPO_PUBLIC_N8N_RECOMMENDATION_WEBHOOK;
    
    if (!webhookUrl) {
      console.warn('N8N Recommendation webhook not configured - generating local recommendations');
      return this.generateLocalRecommendations(data);
    }

    try {
      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'showtrack_ai_agricultural_education'
      };

      console.log('🎯 Generating recommendations via N8N for student:', data.student_id, 'trigger:', data.trigger);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Recommendation generation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ AI recommendations generated successfully:', {
        student_id: data.student_id,
        trigger: data.trigger,
        recommendations_created: result.recommendations_count || 'unknown',
        workflow: 'ag_recommendation_generator'
      });
      
      return result;
    } catch (error) {
      console.error('❌ N8N Recommendation generation failed:', error);
      
      // Fallback to local recommendations
      console.log('🔄 Falling back to local recommendation generation');
      return this.generateLocalRecommendations(data);
    }
  }

  /**
   * Generate local recommendations when N8N is not available
   */
  private generateLocalRecommendations(data: {
    student_id: string;
    trigger: string;
    context?: any;
  }): any {
    const recommendations = [];
    
    // Generate basic recommendations based on trigger
    switch (data.trigger) {
      case 'high_quality_learning':
        recommendations.push({
          type: 'skill_development',
          title: 'Continue Excellent Work!',
          description: 'Your recent learning activity shows great progress. Consider exploring advanced topics in this area.',
          priority: 'medium'
        });
        break;
        
      case 'skill_gap_detected':
        recommendations.push({
          type: 'skill_development',
          title: 'Skill Development Opportunity',
          description: 'Focus on practicing health assessment skills with your animals.',
          priority: 'high'
        });
        break;
        
      case 'manual_request':
        recommendations.push({
          type: 'general',
          title: 'Next Steps for Your SAE Project',
          description: 'Consider documenting your recent animal health observations in detail.',
          priority: 'medium'
        });
        break;
        
      default:
        recommendations.push({
          type: 'general',
          title: 'Keep Up the Great Work',
          description: 'Continue tracking your animals daily and documenting your observations.',
          priority: 'low'
        });
    }
    
    return {
      success: true,
      recommendations,
      fallback: true,
      message: 'Local recommendations generated'
    };
  }

  /**
   * Quick helper methods for common agricultural education workflows
   */

  // ===== CONVENIENCE METHODS FOR AGRICULTURAL EDUCATION =====
  
  /**
   * Process health check learning event with automatic competency mapping
   */
  async processHealthCheckEvent(studentId: string, content: string, metadata: {
    animal_id: string;
    competency?: string;
    supervisor?: string;
  }): Promise<any> {
    // Auto-map to FFA competency if not provided
    const competency = metadata.competency || 'AS.07.01'; // Health management practices
    
    return this.processLearningEvent({
      student_id: studentId,
      event_type: 'health_check',
      content,
      competency,
      ...metadata
    });
  }

  /**
   * Process journal entry learning event with content analysis
   */
  async processJournalEntry(studentId: string, content: string, metadata: {
    animal_id?: string;
    competency?: string;
    sae_project_id?: string;
  }): Promise<any> {
    // Determine competency from content if not provided
    let competency = metadata.competency;
    if (!competency) {
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('health') || lowerContent.includes('sick') || lowerContent.includes('treatment')) {
        competency = 'AS.07.01';
      } else if (lowerContent.includes('feed') || lowerContent.includes('nutrition')) {
        competency = 'AS.06.01';
      } else if (lowerContent.includes('breeding') || lowerContent.includes('reproduction')) {
        competency = 'AS.05.01';
      }
    }
    
    return this.processLearningEvent({
      student_id: studentId,
      event_type: 'journal_entry',
      content,
      competency,
      ...metadata
    });
  }

  /**
   * Process SAE activity learning event with project tracking
   */
  async processSAEActivity(studentId: string, content: string, metadata: {
    sae_project_id: string;
    competency?: string;
    supervisor?: string;
  }): Promise<any> {
    return this.processLearningEvent({
      student_id: studentId,
      event_type: 'sae_activity',
      content,
      ...metadata
    });
  }

  /**
   * Trigger recommendations after high-quality learning with enhanced context
   */
  async triggerHighQualityLearningRecommendations(studentId: string, context: {
    competency: string;
    animal_id?: string;
    learning_quality_score: number;
  }): Promise<any> {
    console.log('🌟 Triggering high-quality learning recommendations:', {
      student_id: studentId,
      competency: context.competency,
      quality_score: context.learning_quality_score
    });
    
    return this.generateRecommendations({
      student_id: studentId,
      trigger: 'high_quality_learning',
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        source_workflow: 'high_quality_learning_detection'
      }
    });
  }

  /**
   * Batch process multiple learning events efficiently
   */
  async processBatchLearningEvents(events: Array<{
    student_id: string;
    event_type: string;
    content: string;
    metadata?: any;
  }>): Promise<any[]> {
    console.log(`📚 Processing ${events.length} learning events in batch`);
    
    const results = [];
    
    for (const event of events) {
      try {
        const result = await this.processLearningEvent({
          student_id: event.student_id,
          event_type: event.event_type as any,
          content: event.content,
          ...event.metadata
        });
        
        results.push({ ...result, event_id: `${event.student_id}_${Date.now()}` });
        
        // Small delay to prevent overwhelming the N8N webhook
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Batch event processing failed:', error);
        results.push({ 
          success: false, 
          error: error.message, 
          event_id: `${event.student_id}_${Date.now()}` 
        });
      }
    }
    
    console.log(`✅ Batch processing complete: ${results.filter(r => r.success !== false).length}/${events.length} successful`);
    return results;
  }
}

export default N8nWorkflowService;