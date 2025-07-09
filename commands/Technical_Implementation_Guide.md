# Technical Implementation Guide: FFA Medical Follow-Up System

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Models](#data-models)
3. [Service Layer](#service-layer)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Security Implementation](#security-implementation)
7. [Performance Optimization](#performance-optimization)
8. [Integration Points](#integration-points)

## 🏗️ System Architecture

### Component Overview

```
src/
├── core/
│   ├── models/
│   │   └── FollowUpTask.ts         # Core data models
│   └── services/
│       └── FollowUpTaskService.ts   # Business logic
├── features/
│   └── medical/
│       ├── screens/
│       │   ├── PendingHealthIssuesScreen.tsx
│       │   └── EducatorDashboardScreen.tsx
│       └── components/
│           ├── FollowUpTaskModal.tsx
│           └── StudentHealthModal.tsx
└── shared/
    └── services/
        └── NotificationService.ts   # Alert delivery
```

### Service Architecture

```typescript
// Layered architecture pattern
┌─────────────────────────────────┐
│      Presentation Layer         │ ← React Native Components
├─────────────────────────────────┤
│      Business Logic Layer       │ ← Services & Stores
├─────────────────────────────────┤
│      Data Access Layer          │ ← Storage Service
├─────────────────────────────────┤
│      Persistence Layer          │ ← AsyncStorage/SQLite
└─────────────────────────────────┘
```

## 📊 Data Models

### FollowUpTask Model

```typescript
export interface FollowUpTask {
  id: string;
  healthRecordId: string;
  animalId: string;
  studentId: string;
  assignedBy?: string; // Instructor ID
  
  // Task details
  taskType: 'monitoring' | 'treatment' | 'assessment' | 'vaccination' | 'follow_up';
  taskTitle: string;
  taskDescription: string;
  detailedInstructions: string;
  
  // Scheduling
  createdDate: Date;
  dueDate: Date;
  frequency: 'once' | 'daily' | 'twice_daily' | 'weekly' | 'custom';
  durationDays: number;
  
  // Progress tracking
  completionStatus: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  progressPercentage: number;
  lastUpdate?: Date;
  
  // Priority and escalation
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  escalationTriggered: boolean;
  escalationDate?: Date;
  
  // Educational integration
  learningObjectives: string[];
  competencyStandards: string[]; // ['AS.07.01.02.a', 'AS.07.02.01.b']
  reflectionRequired: boolean;
  
  // Completion and resolution
  completedDate?: Date;
  resolutionNotes?: string;
  outcomeStatus?: 'resolved' | 'improved' | 'referred' | 'ongoing';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### FollowUpUpdate Model

```typescript
export interface FollowUpUpdate {
  id: string;
  followUpTaskId: string;
  studentId: string;
  
  // Update content
  updateDate: Date;
  observations: string;
  measurements: HealthMeasurements;
  photos: HealthPhoto[];
  
  // Assessment data
  conditionAssessment: 'improved' | 'same' | 'worse' | 'resolved';
  concernLevel: number; // 1-5 scale
  actionTaken: string;
  
  // Student reflection
  studentNotes: string;
  questionsForExpert: string;
  confidenceLevel: number; // 1-5 scale
  
  // Quality indicators
  updateCompletenessScore: number; // 0.00-1.00
  photoQualityScore: number;
  documentationQuality: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Educator review
  reviewedBy?: string;
  reviewStatus: 'pending' | 'reviewed' | 'flagged';
  educatorFeedback?: string;
  competencyDemonstrated: boolean;
  
  createdAt: Date;
}
```

### Supporting Types

```typescript
export interface HealthMeasurements {
  temperature?: {
    value: number;
    unit: 'F' | 'C';
    time: Date;
  };
  weight?: {
    value: number;
    unit: 'lbs' | 'kg';
  };
  heartRate?: number;
  respiratoryRate?: number;
  behaviorScore?: number; // 1-5 scale
  appetiteScore?: number; // 1-5 scale
  mobilityScore?: number; // 1-5 scale
  customMeasurements?: Record<string, any>;
}

export interface HealthPhoto {
  id: string;
  uri: string;
  caption: string;
  photoType: 'condition' | 'treatment' | 'progress' | 'medication' | 'general';
  analysisResults?: {
    qualityScore: number;
    suggestedImprovements: string[];
    detectedIssues: string[];
  };
  metadata: {
    timestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
    };
    cameraSettings?: Record<string, any>;
  };
}
```

## 🔧 Service Layer

### FollowUpTaskService Implementation

```typescript
export class FollowUpTaskService {
  // Storage keys
  private readonly FOLLOW_UP_TASKS_KEY = STORAGE_KEYS.FOLLOW_UP_TASKS;
  private readonly FOLLOW_UP_UPDATES_KEY = STORAGE_KEYS.FOLLOW_UP_UPDATES;
  private readonly HEALTH_ALERTS_KEY = STORAGE_KEYS.HEALTH_ALERTS;
  
  // Task Management
  async createFollowUpTask(
    taskData: Omit<FollowUpTask, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FollowUpTask> {
    const task: FollowUpTask = {
      ...taskData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      progressPercentage: 0,
      escalationTriggered: false,
      completionStatus: 'pending'
    };

    const tasks = await this.getAllFollowUpTasks();
    tasks.push(task);
    await storageService.saveData(this.FOLLOW_UP_TASKS_KEY, tasks);

    // Create initial alert
    await this.createAlert({
      alertType: 'completion_reminder',
      priorityLevel: task.priorityLevel,
      studentId: task.studentId,
      followUpTaskId: task.id,
      title: `New Follow-up Task: ${task.taskTitle}`,
      message: `You have been assigned a new health follow-up task.`,
      createdDate: new Date()
    });

    return task;
  }

  // Escalation Logic
  private async checkEscalationTriggers(
    taskId: string, 
    update: FollowUpUpdate
  ): Promise<void> {
    const task = await this.getFollowUpTask(taskId);
    if (!task) return;

    let shouldEscalate = false;
    let escalationReason = '';

    // Check multiple escalation conditions
    if (update.concernLevel >= 4) {
      shouldEscalate = true;
      escalationReason = 'High concern level reported';
    }

    if (update.conditionAssessment === 'worse') {
      shouldEscalate = true;
      escalationReason = 'Condition deteriorating';
    }

    // Emergency keyword detection
    const emergencyKeywords = [
      'emergency', 'severe', 'critical', 
      'urgent', 'distress', 'collapsed',
      'bleeding', 'unconscious', 'seizure'
    ];
    
    const textToCheck = `${update.observations} ${update.studentNotes}`.toLowerCase();
    const detectedKeywords = emergencyKeywords.filter(keyword => 
      textToCheck.includes(keyword)
    );

    if (detectedKeywords.length > 0) {
      shouldEscalate = true;
      escalationReason = `Emergency keywords detected: ${detectedKeywords.join(', ')}`;
    }

    if (shouldEscalate && !task.escalationTriggered) {
      await this.triggerEscalation(taskId, escalationReason, update);
    }
  }

  // Quality Scoring Algorithm
  calculateUpdateQuality(update: FollowUpUpdate): number {
    let score = 0;
    const weights = {
      observations: 0.3,
      measurements: 0.2,
      photos: 0.2,
      actionTaken: 0.15,
      reflection: 0.15
    };

    // Observation quality
    if (update.observations.length > 50) score += weights.observations;
    else if (update.observations.length > 20) score += weights.observations * 0.5;

    // Measurements completeness
    const measurementCount = Object.keys(update.measurements).length;
    if (measurementCount >= 2) score += weights.measurements;
    else if (measurementCount >= 1) score += weights.measurements * 0.5;

    // Photo documentation
    if (update.photos.length >= 2) score += weights.photos;
    else if (update.photos.length >= 1) score += weights.photos * 0.5;

    // Action documentation
    if (update.actionTaken.length > 20) score += weights.actionTaken;

    // Reflection quality
    const reflectionLength = update.studentNotes.length + 
                           update.questionsForExpert.length;
    if (reflectionLength > 50) score += weights.reflection;
    else if (reflectionLength > 20) score += weights.reflection * 0.5;

    return Math.min(score, 1.0);
  }
}
```

### Notification Service

```typescript
export class NotificationService {
  // Priority-based delivery
  async sendNotification(notification: NotificationPayload): Promise<void> {
    const { priority, type, recipient, channel } = notification;
    
    // Determine delivery channels based on priority
    const channels = this.getDeliveryChannels(priority);
    
    for (const channel of channels) {
      try {
        await this.deliverViaChannel(channel, notification);
      } catch (error) {
        console.error(`Failed to deliver via ${channel}:`, error);
      }
    }
  }

  private getDeliveryChannels(priority: string): DeliveryChannel[] {
    switch (priority) {
      case 'urgent':
        return ['push', 'sms', 'email', 'dashboard'];
      case 'high':
        return ['push', 'email', 'dashboard'];
      case 'medium':
        return ['push', 'dashboard'];
      default:
        return ['dashboard'];
    }
  }

  // Batch notification processing
  async processBatchNotifications(): Promise<void> {
    const pending = await this.getPendingNotifications();
    const grouped = this.groupByRecipient(pending);
    
    for (const [recipientId, notifications] of grouped) {
      const digest = this.createDigest(notifications);
      await this.sendDigest(recipientId, digest);
    }
  }
}
```

## 🌐 API Endpoints

### RESTful API Design

```typescript
// Follow-up Task Endpoints
POST   /api/follow-up-tasks                 // Create new task
GET    /api/follow-up-tasks                 // List tasks (with filters)
GET    /api/follow-up-tasks/:id             // Get specific task
PUT    /api/follow-up-tasks/:id             // Update task
DELETE /api/follow-up-tasks/:id             // Cancel task

// Task Updates
POST   /api/follow-up-tasks/:id/updates     // Add update
GET    /api/follow-up-tasks/:id/updates     // Get task updates
PUT    /api/follow-up-updates/:id           // Edit update

// Student Endpoints
GET    /api/students/:id/health-overview    // Student dashboard data
GET    /api/students/:id/pending-tasks      // Active tasks
POST   /api/students/:id/complete-task      // Complete with reflection

// Educator Endpoints
GET    /api/educator/dashboard              // Overview data
GET    /api/educator/students               // Student list with metrics
GET    /api/educator/analytics              // Chapter analytics
POST   /api/educator/intervention           // Record intervention

// Alert Management
GET    /api/alerts                          // Get alerts
PUT    /api/alerts/:id/acknowledge          // Mark as read
PUT    /api/alerts/:id/resolve              // Resolve alert
```

### GraphQL Schema

```graphql
type FollowUpTask {
  id: ID!
  healthRecord: HealthRecord!
  animal: Animal!
  student: User!
  assignedBy: User
  
  taskType: TaskType!
  taskTitle: String!
  taskDescription: String!
  detailedInstructions: String!
  
  createdDate: DateTime!
  dueDate: DateTime!
  frequency: TaskFrequency!
  durationDays: Int!
  
  completionStatus: CompletionStatus!
  progressPercentage: Float!
  lastUpdate: DateTime
  
  priorityLevel: PriorityLevel!
  escalationTriggered: Boolean!
  escalationDate: DateTime
  
  learningObjectives: [String!]!
  competencyStandards: [String!]!
  
  updates: [FollowUpUpdate!]!
  alerts: [HealthAlert!]!
}

type Query {
  followUpTask(id: ID!): FollowUpTask
  studentTasks(
    studentId: ID!
    status: CompletionStatus
    priority: PriorityLevel
  ): [FollowUpTask!]!
  
  chapterMetrics(chapterId: ID!): ChapterMetrics!
  studentOverview(studentId: ID!): StudentHealthOverview!
}

type Mutation {
  createFollowUpTask(input: CreateTaskInput!): FollowUpTask!
  addTaskUpdate(taskId: ID!, input: AddUpdateInput!): FollowUpUpdate!
  completeTask(
    taskId: ID!
    resolution: ResolutionInput!
  ): FollowUpTask!
  
  recordIntervention(
    studentId: ID!
    input: InterventionInput!
  ): Intervention!
}

type Subscription {
  taskUpdated(taskId: ID!): FollowUpTask!
  alertCreated(userId: ID!): HealthAlert!
  studentProgressChanged(studentId: ID!): StudentHealthOverview!
}
```

## 🗄️ Database Schema

### SQL Schema Design

```sql
-- Follow-up tasks table
CREATE TABLE follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_record_id UUID REFERENCES health_records(id),
    animal_id UUID REFERENCES animals(id),
    student_id UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    
    -- Task details
    task_type VARCHAR(50) NOT NULL,
    task_title VARCHAR(200) NOT NULL,
    task_description TEXT NOT NULL,
    detailed_instructions TEXT,
    
    -- Scheduling
    created_date TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    duration_days INTEGER NOT NULL,
    
    -- Progress
    completion_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_update TIMESTAMP,
    
    -- Priority
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    escalation_triggered BOOLEAN DEFAULT FALSE,
    escalation_date TIMESTAMP,
    
    -- Educational
    learning_objectives TEXT[],
    competency_standards VARCHAR(50)[],
    reflection_required BOOLEAN DEFAULT TRUE,
    
    -- Completion
    completed_date TIMESTAMP,
    resolution_notes TEXT,
    outcome_status VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_student_status (student_id, completion_status),
    INDEX idx_due_date (due_date),
    INDEX idx_priority (priority_level, escalation_triggered)
);

-- Task updates table
CREATE TABLE follow_up_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follow_up_task_id UUID REFERENCES follow_up_tasks(id),
    student_id UUID REFERENCES users(id),
    
    -- Update content
    update_date TIMESTAMP NOT NULL DEFAULT NOW(),
    observations TEXT NOT NULL,
    measurements JSONB,
    photos JSONB,
    
    -- Assessment
    condition_assessment VARCHAR(20) NOT NULL,
    concern_level INTEGER CHECK (concern_level BETWEEN 1 AND 5),
    action_taken TEXT,
    
    -- Reflection
    student_notes TEXT,
    questions_for_expert TEXT,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    
    -- Quality
    update_completeness_score DECIMAL(3,2),
    photo_quality_score DECIMAL(3,2),
    documentation_quality VARCHAR(20),
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    review_status VARCHAR(20) DEFAULT 'pending',
    educator_feedback TEXT,
    competency_demonstrated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_task_updates (follow_up_task_id),
    INDEX idx_update_date (update_date)
);

-- Health alerts table
CREATE TABLE health_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    priority_level VARCHAR(20) NOT NULL,
    
    -- Recipients
    student_id UUID REFERENCES users(id),
    educator_id UUID REFERENCES users(id),
    follow_up_task_id UUID REFERENCES follow_up_tasks(id),
    
    -- Content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    alert_data JSONB,
    
    -- Delivery
    created_date TIMESTAMP NOT NULL DEFAULT NOW(),
    scheduled_delivery TIMESTAMP,
    delivered_date TIMESTAMP,
    acknowledged_date TIMESTAMP,
    
    -- Resolution
    action_taken BOOLEAN DEFAULT FALSE,
    action_description TEXT,
    resolved_date TIMESTAMP,
    
    -- Channels
    email_sent BOOLEAN DEFAULT FALSE,
    push_notification_sent BOOLEAN DEFAULT FALSE,
    dashboard_notification BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_recipient_unresolved (student_id, educator_id, resolved_date),
    INDEX idx_priority_created (priority_level, created_date)
);
```

### NoSQL Schema (MongoDB)

```javascript
// Follow-up Task Document
{
  _id: ObjectId("..."),
  healthRecordId: ObjectId("..."),
  animalId: ObjectId("..."),
  studentId: ObjectId("..."),
  assignedBy: ObjectId("..."),
  
  task: {
    type: "monitoring",
    title: "Post-treatment respiratory monitoring",
    description: "Monitor breathing patterns...",
    detailedInstructions: "Check twice daily...",
  },
  
  schedule: {
    createdDate: ISODate("2024-01-15T08:00:00Z"),
    dueDate: ISODate("2024-01-22T17:00:00Z"),
    frequency: "twice_daily",
    durationDays: 7
  },
  
  progress: {
    status: "in_progress",
    percentage: 42.86,
    lastUpdate: ISODate("2024-01-17T14:30:00Z"),
    updateCount: 6,
    missedUpdates: 0
  },
  
  priority: {
    level: "high",
    escalated: false,
    escalationDate: null,
    escalationReason: null
  },
  
  educational: {
    learningObjectives: [
      "Identify respiratory distress symptoms",
      "Document systematic observations"
    ],
    competencyStandards: ["AS.07.01.02.a", "AS.07.02.01.b"],
    reflectionRequired: true
  },
  
  updates: [
    {
      _id: ObjectId("..."),
      date: ISODate("2024-01-15T09:00:00Z"),
      observations: "Normal breathing, clear nasal discharge...",
      measurements: {
        temperature: { value: 101.5, unit: "F" },
        respiratoryRate: 24
      },
      photos: ["photo_id_1", "photo_id_2"],
      assessment: {
        condition: "improving",
        concernLevel: 2,
        confidence: 4
      },
      quality: {
        completeness: 0.85,
        photoQuality: 0.90,
        overall: "good"
      }
    }
  ],
  
  completion: {
    completed: false,
    completedDate: null,
    resolution: null,
    outcome: null,
    reflection: null
  },
  
  metadata: {
    createdAt: ISODate("2024-01-15T08:00:00Z"),
    updatedAt: ISODate("2024-01-17T14:30:00Z"),
    version: 1
  }
}
```

## 🔐 Security Implementation

### Authentication & Authorization

```typescript
// Role-based access control
export const PERMISSIONS = {
  // Student permissions
  STUDENT: {
    VIEW_OWN_TASKS: true,
    CREATE_UPDATES: true,
    VIEW_OWN_HISTORY: true,
    COMPLETE_TASKS: true,
    REQUEST_HELP: true
  },
  
  // Educator permissions
  EDUCATOR: {
    VIEW_ALL_STUDENTS: true,
    CREATE_TASKS: true,
    VIEW_ALL_UPDATES: true,
    CREATE_INTERVENTIONS: true,
    MODIFY_TASKS: true,
    VIEW_ANALYTICS: true,
    EXPORT_DATA: true
  },
  
  // Admin permissions
  ADMIN: {
    ...EDUCATOR,
    MANAGE_USERS: true,
    SYSTEM_SETTINGS: true,
    DELETE_DATA: true
  }
};

// Permission checking middleware
export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const permissions = PERMISSIONS[userRole];
    
    if (!permissions[permission]) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};
```

### Data Privacy

```typescript
// Data isolation rules
export class DataPrivacyService {
  // Student data isolation
  async getStudentData(requesterId: string, studentId: string): Promise<any> {
    // Students can only see their own data
    if (requesterId !== studentId && !this.isEducator(requesterId)) {
      throw new UnauthorizedError('Cannot access other student data');
    }
    
    // Filter sensitive information
    const data = await this.fetchStudentData(studentId);
    return this.filterSensitiveData(data, requesterId);
  }
  
  // Educator boundaries
  async getEducatorStudents(educatorId: string): Promise<Student[]> {
    // Only return students assigned to this educator
    const assignments = await this.getEducatorAssignments(educatorId);
    return assignments.map(a => this.sanitizeStudentData(a.student));
  }
  
  // Data sanitization
  private sanitizeStudentData(student: Student): SanitizedStudent {
    return {
      id: student.id,
      name: student.name,
      // Exclude: phone, email, address, parentInfo
      performanceMetrics: student.performanceMetrics,
      activeTasks: student.activeTasks
    };
  }
}
```

### Audit Logging

```typescript
// Comprehensive audit trail
export class AuditService {
  async logAction(action: AuditAction): Promise<void> {
    const auditEntry = {
      id: generateId(),
      timestamp: new Date(),
      userId: action.userId,
      userRole: action.userRole,
      actionType: action.type,
      resourceType: action.resourceType,
      resourceId: action.resourceId,
      changes: action.changes,
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
      success: action.success,
      errorMessage: action.errorMessage
    };
    
    await this.saveAuditEntry(auditEntry);
    
    // Real-time monitoring for critical actions
    if (this.isCriticalAction(action.type)) {
      await this.notifyAdmins(auditEntry);
    }
  }
  
  private isCriticalAction(actionType: string): boolean {
    const criticalActions = [
      'DELETE_TASK',
      'MODIFY_GRADE',
      'ACCESS_DENIED',
      'ESCALATION_OVERRIDE',
      'BULK_DATA_EXPORT'
    ];
    
    return criticalActions.includes(actionType);
  }
}
```

## ⚡ Performance Optimization

### Caching Strategy

```typescript
// Multi-level caching
export class CacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly MEMORY_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Memory cache for frequently accessed data
  async getCachedData<T>(
    key: string, 
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check memory cache first
    const memoryHit = this.memoryCache.get(key);
    if (memoryHit && Date.now() - memoryHit.timestamp < this.MEMORY_TTL) {
      return memoryHit.data as T;
    }
    
    // Check persistent cache
    const persistentHit = await AsyncStorage.getItem(`cache:${key}`);
    if (persistentHit) {
      const parsed = JSON.parse(persistentHit);
      if (Date.now() - parsed.timestamp < this.PERSISTENT_TTL) {
        // Update memory cache
        this.memoryCache.set(key, parsed);
        return parsed.data as T;
      }
    }
    
    // Cache miss - fetch data
    const data = await fetcher();
    await this.cacheData(key, data);
    return data;
  }
  
  // Intelligent cache invalidation
  async invalidateRelated(pattern: string): Promise<void> {
    // Invalidate memory cache
    for (const [key] of this.memoryCache) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Invalidate persistent cache
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => 
      k.startsWith('cache:') && k.includes(pattern)
    );
    await AsyncStorage.multiRemove(cacheKeys);
  }
}
```

### Query Optimization

```typescript
// Batch loading with DataLoader pattern
export class TaskDataLoader {
  private loader = new DataLoader<string, FollowUpTask>(
    async (taskIds) => {
      const tasks = await this.batchLoadTasks(taskIds);
      return taskIds.map(id => 
        tasks.find(t => t.id === id) || null
      );
    },
    { cache: true, batchScheduleFn: callback => setTimeout(callback, 10) }
  );
  
  async loadTask(taskId: string): Promise<FollowUpTask> {
    return this.loader.load(taskId);
  }
  
  async loadTasks(taskIds: string[]): Promise<FollowUpTask[]> {
    return this.loader.loadMany(taskIds);
  }
  
  // Optimized batch query
  private async batchLoadTasks(taskIds: string[]): Promise<FollowUpTask[]> {
    const query = `
      SELECT t.*, 
             COUNT(u.id) as update_count,
             MAX(u.update_date) as last_update_date
      FROM follow_up_tasks t
      LEFT JOIN follow_up_updates u ON t.id = u.follow_up_task_id
      WHERE t.id = ANY($1)
      GROUP BY t.id
    `;
    
    const result = await db.query(query, [taskIds]);
    return result.rows.map(this.mapToTask);
  }
}
```

### Real-time Updates

```typescript
// WebSocket implementation for real-time sync
export class RealtimeService {
  private socket: WebSocket;
  private subscriptions = new Map<string, Set<Function>>();
  
  connect(): void {
    this.socket = new WebSocket(WS_ENDPOINT);
    
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    // Reconnection logic
    this.socket.onclose = () => {
      setTimeout(() => this.connect(), 5000);
    };
  }
  
  // Subscribe to specific task updates
  subscribeToTask(taskId: string, callback: Function): () => void {
    const channel = `task:${taskId}`;
    
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      this.socket.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
    
    this.subscriptions.get(channel)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(channel);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscriptions.delete(channel);
          this.socket.send(JSON.stringify({
            type: 'unsubscribe',
            channel
          }));
        }
      }
    };
  }
  
  private handleMessage(message: any): void {
    const { channel, data } = message;
    const subscribers = this.subscriptions.get(channel);
    
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }
}
```

## 🔌 Integration Points

### AET Journal Integration

```typescript
export class AETIntegrationService {
  // Sync follow-up task to AET Journal
  async syncTaskToAET(task: FollowUpTask): Promise<void> {
    const aetEntry = {
      student_id: task.studentId,
      entry_type: 'sae_health_management',
      category: this.mapTaskTypeToAET(task.taskType),
      date: task.createdDate,
      hours: this.calculateSAEHours(task),
      description: this.formatForAET(task),
      skills: task.competencyStandards,
      quality_rating: await this.calculateQualityRating(task),
      supervisor_id: task.assignedBy,
      location: {
        type: 'school_farm',
        name: 'FFA Animal Facility'
      }
    };
    
    await this.aetAPI.createEntry(aetEntry);
  }
  
  // Calculate SAE hours based on task
  private calculateSAEHours(task: FollowUpTask): number {
    const baseHours = {
      'monitoring': 0.5,
      'treatment': 1.0,
      'assessment': 0.75,
      'vaccination': 0.5
    };
    
    const frequencyMultiplier = {
      'once': 1,
      'daily': task.durationDays,
      'twice_daily': task.durationDays * 2,
      'weekly': Math.ceil(task.durationDays / 7)
    };
    
    return baseHours[task.taskType] * frequencyMultiplier[task.frequency];
  }
}
```

### Veterinary System Integration

```typescript
export class VeterinaryIntegration {
  // Share case with veterinarian
  async shareWithVet(taskId: string, vetId: string): Promise<void> {
    const task = await this.taskService.getTask(taskId);
    const updates = await this.taskService.getTaskUpdates(taskId);
    
    const vetCase = {
      referenceId: task.id,
      animalId: task.animalId,
      studentName: await this.getStudentName(task.studentId),
      instructorName: await this.getInstructorName(task.assignedBy),
      
      history: {
        initialComplaint: task.taskDescription,
        timeline: this.createTimeline(task, updates),
        measurements: this.aggregateMeasurements(updates),
        photos: await this.preparePhotos(updates),
        studentObservations: this.compileObservations(updates)
      },
      
      urgency: task.priorityLevel,
      requestType: 'consultation',
      
      callback: {
        url: `${API_BASE}/vet-response`,
        token: await this.generateCallbackToken(taskId)
      }
    };
    
    await this.vetAPI.createCase(vetCase);
  }
}
```

### Parent Portal Integration

```typescript
export class ParentPortalService {
  // Generate parent report
  async generateParentReport(
    studentId: string, 
    period: DateRange
  ): Promise<ParentReport> {
    const tasks = await this.getStudentTasks(studentId, period);
    const metrics = await this.calculateMetrics(tasks);
    
    return {
      student: await this.getStudentInfo(studentId),
      period,
      
      summary: {
        totalTasks: tasks.length,
        completedOnTime: tasks.filter(t => this.isCompletedOnTime(t)).length,
        averageQuality: metrics.averageQuality,
        skillsDeveloped: this.identifySkills(tasks)
      },
      
      highlights: {
        bestWork: this.findBestWork(tasks),
        improvements: this.identifyImprovements(tasks),
        challenges: this.identifyChallenges(tasks)
      },
      
      educatorNotes: await this.getEducatorNotes(studentId, period),
      
      recommendations: this.generateRecommendations(metrics),
      
      nextSteps: {
        upcomingTasks: await this.getUpcomingTasks(studentId),
        learningGoals: this.suggestLearningGoals(metrics)
      }
    };
  }
}
```

## 🧪 Testing Strategy

### Unit Testing

```typescript
describe('FollowUpTaskService', () => {
  let service: FollowUpTaskService;
  let mockStorage: jest.Mocked<StorageService>;
  
  beforeEach(() => {
    mockStorage = createMockStorage();
    service = new FollowUpTaskService(mockStorage);
  });
  
  describe('createFollowUpTask', () => {
    it('should create task with proper defaults', async () => {
      const taskData = createTestTaskData();
      const task = await service.createFollowUpTask(taskData);
      
      expect(task).toMatchObject({
        ...taskData,
        id: expect.any(String),
        progressPercentage: 0,
        completionStatus: 'pending',
        escalationTriggered: false
      });
    });
    
    it('should create initial alert', async () => {
      const taskData = createTestTaskData();
      await service.createFollowUpTask(taskData);
      
      expect(mockStorage.saveData).toHaveBeenCalledWith(
        expect.stringContaining('alerts'),
        expect.arrayContaining([
          expect.objectContaining({
            alertType: 'completion_reminder',
            studentId: taskData.studentId
          })
        ])
      );
    });
  });
  
  describe('escalation logic', () => {
    it('should escalate on high concern level', async () => {
      const task = await createTestTask(service);
      const update = createTestUpdate({ concernLevel: 4 });
      
      await service.addTaskUpdate(update);
      
      const updatedTask = await service.getTask(task.id);
      expect(updatedTask.escalationTriggered).toBe(true);
    });
    
    it('should detect emergency keywords', async () => {
      const task = await createTestTask(service);
      const update = createTestUpdate({
        observations: 'Animal showing severe distress'
      });
      
      await service.addTaskUpdate(update);
      
      const alerts = await service.getAlerts();
      expect(alerts).toContainEqual(
        expect.objectContaining({
          alertType: 'escalation_needed',
          priorityLevel: 'urgent'
        })
      );
    });
  });
});
```

### Integration Testing

```typescript
describe('Follow-up System Integration', () => {
  let app: Application;
  let studentToken: string;
  let educatorToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    studentToken = await loginAsStudent();
    educatorToken = await loginAsEducator();
  });
  
  it('should handle complete task lifecycle', async () => {
    // Educator creates task
    const createResponse = await request(app)
      .post('/api/follow-up-tasks')
      .set('Authorization', `Bearer ${educatorToken}`)
      .send({
        studentId: 'test-student',
        animalId: 'test-animal',
        taskType: 'monitoring',
        dueDate: addDays(new Date(), 7)
      });
      
    expect(createResponse.status).toBe(201);
    const taskId = createResponse.body.id;
    
    // Student receives notification
    const alerts = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${studentToken}`);
      
    expect(alerts.body).toContainEqual(
      expect.objectContaining({
        followUpTaskId: taskId
      })
    );
    
    // Student adds update
    const updateResponse = await request(app)
      .post(`/api/follow-up-tasks/${taskId}/updates`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        observations: 'Animal appears healthy',
        conditionAssessment: 'same',
        concernLevel: 2
      });
      
    expect(updateResponse.status).toBe(201);
    
    // Educator sees update
    const overview = await request(app)
      .get('/api/educator/dashboard')
      .set('Authorization', `Bearer ${educatorToken}`);
      
    expect(overview.body.todaysFollowUps).toContainEqual(
      expect.objectContaining({
        id: taskId,
        lastUpdate: expect.any(String)
      })
    );
  });
});
```

### Performance Testing

```typescript
describe('Performance Benchmarks', () => {
  it('should load dashboard in under 500ms', async () => {
    const start = Date.now();
    
    const response = await request(app)
      .get('/api/educator/dashboard')
      .set('Authorization', `Bearer ${educatorToken}`);
      
    const duration = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });
  
  it('should handle 100 concurrent updates', async () => {
    const updates = Array(100).fill(null).map((_, i) => ({
      taskId: `task-${i}`,
      observations: `Update ${i}`,
      concernLevel: Math.floor(Math.random() * 5) + 1
    }));
    
    const results = await Promise.all(
      updates.map(update =>
        request(app)
          .post(`/api/follow-up-tasks/${update.taskId}/updates`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send(update)
      )
    );
    
    const successful = results.filter(r => r.status === 201);
    expect(successful.length).toBeGreaterThan(95); // 95% success rate
  });
});
```

---

*This technical implementation guide provides the foundation for building a robust, scalable, and secure FFA Medical Follow-Up System that serves both educational and practical animal health management needs.*