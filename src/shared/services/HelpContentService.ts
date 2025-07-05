import { storageService } from '../../core/services/StorageService';

export interface HelpContent {
  id: string;
  category: 'student_guide' | 'educator_guide' | 'disease_reference' | 'technical_guide' | 'quick_reference';
  section: string;
  contentType: 'text' | 'video' | 'interactive' | 'checklist';
  title: string;
  content: string;
  searchableKeywords: string[];
  ageAppropriateLevel: 'elementary' | 'middle' | 'high' | 'adult';
  offlineAvailable: boolean;
  lastUpdated: Date;
  parentSection?: string;
  relatedSections?: string[];
}

export interface ContextualHelp {
  screen: string;
  userType: 'student' | 'educator' | 'admin';
  helpItems: {
    title: string;
    description: string;
    action?: 'show_guide' | 'open_reference' | 'start_tutorial';
    contentId?: string;
  }[];
}

class HelpContentService {
  private static readonly STORAGE_KEY = '@ShowTrackAI:helpContent';
  private static readonly CONTEXTUAL_HELP_KEY = '@ShowTrackAI:contextualHelp';
  private helpContent: HelpContent[] = [];
  private contextualHelp: ContextualHelp[] = [];

  async initialize(): Promise<void> {
    try {
      const stored = await storageService.loadData(HelpContentService.STORAGE_KEY);
      if (stored) {
        this.helpContent = stored;
      } else {
        await this.loadDefaultContent();
      }

      const contextual = await storageService.loadData(HelpContentService.CONTEXTUAL_HELP_KEY);
      if (contextual) {
        this.contextualHelp = contextual;
      } else {
        await this.loadDefaultContextualHelp();
      }
    } catch (error) {
      console.error('Failed to initialize help content:', error);
      await this.loadDefaultContent();
      await this.loadDefaultContextualHelp();
    }
  }

  private async loadDefaultContent(): Promise<void> {
    const defaultContent: HelpContent[] = [
      // Student Guide Content
      {
        id: 'student_getting_started',
        category: 'student_guide',
        section: 'Getting Started',
        contentType: 'text',
        title: 'Accessing the Follow-Up System',
        content: `1. Open ShowTrackAI app
2. Navigate to **Medical Records** from your dashboard
3. Select the **Follow-up** tab
4. View your pending health issues

**First Time Setup:**
• Ensure notifications are enabled for timely reminders
• Set your preferred measurement units (Imperial/Metric)
• Review your assigned animals
• Check your upcoming tasks`,
        searchableKeywords: ['getting started', 'first time', 'setup', 'notifications', 'medical records'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: 'student_task_categories',
        category: 'student_guide',
        section: 'Understanding Tasks',
        contentType: 'text',
        title: 'Task Categories',
        content: `🚨 **Urgent Follow-Up Required**
**What it means**: Immediate attention needed
• Overdue tasks
• Escalated health concerns
• Veterinary-requested monitoring

**What to do**:
1. Address these first
2. Complete updates as soon as possible
3. Contact instructor if unable to complete

📅 **Scheduled Follow-Ups**
**What it means**: Upcoming tasks within 48 hours
• Vaccination schedules
• Regular health checks
• Treatment protocols

**What to do**:
1. Plan your schedule
2. Prepare necessary supplies
3. Set reminders`,
        searchableKeywords: ['urgent', 'scheduled', 'categories', 'tasks', 'follow-up'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: 'student_photo_guidelines',
        category: 'student_guide',
        section: 'Recording Updates',
        contentType: 'checklist',
        title: 'Taking Quality Health Photos',
        content: `**Best practices for health photos:**
□ **Good Lighting**: Natural light preferred
□ **Clear Focus**: Get close enough for detail
□ **Multiple Angles**: Show different views
□ **Include Context**: Show the specific area of concern

**Photo types to capture:**
□ Overall body condition
□ Specific symptom areas
□ Treatment application
□ Progress comparisons

**Pro Tips:**
• Take photos before handling animal
• Capture same angles for comparison
• Include measurement references when possible`,
        searchableKeywords: ['photos', 'pictures', 'documentation', 'quality', 'guidelines'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: 'student_concern_levels',
        category: 'student_guide',
        section: 'Recording Updates',
        contentType: 'text',
        title: 'Setting Concern Levels',
        content: `Rate your concern (1-5):
• **1-2**: Minor concern, monitoring only
• **3**: Moderate concern, watching closely
• **4**: High concern, may need intervention
• **5**: Urgent concern, immediate help needed

**When to escalate:**
• Concern level reaches 4 or 5
• Sudden condition changes
• Emergency symptoms appear
• Unsure about next steps

**How to escalate:**
1. Use "Condition Worsening" button
2. Select "Need Guidance" option
3. Contact instructor directly
4. Call veterinarian if advised`,
        searchableKeywords: ['concern', 'levels', 'escalation', 'emergency', 'help'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
      
      // Educator Guide Content
      {
        id: 'educator_dashboard_overview',
        category: 'educator_guide',
        section: 'Dashboard Navigation',
        contentType: 'text',
        title: 'Main Dashboard Tabs',
        content: `**1. Overview Tab**
Real-time snapshot of chapter health management:
• **Urgent Cases**: Requiring immediate attention
• **Today's Follow-ups**: Scheduled student tasks
• **Recent Alerts**: System notifications
• **Chapter Metrics**: Performance indicators

**2. Students Tab**
Individual student monitoring:
• **Performance Metrics**: Response rate, quality scores
• **Active Tasks**: Current assignments
• **Recommendations**: System-generated suggestions
• **Intervention History**: Past actions taken

**3. Analytics Tab**
Data-driven insights:
• **Trend Analysis**: Common issues, resolution times
• **Competency Progress**: Standards achievement
• **Engagement Metrics**: Student participation rates
• **Predictive Insights**: Risk indicators`,
        searchableKeywords: ['dashboard', 'overview', 'navigation', 'tabs', 'metrics'],
        ageAppropriateLevel: 'adult',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: 'educator_urgent_cases',
        category: 'educator_guide',
        section: 'Managing Urgent Cases',
        contentType: 'text',
        title: 'Identifying Urgent Cases',
        content: `**Automatic Escalation Triggers:**
• Student reports concern level 4-5
• Condition marked as "worse"
• Emergency keywords detected
• Overdue by >48 hours
• Multiple missed updates

**Intervention Protocol:**

**Step 1: Assessment**
1. Review case history
2. Check last updates
3. Analyze patterns
4. Determine urgency level

**Step 2: Initial Contact**
• **Send Message**: In-app messaging
• **Schedule Call**: Video/phone meeting
• **Email Parent**: If appropriate
• **Visit Farm**: For critical cases

**Step 3: Documentation**
Record in intervention log:
• Date and time
• Contact method
• Student response
• Action plan
• Follow-up schedule`,
        searchableKeywords: ['urgent', 'escalation', 'intervention', 'contact', 'protocol'],
        ageAppropriateLevel: 'adult',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
      
      // Quick Reference Content
      {
        id: 'quick_ref_troubleshooting',
        category: 'quick_reference',
        section: 'Troubleshooting',
        contentType: 'checklist',
        title: 'Common Issues & Solutions',
        content: `**"Can't Submit Update"**
□ Check internet connection
□ Ensure all required fields completed
□ Verify at least observations entered
□ Try saving as draft first

**"Photos Won't Upload"**
□ Reduce photo quality in settings
□ Check available storage
□ Try one photo at a time
□ Clear app cache

**"Task Not Showing"**
□ Pull down to refresh
□ Check active filters
□ Verify correct animal selected
□ Contact instructor

**"App Running Slowly"**
□ Close other apps
□ Restart device
□ Clear app cache
□ Update app if available`,
        searchableKeywords: ['troubleshooting', 'problems', 'issues', 'solutions', 'help'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
      
      // Disease Reference Content
      {
        id: 'disease_ref_common_cattle',
        category: 'disease_reference',
        section: 'Common Conditions',
        contentType: 'text',
        title: 'Cattle - Respiratory Issues',
        content: `**Symptoms to Watch For:**
• Coughing or wheezing
• Nasal discharge
• Rapid or labored breathing
• Reduced appetite
• Lethargy or depression

**Photo Documentation:**
• Close-up of nasal discharge
• Side view showing breathing pattern
• Overall body condition
• Eye and ear examination

**Immediate Actions:**
1. Isolate animal if possible
2. Monitor temperature
3. Ensure adequate ventilation
4. Contact veterinarian if severe

**Prevention Tips:**
• Maintain good ventilation
• Reduce overcrowding
• Monitor weather changes
• Vaccination protocols`,
        searchableKeywords: ['cattle', 'respiratory', 'cough', 'breathing', 'pneumonia'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
        lastUpdated: new Date(),
      },
    ];

    this.helpContent = defaultContent;
    await this.saveContent();
  }

  private async loadDefaultContextualHelp(): Promise<void> {
    const defaultContextual: ContextualHelp[] = [
      {
        screen: 'PendingHealthIssuesScreen',
        userType: 'student',
        helpItems: [
          {
            title: 'Getting Started with Follow-ups',
            description: 'Learn how to navigate your health tasks',
            action: 'show_guide',
            contentId: 'student_getting_started',
          },
          {
            title: 'Understanding Task Priorities',
            description: 'Learn what urgent, scheduled, and monitoring tasks mean',
            action: 'show_guide',
            contentId: 'student_task_categories',
          },
          {
            title: 'Photo Guidelines',
            description: 'Tips for taking quality health documentation photos',
            action: 'show_guide',
            contentId: 'student_photo_guidelines',
          },
        ],
      },
      {
        screen: 'EducatorDashboardScreen',
        userType: 'educator',
        helpItems: [
          {
            title: 'Dashboard Overview',
            description: 'Understanding your educator dashboard tabs and features',
            action: 'show_guide',
            contentId: 'educator_dashboard_overview',
          },
          {
            title: 'Managing Urgent Cases',
            description: 'How to identify and respond to urgent student cases',
            action: 'show_guide',
            contentId: 'educator_urgent_cases',
          },
        ],
      },
    ];

    this.contextualHelp = defaultContextual;
    await this.saveContextualHelp();
  }

  async searchContent(query: string, category?: string, ageLevel?: string): Promise<HelpContent[]> {
    let results = this.helpContent;

    if (category) {
      results = results.filter(item => item.category === category);
    }

    if (ageLevel) {
      results = results.filter(item => item.ageAppropriateLevel === ageLevel);
    }

    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter(item =>
        item.title.toLowerCase().includes(lowercaseQuery) ||
        item.content.toLowerCase().includes(lowercaseQuery) ||
        item.searchableKeywords.some(keyword => 
          keyword.toLowerCase().includes(lowercaseQuery)
        )
      );
    }

    return results;
  }

  async getContextualHelp(screen: string, userType: 'student' | 'educator' | 'admin'): Promise<ContextualHelp | null> {
    return this.contextualHelp.find(item => 
      item.screen === screen && item.userType === userType
    ) || null;
  }

  async getContentById(id: string): Promise<HelpContent | null> {
    return this.helpContent.find(item => item.id === id) || null;
  }

  async getContentByCategory(category: string): Promise<HelpContent[]> {
    return this.helpContent.filter(item => item.category === category);
  }

  async getContentBySection(section: string): Promise<HelpContent[]> {
    return this.helpContent.filter(item => item.section === section);
  }

  async addContent(content: Omit<HelpContent, 'id' | 'lastUpdated'>): Promise<string> {
    const newContent: HelpContent = {
      ...content,
      id: `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date(),
    };

    this.helpContent.push(newContent);
    await this.saveContent();
    return newContent.id;
  }

  async updateContent(id: string, updates: Partial<HelpContent>): Promise<boolean> {
    const index = this.helpContent.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.helpContent[index] = {
      ...this.helpContent[index],
      ...updates,
      lastUpdated: new Date(),
    };

    await this.saveContent();
    return true;
  }

  async deleteContent(id: string): Promise<boolean> {
    const index = this.helpContent.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.helpContent.splice(index, 1);
    await this.saveContent();
    return true;
  }

  async getPopularContent(limit: number = 5): Promise<HelpContent[]> {
    // For now, return most recently updated content
    // In the future, this could track usage analytics
    return this.helpContent
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      .slice(0, limit);
  }

  async getRelatedContent(contentId: string): Promise<HelpContent[]> {
    const content = await this.getContentById(contentId);
    if (!content) return [];

    const related: HelpContent[] = [];

    // Add content from same section
    const sameSection = this.helpContent.filter(item => 
      item.section === content.section && item.id !== contentId
    );
    related.push(...sameSection);

    // Add explicitly related sections
    if (content.relatedSections) {
      const explicitlyRelated = this.helpContent.filter(item =>
        content.relatedSections!.includes(item.section) && item.id !== contentId
      );
      related.push(...explicitlyRelated);
    }

    // Remove duplicates and limit results
    const uniqueRelated = related.filter((item, index, array) =>
      array.findIndex(i => i.id === item.id) === index
    );

    return uniqueRelated.slice(0, 3);
  }

  private async saveContent(): Promise<void> {
    await storageService.saveData(HelpContentService.STORAGE_KEY, this.helpContent);
  }

  private async saveContextualHelp(): Promise<void> {
    await storageService.saveData(HelpContentService.CONTEXTUAL_HELP_KEY, this.contextualHelp);
  }

  async exportContent(): Promise<string> {
    return JSON.stringify({
      helpContent: this.helpContent,
      contextualHelp: this.contextualHelp,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  async importContent(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      if (data.helpContent && Array.isArray(data.helpContent)) {
        this.helpContent = data.helpContent;
        await this.saveContent();
      }
      if (data.contextualHelp && Array.isArray(data.contextualHelp)) {
        this.contextualHelp = data.contextualHelp;
        await this.saveContextualHelp();
      }
      return true;
    } catch (error) {
      console.error('Failed to import help content:', error);
      return false;
    }
  }
}

export const helpContentService = new HelpContentService();