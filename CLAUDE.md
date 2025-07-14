# CLAUDE.md - ShowTrackAI Project Memory & Commands

## 🎯 Project Context
**ShowTrackAI** - Elite livestock management app for FFA students
- **Platform**: React Native (Expo) with TypeScript
- **Backend**: Supabase with Row Level Security
- **Focus**: Elite tier features, animal management, weight tracking
- **Target**: 5 animal limit for MVP, professional UI/UX

### **💰 Business Intelligence & Monetization**
- **Market Position**: Livestock monitoring market ($1.5B → $25.7B by 2030) with 9.5-23.8% CAGR
- **Target Market**: 411K livestock FFA students + 150K agricultural students = $84-168M TAM
- **Revenue Streams**: Subscription tiers ($15-$150/month), API usage, data licensing, partnerships
- **Computer Vision**: 91.6% accuracy weight prediction, YOLOv8 health monitoring
- **Data Monetization**: $15K-$75K annually for regional intelligence, $15K-$50K monthly for 1,000 animals
- **Projections**: Year 1: $1.02M, Year 2: $4.5M, Year 5: $48.7M with 2,519% ROI
- **Investment**: Seed $500K-$1M, Series A $3M-$5M, 72-78% gross margin

---

## 📋 Quick Commands & Scripts

### **Development Commands**
```bash
# Start development server
npm start

# iOS simulator
npm run ios

# Android emulator  
npm run android

# Web development
npm run web
```

### **Database Operations**
```bash
# Apply animal field migration
# File: /commands/add-missing-animal-fields.sql
# Adds: tag_number, pen_number, project_type, breeder, pickup_date, acquisition_cost

# Apply FFA degree progress tracker extension
# File: /commands/ffa-degree-progress-tracker-database-extension.sql
# Adds: FFA degree tracking, SAE projects, competition tracking, motivational content
```

### **Environment Setup**
```bash
# Supabase configuration
# Check: /Users/francisco/Downloads/.env
# Required: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🏗 Current Architecture

### **Navigation Structure**
```
MainApp.tsx (Router)
├── EliteDashboard
├── AnimalListScreen
├── AnimalDetailsScreen  
├── AnimalFormScreen
├── WeightHistoryScreen
├── AddWeightScreen
├── JournalListScreen
├── JournalEntryScreen
├── FinancialTrackingScreen
├── MedicalRecordsScreen ✅
├── EnhancedFFADashboard (NEW)
├── FFADegreeProgressScreen (NEW)
├── SAEProjectManagementScreen (NEW)
├── CompetitionTrackingScreen (NEW)
├── ParentDashboard (NEW)
├── ParentLinkingScreen (NEW)
├── StudentLinkingScreen (NEW)
├── EvidenceSubmissionScreen (NEW)
└── FFAIntegrationTestScreen (NEW)
```

### **Key Services**
- **SupabaseAnimalAdapter**: Backend CRUD operations
- **WeightStore**: Weight tracking state management  
- **ProfileStore**: User profile management
- **JournalStore**: AET journal and photo management
- **AETSkillMatcher**: AI-powered skill recommendations
- **JournalPhotoService**: Privacy-first photo uploads
- **StorageService**: Local data persistence
- **AIReceiptProcessor**: OpenAI Vision API for receipt processing
- **FinancialStore**: Business intelligence and vendor analytics
- **VetConnectIntegration**: Veterinary consultation platform ($50-75 per consultation)
- **FeedOptimizer**: Precision feeding with 10-20% cost savings
- **FFADegreeService**: FFA degree progress tracking with validation and award system
- **SAEProjectService**: SAE project management with business intelligence analytics
- **MotivationalContentService**: Personalized student engagement and content delivery
- **FFAAnalyticsService**: Educational analytics and business intelligence platform
- **HealthRecordStore**: Comprehensive medical records management with health analytics
- **VetConnectService**: Professional veterinary consultation platform integration
- **ParentOversightService**: Secure parent-student engagement and evidence submission
- **AETFFAIntegrationService**: Complete AET skills tracking with FFA degree progress automation
- **AETSkillMatcher**: AI-powered activity analysis and skill identification with SAE alignment

### **Data Models**
- **Animal**: Core livestock data with camelCase frontend mapping
- **Weight**: Weight tracking with multiple measurement types
- **Journal**: AET-aligned entries with multi-animal feed tracking
- **Profile**: Elite student profiles with subscription tiers
- **Receipt**: Financial tracking with AI-powered processing
- **Vendor**: Business intelligence for supplier analytics
- **HealthRecord**: YOLOv8-powered disease detection and parasite identification
- **MarketIntelligence**: Real-time commodity pricing and regional analysis
- **FFADegreeProgress**: FFA degree level tracking and requirement management
- **EnhancedSAEProject**: Supervised Agricultural Experience project management with earnings tracking
- **CompetitionTracking**: FFA competition participation and performance analytics
- **MotivationalContent**: Student engagement content with personalized delivery
- **FFAAnalyticsEvent**: Educational analytics event tracking with privacy controls
- **HealthRecord**: Comprehensive health tracking with vital signs, symptoms, and AI photo analysis
- **VetConnect**: Professional veterinary consultation system with multi-modal communication
- **ParentStudentLink**: Secure family engagement with time-limited access codes
- **AETSkill**: AET competency tracking with proficiency levels and career cluster alignment
- **AETFFAMapping**: Integration model connecting AET skills to FFA degree requirements
- **JournalActivityAETMapping**: Activity processing model with points calculation and SAE alignment

---

## ✅ Recently Completed

### **Advanced Financial Intelligence System**
- ✅ **AI Receipt Processing**: OpenAI Vision API integration for 95%+ accuracy
- ✅ **Vendor Analytics**: Comprehensive vendor tracking with location data
- ✅ **Feed Cost Intelligence**: Weight-based cost analysis and optimization
- ✅ **Manual Input Resolution**: Enhanced warning system with fix options
- ✅ **Auto-populate Workflow**: Smart form population from AI results
- ✅ **Business Intelligence**: Detailed analytics for decision-making
- ✅ **Predicted Income & Break-Even**: FFA SAE educational financial planning
- ✅ **Enhanced Receipt Data Capture**: Detailed fields for research & monetization including feed_type classification, brand tracking, equipment lifecycle analysis, seasonal indicators, and vendor loyalty patterns

### **🎓 FFA Degree Progress Tracker - COMPLETE IMPLEMENTATION**
- ✅ **Enhanced FFA Services**: Complete backend with FFADegreeService, SAEProjectService, MotivationalContentService, and FFAAnalyticsService
- ✅ **Database Integration**: Full Supabase schema with RLS policies for degree progress, SAE projects, competitions, and analytics
- ✅ **React Native Components**: Modern UI screens for degree tracking, SAE management, and competition tracking
- ✅ **Business Intelligence**: Educational analytics, predictive modeling, and monetization framework ($500K+ revenue target)
- ✅ **Navigation Integration**: Seamless integration with existing ShowTrackAI navigation structure
- ✅ **Testing Framework**: Comprehensive integration testing for all services and database connectivity
- ✅ **FERPA Compliance**: Privacy-first data handling with appropriate retention policies
- ✅ **TypeScript Excellence**: Full type safety with comprehensive interfaces and helper functions

### **🏥 Medical Records System - PRODUCTION-READY SUPABASE INTEGRATION ✅**
- ✅ **Comprehensive Health Tracking**: Complete medical records system with vital signs, symptoms, and physical condition scoring
- ✅ **Supabase Database Integration**: Full CRUD operations with real-time sync and local storage fallback
- ✅ **Health Record CRUD**: Create, read, update, delete health records with backend persistence
- ✅ **Vaccination Management**: Complete vaccination tracking with due date reminders and cost analysis
- ✅ **Medication Tracking**: Treatment management with dosage, frequency, and status monitoring
- ✅ **AI Photo Analysis**: Computer vision integration for health assessment photos with confidence scoring
- ✅ **VetConnect Platform**: Professional veterinary consultation system with multi-modal communication (video, phone, text, photo review)
- ✅ **Unknown Condition Workflow**: Educational system for documenting and learning from unidentified health issues
- ✅ **Expert Review Network**: Multi-tier veterinary consultation system with educational mentorship
- ✅ **Health Analytics**: Advanced health trend analysis, symptom frequency tracking, and predictive alerts
- ✅ **Educational Integration**: Disease reference database with 100+ conditions aligned to AET curriculum standards
- ✅ **Navigation Integration**: Seamless integration with existing ShowTrackAI navigation and dashboard systems
- ✅ **Multi-Species Support**: Complete health management for cattle, sheep, swine, goats, and poultry
- ✅ **Data Security**: Row Level Security (RLS) policies ensuring proper access control and data privacy
- ✅ **Integration Testing**: Comprehensive test suite for validating Supabase integration and functionality
- ✅ **Import Path Resolution**: Fixed Supabase client imports for proper module resolution

### **🎓 AET-FFA Integration System - COMPREHENSIVE SKILLS TRACKING ✅**
- ✅ **AET Skills Mapping**: Complete integration between AET competencies and FFA degree requirements
- ✅ **Points-Based Progression**: Automatic AET points calculation from journal activities with FFA requirement fulfillment
- ✅ **Journal Activity Processing**: Real-time analysis of student activities for skill identification and points awarding
- ✅ **FFA Degree Automation**: Automatic completion of FFA requirements when AET point thresholds are reached
- ✅ **Skill Category Tracking**: Comprehensive tracking across 8 AET categories with proficiency level progression
- ✅ **Career Readiness Integration**: Career Ready Practices alignment with AET skills and FFA competencies
- ✅ **Progress Dashboard**: Enhanced FFA dashboard displaying AET points, skill distribution, and career readiness score
- ✅ **Intelligent Recommendations**: AI-powered next steps based on skill gaps and completion patterns
- ✅ **Multi-Level Assessment**: Beginner to Expert skill progression with weighted point calculations
- ✅ **SAE Standards Alignment**: Direct mapping of activities to SAE competency standards (AS.01-AS.08, CRP.01-CRP.11)
- ✅ **Activity Analysis**: Advanced algorithm for matching student activities to appropriate AET skills and FFA requirements
- ✅ **Storage Integration**: Local storage fallback with Supabase sync for reliable data persistence

### **Advanced Journal with AET Integration** 
- ✅ **AET Skills Framework**: 8 categories, 40+ agricultural skills with career alignment
- ✅ **Multi-Animal Feed Tracking**: Tab-based interface for tracking multiple animals
- ✅ **AI Autofill System**: Context-aware title/description generation
- ✅ **Photo Documentation**: Privacy-first photo capture with AI-optimized guidance
- ✅ **Weather & Location**: Automatic detection with manual fallback options

### **Elite Weight Tracking System**
- ✅ **WeightHistoryScreen**: Charts, analytics, growth trends
- ✅ **AddWeightScreen**: Multiple measurement types, BCS scoring
- ✅ **Navigation Integration**: Animal Details → Weight History → Add Weight
- ✅ **Custom Charts**: Data visualization without external dependencies

### **UI/UX Improvements** 
- ✅ **Animal List Redesign**: Modern cards with proper touch targets
- ✅ **Touch Functionality**: Fixed "Tap to view details" issue
- ✅ **Mobile Best Practices**: 44pt minimum buttons, clear visual hierarchy
- ✅ **Quick Actions**: View/Edit/Health action bar

### **Backend Integration**
- ✅ **Supabase Authentication**: Full user profile system
- ✅ **Database Migration**: Added missing animal fields  
- ✅ **Field Mapping**: camelCase ↔ snake_case conversion
- ✅ **Species Support**: All animal types (Cattle, Goats, Pigs, Sheep, Poultry)
- ✅ **Error Handling**: Comprehensive user feedback
- ✅ **Journal Integration Fix**: JournalStore now uses ServiceFactory for Supabase persistence

---

## 🎯 Current Status

### **Working Features**
1. **Authentication**: Supabase login with Elite profiles
2. **Animal Management**: Full CRUD with backend sync
3. **Weight Tracking**: Professional analytics and data entry
4. **Journal System**: AET-integrated entries with Supabase persistence
5. **Financial Intelligence**: AI-powered receipt processing with business analytics
6. **Medical Records**: Comprehensive health tracking with AI photo analysis and VetConnect consultations
7. **FFA Degree Tracking**: Complete degree progress system with parent oversight
8. **AET-FFA Integration**: Automatic skill tracking and FFA requirement completion through journal activities
9. **Modern UI**: Mobile-optimized interface design

### **Elite Features Active**
- ✅ Animal management (5 animal limit)
- ✅ Weight history with growth analytics
- ✅ Multiple measurement types (Scale, AI, Visual, Tape)
- ✅ Body condition scoring (1-9 scale)
- ✅ Professional data visualization
- ✅ AI receipt processing with OpenAI Vision API
- ✅ Vendor analytics and business intelligence
- ✅ Feed cost analysis and optimization
- ✅ Manual input resolution and auto-populate workflows
- ✅ Comprehensive medical records with health analytics
- ✅ VetConnect professional veterinary consultations
- ✅ FFA degree tracking with parent oversight
- ✅ Parent-student evidence submission system
- ✅ AET skills tracking with automatic FFA requirement completion
- ✅ Career readiness assessment and recommendations

---

## 📁 Important File Locations

### **Core Screens**
- `/src/features/animals/screens/AnimalListScreen.tsx` - Redesigned cards
- `/src/features/animals/screens/AnimalDetailsScreen.tsx` - Elite feature hub
- `/src/features/animals/screens/WeightHistoryScreen.tsx` - Analytics dashboard
- `/src/features/animals/screens/AddWeightScreen.tsx` - Weight entry form
- `/src/features/financial/screens/FinancialTrackingScreen.tsx` - AI receipt processing & analytics
- `/src/features/medical/screens/MedicalRecordsScreen.tsx` - Comprehensive health tracking dashboard
- `/src/features/ffa/screens/ParentDashboard.tsx` - Parent oversight and progress monitoring
- `/src/features/ffa/screens/EvidenceSubmissionScreen.tsx` - Multi-format evidence submission

### **Services & Stores**
- `/src/core/services/adapters/SupabaseAnimalAdapter.ts` - Backend integration
- `/src/core/stores/WeightStore.ts` - Weight data management
- `/src/core/stores/ProfileStore.ts` - User profile handling
- `/src/core/services/AIReceiptProcessor.ts` - OpenAI Vision API integration
- `/src/core/stores/FinancialStore.ts` - Financial data management
- `/src/core/stores/HealthRecordStore.ts` - Medical records and health analytics
- `/src/core/services/VetConnectService.ts` - Professional veterinary consultations
- `/src/core/services/ParentOversightService.ts` - Parent-student engagement system
- `/src/core/services/AETFFAIntegrationService.ts` - AET skills tracking with FFA integration
- `/src/core/services/AETSkillMatcher.ts` - AI-powered activity analysis and skill matching

### **Navigation & Config**
- `/src/navigation/MainApp.tsx` - Main app router
- `/src/core/models/` - TypeScript interfaces
- `/commands/` - Database migrations and progress docs

---

## 🚀 Next Phase Planning

### **High Priority**
1. **YOLOv8 Health Monitoring**: Real-time disease detection and parasite identification
2. **VetConnect Integration**: Veterinary consultation platform with revenue sharing
3. **Predictive Analytics**: Feed efficiency forecasting and health outcome prediction

### **Medium Priority**  
1. **Data Marketplace**: Launch licensing platform for research institutions
2. **Partnership Ecosystem**: Strategic alliances with feed companies and equipment manufacturers
3. **Commercial Expansion**: Enterprise features and B2B sales channels

### **Growth Targets**
- **Phase 1** (Months 1-6): 25 FFA chapters, 500 students, $50K ARR
- **Phase 2** (Months 7-18): 100 commercial customers, $500K ARR
- **Phase 3** (Months 19-36): Market leadership, $5M ARR

---

## 💡 Development Notes

### **Best Practices Followed**
- **TypeScript**: Full type safety implementation
- **Error Handling**: Comprehensive try-catch with user feedback
- **Mobile UI**: 44pt touch targets, proper spacing
- **State Management**: Zustand with AsyncStorage persistence
- **Accessibility**: WCAG-compliant navigation and interactions

### **Architecture Decisions**
- **Service Factory Pattern**: Clean backend switching
- **Component Separation**: Reusable, modular design
- **Data Mapping**: Consistent field naming across layers
- **Navigation State**: Centralized in MainApp for clarity

---

## 📊 Progress Tracking

### **Completed Milestones**
- ✅ Backend authentication and data sync
- ✅ Animal CRUD with Elite tier focus
- ✅ Professional weight tracking system
- ✅ Modern mobile UI implementation

### **Current Sprint Status**
- 🎯 Elite features: **COMPLETE**
- 🎯 Weight tracking: **COMPLETE** 
- 🎯 UI improvements: **COMPLETE**
- 🎯 Backend integration: **COMPLETE**

---

## 🔗 Quick Links

### **Business Intelligence & Strategy**
- **Business Intelligence**: `/commands/business_intelligence.md`
- **Go-to-Market Strategy**: `/commands/Go-to-Market Strategy & Business Development.md`
- **Strategic Roadmap**: `/commands/Strategic Implementation Roadmap.md`
- **Risk Management**: `/commands/Risk Management & Competitive Strategy.md`
- **Implementation Timeline**: `/commands/Implementation Timeline & Success Metrics.md`

### **Data & Analytics**
- **Data Lake Architecture**: `/commands/01-data-lake-architecture.md`
- **Data Monetization**: `/commands/05-data-monetization-strategy.md`
- **Feed Analytics ROI**: `/commands/07-feed-analytics-roi.md`
- **Analytics Features**: `/commands/Analytics & Reporting Features.md`

### **Technical Implementation**
- **AI Integration**: `/commands/10-ai-integration-architecture.md`
- **Admin Dashboard**: `/commands/03-admin-dashboard-analytics.md`
- **AET Integration**: `/commands/06-aet-integration-strategy.md`
- **VetConnect Strategy**: `/commands/showtrack_vetconnect_integration_strategy.md`

### **Educational & FFA**
- **FFA Implementation**: `/commands/02-ffa-implementation-strategy.md`
- **Educational Integration**: `/commands/Educational Integration Features.md`
- **Student Profile Plan**: `/commands/Student Profile Implementation Plan.md`
- **SAE Break-Even Analysis**: `/commands/ffa-sae-break-even-analysis.md`

### **Legacy Documentation**
- **Progress Summary**: `/commands/progress-summary.md`
- **Journal Enhancements**: `/commands/journal-system-enhancements-summary.md`
- **Supabase Journal Fix**: `/commands/supabase-journal-integration-fix.md`
- **Database Schema**: `/commands/add-missing-animal-fields.sql`
- **FFA Database Extension**: `/commands/ffa-degree-progress-tracker-database-extension.sql`
- **Medical Database Verification**: `/commands/verify-medical-database-schema.sql`
- **Medical Integration Tests**: `/src/tests/health-records-integration-test.ts`
- **Environment Config**: Check `/Users/francisco/Downloads/.env`

---

*Last Updated: July 2025*  
*Next Review: After photo upload implementation*