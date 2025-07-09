#!/bin/bash

echo "🔍 Debug: ShowTrackAI Integration Issue"
echo "======================================="
echo ""

# Load env
source .env

echo "📊 Testing different API endpoints..."
echo ""

# Test basic connectivity
echo "1. Basic API connectivity:"
curl -s -w "HTTP %{http_code}\n" -o /dev/null \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/"

echo ""

# Test profiles table
echo "2. Profiles table access:"
PROFILES_RESULT=$(curl -s -w "HTTP %{http_code}" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=*&limit=5")

echo "$PROFILES_RESULT"
echo ""

# Test animals table
echo "3. Animals table access:"
ANIMALS_RESULT=$(curl -s -w "HTTP %{http_code}" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/animals?select=*&limit=5")

echo "$ANIMALS_RESULT"
echo ""

# Test journal_entries table  
echo "4. Journal entries table access:"
JOURNAL_RESULT=$(curl -s -w "HTTP %{http_code}" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/journal_entries?select=*&limit=5")

echo "$JOURNAL_RESULT"
echo ""

echo "🔧 Possible Issues:"
echo "=================="
echo "1. Database tables may not exist yet"
echo "2. Row Level Security (RLS) may be blocking access"
echo "3. App may not be saving to Supabase (using local storage instead)"
echo "4. Authentication context issues"
echo ""

echo "💡 Solutions to try:"
echo "==================="
echo "1. Check Supabase Dashboard > Table Editor"
echo "2. Verify database schema is applied"
echo "3. Check RLS policies"
echo "4. Verify app is using Supabase adapter (not mock data)"
echo ""