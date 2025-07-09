#!/bin/bash

# ============================================================================
# ShowTrackAI Supabase Status and Configuration Check
# ============================================================================
# This script checks Supabase configuration and provides setup guidance
# ============================================================================

echo "🔍 ShowTrackAI Supabase Configuration Check"
echo "============================================"
echo ""

# Load environment variables
if [ -f ".env" ]; then
    echo "📄 Found .env file"
    export $(cat .env | grep -v '^#' | xargs) 2>/dev/null
else
    echo "❌ .env file not found"
    exit 1
fi

echo ""
echo "🔧 Configuration Analysis:"
echo "=========================="

# Check URL
if [ -n "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "✅ Supabase URL: $EXPO_PUBLIC_SUPABASE_URL"
    PROJECT_ID=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
    echo "🆔 Project ID: $PROJECT_ID"
else
    echo "❌ EXPO_PUBLIC_SUPABASE_URL not found"
fi

# Check API Key
if [ -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    KEY_LENGTH=${#EXPO_PUBLIC_SUPABASE_ANON_KEY}
    echo "🔑 API Key found (length: $KEY_LENGTH characters)"
    
    # Check if it's a placeholder
    if [[ "$EXPO_PUBLIC_SUPABASE_ANON_KEY" == *"8reL_cezmplpYPP8Zjb2KA_rr3SAysF"* ]]; then
        echo "⚠️  WARNING: Using placeholder/example API key"
        echo "   This key appears to be incomplete or a placeholder"
    elif [ $KEY_LENGTH -lt 100 ]; then
        echo "⚠️  WARNING: API key seems too short (typical keys are 100+ chars)"
    else
        echo "✅ API key length looks valid"
    fi
else
    echo "❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not found"
fi

echo ""

# Test basic connectivity
echo "🌐 Connectivity Test:"
echo "===================="

if [ -n "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "🔍 Testing Supabase endpoint..."
    
    # Test basic URL
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$EXPO_PUBLIC_SUPABASE_URL")
    echo "📡 Base URL response: HTTP $HTTP_CODE"
    
    # Test REST API endpoint
    if [ -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
        API_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
            "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/")
        echo "🔗 REST API response: HTTP $API_CODE"
        
        if [ "$API_CODE" = "401" ]; then
            echo "❌ Authentication failed - API key issues detected"
        elif [ "$API_CODE" = "200" ]; then
            echo "✅ Authentication successful"
        else
            echo "⚠️  Unexpected response code"
        fi
    fi
fi

echo ""

# Database schema check
echo "📋 Database Schema Information:"
echo "==============================="

if [ -f "backend/supabase/config/database.sql" ]; then
    echo "✅ Database schema found: backend/supabase/config/database.sql"
    
    # Count tables in schema
    TABLE_COUNT=$(grep -c "create table" backend/supabase/config/database.sql)
    echo "📊 Schema defines $TABLE_COUNT tables"
    
    # List key tables
    echo "🔑 Key tables defined:"
    grep "create table" backend/supabase/config/database.sql | sed 's/.*public\.\([^ ]*\).*/   • \1/' | head -10
else
    echo "❌ Database schema file not found"
fi

echo ""

# Check application models
echo "📱 Application Models:"
echo "====================="

MODEL_DIR="src/core/models"
if [ -d "$MODEL_DIR" ]; then
    echo "✅ Models directory found: $MODEL_DIR"
    MODEL_COUNT=$(find $MODEL_DIR -name "*.ts" | wc -l | tr -d ' ')
    echo "📁 Found $MODEL_COUNT TypeScript model files"
    
    echo "🏗️  Key models:"
    find $MODEL_DIR -name "*.ts" | sed 's|.*/||; s|\.ts||' | head -5 | while read model; do
        echo "   • $model"
    done
else
    echo "❌ Models directory not found"
fi

echo ""

# Check data services
echo "🔧 Data Services:"
echo "================="

SERVICES_DIR="src/core/services"
if [ -d "$SERVICES_DIR" ]; then
    echo "✅ Services directory found: $SERVICES_DIR"
    
    # Check for Supabase adapter
    if [ -f "$SERVICES_DIR/adapters/SupabaseAnimalAdapter.ts" ]; then
        echo "✅ SupabaseAnimalAdapter found"
    else
        echo "❌ SupabaseAnimalAdapter not found"
    fi
    
    # Check for journal services
    if find $SERVICES_DIR -name "*Journal*" | grep -q .; then
        echo "✅ Journal services found"
    else
        echo "❌ Journal services not found"
    fi
else
    echo "❌ Services directory not found"
fi

echo ""

# Status summary
echo "📊 Status Summary:"
echo "=================="

ISSUES=0

# Count issues
[ -z "$EXPO_PUBLIC_SUPABASE_URL" ] && ISSUES=$((ISSUES + 1))
[ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ] && ISSUES=$((ISSUES + 1))
[[ "$EXPO_PUBLIC_SUPABASE_ANON_KEY" == *"8reL_cezmplpYPP8Zjb2KA_rr3SAysF"* ]] && ISSUES=$((ISSUES + 1))

if [ $ISSUES -eq 0 ]; then
    echo "✅ Configuration appears valid"
    echo "🎯 Ready for database verification"
else
    echo "⚠️  $ISSUES configuration issue(s) detected"
    echo "🔧 Setup required before testing"
fi

echo ""

# Provide setup instructions
echo "📝 Setup Instructions:"
echo "======================"
echo ""
echo "1. 🌐 Get your Supabase credentials:"
echo "   • Go to https://supabase.com/dashboard"
echo "   • Select your project (ID: ${PROJECT_ID:-'unknown'})"
echo "   • Navigate to Settings > API"
echo ""
echo "2. 🔑 Update your .env file with:"
echo "   • Project URL (already set: ✅)"
echo "   • Fresh anon/public API key (⚠️  needs update)"
echo ""
echo "3. 🗄️  Ensure database is set up:"
echo "   • Run the SQL schema: backend/supabase/config/database.sql"
echo "   • Set up Row Level Security policies"
echo "   • Create initial user profiles"
echo ""
echo "4. 📱 Test integration:"
echo "   • Run the app and create test data"
echo "   • Use: npm start"
echo "   • Create animals and journal entries"
echo ""

if [[ "$EXPO_PUBLIC_SUPABASE_ANON_KEY" == *"8reL_cezmplpYPP8Zjb2KA_rr3SAysF"* ]]; then
    echo "⚠️  IMPORTANT: Your API key appears to be a placeholder"
    echo "   Replace it with your actual Supabase anon key from the dashboard"
fi

echo ""
echo "📋 Manual Verification:"
echo "======================="
echo ""
echo "After fixing configuration, you can manually verify by:"
echo ""
echo "1. 🌐 Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/${PROJECT_ID:-'YOUR_PROJECT_ID'}"
echo ""
echo "2. 📊 SQL Editor - Run this query:"
echo "   SELECT 'profiles' as table_name, count(*) from profiles"
echo "   UNION SELECT 'animals', count(*) from animals"
echo "   UNION SELECT 'journal_entries', count(*) from journal_entries;"
echo ""
echo "3. 📱 Test app functionality:"
echo "   • Create user profile"
echo "   • Add animals"
echo "   • Create journal entries"
echo "   • Verify data appears in dashboard"
echo ""

echo "🏁 Configuration check complete!"
echo "================================"
echo ""

if [ $ISSUES -gt 0 ]; then
    echo "⚠️  Please address the configuration issues above before proceeding"
    exit 1
else
    echo "✅ Configuration looks good - ready for integration testing!"
    exit 0
fi