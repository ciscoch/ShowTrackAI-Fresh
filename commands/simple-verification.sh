#!/bin/bash

# ============================================================================
# ShowTrackAI Simple Supabase Integration Verification
# ============================================================================
# This script tests basic connectivity and data presence via REST API
# ============================================================================

set -e

echo "🔍 ShowTrackAI Supabase Integration Verification"
echo "================================================"
echo ""

# Load environment variables
if [ -f ".env" ]; then
    echo "📄 Loading environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

# Check required variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing Supabase credentials"
    exit 1
fi

echo "✅ Credentials loaded"
echo "🔗 URL: $EXPO_PUBLIC_SUPABASE_URL"
echo ""

# Function to make REST API request
api_request() {
    local endpoint=$1
    curl -s \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/$endpoint"
}

# Test basic connectivity
echo "🌐 Testing API Connectivity..."
echo "=============================="

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
    "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Supabase REST API is accessible"
else
    echo "❌ API connection failed (HTTP $HEALTH_CHECK)"
    exit 1
fi

echo ""

# Get data counts
echo "📊 Checking Data Integration..."
echo "==============================="

echo "🔢 Fetching table counts..."

# Profiles count
PROFILES_RESPONSE=$(api_request "profiles?select=*&limit=0" 2>/dev/null)
PROFILES_COUNT=$(echo "$PROFILES_RESPONSE" | grep -o '\[.*\]' | grep -o ',' | wc -l | tr -d ' ')
if [ "$PROFILES_COUNT" = "0" ] && echo "$PROFILES_RESPONSE" | grep -q '\[\]'; then
    PROFILES_COUNT=0
elif echo "$PROFILES_RESPONSE" | grep -q '\[.*\]'; then
    PROFILES_COUNT=$((PROFILES_COUNT + 1))
fi

echo "👥 Profiles: ${PROFILES_COUNT:-'Error'}"

# Animals count  
ANIMALS_RESPONSE=$(api_request "animals?select=*&limit=0" 2>/dev/null)
ANIMALS_COUNT=$(echo "$ANIMALS_RESPONSE" | grep -o '\[.*\]' | grep -o ',' | wc -l | tr -d ' ')
if [ "$ANIMALS_COUNT" = "0" ] && echo "$ANIMALS_RESPONSE" | grep -q '\[\]'; then
    ANIMALS_COUNT=0
elif echo "$ANIMALS_RESPONSE" | grep -q '\[.*\]'; then
    ANIMALS_COUNT=$((ANIMALS_COUNT + 1))
fi

echo "🐄 Animals: ${ANIMALS_COUNT:-'Error'}"

# Journal entries count
JOURNAL_RESPONSE=$(api_request "journal_entries?select=*&limit=0" 2>/dev/null)
JOURNAL_COUNT=$(echo "$JOURNAL_RESPONSE" | grep -o '\[.*\]' | grep -o ',' | wc -l | tr -d ' ')
if [ "$JOURNAL_COUNT" = "0" ] && echo "$JOURNAL_RESPONSE" | grep -q '\[\]'; then
    JOURNAL_COUNT=0
elif echo "$JOURNAL_RESPONSE" | grep -q '\[.*\]'; then
    JOURNAL_COUNT=$((JOURNAL_COUNT + 1))
fi

echo "📝 Journal Entries: ${JOURNAL_COUNT:-'Error'}"

echo ""

# Sample data verification
echo "📋 Sample Data Verification..."
echo "=============================="

# Get latest profiles
echo "👤 Recent Profiles:"
RECENT_PROFILES=$(api_request "profiles?select=full_name,role,created_at&order=created_at.desc&limit=3")
if echo "$RECENT_PROFILES" | grep -q "full_name"; then
    echo "$RECENT_PROFILES" | grep -o '"full_name":"[^"]*"' | sed 's/"full_name":"//; s/"//' | head -3 | while read name; do
        echo "   • $name"
    done
else
    echo "   No profiles found or access denied"
fi

echo ""

# Get latest animals
echo "🐄 Recent Animals:"
RECENT_ANIMALS=$(api_request "animals?select=name,species,breed,created_at&order=created_at.desc&limit=3")
if echo "$RECENT_ANIMALS" | grep -q "name"; then
    echo "$RECENT_ANIMALS" | grep -o '"name":"[^"]*"' | sed 's/"name":"//; s/"//' | head -3 | while read name; do
        echo "   • $name"
    done
else
    echo "   No animals found or access denied"
fi

echo ""

# Get latest journal entries
echo "📝 Recent Journal Entries:"
RECENT_JOURNALS=$(api_request "journal_entries?select=title,entry_type,created_at&order=created_at.desc&limit=3")
if echo "$RECENT_JOURNALS" | grep -q "title"; then
    echo "$RECENT_JOURNALS" | grep -o '"title":"[^"]*"' | sed 's/"title":"//; s/"//' | head -3 | while read title; do
        echo "   • $title"
    done
else
    echo "   No journal entries found or access denied"
fi

echo ""

# Integration health assessment
echo "🏥 Integration Health Assessment..."
echo "==================================="

TOTAL_RECORDS=$((PROFILES_COUNT + ANIMALS_COUNT + JOURNAL_COUNT))

if [ "$TOTAL_RECORDS" -gt 0 ]; then
    echo "✅ INTEGRATION STATUS: ACTIVE"
    echo "📊 Total Records: $TOTAL_RECORDS"
    echo "   • $PROFILES_COUNT user profiles"
    echo "   • $ANIMALS_COUNT animals"
    echo "   • $JOURNAL_COUNT journal entries"
    echo ""
    echo "🎯 Integration appears to be working correctly!"
else
    echo "⚠️  INTEGRATION STATUS: NO DATA FOUND"
    echo "📋 Possible causes:"
    echo "   • Database is empty (new installation)"
    echo "   • Row Level Security preventing access"
    echo "   • Authentication issues"
    echo "   • Network connectivity problems"
fi

echo ""

# Provide next steps
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. 📊 For detailed analysis, run the full SQL script:"
echo "   ./commands/verify-supabase-integration.sql"
echo ""
echo "2. 🌐 Access Supabase Dashboard:"
echo "   https://supabase.com/dashboard/"
echo ""
echo "3. 🔍 Check SQL Editor for comprehensive verification:"
echo "   Copy the SQL script and run it in the dashboard"
echo ""
echo "4. 📱 Test app functionality:"
echo "   • Create a new animal"
echo "   • Add a journal entry"
echo "   • Verify data appears in dashboard"
echo ""

if [ "$TOTAL_RECORDS" -eq 0 ]; then
    echo "⚠️  If this is a new installation, consider:"
    echo "   • Running the app and creating test data"
    echo "   • Checking Row Level Security policies"
    echo "   • Verifying authentication setup"
fi

echo ""
echo "🏁 Verification Complete!"
echo "========================="