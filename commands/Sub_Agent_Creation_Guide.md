advise me how to create a sub-agent that will be a senior engineer that will create the backend services/code for ShowTrack AI app (entirely) to work. 
  probide list of APIs, apps such as Supabase needed to operate.

⏺ Based on my analysis of your ShowTrackAI app, here's a comprehensive guide for creating a sub-agent to build the entire backend infrastructure:

  Sub-Agent Creation Guide

  1. Sub-Agent Role Definition

  You are a Senior Backend Engineer tasked with building the complete backend infrastructure for ShowTrackAI - a comprehensive FFA/4-H livestock
  management platform with integrated veterinary telemedicine capabilities. You specialize in:
  - Real-time applications with healthcare compliance
  - Educational technology platforms
  - Agricultural data management systems
  - Serverless and cloud-native architectures

  2. Recommended Backend Stack (Supabase-Centric)

  Primary Platform: Supabase
  - Database: PostgreSQL with Row Level Security (RLS)
  - Authentication: Built-in auth with JWT tokens
  - Real-time: WebSocket subscriptions for live data
  - Storage: File/image storage for medical records
  - Edge Functions: Serverless compute for complex logic

  Additional Services Needed:
  - Stripe: Payment processing for subscriptions & veterinarian payments
  - Twilio: SMS notifications and video consultations
  - SendGrid: Email notifications and reports
  - Cloudinary: Image optimization for animal photos
  - OpenAI API: AI-powered health assessments
  - Google Maps API: Location services for farms/clinics
  - OneSignal: Push notifications

  3. Complete API List Required

  Core User Management APIs:
  // Authentication & Profiles
  POST   /auth/signup                 // Register new user
  POST   /auth/login                  // Login user
  POST   /auth/logout                 // Logout user
  POST   /auth/refresh                // Refresh JWT token
  GET    /auth/profile                // Get current user profile
  PUT    /auth/profile                // Update user profile
  POST   /auth/verify-email           // Email verification
  POST   /auth/reset-password         // Password reset

  // Role-Specific Endpoints
  GET    /users/students              // List students (educator only)
  POST   /users/students/link         // Link student to educator
  GET    /users/educators/{id}        // Get educator profile
  POST   /users/switch-role           // Switch between roles

  Animal Management APIs:
  // Animal CRUD
  GET    /animals                     // List user's animals
  POST   /animals                     // Create new animal
  GET    /animals/{id}                // Get animal details
  PUT    /animals/{id}                // Update animal
  DELETE /animals/{id}                // Delete animal
  POST   /animals/{id}/transfer       // Transfer ownership

  // Health Records
  POST   /animals/{id}/health         // Add health record
  GET    /animals/{id}/health         // Get health history
  POST   /animals/{id}/weight         // Record weight
  GET    /animals/{id}/weights        // Get weight history
  POST   /animals/{id}/vaccinations   // Add vaccination
  GET    /animals/{id}/vaccinations   // Get vaccination records

  Journal & Documentation APIs:
  // Journal Entries
  GET    /journals                    // List journal entries
  POST   /journals                    // Create journal entry
  GET    /journals/{id}               // Get journal entry
  PUT    /journals/{id}               // Update journal entry
  DELETE /journals/{id}               // Delete journal entry
  POST   /journals/{id}/photos        // Add photos to entry

  // AET Standards Tracking
  GET    /aet/standards               // List AET standards
  POST   /aet/map-activity            // Map activity to standards
  GET    /aet/progress                // Get AET progress report

  Financial Management APIs:
  // Expenses & Income
  GET    /financial/summary           // Financial dashboard data
  POST   /financial/expenses          // Record expense
  GET    /financial/expenses          // List expenses
  POST   /financial/income            // Record income
  GET    /financial/income            // List income
  GET    /financial/reports           // Generate reports
  POST   /financial/budget            // Set budget
  GET    /financial/budget            // Get budget vs actual

  VetConnect Platform APIs:
  // Veterinarian Management
  POST   /veterinarians/apply         // Apply as veterinarian
  GET    /veterinarians/onboarding    // Get onboarding status
  POST   /veterinarians/onboarding    // Update onboarding step
  GET    /veterinarians/profile       // Get vet profile
  PUT    /veterinarians/profile       // Update vet profile
  POST   /veterinarians/availability  // Set availability
  GET    /veterinarians/cases         // List assigned cases

  // Consultations
  POST   /consultations/request       // Request consultation
  GET    /consultations               // List consultations
  GET    /consultations/{id}          // Get consultation details
  PUT    /consultations/{id}/status   // Update status
  POST   /consultations/{id}/notes    // Add consultation notes
  POST   /consultations/{id}/prescribe // Add prescription

  // AI Health Assessment
  POST   /health/assess               // Submit health assessment
  GET    /health/assessments/{id}     // Get assessment results
  POST   /health/symptoms/analyze     // Analyze symptoms with AI

  Calendar & Events APIs:
  // Event Management
  GET    /events                      // List events
  POST   /events                      // Create event
  GET    /events/{id}                 // Get event details
  PUT    /events/{id}                 // Update event
  DELETE /events/{id}                 // Delete event
  GET    /events/upcoming             // Get upcoming events
  POST   /events/{id}/reminder        // Set reminder

  Collaboration & Access APIs:
  // QR Code & Observer Access
  POST   /access/generate-qr          // Generate QR code
  POST   /access/validate-token       // Validate access token
  GET    /access/observers            // List observers
  POST   /access/grant                // Grant observer access
  DELETE /access/revoke/{id}          // Revoke access

  // Notifications
  GET    /notifications               // List notifications
  PUT    /notifications/{id}/read     // Mark as read
  POST   /notifications/preferences   // Update preferences

  Analytics & Reporting APIs:
  // Analytics
  GET    /analytics/dashboard         // Dashboard metrics
  GET    /analytics/growth            // Animal growth analytics
  GET    /analytics/financial         // Financial analytics
  GET    /analytics/health            // Health trend analysis
  GET    /analytics/educational       // Educational progress

  // Export & Reports
  POST   /export/pdf                  // Generate PDF report
  POST   /export/excel                // Generate Excel report
  GET    /export/templates            // List report templates

  4. Supabase Database Schema

  -- Core User Tables
  users (extends Supabase auth.users)
  profiles (user details, role, subscription)
  profile_relationships (student-educator links)

  -- Animal Management
  animals (all animal data)
  animal_health_records
  animal_weights
  animal_vaccinations
  animal_medications
  animal_transfers

  -- Educational Content
  journal_entries
  journal_photos
  aet_standards
  aet_mappings
  educational_assessments

  -- Financial
  expenses
  income
  budgets
  financial_categories

  -- VetConnect Platform
  veterinarian_profiles
  veterinarian_onboarding
  consultations
  consultation_notes
  prescriptions
  health_assessments
  ai_analysis_results

  -- Calendar & Events
  events
  event_attendees
  reminders

  -- Access Control
  access_tokens
  observer_permissions
  qr_codes

  -- System
  notifications
  audit_logs
  file_uploads

  5. Supabase Setup Instructions for Sub-Agent

  // 1. Initialize Supabase Project
  npx supabase init

  // 2. Set up authentication with custom claims
  // - student, educator, veterinarian, admin, parent roles
  // - subscription tiers: freemium, elite

  // 3. Enable Row Level Security (RLS) policies
  // - Users can only see their own data
  // - Educators can see linked students' data
  // - Veterinarians can see assigned cases
  // - Observers have read-only access via tokens

  // 4. Set up Realtime subscriptions for:
  // - Consultation status updates
  // - New notifications
  // - Calendar events
  // - Health alerts

  // 5. Configure Storage buckets for:
  // - Animal photos
  // - Medical documents
  // - Journal images
  // - Profile pictures

  6. Edge Functions Required

  // Supabase Edge Functions needed:
  - processHealthAssessment    // AI analysis of symptoms
  - generateMonthlyReports     // Automated report generation
  - calculateGrowthMetrics     // Weight gain calculations
  - matchVeterinarian         // Smart vet matching algorithm
  - processPayment           // Stripe payment processing
  - sendNotification        // Multi-channel notifications
  - validateMedicalLicense  // License verification
  - generateQRCode         // QR code generation
  - exportData            // Data export processing

  7. Third-Party Service Configuration

  Stripe Setup:
  - Customer portal for subscription management
  - Connect accounts for veterinarian payouts
  - Webhook handlers for payment events

  Twilio Configuration:
  - Programmable Video for consultations
  - SMS API for notifications
  - Verify API for phone verification

  OpenAI Integration:
  - GPT-4 for symptom analysis
  - Vision API for animal photo analysis
  - Embeddings for knowledge base search

  8. Security & Compliance Requirements

  HIPAA Compliance (for veterinary records):
  - Encryption at rest and in transit
  - Audit logging for all data access
  - Data retention policies
  - Access controls and authentication

  Educational Privacy (FERPA):
  - Student data protection
  - Parental access controls
  - Data sharing restrictions

  9. Sub-Agent Implementation Phases

  Phase 1: Core Infrastructure (Week 1)
  - Set up Supabase project
  - Configure authentication and roles
  - Create base database schema
  - Implement RLS policies

  Phase 2: User & Animal Management (Week 2)
  - User profile APIs
  - Animal CRUD operations
  - Basic health tracking
  - File upload functionality

  Phase 3: Educational Features (Week 3)
  - Journal system
  - AET standards mapping
  - Progress tracking
  - Educator-student linking

  Phase 4: VetConnect Platform (Week 4-5)
  - Veterinarian onboarding
  - Consultation system
  - AI health assessments
  - Real-time video setup

  Phase 5: Advanced Features (Week 6)
  - Financial tracking
  - Analytics dashboard
  - Export functionality
  - Notification system

  Phase 6: Testing & Deployment (Week 7)
  - Integration testing
  - Performance optimization
  - Security audit
  - Production deployment

  10. Sub-Agent Prompt Template

  Create a complete backend system for ShowTrackAI using Supabase as the primary platform. The system must:

  1. Support multiple user roles (student, educator, veterinarian, admin, parent)
  2. Manage livestock data with health tracking and growth analytics
  3. Enable real-time veterinary consultations with AI-powered assessments
  4. Track educational progress aligned with AET standards
  5. Handle financial data for project management
  6. Provide secure access via QR codes for observers
  7. Integrate with Stripe, Twilio, OpenAI, and other services
  8. Ensure HIPAA compliance for medical data
  9. Support offline-first mobile functionality
  10. Scale to handle thousands of concurrent users

  Start by setting up the Supabase project with proper authentication, database schema, and RLS policies. Then implement the APIs in phases as outlined
  above.

  This comprehensive guide provides everything needed to create a sub-agent that can build the entire backend infrastructure for ShowTrackAI using modern
  serverless technologies centered around Supabase.

