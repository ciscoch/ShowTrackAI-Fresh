#!/bin/bash

# ============================================================================
# ShowTrackAI Supabase Integration Verification Runner
# ============================================================================
# This script runs the SQL verification queries against your Supabase database
# ============================================================================

set -e

echo "🔍 ShowTrackAI Supabase Integration Verification"
echo "================================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing via npm..."
    npm install -g supabase
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Supabase CLI via npm."
        echo "📝 Please install manually:"
        echo "   npm install -g supabase"
        echo "   or follow: https://supabase.com/docs/guides/cli"
        exit 1
    fi
fi

# Load environment variables
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found. Please ensure your Supabase credentials are configured."
    exit 1
fi

# Check required environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   EXPO_PUBLIC_SUPABASE_URL"
    echo "   EXPO_PUBLIC_SUPABASE_ANON_KEY"
    echo "📝 Please check your .env file configuration."
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🔗 Supabase URL: $EXPO_PUBLIC_SUPABASE_URL"
echo ""

# Extract project ID from URL
PROJECT_ID=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo "🆔 Project ID: $PROJECT_ID"
echo ""

# Method 1: Try using Supabase CLI (if linked to project)
echo "📊 Running Supabase Integration Verification..."
echo "==============================================="

# Check if project is linked
if supabase status 2>/dev/null | grep -q "API URL"; then
    echo "✅ Using Supabase CLI (project linked)"
    supabase db query --file=./commands/verify-supabase-integration.sql
else
    echo "⚠️  Project not linked to Supabase CLI"
    echo "📝 To link your project, run:"
    echo "   supabase login"
    echo "   supabase link --project-ref $PROJECT_ID"
    echo ""
    
    # Method 2: Try using psql with connection string
    echo "🔄 Attempting direct connection..."
    
    # Extract database connection details
    DB_HOST="${PROJECT_ID}.supabase.co"
    DB_PORT="5432"
    DB_NAME="postgres"
    DB_USER="postgres"
    
    # Note: This requires the postgres password which isn't in the anon key
    echo "❌ Direct psql connection requires database password (not available in anon key)"
    echo ""
    
    # Method 3: Provide instructions for manual verification
    echo "📋 Manual Verification Instructions:"
    echo "===================================="
    echo ""
    echo "1. Open your Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_ID"
    echo ""
    echo "2. Navigate to SQL Editor in the left sidebar"
    echo ""
    echo "3. Copy and paste the contents of:"
    echo "   ./commands/verify-supabase-integration.sql"
    echo ""
    echo "4. Click 'Run' to execute the verification queries"
    echo ""
    echo "📄 The SQL file contains comprehensive checks for:"
    echo "   ✓ Table existence and structure"
    echo "   ✓ Profile, animal, and journal entry counts"
    echo "   ✓ Data relationships and integrity"
    echo "   ✓ Recent activity summaries"
    echo "   ✓ Storage usage metrics"
    echo ""
fi

# Method 4: Check basic connectivity using curl
echo "🌐 Testing API Connectivity..."
echo "============================="

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=count")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Supabase API is accessible"
    echo "🔗 Connection to profiles table successful"
else
    echo "❌ Supabase API connection failed (HTTP $RESPONSE)"
    echo "📝 Please check your credentials and network connection"
fi

echo ""

# Try to get basic counts via REST API
echo "📈 Quick Data Summary via REST API:"
echo "===================================="

# Function to make authenticated request
make_request() {
    local endpoint=$1
    curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/$endpoint"
}

# Get counts for each table
echo "🔢 Getting table counts..."

PROFILES_COUNT=$(make_request "profiles?select=count" | grep -o '"count":[0-9]*' | grep -o '[0-9]*' | head -1)
ANIMALS_COUNT=$(make_request "animals?select=count" | grep -o '"count":[0-9]*' | grep -o '[0-9]*' | head -1)
JOURNAL_COUNT=$(make_request "journal_entries?select=count" | grep -o '"count":[0-9]*' | grep -o '[0-9]*' | head -1)

echo "📊 Results:"
echo "   Profiles: ${PROFILES_COUNT:-'Unable to fetch'}"
echo "   Animals: ${ANIMALS_COUNT:-'Unable to fetch'}"
echo "   Journal Entries: ${JOURNAL_COUNT:-'Unable to fetch'}"

# Final status
echo ""
echo "🏁 Verification Complete!"
echo "========================="
echo ""
echo "📁 Full verification SQL script available at:"
echo "   ./commands/verify-supabase-integration.sql"
echo ""
echo "📝 For detailed analysis, run the SQL script in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
echo ""

# Check if we have data
if [ -n "$PROFILES_COUNT" ] && [ "$PROFILES_COUNT" -gt 0 ]; then
    echo "✅ Integration Status: ACTIVE (Data found in database)"
else
    echo "⚠️  Integration Status: CHECK REQUIRED (No data found or connection issues)"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Review the detailed verification report in Supabase Dashboard"
echo "   2. Check data integrity and relationships"
echo "   3. Verify that your app's CRUD operations are working correctly"
echo ""