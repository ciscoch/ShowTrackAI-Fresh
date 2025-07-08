#!/bin/bash

# ShowTrackAI Supabase Setup Script
# This script helps set up the Supabase backend for ShowTrackAI

set -e

echo "🚀 ShowTrackAI Supabase Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed"
    echo "Please install it first:"
    echo "npm install -g supabase"
    echo "or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

print_success "Supabase CLI found"

# Check if .env file exists
if [ ! -f "../.env" ]; then
    print_warning ".env file not found"
    echo "Please copy .env.example to .env and fill in your Supabase credentials"
    echo "cp .env.example .env"
    exit 1
fi

# Load environment variables
set -o allexport
source ../.env
set +o allexport

# Check required environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    print_error "Missing Supabase configuration"
    echo "Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file"
    exit 1
fi

print_success "Environment variables loaded"

# Initialize Supabase project (if not already initialized)
if [ ! -f "../supabase/config.toml" ]; then
    echo "Initializing Supabase project..."
    cd ..
    supabase init
    cd backend/scripts
    print_success "Supabase project initialized"
else
    print_success "Supabase project already initialized"
fi

# Link to remote project
echo "Linking to remote Supabase project..."
PROJECT_ID=$(echo "$EXPO_PUBLIC_SUPABASE_URL" | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')

if [ -z "$PROJECT_ID" ]; then
    print_error "Could not extract project ID from SUPABASE_URL"
    exit 1
fi

cd ..
supabase link --project-ref "$PROJECT_ID"
print_success "Linked to project: $PROJECT_ID"

# Apply database schema
echo "Applying database schema..."
if [ -f "backend/supabase/config/database.sql" ]; then
    supabase db push
    print_success "Database schema applied"
else
    print_warning "Database schema file not found"
fi

# Apply RLS policies
echo "Applying Row Level Security policies..."
if [ -f "backend/supabase/config/policies.sql" ]; then
    psql "$DATABASE_URL" -f backend/supabase/config/policies.sql
    print_success "RLS policies applied"
else
    print_warning "Policies file not found"
fi

# Apply seed data
echo "Applying seed data..."
if [ -f "backend/supabase/config/seed.sql" ]; then
    psql "$DATABASE_URL" -f backend/supabase/config/seed.sql
    print_success "Seed data applied"
else
    print_warning "Seed data file not found"
fi

# Set up storage buckets
echo "Setting up storage buckets..."
supabase storage create animal-photos --public
supabase storage create journal-photos --public
supabase storage create medical-documents --private
supabase storage create profile-pictures --public
supabase storage create receipts --private

print_success "Storage buckets created"

# Deploy edge functions
echo "Deploying edge functions..."
if [ -d "backend/supabase/functions" ]; then
    for func_dir in backend/supabase/functions/*/; do
        if [ -d "$func_dir" ]; then
            func_name=$(basename "$func_dir")
            echo "Deploying function: $func_name"
            supabase functions deploy "$func_name"
        fi
    done
    print_success "Edge functions deployed"
else
    print_warning "No edge functions found"
fi

echo ""
print_success "Supabase setup completed!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the correct Supabase credentials"
echo "2. Set EXPO_PUBLIC_USE_BACKEND=true to enable backend mode"
echo "3. Install dependencies: npm install"
echo "4. Start your app: npm start"
echo ""
echo "Useful commands:"
echo "- View logs: supabase functions logs"
echo "- Open dashboard: supabase dashboard"
echo "- Reset database: supabase db reset"