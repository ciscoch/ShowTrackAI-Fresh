# FFA Animal Health Records & Disease Management Tool
## Integration Prompt for AET Journal Platform

---

## 🏥 **System Overview & Integration Requirements**

### **Core Functionality Specifications**
Design a comprehensive health records management system that seamlessly integrates with the Agricultural Education Technology (AET) journal platform, enabling FFA students, educators, and livestock professionals to track, document, and analyze animal health data with AI-powered insights and educational support.

### **Primary Integration Points**
- **AET Journal Sync**: Bidirectional data flow with existing journal entries
- **Animal Profile Integration**: Link health records to individual animal profiles
- **Timeline Correlation**: Connect health events with feeding, weight, and environmental data
- **Educational Module**: Integrate with FFA curriculum and learning objectives
- **Reporting System**: Generate health reports for veterinarians, teachers, and competitions

---

## 📱 **User Interface & Experience Design**

### **Mobile-First Health Recording Interface**
```
┌─────────────────────────────────────────────────────────────┐
│  🐄 Animal Health Records - Cattle #247 "Bessie"          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📅 Today's Health Check - July 2, 2025                   │
│                                                             │
│  🌡️ Temperature: [___°F] 📸 Add Photo                      │
│  👁️ Eye Condition: [Normal ▼] 📸 Add Photo                 │
│  👃 Nasal Discharge: [None ▼] 📸 Add Photo                  │
│  💩 Manure Consistency: [Normal ▼] 📸 Add Photo             │
│  🚶 Mobility/Gait: [Normal ▼] 📸 Add Photo                  │
│  🍽️ Appetite: [Normal ▼]                                   │
│                                                             │
│  📝 Quick Symptoms:                                         │
│  [📋 Scours/Diarrhea] [🤧 Respiratory] [🦶 Lameness]       │
│  [🔥 Fever] [🥱 Lethargy] [👁️ Eye Issues] [❓ Unknown]      │
│  [+ Custom Symptom]                                         │
│                                                             │
│  📋 Detailed Notes:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Animal appears alert but noticed loose stool this  │   │
│  │ morning. No fever detected. Appetite seems normal. │   │
│  │ Will monitor for next 24 hours...                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [🔍 Disease Lookup] [📊 Health Trends] [💉 Treatment Log] │
│  [📤 Share with Vet] [📁 Save to AET Journal]              │
└─────────────────────────────────────────────────────────────┘

### **Unknown Condition Documentation**
```
┌─────────────────────────────────────────────────────────────┐
│  ❓ Unknown Condition - Document for Expert Review         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📸 PHOTO DOCUMENTATION (Required)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📸 Primary Photo: [Take Photo] [Upload from Gallery]│   │
│  │ 📸 Close-up Detail: [Take Photo] [Upload]          │   │
│  │ 📸 Different Angle: [Take Photo] [Upload]          │   │
│  │ 📸 Comparison (Normal): [Take Photo] [Upload]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📝 WHAT YOU OBSERVED:                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • When did you first notice this?                  │   │
│  │   [Today] [Yesterday] [2-3 days ago] [Other: ___] │   │
│  │                                                     │   │
│  │ • What made you concerned?                          │   │
│  │   [Looked different] [Acting strange]              │   │
│  │   [Eating less] [Moving differently] [Other]       │   │
│  │                                                     │   │
│  │ • Describe what you see:                           │   │
│  │   ┌─────────────────────────────────────────────┐   │   │
│  │   │ Animal has a swollen area on left side of  │   │   │
│  │   │ face. Doesn't seem to be in pain but       │   │   │
│  │   │ looks unusual. Still eating normally...    │   │   │
│  │   └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🎯 HELP OPTIONS:                                          │
│  [🤖 AI Analysis] [👩‍⚕️ Ask Teacher] [📞 Contact Vet]        │
│  [📚 Browse Similar Cases] [📋 Save & Monitor]             │
│                                                             │
│  ⚡ PRIORITY LEVEL:                                         │
│  [🟢 Monitor] [🟡 Concern] [🟠 Urgent] [🔴 Emergency]      │
└─────────────────────────────────────────────────────────────┘
```
```

### **Disease Reference Integration**
```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Disease & Condition Reference                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔎 Search: [scours diarrhea____] 🎙️                       │
│                                                             │
│  📊 Common in your region (Texas): 🌡️ 85°F, 🌧️ Recent rain │
│                                                             │
│  🦠 VIRAL CONDITIONS:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Bovine Viral Diarrhea (BVD)                     │   │
│  │ Symptoms: Diarrhea, fever, decreased appetite      │   │
│  │ Severity: ⚠️ Moderate-High | Contagious: ✅        │   │
│  │ [📖 Learn More] [📸 Photo Examples] [📋 Add]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🦠 BACTERIAL CONDITIONS:                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔵 Salmonella                                       │   │
│  │ Symptoms: Watery diarrhea, fever, dehydration      │   │
│  │ Severity: ⚠️ High | Contagious: ✅ | Zoonotic: ⚠️   │   │
│  │ [📖 Learn More] [📸 Photo Examples] [📋 Add]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🧬 PARASITIC CONDITIONS:                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 Coccidiosis                                      │   │
│  │ Symptoms: Bloody diarrhea, weight loss, weakness   │   │
│  │ Severity: ⚠️ Moderate | Age: Young animals         │   │
│  │ [📖 Learn More] [📸 Photo Examples] [📋 Add]       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **Database Schema & Data Architecture**

### **Health Records Core Tables**
```sql
-- Core health record structure
CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id),
    recorded_by INTEGER REFERENCES users(id),
    recorded_date TIMESTAMP DEFAULT NOW(),
    observation_type VARCHAR(50), -- 'routine', 'illness', 'treatment', 'emergency'
    
    -- Vital signs
    temperature DECIMAL(4,1),
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    
    -- Physical condition scores (1-5 scale)
    body_condition_score INTEGER,
    appetite_score INTEGER,
    activity_level INTEGER,
    alertness_score INTEGER,
    
    -- Specific observations
    eye_condition VARCHAR(50),
    nasal_discharge VARCHAR(50),
    manure_consistency VARCHAR(50),
    mobility_gait VARCHAR(50),
    
    -- Detailed notes
    symptoms TEXT[],
    detailed_notes TEXT,
    severity_level INTEGER, -- 1-5 scale
    
    -- Unknown condition tracking
    condition_status VARCHAR(20) DEFAULT 'identified', -- 'identified', 'unknown', 'pending_review', 'expert_reviewed'
    unknown_condition_description TEXT,
    first_observed DATE,
    concern_level VARCHAR(20), -- 'monitor', 'concern', 'urgent', 'emergency'
    help_requested VARCHAR(50)[], -- ['ai_analysis', 'teacher_review', 'vet_consult']
    
    -- Expert review tracking
    reviewed_by INTEGER REFERENCES users(id),
    expert_diagnosis TEXT,
    expert_recommendations TEXT,
    review_timestamp TIMESTAMP,
    
    -- Photo references
    photos JSONB,
    
    -- Weather correlation
    temperature_f DECIMAL(4,1),
    humidity INTEGER,
    precipitation DECIMAL(4,2),
    
    -- AET Journal integration
    aet_journal_entry_id INTEGER,
    sync_status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Unknown condition review and expert consultation tracking
CREATE TABLE unknown_condition_reviews (
    id SERIAL PRIMARY KEY,
    health_record_id INTEGER REFERENCES health_records(id),
    submitted_by INTEGER REFERENCES users(id),
    submitted_date TIMESTAMP DEFAULT NOW(),
    
    -- Student submission details
    observed_changes TEXT,
    first_noticed_date DATE,
    concern_triggers TEXT[],
    priority_level VARCHAR(20), -- 'monitor', 'concern', 'urgent', 'emergency'
    
    -- Review assignment
    assigned_to INTEGER REFERENCES users(id), -- teacher, vet, expert
    assignment_date TIMESTAMP,
    due_date TIMESTAMP,
    
    -- Expert response
    expert_diagnosis TEXT,
    confidence_level INTEGER, -- 1-5 scale
    recommended_actions TEXT[],
    follow_up_required BOOLEAN DEFAULT FALSE,
    educational_notes TEXT,
    
    -- Status tracking
    review_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_review', 'completed', 'follow_up_needed'
    completion_date TIMESTAMP,
    
    -- Learning outcome
    student_learned BOOLEAN,
    learning_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Disease and condition reference
CREATE TABLE disease_reference (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'viral', 'bacterial', 'parasitic', 'nutritional', 'metabolic'
    species VARCHAR(50)[], -- ['cattle', 'sheep', 'swine', 'goats']
    
    -- Clinical information
    description TEXT,
    symptoms TEXT[],
    causes TEXT[],
    treatment_options TEXT[],
    prevention_methods TEXT[],
    
    -- Risk factors
    age_groups VARCHAR(50)[], -- ['newborn', 'young', 'adult', 'elderly']
    seasonal_patterns VARCHAR(50)[],
    environmental_factors TEXT[],
    
    -- Severity and transmission
    severity_level INTEGER, -- 1-5
    contagious BOOLEAN DEFAULT FALSE,
    zoonotic BOOLEAN DEFAULT FALSE,
    notifiable BOOLEAN DEFAULT FALSE,
    
    -- Educational content
    educational_notes TEXT,
    prevention_tips TEXT[],
    when_to_call_vet TEXT,
    
    -- Media references
    reference_photos JSONB,
    educational_videos JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatment and intervention tracking
CREATE TABLE treatments (
    id SERIAL PRIMARY KEY,
    health_record_id INTEGER REFERENCES health_records(id),
    animal_id INTEGER REFERENCES animals(id),
    administered_by INTEGER REFERENCES users(id),
    
    treatment_type VARCHAR(50), -- 'medication', 'vaccination', 'procedure', 'supportive_care'
    medication_name VARCHAR(100),
    dosage VARCHAR(50),
    route VARCHAR(30), -- 'oral', 'injection_im', 'injection_iv', 'topical'
    
    administered_date TIMESTAMP,
    next_dose_due TIMESTAMP,
    withdrawal_period_end DATE,
    
    cost DECIMAL(8,2),
    prescribed_by VARCHAR(100), -- veterinarian name
    
    notes TEXT,
    photos JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Photo metadata and AI analysis
CREATE TABLE health_photos (
    id SERIAL PRIMARY KEY,
    health_record_id INTEGER REFERENCES health_records(id),
    animal_id INTEGER REFERENCES animals(id),
    
    file_path VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(50),
    
    -- Photo metadata
    photo_type VARCHAR(50), -- 'general', 'eye', 'nasal', 'manure', 'skin', 'gait'
    body_part VARCHAR(50),
    
    -- AI analysis results
    ai_analysis_results JSONB,
    ai_confidence_score DECIMAL(3,2),
    ai_detected_conditions TEXT[],
    
    -- Image quality metrics
    quality_score DECIMAL(3,2),
    resolution VARCHAR(20),
    lighting_quality VARCHAR(20),
    
    uploaded_at TIMESTAMP DEFAULT NOW()
);
