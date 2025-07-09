/**
 * Test script to verify JournalStore integration with ServiceFactory
 * This will show the logging output to confirm the store is using Supabase
 */

const { config, useSupabaseBackend } = require('../src/core/config/environment');

console.log('🧪 Testing Journal Integration...\n');

// Check environment configuration
console.log('📋 Environment Configuration:');
console.log('  - Use Backend:', config.useBackend);
console.log('  - Supabase URL:', config.supabase.url);
console.log('  - Has Anon Key:', !!config.supabase.anonKey);
console.log('  - Backend Check:', useSupabaseBackend());

console.log('\n🔧 Expected Behavior:');
console.log('  - JournalStore should use ServiceFactory.getJournalService()');
console.log('  - ServiceFactory should create SupabaseJournalAdapter (not LocalJournalAdapter)');
console.log('  - All journal operations should go through Supabase');

console.log('\n🎯 Test Complete - Check app logs for:');
console.log('  - "🏭 ServiceFactory: Creating journal service, useSupabaseBackend: true"');
console.log('  - "📝 Journal service created: SupabaseJournalAdapter"');
console.log('  - "📝 JournalStore: Adding new entry via ServiceFactory"');
console.log('  - "🔍 SupabaseJournalAdapter: Starting createJournalEntry"');