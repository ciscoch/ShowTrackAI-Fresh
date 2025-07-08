# ShowTrackAI Backend Integration

This directory contains the backend infrastructure for ShowTrackAI, implementing a Supabase-based solution that seamlessly integrates with the existing React Native frontend.

## 🏗️ Architecture Overview

The backend integration uses a **Service Factory Pattern** that allows seamless switching between local storage and cloud-based Supabase backend without changing any frontend code.

```
Frontend (React Native/Expo)
         ↓
   Service Factory
    ↙          ↘
Local Storage   Supabase Backend
 Adapters        Adapters
```

## 📁 Directory Structure

```
backend/
├── supabase/
│   ├── config/
│   │   ├── database.sql     # Complete database schema
│   │   ├── policies.sql     # Row Level Security policies
│   │   └── seed.sql         # Initial data and AET standards
│   ├── functions/           # Edge functions for AI and processing
│   ├── migrations/          # Database migrations
│   └── types/              # TypeScript type definitions
├── api/
│   ├── clients/
│   │   └── supabase.ts     # Supabase client configuration
│   ├── services/           # Backend service adapters
│   └── types/              # API type definitions
├── config/
│   └── environment.ts      # Environment configuration
└── scripts/
    ├── setup-supabase.sh   # Automated setup script
    └── deploy-functions.sh # Edge function deployment
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase CLI: `npm install -g supabase`
- A Supabase project (create at [supabase.com](https://supabase.com))

### 2. Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_USE_BACKEND=true
   ```

### 3. Backend Setup

Run the automated setup script:
```bash
cd backend/scripts
./setup-supabase.sh
```

This script will:
- Link your local project to Supabase
- Apply the database schema
- Set up Row Level Security policies
- Create storage buckets
- Deploy edge functions
- Apply seed data

### 4. Install Dependencies

```bash
npm install
```

The setup automatically adds:
- `@supabase/supabase-js` - Supabase client
- `react-native-url-polyfill` - URL polyfill for React Native

### 5. Start Development

```bash
npm start
```

The app will automatically use the backend when `EXPO_PUBLIC_USE_BACKEND=true`.

## 🔧 Configuration

### Backend Toggle

Switch between local and backend storage by setting:
```env
EXPO_PUBLIC_USE_BACKEND=false  # Local storage only
EXPO_PUBLIC_USE_BACKEND=true   # Supabase backend
```

### Feature Flags

Enable/disable specific features:
```env
EXPO_PUBLIC_ENABLE_AI_WEIGHT=true
EXPO_PUBLIC_ENABLE_VET_CONNECT=true
EXPO_PUBLIC_ENABLE_REALTIME=true
```

## 📊 Database Schema

The database supports:

### Core Tables
- `profiles` - User profiles with roles and metadata
- `organizations` - FFA chapters and schools
- `animals` - Complete animal management
- `animal_photos` - Photo storage with AI metadata
- `animal_weights` - Weight tracking with AI predictions

### Educational Features
- `journal_entries` - Student project documentation
- `aet_standards` - Agricultural Education standards
- `aet_mappings` - Activity to standard tracking

### Health & Veterinary
- `animal_health_records` - Health event tracking
- `consultations` - VetConnect telemedicine
- `veterinarian_profiles` - Professional profiles

### Financial Management
- `expenses` / `income` - Financial tracking
- `budgets` - Budget planning and monitoring

## 🔐 Security

### Row Level Security (RLS)

All tables use RLS policies ensuring:
- Users see only their own data
- Educators can view linked students' data
- Veterinarians access assigned consultation data
- QR code observers have read-only access

### Authentication

- JWT-based authentication via Supabase Auth
- Role-based access control (student, educator, veterinarian, admin)
- Multi-factor authentication support

## 🔄 Service Adapters

The Service Factory creates appropriate adapters:

```typescript
import { getAnimalService } from '../services/adapters/ServiceFactory';

// Automatically uses either Local or Supabase adapter
const animalService = getAnimalService();
const animals = await animalService.getAnimals();
```

### Available Services

- `StorageService` - Data persistence
- `AnimalService` - Animal management
- `ProfileService` - User profiles
- `HealthService` - Health records
- `JournalService` - Educational journaling
- `FinancialService` - Financial tracking
- `AuthService` - Authentication
- `WeightService` - Weight tracking with AI

## 🚀 Edge Functions

Supabase Edge Functions handle:

- `health-assessment` - AI health analysis
- `weight-prediction` - AI weight prediction
- `report-generation` - Automated reports
- `notification-service` - Multi-channel notifications

## 📱 Frontend Integration

### Zero Code Changes Required

The existing frontend code continues to work unchanged:

```typescript
// This code works with both local and backend storage
const { animals } = useAnimalStore();
const newAnimal = await createAnimal(animalData);
```

### Gradual Migration

Features can be migrated individually:
1. Set `EXPO_PUBLIC_USE_BACKEND=true`
2. Test each feature area
3. Rollback by setting to `false` if needed

## 🧪 Testing

### Local Development
```bash
# Test with local storage
EXPO_PUBLIC_USE_BACKEND=false npm start

# Test with backend
EXPO_PUBLIC_USE_BACKEND=true npm start
```

### Service Connectivity
```typescript
import { ServiceFactory } from '../services/adapters/ServiceFactory';

// Test backend connectivity
const status = await ServiceFactory.testConnectivity();
console.log('Backend status:', status);
```

## 📈 Monitoring

### Development Logs
```bash
# View Supabase function logs
supabase functions logs

# View all service status
ServiceFactory.getServiceStatus()
```

### Production Monitoring
- Supabase dashboard for database metrics
- Real-time error tracking
- Performance monitoring

## 🔄 Data Migration

### From Local to Backend
```typescript
// Export local data
const localData = await StorageService.createBackup();

// Switch to backend and import
EXPO_PUBLIC_USE_BACKEND=true
await BackendService.importData(localData);
```

### Sync Strategy
- Real-time sync when online
- Offline queue when disconnected
- Conflict resolution on reconnection

## 🎯 Next Steps

1. **Complete Adapter Implementation**
   - Implement remaining Supabase adapters
   - Add comprehensive error handling
   - Implement offline sync

2. **Advanced Features**
   - Real-time subscriptions
   - Push notifications
   - Advanced analytics

3. **Production Preparation**
   - Performance optimization
   - Security audit
   - Load testing

## 📞 Support

For backend-related issues:
1. Check the setup script output
2. Verify environment variables
3. Review Supabase dashboard logs
4. Test connectivity with `ServiceFactory.testConnectivity()`

The backend integration maintains complete compatibility with existing frontend code while providing powerful cloud capabilities and real-time features.