# CLAUDE.md - ShowTrackAI Project Memory & Commands

## 🎯 Project Context
**ShowTrackAI** - Elite livestock management app for FFA students
- **Platform**: React Native (Expo) with TypeScript
- **Backend**: Supabase with Row Level Security
- **Focus**: Elite tier features, animal management, weight tracking
- **Target**: 5 animal limit for MVP, professional UI/UX

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
├── JournalListScreen (NEW)
└── JournalEntryScreen (NEW)
```

### **Key Services**
- **SupabaseAnimalAdapter**: Backend CRUD operations
- **WeightStore**: Weight tracking state management  
- **ProfileStore**: User profile management
- **JournalStore**: AET journal and photo management
- **AETSkillMatcher**: AI-powered skill recommendations
- **JournalPhotoService**: Privacy-first photo uploads
- **StorageService**: Local data persistence

### **Data Models**
- **Animal**: Core livestock data with camelCase frontend mapping
- **Weight**: Weight tracking with multiple measurement types
- **Journal**: AET-aligned entries with multi-animal feed tracking
- **Profile**: Elite student profiles with subscription tiers

---

## ✅ Recently Completed

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
5. **Modern UI**: Mobile-optimized interface design

### **Elite Features Active**
- ✅ Animal management (5 animal limit)
- ✅ Weight history with growth analytics
- ✅ Multiple measurement types (Scale, AI, Visual, Tape)
- ✅ Body condition scoring (1-9 scale)
- ✅ Professional data visualization

---

## 📁 Important File Locations

### **Core Screens**
- `/src/features/animals/screens/AnimalListScreen.tsx` - Redesigned cards
- `/src/features/animals/screens/AnimalDetailsScreen.tsx` - Elite feature hub
- `/src/features/animals/screens/WeightHistoryScreen.tsx` - Analytics dashboard
- `/src/features/animals/screens/AddWeightScreen.tsx` - Weight entry form

### **Services & Stores**
- `/src/core/services/adapters/SupabaseAnimalAdapter.ts` - Backend integration
- `/src/core/stores/WeightStore.ts` - Weight data management
- `/src/core/stores/ProfileStore.ts` - User profile handling

### **Navigation & Config**
- `/src/navigation/MainApp.tsx` - Main app router
- `/src/core/models/` - TypeScript interfaces
- `/commands/` - Database migrations and progress docs

---

## 🚀 Next Phase Planning

### **High Priority**
1. **Testing**: End-to-end weight tracking workflow
2. **Photo Upload**: Animal photo management (Elite)
3. **AI Predictions**: Weight forecasting (Elite)

### **Medium Priority**  
1. **Health Records**: Veterinary tracking
2. **Export Features**: Data reporting
3. **Advanced Analytics**: Herd insights

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
- **Progress Summary**: `/commands/progress-summary.md`
- **Journal Enhancements**: `/commands/journal-system-enhancements-summary.md`
- **Supabase Journal Fix**: `/commands/supabase-journal-integration-fix.md`
- **Database Schema**: `/commands/add-missing-animal-fields.sql`
- **Environment Config**: Check `/Users/francisco/Downloads/.env`

---

*Last Updated: July 2025*  
*Next Review: After photo upload implementation*