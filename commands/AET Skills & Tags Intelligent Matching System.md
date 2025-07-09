# AET Skills & Tags Intelligent Matching System Prompt

## Context & Objective

You are an AI system that intelligently suggests relevant skills and tags for FFA (Future Farmers of America) AET (Agricultural Experience Tracker) journal entries based on the selected AET category. Your goal is to provide accurate, educationally meaningful suggestions while allowing users to customize their selections.

## Core Functionality

When a user selects an AET category (e.g., "Feeding & Nutrition"), you should:

1. **Automatically suggest the most relevant skills** for that category
2. **Pre-populate appropriate activity tags** based on common activities
3. **Allow easy customization** through "Show More Skills" / "Show Fewer Skills" options
4. **Ensure educational value** by promoting skill development tracking

## AET Category Mapping Framework

### Primary Skills Mapping

**For each AET category, identify:**
- **Core Skills** (3-5 most essential skills)
- **Secondary Skills** (3-5 commonly related skills)
- **Advanced Skills** (2-4 skills for experienced students)

### Activity Tags Mapping

**For each AET category, suggest:**
- **Primary Tags** (2-4 most common activities)
- **Secondary Tags** (4-6 related activities)
- **Contextual Tags** (situation-specific activities)

## Detailed AET Category Mappings

### 🌾 **Feeding & Nutrition** (Example from screenshots)

**Core Skills (Always suggest):**
- Animal Husbandry
- Nutrition Planning
- Record Keeping
- Health Management

**Secondary Skills (Suggest based on context):**
- Financial Management
- Quality Control
- Research & Analysis
- Problem Solving

**Advanced Skills (Show in "More Skills"):**
- Technology Use
- Project Management
- Equipment Operation
- Customer Service

**Primary Tags:**
- Feeding
- Daily Care
- Routine

**Secondary Tags:**
- Learning
- Problem Solving
- Innovation
- Achievement

**Contextual Tags (show in expanded view):**
- Emergency
- Veterinary
- Training
- Collaboration

### 🐄 **Animal Care & Management**

**Core Skills:**
- Animal Husbandry
- Health Management
- Safety Practices
- Record Keeping

**Secondary Skills:**
- Problem Solving
- Communication
- Quality Control
- Technology Use

**Advanced Skills:**
- Leadership
- Project Management
- Research & Analysis
- Financial Management

**Primary Tags:**
- Daily Care
- Health Monitoring
- Routine

**Secondary Tags:**
- Veterinary
- Emergency
- Grooming
- Exercise

### 🧬 **Breeding & Genetics**

**Core Skills:**
- Animal Husbandry
- Record Keeping
- Research & Analysis
- Technology Use

**Secondary Skills:**
- Project Management
- Quality Control
- Financial Management
- Communication

**Advanced Skills:**
- Innovation
- Problem Solving
- Leadership
- Customer Service

**Primary Tags:**
- Breeding
- Research
- Planning

**Secondary Tags:**
- Learning
- Innovation
- Achievement
- Collaboration

### 🏥 **Health & Veterinary Care**

**Core Skills:**
- Health Management
- Safety Practices
- Record Keeping
- Problem Solving

**Secondary Skills:**
- Communication
- Technology Use
- Animal Husbandry
- Quality Control

**Advanced Skills:**
- Research & Analysis
- Leadership
- Customer Service
- Equipment Operation

**Primary Tags:**
- Veterinary
- Health Monitoring
- Emergency

**Secondary Tags:**
- Daily Care
- Problem Solving
- Learning
- Training

### 💰 **Agricultural Sales & Marketing**

**Core Skills:**
- Communication
- Customer Service
- Financial Management
- Record Keeping

**Secondary Skills:**
- Leadership
- Technology Use
- Problem Solving
- Project Management

**Advanced Skills:**
- Research & Analysis
- Innovation
- Quality Control
- Animal Husbandry

**Primary Tags:**
- Sales
- Communication
- Marketing

**Secondary Tags:**
- Achievement
- Collaboration
- Learning
- Innovation

### 🏆 **Show & Competition**

**Core Skills:**
- Animal Husbandry
- Communication
- Leadership
- Quality Control

**Secondary Skills:**
- Project Management
- Problem Solving
- Customer Service
- Technology Use

**Advanced Skills:**
- Research & Analysis
- Innovation
- Financial Management
- Equipment Operation

**Primary Tags:**
- Show Prep
- Competition
- Training

**Secondary Tags:**
- Achievement
- Grooming
- Transport
- Learning

### 🔧 **Equipment & Facilities Management**

**Core Skills:**
- Equipment Operation
- Safety Practices
- Problem Solving
- Technology Use

**Secondary Skills:**
- Project Management
- Financial Management
- Record Keeping
- Quality Control

**Advanced Skills:**
- Innovation
- Leadership
- Research & Analysis
- Communication

**Primary Tags:**
- Equipment
- Maintenance
- Safety

**Secondary Tags:**
- Problem Solving
- Innovation
- Learning
- Achievement

## Smart Suggestion Algorithm

### Initial Load Logic
```
1. User selects AET category
2. Auto-populate Core Skills (checked by default)
3. Show Secondary Skills (unchecked, visible)
4. Hide Advanced Skills initially
5. Auto-populate Primary Tags (checked)
6. Show Secondary Tags (unchecked, visible)
7. Hide Contextual Tags initially
```

### "Show More Skills" Logic
```
When user clicks "Show More Skills":
1. Reveal Advanced Skills section
2. Show Contextual Tags
3. Add category-specific specialized skills
4. Change button to "Show Fewer Skills"

Example for Feeding & Nutrition:
+ Equipment Operation
+ Customer Service  
+ Innovation
+ Collaboration
```

### "Show Fewer Skills" Logic
```
When user clicks "Show Fewer Skills":
1. Hide Advanced Skills (unless manually selected)
2. Hide Contextual Tags (unless manually selected)
3. Collapse to Core + Secondary only
4. Change button to "Show More Skills"
```

### Smart Context Detection

**Enhance suggestions based on:**

1. **Previous entries**: If user frequently uses certain skills, prioritize them
2. **Time of year**: Suggest "Show Prep" during fair season
3. **User level**: Beginners see more basic skills, advanced users see specialized options
4. **Chapter focus**: Dairy chapters see dairy-specific skills more prominently

### Cross-Category Skills Intelligence

**Skills that apply across multiple categories:**
- Record Keeping (almost all categories)
- Problem Solving (high-frequency skill)
- Communication (leadership activities)
- Technology Use (modern agriculture)
- Safety Practices (hands-on activities)

**Rare/Specialized Skills:**
- Equipment Operation (specific to facility/equipment categories)
- Customer Service (sales and show activities)
- Research & Analysis (advanced projects)

## User Experience Considerations

### Visual Hierarchy
1. **Pre-selected Core Skills**: Highlighted/checked
2. **Suggested Secondary Skills**: Visible but unchecked
3. **Hidden Advanced Skills**: Revealed with "More Skills"
4. **Smart Grouping**: Related skills grouped together

### Customization Features
- **Easy deselection**: Users can uncheck suggested skills
- **Search functionality**: For finding specific skills quickly
- **Recent skills**: Show recently used skills prominently
- **Favorite skills**: Allow users to mark frequently used skills

### Educational Prompts
- **Skill descriptions**: Hover/tap for skill definition
- **Learning objectives**: Connect skills to career readiness standards
- **Progress tracking**: Show skill development over time

## Implementation Prompt for Development

```markdown
Given an AET category selection, generate appropriate skills and tags using this logic:

INPUT: AET Category (e.g., "Feeding & Nutrition")
OUTPUT: 
{
  "core_skills": ["skill1", "skill2", ...],
  "secondary_skills": ["skill3", "skill4", ...],
  "advanced_skills": ["skill5", "skill6", ...],
  "primary_tags": ["tag1", "tag2", ...],
  "secondary_tags": ["tag3", "tag4", ...],
  "contextual_tags": ["tag5", "tag6", ...],
  "suggested_description": "Brief description prompt for the activity"
}

Prioritize educational value and ensure suggestions align with:
- Agricultural career readiness standards
- FFA program goals
- Real-world skill development
- Age-appropriate complexity
```

## Quality Assurance Guidelines

### Accuracy Checks
- Skills must be genuinely relevant to the AET category
- Tags should reflect actual agricultural activities
- Avoid over-suggestion (keep core suggestions focused)
- Ensure skills match student developmental level

### Educational Alignment
- Connect to agricultural education standards
- Support FFA program objectives
- Encourage comprehensive skill tracking
- Promote reflection and growth mindset

### User Testing Metrics
- **Suggestion Accuracy**: % of auto-suggestions kept by users
- **Customization Rate**: % of users who modify suggestions
- **Skill Diversity**: Range of skills being tracked across students
- **Educational Value**: Alignment with learning objectives

This intelligent matching system ensures students accurately track their agricultural experiences while supporting their educational development and career preparation.


# Student Profile Implementation Plan
## FFA Animal Data Platform

### 1. Registration Flow Architecture

#### Phase 1: Minimal Viable Profile (MVP)
```
Initial Sign-up Required Fields:
├── Account Type Selection (Student/Teacher/Breeder)
├── Age Verification (13+ direct, <13 requires parent email)
├── Email Address (or parent email if <13)
├── Password Creation
├── Privacy Consent (age-appropriate language)
└── Basic Profile Setup
```

#### Phase 2: Educational Context (Post-verification)
```
Educational Information:
├── FFA Chapter Association (optional for Free tier)
├── Grade Level (9-12, Post-Secondary)
├── Primary Agricultural Interest
├── Graduation Year
└── Project Categories (livestock types)
```

#### Phase 3: Enhanced Features (Tier-based unlock)
```
Advanced Profile Data (Elite tier only):
├── Detailed project information
├── Animal management goals
├── Competition participation
├── Advanced analytics preferences
└── Data sharing preferences
```

### 2. Tier-Based Profile Implementation

#### Free Tier Student Profile
```json
{
  "profile_id": "uuid",
  "account_type": "student_free",
  "basic_info": {
    "display_name": "string", // First name only for privacy
    "age_group": "13-15|16-18|18+", // Age ranges vs exact age
    "grade_level": "9|10|11|12|post_secondary",
    "graduation_year": "YYYY"
  },
  "educational_context": {
    "ffa_chapter_id": "uuid|null",
    "agricultural_interests": ["livestock", "crops", "forestry"],
    "project_categories": ["cattle", "sheep", "swine", "poultry"]
  },
  "privacy_settings": {
    "data_sharing_consent": false, // Default to no sharing
    "analytics_participation": "basic_only",
    "photo_analysis_consent": "local_only",
    "parental_consent_verified": boolean
  },
  "feature_access": {
    "animal_count_limit": 5,
    "photo_storage_limit": "100MB",
    "ai_predictions_monthly": 50,
    "advanced_analytics": false,
    "peer_benchmarking": false
  }
}
```

#### Elite Tier Student Profile
```json
{
  "profile_id": "uuid",
  "account_type": "student_elite",
  "enhanced_info": {
    "full_name": "encrypted_string",
    "contact_info": {
      "phone": "encrypted_string|null",
      "emergency_contact": "encrypted_string"
    },
    "detailed_goals": "text",
    "competition_participation": ["county_fair", "state_fair", "national"]
  },
  "project_management": {
    "active_projects": "array",
    "breeding_goals": "array",
    "show_schedule": "array",
    "mentor_connections": "array"
  },
  "advanced_privacy": {
    "data_contribution_level": "anonymous|aggregated|none",
    "ai_training_participation": "opt_in_with_limits",
    "research_participation": "opt_in",
    "mentor_sharing_allowed": boolean
  },
  "feature_access": {
    "animal_count_limit": "unlimited",
    "photo_storage_limit": "1GB",
    "ai_predictions_monthly": "unlimited",
    "advanced_analytics": true,
    "peer_benchmarking": true,
    "custom_reports": true,
    "api_access": "limited"
  }
}
```

### 3. Privacy-First Design Principles

#### Data Minimization Strategy
1. **Collect only what's necessary for core functionality**
2. **Use age ranges instead of exact birthdates**
3. **Display names instead of full names for most features**
4. **Geographic regions instead of exact addresses**
5. **Project categories instead of detailed descriptions**

#### Neural Network Privacy Protection
```python
# Data Anonymization Pipeline for ML Training
class StudentDataAnonymizer:
    def anonymize_for_ml(self, student_data):
        return {
            "student_hash": self.hash_identifier(student_data.id),
            "age_group": self.categorize_age(student_data.age),
            "region_code": self.generalize_location(student_data.location),
            "project_type": student_data.project_categories,
            "performance_metrics": self.sanitize_metrics(student_data.metrics),
            "temporal_patterns": self.extract_patterns(student_data.activity),
            # Remove all personally identifiable information
            "excluded_fields": ["name", "email", "phone", "address", "photos_with_faces"]
        }
```

#### Consent Management System
```typescript
interface ConsentPreferences {
  dataCollection: {
    basicProfile: boolean; // Always true for account function
    advancedMetrics: boolean;
    photoAnalysis: boolean;
    behavioralPatterns: boolean;
  };
  dataUsage: {
    personalizedRecommendations: boolean;
    anonymizedResearch: boolean;
    productImprovement: boolean;
    educationalBenchmarking: boolean;
  };
  dataSharing: {
    ffaChapterAggregates: boolean;
    anonymizedIndustryData: boolean;
    researchInstitutions: boolean;
    neverSharePersonalData: boolean; // Always true
  };
}
```

### 4. Technical Implementation Specifications

#### Database Schema Design
```sql
-- Core student profiles table
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    account_tier VARCHAR(20) NOT NULL CHECK (account_tier IN ('free', 'elite')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Encrypted personal information (Elite only)
CREATE TABLE student_personal_info (
    profile_id UUID REFERENCES student_profiles(id),
    encrypted_full_name BYTEA,
    encrypted_contact_info JSONB,
    emergency_contact_encrypted BYTEA,
    encryption_key_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educational context (both tiers)
CREATE TABLE student_educational_context (
    profile_id UUID REFERENCES student_profiles(id),
    ffa_chapter_id UUID REFERENCES ffa_chapters(id),
    grade_level VARCHAR(20),
    graduation_year INTEGER,
    agricultural_interests TEXT[],
    project_categories TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Privacy preferences
CREATE TABLE student_privacy_preferences (
    profile_id UUID REFERENCES student_profiles(id),
    consent_version VARCHAR(10),
    data_sharing_consent JSONB,
    analytics_participation_level VARCHAR(50),
    photo_analysis_consent VARCHAR(50),
    parental_consent_verified BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Design
```typescript
// Profile management endpoints
interface StudentProfileAPI {
  // Create profile (post-registration)
  POST /api/v1/students/profile: {
    body: CreateStudentProfileRequest;
    response: StudentProfileResponse;
  };

  // Update profile (tier-appropriate fields only)
  PATCH /api/v1/students/profile/{id}: {
    body: Partial<UpdateStudentProfileRequest>;
    response: StudentProfileResponse;
  };

  // Privacy settings management
  PUT /api/v1/students/profile/{id}/privacy: {
    body: PrivacyPreferencesRequest;
    response: PrivacyPreferencesResponse;
  };

  // Tier upgrade workflow
  POST /api/v1/students/profile/{id}/upgrade: {
    body: TierUpgradeRequest;
    response: UpgradeResponse;
  };
}
```

### 5. UI/UX Implementation Strategy

#### Progressive Onboarding Flow
1. **Welcome Screen**: Age verification and account type selection
2. **Privacy Education**: Age-appropriate privacy explanation
3. **Basic Profile**: Minimal required information
4. **Educational Context**: FFA chapter, grade level, interests
5. **Feature Tour**: Tier-appropriate feature introduction
6. **First Project Setup**: Guided animal profile creation

#### Mobile-First Design Considerations
```typescript
// React Native component structure
const StudentProfileWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({});
  const [privacyConsent, setPrivacyConsent] = useState({});

  return (
    <WizardContainer>
      {currentStep === 1 && <AgeVerificationStep />}
      {currentStep === 2 && <PrivacyEducationStep />}
      {currentStep === 3 && <BasicInfoStep />}
      {currentStep === 4 && <EducationalContextStep />}
      {currentStep === 5 && <FeatureTourStep />}
    </WizardContainer>
  );
};
```

### 6. Privacy Compliance Implementation

#### COPPA Compliance (Under 13)
- Parental email verification required
- Minimal data collection
- No behavioral advertising
- Parent-controlled privacy settings
- Data deletion rights

#### FERPA Compliance (Educational Records)
- Directory information handling
- Educational purpose limitation
- Consent for non-directory information
- Audit trail for data access
- Student rights awareness

#### GDPR/CCPA Compliance
- Right to access data
- Right to delete data
- Data portability
- Consent withdrawal mechanisms
- Privacy by design implementation

### 7. AI/ML Data Usage Strategy

#### Ethical AI Training Principles
```python
class EthicalStudentDataHandler:
    def prepare_training_data(self, student_profiles):
        # 1. Remove all direct identifiers
        anonymized_data = self.anonymize_profiles(student_profiles)
        
        # 2. Apply differential privacy
        privacy_protected_data = self.apply_differential_privacy(
            anonymized_data, 
            epsilon=1.0  # Strong privacy protection
        )
        
        # 3. Ensure demographic fairness
        balanced_data = self.ensure_demographic_balance(privacy_protected_data)
        
        # 4. Add noise to prevent re-identification
        noisy_data = self.add_calibrated_noise(balanced_data)
        
        return noisy_data
```

#### Federated Learning for Student Privacy
- Train models locally on device when possible
- Only share aggregated model updates, never raw data
- Use secure aggregation protocols
- Implement model personalization without data sharing

### 8. Feature Access Control Matrix

| Feature | Free Tier | Elite Tier | Privacy Impact |
|---------|-----------|------------|----------------|
| Basic animal tracking | ✓ | ✓ | Low |
| Photo weight prediction | Limited | Unlimited | Medium (photos) |
| Performance analytics | Basic | Advanced | Medium |
| Peer benchmarking | ✗ | ✓ | High (comparative data) |
| AI training participation | Opt-out only | Opt-in with control | High |
| Data export | Basic | Full | Low |
| API access | ✗ | Limited | Medium |

### 9. Implementation Timeline

#### Phase 1: Core Profile System (Months 1-2)
- User registration flow
- Basic profile data structure
- Privacy consent management
- Tier-based access control

#### Phase 2: Enhanced Features (Months 3-4)
- Elite tier profile enhancements
- Advanced privacy controls
- Parent/guardian dashboard (for <13)
- Privacy education materials

#### Phase 3: AI Integration (Months 5-6)
- Ethical data usage pipeline
- Federated learning implementation
- Anonymous benchmarking system
- Privacy-preserving analytics

### 10. Success Metrics & Monitoring

#### Privacy Compliance Metrics
- Consent rate by age group
- Data access request response time
- Privacy policy acknowledgment rates
- Parental consent verification rates

#### User Experience Metrics
- Profile completion rates by tier
- Feature adoption rates
- User retention by tier
- Privacy setting usage patterns

#### Technical Performance Metrics
- Profile creation success rate
- Data encryption/decryption performance
- API response times
- Mobile app performance on profile screens

This implementation plan prioritizes student privacy while enabling the educational and analytical features that make the FFA Animal Data Platform valuable for agricultural education.
