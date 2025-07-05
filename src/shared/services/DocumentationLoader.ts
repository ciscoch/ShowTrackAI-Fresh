import { helpContentService, HelpContent } from './HelpContentService';

interface DocumentationFile {
  path: string;
  category: 'student_guide' | 'educator_guide' | 'technical_guide' | 'disease_reference' | 'quick_reference';
  ageLevel: 'elementary' | 'middle' | 'high' | 'adult';
}

class DocumentationLoader {
  private static readonly DOCS_MAPPING: DocumentationFile[] = [
    {
      path: '/docs/Student_User_Guide.md',
      category: 'student_guide',
      ageLevel: 'high',
    },
    {
      path: '/docs/Educator_Dashboard_Guide.md',
      category: 'educator_guide',
      ageLevel: 'adult',
    },
    {
      path: '/docs/Technical_Implementation_Guide.md',
      category: 'technical_guide',
      ageLevel: 'adult',
    },
    {
      path: '/docs/FFA_Medical_Follow_Up_System_Overview.md',
      category: 'technical_guide',
      ageLevel: 'adult',
    },
  ];

  static async loadDocumentationFromDocs(): Promise<void> {
    console.log('Loading documentation from /docs/ directory...');
    
    await helpContentService.initialize();

    // Load and parse comprehensive student guide content
    await this.loadStudentGuideContent();
    
    // Load and parse educator guide content
    await this.loadEducatorGuideContent();
    
    // Load disease reference content
    await this.loadDiseaseReferenceContent();
    
    // Load quick reference content
    await this.loadQuickReferenceContent();

    console.log('Documentation loading completed');
  }

  private static async loadStudentGuideContent(): Promise<void> {
    const studentContent: Omit<HelpContent, 'id' | 'lastUpdated'>[] = [
      {
        category: 'student_guide',
        section: 'Getting Started',
        contentType: 'text',
        title: 'Understanding Your Dashboard',
        content: `## 📊 Understanding Your Dashboard

### Task Categories

#### 🚨 Urgent Follow-Up Required
**What it means**: Immediate attention needed
- Overdue tasks
- Escalated health concerns  
- Veterinary-requested monitoring

**What to do**:
1. Address these first
2. Complete updates as soon as possible
3. Contact instructor if unable to complete

#### 📅 Scheduled Follow-Ups
**What it means**: Upcoming tasks within 48 hours
- Vaccination schedules
- Regular health checks
- Treatment protocols

**What to do**:
1. Plan your schedule
2. Prepare necessary supplies
3. Set reminders

#### 🔍 Monitoring Cases
**What it means**: Ongoing observation tasks
- Recovery tracking
- Preventive monitoring
- Long-term conditions

**What to do**:
1. Regular daily checks
2. Document any changes
3. Track progress over time`,
        searchableKeywords: ['dashboard', 'urgent', 'scheduled', 'monitoring', 'tasks', 'categories'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
      {
        category: 'student_guide',
        section: 'Recording Updates',
        contentType: 'checklist',
        title: 'Quick Update Process',
        content: `## 📝 Recording Updates

### Step 1: Assess Condition
Select the current condition:
□ **Improved**: Positive changes observed
□ **Same**: No significant change
□ **Worse**: Deterioration noted
□ **Resolved**: Issue appears fixed

### Step 2: Record Measurements
Enter relevant data:
□ **Temperature**: Use decimal format (e.g., 101.5°F)
□ **Weight**: If applicable
□ **Heart Rate**: Beats per minute
□ **Respiratory Rate**: Breaths per minute

### Step 3: Document Observations
Write detailed notes about:
□ Physical appearance
□ Behavior changes
□ Appetite and water intake
□ Movement and activity level
□ Any unusual symptoms

### Step 4: Capture Photos
Best practices for health photos:
□ **Good Lighting**: Natural light preferred
□ **Clear Focus**: Get close enough for detail
□ **Multiple Angles**: Show different views
□ **Include Context**: Show the specific area of concern

### Step 5: Set Concern Level
Rate your concern (1-5):
□ **1-2**: Minor concern, monitoring only
□ **3**: Moderate concern, watching closely
□ **4**: High concern, may need intervention
□ **5**: Urgent concern, immediate help needed`,
        searchableKeywords: ['updates', 'recording', 'observations', 'photos', 'measurements', 'concern'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
      {
        category: 'student_guide',
        section: 'Photo Guidelines',
        contentType: 'checklist',
        title: 'Taking Quality Health Photos',
        content: `## 📸 Taking Quality Health Photos

### Essential Photo Types
□ **Overall body condition**
□ **Specific symptom areas**
□ **Treatment application**
□ **Progress comparisons**

### Photography Best Practices
□ **Use natural lighting** when possible
□ **Keep camera steady** for clear focus
□ **Take multiple angles** to show different views
□ **Include size reference** when helpful
□ **Capture before handling** animal when possible
□ **Use same angles** for progress comparisons
□ **Include measurement references** for scale

### What Makes a Good Health Photo
✅ **Clear and in focus**
✅ **Good lighting (natural preferred)**
✅ **Shows the area of concern clearly**
✅ **Includes surrounding context**
✅ **Multiple angles when needed**

### What to Avoid
❌ **Blurry or dark photos**
❌ **Photos taken too far away**
❌ **Poor lighting conditions**
❌ **Missing the area of concern**
❌ **Only one angle for complex issues**

### Pro Tips
💡 **Take photos at the same time each day** for consistency
💡 **Use the grid feature** on your camera for better composition
💡 **Clean the camera lens** before important documentation
💡 **Take extra photos** - you can always delete extras later`,
        searchableKeywords: ['photos', 'photography', 'documentation', 'camera', 'lighting', 'quality'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
      {
        category: 'student_guide',
        section: 'Completing Tasks',
        contentType: 'text',
        title: 'When and How to Complete Tasks',
        content: `## ✅ Completing Tasks

### When to Complete a Task
- Monitoring period has ended
- Condition is resolved
- Veterinarian approves completion
- Instructor indicates completion

### Completion Process

#### 1. Select Resolution Status
- **Resolved**: Problem completely fixed
- **Improved**: Significant progress, minimal concern
- **Referred**: Veterinary care taking over
- **Ongoing**: Requires continued monitoring

#### 2. Write Final Assessment
Include:
- Summary of the case progression
- Final animal condition
- Treatment effectiveness
- Lessons learned

#### 3. Learning Reflection
Answer reflectively:
- What did you learn from this experience?
- How will this help in future situations?
- What would you do differently?
- What skills did you develop?

#### 4. Review Competencies
Confirm which standards you demonstrated:
- AS.07.01.02.a - Health monitoring
- AS.07.02.01.b - Data collection
- AS.07.03.01.a - Intervention protocols

### Tips for Quality Completion
- Be thorough in your final assessment
- Include specific examples from your monitoring
- Connect to your learning objectives
- Ask questions if unsure about competency achievement`,
        searchableKeywords: ['completing', 'resolution', 'assessment', 'reflection', 'competencies', 'learning'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
    ];

    for (const content of studentContent) {
      await helpContentService.addContent(content);
    }
  }

  private static async loadEducatorGuideContent(): Promise<void> {
    const educatorContent: Omit<HelpContent, 'id' | 'lastUpdated'>[] = [
      {
        category: 'educator_guide',
        section: 'Dashboard Overview',
        contentType: 'text',
        title: 'Understanding Educator Dashboard Tabs',
        content: `## 📊 Educator Dashboard Navigation

### Overview Tab
Real-time snapshot of chapter health management:
- **Urgent Cases**: Requiring immediate attention
- **Today's Follow-ups**: Scheduled student tasks
- **Recent Alerts**: System notifications
- **Chapter Metrics**: Performance indicators

### Students Tab
Individual student monitoring:
- **Performance Metrics**: Response rate, quality scores
- **Active Tasks**: Current assignments
- **Recommendations**: System-generated suggestions
- **Intervention History**: Past actions taken

### Analytics Tab
Data-driven insights:
- **Trend Analysis**: Common issues, resolution times
- **Competency Progress**: Standards achievement
- **Engagement Metrics**: Student participation rates
- **Predictive Insights**: Risk indicators

### Key Performance Indicators

**Response Rate**
- Percentage of on-time updates
- Target: >80%
- Below 60%: Intervention needed

**Update Quality**
- Completeness score average
- Based on: observations, photos, measurements
- Target: >70%

**Competency Progress**
- Standards achievement tracking
- Skill development indicators
- Portfolio readiness`,
        searchableKeywords: ['dashboard', 'overview', 'metrics', 'performance', 'students', 'analytics'],
        ageAppropriateLevel: 'adult',
        offlineAvailable: true,
      },
      {
        category: 'educator_guide',
        section: 'Managing Urgent Cases',
        contentType: 'text',
        title: 'Urgent Case Response Protocol',
        content: `## 🚨 Managing Urgent Cases

### Automatic Escalation Triggers
- Student reports concern level 4-5
- Condition marked as "worse"
- Emergency keywords detected
- Overdue by >48 hours
- Multiple missed updates

### Intervention Protocol

#### Step 1: Assessment
1. Review case history
2. Check last updates
3. Analyze patterns
4. Determine urgency level

#### Step 2: Initial Contact
**Quick Actions**:
- **Send Message**: In-app messaging
- **Schedule Call**: Video/phone meeting
- **Email Parent**: If appropriate
- **Visit Farm**: For critical cases

#### Step 3: Documentation
Record in intervention log:
- Date and time
- Contact method
- Student response
- Action plan
- Follow-up schedule

### Communication Templates

#### Reminder Message
"Hi [Student], Just checking in on [Animal]'s health monitoring. Your last update was [X] days ago. Need any help or have questions? - [Instructor]"

#### Concern Message
"[Student], I noticed [specific concern]. Let's discuss the best approach for [Animal]'s care. Available times: [options] - [Instructor]"

#### Praise Message
"Great job on the detailed observations for [Animal]! Your documentation quality has really improved. Keep it up! - [Instructor]"`,
        searchableKeywords: ['urgent', 'escalation', 'intervention', 'contact', 'emergency', 'communication'],
        ageAppropriateLevel: 'adult',
        offlineAvailable: true,
      },
      {
        category: 'educator_guide',
        section: 'Student Management',
        contentType: 'text',
        title: 'Effective Student Monitoring Strategies',
        content: `## 👥 Student Management

### Tiered Intervention Approach

#### Tier 1: Reminder (Automated)
- System-generated notifications
- Gentle nudges
- Positive reinforcement

#### Tier 2: Personal Contact
- Direct message
- Quick check-in
- Offer support
- Clarify expectations

#### Tier 3: Structured Support
- Scheduled meeting
- Skill review
- Buddy system
- Modified timeline

#### Tier 4: Formal Intervention
- Parent conference
- Action plan development
- Additional resources
- Progress monitoring

### Daily Workflow

#### Morning (15 minutes)
1. Check urgent cases
2. Review overnight alerts
3. Plan interventions
4. Send encouragements

#### Midday (10 minutes)
1. Monitor active tasks
2. Respond to questions
3. Quick check-ins
4. Document actions

#### Evening (20 minutes)
1. Review day's updates
2. Analyze quality
3. Plan tomorrow
4. Update records

### Creating Learning Moments
- Use real cases for lessons
- Share success stories
- Analyze failures constructively
- Connect to career paths`,
        searchableKeywords: ['students', 'intervention', 'monitoring', 'management', 'workflow', 'learning'],
        ageAppropriateLevel: 'adult',
        offlineAvailable: true,
      },
    ];

    for (const content of educatorContent) {
      await helpContentService.addContent(content);
    }
  }

  private static async loadDiseaseReferenceContent(): Promise<void> {
    const diseaseContent: Omit<HelpContent, 'id' | 'lastUpdated'>[] = [
      {
        category: 'disease_reference',
        section: 'Cattle Health',
        contentType: 'text',
        title: 'Respiratory Issues in Cattle',
        content: `## 🐄 Cattle - Respiratory Issues

### Symptoms to Watch For
- Coughing or wheezing
- Nasal discharge (clear, cloudy, or colored)
- Rapid or labored breathing
- Reduced appetite
- Lethargy or depression
- Fever (normal: 100.4-102.8°F)

### Photo Documentation Needed
- Close-up of nasal discharge
- Side view showing breathing pattern
- Overall body condition
- Eye and ear examination
- Comparison with healthy animals

### Immediate Actions
1. **Isolate animal** if possible to prevent spread
2. **Monitor temperature** every 12 hours
3. **Ensure adequate ventilation** in housing
4. **Provide fresh water** and quality feed
5. **Contact veterinarian** if symptoms worsen

### Prevention Tips
- Maintain good ventilation in barns
- Reduce overcrowding
- Monitor weather changes (stress factor)
- Follow vaccination protocols
- Quarantine new animals

### When to Escalate
- Temperature >103°F
- Difficulty breathing
- Loss of appetite >24 hours
- Discharge becomes thick/colored
- Multiple animals affected`,
        searchableKeywords: ['cattle', 'respiratory', 'cough', 'breathing', 'pneumonia', 'fever'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
      {
        category: 'disease_reference',
        section: 'Cattle Health',
        contentType: 'text',
        title: 'Lameness in Cattle',
        content: `## 🐄 Cattle - Lameness Issues

### Symptoms to Watch For
- Limping or favoring one leg
- Reluctance to move or stand
- Swelling in legs or hooves
- Heat in affected area
- Changes in gait or posture
- Reduced weight bearing

### Photo Documentation Needed
- All four feet from different angles
- Close-up of affected hoof/leg
- Standing posture from side
- Walking gait if possible
- Comparison with normal feet

### Immediate Actions
1. **Examine the foot** carefully for foreign objects
2. **Check for swelling** or heat
3. **Limit movement** to reduce further injury
4. **Provide soft, dry bedding**
5. **Monitor for improvement** over 24-48 hours

### Common Causes
- Foot rot or abscess
- Foreign objects (stones, nails)
- Overgrown hooves
- Poor footing conditions
- Nutritional deficiencies

### Prevention Strategies
- Regular hoof trimming
- Maintain clean, dry facilities
- Provide proper nutrition
- Use footbaths if recommended
- Remove hazards from pathways

### When to Call Vet
- No improvement in 48 hours
- Severe swelling or heat
- Animal won't bear weight
- Multiple animals affected
- Signs of infection`,
        searchableKeywords: ['cattle', 'lameness', 'feet', 'hooves', 'limping', 'foot rot'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
    ];

    for (const content of diseaseContent) {
      await helpContentService.addContent(content);
    }
  }

  private static async loadQuickReferenceContent(): Promise<void> {
    const quickRefContent: Omit<HelpContent, 'id' | 'lastUpdated'>[] = [
      {
        category: 'quick_reference',
        section: 'Emergency Contacts',
        contentType: 'checklist',
        title: 'Emergency Response Quick Reference',
        content: `## 🚨 Emergency Response Guide

### Immediate Emergency Actions
□ **Ensure safety** of yourself and others first
□ **Assess the situation** quickly but thoroughly
□ **Contact appropriate help** immediately
□ **Document everything** as it happens
□ **Follow up** with instructor/veterinarian

### Emergency Contact Hierarchy
1. **Life-threatening emergency**: Call 911
2. **Veterinary emergency**: Call farm veterinarian
3. **Instructor notification**: Text/call instructor
4. **Parent notification**: If student under 18

### Vital Signs Reference (Cattle)
- **Temperature**: 100.4-102.8°F (38-39.3°C)
- **Heart Rate**: 48-84 beats per minute
- **Respiratory Rate**: 26-50 breaths per minute
- **Rumen Contractions**: 1-3 per 2 minutes

### Critical Symptoms Requiring Immediate Vet Call
□ Difficulty breathing or choking
□ Severe bleeding that won't stop
□ Temperature >104°F or <99°F
□ Animal down and unable to rise
□ Bloat or severe abdominal distension
□ Seizures or neurological signs
□ Suspected poisoning
□ Severe trauma or wounds

### Documentation During Emergency
□ Time of discovery
□ Initial condition/symptoms
□ Actions taken
□ Response to treatment
□ Veterinarian recommendations
□ Follow-up plan`,
        searchableKeywords: ['emergency', 'contacts', 'vital signs', 'symptoms', 'veterinarian', 'crisis'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
      {
        category: 'quick_reference',
        section: 'Common Measurements',
        contentType: 'checklist',
        title: 'Measurement and Assessment Guide',
        content: `## 📏 Measurement Quick Reference

### Taking Temperature
□ **Use digital thermometer** designed for livestock
□ **Lubricate thermometer** with petroleum jelly
□ **Insert 2-3 inches** into rectum
□ **Hold firmly** for 60 seconds minimum
□ **Clean and disinfect** after each use

### Body Condition Scoring (1-5 scale)
- **1**: Emaciated - bones clearly visible
- **2**: Thin - some fat cover over ribs
- **3**: Average - ribs felt with pressure
- **4**: Fat - ribs difficult to feel
- **5**: Obese - ribs cannot be felt

### Heart Rate Assessment
□ **Place hand** on left side behind elbow
□ **Count beats** for 15 seconds
□ **Multiply by 4** for per-minute rate
□ **Normal range**: 48-84 bpm for cattle

### Respiratory Rate
□ **Watch chest movements** from side
□ **Count breaths** for 15 seconds  
□ **Multiply by 4** for per-minute rate
□ **Normal range**: 26-50 breaths/minute

### Photo Documentation Standards
□ **Overall body condition** - full side view
□ **Specific concern area** - close-up detail
□ **Comparative view** - before/after or normal vs abnormal
□ **Environmental context** - housing, feed, water
□ **Date/time stamp** - for progress tracking`,
        searchableKeywords: ['measurements', 'temperature', 'heart rate', 'respiratory', 'body condition', 'assessment'],
        ageAppropriateLevel: 'high',
        offlineAvailable: true,
      },
    ];

    for (const content of quickRefContent) {
      await helpContentService.addContent(content);
    }
  }

  static async importDocumentationFromJSON(jsonContent: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonContent);
      
      if (data.helpContent && Array.isArray(data.helpContent)) {
        await helpContentService.initialize();
        
        for (const contentItem of data.helpContent) {
          try {
            await helpContentService.addContent({
              category: contentItem.category,
              section: contentItem.section,
              contentType: contentItem.contentType,
              title: contentItem.title,
              content: contentItem.content,
              searchableKeywords: contentItem.searchableKeywords || [],
              ageAppropriateLevel: contentItem.ageAppropriateLevel || 'high',
              offlineAvailable: contentItem.offlineAvailable !== false,
              parentSection: contentItem.parentSection,
              relatedSections: contentItem.relatedSections,
            });
          } catch (error) {
            console.error('Failed to import content item:', contentItem.title, error);
          }
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import documentation from JSON:', error);
      return false;
    }
  }

  static async exportAllDocumentation(): Promise<string> {
    await helpContentService.initialize();
    return await helpContentService.exportContent();
  }
}

export { DocumentationLoader };